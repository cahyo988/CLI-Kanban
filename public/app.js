'use strict';

/* ==========================================================================
   Icons (24×24 stroke paths; `.f` marks filled dots)
   ========================================================================== */
const I = {
  grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  kanban: '<rect x="3.5" y="4" width="5" height="16" rx="1.5"/><rect x="9.5" y="4" width="5" height="11" rx="1.5"/><rect x="15.5" y="4" width="5" height="13.5" rx="1.5"/>',
  timeline: '<path d="M4 6.5h9M8 12h11M6 17.5h7"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle class="f" cx="4.5" cy="6" r="1.3"/><circle class="f" cx="4.5" cy="12" r="1.3"/><circle class="f" cx="4.5" cy="18" r="1.3"/>',
  terminal: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M7.5 10l3 2.5-3 2.5M12.5 15.5h4"/>',
  file: '<path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z"/><path d="M14 3.5V8h4.5M9 13h6M9 16.5h4"/>',
  pencil: '<path d="M4.5 19.5l1-4L15.8 5.2a1.9 1.9 0 0 1 2.7 0l.3.3a1.9 1.9 0 0 1 0 2.7L8.5 18.5z"/><path d="M13.5 7.5l3 3"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5S9.6 5.9 12 3.5z"/>',
  bot: '<rect x="4.5" y="8" width="15" height="11" rx="3.5"/><path d="M12 4.5V8M2.5 12.5v2M21.5 12.5v2"/><circle class="f" cx="12" cy="4" r="1.3"/><circle class="f" cx="9.3" cy="13.5" r="1.4"/><circle class="f" cx="14.7" cy="13.5" r="1.4"/>',
  checksq: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 12.2l2.4 2.4 4.6-4.9"/>',
  message: '<path d="M5.5 5h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4.5 3.5V17h-1a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>',
  layers: '<path d="M12 4l8.5 4.5L12 13 3.5 8.5z"/><path d="M3.5 12.5L12 17l8.5-4.5M3.5 16.5L12 21l8.5-4.5"/>',
  sparkle: '<path d="M12 3.5l1.9 5.3 5.3 1.9-5.3 1.9L12 17.9l-1.9-5.3-5.3-1.9 5.3-1.9z"/><path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  branch: '<circle cx="7" cy="6" r="2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="8" r="2"/><path d="M7 8v8M17 10c0 3.5-3 4.5-8.5 6.5"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 3.5V6M15 3.5V6M9 18v2.5M15 18v2.5M3.5 9H6M3.5 15H6M18 9h2.5M18 15h2.5"/>',
  zap: '<path d="M13 3.5L5.5 13.5H12l-1 7 7.5-10H12z"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  inbox: '<path d="M4 13.5l2.5-7.5h11l2.5 7.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z"/><path d="M4 13.5h4.5l1.2 2.2h4.6l1.2-2.2H20"/>',
  loader: '<path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5"/>',
  checkc: '<circle cx="12" cy="12" r="8.5"/><path d="M8.3 12.3l2.6 2.6 4.8-5.2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  circle: '<circle cx="12" cy="12" r="7.5"/>',
  alert: '<path d="M10.3 4.6L3 17.5a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0z"/><path d="M12 10v4"/><circle class="f" cx="12" cy="17" r="1.1"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  chevR: '<path d="M9.5 6l6 6-6 6"/>',
  chevD: '<path d="M6 9.5l6 6 6-6"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>',
  bell: '<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2H5z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
  bellOff: '<path d="M8.6 5.9A5.5 5.5 0 0 1 17.5 11v4M6.5 11v5.5l-1.5 2h13M10 20.5a2.2 2.2 0 0 0 4 0M4 4l16 16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  monitor: '<rect x="3" y="4.5" width="18" height="12" rx="2.5"/><path d="M8.5 20h7M12 16.5V20"/>',
  activity: '<path d="M3 12h3.5l2.5-6.5 4.5 13 2.5-6.5H21"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 19.5a6.5 6.5 0 0 1 13 0M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.2a6.5 6.5 0 0 1 3.5 5.3"/>',
  swap: '<path d="M7 7.5h12.5l-3.5-3.5M17 16.5H4.5L8 20"/>',
  coins: '<ellipse cx="12" cy="6.5" rx="7" ry="3"/><path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
  cube: '<path d="M12 3.5l7.5 4.2v8.6L12 20.5l-7.5-4.2V7.7z"/><path d="M4.5 7.7L12 12l7.5-4.3M12 12v8.5"/>',
  rotate: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4"/>',
  expand: '<path d="M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15"/>',
  tag: '<path d="M4 12.6V5.5A1.5 1.5 0 0 1 5.5 4h7.1l7.4 7.4a1.5 1.5 0 0 1 0 2.1l-6 6a1.5 1.5 0 0 1-2.1 0z"/><circle class="f" cx="8.5" cy="8.5" r="1.4"/>',
  folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2h3.8l2 2h7.2a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
};
const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[name] || I.circle}</svg>`;

const TOOL_ICON = {
  Bash: 'terminal', PowerShell: 'terminal', Read: 'file', Write: 'pencil', Edit: 'pencil', NotebookEdit: 'pencil',
  Grep: 'search', Glob: 'search', ToolSearch: 'search', WebSearch: 'globe', WebFetch: 'globe',
  Agent: 'bot', Task: 'bot', TaskCreate: 'checksq', TaskUpdate: 'checksq', TaskList: 'checksq', TodoWrite: 'checksq',
  TaskStop: 'x', Skill: 'sparkle', Artifact: 'layers', SendMessage: 'message', SubagentHandback: 'message', Monitor: 'activity',
};
const toolIcon = (tool) => TOOL_ICON[tool] || (/^mcp__/.test(tool || '') ? 'layers' : 'zap');

const KIND = {
  request: { label: 'Request', icon: 'message', tone: 'blue' },
  task: { label: 'Task', icon: 'checksq', tone: 'orange' },
  agent: { label: 'Agent', icon: 'bot', tone: 'purple' },
  bg: { label: 'Background', icon: 'cpu', tone: 'teal' },
  queued: { label: 'Antrian kanban', icon: 'clock', tone: 'accent' },
  run: { label: 'Prompt kanban', icon: 'play', tone: 'accent' },
};
// Kinds the toolbar can filter; board prompts (queued/run) always show.
const CHIP_KINDS = ['request', 'task', 'agent', 'bg'];
// What a "waiting" session needs from you, as reported by the CLI.
const NEEDS = { 'permission prompt': 'Minta izin', 'input needed': 'Butuh jawaban', 'dialog open': 'Dialog terbuka', 'worker request': 'Minta izin', 'sandbox request': 'Minta izin' };
const needsLabel = (n) => (n ? NEEDS[n] || 'Butuh kamu' : null);
const PERMISSION_MODES = [
  ['auto', 'Auto', 'Claude menjalankan aksi yang aman dan memblokir yang berisiko secara otomatis.'],
  ['acceptEdits', 'Edit file', 'Boleh membuat dan mengedit file. Perintah lain yang butuh izin ditolak.'],
  ['plan', 'Rencana saja', 'Hanya menyusun rencana, tidak mengubah apa pun.'],
];
const MODELS = [['', 'Default (setelanmu)'], ['opus', 'Opus'], ['sonnet', 'Sonnet'], ['fable', 'Fable'], ['haiku', 'Haiku']];
const TOKEN = (document.querySelector('meta[name="kanban-token"]') || {}).content || '';
const STATUS = {
  working: { label: 'Bekerja', tone: 'green', live: true },
  waiting: { label: 'Menunggu kamu', tone: 'amber' },
  ended: { label: 'Selesai', tone: 'neutral' },
  running: { label: 'Berjalan', tone: 'green', live: true },
  in_progress: { label: 'Dikerjakan', tone: 'green', live: true },
  pending: { label: 'Antrian', tone: 'amber' },
  completed: { label: 'Selesai', tone: 'neutral' },
  done: { label: 'Selesai', tone: 'neutral' },
  failed: { label: 'Gagal', tone: 'red' },
  killed: { label: 'Dihentikan', tone: 'red' },
  stopped: { label: 'Terhenti', tone: 'red' },
  stale: { label: 'Terhenti', tone: 'red' },
  queued: { label: 'Antri', tone: 'accent' },
};
const FEED = {
  prompt: { verb: 'request baru', icon: 'message', tone: 'blue' },
  task_start: { verb: 'mulai task', icon: 'play', tone: 'orange' },
  task_done: { verb: 'task selesai', icon: 'check', tone: 'green' },
  agent_start: { verb: 'menjalankan agent', icon: 'bot', tone: 'purple' },
  agent_done: { verb: 'agent selesai', icon: 'checkc', tone: 'purple' },
  agent_failed: { verb: 'agent gagal', icon: 'alert', tone: 'red' },
  waiting: { verb: 'menunggu kamu', icon: 'user', tone: 'amber' },
};
const COLS = [
  { key: 'todo', label: 'Antrian', icon: 'inbox', tone: 'amber', empty: 'Tidak ada task yang mengantri' },
  { key: 'doing', label: 'Dikerjakan', icon: 'loader', tone: 'green', empty: 'Tidak ada yang sedang dikerjakan' },
  { key: 'waiting', label: 'Menunggu kamu', icon: 'user', tone: 'accent', empty: 'Tidak ada yang menunggu balasanmu' },
  { key: 'done', label: 'Selesai', icon: 'checkc', tone: 'neutral', empty: 'Belum ada yang selesai di rentang ini' },
];
const TABS = [
  ['kanban', 'Kanban', 'kanban'],
  ['timeline', 'Timeline', 'timeline'],
  ['sessions', 'Sesi', 'list'],
];
// Identity colours for sessions and projects, chosen to read on both light and dark surfaces.
const PALETTE = ['#3b9e8f', '#5b84e6', '#d0628b', '#a08a2c', '#c4703f', '#7c6fd8', '#3a9cc9', '#68a046', '#b4614e', '#9a6cc0'];

/* ==========================================================================
   State
   ========================================================================== */
const S = {
  overview: null,
  project: null,
  route: { view: 'overview' },
  ui: loadUi(),
  drawer: null,
  pendingCard: null,
  prevActive: null,
  prevRuns: null,
  composer: null,
  accounts: null,
  prevProfiles: null,
  toasts: [],
  connected: false,
  lastUpdate: 0,
  width: 0,
};

function loadUi() {
  const def = {
    tab: 'kanban', range: '7d', tlRange: '24h',
    kinds: { request: true, task: true, agent: true, bg: false },
    tlTasks: true, tlAgents: true, theme: 'auto', notify: false,
    cmpMode: 'auto', cmpModel: '', o3dRotate: false, o3dLabels: false,
  };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('ck.ui') || '{}') || {}; } catch {}
  return { ...def, ...saved, kinds: { ...def.kinds, ...(saved.kinds || {}) }, session: 'all', q: '', projQ: '', doneLimit: 40, tlCollapsed: [] };
}
function saveUi() {
  const { tab, range, tlRange, kinds, tlTasks, tlAgents, theme, notify, cmpMode, cmpModel, o3dRotate, o3dLabels } = S.ui;
  try { localStorage.setItem('ck.ui', JSON.stringify({ tab, range, tlRange, kinds, tlTasks, tlAgents, theme, notify, cmpMode, cmpModel, o3dRotate, o3dLabels })); } catch {}
}

/* ==========================================================================
   Helpers
   ========================================================================== */
const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const MIN = 60000, HOUR = 3600000, DAY = 86400000;
const RANGES = { '6h': 6 * HOUR, '24h': DAY, '7d': 7 * DAY, '30d': 30 * DAY, all: Infinity };
const RANGE_LABEL = { '6h': '6 jam', '24h': '24 jam', '7d': '7 hari', '30d': '30 hari', all: 'Semua' };

function ago(ts) {
  if (!ts) return '–';
  const d = Date.now() - ts;
  if (d < 45000) return 'baru saja';
  if (d < HOUR) return Math.round(d / MIN) + ' mnt lalu';
  if (d < DAY) return Math.round(d / HOUR) + ' jam lalu';
  if (d < 30 * DAY) return Math.round(d / DAY) + ' hari lalu';
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
function agoShort(ts) {
  if (!ts) return '';
  const d = Date.now() - ts;
  if (d < MIN) return 'baru';
  if (d < HOUR) return Math.floor(d / MIN) + 'm';
  if (d < DAY) return Math.floor(d / HOUR) + 'j';
  if (d < 30 * DAY) return Math.floor(d / DAY) + 'h';
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
function dur(ms) {
  if (!ms || ms < 0) return '–';
  if (ms < MIN) return Math.max(1, Math.round(ms / 1000)) + ' dtk';
  if (ms < HOUR) return Math.round(ms / MIN) + ' mnt';
  if (ms < DAY) {
    const h = Math.floor(ms / HOUR), m = Math.round((ms % HOUR) / MIN);
    return m ? `${h} j ${m} m` : `${h} jam`;
  }
  return (ms / DAY).toFixed(1).replace('.0', '').replace('.', ',') + ' hari';
}
function minutesLabel(m) {
  if (m < 60) return `${m} mnt`;
  return (m / 60).toFixed(1).replace('.0', '').replace('.', ',') + ' jam';
}
const fmt = (ts) => (ts ? new Date(ts).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '–');
const clock = (ts) => (ts ? new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '–');
function dayStart(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
function addDays(ts, n) { const d = new Date(ts); d.setDate(d.getDate() + n); return d.getTime(); }
function dayLabel(ts) {
  const d = dayStart(ts), today = dayStart(Date.now());
  if (d === today) return 'Hari ini';
  if (d === addDays(today, -1)) return 'Kemarin';
  return new Date(ts).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
}
const trim = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s || '');
function shortPath(p, n = 34) {
  p = String(p || '');
  if (p.length <= n) return p;
  const tail = Math.floor(n * 0.62);
  return p.slice(0, n - tail - 1) + '…' + p.slice(-tail);
}
// The folder a project lives in; its own name is already shown beside it.
function parentDir(p) {
  const s = String(p || '').replace(/[\\/]+$/, '');
  const up = s.replace(/[\\/][^\\/]+$/, '');
  if (!up || up === s) return s;
  return /^[A-Za-z]:$/.test(up) ? up + '\\' : up;
}
function hashColor(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
  return PALETTE[h % PALETTE.length];
}
function initials(name) {
  const parts = String(name || '?').replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/[\s\-_.\\/]+/).filter(Boolean);
  const a = parts[0] || '?';
  return ((a[0] || '?') + (parts[1] ? parts[1][0] : a[1] || '')).toUpperCase();
}
// Markdown → one plain line, for snippets and toasts.
function plain(s) {
  return String(s || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
const projectHref = (key, tab) => `#/p/${encodeURIComponent(key)}${tab ? '/' + tab : ''}`;

/* ==========================================================================
   Minimal markdown (escaped first, so only our own tags reach the DOM)
   ========================================================================== */
function inlineMd(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
function md(src) {
  const lines = String(src || '').replace(/\r/g, '').split('\n');
  let out = '', code = null, list = null, table = [];
  const flushList = () => {
    if (!list) return;
    out += `<${list.tag}>${list.items.map((i) => `<li>${inlineMd(i)}</li>`).join('')}</${list.tag}>`;
    list = null;
  };
  const flushTable = () => {
    if (!table.length) return;
    const rows = table.map((r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
    const body = rows.filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c)));
    const [head, ...rest] = body;
    out += `<div class="md-table"><table><thead><tr>${head.map((c) => `<th>${inlineMd(c)}</th>`).join('')}</tr></thead><tbody>${rest
      .map((r) => `<tr>${r.map((c) => `<td>${inlineMd(c)}</td>`).join('')}</tr>`)
      .join('')}</tbody></table></div>`;
    table = [];
  };
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      if (code) { out += `<pre class="md-code"><code>${esc(code.join('\n'))}</code></pre>`; code = null; }
      else { flushList(); flushTable(); code = []; }
      continue;
    }
    if (code) { code.push(line); continue; }
    if (/^\s*\|.*\|\s*$/.test(line)) { flushList(); table.push(line); continue; }
    flushTable();
    let m;
    if ((m = line.match(/^\s*#{1,6}\s+(.*)$/))) { flushList(); out += `<div class="md-h">${inlineMd(m[1])}</div>`; continue; }
    if ((m = line.match(/^\s*[-*•]\s+(.*)$/))) { if (!list || list.tag !== 'ul') { flushList(); list = { tag: 'ul', items: [] }; } list.items.push(m[1]); continue; }
    if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) { if (!list || list.tag !== 'ol') { flushList(); list = { tag: 'ol', items: [] }; } list.items.push(m[1]); continue; }
    flushList();
    out += line.trim() ? `<p>${inlineMd(line)}</p>` : '<div class="md-gap"></div>';
  }
  if (code) out += `<pre class="md-code"><code>${esc(code.join('\n'))}</code></pre>`;
  flushList();
  flushTable();
  return out;
}

/* ==========================================================================
   DOM morphing: patch the live DOM towards new markup instead of replacing it,
   so live updates keep scroll, focus, hover, open <details> and running animations.
   ========================================================================== */
