'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');
const cfg = require('./config');
const { spawnClaude, killTree } = require('./cli');
const { Usage } = require('./usage');
const { Account } = require('./account');

// Escape sequences the CLI may colour or move the cursor with.
const ANSI = /\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g;
const samePath = (a, b) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
const inside = (child, parent) => {
  const r = path.relative(path.resolve(parent), path.resolve(child));
  return !!r && !r.startsWith('..') && !path.isAbsolute(r);
};
const fail = (status, message) => Object.assign(new Error(message), { status });

/**
 * Claude accounts, one config folder each (CLAUDE_CONFIG_DIR). Every folder keeps its own login,
 * so several accounts stay signed in side by side. The first profile is the folder Claude Code
 * uses by default; it runs with the environment untouched, because pointing CLAUDE_CONFIG_DIR at
 * it would move the CLI's global config file. The active profile is the one board prompts use
 * unless the composer picks another; terminals are not affected.
 */
class Profiles extends EventEmitter {
  constructor() {
    super();
    this.list = [];
    this.active = 'default';
    this.rt = new Map(); // id -> { usage, account, login, child }
    this.load();
  }

  load() {
    let j = {};
    try {
      j = JSON.parse(fs.readFileSync(cfg.PROFILES_FILE, 'utf8')) || {};
    } catch {}
    const saved = Array.isArray(j.profiles) ? j.profiles : [];
    const def = saved.find((p) => p && p.id === 'default');
    this.list = [{ id: 'default', name: (def && def.name) || 'Utama', dir: cfg.CLAUDE_DIR, isDefault: true }];
    for (const p of saved) {
      if (!p || !p.id || p.id === 'default' || !p.dir || !path.isAbsolute(p.dir)) continue;
      if (this.list.some((x) => samePath(x.dir, p.dir))) continue;
      this.list.push({ id: String(p.id), name: String(p.name || 'Akun').slice(0, 40), dir: path.resolve(p.dir), isDefault: false });
    }
    this.active = this.list.some((p) => p.id === j.active) ? j.active : 'default';
    for (const p of this.list) this.runtime(p);
  }

