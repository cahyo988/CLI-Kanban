'use strict';
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const cfg = require('./config');
const { readFrom } = require('./jsonl');
const { newState, apply } = require('./sessionParser');

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function listDir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function pidAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
}

// Worktrees live under <repo>/.claude/worktrees/<name>; they belong to the repo's project.
function projectKeyOf(cwd) {
  if (!cwd) return null;
  let p = String(cwd).replace(/\//g, '\\').replace(/\\+$/, '');
  p = p.replace(/\\\.claude\\worktrees\\[^\\]+.*$/i, '');
  return p.toLowerCase();
}

function stripWorktree(cwd) {
  return String(cwd).replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+.*$/i, '');
}

class Collector extends EventEmitter {
  /** roots: () => [{ id, dir }], the Claude config folders to read (one per account profile). */
  constructor(roots = () => [{ id: 'default', dir: cfg.CLAUDE_DIR }]) {
    super();
    this.roots = roots;
    this.watchers = new Map(); // watched dir -> fs.FSWatcher
    this.files = new Map(); // abs path -> { offset, size, mtimeMs, state, kind, sessionId, agentId, dir }
    this.metas = new Map(); // subagent meta path -> { mtimeMs, data }
    this.live = new Map(); // sessionId -> live info
    this.jobs = new Map(); // sessionId -> job state
    this.version = 0;
    this.dirtyCache = false;
    this.scanning = false;
    this.pendingScan = false;
  }

  loadCache() {
    const c = readJson(cfg.CACHE_FILE);
    if (!c || c.version !== cfg.CACHE_VERSION || !c.files) return;
    for (const [file, entry] of Object.entries(c.files)) this.files.set(file, entry);
  }

