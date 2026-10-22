# Design tokens

Semua warna, ukuran, dan bentuk dashboard didefinisikan sebagai CSS custom property di awal
[`public/style.css`](../public/style.css), dalam tiga lapis. Tiap lapis hanya membaca lapis di bawahnya.

| Lapis | Contoh | Isinya | Siapa yang membaca |
|---|---|---|---|
| **1. Primitive** | `--sand-100`, `--clay-500`, `--green-600` | nilai mentah, diberi nama menurut wujudnya | hanya lapis 2 |
| **2. Semantic** | `--surface`, `--text-3`, `--green`, `--green-ink`, `--r-lg` | peran di UI | semua komponen |
| **3. Component** | `--control-h`, `--control-r`, `--tile-r` | ukuran yang dipakai bersama satu jenis elemen | komponen terkait |

Aturannya: komponen tidak memakai primitive atau nilai hex langsung. Butuh warna baru? Tambahkan
primitive, petakan ke peran semantic, lalu pakai peran itu.

## Primitive

- **Sand** (`--sand-0` … `--sand-975`): netral hangat. Tema terang memakai ujung atas tangga,
  tema gelap ujung bawah.
- **Clay** (`--clay-50` … `--clay-990`): warna aksen.
- **Status**: hijau, kuning (amber), merah, biru, ungu, oranye, teal, masing-masing dalam empat langkah.
  `600` (isian) dan `100` (latar tipis) untuk tema terang, `400` dan `900` untuk tema gelap.
- **Kanal overlay** (`--umber`, `--cream`, `--soot`, `--night`, `--black`): angka RGB untuk warna
  transparan, misalnya `rgb(var(--umber) / .05)`.

Primitive sengaja ditulis sebagai hex biasa. Kantor 3D membaca warna semantic lewat `getComputedStyle`
dan memberikannya ke Three.js, yang tidak mengerti `color-mix()` atau `oklch()`.

## Semantic

| Token | Peran |
|---|---|
| `--bg`, `--surface`, `--surface-2`, `--sunken` | latar halaman, kartu, sidebar, area cekung |
| `--border`, `--border-2` | garis biasa dan garis yang lebih tegas |
| `--text`, `--text-2`, `--text-3` | teks utama, sekunder, dan keterangan (semuanya minimal 4,5:1) |
| `--accent`, `--accent-hi`, `--accent-soft` | aksen untuk isian, ikon, dan latar tipis |
| `--accent-strong`, `--on-accent` | tombol utama dan teks di atasnya (4,5:1) |
| `--green` … `--teal`, plus `-soft` | warna status untuk isian dan latar tipis |
| `--green-ink` … `--teal-ink`, `--accent-ink` | warna status **sebagai teks** |
| `--hover`, `--band`, `--scrim` | overlay saat hover, pita hari di timeline, latar modal |
| `--shadow-1` … `--shadow-3` | bayangan |
| `--r-xs` … `--r-full` | skala radius |
| `--ease-out`, `--ease-pop` | kurva animasi |
| `--z-drawer`, `--z-modal`, `--z-toast`, `--z-tooltip` | urutan lapisan |
| `--eyebrow`, `--eyebrow-track` | label kecil berhuruf kapital di atas bagian dan field |

**Warna status sebagai teks.** Hijau atau kuning di atas latar tipisnya hanya sekitar 3:1 di tema terang.
Token `-ink` mencampur warna status ke arah `--text` sampai terbaca 4,5:1. Persentasenya diatur
`--ink-mix`: 70% di tema terang, dan 100% di tema gelap (warnanya tidak berubah), karena di sana
warna status sudah cukup kontras. Ikon, titik, dan bar tetap memakai warna status aslinya.

**Kelas tone.** `.tone-green`, `.tone-amber`, dan seterusnya mengisi `--tone`, `--tone-soft`, dan
`--tone-ink`. Komponen seperti `.pill` atau `.kind` cukup membaca tiga nama itu, sehingga satu komponen
bisa tampil dalam warna status mana pun.

## Component

| Token | Nilai | Dipakai oleh |
|---|---|---|
| `--control-h` / `--control-h-sm` | 32 / 28px | tombol, field, chip, kotak pencarian, segmented control |
| `--control-r`, `--control-fs` | 9px, 12,5px | radius dan ukuran teks kontrol |
| `--focus-ring` | cincin 3px warna aksen tipis | field yang sedang fokus |
| `--tile-r` | 13px | kartu kanban, tile limit, tile token, blok teks |
| `--panel-pad` | 16px | padding panel |

Di layar sentuh (`pointer: coarse`) tinggi kontrol naik menjadi 38 / 34px. Cukup dua token itu
yang diubah, karena semua kontrol membacanya.

## Tema

Skrip di `index.html` selalu menetapkan `data-theme="light"` atau `"dark"` sebelum halaman digambar.
Pilihan "Ikuti sistem" diterjemahkan lewat `prefers-color-scheme` dan ikut berganti saat tema sistem
berubah. Karena itu palet gelap cukup ditulis sekali, di blok `:root[data-theme="dark"]`, yang hanya
mengganti token semantic.
