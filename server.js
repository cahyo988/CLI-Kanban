'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cfg = require('./lib/config');
const { Collector, projectKeyOf, stripWorktree } = require('./lib/collector');
const { overview, projectDetail } = require('./lib/model');
const { Usage } = require('./lib/usage');
const { Runner } = require('./lib/runner');

const collector = new Collector();
const usage = new Usage();
const runner = new Runner();
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
  // A finished run moved the usage meter; ask again.
  if (run && run.endedAt) setTimeout(() => usage.refresh(), 1500);
});
usage.on('change', () => push('usage'));
setInterval(() => { for (const res of clients) res.write(': ping\n\n'); }, 25000).unref();
setInterval(() => { if (clients.size) usage.refresh(); }, cfg.USAGE_REFRESH_MS).unref();
usage.refresh();

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
    const st = s.entry.state;
    const out = runner.submit({
      cwd, projectKey: projectKeyOf(cwd), prompt, target: sid, fork, permissionMode, model,
      targetTitle: st.title || st.agentName || 'Sesi ' + sid.slice(0, 8),
    });
    return sendJson(res, 200, { ok: true, queued: out.queued, id: out.queued ? out.item.id : out.run.id });
  }
  const key = String(body.projectKey || '');
  const cwd = projectPath(snap, key);
  if (!cwd) return sendJson(res, 404, { error: 'Project tidak ditemukan.' });
  if (!isDir(cwd)) return sendJson(res, 400, { error: `Folder project tidak ditemukan: ${cwd}` });
  const out = runner.submit({ cwd, projectKey: key, prompt, target: null, fork: false, permissionMode, model });
  return sendJson(res, 200, { ok: true, queued: false, id: out.run.id });
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
      if (url.pathname === '/api/queue/cancel') {
        const body = await readBody(req);
        return sendJson(res, runner.cancelQueued(String(body.id || '')) ? 200 : 404, { ok: true });
      }
      if (url.pathname === '/api/runs/stop') {
        const body = await readBody(req);
        return sendJson(res, runner.stop(String(body.id || '')) ? 200 : 404, { ok: true });
      }
      if (url.pathname === '/api/usage/refresh') {
        usage.refresh();
        return sendJson(res, 202, { ok: true });
      }
      return sendJson(res, 404, { error: 'not found' });
    }
    if (req.method !== 'GET') return sendJson(res, 405, { error: 'method not allowed' });
    if (url.pathname === '/api/overview') {
      usage.ensureFresh();
      return sendJson(res, 200, overview(snapshot(), { usage: usage.snapshot() }));
    }
    if (url.pathname === '/api/project') {
      const detail = projectDetail(snapshot(), url.searchParams.get('key') || '');
      return detail ? sendJson(res, 200, detail) : sendJson(res, 404, { error: 'project not found' });
    }
    if (url.pathname === '/api/usage') return sendJson(res, 200, usage.snapshot());
    if (url.pathname === '/api/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
      res.write(`event: hello\ndata: ${JSON.stringify({ version: pushVersion })}\n\n`);
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    return serveStatic(res, url.pathname);
  } catch (e) {
    console.error(e);
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
