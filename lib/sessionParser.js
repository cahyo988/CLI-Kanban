'use strict';
const path = require('path');
const { SEGMENT_GAP_MS, MAX_PROMPTS, TEXT_LIMIT } = require('./config');

function newState(id) {
  return {
    id,
    cwd: null,
    lastCwd: null,
    branch: null,
    title: null,
    agentName: null,
    version: null,
    model: null,
    firstTs: 0,
    lastTs: 0,
    segments: [],
    promptSeq: 0,
    prompts: [],
    tasks: {},
    todos: {},
    agents: {},
    agentIdx: {},
    bg: {},
    pending: {},
    activity: null,
    lastText: null,
    handback: null,
    turnOpen: false,
    lastTurnEnd: 0,
    cost: null,
    awaySummary: null,
    compactions: 0,
    toolCount: 0,
  };
}

function clip(s, n = TEXT_LIMIT) {
  if (s == null) return '';
  s = String(s);
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function toTs(v) {
  if (!v) return 0;
  const t = typeof v === 'number' ? v : Date.parse(v);
  return Number.isFinite(t) ? t : 0;
}

function touch(st, ts) {
  if (!ts) return;
  if (!st.firstTs || ts < st.firstTs) st.firstTs = ts;
  if (ts > st.lastTs) st.lastTs = ts;
  const segs = st.segments;
  const last = segs[segs.length - 1];
  if (!last || ts - last[1] > SEGMENT_GAP_MS) {
    if (!last || ts > last[1]) segs.push([ts, ts]);
  } else if (ts > last[1]) {
    last[1] = ts;
  }
  const p = st.prompts[st.prompts.length - 1];
  if (p && ts > p.endTs) p.endTs = ts;
}

function currentPromptId(st) {
  const p = st.prompts[st.prompts.length - 1];
  return p ? p.id : null;
}

function describeTool(name, input) {
  if (!input || typeof input !== 'object') return '';
  switch (name) {
    case 'Bash':
    case 'PowerShell':
      return input.description || clip(input.command, 160);
    case 'Read':
    case 'Write':
    case 'Edit':
    case 'NotebookEdit':
      return input.file_path ? path.basename(String(input.file_path)) : '';
    case 'Grep':
    case 'Glob':
      return clip(input.pattern, 120);
    case 'Agent':
    case 'Task':
      return input.description || '';
    case 'WebSearch':
      return clip(input.query, 120);
    case 'WebFetch':
      return clip(input.url, 120);
    case 'TaskCreate':
      return input.subject || '';
    case 'TaskUpdate':
      return `#${input.taskId} → ${input.status || 'update'}`;
    case 'Skill':
      return input.skill || '';
    case 'SubagentHandback':
      return 'Mengirim laporan ke sesi utama';
    case 'TodoWrite': {
      const cur = (input.todos || []).find((t) => t.status === 'in_progress');
      return cur ? cur.activeForm || cur.content : 'update todos';
    }
    default:
      return input.description || input.title || '';
  }
}

// Slash commands that manage the CLI itself rather than ask for work; they never become Request cards.
const HOUSEKEEPING = new Set(['/compact', '/model', '/recap', '/clear', '/config', '/effort', '/fast', '/resume', '/status', '/cost', '/login', '/logout', '/permissions', '/help', '/exit', '/context', '/memory', '/usage', '/mcp', '/plugin', '/theme', '/ide', '/doctor', '/vim', '/rename', '/agents', '/hooks', '/statusline', '/terminal-setup', '/upgrade', '/export', '/release-notes', '/add-dir', '/output-style', '/rewind', '/tasks', '/workflows', '/artifacts', '/bashes']);

const NOTIF_RE = /<task-notification>([\s\S]*?)<\/task-notification>/g;
function tag(body, name) {
  const m = body.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? m[1].trim() : null;
}

function handleNotifications(st, text, ts) {
  let m;
  let found = false;
  NOTIF_RE.lastIndex = 0;
  while ((m = NOTIF_RE.exec(text))) {
    found = true;
    const body = m[1];
    const id = tag(body, 'task-id');
    const status = tag(body, 'status') || 'completed';
    const summary = tag(body, 'summary');
    const result = tag(body, 'result');
    if (!id) continue;
    const agentKey = st.agentIdx[id];
    if (agentKey && st.agents[agentKey]) {
      const a = st.agents[agentKey];
      a.status = status;
      a.endTs = ts;
      if (summary) a.summary = clip(summary, 300);
      if (result) a.result = clip(result, 1500);
    } else if (st.bg[id]) {
      const b = st.bg[id];
      b.status = status;
      b.endTs = ts;
      if (summary) b.summary = clip(summary, 300);
    }
  }
  return found;
}

function textOf(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return null;
  if (content.some((b) => b && b.type === 'tool_result')) return null;
  const parts = content.filter((b) => b && b.type === 'text').map((b) => b.text);
  return parts.length ? parts.join('\n') : null;
}

// Turns a raw user message into the text shown on a Request card, or null when it is
// harness noise rather than something the person typed.
function promptText(text) {
  const t = text.trim();
  if (!t) return null;
  if (t.startsWith('<command-name>') || t.startsWith('<command-message>')) {
    const name = (t.match(/<command-name>([\s\S]*?)<\/command-name>/) || [])[1];
    const args = (t.match(/<command-args>([\s\S]*?)<\/command-args>/) || [])[1];
    if (!name || HOUSEKEEPING.has(name.trim())) return null;
    return `${name.trim()} ${args ? args.trim() : ''}`.trim();
  }
  if (/^<(local-command|system-reminder|bash-|user-memory|task-notification|ide_)/.test(t)) return null;
  if (t.startsWith('/') && HOUSEKEEPING.has(t.split(/\s/)[0])) return null;
  if (t.startsWith('[Request interrupted')) return null;
  if (t.startsWith('Caveat: The messages below')) return null;
  return t;
}

function addPrompt(st, text, ts, source) {
  const last = st.prompts[st.prompts.length - 1];
  if (last && last.text === clip(text) && Math.abs(last.ts - ts) < 5000) return;
  st.prompts.push({ id: ++st.promptSeq, ts, endTs: ts, text: clip(text), source });
  if (st.prompts.length > MAX_PROMPTS) st.prompts.shift();
  st.turnOpen = true;
  st.activity = null;
}

function applyTodoWrite(st, todos, ts) {
  if (!Array.isArray(todos)) return;
  const seen = new Set();
  todos.forEach((t, i) => {
    if (!t || !t.content) return;
    const key = t.content;
    seen.add(key);
    const cur = st.todos[key];
    const status = t.status || 'pending';
    if (!cur) {
      st.todos[key] = {
        id: 'todo:' + key.slice(0, 80),
        subject: clip(t.content, 300),
        activeForm: t.activeForm || null,
        status,
        order: i,
        createdTs: ts,
        updatedTs: ts,
        startedTs: status === 'in_progress' ? ts : 0,
        completedTs: status === 'completed' ? ts : 0,
        promptId: currentPromptId(st),
      };
    } else if (cur.status !== status) {
      cur.status = status;
      cur.updatedTs = ts;
      cur.order = i;
      if (status === 'in_progress' && !cur.startedTs) cur.startedTs = ts;
      if (status === 'completed') cur.completedTs = ts;
    }
  });
  // A TodoWrite replaces the whole list: unfinished items it no longer mentions were dropped.
  for (const key of Object.keys(st.todos)) {
    if (!seen.has(key) && st.todos[key].status !== 'completed') delete st.todos[key];
  }
}

function onToolUse(st, b, ts) {
  const name = b.name;
  const input = b.input || {};
  st.toolCount++;
  st.activity = { ts, tool: name, text: clip(describeTool(name, input), 200) };

  if (name === 'TaskCreate') {
    st.pending[b.id] = {
      name,
      ts,
      subject: clip(input.subject, 300),
      description: clip(input.description),
      activeForm: input.activeForm || null,
      promptId: currentPromptId(st),
    };
  } else if (name === 'TaskUpdate') {
    const t = st.tasks[String(input.taskId)];
    if (!t) return;
    if (input.subject) t.subject = clip(input.subject, 300);
    if (input.description) t.description = clip(input.description);
    if (input.activeForm) t.activeForm = input.activeForm;
    if (input.status) {
      if (input.status === 'deleted') {
        delete st.tasks[String(input.taskId)];
        return;
      }
      t.status = input.status;
      if (input.status === 'in_progress' && !t.startedTs) t.startedTs = ts;
      if (input.status === 'completed') t.completedTs = ts;
    }
    t.updatedTs = ts;
  } else if (name === 'TodoWrite') {
    applyTodoWrite(st, input.todos, ts);
  } else if (name === 'Agent' || (name === 'Task' && input.subagent_type)) {
    st.agents[b.id] = {
      toolUseId: b.id,
      agentId: null,
      description: clip(input.description || 'Agent', 200),
      type: input.subagent_type || 'general-purpose',
      prompt: clip(input.prompt, 1500),
      isolation: input.isolation || null,
      model: input.model || null,
      startTs: ts,
      endTs: 0,
      status: 'running',
      async: !!input.run_in_background,
      promptId: currentPromptId(st),
      summary: null,
      result: null,
    };
  } else if ((name === 'Bash' || name === 'PowerShell') && input.run_in_background) {
    st.pending[b.id] = { name, ts, description: clip(input.description || input.command, 200), promptId: currentPromptId(st) };
  } else if (name === 'SubagentHandback') {
    // A background subagent's report to its parent session.
    if (input.message) st.handback = { ts, text: clip(input.message, 8000) };
  } else if (name === 'TaskStop') {
    const id = input.task_id || input.shell_id;
    const key = st.agentIdx[id];
    const target = (key && st.agents[key]) || st.bg[id];
    if (target && target.status === 'running') {
      target.status = 'killed';
      target.endTs = ts;
    }
  }
}

function onToolResult(st, block, result, ts) {
  const id = block.tool_use_id;
  const agent = st.agents[id];
  if (agent) {
    if (block.is_error) {
      agent.status = 'failed';
      agent.endTs = ts;
      agent.result = clip(textOf(block.content) || '', 800);
    } else if (result && typeof result === 'object') {
      if (result.agentId) {
        agent.agentId = result.agentId;
        st.agentIdx[result.agentId] = id;
      }
      if (result.status === 'async_launched') {
        agent.async = true;
      } else if (result.status === 'completed' || result.status === 'failed') {
        agent.status = result.status;
        agent.endTs = ts;
        const txt = Array.isArray(result.content)
          ? result.content.filter((c) => c && c.type === 'text').map((c) => c.text).join('\n')
          : textOf(block.content);
        if (txt) agent.result = clip(txt, 1500);
      }
    }
    return;
  }
  const p = st.pending[id];
  if (!p) return;
  delete st.pending[id];
  if (p.name === 'TaskCreate') {
    const tid = result && result.task && result.task.id != null ? String(result.task.id) : null;
    if (!tid || block.is_error) return;
    st.tasks[tid] = {
      id: tid,
      subject: (result.task.subject && clip(result.task.subject, 300)) || p.subject,
      description: p.description,
      activeForm: p.activeForm,
      status: 'pending',
      createdTs: p.ts,
      updatedTs: ts,
      startedTs: 0,
      completedTs: 0,
      promptId: p.promptId,
    };
  } else if (p.name === 'Bash' || p.name === 'PowerShell') {
    const bid = result && result.backgroundTaskId;
    if (!bid) return;
    st.bg[bid] = { id: bid, description: p.description, startTs: p.ts, endTs: 0, status: 'running', summary: null, promptId: p.promptId };
  }
}

function apply(st, rec) {
  const ts = toTs(rec.timestamp);
  switch (rec.type) {
    case 'ai-title':
      if (rec.aiTitle) st.title = clip(rec.aiTitle, 200);
      return;
    case 'agent-name':
      if (rec.agentName) st.agentName = clip(rec.agentName, 120);
      return;
    case 'cost-state':
      st.cost = {
        usd: rec.totalCostUSD || 0,
        added: rec.totalLinesAdded || 0,
        removed: rec.totalLinesRemoved || 0,
      };
      return;
    case 'system':
      touch(st, ts);
      if (rec.subtype === 'turn_duration') {
        st.turnOpen = false;
        st.lastTurnEnd = ts;
      } else if (rec.subtype === 'away_summary' && rec.content) {
        st.awaySummary = { ts, text: clip(String(rec.content).replace(/\s*\(disable recaps[^)]*\)\s*$/, ''), 500) };
      } else if (rec.subtype === 'compact_boundary') {
        st.compactions++;
      }
      return;
    case 'attachment': {
      const a = rec.attachment;
      if (!a) return;
      touch(st, ts);
      if (a.type === 'queued_command') {
        const text = Array.isArray(a.prompt)
          ? a.prompt.filter((p) => p && p.type === 'text').map((p) => p.text).join('\n')
          : typeof a.prompt === 'string' ? a.prompt : '';
        if (!text) return;
        if (text.includes('<task-notification>')) handleNotifications(st, text, ts);
        else {
          const pt = promptText(text);
          if (pt && (!a.origin || a.origin.kind === 'human')) addPrompt(st, pt, ts, 'queued');
        }
      }
      return;
    }
    case 'user':
    case 'assistant':
      break;
    default:
      return;
  }

  touch(st, ts);
  // The cwd a session starts in names its project; later cds into subfolders don't move it.
  if (rec.cwd && !st.cwd) st.cwd = rec.cwd;
  if (rec.cwd) st.lastCwd = rec.cwd;
  if (rec.gitBranch) st.branch = rec.gitBranch;
  if (rec.version) st.version = rec.version;
  const msg = rec.message;
  if (!msg) return;

  if (rec.type === 'assistant') {
    if (msg.model && msg.model !== '<synthetic>') st.model = msg.model;
    const content = Array.isArray(msg.content) ? msg.content : [];
    for (const b of content) {
      if (!b) continue;
      if (b.type === 'tool_use') onToolUse(st, b, ts);
      // Long enough to hold a subagent's final report, which is its last text message.
      else if (b.type === 'text' && b.text && b.text.trim()) st.lastText = { ts, text: clip(b.text.trim(), 4000) };
    }
    if (msg.stop_reason === 'end_turn') {
      st.turnOpen = false;
      st.lastTurnEnd = ts;
    }
    return;
  }

  // user
  if (rec.isCompactSummary || rec.isVisibleInTranscriptOnly) return;
  const content = msg.content;
  if (Array.isArray(content)) {
    for (const b of content) {
      if (b && b.type === 'tool_result') onToolResult(st, b, rec.toolUseResult, ts);
    }
  }
  if (rec.isMeta) return;
  const text = textOf(content);
  if (!text) return;
  if (text.includes('<task-notification>')) {
    handleNotifications(st, text, ts);
    return;
  }
  const pt = promptText(text);
  if (pt) addPrompt(st, pt, ts, 'prompt');
}

module.exports = { newState, apply, clip };
