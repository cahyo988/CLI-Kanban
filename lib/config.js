'use strict';
const os = require('os');
const path = require('path');

const CLAUDE_DIR = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const DATA_DIR = process.env.KANBAN_DATA_DIR || path.join(__dirname, '..', 'data');

module.exports = {
  CLAUDE_DIR,
  PROJECTS_DIR: path.join(CLAUDE_DIR, 'projects'),
  SESSIONS_DIR: path.join(CLAUDE_DIR, 'sessions'),
  JOBS_DIR: path.join(CLAUDE_DIR, 'jobs'),
  DATA_DIR,
  CACHE_FILE: path.join(DATA_DIR, 'cache.json'),
  PUBLIC_DIR: path.join(__dirname, '..', 'public'),
  HOST: process.env.KANBAN_HOST || '127.0.0.1',
  PORT: Number(process.env.KANBAN_PORT || 4777),
  // Bump when the parser's state shape changes so stale caches get rebuilt.
  CACHE_VERSION: 8,
  // A gap longer than this between events starts a new activity segment on the timeline.
  SEGMENT_GAP_MS: 15 * 60 * 1000,
  // A subagent transcript written to within this window counts as still running.
  AGENT_ACTIVE_MS: 3 * 60 * 1000,
  // A session with no live process but written to within this window counts as recently active.
  RECENT_MS: 2 * 60 * 1000,
  MAX_PROMPTS: 400,
  TEXT_LIMIT: 600,
  // The Claude CLI the kanban talks to (for /usage and for prompts sent from the board).
  CLAUDE_BIN: process.env.KANBAN_CLAUDE_BIN || 'claude',
  USAGE_REFRESH_MS: 90 * 1000,
  RUNS_FILE: path.join(DATA_DIR, 'runs.json'),
  // Permission modes a prompt from the board may run with; bypassPermissions is deliberately absent.
  PERMISSION_MODES: ['auto', 'acceptEdits', 'plan'],
  MODELS: ['', 'opus', 'sonnet', 'fable', 'haiku'],
  MAX_PROMPT_CHARS: 50000,
};
