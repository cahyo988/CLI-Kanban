'use strict';
const path = require('path');
const cfg = require('./config');
const { projectKeyOf, stripWorktree } = require('./collector');
const { dayKey } = require('./sessionParser');

const DAY = 86400000;

// Token counts travel as [input, output, cache write, cache read].
const tok0 = () => [0, 0, 0, 0];
function addTok(acc, v) {
  if (v) for (let i = 0; i < 4; i++) acc[i] += v[i] || 0;
  return acc;
}
const tokSum = (v) => (v ? v[0] + v[1] + v[2] + v[3] : 0);

function sessionStatus(state, live, job, runningAgents, now) {
  if (live) {
    // "waiting" from the CLI means a dialog (permission prompt, question) needs an answer.
    if (live.status === 'waiting') return 'waiting';
    if (live.status === 'busy' || runningAgents > 0) return 'working';
    return 'waiting';
  }
  if (job && /working|running|busy/.test(job.state || '')) return 'working';
  if (state.turnOpen && now - state.lastTs < cfg.RECENT_MS) return 'working';
  return 'ended';
}

function agentStatus(a, subEntry, sessionLive, now) {
  if (a.status !== 'running') return a.status;
  const fresh = subEntry && now - subEntry.mtimeMs < cfg.AGENT_ACTIVE_MS;
  if (fresh || sessionLive) return 'running';
  return 'stopped';
}

function columnFor(kind, status) {
  switch (status) {
    case 'pending':
      return 'todo';
    case 'in_progress':
    case 'running':
    case 'working':
      return 'doing';
    case 'waiting':
      return 'waiting';
    default:
      return 'done';
  }
}

function firstLine(text, n = 140) {
  const line = String(text || '').split('\n').find((l) => l.trim()) || '';
  return line.length > n ? line.slice(0, n) + '…' : line;
}

const ACTIVE_RUN = new Set(['starting', 'running']);

/** Indexes the board's own runs: which sessions it is running, has touched, and which prompts it sent. */
function indexRuns(snap) {
  const runs = (snap.runs && snap.runs.runs) || [];
  const queue = (snap.runs && snap.runs.queue) || [];
  const active = new Map();
  const managed = new Set();
  const sent = new Set();
  for (const r of runs) {
    if (!r.sessionId) continue;
    managed.add(r.sessionId);
    sent.add(r.sessionId + '|' + firstLine(r.prompt, 120));
    if (ACTIVE_RUN.has(r.status)) active.set(r.sessionId, r);
  }
  return { runs, queue, active, managed, sent };
}

