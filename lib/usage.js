'use strict';
const os = require('os');
const { spawnClaude } = require('./cli');
const EventEmitter = require('events');
const cfg = require('./config');

/**
 * Plan usage (what /usage shows), asked of the Claude CLI itself over its stream-json control
 * protocol (`get_usage`). The CLI does its own auth, so the kanban never touches credentials,
 * and no model turn runs.
 */
function probe() {
  return new Promise((resolve, reject) => {
    const args = ['-p', '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose', '--no-session-persistence'];
    let child;
    try {
      child = spawnClaude(args, { cwd: os.tmpdir() });
    } catch (e) {
      reject(e);
      return;
    }
    let out = '';
    let err = '';
    let settled = false;
    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { child.stdin.end(); } catch {}
      setTimeout(() => { try { child.kill(); } catch {} }, 2000).unref();
      fn(value);
    };
    const timer = setTimeout(() => settle(reject, new Error('Claude CLI tidak menjawab dalam 30 detik')), 30000);
    child.stdout.on('data', (d) => {
      out += d;
      let i;
      while ((i = out.indexOf('\n')) !== -1) {
        const line = out.slice(0, i).trim();
        out = out.slice(i + 1);
        if (!line.startsWith('{')) continue;
        let msg;
        try { msg = JSON.parse(line); } catch { continue; }
        const r = msg.type === 'control_response' && msg.response;
        if (!r || r.request_id !== 'usage') continue;
        if (r.subtype === 'success') settle(resolve, r.response || {});
        else settle(reject, new Error(r.error || 'get_usage gagal'));
      }
    });
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', (e) => settle(reject, e));
    child.on('exit', (code) => settle(reject, new Error(err.trim().slice(0, 400) || `claude berhenti (kode ${code})`)));
    child.stdin.write(JSON.stringify({ type: 'control_request', request_id: 'usage', request: { subtype: 'get_usage', skip_behaviors: true } }) + '\n');
  });
}

const ts = (v) => (v ? Date.parse(v) || null : null);

// Prefer the server's generic limits[] rows; fall back to the named windows for older answers.
function normalize(r) {
  const rl = r.rate_limits || null;
  let limits = [];
  if (rl && Array.isArray(rl.limits)) {
    limits = rl.limits.map((l) => ({
      kind: l.kind || 'limit',
      group: l.group || null,
      percent: typeof l.percent === 'number' ? l.percent : null,
      severity: l.severity || 'normal',
      resetsAt: ts(l.resets_at),
      model: (l.scope && l.scope.model && l.scope.model.display_name) || null,
      surface: (l.scope && l.scope.surface) || null,
      active: !!l.is_active,
    }));
  } else if (rl) {
    const add = (kind, w, model) => {
      if (w && typeof w.utilization === 'number') limits.push({ kind, group: kind === 'session' ? 'session' : 'weekly', percent: w.utilization, severity: w.utilization >= 90 ? 'critical' : w.utilization >= 75 ? 'warning' : 'normal', resetsAt: ts(w.resets_at), model: model || null, surface: null, active: false });
    };
    add('session', rl.five_hour);
    add('weekly', rl.seven_day);
    add('weekly_scoped', rl.seven_day_opus, 'Opus');
    add('weekly_scoped', rl.seven_day_sonnet, 'Sonnet');
    for (const m of rl.model_scoped || []) add('weekly_scoped', m, m.display_name);
  }
  const spend = rl && rl.spend && rl.spend.enabled
    ? { percent: rl.spend.percent, severity: rl.spend.severity, used: rl.spend.used, limit: rl.spend.limit }
    : null;
  return { plan: r.subscription_type || null, available: !!r.rate_limits_available, limits, spend };
}

class Usage extends EventEmitter {
  constructor() {
    super();
    this.state = { data: null, error: null, fetchedAt: 0, loading: false };
    this.inflight = null;
  }

  snapshot() {
    return this.state;
  }

  refresh() {
    if (this.inflight) return this.inflight;
    this.state = { ...this.state, loading: true };
    this.inflight = probe()
      .then((r) => { this.state = { data: normalize(r), error: null, fetchedAt: Date.now(), loading: false }; })
      .catch((e) => { this.state = { ...this.state, error: e.message, fetchedAt: Date.now(), loading: false }; })
      .finally(() => { this.inflight = null; this.emit('change'); });
    return this.inflight;
  }

  // Refresh only when the cached answer is older than maxAge.
  ensureFresh(maxAge = cfg.USAGE_REFRESH_MS) {
    if (Date.now() - this.state.fetchedAt > maxAge) this.refresh();
  }
}

module.exports = { Usage, normalize };
