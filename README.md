<img src="public/logo.svg" width="64" height="64" alt="">

# Claude Kanban

Dashboard lokal yang mendeteksi **semua sesi Claude Code dan agent-nya** di PC ini, lalu
menampilkannya sebagai Kanban dan Timeline per project. Datanya live dan update sendiri.

## Menjalankan

```
start.cmd            # double-click: menjalankan server dan membuka browser
# atau
npm start            # lalu buka http://127.0.0.1:4777
```

Butuh Node.js ≥ 18. Tidak ada dependency npm.

Port dan host bisa diubah: `KANBAN_PORT=5000`, `KANBAN_HOST=127.0.0.1`.
Folder Claude bisa diganti lewat `CLAUDE_CONFIG_DIR`.

## Isi dashboard

- **Semua project**: sesi yang sedang hidup (bekerja atau menunggu kamu), request terakhir,
  aksi tool terakhir, task yang sedang dikerjakan, progress, agent dan proses background yang
  sedang berjalan.
- **Kanban per project**: kolom *Antrian · Dikerjakan · Menunggu kamu · Selesai* berisi kartu:
  - **Request**: setiap prompt yang kamu kirim, dengan progress task-nya
  - **Task**: dari TaskCreate/TaskUpdate/TodoWrite
  - **Agent**: subagent (Explore, Plan, general-purpose, dll.) beserta aktivitas dan hasilnya
  - **Background**: command yang jalan di background
- **Timeline per project**: Gantt sesi (segmen aktivitas), agent, dan task. Tersedia zoom
  6 jam, 24 jam, 7 hari, dan 30 hari.
- **Sesi**: detail tiap sesi (branch, model, jumlah tool call, ringkasan terakhir).

Klik kartu atau bar timeline untuk melihat detail lengkap. Laporan agent dan isi request
dirender sebagai markdown (heading, list, kode, tabel).

### Kantor 3D

Menu **Kantor 3D** (atau `#/3d`) menampilkan semua yang sedang berjalan sebagai pulau voxel
(Three.js), dengan gaya kotak-kotak ala game:

- Tiap project dapat satu **kavling** berpagar dengan papan nama dan bendera warna project.
  - Project yang punya sesi live jadi **kantor terbuka** berlantai kotak-kotak.
  - Project yang sedang sepi jadi **rumah mungil** beratap warna project, dengan asap cerobong.
    Begitu ada sesi baru, rumahnya menyingkir dan meja-meja muncul.
- Tiap **sesi live** jadi robot voxel di meja, dengan wajah piksel yang berekspresi:
  - robot yang **bekerja** mengetik, matanya hijau, dan layarnya menampilkan kode yang bergulir
  - robot yang **menunggu kamu** memutar kursinya ke kamera, tersenyum `^ ^`, melambai, dan
    memunculkan gelembung `…`
  - robot yang **butuh izin atau jawaban** bermata lebar dengan gelembung `!`
  - robot yang **memulai** ditandai warna biru
  - saat task di checklist selesai, robotnya melompat dan confetti kubus bertebaran
- Tiap **agent** jadi drone ungu berbaling-baling yang mengitari meja sesinya, terhubung ke layar
  dengan berkas cahaya. Drone menyala tiap kali agent memakai tool, lalu pecah jadi kubus saat
  agent selesai.
- **Proses background** jadi server kecil dengan lampu berkedip.
- Request baru datang sebagai amplop yang terbang ke meja.
- Pulau ikut membesar mengikuti jumlah kavling, dikelilingi air, pohon, bunga, dan awan yang
  bayangannya lewat. Di tema gelap suasananya malam: jendela dan lampu taman menyala, ada
  kunang-kunang.
- Kamera awalnya membidik kavling yang sedang bekerja; tombol **Semua** menampilkan seluruh pulau.

Seret untuk memutar, scroll untuk zoom, klik kanan untuk menggeser. Arahkan kursor ke robot atau
drone untuk melihat detail. Klik robot atau drone untuk membuka kartunya di kanban, dan klik papan
nama project untuk mendekatkan kamera. Tombol **Putar**, **Label agent**, **Semua**, dan layar
penuh ada di pojok kanan atas.

**Klik 2x** robot, meja, rumah, atau papan nama project untuk membuka jendela terminal baru (Windows
Terminal, atau PowerShell kalau Windows Terminal tidak ada) di folder project itu, yang langsung
menjalankan `claude --resume` untuk sesi terakhirnya. Sesi yang masih terbuka di terminal lain
dilewati, karena satu sesi tidak bisa dipakai dua proses sekaligus, jadi yang dilanjutkan adalah
sesi terakhir yang bebas. Kalau tidak ada sesi yang bisa dilanjutkan, terminal membuka sesi Claude
baru. Sesi milik akun tambahan dibuka dengan `CLAUDE_CONFIG_DIR` akun tersebut.