/** Builds one session view, joining the transcript state with its live process, job and subagents. */
function buildSession(sid, s, live, job, now, managed) {
  const st = s.entry.state;
  const subByTool = new Map();
  const subByAgent = new Map();
  for (const sub of s.subagents) {
    if (sub.meta && sub.meta.toolUseId) subByTool.set(sub.meta.toolUseId, sub);
    subByAgent.set(sub.entry.agentId, sub);
  }

  const agents = [];
  const usedSubs = new Set();
  for (const a of Object.values(st.agents)) {
    const sub = subByTool.get(a.toolUseId) || (a.agentId && subByAgent.get(a.agentId)) || null;
    if (sub) usedSubs.add(sub);
    agents.push(makeAgent(a, sub, !!live, now));
  }
  // Subagents launched by other subagents (or whose launch was compacted away) only exist on disk.
  for (const sub of s.subagents) {
    if (usedSubs.has(sub)) continue;
    const m = sub.meta || {};
    const ss = sub.entry.state;
    agents.push(
      makeAgent(
        {
          toolUseId: m.toolUseId || sub.entry.agentId,
          agentId: sub.entry.agentId,
          description: m.description || ss.title || 'Subagent',
          type: m.agentType || 'agent',
          prompt: ss.prompts[0] ? ss.prompts[0].text : '',
          startTs: ss.firstTs,
          endTs: 0,
          status: 'running',
          promptId: null,
          nested: (m.spawnDepth || 1) > 1,
        },
        sub,
        !!live,
        now,
        true,
      ),
    );
  }

  const runningAgents = agents.filter((a) => a.status === 'running').length;
  const status = sessionStatus(st, live, job, runningAgents, now);
  const tokStates = [st, ...s.subagents.map((sub) => sub.entry.state)];
  const tasks = [...Object.values(st.tasks), ...Object.values(st.todos)];
  const bg = Object.values(st.bg).map((b) => ({
    ...b,
    status: b.status === 'running' && !live && now - st.lastTs > cfg.RECENT_MS ? 'stopped' : b.status,
  }));

  return {
    id: sid,
    title: st.title || (live && live.name) || st.agentName || firstLine(st.prompts[0] && st.prompts[0].text, 60) || 'Sesi ' + sid.slice(0, 8),
    name: (live && live.name) || st.agentName || null,
    profile: s.entry.profile || 'default',
    cwd: st.cwd,
    branch: st.branch,
    model: st.model,
    version: st.version,
    firstTs: st.firstTs,
    lastTs: Math.max(st.lastTs, ...agents.map((a) => a.lastTs || 0)),
    segments: st.segments,
    status,
    needs: live && live.status === 'waiting' ? live.waitingFor || 'dialog' : null,
    managed: !!managed,
    live: live || null,
    job: job || null,
    turnOpen: st.turnOpen,
    lastTurnEnd: st.lastTurnEnd,
    activity: st.activity,
    lastText: st.lastText,
    awaySummary: st.awaySummary,
    cost: st.cost,
    tokens: tokStates.reduce((acc, x) => addTok(acc, x.tokens), tok0()),
    tokStates,
    toolCount: st.toolCount,
    compactions: st.compactions,
    prompts: st.prompts,
    tasks,
    agents,
    bg,
  };
}

// Background agents hand their report back as a message; the notification then only points at it.
const HANDBACK_RE = /delivered to you as a message|not repeated here/i;
const BOILERPLATE_SUMMARY_RE = /^Agent ".*" (finished|completed)\.?$/i;

function makeAgent(a, sub, sessionLive, now, orphan = false) {
  const ss = sub ? sub.entry.state : null;
  const status = agentStatus(a, sub && sub.entry, sessionLive && !orphan, now);
  const meta = (sub && sub.meta) || {};
  const finalText = ss && status !== 'running' ? (ss.handback || ss.lastText || {}).text || null : null;
  const result = a.result && !HANDBACK_RE.test(a.result) ? a.result : finalText || a.result || null;
  return {
    id: a.agentId || a.toolUseId,
    toolUseId: a.toolUseId,
    description: a.description,
    type: a.type,
    prompt: a.prompt,
    status,
    startTs: a.startTs || (ss && ss.firstTs) || 0,
    endTs: a.endTs || (status !== 'running' && ss ? ss.lastTs : 0),
    lastTs: ss ? ss.lastTs : a.endTs || a.startTs,
    summary: a.summary && !BOILERPLATE_SUMMARY_RE.test(a.summary) ? a.summary : null,
    result,
    activity: ss ? ss.activity : null,
    lastText: ss ? ss.lastText : null,
    toolCount: ss ? ss.toolCount : 0,
    tokens: ss ? ss.tokens : null,
    model: (ss && ss.model) || a.model || null,
    worktree: meta.worktreePath || null,
    branch: meta.worktreeBranch || null,
    promptId: a.promptId,
    nested: !!a.nested,
  };
}

