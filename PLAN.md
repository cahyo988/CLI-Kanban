# ClaudeKanban — Plan

Dashboard lokal yang mendeteksi **semua** sesi Claude Code dan agent-nya di PC ini,
lalu menampilkannya sebagai **Kanban + Timeline per project**, live.

## 1. Hasil riset: sumber data di `~/.claude`

| Sumber | Isi | Dipakai untuk |
|---|---|---|
| `sessions/<pid>.json` | Sesi yang sedang hidup: `pid`, `sessionId`, `cwd`, `name`, `status` (`busy`/`idle`), `kind` | Status live (sedang kerja / menunggu kamu). PID dicek masih hidup. |
| `projects/<cwd-encoded>/<sessionId>.jsonl` | Transcript lengkap per sesi (bisa ratusan MB) | Prompt user, tool yang dipakai, task, agent, judul, biaya |
| `projects/.../<sessionId>/subagents/agent-<id>.jsonl` + `.meta.json` | Transcript subagent + tipe, deskripsi, worktree | Kartu agent, aktivitas agent |
| `jobs/<short>/state.json` | Sesi background (daemon): `state`, `detail`, `intent` | Status sesi background |

Record penting di JSONL:

- `ai-title` / `agent-name`: judul sesi
- `user` dengan content string: **request/prompt** dari kamu
- `attachment.type = queued_command`: prompt yang diketik saat Claude masih bekerja
- `assistant` → `tool_use`:
  - `TaskCreate {subject, description, activeForm}` + hasil `toolUseResult.task.id`
  - `TaskUpdate {taskId, status}`: `pending` / `in_progress` / `completed` / `deleted`
  - `TodoWrite {todos:[{content,status,activeForm}]}` (format lama)
  - `Agent {description, subagent_type, prompt}` → hasil `status: async_launched, agentId` atau `status: completed`
  - `Bash {run_in_background}` → `toolUseResult.backgroundTaskId`
- `user` berisi `<task-notification><task-id>…<status>completed|failed|killed`: agent/background selesai
- `system:turn_duration`: satu giliran selesai (Claude berhenti, menunggu user)
- `system:away_summary`: ringkasan otomatis "apa yang sedang dikerjakan"
- `cost-state`: biaya USD, baris kode ditambah/dihapus
- `api-request*`, `file-history*`: tidak dipakai, di-skip supaya cepat

## 2. Arsitektur

```
server.js              HTTP server (127.0.0.1:4777) + SSE + file statis
lib/config.js          Path & konstanta
lib/jsonl.js           Pembaca JSONL incremental berbasis byte offset
lib/sessionParser.js   Reducer: record → state sesi (prompt, task, agent, aktivitas, segmen waktu)
lib/collector.js       Scan semua project/subagent/live session/job, cache, fs.watch
lib/model.js           Bentuk view: overview, kanban, timeline per project
public/                UI (vanilla JS, tanpa build step)
data/cache.json        Cache hasil parse (offset per file), supaya restart cepat
```

Tanpa dependency npm: cukup Node ≥ 18.

### Strategi performa (transcript total ±700MB)
1. Parse **incremental**: simpan `offset` byte terakhir per file, hanya baca bagian baru.
2. Baris `api-request`, `file-history`, `total_tokens_reminder`, dll. dibuang lewat cek prefix
   sebelum `JSON.parse`.
3. State hasil parse disimpan di `data/cache.json`. Restart hanya membaca tambahan baru.
4. `fs.watch` rekursif di `projects/`, `sessions/`, `jobs/`, dengan debounce 400ms.
   Perubahan dikirim lewat SSE, dan browser hanya mengambil ulang view yang sedang dibuka.
5. Polling 5 detik untuk cek PID hidup (proses mati tidak selalu memicu event file).

## 3. Model data

**Project** = `cwd` yang dinormalisasi (lowercase, slash seragam; path worktree
`.claude/worktrees/...` dilebur ke project induk).

**Session**: `id, title, cwd, branch, firstTs, lastTs, segments[[start,end]]` (aktivitas
dipecah bila jeda > 15 menit), `prompts[]`, `tasks{}`, `agents{}`, `bgTasks{}`,
`currentActivity`, `turnOpen`, `cost`, `live` (pid/status), `job`.

**Kartu Kanban** (3 jenis):
| Jenis | Sumber | Status → Kolom |
|---|---|---|
| Request | prompt user | prompt terakhir di sesi busy → *Dikerjakan*; di sesi idle → *Menunggu kamu*; lainnya → *Selesai* |
| Task | TaskCreate/TaskUpdate/TodoWrite | pending → *Antrian*, in_progress → *Dikerjakan*, completed → *Selesai* |
| Agent | Agent tool + subagent jsonl | running → *Dikerjakan*, completed → *Selesai*, failed/killed → *Selesai* (merah), sesi mati tanpa notifikasi → *Terhenti* |

Kolom: **Antrian · Dikerjakan · Menunggu kamu · Selesai**.
Progress request = task selesai / total task yang dibuat selama request itu.
Progress project = task selesai / total task (dalam rentang waktu terpilih).

**Timeline per project** (Gantt SVG): satu baris per sesi (bar = segmen aktivitas), di bawahnya
baris agent dan task (mulai sampai selesai). Marker: prompt (●), task selesai (✓). Zoom 6 jam,
24 jam, 7 hari, 30 hari, dengan garis "sekarang".

## 4. UI
- **Sidebar**: daftar project, indikator live (hijau = kerja, kuning = menunggu kamu), progress bar.
- **Overview**: panel "Sedang berjalan sekarang" (semua sesi live + agent aktif + aksi terakhir)
  dan grid kartu project.
- **Halaman project**: tab **Kanban** | **Timeline** | **Sesi**; filter rentang waktu dan jenis kartu.
- Klik kartu untuk melihat detail di drawer (prompt lengkap, deskripsi task, hasil agent,
  aktivitas terakhir).
- Tema terang/gelap otomatis.

## 5. Keamanan
- Server hanya listen di `127.0.0.1`.
- Read-only terhadap `~/.claude`: tidak pernah menulis ke sana.
- `.credentials.json` dan file kunci tidak pernah dibaca.

## 6. Tahapan implementasi
1. `jsonl.js` + `sessionParser.js` (inti parsing), diuji pada transcript nyata.
2. `collector.js`: scan, cache, live session, job, subagent, watch.
3. `model.js` + `server.js`: API `/api/overview`, `/api/project/:key`, `/api/events` (SSE).
4. UI: overview, kanban, timeline, drawer detail.
5. Launcher `start.cmd`, README.
6. Verifikasi: jalankan terhadap data PC ini, cek sesi live terdeteksi, cek kanban dan timeline.

## 7. Batasan yang disadari
- Status "Menunggu kamu" bergantung pada `sessions/<pid>.json`. Sesi lama (sudah ditutup)
  dianggap selesai.
- Prompt yang tidak memicu task tetap muncul sebagai kartu Request, tanpa progress task.
- Agent async yang sesinya mati sebelum notifikasi masuk ditandai *Terhenti*.
