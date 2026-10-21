'use strict';
const os = require('os');
const EventEmitter = require('events');
const { spawnClaude } = require('./cli');
const cfg = require('./config');

/**
 * The account the Claude CLI is signed in with, from `claude auth status --json`. The CLI reads
 * its own credentials; the kanban only sees the public fields (email, organization, plan).
 */
function probe(env) {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawnClaude(['auth', 'status', '--json'], { cwd: os.tmpdir(), env, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      reject(e);
      return;
    }
    let out = '';
    let err = '';
    const timer = setTimeout(() => { try { child.kill(); } catch {} reject(new Error('claude auth status tidak menjawab')); }, 20000);
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => {
      clearTimeout(timer);
      const start = out.indexOf('{');
      try {
        resolve(JSON.parse(out.slice(start)));
      } catch {
        reject(new Error(err.trim().slice(0, 300) || `claude auth status gagal (kode ${code})`));
      }
    });
  });
}

function normalize(r) {
  return {
    loggedIn: !!r.loggedIn,
    email: r.email || null,
    orgName: r.orgName || null,
    plan: r.subscriptionType || null,
    authMethod: r.authMethod || null,
    provider: r.apiProvider || null,
  };
}

class Account extends EventEmitter {
  constructor(env) {
    super();
    this.env = env;
    this.state = { data: null, error: null, fetchedAt: 0 };
    this.inflight = null;
  }

  snapshot() {
    return this.state;
  }

  refresh() {
    if (this.inflight) return this.inflight;
    const before = this.state.data && this.state.data.email;
    this.inflight = probe(this.env)
      .then((r) => { this.state = { data: normalize(r), error: null, fetchedAt: Date.now() }; })
      .catch((e) => { this.state = { ...this.state, error: e.message, fetchedAt: Date.now() }; })
      .finally(() => {
        this.inflight = null;
        const after = this.state.data && this.state.data.email;
        this.emit('change', { switched: !!before && before !== after });
      });
    return this.inflight;
  }

  ensureFresh(maxAge = cfg.ACCOUNT_REFRESH_MS) {
    if (Date.now() - this.state.fetchedAt > maxAge) this.refresh();
  }
}

module.exports = { Account, normalize };