const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute('data-key') : null);
function patch(el, html) {
  const t = document.createElement('template');
  t.innerHTML = html;
  morphChildren(el, t.content);
}
function morphChildren(parent, next) {
  const keyed = new Map();
  for (let c = parent.firstChild; c; c = c.nextSibling) {
    const k = keyOf(c);
    if (k) keyed.set(k, c);
  }
  let cur = parent.firstChild;
  for (const nb of Array.from(next.childNodes)) {
    const k = keyOf(nb);
    let match = null;
    if (k) {
      const m = keyed.get(k);
      if (m && m.nodeName === nb.nodeName) { match = m; keyed.delete(k); }
    } else if (cur && !keyOf(cur) && cur.nodeType === nb.nodeType && cur.nodeName === nb.nodeName) {
      match = cur;
    }
    if (match) {
      if (match === cur) cur = cur.nextSibling;
      else parent.insertBefore(match, cur);
      morphNode(match, nb);
    } else {
      parent.insertBefore(nb, cur);
    }
  }
  while (cur) { const nx = cur.nextSibling; parent.removeChild(cur); cur = nx; }
}
function morphNode(a, b) {
  if (a.nodeType !== 1) {
    if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue;
    return;
  }
  const keepOpen = a.nodeName === 'DETAILS';
  for (const { name } of Array.from(a.attributes)) {
    if (keepOpen && name === 'open') continue;
    if (!b.hasAttribute(name)) a.removeAttribute(name);
  }
  for (const { name, value } of Array.from(b.attributes)) {
    if (keepOpen && name === 'open') continue;
    if (a.getAttribute(name) !== value) a.setAttribute(name, value);
  }
  if (a.nodeName === 'INPUT' || a.nodeName === 'TEXTAREA') {
    if (document.activeElement !== a && a.value !== b.value) a.value = b.value;
    return;
  }
  // data-keep marks a node whose children belong to someone else (the 3D canvas and its labels).
  if (a.hasAttribute('data-keep')) return;
  morphChildren(a, b);
  if (a.nodeName === 'SELECT' && document.activeElement !== a) {
    const sel = b.querySelector('option[selected]');
    if (sel) a.value = sel.value;
  }
}

/* ==========================================================================
   Data
   ========================================================================== */
async function getJson(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(r.status + ' ' + url);
  return r.json();
}

// Writes carry the per-server token from the page; a restarted server issues a new one.
async function api(path, body) {
  let r;
  try {
    r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Kanban-Token': TOKEN }, body: JSON.stringify(body || {}) });
  } catch {
    return { ok: false, error: 'Server kanban tidak bisa dihubungi.' };
  }
  let data = {};
  try { data = await r.json(); } catch {}
  if (r.status === 403 && data.code === 'token') {
    toast({ tone: 'amber', icon: 'alert', title: 'Server kanban dimulai ulang', body: 'Halaman dimuat ulang supaya bisa mengirim lagi.' });
    setTimeout(() => location.reload(), 1500);
  }
  return { ok: r.ok, status: r.status, data, error: data.error };
}

let loadSeq = 0;
async function load() {
  const seq = ++loadSeq;
  try {
    const reqs = [getJson('/api/overview')];
    if (S.route.view === 'project') reqs.push(getJson('/api/project?key=' + encodeURIComponent(S.route.key)).catch(() => null));
    const [ov, pr] = await Promise.all(reqs);
    if (seq !== loadSeq) return;
    detectChanges(ov);
    detectProfileChanges(ov);
    S.overview = ov;
    S.project = S.route.view === 'project' ? pr : null;
    S.lastUpdate = Date.now();
    render();
    // ?compose opens the prompt box straight away (handy as a bookmark).
    if (/[?&]compose\b/.test(location.search) && !S.composeOpened) { S.composeOpened = true; openComposer(); }
    if (/[?&]accounts\b/.test(location.search) && !S.accountsOpened) { S.accountsOpened = true; openAccounts(); }
    if (S.pendingCard && S.project) {
      const id = S.pendingCard;
      S.pendingCard = null;
      openCard(id);
    }
  } catch (e) {
    console.error(e);
  }
}

// Writes arrive several times a second while Claude works; refresh at most once a second.
let lastLoad = 0, loadTimer = null;
function scheduleReload() {
  if (loadTimer) return;
  const wait = Math.max(0, 1000 - (Date.now() - lastLoad));
  loadTimer = setTimeout(() => { loadTimer = null; lastLoad = Date.now(); load(); }, wait);
}

function connect() {
  const es = new EventSource('/api/events');
  es.addEventListener('hello', () => { S.connected = true; scheduleReload(); renderChrome(); });
  es.addEventListener('update', () => { S.connected = true; scheduleReload(); });
  es.onerror = () => { S.connected = false; renderChrome(); };
}

/* ==========================================================================
   Change detection → toasts + desktop notifications
   ========================================================================== */
function detectRunChanges(ov) {
  const cur = new Map((ov.runs || []).map((r) => [r.id, r]));
  const prev = S.prevRuns;
  S.prevRuns = cur;
  if (!prev) return;
  for (const [id, r] of cur) {
    const p = prev.get(id);
    if (!p || p.status === r.status || !['starting', 'running'].includes(p.status)) continue;
    const href = projectHref(r.projectKey);
    if (r.status === 'done') {
      const body = r.title + (r.denials ? ` · ${r.denials} aksi ditolak karena butuh izin` : '');
      toast({ tone: 'green', icon: 'checkc', title: `Prompt selesai · ${r.projectName}`, body, href });
      notify(`Prompt selesai · ${r.projectName}`, body, 'run-' + id);
    } else if (r.status === 'error' || r.status === 'lost') {
      toast({ tone: 'red', icon: 'alert', title: `Prompt gagal · ${r.projectName}`, body: r.error || r.title, href, ttl: 14000 });
      notify(`Prompt gagal · ${r.projectName}`, r.error || r.title, 'run-' + id);
    }
  }
}

function detectChanges(ov) {
  detectRunChanges(ov);
  const cur = new Map(ov.active.map((a) => [a.sessionId, a]));
  const prev = S.prevActive;
  S.prevActive = cur;
  if (!prev) return;
  for (const [sid, a] of cur) {
    const p = prev.get(sid);
    const href = projectHref(a.projectKey);
    if (!p) {
      if (!a.starting && !a.managed) toast({ tone: 'green', icon: 'play', title: `Sesi baru · ${a.projectName}`, body: a.title, href });
      continue;
    }
    if (a.needs && !p.needs) {
      const body = `${a.title}: ${a.needs}. Jawab di terminal sesi ini.`;
      toast({ tone: 'amber', icon: 'alert', title: `${needsLabel(a.needs)} · ${a.projectName}`, body, href, ttl: 15000 });
      notify(`${needsLabel(a.needs)} · ${a.projectName}`, body, 'needs-' + sid);
    } else if (p.status === 'working' && a.status === 'waiting' && !a.needs) {
      const body = a.lastText ? plain(a.lastText.text) : a.title;
      toast({ tone: 'amber', icon: 'user', title: `Menunggu kamu · ${a.projectName}`, body, href, ttl: 12000 });
      notify(`Claude menunggu kamu · ${a.projectName}`, body, 'wait-' + sid);
    }
    for (const g of p.agents) {
      if (a.agents.some((x) => x.id === g.id)) continue;
      toast({ tone: 'purple', icon: 'bot', title: `Agent selesai · ${a.projectName}`, body: g.description, href, card: `${sid}:a${g.id}`, project: a.projectKey });
      notify(`Agent selesai · ${a.projectName}`, g.description, 'agent-' + g.id);
    }
  }
  for (const [sid, p] of prev) {
    if (!cur.has(sid) && !p.starting && !p.managed) toast({ tone: 'neutral', icon: 'checkc', title: `Sesi ditutup · ${p.projectName}`, body: p.title, href: projectHref(p.projectKey) });
  }
}

function notify(title, body, tag) {
  if (!S.ui.notify || !('Notification' in window) || Notification.permission !== 'granted' || !document.hidden) return;
  try {
    const n = new Notification(title, { body: trim(body, 180), tag });
    n.onclick = () => { window.focus(); n.close(); };
  } catch {}
}

let toastSeq = 0;
function toast(t) {
  const id = ++toastSeq;
  S.toasts.push({ ...t, id });
  if (S.toasts.length > 4) S.toasts.shift();
  renderToasts();
  setTimeout(() => dismissToast(id), t.ttl || 7000);
}
function dismissToast(id) {
  S.toasts = S.toasts.filter((x) => x.id !== id);
  renderToasts();
}
function renderToasts() {
  patch($('#toasts'), S.toasts.map((t) => `
    <div class="toast tone-${t.tone}" data-key="toast:${t.id}" data-toast="${t.id}">
      <span class="toast-ic">${icon(t.icon, 'ic-lg')}</span>
      <div><b>${esc(t.title)}</b>${t.body ? `<p>${esc(t.body)}</p>` : ''}</div>
      <button class="btn ghost sm icon-btn" data-dismiss="${t.id}" aria-label="Tutup">${icon('x', 'ic-xs')}</button>
    </div>`).join(''));
}

/* ==========================================================================
   Routing
   ========================================================================== */
function parseRoute() {
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  if (parts[0] === 'p' && parts[1]) {
    const key = decodeURIComponent(parts[1]);
    const tab = TABS.some((t) => t[0] === parts[2]) ? parts[2] : S.ui.tab;
    if (S.route.key !== key) { S.ui.session = 'all'; S.ui.q = ''; S.ui.doneLimit = 40; S.ui.tlCollapsed = []; S.project = null; }
    // #/p/<project>/<tab>/<card> deep-links straight into a card's details.
    if (parts[3]) S.pendingCard = decodeURIComponent(parts.slice(3).join('/'));
    S.route = { view: 'project', key, tab };
    S.ui.tab = tab;
    saveUi();
  } else if (parts[0] === '3d') {
    S.route = { view: '3d' };
  } else {
    S.route = { view: 'overview' };
  }
}

/* ==========================================================================
   Render
   ========================================================================== */
// ?theme=light|dark forces a theme for this page load without touching the saved choice.
const FORCED_THEME = (location.search.match(/[?&]theme=(light|dark)\b/) || [])[1];
function applyTheme() {
  const t = FORCED_THEME || S.ui.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}

function measure() {
  const main = $('#main');
  const cs = getComputedStyle(main);
  S.width = main.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
}

function render() {
  applyTheme();
  measure();
  patch($('#sidebar'), sidebarHtml());
  patch($('#main'), S.route.view === 'project' ? projectPageHtml() : S.route.view === '3d' ? officeHtml() : overviewHtml());
  syncOffice();
  if (S.drawer) renderDrawer();
  renderComposer();
  const waiting = S.overview ? S.overview.kpi.waiting : 0;
  document.title = (waiting ? `(${waiting}) ` : '') + 'Claude Kanban';
}
// Cheap re-render for connection-state changes only.
function renderChrome() { patch($('#sidebar'), sidebarHtml()); }

/* ---------- shared pieces ---------- */
function pill(status, label) {
  const m = STATUS[status] || { label: status, tone: 'neutral' };
  return `<span class="pill tone-${m.tone}${m.live ? ' live' : ''}"><span class="dot"></span>${esc(label || m.label)}</span>`;
}
function progressBar(p) {
  const pct = p && p.total ? Math.round((p.done / p.total) * 100) : 0;
  return `<div class="bar"><i style="width:${pct}%"></i></div>`;
}
function progressRow(p, label) {
  if (!p || !p.total) return '';
  const pct = Math.round((p.done / p.total) * 100);
  return `<div class="progress">${label ? `<span>${esc(label)}</span>` : ''}${progressBar(p)}<span class="num">${p.done}/${p.total} · ${pct}%</span></div>`;
}
function ring(pct, size = 40, stroke = 5) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, h = size / 2;
  const off = c * (1 - (pct || 0) / 100);
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle class="ring-bg" cx="${h}" cy="${h}" r="${r}" stroke-width="${stroke}"/><circle class="ring-fg" cx="${h}" cy="${h}" r="${r}" stroke-width="${stroke}" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" transform="rotate(-90 ${h} ${h})"/></svg>`;
}
function activityRow(a, label) {
  if (!a) return '';
  return `<div class="act-row"><span class="act-ic">${icon(toolIcon(a.tool), 'ic-sm')}</span>${label ? `<span class="act-label">${esc(label)}</span>` : ''}<span class="act-tool">${esc(a.tool)}</span><span class="act-text" title="${esc(a.text)}">${esc(a.text || '')}</span><span class="act-ago">${ago(a.ts)}</span></div>`;
}
function emptyState(ic, title, text) {
  return `<div class="empty"><span class="empty-ic">${icon(ic, 'ic-xl')}</span><b>${title}</b>${text ? `<p>${text}</p>` : ''}</div>`;
}
function livePill() {
  const sub = S.lastUpdate ? `<span class="sub">${new Date(S.lastUpdate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>` : '';
  return `<span class="live-pill ${S.connected ? 'ok' : 'bad'}" title="Data diperbarui otomatis saat ada aktivitas"><span class="dot"></span>${S.connected ? 'Live' : 'Terputus'}${sub}</span>`;
}
function checklistHtml(items, max = 6) {
  let rows = items.slice(), hiddenDone = 0, hiddenRest = 0;
  while (rows.length > max && rows[0].status === 'completed') { rows.shift(); hiddenDone++; }
  if (rows.length > max) { hiddenRest = rows.length - max; rows = rows.slice(0, max); }
  const ic = { completed: icon('checkc', 'ic-sm'), in_progress: icon('loader', 'ic-sm spin'), pending: icon('circle', 'ic-sm') };
  return `<div class="checklist">
    ${hiddenDone ? `<div class="cl-more">${hiddenDone} task sebelumnya sudah selesai</div>` : ''}
    ${rows.map((t, i) => `<div class="cl-item ${t.status}" data-key="cl:${i}:${esc(t.title)}">${ic[t.status] || ic.pending}<span class="cl-text">${esc(t.status === 'in_progress' && t.activeForm ? t.activeForm : t.title)}</span></div>`).join('')}
    ${hiddenRest ? `<div class="cl-more">+${hiddenRest} task lagi</div>` : ''}
  </div>`;
}

/* ---------- sidebar ---------- */
function sidebarHtml() {
  const ov = S.overview;
  const q = S.ui.projQ.trim().toLowerCase();
  const projects = ov ? ov.projects.filter((p) => !q || (p.name + ' ' + p.path).toLowerCase().includes(q)) : [];
  const active = projects.filter((p) => p.working || p.waiting).sort((a, b) => a.name.localeCompare(b.name));
  const rest = projects.filter((p) => !p.working && !p.waiting).sort((a, b) => b.lastTs - a.lastTs);
  const waiting = ov ? ov.kpi.waiting : 0;
  const themes = [['auto', 'monitor', 'Ikuti sistem'], ['light', 'sun', 'Terang'], ['dark', 'moon', 'Gelap']];
  return `
  <div class="sb-head">
    <a class="brand" href="#/"><span class="brand-logo" aria-hidden="true"><i></i><i></i><i></i></span><span><b>Claude Kanban</b><small>Monitor Claude Code</small></span></a>
  </div>
  <nav class="sb-nav">
    <a class="nav-item${S.route.view === 'overview' ? ' active' : ''}" href="#/">${icon('grid')}<span>Semua project</span>${waiting ? `<span class="nav-badge tone-amber" title="${waiting} sesi menunggu kamu">${waiting}</span>` : ''}</a>
    <a class="nav-item${S.route.view === '3d' ? ' active' : ''}" href="#/3d">${icon('cube')}<span>Kantor 3D</span>${ov && ov.kpi.working ? `<span class="live-dot tone-green" title="${ov.kpi.working} sesi bekerja"></span>` : ''}</a>
  </nav>
  <label class="sb-search">${icon('search', 'ic-sm')}<input type="search" placeholder="Cari project…" value="${esc(S.ui.projQ)}" data-act="projQ" aria-label="Cari project"></label>
  <div class="sb-scroll">
    ${active.length ? `<div class="sb-label">Aktif sekarang</div>${active.map(projLink).join('')}` : ''}
    ${rest.length ? `<div class="sb-label">Project lain</div>${rest.map(projLink).join('')}` : ''}
    ${ov && !projects.length ? `<div class="sb-empty">Tidak ada project yang cocok.</div>` : ''}
    ${ov ? '' : `<div class="skel" style="height:34px;margin:14px 6px"></div><div class="skel" style="height:34px;margin:8px 6px"></div><div class="skel" style="height:34px;margin:8px 6px"></div>`}
  </div>
  <div class="sb-foot">
    ${accountHtml()}
    ${usageMini()}
    <div class="live-status ${S.connected ? 'ok' : 'bad'}"><span class="dot"></span>${S.connected ? 'Live: memantau PC ini' : 'Terputus, menyambung ulang…'}</div>
    <div class="sb-controls">
      <div class="seg seg-icons" role="group" aria-label="Tema">${themes.map(([t, ic, l]) => `<button data-act="theme" data-v="${t}" class="${S.ui.theme === t ? 'active' : ''}" title="${l}" aria-label="Tema ${l}">${icon(ic, 'ic-sm')}</button>`).join('')}</div>
      <button class="btn sm${S.ui.notify ? ' on' : ''}" data-act="notify" title="Kabari saat Claude menunggu kamu atau agent selesai">${icon(S.ui.notify ? 'bell' : 'bellOff', 'ic-sm')}<span>${S.ui.notify ? 'Notifikasi aktif' : 'Notifikasi'}</span></button>
    </div>
  </div>`;
}
function projLink(p) {
  const isActive = S.route.view === 'project' && S.route.key === p.key;
  let right = `<span class="pl-when">${agoShort(p.lastTs)}</span>`;
  if (p.waiting) right = `<span class="nav-badge tone-amber">menunggu</span>`;
  else if (p.working) right = `<span class="live-dot tone-green" title="Sedang bekerja"></span>`;
  return `<a class="proj-link${isActive ? ' active' : ''}" data-key="pl:${esc(p.key)}" href="${projectHref(p.key)}" title="${esc(p.path)}">
    <span class="avatar sm" style="--pc:${hashColor(p.key)}">${esc(initials(p.name))}</span>
    <span class="pl-text"><span class="pl-name">${esc(p.name)}</span><span class="pl-path">${esc(shortPath(parentDir(p.path), 30))}</span></span>
    ${right}
  </a>`;
}