Three.js disertakan di `public/vendor/three` (r170, lisensi MIT) dan baru dimuat saat tampilan 3D
dibuka, jadi tidak butuh internet dan halaman lain tidak ikut berat. Kalau browser tidak
mendukung WebGL, halaman ini menampilkan pesan.

### Pemakaian Claude (`/usage`)

Panel paling atas di halaman utama, dan meter kecil di sidebar, menampilkan limit paketmu:
limit sesi 5 jam dan limit mingguan (per model), beserta waktu reset-nya. Datanya diminta ke
Claude Code CLI sendiri lewat control request `get_usage`, sama dengan data yang dipakai
`/usage`. Kanban tidak membaca token login dan tidak menjalankan model untuk ini. Data
disegarkan tiap 90 detik selama dashboard terbuka, dan setiap kali prompt dari kanban selesai.

### Akun Claude (bisa lebih dari satu)

Sidebar menampilkan akun yang sedang aktif: email, organisasi, dan paket. Klik untuk membuka
**Akun Claude**, tempat kamu bisa menambah akun, login, mengganti akun aktif, dan menghapus akun
dari kanban. Tombol **Akun** di panel pemakaian membuka tempat yang sama.

Setiap akun punya **folder Claude sendiri** (`CLAUDE_CONFIG_DIR`), jadi semua akun tetap login
bersamaan dan tidak saling menimpa:

| | Akun utama | Akun tambahan |
|---|---|---|
| Folder | `~/.claude` (bawaan Claude Code) | misalnya `~/.claude-pribadi`, dibuat otomatis |
| Login | seperti biasa | tombol **Login** di kartunya (membuka claude.ai di browser PC ini), atau di terminal: `$env:CLAUDE_CONFIG_DIR="…"; claude auth login` |
| Terminal | `claude` | tombol **Salin perintah terminal**: `$env:CLAUDE_CONFIG_DIR="…"; claude` |

- **Akun aktif** dipakai untuk prompt baru dari kanban, dan limitnya tampil di sidebar. Di
  composer kamu juga bisa memilih akun lain untuk satu prompt.
- **Akun per project**: di halaman project, di bawah path-nya, pilih akun untuk project itu, atau
  "Ikuti akun aktif". Bisa diganti kapan saja. Akun ini dipakai sesi baru project tersebut, baik
  dari composer (otomatis terpilih) maupun terminal lewat klik 2x di Kantor 3D. Kartu project di
  halaman utama diberi tag nama akunnya.
- **Lanjutan sesi** selalu memakai akun pemilik sesi itu, karena transcript-nya ada di folder
  akun tersebut. Untuk pindah akun, mulai sesi baru.
- Panel pemakaian menampilkan limit **setiap akun** berdampingan. Akun aktif diperbarui tiap 90
  detik, akun lain tiap 5 menit. Token juga dihitung per akun.
- Sesi dari semua folder akun muncul di kanban. Kalau ada lebih dari satu akun, kartu sesi diberi
  tag nama akunnya.
- Kalau login meminta kode dari browser, tempel kodenya di kartu akun. Output CLI juga bisa
  dilihat di sana.
- **Hapus** hanya melepas akun dari kanban. Folder, login, dan riwayatnya tetap ada di disk.
- Mengganti akun di kanban tidak mengubah terminal yang kamu buka sendiri. `claude` di sana tetap
  memakai akun utama, kecuali dibuka dengan perintah akun lain.

Data akun diambil dari `claude auth status --json` milik tiap folder, jadi kanban tidak membaca
file kredensial. Daftar akun disimpan di `data/profiles.json`.

### Token terpakai

Panel **Token terpakai** di halaman utama menghitung token dari transcript semua sesi dan
agent di PC ini:

- total **hari ini · 7 hari · 30 hari · semua**, dengan rincian output dan input baru
- grafik token per hari (14 hari), komposisi (input baru, output, tulis cache, baca cache),
  dan pembagian per model
- token per project (kartu project dan header project), per sesi (tab **Sesi**, termasuk
  agent-nya), per request (termasuk agent dari request itu), per agent, dan per sesi live

Setiap respons API ditulis di transcript sebagai beberapa baris dengan usage yang sama, jadi
kanban menghitung tiap respons sekali saja (berdasarkan id pesan). Panggilan internal CLI yang
tidak masuk transcript (misalnya compact dan judul otomatis) tidak ikut terhitung, sehingga
angkanya bisa sedikit di bawah hitungan CLI. *Baca cache* adalah konteks yang dibaca ulang tiap
giliran, jadi biasanya merupakan bagian terbesar.

### Kirim prompt dari kanban

Tombol **Prompt baru** (shortcut `N`), **Kirim prompt** di kartu sesi live, dan **Kirim
lanjutan** di detail kartu. Semua prompt dijalankan oleh Claude Code CLI resmi di folder project,
tanpa membuka terminal:

| Target | Yang terjadi |
|---|---|
| Sesi baru | `claude -p` di folder project, berjalan di background |
| Sesi yang tidak sedang terbuka | `claude -p --resume <id>`: percakapan yang sama dilanjutkan |
| Sesi yang sedang terbuka di terminal | `--resume <id> --fork-session`: cabang baru yang membawa seluruh riwayat, supaya tidak bentrok dengan terminalnya |
| Sesi yang sedang dikerjakan kanban | masuk **antrian**, dikirim otomatis setelah giliran sekarang selesai |

- Prompt dikirim lewat stdin, jadi tanda kutip dan karakter khusus aman.
- Mode izin bisa dipilih: **Auto**, **Edit file**, atau **Rencana saja**. Karena tidak ada terminal
  untuk menjawab, aksi yang butuh persetujuanmu ditolak otomatis (`--permission-prompts none`).
  Jumlah aksi yang ditolak dilaporkan saat prompt selesai. `bypassPermissions` sengaja tidak tersedia.
- Antrian dan riwayat prompt disimpan di `data/runs.json`. Prompt yang sedang berjalan bisa
  dihentikan, dan antrian bisa dibatalkan dari detail kartunya.
- Sesi yang sedang menunggu jawaban dialog di terminal (misalnya *permission prompt*) ditandai
  **Minta izin**, disertai toast dan notifikasi.

Kanban sengaja tidak mengetik langsung ke jendela terminal yang sedang terbuka.

**Keamanan:** endpoint yang menjalankan Claude hanya menerima permintaan dari halaman kanban
itu sendiri. Syaratnya: header `Origin` dan `Host` harus cocok, ada token acak per proses server,
dan body berupa JSON. Situs lain yang kamu buka di browser tidak bisa menyuruh Claude lewat kanban ini.

### Kenyamanan

- **Feed aktivitas live**: request baru, task mulai/selesai, agent mulai/selesai, dari semua
  project dalam 2 hari terakhir.
- **Toast + notifikasi desktop**: kabar saat Claude selesai dan *menunggu kamu*, atau saat
  agent selesai. Notifikasi desktop aktif lewat tombol 🔔 di sidebar, dan hanya muncul saat
  tab sedang tidak dibuka. Judul tab menampilkan jumlah sesi yang menunggu, misalnya `(1) Claude Kanban`.
- **Tema**: ikut sistem, terang, atau gelap (tombol di sidebar). "Ikut sistem" langsung berganti
  saat tema Windows berubah. Bisa juga dipaksa lewat URL `?theme=light` atau `?theme=dark`.
- **Terbaca**: teks keterangan dan teks berwarna status minimal 4,5:1 di kedua tema. Di HP,
  sidebar menjadi bar atas yang ringkas, dan di layar sentuh tombol serta field lebih besar.
  Warna dan ukuran diatur lewat design token, dijelaskan di [docs/design-tokens.md](docs/design-tokens.md).
- **Update tanpa kedip**: DOM di-patch, bukan diganti, jadi scroll, fokus, dan panel yang
  terbuka tetap di tempatnya saat data berubah.
- **Link langsung ke kartu**: `#/p/<project>/kanban/<id-kartu>`.

| Shortcut | Aksi |
|---|---|
| `N` | Tulis prompt baru |
| `Ctrl` + `Enter` | Kirim prompt (di composer) |
| `/` | Fokus ke kotak pencarian |
| `1` `2` `3` | Pindah tab Kanban / Timeline / Sesi |
| `Enter` | Buka kartu yang sedang fokus |
| `Esc` | Tutup detail |

## Cara kerja

Data dibaca **read-only** dari `~/.claude`:

| Sumber | Untuk |
|---|---|
| `sessions/<pid>.json` | sesi yang sedang hidup + status busy/idle (PID dicek masih hidup) |
| `projects/*/<session>.jsonl` | transcript: prompt, task, agent, aktivitas |
| `projects/*/<session>/subagents/*` | transcript dan metadata subagent |
| `jobs/*/state.json` | sesi background |
| `claude auth status --json` | akun yang login di tiap folder akun (email, organisasi, paket) |

Semua sumber di atas dibaca dari folder setiap akun yang terdaftar (`~/.claude` dan folder akun tambahan).

Transcript dibaca incremental per byte offset dan disimpan di `data/cache.json`, jadi file
ratusan MB hanya dibaca penuh sekali. Perubahan dideteksi lewat `fs.watch` dan polling 5 detik,
lalu dikirim ke browser lewat Server-Sent Events.

Server hanya listen di `127.0.0.1`. Kanban sendiri tidak mengirim transcript ke mana pun. Satu-satunya
yang keluar adalah prompt yang kamu kirim lewat composer, yang diteruskan ke Claude oleh Claude Code
CLI seperti biasa.

Rancangan lengkap ada di [PLAN.md](PLAN.md).