function buildProjects(snap, now = Date.now(), idx = indexRuns(snap)) {
  const projects = new Map();
  for (const [sid, s] of snap.sessions) {
    const st = s.entry.state;
    let live = snap.live.get(sid) || null;
    // A headless run from the board is live even when the CLI doesn't list it.
    const run = idx.active.get(sid);
    if (run && !live) live = { pid: run.pid, status: 'busy', kind: 'headless', startedAt: run.startedAt, cwd: run.cwd, name: null, profile: run.profileId || 'default' };
    const cwd = st.cwd || (live && live.cwd);
    if (!cwd && !st.lastTs) continue;
    const key = projectKeyOf(cwd) || 'dir:' + s.entry.dir;
    // Daemon jobs keep their last state.json after finishing; only an unfinished one says anything about now.
    const job = snap.jobs.get(sid) || null;
    const activeJob = job && !/done|idle|exited|failed/.test(job.state || '') ? job : null;
    const session = buildSession(sid, s, live, activeJob, now, idx.managed.has(sid));
    // Sessions that only ran CLI housekeeping (/model, /compact…) carry no work worth a lane.
    if (!live && (!session.firstTs || (!session.prompts.length && !session.toolCount))) continue;
    let p = projects.get(key);
    if (!p) {
      p = { key, path: cwd ? stripWorktree(cwd) : s.entry.dir, sessions: [] };
      projects.set(key, p);
    }
    p.sessions.push(session);
  }
  for (const p of projects.values()) {
    p.sessions.sort((a, b) => b.lastTs - a.lastTs);
    const latestCwd = p.sessions.find((s) => s.cwd);
    if (latestCwd) p.path = stripWorktree(latestCwd.cwd);
    p.name = path.win32.basename(p.path) || p.path;
  }
  return projects;
}

function progressOf(tasks) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'completed').length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : null };
}

// Local midnights for the last `days` days, oldest first (setDate keeps DST transitions right).
function dayStarts(now, days) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d.getTime());
  }
  return out;
}

/** Minutes of activity per day over the last 14 days: session segments plus agent run time. */
function activitySpark(sessions, now, days = 14) {
  const starts = dayStarts(now, days);
  const out = new Array(days).fill(0);
  const add = (a, b) => {
    if (!a || b < starts[0]) return;
    if (b <= a) b = a + 60000;
    for (let i = 0; i < days; i++) {
      const ds = starts[i];
      const de = i + 1 < days ? starts[i + 1] : ds + DAY;
      const overlap = Math.min(b, de) - Math.max(a, ds);
      if (overlap > 0) out[i] += overlap / 60000;
    }
  };
  for (const s of sessions) {
    for (const [a, b] of s.segments) add(a, b);
    for (const ag of s.agents) add(ag.startTs, ag.status === 'running' ? now : ag.endTs || ag.lastTs);
  }
  return { start: starts[0], minutes: out.map((m) => Math.round(m)) };
}

/** Token totals over transcript states: all time, today, 7 and 30 days, per day and per model. */
function tokenStats(states, now, days = 14, detail = true) {
  const starts = dayStarts(now, 30);
  const byDay = new Map(starts.map((t) => [dayKey(t), tok0()]));
  const all = tok0();
  const models = {};
  for (const st of states) {
    if (!st.tokens) continue;
    addTok(all, st.tokens);
    for (const [k, v] of Object.entries(st.tokDays)) if (byDay.has(k)) addTok(byDay.get(k), v);
    if (detail) for (const [m, v] of Object.entries(st.tokModels)) addTok(models[m] || (models[m] = tok0()), v);
  }
  const perDay = [...byDay.values()];
  const last = (n) => perDay.slice(-n).reduce(addTok, tok0());
  const out = { all, today: perDay[perDay.length - 1], d7: last(7), d30: last(30) };
  if (!detail) return out;
  out.days = { start: starts[starts.length - days], tok: perDay.slice(-days) };
  out.models = Object.entries(models)
    .map(([model, tok]) => ({ model, tok }))
    .filter((m) => tokSum(m.tok) > 0)
    .sort((a, b) => tokSum(b.tok) - tokSum(a.tok));
  return out;
}

// What a live session is working through: the current request's tasks, else whatever is still open.
function checklistOf(s) {
  const last = s.prompts[s.prompts.length - 1];
  let tasks = last ? s.tasks.filter((t) => t.promptId === last.id) : [];
  if (!tasks.length) tasks = s.tasks.filter((t) => t.status !== 'completed');
  return tasks
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.createdTs - b.createdTs)
    .map((t) => ({ title: t.subject, status: t.status, activeForm: t.activeForm || null }));
}