/* ---------- usage (/usage) ---------- */
function limitTone(l) {
  if (/critical|exceeded|limited|blocked/.test(l.severity || '') || l.percent >= 95) return 'red';
  if (l.severity === 'warning' || l.percent >= 75) return 'amber';
  return 'green';
}
function limitLabel(l) {
  if (l.kind === 'session') return 'Sesi saat ini';
  if (l.kind === 'weekly') return 'Mingguan · semua model';
  if (l.kind === 'weekly_scoped' || l.model) return `Mingguan · ${l.model || l.surface || 'model'}`;
  return l.group === 'weekly' ? 'Mingguan' : l.kind.replace(/_/g, ' ');
}
function resetLabel(ts) {
  if (!ts) return '';
  const now = Date.now();
  const when = ts - now < DAY && dayStart(ts) <= addDays(dayStart(now), 1)
    ? clock(ts)
    : new Date(ts).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return `reset ${when}${ts > now ? ` · ${dur(ts - now)} lagi` : ''}`;
}
function limitsBody(u) {
  const d = u.data;
  let body;
  if (!d && u.error) body = `<div class="usage-msg tone-red">${icon('alert', 'ic-sm')}<span>Pemakaian belum bisa dibaca: ${esc(u.error)}</span></div>`;
  else if (!d) body = `<div class="usage-grid"><div class="skel" style="height:62px"></div><div class="skel" style="height:62px"></div></div>`;
  else if (!d.available) body = `<div class="usage-msg tone-neutral">${icon('activity', 'ic-sm')}<span>Akun ini tidak memakai limit paket Claude (API key atau provider lain).</span></div>`;
  else if (!d.limits.length) body = `<div class="usage-msg tone-neutral">${icon('activity', 'ic-sm')}<span>Belum ada data limit dari server.</span></div>`;
  else body = `<div class="usage-grid">${d.limits.map((l, i) => {
    const tone = limitTone(l);
    const pct = Math.max(0, Math.min(100, Math.round(l.percent || 0)));
    return `<div class="limit tone-${tone}" data-key="lim:${i}:${esc(l.kind)}:${esc(l.model || '')}">
      <div class="limit-top"><span class="limit-label">${esc(limitLabel(l))}</span><b>${pct}%</b></div>
      <div class="meter"><i style="width:${pct}%"></i></div>
      <div class="limit-sub"><span>${l.kind === 'session' ? 'jendela 5 jam' : '7 hari'}</span><span>${esc(resetLabel(l.resetsAt))}</span></div>
    </div>`;
  }).join('')}</div>`;
  return body;
}
// One account's limits inside the usage card, when the kanban knows several accounts.
function profileUsage(p) {
  const d = p.account && p.account.data;
  const face = loggedIn(p) ? d.email || d.orgName || p.name : p.name;
  let body;
  if (loggedOut(p)) body = `<div class="usage-msg tone-amber">${icon('user', 'ic-sm')}<span>Akun ini belum login.</span><button class="btn sm" data-act="accounts">Login</button></div>`;
  else if (!d && !(p.account && p.account.error)) body = `<div class="usage-grid"><div class="skel" style="height:62px"></div></div>`;
  else body = limitsBody(p.usage || {});
  return `<div class="pu${p.active ? ' active' : ''}" data-key="pu:${esc(p.id)}">
    <div class="pu-head">
      <span class="avatar sm" style="--pc:${hashColor(loggedIn(p) ? face : 'prof:' + p.id)}">${esc(face.charAt(0).toUpperCase())}</span>
      <b>${esc(p.name)}</b>
      ${loggedIn(p) && d.email ? `<span class="pu-email">${esc(d.email)}${d.orgName ? ' · ' + esc(d.orgName) : ''}</span>` : ''}
      ${loggedIn(p) && d.plan ? `<span class="plan-badge">${esc(planLabel(d.plan))}</span>` : ''}
      ${p.active ? '<span class="acct-tag">aktif</span>' : loggedIn(p) ? `<button class="btn ghost sm pu-switch" data-act="acc-activate" data-v="${esc(p.id)}">${icon('swap', 'ic-sm')}Jadikan aktif</button>` : ''}
    </div>
    ${body}
  </div>`;
}
function usageHtml() {
  const u = S.overview && S.overview.usage;
  if (!u) return '';
  const d = u.data;
  const list = profiles();
  const multi = list.length > 1;
  const loading = multi ? list.some((p) => p.usage && p.usage.loading) : u.loading;
  const fetchedAt = multi ? Math.max(0, ...list.map((p) => (p.usage && p.usage.fetchedAt) || 0)) : u.fetchedAt;
  const fetched = fetchedAt ? `diperbarui ${clock(fetchedAt)}` : 'memuat…';
  return `<section class="usage-card" data-key="usage">
    <header class="usage-head">
      <span class="usage-ic">${icon('activity', 'ic-sm')}</span>
      <h2 class="section-title">Pemakaian Claude</h2>
      ${multi ? `<span class="usage-acct">${list.length} akun</span>` : accountInline()}
      ${!multi && d && d.plan ? `<span class="plan-badge">${esc(planLabel(d.plan))}</span>` : ''}
      <span class="usage-meta">${fetched}${!multi && u.data && u.error ? ' · gagal menyegarkan' : ''}</span>
      <button class="btn ghost sm" data-act="accounts" title="Kelola dan ganti akun Claude">${icon('users', 'ic-sm')}<span class="hide-sm">Akun</span></button>
      <button class="btn ghost sm icon-btn" data-act="usage-refresh" title="Segarkan" aria-label="Segarkan pemakaian">${icon('loader', 'ic-sm' + (loading ? ' spin' : ''))}</button>
    </header>
    ${multi ? `<div class="pu-list">${list.map(profileUsage).join('')}</div>` : limitsBody(u)}
  </section>`;
}
// The session window, compact, for the sidebar.
function usageMini() {
  const d = S.overview && S.overview.usage && S.overview.usage.data;
  const l = d && d.limits && (d.limits.find((x) => x.kind === 'session') || d.limits[0]);
  if (!l) return '';
  const pct = Math.round(l.percent || 0);
  return `<a class="usage-mini tone-${limitTone(l)}" href="#/" title="${esc(limitLabel(l) + ' · ' + resetLabel(l.resetsAt))}">
    <span class="um-top"><span>${esc(l.kind === 'session' ? 'Limit sesi Claude' : limitLabel(l))}</span><b>${pct}%</b></span>
    <span class="meter"><i style="width:${Math.min(100, pct)}%"></i></span>
  </a>`;
}

/* ---------- account (claude auth status) ---------- */
const PLANS = { team: 'Team', max: 'Max', pro: 'Pro', enterprise: 'Enterprise', free: 'Free' };
const planLabel = (p) => (p ? PLANS[p] || p.charAt(0).toUpperCase() + p.slice(1) : '');
const AUTH = { 'claude.ai': 'Login lewat claude.ai', console: 'Anthropic Console (API)', apiKey: 'API key', api_key: 'API key' };
function accountTip(d) {
  return [d.email || 'Akun Claude', d.orgName ? `Organisasi: ${d.orgName}` : '', d.plan ? `Paket: ${planLabel(d.plan)}` : '', AUTH[d.authMethod] || d.authMethod || ''].filter(Boolean).join('\n');
}
function accountHtml() {
  const a = S.overview && S.overview.account;
  if (!a) return '';
  const d = a.data;
  const list = profiles();
  const prof = list.find((p) => p.active);
  const more = list.length > 1 ? `<span class="acct-count" title="${list.length} akun di kanban">${list.length}</span>` : '';
  const open = (cls, tip, inner) => `<button class="acct${cls}" data-key="acct" data-act="accounts" data-tip="${esc(tip)}">${inner}${more}${icon('swap', 'ic-sm acct-go')}</button>`;
  if (!d && a.error) return open(' tone-red', 'Akun tidak terbaca\n' + a.error, `<span class="acct-ic">${icon('alert', 'ic-sm')}</span><span class="acct-text"><span class="acct-name">Akun tidak terbaca</span><span class="acct-sub">claude auth status gagal</span></span>`);
  if (!d) return `<div class="skel" style="height:44px"></div>`;
  if (!d.loggedIn) return open(' tone-amber', 'Akun aktif belum login\nKlik untuk login atau ganti akun', `<span class="acct-ic">${icon('user', 'ic-sm')}</span><span class="acct-text"><span class="acct-name">Belum login</span><span class="acct-sub">${esc(prof ? prof.name : 'Akun Claude')} · klik untuk login</span></span>`);
  const name = d.email || d.orgName || 'Akun Claude';
  const sub = [list.length > 1 && prof ? prof.name : null, d.orgName, planLabel(d.plan)].filter(Boolean).join(' · ') || AUTH[d.authMethod] || '';
  return open('', accountTip(d) + '\nKlik untuk kelola atau ganti akun', `<span class="avatar sm" style="--pc:${hashColor(name)}">${esc(name.charAt(0).toUpperCase())}</span>
    <span class="acct-text"><span class="acct-name">${esc(name)}</span><span class="acct-sub">${esc(sub)}</span></span>`);
}

/* ---------- account profiles (one Claude config folder each) ---------- */
const profiles = () => (S.overview && S.overview.profiles) || [];
const profileOf = (id) => profiles().find((p) => p.id === (id || 'default')) || null;
const activeProfile = () => profiles().find((p) => p.active) || null;
const loggedIn = (p) => !!(p && p.account && p.account.data && p.account.data.loggedIn);
const loggedOut = (p) => !!(p && p.account && p.account.data && !p.account.data.loggedIn);
// Shown only when there is more than one account to tell apart.
function profTag(id) {
  if (profiles().length < 2) return '';
  const p = profileOf(id);
  return p ? `<span class="prof-tag" style="--pc:${hashColor('prof:' + p.id)}" data-tip="${esc('Akun ' + p.name + (loggedIn(p) && p.account.data.email ? '\n' + p.account.data.email : ''))}"><i></i>${esc(p.name)}</span>` : '';
}
const termCmd = (p, extra = '') => (p.isDefault ? 'claude' + extra : `$env:CLAUDE_CONFIG_DIR="${p.dir}"; claude${extra}`);
function suggestDir(name) {
  const home = (S.overview && S.overview.home) || '';
  const sep = home.includes('\\') ? '\\' : '/';
  const slug = String(name || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'akun2';
  return home ? `${home.replace(/[\\/]+$/, '')}${sep}.claude-${slug}` : '';
}
function limitShort(l) {
  if (l.kind === 'session') return 'Sesi 5 jam';
  if (l.model) return 'Minggu · ' + l.model;
  return l.group === 'weekly' || l.kind === 'weekly' ? 'Mingguan' : l.kind.replace(/_/g, ' ');
}
function miniLimits(limits) {
  return `<div class="acc-limits">${limits.map((l, i) => {
    const pct = Math.max(0, Math.min(100, Math.round(l.percent || 0)));
    return `<div class="acc-limit tone-${limitTone(l)}" data-key="al:${i}" data-tip="${esc(limitLabel(l) + '\n' + resetLabel(l.resetsAt))}"><span class="al-top"><span>${esc(limitShort(l))}</span><b>${pct}%</b></span><span class="meter"><i style="width:${pct}%"></i></span></div>`;
  }).join('')}</div>`;
}

function openAccounts() {
  if (S.drawer) closeDrawer();
  S.composer = null;
  S.accounts = { form: null, codes: {} };
  renderComposer();
}
function closeAccounts() {
  S.accounts = null;
  renderComposer();
}

function loginPanel(p) {
  const L = p.login;
  const id = esc(p.id);
  if (L && L.running) {
    const code = S.accounts.codes[p.id] || '';
    return `<div class="acc-login tone-blue" data-key="login:${id}">
      <div class="al-head">${icon('loader', 'ic-sm spin')}<span>Menunggu login di browser…</span><button class="btn ghost sm" data-act="acc-login-cancel" data-v="${id}">Batal</button></div>
      <p class="al-hint">Claude CLI membuka halaman login claude.ai di browser PC ini. Selesaikan login di sana${L.url ? ', atau buka link ini' : ''}. Akun ini otomatis terbaca begitu login selesai.</p>
      ${L.url ? `<a class="al-url mono" href="${esc(L.url)}" target="_blank" rel="noopener noreferrer">${icon('globe', 'ic-xs')}<span>${esc(trim(L.url, 110))}</span></a>` : ''}
      <div class="al-code"><span class="field">${icon('pencil', 'ic-sm')}<input type="text" data-act="acc-code" data-v="${id}" value="${esc(code)}" placeholder="Tempel kode dari browser, bila diminta" autocomplete="off" spellcheck="false"></span><button class="btn sm" data-act="acc-code-send" data-v="${id}"${code.trim() ? '' : ' disabled'}>Kirim kode</button></div>
      ${L.lines.length ? `<details class="fold" data-key="al-log:${id}"><summary>${icon('chevR', 'ic-xs')}Output Claude CLI</summary><pre class="al-log">${esc(L.lines.join('\n'))}</pre></details>` : ''}
    </div>`;
  }
  if (loggedIn(p)) {
    return L && L.ok && Date.now() - L.endedAt < 120000 ? `<div class="acc-login tone-green" data-key="login:${id}"><div class="al-head">${icon('checkc', 'ic-sm')}<span>Login berhasil.</span></div></div>` : '';
  }
  if (!loggedOut(p)) return '';
  return `<div class="acc-login tone-amber" data-key="login:${id}">
    ${L && L.error ? `<div class="cmp-error">${icon('alert', 'ic-sm')}<span>${esc(L.error)}</span></div>` : ''}
    <div class="al-head">${icon('user', 'ic-sm')}<span>Akun ini belum login.</span><button class="btn sm primary" data-act="acc-login" data-v="${id}">${icon('play', 'ic-sm')}Login</button></div>
    <p class="al-hint">Login membuka claude.ai di browser PC ini. Dari perangkat lain, kamu juga bisa login lewat terminal di PC: <code>${esc(termCmd(p, ' auth login'))}</code></p>
  </div>`;
}

function accountCard(p) {
  const d = p.account && p.account.data;
  const ok = loggedIn(p);
  const status = ok
    ? [d.orgName, planLabel(d.plan)].filter(Boolean).join(' · ')
    : loggedOut(p) ? 'Belum login' : p.account && p.account.error ? 'Status login tidak terbaca' : 'Memeriksa login…';
  const face = ok ? d.email || d.orgName || p.name : p.name;
  const u = p.usage && p.usage.data;
  const tok = p.tokens && tokSum(p.tokens.all)
    ? `<span class="acc-tok" data-tip="${esc(tokTip(p.tokens.all, 'Token akun ini'))}">${icon('coins', 'ic-xs')}${fmtTok(tokSum(p.tokens.today))} hari ini · ${fmtTok(tokSum(p.tokens.all))} total</span>`
    : '<span class="acc-tok muted">Belum ada token tercatat</span>';
  const cmd = termCmd(p);
  return `<article class="acc-card${p.active ? ' active' : ''}" data-key="acc:${esc(p.id)}">
    <div class="acc-top">
      <span class="avatar" style="--pc:${hashColor(ok ? face : 'prof:' + p.id)}">${esc(face.charAt(0).toUpperCase())}</span>
      <div class="acc-titles">
        <div class="acc-name"><b>${esc(p.name)}</b>${p.isDefault ? '<span class="type-tag">folder bawaan</span>' : ''}${p.active ? '<span class="acct-tag">aktif</span>' : ''}</div>
        <div class="acc-email">${ok && d.email ? `<span>${esc(d.email)}</span>` : ''}<span class="muted">${esc(status)}</span></div>
        <div class="acc-dir mono" data-tip="${esc('Folder akun ini\n' + p.dir)}">${esc(p.dir)}</div>
      </div>
      ${p.active ? '' : `<button class="btn sm${ok ? ' primary' : ''}" data-act="acc-activate" data-v="${esc(p.id)}"${ok ? '' : ' disabled'} title="${ok ? 'Pakai akun ini untuk prompt baru dari kanban' : 'Login dulu'}">${icon('swap', 'ic-sm')}Jadikan aktif</button>`}
    </div>
    ${ok && u && u.limits && u.limits.length ? miniLimits(u.limits) : ok && p.usage && p.usage.error && !u ? `<div class="usage-msg tone-red">${icon('alert', 'ic-sm')}<span>Limit belum terbaca: ${esc(p.usage.error)}</span></div>` : ''}
    ${loginPanel(p)}
    <div class="acc-foot">${tok}
      ${p.isDefault ? '' : `<button class="btn ghost sm" data-act="copy" data-v="${esc(cmd)}" data-tip="${esc('Perintah PowerShell untuk membuka Claude dengan akun ini\n' + cmd)}">${icon('terminal', 'ic-sm')}Salin perintah terminal</button>`}
      ${p.isDefault ? '' : `<button class="btn ghost sm danger" data-act="acc-remove" data-v="${esc(p.id)}">${icon('x', 'ic-sm')}Hapus</button>`}
    </div>
  </article>`;
}

function accountForm() {
  const f = S.accounts.form;
  return `<div class="acc-form" data-key="acc-form">
    <div class="acc-form-title">${icon('plus', 'ic-sm')}Akun baru</div>
    <div class="cmp-row">
      <label class="cmp-field"><span>Nama</span><span class="field">${icon('user', 'ic-sm')}<input type="text" data-act="acc-name" value="${esc(f.name)}" placeholder="mis. Pribadi" maxlength="40" autocomplete="off"></span></label>
      <label class="cmp-field acc-dir-field"><span>Folder</span><span class="field">${icon('folder', 'ic-sm')}<input type="text" data-act="acc-dir" value="${esc(f.dir)}" spellcheck="false" autocomplete="off"></span></label>
    </div>
    <p class="cmp-hint">Folder dibuat kalau belum ada. Login, setelan, dan riwayat akun ini tersimpan di sana, terpisah dari akun lain. Setelah ditambahkan, klik <b>Login</b>.</p>
    ${f.error ? `<div class="cmp-error">${icon('alert', 'ic-sm')}<span>${esc(f.error)}</span></div>` : ''}
    <div class="acc-form-foot"><button class="btn" data-act="acc-add-cancel">Batal</button><button class="btn primary" data-act="acc-add-save"${f.busy || !f.name.trim() || !f.dir.trim() ? ' disabled' : ''}>${icon(f.busy ? 'loader' : 'plus', 'ic-sm' + (f.busy ? ' spin' : ''))}Tambah akun</button></div>
  </div>`;
}

function renderAccounts() {
  const modal = $('#modal');
  const list = profiles();
  patch(modal, `
    <div class="modal-backdrop" data-act="accounts-close"></div>
    <section class="modal-panel accounts" role="dialog" aria-modal="true" aria-labelledby="acc-title">
      <header class="cmp-head">
        <span class="cmp-ic">${icon('users', 'ic-lg')}</span>
        <div class="cmp-titles"><h2 id="acc-title">Akun Claude</h2><p>Setiap akun punya folder Claude sendiri, jadi semuanya tetap login bersamaan.</p></div>
        <button class="btn ghost icon-btn" data-act="accounts-close" aria-label="Tutup">${icon('x', 'ic-sm')}</button>
      </header>
      <div class="cmp-body">
        <div class="acc-list">${list.map(accountCard).join('')}</div>
        ${S.accounts.form ? accountForm() : `<button class="btn acc-add" data-key="acc-add" data-act="acc-add">${icon('plus', 'ic-sm')}Tambah akun</button>`}
        <p class="cmp-hint acc-note">${icon('swap', 'ic-xs')}<span>Akun <b>aktif</b> dipakai untuk prompt baru dari kanban, dan limitnya tampil di sidebar. Lanjutan sesi selalu memakai akun sesi itu. Terminal tetap memakai akun utama, kecuali kamu membukanya dengan <i>Salin perintah terminal</i>.</span></p>
      </div>
    </section>`);
  if (!modal.classList.contains('open')) { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); }
}

