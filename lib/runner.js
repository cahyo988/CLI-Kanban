'use strict';
const fs = require('fs');
const crypto = require('crypto');
const EventEmitter = require('events');
const cfg = require('./config');
const { spawnClaude, killTree } = require('./cli');

const MAX_RUNS = 200;
const ACTIVE = new Set(['starting', 'running']);
const clip = (s, n) => (s && s.length > n ? s.slice(0, n) + '…' : s || '');
const firstLine = (s) => clip((String(s).split('\n').find((l) => l.trim()) || '').trim(), 140);

/**
 * Prompts sent from the board run headless through the official CLI (`claude -p`), reading the
 * prompt from stdin so no shell quoting is involved. A run either starts a new session, continues
 * one (`--resume`), or branches from one that is open in a terminal (`--resume --fork-session`).
 * Prompts for a session the board is still running wait in a queue and start when it finishes.
 */
class Runner extends EventEmitter {
  constructor() {
    super();
    this.runs = [];
    this.queue = [];
    this.procs = new Map();
    this.load();
  }

  load() {
    try {
      const j = JSON.parse(fs.readFileSync(cfg.RUNS_FILE, 'utf8'));
      this.runs = Array.isArray(j.runs) ? j.runs : [];
      this.queue = Array.isArray(j.queue) ? j.queue : [];
    } catch {}
    // A run that was going when the server stopped can't be reattached.
    for (const r of this.runs) {
      if (ACTIVE.has(r.status)) {
        r.status = 'lost';
        r.endedAt = r.endedAt || Date.now();
        r.error = r.error || 'Server kanban berhenti saat prompt ini berjalan.';
      }
    }
  }

  save() {
    try {
      fs.mkdirSync(cfg.DATA_DIR, { recursive: true });
      const tmp = cfg.RUNS_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify({ runs: this.runs.slice(-MAX_RUNS), queue: this.queue }));
      fs.renameSync(tmp, cfg.RUNS_FILE);
    } catch (e) {
      console.error('[runner] save failed:', e.message);
    }
  }

  changed(run) {
    this.save();
    this.emit('change', run);
  }

  activeRun(sessionId) {
    return this.runs.find((r) => r.sessionId === sessionId && ACTIVE.has(r.status)) || null;
  }

  isManaged(sessionId) {
    return this.runs.some((r) => r.sessionId === sessionId);
  }

  /** item: { cwd, projectKey, prompt, target, fork, permissionMode, model, targetTitle } */
  submit(item) {
    const entry = { id: crypto.randomBytes(6).toString('hex'), createdAt: Date.now(), title: firstLine(item.prompt), ...item };
    if (entry.target && !entry.fork && this.activeRun(entry.target)) {
      this.queue.push(entry);
      this.changed();
      return { queued: true, item: entry };
    }
    return { queued: false, run: this.start(entry) };
  }

  start(item) {
    const args = ['-p', '--output-format', 'stream-json', '--verbose', '--permission-mode', item.permissionMode, '--permission-prompts', 'none'];
    if (item.model) args.push('--model', item.model);
    if (item.target) {
      args.push('--resume', item.target);
      if (item.fork) args.push('--fork-session');
    }
    const run = {
      ...item,
      status: 'starting',
      sessionId: item.target && !item.fork ? item.target : null,
      startedAt: Date.now(),
      endedAt: 0,
      pid: null,
      result: null,
      error: null,
      denials: 0,
      costUsd: null,
      turns: null,
    };
    this.runs.push(run);
    if (this.runs.length > MAX_RUNS * 1.5) this.runs = this.runs.slice(-MAX_RUNS);

    let child;
    try {
      child = spawnClaude(args, { cwd: item.cwd });
    } catch (e) {
      this.finish(run, 'error', e.message);
      return run;
    }
    run.pid = child.pid || null;
    this.procs.set(run.id, child);

    let out = '';
    let err = '';
    child.stdout.on('data', (d) => {
      out += d;
      let i;
      while ((i = out.indexOf('\n')) !== -1) {
        const line = out.slice(0, i).trim();
        out = out.slice(i + 1);
        if (line.startsWith('{')) this.onMessage(run, line);
      }
    });
    child.stderr.on('data', (d) => { err = clip(err + d, 4000); });
    child.on('error', (e) => this.finish(run, 'error', e.code === 'ENOENT' ? 'Claude CLI tidak ditemukan di PATH.' : e.message));
    child.on('exit', (code) => {
      this.procs.delete(run.id);
      if (run.status === 'error' || run.status === 'stopped') return this.finish(run, run.status);
      if (code === 0 && !run.isError) this.finish(run, 'done');
      else this.finish(run, 'error', run.error || err.trim() || `claude berhenti (kode ${code})`);
    });
    child.stdin.on('error', () => {});
    child.stdin.end(item.prompt);
    this.changed(run);
    return run;
  }

  onMessage(run, line) {
    let msg;
    try { msg = JSON.parse(line); } catch { return; }
    if (msg.type === 'system' && msg.subtype === 'init' && msg.session_id) {
      run.sessionId = msg.session_id;
      run.status = 'running';
      run.model = run.model || msg.model || '';
      this.changed(run);
    } else if (msg.type === 'result') {
      run.result = clip(typeof msg.result === 'string' ? msg.result : '', 12000);
      run.isError = !!msg.is_error || (msg.subtype && msg.subtype !== 'success');
      if (run.isError && !run.result) run.error = msg.subtype || 'gagal';
      if (run.isError && run.result) run.error = clip(run.result, 600);
      run.costUsd = typeof msg.total_cost_usd === 'number' ? msg.total_cost_usd : null;
      run.turns = msg.num_turns || null;
      run.denials = Array.isArray(msg.permission_denials) ? msg.permission_denials.length : 0;
      if (msg.session_id) run.sessionId = msg.session_id;
    }
  }

  finish(run, status, error) {
    if (!ACTIVE.has(run.status) && run.endedAt) return;
    run.status = status;
    run.endedAt = Date.now();
    if (error) run.error = clip(error, 1200);
    this.changed(run);
    this.drain();
  }

  // Start queued prompts whose session the board is no longer running.
  drain() {
    let started = false;
    for (const q of [...this.queue]) {
      if (this.activeRun(q.target)) continue;
      this.queue = this.queue.filter((x) => x !== q);
      this.start(q);
      started = true;
    }
    if (started) this.save();
  }

  cancelQueued(id) {
    const before = this.queue.length;
    this.queue = this.queue.filter((q) => q.id !== id);
    if (this.queue.length === before) return false;
    this.changed();
    return true;
  }

  stop(id) {
    const run = this.runs.find((r) => r.id === id);
    const child = this.procs.get(id);
    if (!run || !child) return false;
    run.status = 'stopped';
    run.error = 'Dihentikan dari kanban.';
    killTree(child);
    this.changed(run);
    return true;
  }

  snapshot() {
    return { runs: this.runs.slice(-MAX_RUNS), queue: this.queue };
  }
}

module.exports = { Runner };