  saveCache() {
    if (!this.dirtyCache) return;
    try {
      fs.mkdirSync(cfg.DATA_DIR, { recursive: true });
      const out = { version: cfg.CACHE_VERSION, savedAt: Date.now(), files: Object.fromEntries(this.files) };
      const tmp = cfg.CACHE_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(out));
      fs.renameSync(tmp, cfg.CACHE_FILE);
      this.dirtyCache = false;
    } catch (e) {
      console.error('[cache] save failed:', e.message);
    }
  }

  discover() {
    const found = [];
    for (const root of this.roots()) {
      const projectsDir = path.join(root.dir, 'projects');
      const profile = root.id;
      for (const proj of listDir(projectsDir)) {
        if (!proj.isDirectory()) continue;
        const pdir = path.join(projectsDir, proj.name);
        for (const ent of listDir(pdir)) {
          if (ent.isFile() && ent.name.endsWith('.jsonl')) {
            found.push({ file: path.join(pdir, ent.name), kind: 'session', sessionId: ent.name.slice(0, -6), dir: proj.name, profile });
          } else if (ent.isDirectory() && /^[0-9a-f-]{36}$/.test(ent.name)) {
            const sdir = path.join(pdir, ent.name, 'subagents');
            for (const s of listDir(sdir)) {
              const m = s.isFile() && s.name.match(/^agent-([0-9a-z]+)\.jsonl$/);
              if (m) found.push({ file: path.join(sdir, s.name), kind: 'agent', sessionId: ent.name, agentId: m[1], dir: proj.name, profile });
            }
          }
        }
      }
    }
    return found;
  }

  // Reads whatever was appended to each transcript since the last pass. Returns true if any changed.
  scanFiles() {
    let changed = false;
    const seen = new Set();
    for (const d of this.discover()) {
      seen.add(d.file);
      let st;
      try {
        st = fs.statSync(d.file);
      } catch {
        continue;
      }
      let entry = this.files.get(d.file);
      if (entry) entry.profile = d.profile;
      if (entry && st.size === entry.size && st.mtimeMs === entry.mtimeMs) continue;
      if (!entry || st.size < entry.offset) {
        entry = { ...d, offset: 0, size: 0, mtimeMs: 0, state: newState(d.kind === 'agent' ? d.agentId : d.sessionId) };
      }
      const state = entry.state;
      entry.offset = readFrom(d.file, entry.offset, (rec) => apply(state, rec));
      entry.size = st.size;
      entry.mtimeMs = st.mtimeMs;
      this.files.set(d.file, entry);
      if (d.kind === 'agent') this.readMeta(d.file);
      changed = true;
    }
    for (const f of [...this.files.keys()]) {
      if (!seen.has(f)) {
        this.files.delete(f);
        changed = true;
      }
    }
    if (changed) this.dirtyCache = true;
    return changed;
  }

  readMeta(agentFile) {
    const mf = agentFile.replace(/\.jsonl$/, '.meta.json');
    let st;
    try {
      st = fs.statSync(mf);
    } catch {
      return null;
    }
    const cur = this.metas.get(mf);
    if (cur && cur.mtimeMs === st.mtimeMs) return cur.data;
    const data = readJson(mf);
    this.metas.set(mf, { mtimeMs: st.mtimeMs, data });
    return data;
  }

  // Live processes come from ~/.claude/sessions/<pid>.json; background daemon jobs from jobs/*/state.json.
  scanLive() {
    const live = new Map();
    const jobs = new Map();
    for (const root of this.roots()) this.scanLiveRoot(root, live, jobs);
    const sig = (m) => JSON.stringify([...m.entries()]);
    const changed = sig(live) !== sig(this.live) || sig(jobs) !== sig(this.jobs);
    this.live = live;
    this.jobs = jobs;
    return changed;
  }

  scanLiveRoot(root, live, jobs) {
    const sessionsDir = path.join(root.dir, 'sessions');
    const jobsDir = path.join(root.dir, 'jobs');
    for (const ent of listDir(sessionsDir)) {
      if (!ent.isFile() || !/^\d+\.json$/.test(ent.name)) continue;
      const j = readJson(path.join(sessionsDir, ent.name));
      if (!j || !j.sessionId || !pidAlive(j.pid)) continue;
      live.set(j.sessionId, {
        profile: root.id,
        pid: j.pid,
        status: j.status || 'unknown',
        name: j.name || null,
        kind: j.kind || null,
        entrypoint: j.entrypoint || null,
        cwd: j.cwd || null,
        startedAt: j.startedAt || 0,
        updatedAt: j.statusUpdatedAt || j.updatedAt || 0,
        version: j.version || null,
      });
    }
    for (const ent of listDir(jobsDir)) {
      if (!ent.isDirectory()) continue;
      const j = readJson(path.join(jobsDir, ent.name, 'state.json'));
      if (!j || !j.sessionId) continue;
      jobs.set(j.sessionId, {
        state: j.state,
        detail: j.detail || null,
        intent: j.intent || null,
        tempo: j.tempo || null,
        result: j.output && j.output.result ? String(j.output.result).slice(0, 500) : null,
        updatedAt: Date.parse(j.updatedAt) || 0,
      });
    }
  }

  refresh(reason) {
    if (this.scanning) {
      this.pendingScan = true;
      return;
    }
    this.scanning = true;
    try {
      const t0 = Date.now();
      const a = this.scanFiles();
      const b = this.scanLive();
      if (a || b) {
        this.version++;
        this.emit('update', { version: this.version, reason });
      }
      const ms = Date.now() - t0;
      if (ms > 1500) console.log(`[scan] ${reason}: ${ms}ms`);
    } finally {
      this.scanning = false;
    }
    if (this.pendingScan) {
      this.pendingScan = false;
      setImmediate(() => this.refresh('queued'));
    }
  }

  start() {
    this.loadCache();
    const t0 = Date.now();
    this.refresh('startup');
    console.log(`[scan] ${this.files.size} transcripts indexed in ${Date.now() - t0}ms`);
    this.saveCache();

    this.rewatch();
    // Process exits don't always touch a file, and fs.watch can miss events; poll as a fallback.
    // The poll also picks up folders that a new account's CLI has only just created.
    setInterval(() => {
      this.rewatch();
      this.refresh('poll');
    }, 5000).unref();
    setInterval(() => this.saveCache(), 30000).unref();
  }

  /** Watches each profile's projects/sessions/jobs folders; call again when the profiles change. */
  rewatch() {
    const want = new Set();
    for (const root of this.roots()) for (const sub of ['projects', 'sessions', 'jobs']) want.add(path.join(root.dir, sub));
    for (const [dir, w] of this.watchers) {
      if (want.has(dir)) continue;
      w.close();
      this.watchers.delete(dir);
    }
    for (const dir of want) {
      if (this.watchers.has(dir) || !fs.existsSync(dir)) continue;
      try {
        const w = fs.watch(dir, { recursive: true }, (_e, name) => {
          if (name && /tool-results|memory[\\/]|\.tmp$/.test(name)) return;
          clearTimeout(this.watchTimer);
          this.watchTimer = setTimeout(() => this.refresh('watch'), 400);
        });
        w.on('error', () => {
          w.close();
          this.watchers.delete(dir);
        });
        this.watchers.set(dir, w);
      } catch (e) {
        console.warn(`[watch] cannot watch ${dir}: ${e.message}`);
      }
    }
  }

  snapshot() {
    const sessions = new Map();
    const agentFiles = [];
    for (const e of this.files.values()) {
      if (e.kind === 'session') sessions.set(e.sessionId, { entry: e, subagents: [] });
      else agentFiles.push(e);
    }
    for (const e of agentFiles) {
      const s = sessions.get(e.sessionId);
      if (!s) continue;
      const meta = this.readMeta(e.file) || {};
      s.subagents.push({ entry: e, meta });
    }
    return { sessions, live: this.live, jobs: this.jobs, version: this.version };
  }
}

module.exports = { Collector, projectKeyOf, stripWorktree };