async function addAccount() {
  const f = S.accounts && S.accounts.form;
  if (!f || f.busy) return;
  f.busy = true;
  f.error = null;
  renderComposer();
  const r = await api('/api/profiles/add', { name: f.name.trim(), dir: f.dir.trim() });
  if (!S.accounts || S.accounts.form !== f) return;
  f.busy = false;
  if (!r.ok) {
    f.error = r.error || 'Akun gagal ditambahkan.';
    renderComposer();
    return;
  }
  S.accounts.form = null;
  toast({ tone: 'green', icon: 'users', title: `Akun "${f.name.trim()}" ditambahkan`, body: 'Klik Login di kartunya untuk masuk ke akun Claude.', ttl: 5000 });
  scheduleReload();
}
async function sendLoginCode(id) {
  const code = (S.accounts && S.accounts.codes[id]) || '';
  if (!code.trim()) return;
  const r = await api('/api/profiles/login-input', { id, text: code });
  if (r.ok && S.accounts) S.accounts.codes[id] = '';
  if (!r.ok) toast({ tone: 'red', icon: 'alert', title: 'Kode tidak terkirim', body: r.error });
  scheduleReload();
}

// Toasts for logins that finish while the page is open.
function detectProfileChanges(ov) {
  const cur = new Map((ov.profiles || []).map((p) => [p.id, { running: !!(p.login && p.login.running), name: p.name, login: p.login, account: p.account }]));
  const prev = S.prevProfiles;
  S.prevProfiles = cur;
  if (!prev) return;
  for (const [id, p] of cur) {
    const was = prev.get(id);
    if (!was || !was.running || p.running) continue;
    if (p.login && p.login.ok) toast({ tone: 'green', icon: 'checkc', title: `Akun "${p.name}" berhasil login`, body: (p.account && p.account.data && p.account.data.email) || '', ttl: 6000 });
    else toast({ tone: 'red', icon: 'alert', title: `Login akun "${p.name}" gagal`, body: (p.login && p.login.error) || '' });
  }
}
function accountInline() {
  const d = S.overview && S.overview.account && S.overview.account.data;
  if (!d || !d.loggedIn || !d.email) return '';
  return `<span class="usage-acct" data-tip="${esc(accountTip(d))}">${icon('user', 'ic-xs')}<span>${esc(d.email)}${d.orgName ? ` · ${esc(d.orgName)}` : ''}</span></span>`;
}

/* ---------- tokens (from transcripts) ---------- */
// Counts arrive as [input, output, cache write, cache read].
const TOK_PARTS = ['Input baru', 'Output', 'Tulis cache', 'Baca cache'];
const tokSum = (v) => (v ? v[0] + v[1] + v[2] + v[3] : 0);
const num = (n) => Math.round(n || 0).toLocaleString('id-ID');
// Indonesian short scale: rb (ribu), jt (juta), M (miliar).
function fmtTok(n) {
  n = n || 0;
  const f = (x, unit) => `${x.toLocaleString('id-ID', { maximumFractionDigits: x < 100 ? 1 : 0 })}\u00a0${unit}`;
  if (n >= 1e9) return f(n / 1e9, 'M');
  if (n >= 1e6) return f(n / 1e6, 'jt');
  if (n >= 1e3) return f(n / 1e3, 'rb');
  return num(n);
}
function tokTip(v, head = 'Token') {
  return [`${head}: ${num(tokSum(v))} token`, ...TOK_PARTS.map((l, i) => `${l}: ${num(v[i])}`)].join('\n');
}
// claude-opus-4-7 → Opus 4.7; anything else keeps its id minus the claude- prefix.
function modelShort(m) {
  const x = String(m || '?').match(/^claude-([a-z]+)-(\d+)(?:-(\d{1,2}))?(?!\d)/);
  if (!x) return String(m || '?').replace(/^claude-/, '');
  return `${x[1].charAt(0).toUpperCase() + x[1].slice(1)} ${x[2]}${x[3] ? '.' + x[3] : ''}`;
}

function tokenBars(days) {
  const totals = days.tok.map(tokSum);
  const max = Math.max(1, ...totals);
  const n = totals.length;
  const bars = totals.map((t, i) => {
    const day = addDays(days.start, i);
    const label = new Date(day).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
    const cls = ['tb', t ? '' : 'zero', i === n - 1 ? 'today' : ''].filter(Boolean).join(' ');
    return `<div class="${cls}" data-key="tb:${day}" data-tip="${esc(t ? tokTip(days.tok[i], label) : label + '\nTidak ada pemakaian')}"><i style="height:${t ? Math.max(3, (t / max) * 100).toFixed(1) : 0}%"></i></div>`;
  }).join('');
  const peak = totals.indexOf(Math.max(...totals));
  const peakLabel = totals[peak] ? `puncak ${fmtTok(totals[peak])} · ${new Date(addDays(days.start, peak)).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}` : 'belum ada pemakaian';
  return `<div class="tok-bars" role="img" aria-label="Token per hari, ${n} hari terakhir, ${esc(peakLabel)}">${bars}</div>
    <div class="spark-cap"><span>${new Date(days.start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span><span>${esc(peakLabel)}</span><span>hari ini</span></div>`;
}
function tokRows(rows, total) {
  return `<div class="tok-rows">${rows.map((r) => {
    const pct = total ? (tokSum(r.tok) / total) * 100 : 0;
    const pctLabel = pct >= 10 || pct === 0 ? Math.round(pct) + '%' : pct >= 1 ? pct.toFixed(1).replace('.', ',') + '%' : '<1%';
    return `<div class="tok-row" data-key="tr:${esc(r.key)}" data-tip="${esc(tokTip(r.tok, r.label))}">
      <span class="tr-label${r.mono ? ' mono' : ''}">${esc(r.label)}</span><span class="tr-val">${fmtTok(tokSum(r.tok))}</span><span class="tr-pct">${pctLabel}</span>
      <span class="tr-bar"><i style="width:${Math.max(pct ? 1 : 0, pct).toFixed(1)}%"></i></span>
    </div>`;
  }).join('')}</div>`;
}
function tokensHtml(t, { title = 'Token terpakai', sub = 'semua sesi dan agent di PC ini', key = 'tokens' } = {}) {
  if (!t) return '';
  const total = tokSum(t.all);
  const head = `<header class="usage-head"><span class="usage-ic">${icon('coins', 'ic-sm')}</span><h2 class="section-title">${title}</h2><span class="usage-meta">${esc(sub)}</span></header>`;
  if (!total) return `<section class="usage-card tok-card" data-key="${key}">${head}<div class="usage-msg tone-neutral">${icon('coins', 'ic-sm')}<span>Belum ada pemakaian token yang tercatat.</span></div></section>`;
  const tiles = [['today', 'Hari ini', t.today], ['d7', '7 hari', t.d7], ['d30', '30 hari', t.d30], ['all', 'Semua', t.all]];
  // One row per kind of token, in fixed order; the bar length carries the share, so one hue is enough.
  const parts = TOK_PARTS.map((label, i) => ({ key: 'p' + i, label, tok: [0, 0, 0, 0].map((_, j) => (j === i ? t.all[i] : 0)) }));
  let models = (t.models || []).map((m) => ({ key: m.model, label: modelShort(m.model), tok: m.tok }));
  if (models.length > 5) {
    const rest = models.slice(4).reduce((acc, m) => acc.map((x, i) => x + m.tok[i]), [0, 0, 0, 0]);
    models = [...models.slice(0, 4), { key: 'other', label: `${models.length - 4} model lain`, tok: rest }];
  }
  return `<section class="usage-card tok-card" data-key="${key}">
    ${head}
    <div class="tok-tiles">${tiles.map(([k, l, v]) => `<div class="tok-tile" data-key="tt:${k}" data-tip="${esc(tokTip(v, l))}">
      <span class="tt-label">${l}</span><b>${fmtTok(tokSum(v))}</b><span class="tt-sub">output ${fmtTok(v[1])} · input baru ${fmtTok(v[0])}</span>
    </div>`).join('')}</div>
    <div class="tok-lower">
      <div class="tok-panel tp-chart"><div class="tp-head"><span>Per hari</span><span>${t.days.tok.length} hari terakhir</span></div>${tokenBars(t.days)}</div>
      <div class="tok-panel"><div class="tp-head"><span>Komposisi</span><span>semua waktu</span></div>${tokRows(parts, total)}</div>
      <div class="tok-panel"><div class="tp-head"><span>Per model</span><span>semua waktu</span></div>${tokRows(models, total)}</div>
    </div>
    <p class="tok-note">${icon('alert', 'ic-xs')}<span><b>Baca cache</b> adalah konteks percakapan yang dibaca ulang di setiap giliran, jadi angkanya paling besar. Angka dihitung dari transcript. Panggilan internal CLI (misalnya compact dan judul otomatis) tidak tercatat di sana, jadi angkanya bisa sedikit di bawah hitungan CLI.</span></p>
  </section>`;
}

/* ---------- overview ---------- */
function overviewHtml() {
  const ov = S.overview;
  if (!ov) return skeletonOverview();
  const k = ov.kpi;
  const kpi = (ic, value, label, tone, hot) => `<div class="kpi tone-${tone}${hot ? ' hot' : ''}" data-key="kpi:${ic}"><span class="kpi-ic">${icon(ic, 'ic-lg')}</span><div class="kpi-text"><b>${value}</b><span>${label}</span></div></div>`;
  const projects = ov.projects.slice().sort((a, b) => (b.working || b.waiting ? 1 : 0) - (a.working || a.waiting ? 1 : 0) || b.lastTs - a.lastTs);
  return `
  <header class="page-head">
    <div><h1 class="page-title">Semua project</h1><p class="page-sub">Apa yang sedang dikerjakan Claude Code dan agent-nya di PC ini, secara live.</p></div>
    <div class="head-right">${livePill()}<a class="btn" href="#/3d" title="Lihat sesi dan agent sebagai kantor 3D">${icon('cube', 'ic-sm')}Kantor 3D</a><button class="btn primary" data-act="compose" title="Tulis prompt (N)">${icon('message', 'ic-sm')}Prompt baru</button></div>
  </header>
  ${usageHtml()}
  ${tokensHtml(ov.tokens)}
  <section class="kpis">
    ${kpi('zap', k.working, 'Sesi bekerja', 'green')}
    ${kpi('user', k.waiting, 'Menunggu kamu', 'amber', k.waiting > 0)}
    ${kpi('bot', k.agents, 'Agent berjalan', 'purple')}
    ${kpi('checkc', k.todayDone, 'Task selesai hari ini', 'orange')}
    ${kpi('message', k.todayPrompts, 'Request hari ini', 'blue')}
  </section>
  <div class="ov-grid">
    <div>
      <div class="section-head"><h2 class="section-title">Sedang berjalan</h2><span class="count-pill">${ov.active.length}</span></div>
      ${ov.active.length ? `<div class="now-grid">${ov.active.map((a) => nowCard(a)).join('')}</div>` : emptyState('terminal', 'Tidak ada sesi yang sedang berjalan', 'Jalankan <code>claude</code> di terminal mana pun, dan sesinya langsung muncul di sini.')}
      <div class="section-head" style="margin-top:30px"><h2 class="section-title">Project</h2><span class="count-pill">${ov.projects.length}</span></div>
      <div class="proj-grid">${projects.map(projCard).join('')}</div>
    </div>
    <aside class="feed">${feedHtml(ov.feed)}</aside>
  </div>`;
}

function nowCard(a, compact) {
  const now = Date.now();
  const since = a.status === 'working'
    ? (a.request ? `bekerja ${dur(now - a.request.ts)}` : '')
    : (a.lastTurnEnd ? `menunggu ${dur(now - a.lastTurnEnd)}` : '');
  const agents = a.agents.map((g) => `
    <div class="sub-row" data-key="ag:${esc(g.id)}" data-card="${esc(a.sessionId + ':a' + g.id)}" data-project="${esc(a.projectKey)}">
      <span class="sub-ic tone-purple">${icon('bot', 'ic-sm')}</span>
      <span class="sub-title">${esc(g.description)}</span>
      <span class="sub-meta">${esc(g.type)} · ${dur(now - g.startTs)}</span>
      <span class="sub-act">${g.activity ? `${icon(toolIcon(g.activity.tool), 'ic-xs')}<span>${esc(g.activity.text || g.activity.tool)}</span>` : '<span>memulai…</span>'}</span>
    </div>`).join('');
  const bg = a.bg.map((b) => `
    <div class="sub-row" data-key="bg:${esc(b.id)}">
      <span class="sub-ic tone-teal">${icon('cpu', 'ic-sm')}</span>
      <span class="sub-title">${esc(b.description)}</span>
      <span class="sub-meta">${dur(now - b.startTs)}</span>
      <span class="sub-act"><span>proses background</span></span>
    </div>`).join('');
  const subHead = [a.agents.length ? `${a.agents.length} agent` : '', a.bg.length ? `${a.bg.length} background` : ''].filter(Boolean).join(' · ');
  const tone = STATUS[a.status].tone;
  return `<article class="now-card tone-${tone}${compact ? ' compact' : ''}" data-key="now:${esc(a.sessionId)}"${compact ? '' : ` data-href="${projectHref(a.projectKey)}"`}>
    <header class="now-head">
      ${compact ? '' : `<span class="avatar" style="--pc:${hashColor(a.projectKey)}">${esc(initials(a.projectName))}</span>`}
      <div class="now-titles">
        <div class="now-proj">${esc(compact ? 'Sesi live' : a.projectName)}${profTag(a.profile)}</div>
        <div class="now-title">${esc(a.title)}</div>
      </div>
      <div class="now-status">${pill(a.status, a.starting ? 'Memulai…' : needsLabel(a.needs))}<span class="now-since">${since}</span></div>
    </header>
    ${a.needs ? `<div class="needs-row tone-amber">${icon('alert', 'ic-sm')}<span>Claude menunggu jawabanmu di terminal sesi ini (<b>${esc(a.needs)}</b>).</span></div>` : ''}
    ${a.request && a.starting ? `<div class="quote tone-blue"><div class="q-label">${icon('play', 'ic-xs')} Dikirim dari kanban · ${ago(a.request.ts)}</div><div class="q-text">${esc(a.request.text)}</div></div>` : ''}
    ${a.request && !a.starting ? `<div class="quote tone-blue" data-card="${esc(a.sessionId + ':p' + a.request.id)}" data-project="${esc(a.projectKey)}"><div class="q-label">${icon('message', 'ic-xs')} Request kamu · ${ago(a.request.ts)}</div><div class="q-text">${esc(a.request.text)}</div></div>` : ''}
    ${a.lastText ? `<div class="quote tone-amber"><div class="q-label">${icon('sparkle', 'ic-xs')} Claude terakhir bilang</div><div class="q-text">${esc(plain(a.lastText.text))}</div></div>` : ''}
    ${a.status === 'working' && a.activity ? activityRow(a.activity, 'Sekarang') : ''}
    ${a.job && a.job.detail ? `<div class="act-row"><span class="act-ic">${icon('layers', 'ic-sm')}</span><span class="act-text">${esc(a.job.detail)}</span></div>` : ''}
    ${a.checklist.length ? `<div class="now-sec"><div class="now-sec-head"><span>Progress</span><span class="num">${a.progress.done}/${a.progress.total} · ${Math.round((a.progress.done / a.progress.total) * 100)}%</span></div>${progressBar(a.progress)}${checklistHtml(a.checklist)}</div>` : ''}
    ${agents || bg ? `<div class="sub-block"><div class="now-sec-head"><span>${subHead} berjalan</span></div>${agents}${bg}</div>` : ''}
    ${a.starting ? '' : `<div class="now-actions"><button class="btn sm" data-act="compose" data-project="${esc(a.projectKey)}" data-session="${esc(a.sessionId)}">${icon('message', 'ic-sm')}Kirim prompt</button>${a.managed ? '<span class="board-tag">dari kanban</span>' : ''}${tokSum(a.tokens) ? `<span class="tok-chip" data-tip="${esc(tokTip(a.tokens, 'Token sesi ini (termasuk agent)'))}">${icon('coins', 'ic-xs')}${fmtTok(tokSum(a.tokens))}</span>` : ''}</div>`}
  </article>`;
}