function projectSummary(p, now) {
  const weekAgo = now - 7 * DAY;
  const working = p.sessions.filter((s) => s.status === 'working');
  const waiting = p.sessions.filter((s) => s.status === 'waiting');
  const recentTasks = p.sessions.flatMap((s) => s.tasks.filter((t) => (t.updatedTs || t.createdTs) >= weekAgo));
  const runningAgents = p.sessions.flatMap((s) => s.agents.filter((a) => a.status === 'running'));
  const lastTs = Math.max(0, ...p.sessions.map((s) => s.lastTs));
  const cost = p.sessions.reduce((acc, s) => acc + ((s.cost && s.cost.usd) || 0), 0);
  // "Current" progress: the tasks of the latest request in each live session, falling back to the week.
  const current = p.sessions
    .filter((s) => s.status !== 'ended')
    .flatMap((s) => {
      const last = s.prompts[s.prompts.length - 1];
      return last ? s.tasks.filter((t) => t.promptId === last.id) : [];
    });
  return {
    key: p.key,
    name: p.name,
    path: p.path,
    sessionCount: p.sessions.length,
    working: working.length,
    waiting: waiting.length,
    runningAgents: runningAgents.length,
    lastTs,
    cost,
    progress: progressOf(recentTasks),
    current: current.length ? progressOf(current) : null,
    headline: (working[0] || waiting[0] || p.sessions[0] || {}).title || null,
    spark: activitySpark(p.sessions, now),
    tokens: tokenStats(p.sessions.flatMap((s) => s.tokStates), now, 14, false),
    // Enough for the prompt composer to offer "continue this session" without loading the project.
    recent: p.sessions.slice(0, 10).map(sessionRef),
  };
}

function sessionRef(s) {
  return {
    id: s.id,
    title: s.title,
    status: s.status,
    needs: s.needs,
    managed: s.managed,
    profile: s.profile,
    liveKind: s.live ? s.live.kind || 'interactive' : null,
    lastTs: s.lastTs,
  };
}

function nowItems(projects, now, onlyKey, idx) {
  const items = [];
  for (const p of projects.values()) {
    if (onlyKey && p.key !== onlyKey) continue;
    for (const s of p.sessions) {
      if (s.status === 'ended') continue;
      const last = s.prompts[s.prompts.length - 1];
      const active = s.tasks.find((t) => t.status === 'in_progress');
      const checklist = checklistOf(s);
      items.push({
        projectKey: p.key,
        projectName: p.name,
        sessionId: s.id,
        title: s.title,
        status: s.status,
        needs: s.needs,
        managed: s.managed,
        profile: s.profile,
        live: s.live,
        job: s.job,
        request: last ? { id: last.id, text: firstLine(last.text, 220), ts: last.ts } : null,
        activity: s.activity,
        lastText: s.status === 'waiting' ? s.lastText : null,
        lastTurnEnd: s.lastTurnEnd,
        activeTask: active ? active.activeForm || active.subject : null,
        checklist,
        progress: checklist.length ? progressOf(checklist) : null,
        agents: s.agents
          .filter((a) => a.status === 'running')
          .map((a) => ({ id: a.id, description: a.description, type: a.type, activity: a.activity, startTs: a.startTs, toolCount: a.toolCount })),
        bg: s.bg.filter((b) => b.status === 'running').map((b) => ({ id: b.id, description: b.description, startTs: b.startTs })),
        tokens: s.tokens,
        firstTs: (s.live && s.live.startedAt) || s.firstTs,
        lastTs: s.lastTs,
      });
    }
  }
  // Board runs whose session hasn't shown up on disk yet (the CLI is still starting).
  if (idx) {
    const known = new Set(items.map((i) => i.sessionId));
    for (const r of idx.runs) {
      if (!ACTIVE_RUN.has(r.status) || (onlyKey && r.projectKey !== onlyKey)) continue;
      if (r.sessionId && known.has(r.sessionId)) continue;
      if (r.sessionId && [...projects.values()].some((p) => p.sessions.some((s) => s.id === r.sessionId))) continue;
      const p = projects.get(r.projectKey);
      items.push({
        projectKey: r.projectKey,
        projectName: p ? p.name : r.projectKey,
        sessionId: 'run:' + r.id,
        runId: r.id,
        starting: true,
        title: r.target ? r.targetTitle || 'Lanjutan sesi' : 'Sesi baru dari kanban',
        status: 'working',
        needs: null,
        managed: true,
        profile: r.profileId || 'default',
        live: { kind: 'headless', status: 'busy', pid: r.pid, startedAt: r.startedAt },
        job: null,
        request: { id: null, text: r.title, ts: r.startedAt },
        activity: null,
        lastText: null,
        lastTurnEnd: 0,
        activeTask: null,
        checklist: [],
        progress: null,
        agents: [],
        bg: [],
        tokens: null,
        firstTs: r.startedAt,
        lastTs: r.startedAt,
      });
    }
  }
  // Order by status, then by when the session started, so cards don't trade places on every write.
  const rank = { working: 0, waiting: 1 };
  return items.sort((a, b) => rank[a.status] - rank[b.status] || a.firstTs - b.firstTs);
}

