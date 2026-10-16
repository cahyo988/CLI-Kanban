'use strict';
const { spawn } = require('child_process');
const cfg = require('./config');

/** Spawns the Claude CLI. KANBAN_CLAUDE_BIN may point at a .js stand-in (used by the tests). */
function spawnClaude(args, options) {
  const bin = cfg.CLAUDE_BIN;
  const opts = { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], ...options };
  if (/\.c?js$/i.test(bin)) return spawn(process.execPath, [bin, ...args], opts);
  return spawn(bin, args, opts);
}

/** Ends a process and everything it started (tool subprocesses included). */
function killTree(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32' && child.pid) {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }).on('error', () => child.kill());
  } else {
    child.kill('SIGTERM');
  }
}

module.exports = { spawnClaude, killTree };