function feedHtml(feed) {
  let body = '';
  let lastDay = null;
  for (const e of feed) {
    const dk = dayStart(e.ts);
    if (dk !== lastDay) { body += `<div class="feed-day" data-key="fd:${dk}">${dayLabel(e.ts)}</div>`; lastDay = dk; }
    const m = FEED[e.type] || FEED.prompt;
    body += `<div class="feed-row" data-key="fe:${esc(e.id)}" data-card="${esc(e.card || '')}" data-project="${esc(e.projectKey)}">
      <span class="feed-ic tone-${m.tone}">${icon(m.icon, 'ic-sm')}</span>
      <div>
        <div class="feed-line"><b>${esc(e.projectName)}</b> <span class="feed-verb">${m.verb}</span></div>
        ${e.text ? `<div class="feed-text">${esc(plain(e.text))}</div>` : ''}
        <div class="feed-meta">${clock(e.ts)} · ${esc(trim(e.sessionTitle, 44))}</div>
      </div>
    </div>`;
  }
  return `<div class="feed-head">${icon('activity', 'ic-sm')}<h2 class="section-title">Aktivitas terbaru</h2>${S.connected ? '<span class="live-dot tone-green" title="Live"></span>' : ''}</div>
    <div class="feed-body">${body || `<div style="padding:12px">${emptyState('activity', 'Belum ada aktivitas', 'Aktivitas 2 hari terakhir dari semua project muncul di sini.')}</div>`}</div>`;
}

function sparkline(sp) {
  const n = sp.minutes.length;
  const max = Math.max(60, ...sp.minutes);
  const w = 100 / n;
  const bars = sp.minutes.map((m, i) => {
    const h = m ? Math.max(10, (m / max) * 100) : 5;
    const day = addDays(sp.start, i);
    const label = new Date(day).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    const cls = [m ? 'on' : '', i === n - 1 ? 'today' : ''].join(' ').trim();
    return `<rect x="${(i * w + w * 0.14).toFixed(2)}" y="${(100 - h).toFixed(2)}" width="${(w * 0.72).toFixed(2)}" height="${h.toFixed(2)}" rx="1.4"${cls ? ` class="${cls}"` : ''} data-tip="${esc(label + '\n' + (m ? minutesLabel(m) + ' aktivitas (termasuk agent)' : 'Tidak ada aktivitas'))}"/>`;
  }).join('');
  return `<svg class="spark" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Aktivitas 14 hari terakhir">${bars}</svg>`;
}

function projCard(p) {
  const st = p.working ? 'working' : p.waiting ? 'waiting' : 'ended';
  const prog = p.current || p.progress;
  const right = st === 'ended' ? `<span class="pc-when">${ago(p.lastTs)}</span>` : pill(st, st === 'working' && p.working > 1 ? `${p.working} bekerja` : null);
  return `<a class="proj-card" data-key="pc:${esc(p.key)}" href="${projectHref(p.key)}">
    <div class="pc-top">
      <span class="avatar" style="--pc:${hashColor(p.key)}">${esc(initials(p.name))}</span>
      <div class="pc-titles"><div class="pc-name">${esc(p.name)}</div><div class="pc-path">${esc(shortPath(p.path, 46))}</div></div>
      ${right}
    </div>
    ${p.headline ? `<div class="pc-headline">${esc(p.headline)}</div>` : ''}
    <div class="pc-spark">${sparkline(p.spark)}<div class="spark-cap"><span>14 hari lalu</span><span>hari ini</span></div></div>
    <div class="pc-foot">
      ${prog && prog.total ? `<span>${ring(prog.pct, 18, 3)} ${prog.done}/${prog.total} task ${p.current ? 'saat ini' : '· 7 hari'}</span>` : '<span class="muted">Belum ada task</span>'}
      ${tokSum(p.tokens && p.tokens.all) ? `<span data-tip="${esc(tokTip(p.tokens.all, 'Token project') + '\nHari ini: ' + num(tokSum(p.tokens.today)))}">${icon('coins', 'ic-xs')} ${fmtTok(tokSum(p.tokens.all))}</span>` : ''}
      <span class="push">${icon('layers', 'ic-xs')} ${p.sessionCount} sesi</span>
      ${p.runningAgents ? `<span style="color:var(--purple)">${icon('bot', 'ic-xs')} ${p.runningAgents}</span>` : ''}
    </div>
  </a>`;
}

/* ---------- Kantor 3D ---------- */
function officeHtml() {
  const ov = S.overview;
  const k = ov ? ov.kpi : { working: 0, waiting: 0, agents: 0 };
  const bg = ov ? ov.active.reduce((n, a) => n + a.bg.length, 0) : 0;
  const stat = (tone, n, label) => `<span class="o3d-stat tone-${tone}"><span class="dot"></span><b class="num">${n}</b>${label}</span>`;
  const tog = (act, on, ic, label) => `<button class="btn sm${on ? ' on' : ''}" data-act="${act}" aria-pressed="${on}">${icon(ic, 'ic-sm')}<span>${label}</span></button>`;
  let overlay = '';
  if (S.o3dError) overlay = `<div class="o3d-msg" data-key="o3d-msg">${emptyState('alert', 'Tampilan 3D tidak bisa dibuka', `Browser ini tidak menyediakan WebGL (${esc(S.o3dError)}). Coba aktifkan akselerasi hardware di pengaturan browser.`)}</div>`;
  else if (!ov) overlay = `<div class="o3d-msg" data-key="o3d-msg"><div class="skel" style="width:220px;height:16px"></div></div>`;
  else if (!ov.active.length) overlay = `<div class="o3d-note" data-key="o3d-note">${icon('terminal', 'ic-sm')}<span>Belum ada sesi yang berjalan, jadi kantornya masih sepi. Jalankan <code>claude</code> di terminal atau kirim prompt, dan robotnya langsung duduk bekerja.</span></div>`;
  return `
  <header class="page-head">
    <div><h1 class="page-title">Kantor 3D</h1><p class="page-sub">Tiap robot adalah sesi Claude Code, tiap drone ungu adalah agent yang sedang jalan. Robot yang menoleh ke kamu sedang menunggu balasanmu.</p></div>
    <div class="head-right">${livePill()}<button class="btn primary" data-act="compose" title="Tulis prompt (N)">${icon('message', 'ic-sm')}Prompt baru</button></div>
  </header>
  <div class="o3d-wrap" data-key="o3d-wrap">
    <div class="o3d-stage" data-key="o3d-stage" data-keep></div>
    <div class="o3d-hud o3d-top" data-key="o3d-top">
      <div class="o3d-stats">${stat('green', k.working, 'bekerja')}${stat('amber', k.waiting, 'menunggu kamu')}${stat('purple', k.agents, 'agent')}${bg ? stat('teal', bg, 'background') : ''}</div>
      <div class="o3d-ctrl">
        ${tog('o3d-rotate', S.ui.o3dRotate, 'rotate', 'Putar')}
        ${tog('o3d-labels', S.ui.o3dLabels, 'tag', 'Label agent')}
        <button class="btn sm" data-act="o3d-fit" title="Tampilkan semua project">${icon('grid', 'ic-sm')}<span>Semua</span></button>
        <button class="btn sm icon-btn" data-act="o3d-full" title="Layar penuh" aria-label="Layar penuh">${icon('expand', 'ic-sm')}</button>
      </div>
    </div>
    <div class="o3d-hud o3d-legend" data-key="o3d-legend">
      <span><i class="sw tone-green"></i>Bekerja</span><span><i class="sw tone-amber"></i>Menunggu kamu</span><span><i class="sw tone-blue"></i>Memulai</span><span><i class="sw round tone-purple"></i>Agent</span><span><i class="sw tone-teal"></i>Background</span>
      <span class="o3d-hint">Seret untuk memutar · scroll untuk zoom · klik robot untuk detail · klik 2x untuk buka terminal + /resume</span>
    </div>
    ${overlay}
  </div>`;
}

// The Three.js scene loads on first visit and is torn down when you leave the view, so other pages pay nothing for it.
let office = null, officeLoad = null;
const officeData = () => ({ active: S.overview.active, projects: S.overview.projects });
function syncOffice() {
  const el = S.route.view === '3d' ? $('#main .o3d-stage') : null;
  if (office && office.el !== el) { office.dispose(); office = null; }
  if (!el) return;
  if (office) { if (S.overview) office.update(officeData()); return; }
  if (officeLoad || S.o3dError) return;
  officeLoad = import('/office3d.js').then((m) => {
    officeLoad = null;
    const stage = S.route.view === '3d' ? $('#main .o3d-stage') : null;
    if (!stage || office) return;
    office = m.createOffice(stage, { esc, color: hashColor, ago: agoShort, onOpen: goToCard, onTerminal: openTerminal });
    office.setAutoRotate(S.ui.o3dRotate);
    office.setAgentLabels(S.ui.o3dLabels);
    if (S.overview) office.update(officeData());
  }).catch((e) => {
    officeLoad = null;
    S.o3dError = (e && e.message) || String(e);
    console.warn('Kantor 3D:', e);
    render();
  });
}

// Opens a terminal window in the project running `claude --resume` on its newest free session.
let terminalBusy = 0;
async function openTerminal(projectKey, sessionId) {
  if (Date.now() - terminalBusy < 1500) return;
  terminalBusy = Date.now();
  const p = (S.overview.projects || []).find((x) => x.key === projectKey);
  const name = p ? p.name : 'project';
  const r = await api('/api/terminal', { projectKey, sessionId });
  if (!r.ok) { toast({ tone: 'red', icon: 'alert', title: `Terminal gagal dibuka · ${name}`, body: r.error || 'Coba lagi.', ttl: 10000 }); return; }
  const body = r.mode === 'resume'
    ? `claude --resume: ${r.title}` + (r.skipped ? '. Sesi yang kamu klik masih terbuka di terminal lain, jadi yang dilanjutkan sesi terakhir yang bebas.' : '')
    : 'Belum ada sesi yang bisa dilanjutkan, jadi terminal membuka sesi Claude baru.';
  toast({ tone: 'green', icon: 'terminal', title: `Terminal dibuka · ${name}`, body, ttl: r.skipped ? 11000 : 7000 });
}

function skeletonOverview() {
  return `<header class="page-head"><div><div class="skel" style="width:240px;height:32px"></div><div class="skel" style="width:380px;height:14px;margin-top:12px"></div></div></header>
    <section class="kpis">${'<div class="skel" style="height:72px"></div>'.repeat(5)}</section>
    <div class="now-grid">${'<div class="skel" style="height:230px"></div>'.repeat(3)}</div>`;
}

/* ---------- project page ---------- */
function projectPageHtml() {
  const P = S.project;
  if (!P) {
    if (S.overview && !S.overview.projects.some((p) => p.key === S.route.key)) {
      return `<div class="crumbs"><a href="#/">${icon('arrowL', 'ic-sm')} Semua project</a></div>${emptyState('folder', 'Project tidak ditemukan', 'Project ini tidak punya sesi Claude Code yang terbaca.')}`;
    }
    return `<div class="skel" style="height:56px;width:420px;margin:30px 0 22px"></div><div class="skel" style="height:40px;margin-bottom:16px"></div><div class="board">${'<div class="skel" style="height:420px"></div>'.repeat(4)}</div>`;
  }
  const s = P.summary;
  const st = s.working ? 'working' : s.waiting ? 'waiting' : 'ended';
  const tab = S.ui.tab;
  const tabs = TABS.map(([k, l, ic], i) => `<a class="tab${tab === k ? ' active' : ''}" data-key="tab:${k}" href="${projectHref(s.key, k)}">${icon(ic, 'ic-sm')}<span>${l}</span>${k === 'sessions' ? `<span class="tab-count">${P.sessions.length}</span>` : ''}<kbd>${i + 1}</kbd></a>`).join('');
  const body = tab === 'timeline' ? timelineHtml() : tab === 'sessions' ? sessionsHtml() : kanbanHtml();
  const prog = s.progress;
  return `
  <div class="crumbs"><a href="#/">${icon('arrowL', 'ic-sm')} Semua project</a><span class="head-right">${livePill()}<button class="btn primary" data-act="compose" data-project="${esc(s.key)}" title="Tulis prompt (N)">${icon('message', 'ic-sm')}Prompt baru</button></span></div>
  <header class="ph">
    <span class="avatar xl" style="--pc:${hashColor(s.key)}">${esc(initials(s.name))}</span>
    <div style="min-width:0">
      <h1 class="page-title">${esc(s.name)} ${pill(st, st === 'working' && s.working > 1 ? `${s.working} sesi bekerja` : null)}</h1>
      <div class="ph-path"><span class="mono" title="${esc(s.path)}">${esc(s.path)}</span><button class="btn ghost sm icon-btn" data-act="copy" data-v="${esc(s.path)}" title="Salin path" aria-label="Salin path">${icon('copy', 'ic-xs')}</button></div>
    </div>
    <div class="ph-stats">
      ${prog.total
        ? `<div class="stat">${ring(prog.pct, 38, 5)}<div class="stat-text"><b>${prog.pct}%</b><span>${prog.done}/${prog.total} task · 7 hari</span></div></div>`
        : `<div class="stat tone-orange"><span class="stat-ic">${icon('checksq', 'ic-sm')}</span><div class="stat-text"><b class="small">Belum ada task</b><span>dalam 7 hari</span></div></div>`}
      <div class="stat tone-purple"><span class="stat-ic">${icon('bot', 'ic-sm')}</span><div class="stat-text"><b>${s.runningAgents}</b><span>agent berjalan</span></div></div>
      <div class="stat tone-blue"><span class="stat-ic">${icon('layers', 'ic-sm')}</span><div class="stat-text"><b>${s.sessionCount}</b><span>sesi</span></div></div>
      ${P.tokens ? `<div class="stat tone-teal" data-tip="${esc(tokTip(P.tokens.all, 'Token project ini'))}"><span class="stat-ic">${icon('coins', 'ic-sm')}</span><div class="stat-text"><b>${fmtTok(tokSum(P.tokens.all))}</b><span>token · ${fmtTok(tokSum(P.tokens.today))} hari ini</span></div></div>` : ''}
      <div class="stat tone-neutral"><span class="stat-ic">${icon('clock', 'ic-sm')}</span><div class="stat-text"><b class="small">${ago(s.lastTs)}</b><span>aktivitas terakhir</span></div></div>
    </div>
  </header>
  ${P.active.length ? `<section class="ph-live"><div class="now-grid">${P.active.map((a) => nowCard(a, true)).join('')}</div></section>` : ''}
  <nav class="tabs">${tabs}</nav>
  ${body}`;
}

function sessionSelect() {
  const opts = S.project.sessions
    .map((x) => `<option value="${esc(x.id)}"${S.ui.session === x.id ? ' selected' : ''}>${x.status !== 'ended' ? '● ' : ''}${esc(trim(x.title, 46))} · ${agoShort(x.lastTs)}</option>`)
    .join('');
  return `<label class="field">${icon('layers', 'ic-sm')}<select data-act="session" aria-label="Filter sesi"><option value="all"${S.ui.session === 'all' ? ' selected' : ''}>Semua sesi</option>${opts}</select>${icon('chevD', 'ic-sm after')}</label>`;
}
function rangeSeg(key, values) {
  return `<div class="seg" role="group">${values.map((v) => `<button data-act="${key}" data-v="${v}" class="${S.ui[key] === v ? 'active' : ''}">${RANGE_LABEL[v]}</button>`).join('')}</div>`;
}

/* ---------- kanban ---------- */
function inRange(c) {
  const since = Date.now() - RANGES[S.ui.range];
  if (S.ui.session !== 'all' && c.sessionId !== S.ui.session) return false;
  const live = c.column === 'doing' || c.column === 'waiting';
  return live || (c.updatedTs || c.ts) >= since;
}
function matchesQuery(c) {
  const q = S.ui.q.trim().toLowerCase();
  return !q || (c.title + ' ' + (c.text || '')).toLowerCase().includes(q);
}

function kanbanHtml() {
  const scoped = S.project.cards.filter((c) => inRange(c) && matchesQuery(c));
  const counts = {};
  for (const c of scoped) counts[c.kind] = (counts[c.kind] || 0) + 1;
  const cards = scoped.filter((c) => !CHIP_KINDS.includes(c.kind) || S.ui.kinds[c.kind]);
  const chips = CHIP_KINDS.map((k) => [k, KIND[k]])
    .map(([k, m]) => `<button class="chip tone-${m.tone}${S.ui.kinds[k] ? ' on' : ''}" data-act="kind" data-v="${k}" aria-pressed="${!!S.ui.kinds[k]}">${icon(m.icon, 'ic-xs')}${m.label}<span class="chip-count">${counts[k] || 0}</span></button>`)
    .join('');
  const by = { todo: [], doing: [], waiting: [], done: [] };
  for (const c of cards) (by[c.column] || by.done).push(c);
  // Stable orders: live columns by start time so cards don't jump on every write.
  by.todo.sort((a, b) => a.ts - b.ts);
  by.doing.sort((a, b) => b.ts - a.ts);
  by.waiting.sort((a, b) => b.ts - a.ts);
  by.done.sort((a, b) => (b.endTs || b.updatedTs) - (a.endTs || a.updatedTs));
  const cols = COLS.map((col) => {
    const list = by[col.key];
    let inner = '';
    if (!list.length) inner = `<div class="col-empty" data-key="empty">${icon(col.icon, 'ic-lg')}<span>${col.empty}</span></div>`;
    else if (col.key === 'done') inner = doneColumn(list);
    else inner = list.map(cardHtml).join('');
    const spinning = col.key === 'doing' && list.length ? ' spin' : '';
    return `<section class="col" data-key="col:${col.key}">
      <div class="col-head"><span class="col-ic tone-${col.tone}">${icon(col.icon, 'ic-sm' + spinning)}</span><span class="col-title">${col.label}</span><span class="col-count">${list.length}</span></div>
      <div class="col-body" data-col="${col.key}">${inner}</div>
    </section>`;
  }).join('');
  return `<div class="toolbar">
      ${rangeSeg('range', ['24h', '7d', '30d', 'all'])}
      ${chips}
      <span class="spacer"></span>
      ${sessionSelect()}
      <label class="field">${icon('search', 'ic-sm')}<input type="search" placeholder="Cari kartu…" value="${esc(S.ui.q)}" data-act="q" aria-label="Cari kartu"><kbd>/</kbd></label>
    </div>
    <div class="board">${cols}</div>`;
}