// What the client needs to notice a board run finishing or failing.
function runSummaries(idx, projects) {
  return idx.runs.slice(-40).map((r) => ({
    id: r.id,
    status: r.status,
    title: r.title,
    projectKey: r.projectKey,
    projectName: (projects.get(r.projectKey) || {}).name || r.projectKey,
    sessionId: r.sessionId,
    profileId: r.profileId || 'default',
    error: r.error,
    denials: r.denials || 0,
    startedAt: r.startedAt,
    endedAt: r.endedAt,
  }));
}

const FEED_WINDOW = 2 * DAY;

/** Recent happenings across every project, newest first: requests, task and agent starts/finishes. */
function activityFeed(projects, now, limit = 60) {
  const since = now - FEED_WINDOW;
  const ev = [];
  for (const p of projects.values()) {
    for (const s of p.sessions) {
      if (s.lastTs < since) continue;
      const base = { projectKey: p.key, projectName: p.name, sessionId: s.id, sessionTitle: s.title };
      for (const pr of s.prompts) {
        if (pr.ts >= since) ev.push({ ...base, id: `${s.id}:p${pr.id}`, card: `${s.id}:p${pr.id}`, ts: pr.ts, type: 'prompt', text: firstLine(pr.text, 160) });
      }
      for (const t of s.tasks) {
        const card = `${s.id}:t${t.id}`;
        if (t.startedTs >= since) ev.push({ ...base, id: card + ':s', card, ts: t.startedTs, type: 'task_start', text: t.subject });
        if (t.completedTs >= since) ev.push({ ...base, id: card + ':d', card, ts: t.completedTs, type: 'task_done', text: t.subject });
      }
      for (const a of s.agents) {
        const card = `${s.id}:a${a.id}`;
        if (a.startTs >= since) ev.push({ ...base, id: card + ':s', card, ts: a.startTs, type: 'agent_start', text: a.description, agentType: a.type });
        if (a.endTs >= since && a.status !== 'running') {
          const type = a.status === 'completed' ? 'agent_done' : 'agent_failed';
          ev.push({ ...base, id: card + ':d', card, ts: a.endTs, type, text: a.description, agentType: a.type, status: a.status });
        }
      }
      if (s.status === 'waiting' && s.lastTurnEnd >= since) {
        ev.push({ ...base, id: `${s.id}:w${s.lastTurnEnd}`, ts: s.lastTurnEnd, type: 'waiting', text: s.lastText ? firstLine(s.lastText.text, 160) : '' });
      }
    }
  }
  return ev.sort((a, b) => b.ts - a.ts).slice(0, limit);
}

