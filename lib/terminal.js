'use strict';
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const cfg = require('./config');

// PowerShell single-quoted literal: nothing inside is expanded, a quote is doubled.
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;

/**
 * Opens a new terminal window in `cwd` running the Claude CLI with `args` (e.g. --resume <id>).
 * The script goes in as -EncodedCommand, so paths and titles never pass through a shell parser.
 * `configDir` is set for sessions that belong to another account folder.
 */
function openTerminal({ cwd, args = [], configDir = null, title = 'Claude', banner = '' }) {
  const bin = cfg.CLAUDE_BIN;
  const cmd = /\.c?js$/i.test(bin) ? [process.execPath, bin, ...args] : [bin, ...args];
  const script = [
    `$Host.UI.RawUI.WindowTitle = ${lit(title)}`,
    `Set-Location -LiteralPath ${lit(cwd)}`,
    configDir ? `$env:CLAUDE_CONFIG_DIR = ${lit(configDir)}` : '',
    banner ? `Write-Host ${lit(banner)} -ForegroundColor DarkGray` : '',
    `& ${cmd.map(lit).join(' ')}`,
  ].filter(Boolean).join('\n');
  const encoded = Buffer.from(script, 'utf16le').toString('base64');
  const ps = ['-NoLogo', '-NoExit', '-EncodedCommand', encoded];

  // Tests record the launch instead of opening a window.
  if (process.env.KANBAN_TERMINAL_LOG) {
    fs.appendFileSync(process.env.KANBAN_TERMINAL_LOG, JSON.stringify({ cwd, args, configDir, title, script }) + '\n');
    return 'test';
  }
  const opts = { cwd, detached: true, stdio: 'ignore', windowsHide: false };
  // `start` gives PowerShell its own console window; the encoded script has no characters cmd treats specially.
  const plain = () => spawn('cmd.exe', [['/d', '/c', 'start', '""', 'powershell.exe', ...ps].join(' ')], { ...opts, windowsVerbatimArguments: true }).on('error', () => {}).unref();
  if (hasWt()) {
    // "-d ." takes the folder from cwd, so a path with ';' can't be read as a second wt command.
    spawn(WT, ['-w', 'new', '-d', '.', 'powershell.exe', ...ps], opts).on('error', plain).unref();
    return 'wt';
  }
  plain();
  return 'powershell';
}

// wt.exe is an app execution alias: a reparse point that stat() can't follow, so check it with lstat.
const WT = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WindowsApps', 'wt.exe') : null;
function hasWt() {
  if (!WT) return false;
  try { fs.lstatSync(WT); return true; } catch { return false; }
}

module.exports = { openTerminal };