function doneColumn(list) {
  const shown = list.slice(0, S.ui.doneLimit);
  let html = '';
  let lastDay = null;
  for (const c of shown) {
    const ts = c.endTs || c.updatedTs || c.ts;
    const dk = dayStart(ts);
    if (dk !== lastDay) {
      const n = list.filter((x) => dayStart(x.endTs || x.updatedTs || x.ts) === dk).length;
      html += `<div class="day-sep" data-key="day:${dk}">${dayLabel(ts)} <span>${n}</span></div>`;
      lastDay = dk;
    }
    html += cardHtml(c);
  }
  if (list.length > shown.length) html += `<button class="more-btn" data-key="more" data-act="more">Tampilkan ${Math.min(60, list.length - shown.length)} lagi · sisa ${list.length - shown.length}</button>`;
  return html;
}

function segProgress(states) {
  const done = states.filter((s) => s === 'completed').length;
  const bar = states.length <= 14
    ? `<span class="segp">${states.map((s) => `<i class="${s}"></i>`).join('')}</span>`
    : progressBar({ done, total: states.length });
  return `<div class="card-progress">${bar}<span class="num">${done}/${states.length}</span></div>`;
}

function cardTime(c) {
  const now = Date.now();
  if (c.column === 'doing') return c.kind === 'task' && c.startedTs ? `${dur(now - c.startedTs)}` : dur(now - c.ts);
  if (c.column === 'todo') return ago(c.ts);
  if (c.column === 'waiting') return ago(c.updatedTs || c.ts);
  const end = c.endTs || c.updatedTs || c.ts;
  const start = c.kind === 'task' ? c.startedTs : c.ts;
  const took = start && c.endTs && c.endTs > start ? ` · ${dur(c.endTs - start)}` : '';
  return clock(end) + took;
}

function cardHtml(c) {
  const K = KIND[c.kind];
  const live = c.column === 'doing';
  let right = '';
  if (c.stale) right = pill('stale');
  else if (['failed', 'killed', 'stopped'].includes(c.status)) right = pill(c.status);
  else if (live) right = `<span class="live-dot tone-green" title="Sedang berjalan"></span>`;
  else if (c.column === 'waiting') right = pill('waiting');
  if (c.kind === 'agent' && !c.stale) right = `<span class="type-tag">${esc(c.agentType)}</span>` + right;
  let body = '';
  if (c.kind === 'request') {
    if (c.taskStates && c.taskStates.length) body += segProgress(c.taskStates);
    const bits = [];
    if (c.agentCount) bits.push(`${icon('bot', 'ic-xs')}${c.agentCount} agent`);
    if (tokSum(c.tokens)) bits.push(`<span data-tip="${esc(tokTip(c.tokens, c.agentCount ? 'Token request ini (termasuk agent)' : 'Token request ini'))}">${icon('coins', 'ic-xs')}${fmtTok(tokSum(c.tokens))}</span>`);
    if (c.source === 'queued') bits.push(`${icon('clock', 'ic-xs')}diketik saat Claude bekerja`);
    if (c.source === 'board') bits.push(`${icon('play', 'ic-xs')}dari kanban`);
    if (c.needs) bits.push(`<span style="color:var(--amber)">${icon('alert', 'ic-xs')}${esc(needsLabel(c.needs))}</span>`);
    if (bits.length) body += `<div class="card-bits">${bits.map((b) => `<span>${b}</span>`).join('')}</div>`;
  } else if (c.kind === 'task' && c.status === 'in_progress' && !c.stale) {
    body += `<div class="card-act tone-green">${icon('loader', 'ic-xs spin')}<span>${esc(c.activeForm || 'Sedang dikerjakan')}</span></div>`;
  } else if (c.kind === 'agent') {
    if (c.status === 'running' && c.activity) body += `<div class="card-act">${icon(toolIcon(c.activity.tool), 'ic-xs')}<span>${esc(c.activity.text || c.activity.tool)}</span></div>`;
    else if (c.summary || c.result) body += `<div class="card-snippet">${esc(trim(plain(c.summary || c.result), 220))}</div>`;
    if (tokSum(c.tokens)) body += `<div class="card-bits"><span data-tip="${esc(tokTip(c.tokens, 'Token agent ini'))}">${icon('coins', 'ic-xs')}${fmtTok(tokSum(c.tokens))}</span>${c.toolCount ? `<span>${icon('terminal', 'ic-xs')}${c.toolCount} tool call</span>` : ''}</div>`;
  } else if (c.kind === 'bg' && c.text) {
    body += `<div class="card-snippet">${esc(c.text)}</div>`;
  } else if (c.kind === 'queued') {
    body += `<div class="card-act">${icon('clock', 'ic-xs')}<span>Dikirim otomatis setelah giliran sekarang selesai</span></div>`;
  } else if (c.kind === 'run') {
    if (c.column === 'doing') body += `<div class="card-act tone-green">${icon('loader', 'ic-xs spin')}<span>${c.fork ? 'Membuat cabang sesi…' : c.target ? 'Melanjutkan sesi…' : 'Memulai sesi baru…'}</span></div>`;
    else if (c.error) body += `<div class="card-snippet" style="color:var(--red)">${esc(trim(c.error, 220))}</div>`;
  }
  return `<article class="card${live ? ' is-live' : ''}${c.stale ? ' is-stale' : ''}" data-key="${esc(c.id)}" data-card="${esc(c.id)}" tabindex="0">
    <div class="card-top"><span class="kind tone-${K.tone}">${icon(K.icon, 'ic-xs')}${K.label}</span>${right ? `<span class="card-right">${right}</span>` : ''}</div>
    <div class="card-title">${esc(c.title || '(tanpa judul)')}</div>
    ${body}
    <div class="card-foot"><span class="sess-chip" style="--sc:${hashColor(c.sessionId)}" title="${esc(c.sessionTitle)}"><i></i><span>${esc(c.sessionTitle)}</span></span><span class="time">${cardTime(c)}</span></div>
  </article>`;
}

/* ---------- timeline ---------- */
function timelineHtml() {
  const legend = [
    ['tone-blue', 'round', 'Request kamu'],
    ['tone-green', 'striped', 'Sedang berjalan'],
    ['tone-purple', '', 'Agent'],
    ['tone-orange', '', 'Task'],
    ['tone-green', 'round', 'Task selesai'],
    ['tone-amber', 'round', 'Menunggu kamu'],
  ];
  return `<div class="toolbar">
      ${rangeSeg('tlRange', ['6h', '24h', '7d', '30d'])}
      <button class="chip tone-purple${S.ui.tlAgents ? ' on' : ''}" data-act="tlAgents" aria-pressed="${S.ui.tlAgents}">${icon('bot', 'ic-xs')}Agent</button>
      <button class="chip tone-orange${S.ui.tlTasks ? ' on' : ''}" data-act="tlTasks" aria-pressed="${S.ui.tlTasks}">${icon('checksq', 'ic-xs')}Task</button>
      <span class="spacer"></span>
      <button class="btn sm" data-act="tl-all">${icon(S.ui.tlCollapsed.length ? 'chevD' : 'chevR', 'ic-xs')}${S.ui.tlCollapsed.length ? 'Bentangkan semua' : 'Ciutkan semua'}</button>
      ${sessionSelect()}
    </div>
    <div class="tl-card">
      <div class="tl-scroll"><div class="tl" data-key="tl">${timelineSvg()}</div></div>
      <div class="tl-legend">${legend.map(([t, cls, l]) => `<span class="${t}"><i class="${cls}"></i>${l}</span>`).join('')}<span class="muted">Klik nama sesi untuk menciutkan · klik bar untuk detail</span></div>
    </div>`;
}

function timelineSessions() {
  const t0 = Date.now() - RANGES[S.ui.tlRange];
  return S.project.sessions
    .filter((s) => (S.ui.session === 'all' || s.id === S.ui.session) && s.lastTs >= t0)
    .sort((a, b) => (a.status === 'ended') - (b.status === 'ended') || b.firstTs - a.firstTs);
}

function timelineSvg() {
  const now = Date.now();
  const span = RANGES[S.ui.tlRange];
  const t0 = now - span, t1 = now + span * 0.025;
  const W = Math.max(760, Math.floor(S.width - 2));
  const labelW = 270, padR = 16, plotW = W - labelW - padR;
  const x = (t) => +(labelW + ((Math.min(Math.max(t, t0), t1) - t0) / (t1 - t0)) * plotW).toFixed(1);
  const collapsed = new Set(S.ui.tlCollapsed);

  const rows = [];
  for (const s of timelineSessions()) {
    const kids = [];
    if (S.ui.tlAgents) for (const a of s.agents) {
      const end = a.status === 'running' ? now : a.endTs || a.lastTs || a.startTs;
      if (end >= t0 && a.startTs <= t1) kids.push({ type: 'agent', s, item: a, start: a.startTs, end });
    }
    if (S.ui.tlTasks) for (const t of s.tasks) {
      const start = t.startedTs || t.createdTs;
      const end = t.completedTs || (t.status === 'in_progress' && s.status !== 'ended' ? now : start);
      if (end >= t0) kids.push({ type: 'task', s, item: t, start, end });
    }
    kids.sort((a, b) => a.start - b.start);
    rows.push({ type: 'session', s, kids: kids.length, collapsed: collapsed.has(s.id) });
    if (!collapsed.has(s.id)) rows.push(...kids);
  }

  const axisH = 50;
  const rowH = (r) => (r.type === 'session' ? 46 : 28);
  const H = Math.max(140, axisH + rows.reduce((h, r) => h + rowH(r), 0) + 12);
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Timeline sesi, agent dan task">`;
  svg += `<defs><pattern id="tl-stripes" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3.5" height="7" fill="rgba(255,255,255,.3)"/></pattern></defs>`;

  // Day bands with labels, and midnight rules.
  let i = 0;
  for (let d = dayStart(t0); d < t1; d = addDays(d, 1), i++) {
    const de = addDays(d, 1);
    const x1 = x(Math.max(d, t0)), x2 = x(Math.min(de, t1)), w = x2 - x1;
    if (i % 2) svg += `<rect class="day-band" x="${x1}" y="0" width="${w}" height="${H}"/>`;
    const date = new Date(d);
    const label = w > 150 ? date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })
      : w > 70 ? date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
      : w > 22 ? String(date.getDate()) : '';
    if (label) svg += `<text class="day-label" x="${(x1 + x2) / 2}" y="19" text-anchor="middle">${esc(label)}</text>`;
    if (d > t0) svg += `<line class="grid midnight" x1="${x1}" x2="${x1}" y1="6" y2="${H}"/>`;
  }
  // Hour ticks (labels give way to the "sekarang" pill).
  const nx = x(now);
  const step = { '6h': HOUR, '24h': 3 * HOUR, '7d': 6 * HOUR }[S.ui.tlRange];
  if (step) {
    for (let t = dayStart(t0); t <= t1; t += step) {
      if (t < t0 || new Date(t).getHours() === 0) continue;
      const xx = x(t);
      svg += `<line class="grid" x1="${xx}" x2="${xx}" y1="${axisH - 8}" y2="${H}"/>`;
      if (Math.abs(xx - nx) < 50) continue;
      const lab = S.ui.tlRange === '7d' ? String(new Date(t).getHours()).padStart(2, '0') : clock(t);
      svg += `<text class="hour-label" x="${xx}" y="${axisH - 13}" text-anchor="middle">${lab}</text>`;
    }
  }
  svg += `<rect class="label-bg" x="0" y="0" width="${labelW}" height="${axisH}"/>`;
  svg += `<text class="hour-label" x="16" y="${axisH - 13}">${S.ui.tlRange === '30d' ? '30 hari terakhir' : RANGE_LABEL[S.ui.tlRange] + ' terakhir'}</text>`;
  svg += `<line class="axis" x1="0" x2="${W}" y1="${axisH - 0.5}" y2="${axisH - 0.5}"/>`;

  if (!rows.length) {
    svg += `<text class="empty-text" x="${labelW + plotW / 2}" y="${axisH + 50}" text-anchor="middle">Tidak ada aktivitas dalam ${RANGE_LABEL[S.ui.tlRange]} terakhir. Coba rentang yang lebih panjang.</text>`;
  }

  let y = axisH;
  rows.forEach((r, idx) => {
    const h = rowH(r);
    if (r.type === 'session') {
      const s = r.s;
      if (idx > 0) svg += `<line class="sep" x1="0" x2="${W}" y1="${y}" y2="${y}"/>`;
      svg += `<g class="tl-row" style="--sc:${hashColor(s.id)}" data-key="ts:${esc(s.id)}">`;
      svg += `<rect class="tl-hit" x="0" y="${y}" width="${W}" height="${h}"/>`;
      svg += `<g class="tl-toggle" data-act="tl-toggle" data-v="${esc(s.id)}"><rect x="0" y="${y}" width="${labelW - 8}" height="${h}" fill="transparent"/>`;
      if (r.kids) svg += `<g class="tl-chev" transform="translate(9 ${y + 11}) scale(.62)">${I[r.collapsed ? 'chevR' : 'chevD']}</g>`;
      svg += `<rect class="sw" x="27" y="${y + 12}" width="10" height="10" rx="3"/>`;
      svg += `<text class="lane-title" x="44" y="${y + 21}">${esc(trim(s.title, 30))}</text>`;
      const sub = [STATUS[s.status].label, `${s.promptCount} request`, s.progress.total ? `${s.progress.done}/${s.progress.total} task` : '', s.agents.length ? `${s.agents.length} agent` : ''].filter(Boolean).join(' · ');
      svg += `<text class="lane-sub" x="44" y="${y + 36}">${esc(sub)}${r.collapsed && r.kids ? ` · ${r.kids} disembunyikan` : ''}</text></g>`;
      const segs = s.segments.length ? s.segments : [[s.firstTs, s.lastTs]];
      segs.forEach(([a, b], j) => {
        const liveSeg = j === segs.length - 1 && s.status !== 'ended';
        if (liveSeg) b = now;
        if (b < t0 || a > t1) return;
        const x1 = x(a), x2 = Math.max(x(b), x1 + 4);
        const tip = `${s.title}\n${fmt(a)} → ${liveSeg ? 'sekarang' : fmt(b)}\nDurasi ${dur(b - a)}`;
        svg += `<rect class="seg${liveSeg ? ' live' : ''}" x="${x1}" y="${y + 15}" width="${(x2 - x1).toFixed(1)}" height="16" rx="5" data-tip="${esc(tip)}"/>`;
        if (liveSeg) svg += `<rect x="${x1}" y="${y + 15}" width="${(x2 - x1).toFixed(1)}" height="16" rx="5" fill="url(#tl-stripes)" pointer-events="none"/>`;
      });
      if (s.status !== 'ended') svg += `<circle class="cap ${s.status}" cx="${x(now)}" cy="${y + 23}" r="5.5" data-tip="${esc(STATUS[s.status].label)}"/>`;
      for (const p of s.prompts) {
        if (p.ts < t0) continue;
        svg += `<circle class="mk-req" cx="${x(p.ts)}" cy="${y + 15}" r="4" data-tip="${esc(`Request · ${fmt(p.ts)}\n${p.title}`)}" data-card="${esc(s.id + ':p' + p.id)}"/>`;
      }
      svg += `</g>`;
    } else {
      const isA = r.type === 'agent', it = r.item, st = it.status;
      const cardId = `${r.s.id}:${isA ? 'a' : 't'}${it.id}`;
      const running = st === 'running' || (st === 'in_progress' && r.s.status !== 'ended');
      const tip = `${isA ? 'Agent' : 'Task'} · ${(STATUS[st] || {}).label || st}\n${it.title}\n${fmt(r.start)} → ${running ? 'sekarang' : fmt(r.end)}${r.end > r.start ? `\nDurasi ${dur(r.end - r.start)}` : ''}`;
      svg += `<g class="tl-row" data-key="tr:${esc(cardId)}" data-card="${esc(cardId)}">`;
      svg += `<rect class="tl-hit" x="0" y="${y}" width="${W}" height="${h}"/>`;
      svg += `<g class="tl-ic ${isA ? 'tone-purple' : 'tone-orange'}" transform="translate(28 ${y + 7}) scale(.58)">${I[isA ? 'bot' : 'checksq']}</g>`;
      svg += `<text class="child-label" x="46" y="${y + 18}">${esc(trim(it.title, 34))}</text>`;
      const x1 = x(r.start), x2 = Math.max(x(r.end), x1 + 6);
      if (!isA && st === 'pending') {
        svg += `<rect class="bar-pending" x="${x1}" y="${y + 9}" width="${Math.max(x2 - x1, 12).toFixed(1)}" height="10" rx="4" data-tip="${esc(tip)}"/>`;
      } else {
        svg += `<rect class="${isA ? 'bar-agent' : 'bar-task'} st-${st}${running ? ' live' : ''}" x="${x1}" y="${y + 8}" width="${(x2 - x1).toFixed(1)}" height="12" rx="4" data-tip="${esc(tip)}"/>`;
        if (running) svg += `<rect x="${x1}" y="${y + 8}" width="${(x2 - x1).toFixed(1)}" height="12" rx="4" fill="url(#tl-stripes)" pointer-events="none"/>`;
      }
      if (!isA && st === 'completed') svg += `<circle class="mk-done" cx="${x2}" cy="${y + 14}" r="4.5" data-tip="${esc(tip)}"/>`;
      svg += `</g>`;
    }
    y += h;
  });

  svg += `<line class="now-line" x1="${nx}" x2="${nx}" y1="${axisH - 4}" y2="${H}"/>`;
  svg += `<g class="now-pill"><rect x="${nx - 31}" y="${axisH - 19}" width="62" height="17" rx="8.5"/><text x="${nx}" y="${axisH - 7}" text-anchor="middle">sekarang</text></g>`;
  return svg + '</svg>';
}