function overview(snap, extras = {}) {
  const now = Date.now();
  const idx = indexRuns(snap);
  const projects = buildProjects(snap, now, idx);
  const list = [...projects.values()].map((p) => projectSummary(p, now));
  const active = nowItems(projects, now, null, idx);
  const today = dayStarts(now, 1)[0];
  let todayDone = 0;
  let todayPrompts = 0;
  for (const p of projects.values()) {
    for (const s of p.sessions) {
      if (s.lastTs < today) continue;
      todayDone += s.tasks.filter((t) => t.completedTs >= today).length;
      todayPrompts += s.prompts.filter((pr) => pr.ts >= today).length;
    }
  }
  // Token totals over every transcript on disk (sessions too small to get a lane included), per account too.
  const statesByProfile = new Map();
  for (const s of snap.sessions.values()) {
    const id = s.entry.profile || 'default';
    if (!statesByProfile.has(id)) statesByProfile.set(id, []);
    statesByProfile.get(id).push(s.entry.state, ...s.subagents.map((sub) => sub.entry.state));
  }
  const profiles = (extras.profiles || []).map((p) => ({ ...p, tokens: tokenStats(statesByProfile.get(p.id) || [], now, 14, false) }));
  const kpi = {
    working: active.filter((a) => a.status === 'working').length,
    waiting: active.filter((a) => a.status === 'waiting').length,
    agents: active.reduce((n, a) => n + a.agents.length, 0),
    bg: active.reduce((n, a) => n + a.bg.length, 0),
    todayDone,
    todayPrompts,
  };
  return {
    version: snap.version,
    now,
    kpi,
    projects: list,
    active,
    feed: activityFeed(projects, now),
    usage: extras.usage || null,
    account: extras.account || null,
    profiles,
    projectAccounts: extras.projectAccounts || {},
    home: extras.home || null,
    tokens: tokenStats([...statesByProfile.values()].flat(), now),
    runs: runSummaries(idx, projects),
    queued: idx.queue.length,
  };
}

