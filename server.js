'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const cfg = require('./lib/config');
const { Collector, projectKeyOf, stripWorktree } = require('./lib/collector');
const { overview, projectDetail } = require('./lib/model');
const { Profiles } = require('./lib/profiles');
const { Runner } = require('./lib/runner');
const { openTerminal } = require('./lib/terminal');

const profiles = new Profiles();
const collector = new Collector(() => profiles.roots());
const runner = new Runner({ profiles });
collector.start();

// Pages served by this server get the token; other sites can't read it, so they can't make
// the browser start Claude runs on this machine.
const TOKEN = crypto.randomBytes(24).toString('hex');
const HOSTS = new Set([`127.0.0.1:${cfg.PORT}`, `localhost:${cfg.PORT}`, `[::1]:${cfg.PORT}`, `${cfg.HOST}:${cfg.PORT}`.toLowerCase()]);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function sendJson(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function serveStatic(res, urlPath) {
  const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const file = path.normalize(path.join(cfg.PUBLIC_DIR, rel));
  if (!file.startsWith(cfg.PUBLIC_DIR)) return sendJson(res, 403, { error: 'forbidden' });
  fs.readFile(file, (err, data) => {
    if (err) return sendJson(res, 404, { error: 'not found' });
    const type = MIME[path.extname(file)] || 'application/octet-stream';
    if (path.basename(file) === 'index.html') data = Buffer.from(data.toString('utf8').replace('__KANBAN_TOKEN__', TOKEN));
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
    res.end(data);
  });
}

function readBody(req, limit = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error('Body terlalu besar'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(Object.assign(new Error('JSON tidak valid'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

function writeAllowed(req) {
  const origin = String(req.headers.origin || '').toLowerCase().replace(/^https?:\/\//, '');
  return HOSTS.has(origin)
    && req.headers['x-kanban-token'] === TOKEN
    && /application\/json/.test(String(req.headers['content-type'] || ''));
}

function snapshot() {
  const snap = collector.snapshot();
  snap.runs = runner.snapshot();
  return snap;
}

/* ---------- SSE ---------- */
const clients = new Set();
let pushVersion = 0;
function push(reason) {
  const msg = `event: update\ndata: ${JSON.stringify({ version: ++pushVersion, reason })}\n\n`;
  for (const res of clients) res.write(msg);
}
collector.on('update', () => push('watch'));
runner.on('change', (run) => {
  push('runs');
  // A finished run moved its account's usage meter; ask again.
  if (run && run.endedAt) setTimeout(() => profiles.refreshUsage(run.profileId || 'default'), 1500);
});
profiles.on('change', ({ kind }) => {
  push(kind);
  if (kind === 'list') {
    collector.rewatch();
    collector.refresh('profiles');
  }
});
setInterval(() => { for (const res of clients) res.write(': ping\n\n'); }, 25000).unref();
setInterval(() => { if (clients.size) profiles.ensureFresh(5000); }, cfg.USAGE_REFRESH_MS).unref();
profiles.start();

/* ---------- prompts from the board ---------- */
function projectPath(snap, key) {
  let best = null;
  for (const s of snap.sessions.values()) {
    const cwd = s.entry.state.cwd;
    if (!cwd || projectKeyOf(cwd) !== key) continue;
    if (!best || s.entry.state.lastTs > best.lastTs) best = { cwd: stripWorktree(cwd), lastTs: s.entry.state.lastTs };
  }
  return best && best.cwd;
}

function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

async function handlePrompt(req, res) {
  const body = await readBody(req);
  const prompt = String(body.prompt || '').trim();
  if (!prompt) return sendJson(res, 400, { error: 'Prompt masih kosong.' });
  if (prompt.length > cfg.MAX_PROMPT_CHARS) return sendJson(res, 400, { error: `Prompt terlalu panjang (maks ${cfg.MAX_PROMPT_CHARS} karakter).` });
  const permissionMode = String(body.permissionMode || 'auto');
  if (!cfg.PERMISSION_MODES.includes(permissionMode)) return sendJson(res, 400, { error: 'Mode izin tidak dikenal.' });
  const model = String(body.model || '');
  if (!cfg.MODELS.includes(model)) return sendJson(res, 400, { error: 'Model tidak dikenal.' });

  const wantProfile = body.profileId ? String(body.profileId) : null;
  const snap = snapshot();
  if (body.sessionId) {
    const sid = String(body.sessionId);
    const s = snap.sessions.get(sid);
    if (!s) return sendJson(res, 404, { error: 'Sesi tidak ditemukan.' });
    const cwd = s.entry.state.cwd;
    if (!cwd || !isDir(cwd)) return sendJson(res, 400, { error: `Folder sesi tidak ditemukan: ${cwd || '?'}` });
    const fork = !!body.fork;
    // A session open in a terminal (or the daemon) can't be continued by a second process;
    // only a branch of it can.
    if (snap.live.has(sid) && !runner.activeRun(sid) && !fork) {
      return sendJson(res, 409, { error: 'Sesi ini sedang terbuka di terminal. Kirim sebagai cabang (fork), atau tutup dulu sesinya.', code: 'live' });
    }
    // A session's transcript lives in its account's folder, so only that account can continue it.
    const profileId = s.entry.profile || 'default';
    if (wantProfile && wantProfile !== profileId) {
      const owner = profiles.get(profileId);
      return sendJson(res, 400, { error: `Sesi ini milik akun "${owner ? owner.name : profileId}". Lanjutan sesi harus memakai akun yang sama; untuk akun lain, mulai sesi baru.` });
    }
    const problem = profiles.problem(profileId);
    if (problem) return sendJson(res, 400, { error: problem });
    const st = s.entry.state;
    const out = runner.submit({
      cwd, projectKey: projectKeyOf(cwd), prompt, target: sid, fork, permissionMode, model, profileId,
      targetTitle: st.title || st.agentName || 'Sesi ' + sid.slice(0, 8),
    });
    return sendJson(res, 200, { ok: true, queued: out.queued, id: out.queued ? out.item.id : out.run.id });
  }
  const key = String(body.projectKey || '');
  const cwd = projectPath(snap, key);
  if (!cwd) return sendJson(res, 404, { error: 'Project tidak ditemukan.' });
  if (!isDir(cwd)) return sendJson(res, 400, { error: `Folder project tidak ditemukan: ${cwd}` });
  const profileId = wantProfile || profiles.active;
  const problem = profiles.problem(profileId);
  if (problem) return sendJson(res, 400, { error: problem });
  const out = runner.submit({ cwd, projectKey: key, prompt, target: null, fork: false, permissionMode, model, profileId });
  return sendJson(res, 200, { ok: true, queued: false, id: out.run.id });
}

/* ---------- open a terminal on a project's latest session ---------- */
async function handleTerminal(req, res) {
  const body = await readBody(req);
  if (process.platform !== 'win32') return sendJson(res, 501, { error: 'Membuka terminal baru hanya didukung di Windows.' });
  const key = String(body.projectKey || '');
  const clicked = body.sessionId ? String(body.sessionId) : null;
  const snap = snapshot();
  const sessions = [...snap.sessions.entries()]
    .filter(([, s]) => s.entry.state.cwd && projectKeyOf(s.entry.state.cwd) === key)
    .sort((a, b) => b[1].entry.state.lastTs - a[1].entry.state.lastTs);
  if (!sessions.length) return sendJson(res, 404, { error: 'Project tidak ditemukan.' });
  const name = path.basename(stripWorktree(sessions[0][1].entry.state.cwd));
  // A session still open in a terminal (or run by the board) can't take a second process,
  // so resume the newest one that is free.
  const busy = (sid) => snap.live.has(sid) || !!runner.activeRun(sid);
  const target = sessions.find(([sid, s]) => !busy(sid) && s.entry.state.prompts.length && isDir(s.entry.state.cwd));
  const skipped = !!(clicked && busy(clicked));
  if (target) {
    const [sid, s] = target;
    const profileId = s.entry.profile || 'default';
    const prof = profiles.get(profileId);
    if (!prof) return sendJson(res, 400, { error: 'Akun pemilik sesi ini tidak ada lagi di kanban.' });
    const title = s.entry.state.title || s.entry.state.agentName || 'Sesi ' + sid.slice(0, 8);
    const via = openTerminal({
      cwd: s.entry.state.cwd, args: ['--resume', sid], configDir: prof.isDefault ? null : prof.dir,
      title: `Claude · ${name}`, banner: `Melanjutkan sesi: ${title}`,
    });
    return sendJson(res, 200, { ok: true, mode: 'resume', sessionId: sid, title, skipped, via });
  }
  const cwd = projectPath(snap, key);
  if (!cwd || !isDir(cwd)) return sendJson(res, 400, { error: `Folder project tidak ditemukan: ${cwd || '?'}` });
  const prof = profiles.get(profiles.active);
  const via = openTerminal({ cwd, configDir: prof && !prof.isDefault ? prof.dir : null, title: `Claude · ${name}`, banner: 'Sesi baru: belum ada sesi project ini yang bisa dilanjutkan.' });
  return sendJson(res, 200, { ok: true, mode: 'new', skipped, via });
}

/* ---------- account profiles ---------- */
async function handleProfiles(action, req, res) {
  const body = await readBody(req);
  const id = String(body.id || '');
  switch (action) {
    case 'add': {
      const p = profiles.add({ name: body.name, dir: body.dir });
      return sendJson(res, 200, { ok: true, id: p.id });
    }
    case 'remove':
      profiles.remove(id);
      return sendJson(res, 200, { ok: true });
    case 'active':
      profiles.setActive(id);
      return sendJson(res, 200, { ok: true });
    case 'login':
      profiles.login(id);
      return sendJson(res, 200, { ok: true });
    case 'login-input':
      return profiles.loginInput(id, String(body.text || '')) ? sendJson(res, 200, { ok: true }) : sendJson(res, 409, { error: 'Tidak ada login yang sedang berjalan.' });
    case 'login-cancel':
      return profiles.loginCancel(id) ? sendJson(res, 200, { ok: true }) : sendJson(res, 409, { error: 'Tidak ada login yang sedang berjalan.' });
    default:
      return sendJson(res, 404, { error: 'not found' });
  }
}

/* ---------- routes ---------- */
const server = http.createServer(async (req, res) => {
  // Reject other hostnames so a DNS-rebinding page can't read transcripts through this server.
  if (!HOSTS.has(String(req.headers.host || '').toLowerCase())) return sendJson(res, 421, { error: 'host not allowed' });
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'POST') {
      if (!writeAllowed(req)) return sendJson(res, 403, { error: 'Permintaan ditolak. Muat ulang halaman kanban.', code: 'token' });
      if (url.pathname === '/api/prompt') return await handlePrompt(req, res);
      if (url.pathname === '/api/terminal') return await handleTerminal(req, res);
      if (url.pathname === '/api/queue/cancel') {
        const body = await readBody(req);
        return sendJson(res, runner.cancelQueued(String(body.id || '')) ? 200 : 404, { ok: true });
      }
      if (url.pathname === '/api/runs/stop') {
        const body = await readBody(req);
        return sendJson(res, runner.stop(String(body.id || '')) ? 200 : 404, { ok: true });
      }
      if (url.pathname === '/api/usage/refresh') {
        profiles.refreshAll();
        return sendJson(res, 202, { ok: true });
      }
      if (url.pathname.startsWith('/api/profiles/')) return await handleProfiles(url.pathname.slice('/api/profiles/'.length), req, res);
      return sendJson(res, 404, { error: 'not found' });
    }
    if (req.method !== 'GET') return sendJson(res, 405, { error: 'method not allowed' });
    if (url.pathname === '/api/overview') {
      profiles.ensureFresh();
      const act = profiles.activeState();
      return sendJson(res, 200, overview(snapshot(), { usage: act.usage.snapshot(), account: act.account.snapshot(), profiles: profiles.snapshot(), home: os.homedir() }));
    }
    if (url.pathname === '/api/project') {
      const detail = projectDetail(snapshot(), url.searchParams.get('key') || '');
      return detail ? sendJson(res, 200, detail) : sendJson(res, 404, { error: 'project not found' });
    }
    if (url.pathname === '/api/usage') return sendJson(res, 200, profiles.activeState().usage.snapshot());
    if (url.pathname === '/api/account') return sendJson(res, 200, profiles.activeState().account.snapshot());
    if (url.pathname === '/api/profiles') return sendJson(res, 200, { active: profiles.active, profiles: profiles.snapshot() });
    if (url.pathname === '/api/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
      res.write(`event: hello\ndata: ${JSON.stringify({ version: pushVersion })}\n\n`);
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    return serveStatic(res, url.pathname);
  } catch (e) {
    if (!e.status) console.error(e);
    return sendJson(res, e.status || 500, { error: e.message });
  }
});

server.listen(cfg.PORT, cfg.HOST, () => {
  console.log(`ClaudeKanban → http://${cfg.HOST}:${cfg.PORT}`);
});

function shutdown() {
  collector.dirtyCache = true;
  collector.saveCache();
  runner.save();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