/* ---------- sessions ---------- */
function sessionsHtml() {
  return `${tokensHtml(S.project.tokens, { title: 'Token project ini', sub: 'semua sesi dan agent project ini', key: 'ptokens' })}<div class="sess-list">${S.project.sessions.map((x) => {
    const facts = [
      ['message', `${x.promptCount} request`],
      x.progress.total ? ['checksq', `${x.progress.done}/${x.progress.total} task`] : null,
      x.agents.length ? ['bot', `${x.agents.length} agent`] : null,
      ['terminal', `${x.toolCount} tool call`],
      tokSum(x.tokens) ? ['coins', `${fmtTok(tokSum(x.tokens))} token`, false, tokTip(x.tokens, 'Token sesi ini (termasuk agent)')] : null,
      x.branch ? ['branch', x.branch, true] : null,
      x.model ? ['cpu', x.model, true] : null,
      ['clock', `${fmt(x.firstTs)} → ${x.status === 'ended' ? fmt(x.lastTs) : 'sekarang'}`],
      x.compactions ? ['layers', `${x.compactions}× compact`] : null,
      x.cost && (x.cost.added || x.cost.removed) ? ['pencil', `+${x.cost.added} / −${x.cost.removed} baris`] : null,
    ].filter(Boolean);
    const summary = x.awaySummary ? x.awaySummary.text : x.lastText ? x.lastText.text : '';
    return `<article class="sess-card" data-key="sc:${esc(x.id)}" style="--sc:${hashColor(x.id)}">
      <div class="sess-top">
        <h3 class="sess-title">${esc(x.title)}</h3>${pill(x.status, needsLabel(x.needs))}${profTag(x.profile)}${x.managed ? '<span class="board-tag">dari kanban</span>' : ''}${x.live && x.live.pid ? `<span class="muted mono">PID ${x.live.pid}</span>` : ''}
        <div class="sess-actions">
          <button class="btn sm primary" data-act="compose" data-project="${esc(S.route.key)}" data-session="${esc(x.id)}">${icon('message', 'ic-sm')}Kirim prompt</button>
          <button class="btn sm" data-act="pick-session" data-v="${esc(x.id)}" data-tab="kanban">${icon('kanban', 'ic-sm')}Kanban</button>
          <button class="btn sm" data-act="pick-session" data-v="${esc(x.id)}" data-tab="timeline">${icon('timeline', 'ic-sm')}Timeline</button>
        </div>
      </div>
      <div class="facts-row">${facts.map(([ic, t, mono, tip]) => `<span${tip ? ` data-tip="${esc(tip)}"` : ''}>${icon(ic, 'ic-xs')}<span class="${mono ? 'mono' : ''}">${esc(t)}</span></span>`).join('')}</div>
      ${x.status !== 'ended' && x.activity ? activityRow(x.activity, 'Sekarang') : ''}
      ${progressRow(x.progress, 'Task')}
      ${summary ? `<div class="sess-summary">${icon('sparkle', 'ic-xs')}<span>${esc(trim(plain(summary), 420))}</span></div>` : ''}
    </article>`;
  }).join('')}</div>`;
}

/* ==========================================================================
   Prompt composer: sends a prompt through the Claude CLI without opening a terminal
   ========================================================================== */
const permLabel = (m) => (PERMISSION_MODES.find((p) => p[0] === m) || [m, m || '–'])[1];
const modelLabel = (m) => (MODELS.find((x) => x[0] === (m || '')) || [m, m])[1];

function composerSessions(key) {
  if (S.project && S.project.summary.key === key) {
    return S.project.sessions.map((x) => ({ id: x.id, title: x.title, status: x.status, needs: x.needs, managed: x.managed, profile: x.profile, liveKind: x.live ? x.live.kind || 'interactive' : null, lastTs: x.lastTs }));
  }
  const p = S.overview && S.overview.projects.find((x) => x.key === key);
  return p ? p.recent || [] : [];
}

// How the prompt will reach Claude, given the chosen target.
function routeInfo(c) {
  const p = S.overview && S.overview.projects.find((x) => x.key === c.projectKey);
  const sess = c.sessionId ? composerSessions(c.projectKey).find((x) => x.id === c.sessionId) : null;
  if (!sess) {
    const prof = profiles().length > 1 ? profileOf(c.profileId || (activeProfile() || {}).id) : null;
    return { tone: 'blue', icon: 'play', fork: false, text: `Membuka sesi baru di <code>${esc(p ? p.path : '?')}</code>${prof ? ` dengan akun <b>${esc(prof.name)}</b>` : ''}. Berjalan di background, progress-nya muncul di kanban ini.` };
  }
  if (c.forceFork || (sess.liveKind && !sess.managed)) {
    return { tone: 'amber', icon: 'branch', fork: true, text: 'Sesi ini sedang terbuka di terminal, jadi kanban tidak mengetik ke sana. Prompt dijalankan sebagai <b>cabang baru</b> yang membawa seluruh riwayat percakapan sesi ini, di background.' };
  }
  if (sess.managed && sess.status === 'working') {
    return { tone: 'accent', icon: 'clock', fork: false, text: 'Kanban sedang menjalankan sesi ini. Prompt masuk <b>antrian</b> dan dikirim otomatis begitu giliran sekarang selesai.' };
  }
  return { tone: 'green', icon: 'message', fork: false, text: 'Melanjutkan sesi ini di background, dengan riwayat percakapan yang sama.' };
}

function openComposer(opts = {}) {
  const projects = (S.overview && S.overview.projects) || [];
  const fallback = projects.find((p) => p.working || p.waiting) || projects[0];
  const projectKey = opts.projectKey || (S.route.view === 'project' ? S.route.key : fallback && fallback.key);
  if (!projectKey) return;
  const sessionId = opts.sessionId && !String(opts.sessionId).startsWith('run:') ? opts.sessionId : '';
  if (S.drawer) closeDrawer();
  S.accounts = null;
  S.composer = { projectKey, sessionId, text: '', sending: false, error: null, forceFork: false, profileId: null };
  renderComposer();
  setTimeout(() => { const ta = $('#modal textarea'); if (ta) ta.focus(); }, 30);
}
function closeComposer() {
  S.composer = null;
  renderComposer();
}

function renderComposer() {
  const modal = $('#modal');
  const c = S.composer;
  if (!c && S.accounts) return renderAccounts();
  if (!c) {
    if (modal.classList.contains('open')) { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); patch(modal, ''); }
    return;
  }
  const projects = ((S.overview && S.overview.projects) || []).slice().sort((a, b) => (b.working || b.waiting ? 1 : 0) - (a.working || a.waiting ? 1 : 0) || b.lastTs - a.lastTs);
  const sessions = composerSessions(c.projectKey);
  const info = routeInfo(c);
  const mode = PERMISSION_MODES.find((m) => m[0] === S.ui.cmpMode) || PERMISSION_MODES[0];
  const sessLabel = (x) => {
    const st = x.liveKind && !x.managed ? 'terbuka di terminal' : x.status === 'working' ? 'sedang bekerja' : x.status === 'waiting' ? 'menunggu' : agoShort(x.lastTs);
    return `${trim(x.title, 48)} · ${st}`;
  };
  patch(modal, `
    <div class="modal-backdrop" data-act="composer-close"></div>
    <section class="modal-panel composer" role="dialog" aria-modal="true" aria-labelledby="cmp-title">
      <header class="cmp-head">
        <span class="cmp-ic">${icon('message', 'ic-lg')}</span>
        <div class="cmp-titles"><h2 id="cmp-title">Kirim prompt ke Claude</h2><p>Dijalankan oleh Claude Code CLI di folder project, tanpa membuka terminal.</p></div>
        <button class="btn ghost icon-btn" data-act="composer-close" aria-label="Tutup">${icon('x', 'ic-sm')}</button>
      </header>
      <div class="cmp-body">
        <div class="cmp-row">
          <label class="cmp-field"><span>Project</span>
            <span class="field">${icon('folder', 'ic-sm')}<select data-act="cmp-project">${projects.map((p) => `<option value="${esc(p.key)}"${p.key === c.projectKey ? ' selected' : ''}>${esc(p.name)} — ${esc(shortPath(parentDir(p.path), 30))}</option>`).join('')}</select>${icon('chevD', 'ic-sm after')}</span>
          </label>
          <label class="cmp-field"><span>Sesi</span>
            <span class="field">${icon('layers', 'ic-sm')}<select data-act="cmp-session"><option value=""${c.sessionId ? '' : ' selected'}>＋ Sesi baru</option>${sessions.map((x) => `<option value="${esc(x.id)}"${x.id === c.sessionId ? ' selected' : ''}>${esc(sessLabel(x))}</option>`).join('')}</select>${icon('chevD', 'ic-sm after')}</span>
          </label>
        </div>
        ${composerAccount(c, sessions)}
        <div class="cmp-route tone-${info.tone}">${icon(info.icon, 'ic-sm')}<span>${info.text}</span></div>
        <textarea data-act="cmp-text" rows="7" placeholder="Tulis prompt untuk Claude…" aria-label="Prompt">${esc(c.text)}</textarea>
        <div class="cmp-row">
          <div class="cmp-field"><span>Izin</span>
            <div class="seg" role="group" aria-label="Mode izin">${PERMISSION_MODES.map(([k, l]) => `<button data-act="cmp-mode" data-v="${k}" class="${S.ui.cmpMode === k ? 'active' : ''}">${l}</button>`).join('')}</div>
          </div>
          <label class="cmp-field"><span>Model</span>
            <span class="field">${icon('cpu', 'ic-sm')}<select data-act="cmp-model">${MODELS.map(([k, l]) => `<option value="${k}"${S.ui.cmpModel === k ? ' selected' : ''}>${l}</option>`).join('')}</select>${icon('chevD', 'ic-sm after')}</span>
          </label>
        </div>
        <p class="cmp-hint">${esc(mode[2])} Aksi yang butuh persetujuanmu ditolak otomatis, karena tidak ada terminal untuk menjawabnya.</p>
        ${c.error ? `<div class="cmp-error">${icon('alert', 'ic-sm')}<span>${esc(c.error)}</span></div>` : ''}
      </div>
      <footer class="cmp-foot">
        <span class="muted"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> untuk kirim</span>
        <button class="btn" data-act="composer-close">Batal</button>
        <button class="btn primary" data-act="cmp-send"${!c.text.trim() || c.sending ? ' disabled' : ''}>${icon(c.sending ? 'loader' : 'play', 'ic-sm' + (c.sending ? ' spin' : ''))}${c.sending ? 'Mengirim…' : info.fork ? 'Kirim sebagai cabang' : 'Kirim'}</button>
      </footer>
    </section>`);
  if (!modal.classList.contains('open')) { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); }
}

// Which account runs the prompt: chosen for a new session, fixed to the session's own otherwise.
function composerAccount(c, sessions) {
  const list = profiles();
  if (list.length < 2) return '';
  const sess = c.sessionId ? sessions.find((x) => x.id === c.sessionId) : null;
  if (sess) {
    const p = profileOf(sess.profile);
    return `<div class="cmp-row"><div class="cmp-field"><span>Akun</span><span class="field static">${icon('user', 'ic-sm')}<span>${esc(p ? p.name : 'Utama')}${p && loggedIn(p) && p.account.data.email ? ` · ${esc(p.account.data.email)}` : ''}</span><span class="muted">akun sesi ini</span></span></div></div>`;
  }
  const chosen = c.profileId || (activeProfile() || {}).id;
  const label = (p) => `${p.name} — ${loggedIn(p) ? p.account.data.email || 'login' : loggedOut(p) ? 'belum login' : 'memeriksa…'}${p.active ? ' (aktif)' : ''}`;
  return `<div class="cmp-row"><label class="cmp-field"><span>Akun</span>
    <span class="field">${icon('user', 'ic-sm')}<select data-act="cmp-profile">${list.map((p) => `<option value="${esc(p.id)}"${p.id === chosen ? ' selected' : ''}${loggedOut(p) ? ' disabled' : ''}>${esc(label(p))}</option>`).join('')}</select>${icon('chevD', 'ic-sm after')}</span>
  </label></div>`;
}

async function sendComposer() {
  const c = S.composer;
  if (!c || c.sending || !c.text.trim()) return;
  const info = routeInfo(c);
  c.sending = true;
  c.error = null;
  renderComposer();
  const res = await api('/api/prompt', {
    projectKey: c.projectKey, sessionId: c.sessionId || null, fork: info.fork,
    prompt: c.text.trim(), permissionMode: S.ui.cmpMode, model: S.ui.cmpModel,
    profileId: c.sessionId ? null : c.profileId || (activeProfile() || {}).id || null,
  });
  if (S.composer !== c) return;
  if (!res.ok) {
    c.sending = false;
    c.error = res.error || 'Gagal mengirim prompt.';
    if (res.data && res.data.code === 'live') c.forceFork = true;
    renderComposer();
    return;
  }
  const p = S.overview && S.overview.projects.find((x) => x.key === c.projectKey);
  const queued = res.data.queued;
  toast({
    tone: queued ? 'accent' : 'green', icon: queued ? 'clock' : 'play',
    title: queued ? 'Prompt masuk antrian' : 'Prompt dikirim ke Claude',
    body: `${p ? p.name : ''} · ${trim(c.text.trim(), 90)}`,
    href: projectHref(c.projectKey, 'kanban'),
  });
  closeComposer();
  scheduleReload();
}

/* ==========================================================================
   Drawer
   ========================================================================== */
function openCard(id) {
  if (!S.project || !S.project.cards.some((k) => k.id === id)) return;
  S.drawer = id;
  renderDrawer();
  const d = $('#drawer');
  d.classList.add('open');
  d.setAttribute('aria-hidden', 'false');
  setTimeout(() => { const b = $('#drawer [data-close].btn'); if (b) b.focus({ preventScroll: true }); }, 50);
}
function closeDrawer() {
  S.drawer = null;
  const d = $('#drawer');
  d.classList.remove('open');
  d.setAttribute('aria-hidden', 'true');
}
function renderDrawer() {
  const c = S.project && S.project.cards.find((k) => k.id === S.drawer);
  if (!c) { if (S.project) closeDrawer(); return; }
  patch($('#drawer-panel'), drawerHtml(c));
}

function linkRow(card, ic, extra = '') {
  return `<div class="link-row ${card.status}" data-card="${esc(card.id)}" data-key="lr:${esc(card.id)}">${ic}<span class="grow">${esc(card.title)}</span>${extra}</div>`;
}

const tokFact = (v, head) => `<span data-tip="${esc(tokTip(v, head))}">${fmtTok(tokSum(v))} <small class="muted">· output ${fmtTok(v[1])}</small></span>`;