function projectDetail(snap, key) {
  const now = Date.now();
  const idx = indexRuns(snap);
  const projects = buildProjects(snap, now, idx);
  const p = projects.get(key);
  if (!p) return null;
  const cards = [];
  // Prompts waiting for a busy board session, and board runs the session cards can't show yet
  // (still starting) or that failed (their error is worth seeing).
  for (const q of idx.queue) {
    if (q.projectKey !== key) continue;
    cards.push({
      kind: 'queued', id: 'q:' + q.id, queueId: q.id,
      sessionId: q.target || 'queue', sessionTitle: q.targetTitle || 'Sesi',
      title: q.title, text: q.prompt, status: 'queued', column: 'todo',
      ts: q.createdAt, updatedTs: q.createdAt, permissionMode: q.permissionMode, model: q.model, profileId: q.profileId || 'default',
    });
  }
  const sessionIds = new Set(p.sessions.map((s) => s.id));
  for (const r of idx.runs) {
    if (r.projectKey !== key) continue;
    const active = ACTIVE_RUN.has(r.status);
    const failed = r.status === 'error' || r.status === 'lost' || r.status === 'stopped';
    if (!active && !failed) continue;
    if (active && r.sessionId && sessionIds.has(r.sessionId)) continue;
    if (failed && now - (r.endedAt || r.startedAt) > 3 * DAY) continue;
    cards.push({
      kind: 'run', id: 'run:' + r.id, runId: r.id,
      sessionId: r.sessionId || 'run:' + r.id,
      sessionTitle: r.targetTitle || (r.target ? 'Lanjutan sesi' : 'Sesi baru dari kanban'),
      title: r.title, text: r.prompt,
      status: active ? 'running' : r.status === 'lost' ? 'stopped' : r.status === 'error' ? 'failed' : 'killed',
      column: active ? 'doing' : 'done',
      ts: r.startedAt, endTs: r.endedAt, updatedTs: r.endedAt || r.startedAt,
      error: r.error, result: r.result, permissionMode: r.permissionMode, model: r.model, fork: !!r.fork, target: r.target, profileId: r.profileId || 'default',
    });
  }
  for (const s of p.sessions) {
    const lastPrompt = s.prompts[s.prompts.length - 1];
    for (const pr of s.prompts) {
      const prTasks = s.tasks.filter((t) => t.promptId === pr.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.createdTs - b.createdTs);
      const prAgents = s.agents.filter((a) => a.promptId === pr.id);
      let status = 'done';
      if (pr === lastPrompt && s.status !== 'ended') status = s.status;
      cards.push({
        kind: 'request',
        id: `${s.id}:p${pr.id}`,
        sessionId: s.id,
        sessionTitle: s.title,
        title: firstLine(pr.text),
        text: pr.text,
        status,
        column: columnFor('request', status),
        ts: pr.ts,
        endTs: pr.endTs,
        updatedTs: pr.endTs,
        progress: prTasks.length ? progressOf(prTasks) : null,
        taskStates: prTasks.map((t) => t.status),
        agentCount: prAgents.length,
        tokens: prAgents.reduce((acc, a) => addTok(acc, a.tokens), addTok(tok0(), pr.tok)),
        source: idx.sent.has(s.id + '|' + firstLine(pr.text, 120)) ? 'board' : pr.source,
        needs: pr === lastPrompt ? s.needs : null,
      });
    }
    for (const t of s.tasks) {
      cards.push({
        kind: 'task',
        id: `${s.id}:t${t.id}`,
        sessionId: s.id,
        sessionTitle: s.title,
        title: t.subject,
        text: t.description || '',
        activeForm: t.activeForm,
        status: t.status,
        stale: s.status === 'ended' && t.status !== 'completed',
        column: columnFor('task', t.status),
        ts: t.createdTs,
        startedTs: t.startedTs,
        endTs: t.completedTs,
        updatedTs: t.updatedTs || t.createdTs,
        promptId: t.promptId,
      });
    }
    for (const a of s.agents) {
      cards.push({
        kind: 'agent',
        id: `${s.id}:a${a.id}`,
        sessionId: s.id,
        sessionTitle: s.title,
        title: a.description,
        text: a.prompt,
        agentType: a.type,
        status: a.status,
        column: columnFor('agent', a.status),
        ts: a.startTs,
        endTs: a.endTs,
        updatedTs: a.lastTs || a.endTs || a.startTs,
        activity: a.activity,
        lastText: a.lastText,
        summary: a.summary,
        result: a.result,
        toolCount: a.toolCount,
        tokens: a.tokens,
        model: a.model,
        worktree: a.worktree,
        branch: a.branch,
        nested: a.nested,
        promptId: a.promptId,
      });
    }
    for (const b of s.bg) {
      cards.push({
        kind: 'bg',
        id: `${s.id}:b${b.id}`,
        sessionId: s.id,
        sessionTitle: s.title,
        title: b.description,
        text: b.summary || '',
        status: b.status,
        column: columnFor('bg', b.status),
        ts: b.startTs,
        endTs: b.endTs,
        updatedTs: b.endTs || b.startTs,
      });
    }
  }
  const sessions = p.sessions.map((s) => ({
    id: s.id,
    title: s.title,
    name: s.name,
    profile: s.profile,
    status: s.status,
    branch: s.branch,
    model: s.model,
    cwd: s.cwd,
    firstTs: s.firstTs,
    lastTs: s.lastTs,
    segments: s.segments,
    live: s.live,
    job: s.job,
    activity: s.activity,
    lastText: s.lastText,
    lastTurnEnd: s.lastTurnEnd,
    awaySummary: s.awaySummary,
    cost: s.cost,
    tokens: s.tokens,
    toolCount: s.toolCount,
    compactions: s.compactions,
    promptCount: s.prompts.length,
    needs: s.needs,
    managed: s.managed,
    progress: progressOf(s.tasks),
    prompts: s.prompts.map((pr) => ({ id: pr.id, ts: pr.ts, title: firstLine(pr.text, 80) })),
    tasks: s.tasks.map((t) => ({ id: t.id, title: t.subject, status: t.status, createdTs: t.createdTs, startedTs: t.startedTs, completedTs: t.completedTs })),
    agents: s.agents.map((a) => ({ id: a.id, title: a.description, type: a.type, status: a.status, startTs: a.startTs, endTs: a.endTs, lastTs: a.lastTs })),
  }));
  const tokens = tokenStats(p.sessions.flatMap((s) => s.tokStates), now);
  return { version: snap.version, now, summary: projectSummary(p, now), tokens, active: nowItems(projects, now, key, idx), sessions, cards };
}

module.exports = { overview, projectDetail };