  save() {
    try {
      fs.mkdirSync(cfg.DATA_DIR, { recursive: true });
      const out = { active: this.active, profiles: this.list.map(({ id, name, dir }) => ({ id, name, dir })) };
      const tmp = cfg.PROFILES_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(out, null, 2));
      fs.renameSync(tmp, cfg.PROFILES_FILE);
    } catch (e) {
      console.error('[profiles] save failed:', e.message);
    }
  }

  runtime(p) {
    let r = this.rt.get(p.id);
    if (r) return r;
    const env = this.env(p.id);
    r = { usage: new Usage(env), account: new Account(env), login: null, child: null };
    r.usage.on('change', () => this.emit('change', { id: p.id, kind: 'usage' }));
    r.account.on('change', ({ switched }) => {
      // Limits belong to the account: ask again after a new login, and once a login is known.
      const a = r.account.state.data;
      if (switched || (!r.usage.state.fetchedAt && (!a || a.loggedIn))) r.usage.refresh();
      this.emit('change', { id: p.id, kind: 'account' });
    });
    this.rt.set(p.id, r);
    return r;
  }

  get(id) {
    return this.list.find((p) => p.id === id) || null;
  }

  /** The environment the CLI runs with for a profile; undefined inherits the kanban's own. */
  env(id) {
    const p = this.get(id);
    if (!p || p.isDefault) return undefined;
    return { ...process.env, CLAUDE_CONFIG_DIR: p.dir };
  }

  roots() {
    return this.list.map((p) => ({ id: p.id, dir: p.dir }));
  }

  /** Why a profile can't run prompts right now, or null. An unknown login state is given the benefit of the doubt. */
  problem(id) {
    const p = this.get(id);
    if (!p) return 'Akun itu tidak ada lagi di kanban.';
    const a = this.rt.get(id).account.state.data;
    if (a && !a.loggedIn) return `Akun "${p.name}" belum login. Login dulu lewat menu Akun.`;
    return null;
  }

  refreshUsage(id, maxAge = 0) {
    const r = this.rt.get(id);
    if (!r) return;
    const a = r.account.state.data;
    if (a && !a.loggedIn) return;
    if (Date.now() - r.usage.state.fetchedAt < maxAge) return;
    r.usage.refresh();
  }

  start() {
    for (const p of this.list) this.rt.get(p.id).account.refresh();
  }

  // Keeps every account reasonably fresh; the active one most of all.
  ensureFresh(slack = 0) {
    for (const p of this.list) {
      this.rt.get(p.id).account.ensureFresh();
      this.refreshUsage(p.id, (p.id === this.active ? cfg.USAGE_REFRESH_MS : cfg.OTHER_USAGE_REFRESH_MS) - slack);
    }
  }

  refreshAll() {
    for (const p of this.list) {
      this.rt.get(p.id).account.refresh();
      this.refreshUsage(p.id);
    }
  }

  add({ name, dir }) {
    name = String(name || '').trim().slice(0, 40);
    dir = String(dir || '').trim();
    if (!name) throw fail(400, 'Nama akun masih kosong.');
    if (!dir || !path.isAbsolute(dir)) throw fail(400, 'Folder harus berupa path lengkap, misalnya C:\\Users\\kamu\\.claude-kerja.');
    dir = path.resolve(dir);
    if (this.list.length >= cfg.MAX_PROFILES) throw fail(400, `Maksimal ${cfg.MAX_PROFILES} akun.`);
    for (const p of this.list) {
      if (samePath(p.dir, dir)) throw fail(409, `Folder ini sudah dipakai akun "${p.name}".`);
      if (inside(dir, p.dir) || inside(p.dir, dir)) throw fail(400, `Folder tidak boleh berada di dalam, atau berisi, folder akun "${p.name}".`);
    }
    let st = null;
    try {
      st = fs.statSync(dir);
    } catch {}
    if (st && !st.isDirectory()) throw fail(400, 'Path itu sebuah file, bukan folder.');
    if (!st) {
      try {
        fs.mkdirSync(dir);
      } catch (e) {
        throw fail(400, `Folder tidak bisa dibuat: ${e.message}`);
      }
    }
    const p = { id: 'p' + crypto.randomBytes(4).toString('hex'), name, dir, isDefault: false };
    this.list.push(p);
    this.save();
    this.runtime(p).account.refresh();
    this.emit('change', { id: p.id, kind: 'list' });
    return p;
  }

  /** Forgets a profile. Its folder, login and transcripts stay on disk. */
  remove(id) {
    const p = this.get(id);
    if (!p) throw fail(404, 'Akun tidak ditemukan.');
    if (p.isDefault) throw fail(400, 'Akun utama tidak bisa dihapus.');
    const r = this.rt.get(id);
    if (r.child) killTree(r.child);
    this.list = this.list.filter((x) => x !== p);
    this.rt.delete(id);
    if (this.active === id) this.active = 'default';
    this.save();
    this.emit('change', { id, kind: 'list' });
  }

  setActive(id) {
    if (!this.get(id)) throw fail(404, 'Akun tidak ditemukan.');
    this.active = id;
    this.save();
    this.refreshUsage(id, cfg.USAGE_REFRESH_MS);
    this.emit('change', { id, kind: 'list' });
  }

  /**
   * Starts `claude auth login` for a profile. The CLI opens the browser on this PC; its output
   * (including the sign-in link) is kept so the page can show it, and a code the CLI asks for
   * can be passed back with loginInput.
   */
  login(id) {
    const p = this.get(id);
    if (!p) throw fail(404, 'Akun tidak ditemukan.');
    const r = this.rt.get(id);
    if (r.child) return r.login;
    const a = r.account.state.data;
    if (a && a.loggedIn) throw fail(409, 'Akun ini sudah login.');
    let child;
    try {
      child = spawnClaude(['auth', 'login', '--claudeai'], { cwd: os.tmpdir(), env: this.env(id) });
    } catch (e) {
      throw fail(500, e.message);
    }
    r.child = child;
    const login = (r.login = { running: true, startedAt: Date.now(), endedAt: 0, lines: [], url: null, ok: null, error: null });
    const onData = (d) => {
      for (const raw of String(d).replace(ANSI, '').split(/\r?\n|\r/)) {
        const line = raw.trim();
        if (!line) continue;
        login.lines.push(line.slice(0, 500));
        if (login.lines.length > 30) login.lines.shift();
        const m = !login.url && line.match(/https:\/\/[^\s"'<>]+/);
        if (m) login.url = m[0].replace(/[).,]+$/, '');
      }
      this.emit('change', { id, kind: 'login' });
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.stdin.on('error', () => {});
    const timer = setTimeout(() => {
      login.error = 'Login dibatalkan karena tidak selesai dalam 10 menit.';
      killTree(child);
    }, cfg.LOGIN_TIMEOUT_MS);
    child.on('error', (e) => { login.error = e.code === 'ENOENT' ? 'Claude CLI tidak ditemukan di PATH.' : e.message; });
    child.on('exit', (code) => {
      clearTimeout(timer);
      if (r.child === child) r.child = null;
      login.running = false;
      login.endedAt = Date.now();
      login.ok = code === 0 && !login.error;
      if (!login.ok && !login.error) login.error = `claude auth login berhenti (kode ${code}).`;
      r.account.refresh();
      this.emit('change', { id, kind: 'login' });
    });
    this.emit('change', { id, kind: 'login' });
    return login;
  }

  loginInput(id, text) {
    const r = this.rt.get(id);
    if (!r || !r.child) return false;
    r.child.stdin.write(String(text).trim().slice(0, 4000) + '\n');
    r.login.lines.push('› kode dikirim ke Claude CLI');
    this.emit('change', { id, kind: 'login' });
    return true;
  }

  loginCancel(id) {
    const r = this.rt.get(id);
    if (!r || !r.child) return false;
    r.login.error = 'Login dibatalkan.';
    killTree(r.child);
    return true;
  }

  activeState() {
    return this.rt.get(this.active);
  }

  snapshot() {
    return this.list.map((p) => {
      const r = this.rt.get(p.id);
      return {
        id: p.id,
        name: p.name,
        dir: p.dir,
        isDefault: p.isDefault,
        active: p.id === this.active,
        account: r.account.snapshot(),
        usage: r.usage.snapshot(),
        login: r.login,
      };
    });
  }
}

module.exports = { Profiles };