function drawerHtml(c) {
  const K = KIND[c.kind];
  const P = S.project;
  const sess = P.sessions.find((s) => s.id === c.sessionId);
  const now = Date.now();
  const facts = [];
  let sections = '';
  const sec = (ic, title, html) => `<section class="dr-sec"><h3>${icon(ic, 'ic-xs')}${title}</h3>${html}</section>`;
  const statusIcon = (st) => (st === 'completed' ? icon('checkc', 'ic-sm') : st === 'in_progress' || st === 'running' ? icon('loader', 'ic-sm spin') : st === 'pending' ? icon('circle', 'ic-sm') : icon('alert', 'ic-sm'));

  if (c.kind === 'request') {
    const promptId = Number(c.id.split(':p')[1]);
    const tasks = P.cards.filter((k) => k.kind === 'task' && k.sessionId === c.sessionId && k.promptId === promptId);
    const agents = P.cards.filter((k) => k.kind === 'agent' && k.sessionId === c.sessionId && k.promptId === promptId);
    facts.push(['Dikirim', fmt(c.ts)], ['Aktivitas terakhir', fmt(c.endTs)], ['Durasi', dur(c.endTs - c.ts)]);
    if (c.progress) facts.push(['Task', `${c.progress.done}/${c.progress.total} selesai`]);
    if (agents.length) facts.push(['Agent', String(agents.length)]);
    if (tokSum(c.tokens)) facts.push(['Token', tokFact(c.tokens, agents.length ? 'Token request ini (termasuk agent)' : 'Token request ini')]);
    if (c.source === 'queued') facts.push(['Dikirim saat', 'Claude sedang bekerja']);
    if (tasks.length) sections += sec('checksq', 'Progress task', `${progressRow(c.progress)}<div class="link-list" style="margin-top:8px">${tasks.map((t) => linkRow(t, statusIcon(t.status))).join('')}</div>`);
    if (agents.length) sections += sec('bot', 'Agent dari request ini', `<div class="link-list">${agents.map((a) => linkRow(a, statusIcon(a.status), `<span class="type-tag">${esc(a.agentType)}</span>`)).join('')}</div>`);
    sections += sec('message', 'Isi request', `<div class="prose">${md(c.text)}</div>`);
  } else if (c.kind === 'task') {
    facts.push(['Dibuat', fmt(c.ts)]);
    if (c.startedTs) facts.push(['Mulai', fmt(c.startedTs)]);
    if (c.endTs) facts.push(['Selesai', fmt(c.endTs)]);
    if (c.endTs && c.startedTs) facts.push(['Lama pengerjaan', dur(c.endTs - c.startedTs)]);
    else if (c.status === 'in_progress' && c.startedTs && !c.stale) facts.push(['Berjalan', dur(now - c.startedTs)]);
    if (c.status === 'in_progress' && c.activeForm && !c.stale) sections += sec('loader', 'Sedang dikerjakan', `<div class="card-act tone-green">${icon('loader', 'ic-sm spin')}<span>${esc(c.activeForm)}</span></div>`);
    if (c.text) sections += sec('file', 'Deskripsi', `<div class="prose">${md(c.text)}</div>`);
    const req = P.cards.find((k) => k.kind === 'request' && k.sessionId === c.sessionId && k.id.endsWith(':p' + c.promptId));
    if (req) sections += sec('message', 'Dari request', `<div class="link-list">${linkRow(req, icon('message', 'ic-sm'))}</div>`);
  } else if (c.kind === 'agent') {
    facts.push(['Tipe', `<code>${esc(c.agentType)}</code>`]);
    if (c.model) facts.push(['Model', `<code>${esc(c.model)}</code>`]);
    facts.push(['Mulai', fmt(c.ts)]);
    if (c.endTs) facts.push(['Selesai', fmt(c.endTs)]);
    facts.push([c.status === 'running' ? 'Berjalan' : 'Durasi', dur((c.endTs || now) - c.ts)]);
    if (c.toolCount) facts.push(['Tool call', String(c.toolCount)]);
    if (tokSum(c.tokens)) facts.push(['Token', tokFact(c.tokens, 'Token agent ini')]);
    if (c.branch) facts.push(['Branch', `<code>${esc(c.branch)}</code>`]);
    if (c.status === 'running' && c.activity) sections += sec('activity', 'Sedang melakukan', activityRow(c.activity));
    if (c.summary) sections += sec('sparkle', 'Ringkasan', `<div class="prose">${md(c.summary)}</div>`);
    if (c.result) sections += sec('checkc', 'Hasil', `<div class="prose">${md(c.result)}</div>`);
    else if (c.lastText) sections += sec('message', 'Pesan terakhir', `<div class="prose">${md(c.lastText.text)}</div>`);
    if (c.worktree) sections += sec('folder', 'Worktree', `<div class="prose mono">${esc(c.worktree)}</div>`);
    if (c.text) sections += `<details class="fold" data-key="fold-prompt"><summary>${icon('chevR', 'ic-xs')}Instruksi untuk agent</summary><div class="prose">${md(c.text)}</div></details>`;
  } else if (c.kind === 'queued') {
    facts.push(['Dibuat', fmt(c.ts)], ['Izin', permLabel(c.permissionMode)], ['Model', modelLabel(c.model)]);
    sections += `<div class="dr-buttons"><button class="btn" data-act="queue-cancel" data-v="${esc(c.queueId)}">${icon('x', 'ic-sm')}Batalkan antrian</button></div>`;
    sections += sec('message', 'Prompt', `<div class="prose">${md(c.text)}</div>`);
  } else if (c.kind === 'run') {
    facts.push(['Mulai', fmt(c.ts)]);
    if (c.endTs) facts.push(['Berakhir', fmt(c.endTs)]);
    facts.push(['Durasi', dur((c.endTs || now) - c.ts)], ['Izin', permLabel(c.permissionMode)], ['Model', modelLabel(c.model)]);
    facts.push(['Cara', c.fork ? 'Cabang (fork) dari sesi' : c.target ? 'Lanjutan sesi' : 'Sesi baru']);
    if (c.column === 'doing') sections += `<div class="dr-buttons"><button class="btn" data-act="run-stop" data-v="${esc(c.runId)}">${icon('x', 'ic-sm')}Hentikan</button></div>`;
    if (c.error) sections += sec('alert', 'Kenapa gagal', `<div class="prose err">${esc(c.error)}</div>`);
    if (c.result) sections += sec('checkc', 'Hasil', `<div class="prose">${md(c.result)}</div>`);
    sections += sec('message', 'Prompt', `<div class="prose">${md(c.text)}</div>`);
  } else {
    facts.push(['Mulai', fmt(c.ts)]);
    if (c.endTs) facts.push(['Selesai', fmt(c.endTs)]);
    facts.push(['Durasi', dur((c.endTs || now) - c.ts)]);
    if (c.text) sections += sec('sparkle', 'Ringkasan', `<div class="prose">${md(c.text)}</div>`);
  }
  // Follow up on the card's own session straight from its details.
  if (sess && ['request', 'task', 'agent'].includes(c.kind)) {
    sections = `<div class="dr-buttons"><button class="btn primary" data-act="compose" data-project="${esc(P.summary.key)}" data-session="${esc(sess.id)}">${icon('message', 'ic-sm')}Kirim lanjutan ke sesi ini</button></div>` + sections;
  }

  return `
  <header class="dr-head">
    <div class="dr-toprow">
      <span class="kind tone-${K.tone}">${icon(K.icon, 'ic-xs')}${K.label}</span>${pill(c.stale ? 'stale' : c.status)}
      <div class="dr-actions">
        <button class="btn ghost icon-btn" data-act="copy-card" title="Salin isi" aria-label="Salin isi">${icon('copy', 'ic-sm')}</button>
        <button class="btn ghost icon-btn" data-close title="Tutup (Esc)" aria-label="Tutup">${icon('x', 'ic-sm')}</button>
      </div>
    </div>
    <h2 class="dr-title">${esc(c.title || '(tanpa judul)')}</h2>
    <div class="dr-sub"><span class="sess-chip" style="--sc:${hashColor(c.sessionId)}"><i></i><span>${esc(c.sessionTitle)}</span></span>${sess ? pill(sess.status) + profTag(sess.profile) : profTag(c.profileId)}</div>
  </header>
  <div class="dr-body">
    <div class="facts-grid">${facts.map(([l, v]) => `<div class="fact"><span>${l}</span><b>${v}</b></div>`).join('')}</div>
    ${sections}
  </div>`;
}

/* ==========================================================================
   Events
   ========================================================================== */
function copyText(text) {
  if (!text) return;
  const done = () => toast({ tone: 'green', icon: 'check', title: 'Disalin ke clipboard', ttl: 2200 });
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => {});
}

function goToCard(project, card) {
  if (S.route.view === 'project' && S.route.key === project) {
    if (card) openCard(card);
    return;
  }
  S.pendingCard = card || null;
  location.hash = projectHref(project, card ? 'kanban' : undefined);
}

document.addEventListener('click', (e) => {
  const t = e.target;
  if (t.closest('[data-close]')) { closeDrawer(); return; }
  const dismiss = t.closest('[data-dismiss]');
  if (dismiss) { dismissToast(Number(dismiss.dataset.dismiss)); return; }
  const toastEl = t.closest('[data-toast]');
  if (toastEl) {
    const tt = S.toasts.find((x) => x.id === Number(toastEl.dataset.toast));
    dismissToast(Number(toastEl.dataset.toast));
    if (tt && tt.project) goToCard(tt.project, tt.card);
    else if (tt && tt.href) location.hash = tt.href;
    return;
  }

  const act = t.closest('[data-act]');
  if (act && act.tagName !== 'SELECT' && act.tagName !== 'INPUT') {
    const v = act.dataset.v;
    switch (act.dataset.act) {
      case 'compose':
        e.preventDefault();
        e.stopPropagation();
        openComposer({ projectKey: act.dataset.project, sessionId: act.dataset.session });
        return;
      case 'composer-close': closeComposer(); return;
      case 'accounts': e.preventDefault(); openAccounts(); return;
      case 'accounts-close': closeAccounts(); return;
      case 'acc-add':
        S.accounts.form = { name: '', dir: suggestDir(''), dirTouched: false, error: null, busy: false };
        renderComposer();
        setTimeout(() => { const i = $('#modal input[data-act=acc-name]'); if (i) i.focus(); }, 30);
        return;
      case 'acc-add-cancel': S.accounts.form = null; renderComposer(); return;
      case 'acc-add-save': addAccount(); return;
      case 'acc-activate':
        api('/api/profiles/active', { id: v }).then((r) => {
          const p = profileOf(v);
          toast(r.ok
            ? { tone: 'green', icon: 'swap', title: `Akun aktif: ${p ? p.name : v}`, body: 'Prompt baru dari kanban memakai akun ini.', ttl: 4000 }
            : { tone: 'red', icon: 'alert', title: 'Gagal mengganti akun', body: r.error });
          scheduleReload();
        });
        return;
      case 'acc-remove': {
        const p = profileOf(v);
        if (!p || !confirm(`Hapus akun "${p.name}" dari kanban?\n\nFolder ${p.dir} beserta login dan riwayatnya tetap ada di disk, dan bisa ditambahkan lagi kapan saja.`)) return;
        api('/api/profiles/remove', { id: v }).then((r) => {
          toast(r.ok ? { tone: 'neutral', icon: 'x', title: `Akun "${p.name}" dihapus dari kanban`, ttl: 3500 } : { tone: 'red', icon: 'alert', title: 'Gagal menghapus akun', body: r.error });
          scheduleReload();
        });
        return;
      }
      case 'acc-login':
        api('/api/profiles/login', { id: v }).then((r) => {
          if (!r.ok) toast({ tone: 'red', icon: 'alert', title: 'Login tidak bisa dimulai', body: r.error });
          scheduleReload();
        });
        return;
      case 'acc-login-cancel': api('/api/profiles/login-cancel', { id: v }).then(scheduleReload); return;
      case 'acc-code-send': sendLoginCode(v); return;
      case 'cmp-send': sendComposer(); return;
      case 'cmp-mode': S.ui.cmpMode = v; saveUi(); renderComposer(); return;
      case 'usage-refresh':
        api('/api/usage/refresh');
        if (S.overview && S.overview.usage) S.overview.usage.loading = true;
        render();
        return;
      case 'queue-cancel':
        api('/api/queue/cancel', { id: v }).then((r) => {
          if (r.ok) { closeDrawer(); toast({ tone: 'neutral', icon: 'x', title: 'Antrian dibatalkan', ttl: 3000 }); scheduleReload(); }
        });
        return;
      case 'run-stop':
        api('/api/runs/stop', { id: v }).then((r) => {
          toast(r.ok ? { tone: 'neutral', icon: 'x', title: 'Prompt dihentikan', ttl: 3000 } : { tone: 'red', icon: 'alert', title: 'Gagal menghentikan', body: r.error });
          scheduleReload();
        });
        return;
      case 'range': S.ui.range = v; S.ui.doneLimit = 40; break;
      case 'tlRange': S.ui.tlRange = v; break;
      case 'kind': S.ui.kinds[v] = !S.ui.kinds[v]; break;
      case 'tlAgents': S.ui.tlAgents = !S.ui.tlAgents; break;
      case 'tlTasks': S.ui.tlTasks = !S.ui.tlTasks; break;
      case 'more': S.ui.doneLimit += 60; break;
      case 'theme': S.ui.theme = v; break;
      case 'tl-toggle': {
        const set = new Set(S.ui.tlCollapsed);
        set.has(v) ? set.delete(v) : set.add(v);
        S.ui.tlCollapsed = [...set];
        break;
      }
      case 'tl-all':
        S.ui.tlCollapsed = S.ui.tlCollapsed.length ? [] : timelineSessions().map((s) => s.id);
        break;
      case 'pick-session':
        S.ui.session = v;
        location.hash = projectHref(S.route.key, act.dataset.tab);
        return;
      case 'copy': copyText(v); return;
      case 'o3d-rotate': S.ui.o3dRotate = !S.ui.o3dRotate; if (office) office.setAutoRotate(S.ui.o3dRotate); break;
      case 'o3d-labels': S.ui.o3dLabels = !S.ui.o3dLabels; if (office) office.setAgentLabels(S.ui.o3dLabels); break;
      case 'o3d-fit': if (office) office.fit(); return;
      case 'o3d-full': {
        const w = $('.o3d-wrap');
        if (document.fullscreenElement) document.exitFullscreen();
        else if (w && w.requestFullscreen) w.requestFullscreen().catch(() => {});
        return;
      }
      case 'copy-card': {
        const c = S.project && S.project.cards.find((k) => k.id === S.drawer);
        if (c) copyText(c.kind === 'agent' ? c.result || c.text || c.title : c.text || c.title);
        return;
      }
      case 'notify':
        if (!S.ui.notify && 'Notification' in window && Notification.permission !== 'granted') {
          Notification.requestPermission().then((perm) => {
            S.ui.notify = perm === 'granted';
            saveUi();
            renderChrome();
            toast(perm === 'granted'
              ? { tone: 'green', icon: 'bell', title: 'Notifikasi aktif', body: 'Kamu dikabari saat Claude menunggu atau agent selesai, ketika tab ini tidak sedang dibuka.' }
              : { tone: 'red', icon: 'bellOff', title: 'Izin notifikasi ditolak', body: 'Aktifkan lewat pengaturan situs di browser.' });
          });
          return;
        }
        S.ui.notify = !S.ui.notify;
        break;
      default: return;
    }
    e.preventDefault();
    saveUi();
    render();
    return;
  }

  const cardEl = t.closest('[data-card]');
  if (cardEl && (cardEl.dataset.card || cardEl.dataset.project)) {
    e.preventDefault();
    const project = cardEl.dataset.project || (S.route.view === 'project' ? S.route.key : null);
    if (project) goToCard(project, cardEl.dataset.card);
    return;
  }
  const hrefEl = t.closest('[data-href]');
  if (hrefEl && !t.closest('a')) location.hash = hrefEl.dataset.href;
});

document.addEventListener('input', (e) => {
  const act = e.target.dataset && e.target.dataset.act;
  if (act === 'cmp-text' && S.composer) {
    const had = !!S.composer.text.trim();
    S.composer.text = e.target.value;
    if (had !== !!S.composer.text.trim()) renderComposer();
  } else if (act === 'q') { S.ui.q = e.target.value; S.ui.doneLimit = 40; render(); }
  else if (act === 'projQ') { S.ui.projQ = e.target.value; renderChrome(); }
  else if (S.accounts && act === 'acc-name' && S.accounts.form) {
    const f = S.accounts.form;
    f.name = e.target.value;
    if (!f.dirTouched) f.dir = suggestDir(f.name);
    renderComposer();
  } else if (S.accounts && act === 'acc-dir' && S.accounts.form) {
    S.accounts.form.dir = e.target.value;
    S.accounts.form.dirTouched = true;
    renderComposer();
  } else if (S.accounts && act === 'acc-code') {
    const had = !!(S.accounts.codes[e.target.dataset.v] || '').trim();
    S.accounts.codes[e.target.dataset.v] = e.target.value;
    if (had !== !!e.target.value.trim()) renderComposer();
  }
});
document.addEventListener('change', (e) => {
  const act = e.target.dataset && e.target.dataset.act;
  if (act === 'session') { S.ui.session = e.target.value; render(); }
  else if (act === 'cmp-project' && S.composer) { S.composer.projectKey = e.target.value; S.composer.sessionId = ''; S.composer.forceFork = false; S.composer.error = null; renderComposer(); }
  else if (act === 'cmp-session' && S.composer) { S.composer.sessionId = e.target.value; S.composer.forceFork = false; S.composer.error = null; renderComposer(); }
  else if (act === 'cmp-model') { S.ui.cmpModel = e.target.value; saveUi(); }
  else if (act === 'cmp-profile' && S.composer) { S.composer.profileId = e.target.value; S.composer.error = null; renderComposer(); }
});
document.addEventListener('keydown', (e) => {
  const el = e.target;
  const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');
  if (S.composer && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendComposer(); return; }
  if (S.accounts && e.key === 'Enter' && el && el.dataset) {
    if (el.dataset.act === 'acc-name' || el.dataset.act === 'acc-dir') { e.preventDefault(); addAccount(); return; }
    if (el.dataset.act === 'acc-code') { e.preventDefault(); sendLoginCode(el.dataset.v); return; }
  }
  if (e.key === 'Escape') {
    if (S.composer) closeComposer();
    else if (S.accounts) closeAccounts();
    else if (S.drawer) closeDrawer();
    else if (typing) el.blur();
    return;
  }
  if (typing || e.ctrlKey || e.metaKey || e.altKey || S.composer || S.accounts) return;
  if (e.key === 'n' || e.key === 'N') {
    e.preventDefault();
    openComposer();
  } else if (e.key === '/') {
    e.preventDefault();
    const input = $('input[data-act=q]') || $('input[data-act=projQ]');
    if (input) input.focus();
  } else if (S.route.view === 'project' && ['1', '2', '3'].includes(e.key)) {
    location.hash = projectHref(S.route.key, TABS[Number(e.key) - 1][0]);
  } else if (e.key === 'Enter' && el && el.matches && el.matches('[data-card]')) {
    goToCard(S.route.key, el.dataset.card);
  }
});

const tip = $('#tooltip');
document.addEventListener('mousemove', (e) => {
  const t = e.target.closest && e.target.closest('[data-tip]');
  if (!t) { tip.hidden = true; return; }
  const [head, ...rest] = t.getAttribute('data-tip').split('\n');
  const html = `<b>${esc(head)}</b>${rest.map((l) => `<div>${esc(l)}</div>`).join('')}`;
  if (tip.innerHTML !== html) tip.innerHTML = html;
  tip.hidden = false;
  const w = tip.offsetWidth, h = tip.offsetHeight;
  const left = Math.min(e.clientX + 14, window.innerWidth - w - 10);
  const top = e.clientY + 18 + h > window.innerHeight ? e.clientY - h - 12 : e.clientY + 18;
  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
});

window.addEventListener('hashchange', () => {
  const before = S.route.view + (S.route.key || '');
  parseRoute();
  closeDrawer();
  if (S.route.view + (S.route.key || '') !== before) window.scrollTo(0, 0);
  render();
  load();
});

let lastWidth = 0;
new ResizeObserver(() => {
  const w = $('#main').clientWidth;
  if (Math.abs(w - lastWidth) < 4) return;
  lastWidth = w;
  if (S.route.view === 'project' && S.ui.tab === 'timeline') render();
}).observe($('#main'));

// Keep relative times and running durations fresh between server updates.
setInterval(() => { if (!document.hidden) render(); }, 15000);

parseRoute();
render();
load();
// ?nolive renders a one-off snapshot (headless screenshots never finish loading with SSE open).
if (!/[?&]nolive\b/.test(location.search)) connect();
else S.connected = true;
