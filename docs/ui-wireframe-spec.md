# UI Wireframe & Interaction Specification — RF Personal Tech Dashboard

| Atribut | Nilai |
|---|---|
| Versi | 1.0 |
| Tanggal | 2026-11-14 |
| Status | Spesifikasi desain — siap implementasi, kecuali butir §12 |
| Acuan | `docs/blueprint-v1.0.md`, `docs/technical-decisions.md` (TD menang bila konflik) |
| Sifat | Dokumen desain. Tidak memuat kode implementasi. Nilai token adalah kontrak, bukan contoh. |

**Konvensi wireframe**

- Wireframe berskala indikatif, bukan pixel-perfect. Lebar karakter ≠ lebar piksel.
- `[ ]` = kontrol interaktif. `( )` = status/indikator. `~` = area berulang. `>>` = scroll.
- Desktop = 1440 px, sidebar expanded. Mobile = 390 px.
- Semua halaman publik memakai Global Shell (§3) kecuali Welcome Screen.
- **Shell** = sidebar + header + footer + background ambient.
- **Koleksi** = AI, Tools, Websites. **Tier** = `full` | `lite` (TD-10).

---

## 1. Design Tokens

### 1.1 Breakpoint

| Token | Nilai | Perubahan struktur |
|---|---|---|
| `sm` | 640 px | Masonry 2 kolom |
| `md` | 768 px | Gutter 24, jam tampil di header, tabel admin → card list |
| `lg` | 1024 px | Sidebar persisten (expanded/rail), masonry 3 kolom, drawer nonaktif |
| `xl` | 1280 px | Masonry 4 kolom, panel detail 2 kolom |
| `2xl` | 1536 px | Content max 1440 aktif, sisa ruang simetris |

Mobile-first. Satu-satunya breakpoint yang mengubah struktur navigasi: `lg`.

### 1.2 Spacing

| Token | px | Pemakaian utama |
|---|---|---|
| `space-1` | 4 | Gap ikon–teks, inset pill |
| `space-2` | 8 | Gap inline, padding chip |
| `space-3` | 12 | Padding kontrol kecil, gap metadata |
| `space-4` | 16 | Gutter mobile, padding kartu, gap grid mobile |
| `space-6` | 24 | Gutter desktop, gap grid, padding panel |
| `space-8` | 32 | Padding section, gap blok |
| `space-12` | 48 | Jarak antar-section besar |
| `space-16` | 64 | Padding hero, jarak category header |
| `space-24` | 96 | Padding vertikal halaman, jarak Welcome |

Tidak ada nilai spacing di luar skala. Pengecualian hanya 1 px border dan 2 px focus offset.

### 1.3 Dimensi Layout

| Token | Nilai | Catatan |
|---|---|---|
| `sidebar-expanded` | 280 px | Persisten `lg+` |
| `sidebar-rail` | 64 px | Ikon saja, tooltip label |
| `drawer-mobile` | 320 px / max 85vw | `width: min(320px, 85vw)` |
| `header-h` | 72 px | Publik dan admin |
| `content-max` | 1440 px | Termasuk padding dalam |
| `gutter` | 24 px (`md+`), 16 px (`<md`) | Kiri-kanan konten |
| `measure-text` | 68 ch | Kolom baca maksimum (About, Privacy) |
| `touch-min` | 44 × 44 px | Minimum target sentuh |
| `media-drop` | min 200 px tinggi | Dropzone admin |

### 1.4 Z-Index

| Token | Nilai | Elemen |
|---|---|---|
| `z-bg` | 0 | Canvas ambient, grid, noise |
| `z-content` | 10 | Konten halaman, kartu |
| `z-header` | 30 | Header sticky |
| `z-sidebar` | 40 | Sidebar desktop, floating trigger |
| `z-drawer` | 50 | Drawer mobile + backdrop |
| `z-search` | 60 | Overlay pencarian |
| `z-toast` | 70 | Toast, tooltip kritis |

Toast tidak boleh menutupi focus ring elemen aktif; posisinya bottom-right desktop, bottom-center mobile.

### 1.5 Radius, Border, Elevation

| Token | Nilai |
|---|---|
| `radius-none` | 0 |
| `radius-xs` | 2 px |
| `radius-sm` | 4 px |
| `radius-md` | 8 px |
| `radius-lg` | 12 px |
| `radius-pill` | 999 px |
| `border-w` | 1 px |
| `border-chrome` | `1px solid rgba(232,232,234,0.14)` |
| `border-chrome-strong` | `1px solid rgba(232,232,234,0.28)` |
| `border-accent` | `1px solid rgba(225,6,0,0.55)` |
| `elev-1` | `0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.45)` |
| `elev-2` | `0 24px 64px rgba(0,0,0,0.60)` |
| `glow-accent` | `0 0 0 1px rgba(225,6,0,0.35), 0 0 32px rgba(225,6,0,0.22)` |
| `glow-chrome` | `inset 0 1px 0 rgba(255,255,255,0.12)` |
| `focus-ring` | `0 0 0 2px var(--rf-bg), 0 0 0 4px var(--rf-accent-aa)` |

Aturan: panel = `radius-sm` (4 px). Kartu = `radius-sm`, kecuali kartu media = `radius-md`. Tombol pill hanya untuk chip, status, dan kontrol kecil. Radius ≥ 12 px dilarang pada panel utama (bertentangan dengan arah visual tegas).

Focus ring pada permukaan merah/chrome memakai `0 0 0 2px var(--rf-bg), 0 0 0 4px #FFFFFF`. Focus ring tidak pernah dihapus, hanya diganti warna.

### 1.6 Motion

| Token | Nilai | Pemakaian |
|---|---|---|
| `dur-1` | 120 ms | Hover, press, warna |
| `dur-2` | 160 ms | Chip, tooltip, focus |
| `dur-3` | 200 ms | Card enter, drawer slide |
| `dur-4` | 280 ms | Overlay, panel, route fade |
| `dur-5` | 360 ms | Accordion, section reveal |
| `dur-6` | 600 ms | Counter, hero reveal |
| `ease-standard` | `cubic-bezier(.2,.8,.2,1)` | Default |
| `ease-enter` | `cubic-bezier(.16,1,.3,1)` | Masuk |
| `ease-exit` | `cubic-bezier(.4,0,1,1)` | Keluar |
| `stagger-1` | 24 ms | Grid item |
| `stagger-2` | 40 ms | List item |
| `parallax-max` | 12 px | Pointer parallax (full tier saja) |

`lite` tier: hanya `opacity` + `transform` 150–250 ms. Tidak ada stagger berantai, blur, parallax, atau repeat.

### 1.7 Tipografi

Font final **belum diputuskan**. Yang ditetapkan adalah requirement dan fallback stack. Jangan mengikat implementasi ke nama keluarga font tertentu sebelum keputusan dicatat.

**Requirement karakter font**

| Aspek | Requirement |
|---|---|
| Kelas | Geometric / neo-grotesque, high contrast, closed aperture pada display |
| Bobot | Minimal 3 bobot tersedia: 400, 600, 700–800. Variabel lebih baik |
| Lebar | Tidak condensed. Angka tabular wajib untuk clock, counter, statistik |
| Cakupan | Latin Extended (ID + EN), tanpa glyph dekoratif wajib |
| Format | WOFF2, subset Latin, total ≤ 120 KB per keluarga |
| Lisensi | Self-host, boleh web embedding, tanpa biaya per-pageview |
| Mono | Harus jelas membedakan `0/O`, `1/l/I`; dipakai untuk ID, jam, kode |

**Fallback stack (berlaku sampai font final dipilih)**

```css
--rf-font-sans:  <TBD>, system-ui, -apple-system, "Segoe UI Variable Text",
                 "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--rf-font-mono:  <TBD-MONO>, ui-monospace, "Cascadia Mono", "SF Mono",
                 Menlo, Consolas, "Liberation Mono", monospace;
```

`<TBD>` adalah placeholder yang harus diganti satu kali di level token; tidak boleh ada `font-family` literal di komponen mana pun.

**Skala**

| Token | Desktop | Mobile | LH | Weight | Tracking | Pemakaian |
|---|---|---|---|---|---|---|
| `display` | 72–96 | 40–44 | 0.95 | 700–800 | -0.02em | Welcome title, angka 404 |
| `h1` | 48 | 32 | 1.05 | 700 | -0.015em | Judul halaman |
| `h2` | 36 | 26 | 1.10 | 600 | -0.01em | Judul section/kategori |
| `h3` | 28 | 22 | 1.20 | 600 | -0.005em | Judul panel, nama item detail |
| `h4` | 20 | 18 | 1.30 | 600 | 0 | Sub-judul kartu |
| `body` | 16 | 16 | 1.60 | 400 | 0 | Paragraf, deskripsi |
| `body-sm` | 14 | 14 | 1.55 | 400 | 0 | Metadata, helper |
| `caption` | 12 | 12 | 1.40 | 500 | 0.04em | Label, breadcrumb, footer |
| `mono` | 13 | 13 | 1.50 | 400 | 0 | ID, jam, counter, angka |

Aturan:

- `display` dan `h1` memakai `clamp()`; ukuran mobile adalah batas bawah.
- Uppercase hanya untuk `caption`, label tombol, dan nav section; maksimum 2 baris.
- Paragraf panjang dibatasi `68ch` (`measure-text`).
- Angka statistik memakai `font-variant-numeric: tabular-nums`.
- Tidak ada teks di bawah 12 px. Tidak ada body text di bawah 16 px.

### 1.8 Warna

Palet tunggal: **black / red / chrome**. Tidak ada hue lain, termasuk untuk kategori, status, atau chart.

| Token | Nilai | Pemakaian | Rasio vs `bg` |
|---|---|---|---|
| `black-000` | `#000000` | Backdrop, overlay | — |
| `black-050` | `#050506` | `bg` default | — |
| `black-100` | `#0A0A0B` | `surface` | — |
| `black-200` | `#101013` | `surface-raised` | — |
| `black-300` | `#16161A` | Panel hover, input | — |
| `chrome-100` | `#F5F5F7` | Teks pada chrome fill | 16.0:1 |
| `chrome-300` | `#E8E8EA` | `text` | 16.0:1 |
| `chrome-500` | `#A0A1A8` | `text-muted` | 8.4:1 |
| `chrome-700` | `#6D6E75` | Border dekoratif, ikon nonaktif | 3.6:1 (bukan teks) |
| `red-600` | `#E10600` | `accent`: fill, border, glow, teks ≥ 24 px | 4.0:1 |
| `red-400` | `#FF5C4D` | `accent-aa`: teks kecil, link, ikon aktif | 6.4:1 |
| `red-900` | `#3A0503` | Tint panel, gradient bawah | — |

Aturan kontras:

1. Teks body/caption wajib ≥ 4.5:1. `red-600` **tidak boleh** dipakai untuk teks < 24 px; gunakan `red-400` atau `chrome-300`.
2. Teks putih di atas fill `red-600` = 4.97:1 → lolos. Teks hitam di atas `red-600` = 4.23:1 → hanya untuk teks ≥ 24 px bold.
3. `text-muted` di `surface-raised` tetap ≥ 7:1. Bila tema mengubah nilai, rasio diuji ulang (§2).
4. Informasi status tidak boleh disampaikan lewat warna saja — selalu ada teks atau bentuk.

**Token semantik** (dipakai komponen, bukan palet mentah):

| Token | Default | Fungsi |
|---|---|---|
| `--rf-bg` | `black-050` | Latar halaman |
| `--rf-surface` | `black-100` | Panel, sidebar, header |
| `--rf-surface-raised` | `black-200` | Kartu, dropdown, modal |
| `--rf-surface-inset` | `black-000` @ 40% | Area input, code block, well |
| `--rf-border` | chrome @ 14% | Garis default |
| `--rf-border-strong` | chrome @ 28% | Hover, pemisah tegas |
| `--rf-text` | `chrome-300` | Teks utama |
| `--rf-text-muted` | `chrome-500` | Metadata, helper |
| `--rf-text-inverse` | `black-050` | Teks pada fill chrome/terang |
| `--rf-accent` | `red-600` | Aksen, fill aktif, glow |
| `--rf-accent-aa` | `red-400` | Teks aksen kecil, link |
| `--rf-accent-glow` | `rgba(225,6,0,.35)` | Glow, focus, ambient |
| `--rf-chrome-gradient` | `linear-gradient(135deg,#F5F5F7,#A0A1A8 48%,#3A3B40)` | Teks display, garis dekoratif, logo |
| `--rf-grid-line` | `rgba(232,232,234,.05)` | Grid background |
| `--rf-noise` | 0.06 | Opasitas tekstur noise |
| `--rf-overlay` | `rgba(0,0,0,.72)` | Backdrop drawer/search |
| `--rf-scrim` | `linear-gradient(180deg,transparent,rgba(0,0,0,.85))` | Kaki hero, keterbacaan |

Larangan: warna aksen per kategori, status, atau chart. Pembedaan kategori hanya lewat pola, intensitas, dan animasi (§4.3).

---

## 2. Theme System

Lima tema. Semua tetap dalam palet black/red/chrome; yang berubah adalah rasio, luminansi permukaan, dan intensitas glow. Tidak ada tema terang: struktur utama tetap hitam (blueprint §4.1).

State: `themeStore` (Zustand) → atribut `data-theme` pada `<html>`. Hanya satu tema aktif.

| Token | VOID (default) | EMBER | ION | CHROME | SIGNAL |
|---|---|---|---|---|---|
| `bg` | `#050506` | `#080403` | `#030507` | `#0A0A0B` | `#040404` |
| `surface` | `#0A0A0B` | `#120705` | `#070B10` | `#15161A` | `#0B0A0A` |
| `surface-raised` | `#101013` | `#1A0A06` | `#0C1218` | `#1E2024` | `#141010` |
| `border` | `rgba(232,232,234,.14)` | `rgba(255,92,77,.20)` | `rgba(232,232,234,.18)` | `rgba(232,232,234,.28)` | `rgba(225,6,0,.22)` |
| `text` | `#E8E8EA` | `#F3E9E6` | `#E9EDF0` | `#F5F5F7` | `#EDEDEF` |
| `text-muted` | `#A0A1A8` | `#B9A6A1` | `#9FABB4` | `#AFB1B8` | `#A6A5A9` |
| `accent` | `#E10600` | `#FF2D14` | `#E10600` | `#E10600` | `#FF1A0D` |
| `accent-aa` | `#FF5C4D` | `#FF7A66` | `#FF6A5E` | `#FF5C4D` | `#FF6F60` |
| `accent-glow` | `rgba(225,6,0,.35)` | `rgba(255,45,20,.45)` | `rgba(225,6,0,.28)` | `rgba(232,232,234,.18)` | `rgba(255,26,13,.55)` |
| `chrome-gradient` | `#F5F5F7→#A0A1A8→#3A3B40` | `#F3E2DE→#B9A6A1→#4A3A36` | `#EAF2F7→#93A3AE→#38444C` | `#FFFFFF→#C9CCD2→#5A5F67` | `#F2F0F0→#B7AFAF→#443C3C` |
| `grid-line` | `rgba(232,232,234,.05)` | `rgba(255,92,77,.06)` | `rgba(232,232,234,.06)` | `rgba(232,232,234,.09)` | `rgba(255,26,13,.07)` |
| `noise` | 0.06 | 0.08 | 0.05 | 0.09 | 0.10 |
| `glow-strength` | 1.0 | 1.25 | 0.8 | 0.6 | 1.5 |

**Karakter tema**

| Tema | Karakter visual | Perubahan struktural |
|---|---|---|
| VOID | Netral, hitam pekat, merah sebagai garis tegas | Baseline semua halaman |
| EMBER | Hangat, merah naik ke permukaan, chrome diredupkan | Border merah, glow hangat |
| ION | Dingin, chrome dominan, merah sparing | Grid lebih terlihat, partikel rapat |
| CHROME | Permukaan metalik, batas tegas, merah hanya aksen | Panel memakai gradient chrome tipis |
| SIGNAL | Paling agresif, glow tinggi, scanline halus | Overlay scanline statis, kontras border merah |

**Aturan tema**

1. Nama tema tidak diterjemahkan (TD-15) dan ditampilkan apa adanya.
2. `theme` disimpan di `sessionStorage` (`rf.theme`) hanya untuk konsistensi antar-route. Pada reload, tema direset ke `VOID` dan key ditimpa — sesuai permintaan produk "default saat reload" (lihat §12, butir 1).
3. Tidak ada `prefers-color-scheme` override. Tema tidak pernah otomatis.
4. Kontras diuji per tema: `text` vs `bg`, `text` vs `surface`, `text-muted` vs `surface-raised` ≥ 4.5:1; `accent` hanya untuk elemen non-teks atau teks ≥ 24 px.
5. Perubahan tema tidak memicu animasi transisi warna global > 200 ms; hanya `background-color`, `border-color`, `color` 160 ms. Tidak ada flash putih.
6. Pemilihan tema memicu 1 event SFX klik (volume tetap 0.35, tunduk master mute).
7. Theme switcher berupa 5 chip dengan contoh swatch 3 warna (hitam/merah/chrome), label teks, `aria-pressed`.

---

## 3. Global Shell

### 3.1 Welcome Screen (`/`)

**Tujuan:** gerbang singkat. Menampilkan identitas, animasi logo glitch, statistik, dan total pengunjung. Tidak ada intro loading tambahan.

**Anatomi:** full viewport, tanpa sidebar/header/footer. Background ambient penuh. Kartu tengah `content-max 1440`, padding `space-24` desktop / `space-8` mobile. Tiga lapis: logo + identity (atas), statistik (tengah), CTA + visitor (bawah).

```text
+----------------------------------------------------------------------------------------------+
|                                                                                              |
|   +--------------------------------------------------------------------------------------+   |
|   |                                                                                      |   |
|   |   [ RF MARK 160x160 ]        R F   P E R S O N A L   T E C H                        |   |
|   |   glitch + chrome sweep      D A S H B O A R D                                       |   |
|   |                                                                                      |   |
|   |   OWNER NAME  .  Role  .  Bandung, ID            <- city label, 30 hari (TD-01)      |   |
|   |                                                                                      |   |
|   |   +----------+ +----------+ +----------+ +----------+ +----------+                   |   |
|   |   | AI       | | TOOLS    | | WEBSITES | | PROJECTS | | SOCIAL   |                   |   |
|   |   |   024    | |   038    | |   019    | |   012    | |   017    |  <- counter 600 ms |   |
|   |   +----------+ +----------+ +----------+ +----------+ +----------+                   |   |
|   |                                                                                      |   |
|   |   VISITORS 12,480                                        [ ENTER WORKSPACE  -> ]      |   |
|   |                                                                                      |   |
|   |                                                       [ PLAY MUSIC ] (jika autoplay  |   |
|   |                                                                        diblokir)     |   |
|   +--------------------------------------------------------------------------------------+   |
|                                                                                              |
|   klik di mana saja = masuk . auto-enter 5.000 ms . tanpa scroll                             |
+----------------------------------------------------------------------------------------------+
```

Mobile 390:

```text
+------------------------------+
|                              |
|      [ RF MARK 96x96 ]       |
|                              |
|   RF PERSONAL TECH           |
|   DASHBOARD                  |
|                              |
|   OWNER NAME                 |
|   Role . Bandung, ID         |
|                              |
|  +--------+  +--------+      |
|  | AI  24 |  |TOOLS 38|      |
|  +--------+  +--------+      |
|  +--------+  +--------+      |
|  | WEB 19 |  | PROJ 12|      |
|  +--------+  +--------+      |
|  +--------------------+      |
|  | SOCIAL MEDIA   17  |      |
|  +--------------------+      |
|                              |
|  VISITORS 12,480             |
|  [ ENTER WORKSPACE -> ]      |
|  [ PLAY MUSIC ]              |
+------------------------------+
```

**Komponen:** logo mark (SVG, inline), wordmark display chrome-gradient, identity line, stat pair (5), visitor total (mono), primary CTA, `Play Music` (kondisional), ambient canvas, noise overlay.

**State:** loading data = counter menampilkan `--` (bukan skeleton penuh; layar tidak boleh kosong); error statistik = counter `--` + `Data unavailable` caption, CTA tetap aktif; autoplay gagal = tombol `Play Music` muncul dengan fade 200 ms; audio tidak pernah memblokir.

**Interaksi:** klik di area mana pun (kecuali tombol audio) masuk Workspace; Enter/Space saat fokus body juga masuk; auto-enter setelah 5000 ms; timer dibatalkan oleh interaksi apa pun; tidak ada scroll; tidak ada tombol kembali ke Welcome setelah masuk (hanya reload).

**Animasi:** GSAP timeline masuk 900 ms — mark scale 0.92→1 + glitch 3 frame (120 ms), wordmark chrome sweep 600 ms, stat stagger 80 ms, CTA fade 200 ms. Auto-enter memakai `ease-exit`. `lite`: tanpa glitch berulang, tanpa particle, hanya fade+translate 12 px 240 ms.

**Data/API:** `GET /api/v1/profile`, `GET /api/v1/statistics`, `GET /api/v1/visitor-count`, `GET /api/v1/presence` (opsional footer), `POST /api/v1/visits` (dikirim 1 detik setelah boot, sekali per full page load — TD-03).

### 3.2 Workspace Shell — Desktop (1440), Sidebar Expanded

```text
+--------------+---------------------------------------------------------------------------------+
| [RF] RF      |  Home / AI                                       [ Search ]  14:32:07  (*) ONLINE  | 72
| RF TECH      +---------------------------------------------------------------------------------+
|              |                                                                                 |
| MAIN         |  <main  max 1440 . gutter 24>                                                   |
| > Workspace  |                                                                                 |
|   AI         |  +---------------------------------------------------------------------------+  |
|   Tools      |  |                                                                           |  |
|   Websites   |  |   KONTEN HALAMAN                                                          |  |
|   Projects   |  |                                                                           |  |
|   Tech Stack |  |                                                                           |  |
|   Learning   |  |                                                                           |  |
|   Setup      |  |                                                                           |  |
|   Timeline   |  +---------------------------------------------------------------------------+  |
|   Statistics |                                                                                 |
|   About      |                                                                                 |
|   Contact    |                                                                                 |
|              |                                                                                 |
| DISPLAY      |                                                                                 |
| [theme 5]    |                                                                                 |
| [ID | EN]    |                                                                                 |
|              |                                                                                 |
| AUDIO        |                                                                                 |
| [>] track    |                                                                                 |
| [====----]   |                                                                                 |
| [MUTE]       |                                                                                 |
|              |                                                                                 |
| [<< HIDE]    |                                                                                 |
+--------------+---------------------------------------------------------------------------------+
| DB (*) ONLINE   .   OWNER (*) ONLINE . Bandung   .   VISITORS 12,480   .   Privacy Policy     |
+-------------------------------------------------------------------------------------------------+
```

Sidebar 280 px, `position: sticky/fixed`, tinggi `100dvh`. Header 72 px sticky di dalam kolom konten. Footer hanya di kolom konten, bukan di bawah sidebar.

### 3.3 Workspace Shell — Sidebar Rail (64) dan Hidden

```text
+----+--------------------------------------------------------------------------------------------+
|[RF]|  Home / AI                                     [ Search ]  14:32:07   (*) ONLINE           |
|    +--------------------------------------------------------------------------------------------+
|[>] |                                                                                            |
|[AI]|   KONTEN                                                                                    |
|[T] |                                                                                            |
|[W] |                                                                                            |
|[P] |                                                                                            |
|[TS]|                                                                                            |
|[LJ]|                                                                                            |
|[S] |                                                                                            |
|[TL]|                                                                                            |
|[ST]|                                                                                            |
|[AB]|                                                                                            |
|[CT]|                                                                                            |
|    |                                                                                            |
|[th]|                                                                                            |
|[id]|                                                                                            |
|[>] |                                                                                            |
|[M] |                                                                                            |
+----+--------------------------------------------------------------------------------------------+
```

Hidden: sidebar `translateX(-100%)`, lebar konten penuh, tombol floating kiri 48×48 pada `top: 88px; left: 16px`, ikon `»`, `aria-label="Tampilkan sidebar"`, z-index 40. Tombol tidak menutupi breadcrumb (breadcrumb bergeser 64 px saat hidden).

Rail: ikon 20 px + tooltip label di kanan (delay 300 ms). Item aktif = border kiri 2 px `accent` + ikon `accent-aa`, bukan fill penuh. Rail tidak menampilkan theme/language/music label; hanya ikon yang membuka popover.

### 3.4 Workspace Shell — Mobile (390), Drawer + Backdrop

```text
+--------------------------------+     +--------------------------------+
| [=] RF            [S]  (o)     |     |########## BACKDROP ###########|
|--------------------------------|     |##############################|
| Home / AI                      |     |#####+-----------------------+|
|                                |     |#####| [X]  RF               ||
|  KONTEN (gutter 16)            |     |#####|                       ||
|                                |     |#####| MAIN                  ||
|  +--------------------------+  |     |#####|  Workspace            ||
|  |                          |  |     |#####|  AI                   ||
|  |                          |  |     |#####|  Tools                ||
|  |                          |  |     |#####|  ...                  ||
|  +--------------------------+  |     |#####|                       ||
|                                |     |#####| DISPLAY               ||
|  +--------------------------+  |     |#####| [theme] [ID|EN]       ||
|  |                          |  |     |#####| AUDIO                 ||
|  +--------------------------+  |     |#####| [>] [====] [MUTE]     ||
|                                |     |#####| [<< HIDE]             ||
|                                |     |#####+-----------------------+|
+--------------------------------+     +--------------------------------+
  konten 390, drawer tertutup            drawer 320 / max 85vw, backdrop
```

Drawer: `width: min(320px, 85vw)`, full height, `surface`, border kanan `border-chrome`, shadow `elev-2`, slide 200 ms `ease-enter`. Backdrop `rgba(0,0,0,.72)` + blur 2 px (blur dimatikan pada tier `lite`).

### 3.5 Header

```text
+----------------------------------------------------------------------------------------------+
| Home / AI                                        [ Search...  / ]   14:32:07   (*) ONLINE    |
| ^breadcrumb, caption, maks 2 level                ^trigger 240px     ^mono        ^status     |
+----------------------------------------------------------------------------------------------+
```

| Elemen | Spesifikasi |
|---|---|
| Breadcrumb | `caption`, level terakhir `text`, sebelumnya `text-muted`. Root memakai label `Home`; penetapan label final ada di §12 butir 3 |
| Search trigger | Tombol 40 px tinggi, border chrome, ikon + placeholder `Search` + `kbd /`. Desktop menampilkan input semu; `<md` hanya ikon 44×44 |
| Clock | Waktu lokal perangkat, `mono`, `HH:MM:SS`, update 1 detik. `<md` disembunyikan; tetap tersedia di footer drawer |
| Status | Satu indikator gabungan: dot 8 px + label `ONLINE`/`OFFLINE`. Sumber: DB status dan owner presence. Teks wajib ada (bukan warna saja) |
| Klik status | Popover kecil: DB status, owner presence + `lastSeenAt`, lokasi kota. Tanpa polling (dicek saat mount/refresh) |
| Mobile | `[=]` drawer, wordmark kecil, search ikon, dot status. Tinggi tetap 72 |

Header tidak memuat notifikasi, avatar admin, atau menu profil pada sisi publik.

### 3.6 Footer

```text
+----------------------------------------------------------------------------------------------+
| (*) DB ONLINE   .   OWNER ONLINE . Bandung, ID   .   VISITORS 12,480   .   Privacy Policy   |
|                                                                       (c) 2026 RF            |
+----------------------------------------------------------------------------------------------+
```

- Desktop satu baris; mobile dua baris (status, lalu visitor + privacy).
- DB status: `GET /api/v1/statistics` atau health response — dicek saat halaman dibuka/refresh, **bukan polling** (blueprint §11.3).
- Owner presence: `GET /api/v1/presence`, cache 30 detik, refetch saat window focus.
- Lokasi: hanya `ownerLocationLabel`; jika `ownerLocationUpdatedAt` > 30 hari atau kosong → `Location unavailable`.
- Visitor count: total kumulatif, `mono`, tabular.
- Footer tidak menampilkan jam (jam ada di header) dan tidak menampilkan tautan sosial (sosial ada di `/workspace`).

### 3.7 Perilaku Shell

| Aksi | Desktop `lg+` | Mobile `<lg` |
|---|---|---|
| Hide sidebar | Sidebar keluar 200 ms, konten melebar, floating trigger muncul, state di memori sesi | Tidak berlaku (drawer) |
| Show sidebar | Floating trigger atau `[` | `[=]` membuka drawer |
| Collapse ke rail | Tombol `<<` pada sidebar expanded (bukan pada mobile) | Tidak berlaku |
| Tutup drawer | — | `X`, tap backdrop, swipe kiri ≥ 64 px atau velocity ≥ 0.4 px/ms |
| Escape | Menutup search → popover → drawer (urutan teratas dahulu) | Sama |
| Focus | Focus trap saat drawer/search terbuka; `inert` pada konten di belakang | Sama |
| Scroll | Body scroll normal; sidebar internal scroll bila nav > viewport | Scroll lock saat drawer terbuka, scrollbar-gutter dijaga |

**Focus trap (drawer):** fokus awal ke tombol `X`; Tab/Shift+Tab bersiklus di dalam drawer; fokus kembali ke `[=]` saat ditutup; `aria-modal="true"`, `role="dialog"`, `aria-label="Navigasi utama"`. Background `inert` + `aria-hidden="true"`.

**Swipe kiri:** hanya pada area drawer, bukan pada kontrol slider volume (dikecualikan). Gesture tidak boleh memicu navigasi back browser.

**Persistensi state sidebar:** disimpan di memori sesi aplikasi (bukan `localStorage`), agar reload kembali ke expanded.

---

## 4. Halaman Publik

**Pola koleksi (berlaku untuk §4.2–4.7).** Satu halaman = section per kategori, berurutan sesuai urutan kategori. Tiap section: Category Header (§4.3) + masonry + Load More milik section itu (12 awal, +12 — TD-08). Subkategori tampil sebagai label pada kartu dan pada breadcrumb detail; tidak ada kontrol filter kategori/subkategori di halaman publik (tidak diminta blueprint). Interpretasi ini dicatat di §12 butir 4.

**Anatomi kartu masonry.** Logo 40 px (fallback ikon), nama `h4`, label subkategori `caption`, status pill (dot + teks), deskripsi opsional, seluruh kartu = satu tautan. Tinggi varian ditentukan isi: `S` = tanpa deskripsi, `M` = deskripsi ≤ 140 karakter, `L` = deskripsi > 140 karakter. Tidak ada ukuran acak.

### 4.1 `/workspace`

**Tujuan:** hub navigasi setelah Welcome. Menjawab "apa saja isi RF" dalam satu layar dan memberi jalan ke semua koleksi.

**Anatomi:** hero ringkas (sapaan + identitas + lokasi kota) → 3 tile koleksi besar (AI, Tools, Websites) dengan counter + pola header → grid 2×3 tautan sekunder → strip Social Media → footer.

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Home                                                      [ Search ]  14:32  (*)  |
|              +---------------------------------------------------------------------------------+
| MAIN         |  +---------------------------------------------------------------------------+  |
| > Workspace  |  | WORKSPACE                                                   (ambient grid)  |  |
|   AI         |  | OWNER NAME . Role . Bandung, ID                    24 item / 5 kategori    |  |
|   Tools      |  +---------------------------------------------------------------------------+  |
|   Websites   |                                                                                 |
|   Projects   |  +---------------------+ +---------------------+ +---------------------+        |
|   Tech Stack |  | AI            024  | | TOOLS         038  | | WEBSITES      019  |        |
|   Learning   |  | [pattern 01]        | | [pattern 02]        | | [pattern 03]        |        |
|   Setup      |  | Chatbot . Coding .  | | Dev . Design .      | | Admin-managed       |        |
|   Timeline   |  | [ BUKA  -> ]        | | [ BUKA  -> ]        | | [ BUKA  -> ]        |        |
|   Statistics |  +---------------------+ +---------------------+ +---------------------+        |
|   About      |                                                                                 |
|   Contact    |  +---------------------+ +---------------------+ +---------------------+        |
|              |  | PROJECTS       012  | | TECH STACK     026  | | LEARNING       009  |        |
| DISPLAY      |  +---------------------+ +---------------------+ +---------------------+        |
| [theme]      |  +---------------------+ +---------------------+ +---------------------+        |
| [ID|EN]      |  | SETUP & DEVICES 02  | | TIMELINE       041  | | STATISTICS          |        |
|              |  +---------------------+ +---------------------+ +---------------------+        |
| AUDIO        |                                                                                 |
| [>] [====]   |  SOCIAL MEDIA   [IG] [TT] [YT] [X] [DC] [FB] [>]                                |
| [MUTE]       |                                                                                 |
+--------------+---------------------------------------------------------------------------------+
| DB (*) ONLINE . OWNER (*) ONLINE . Bandung . VISITORS 12,480 . Privacy Policy                 |
+-------------------------------------------------------------------------------------------------+
```

```text
+------------------------------+
| [=] RF            [S]  (*)  |
|------------------------------|
| WORKSPACE                    |
| OWNER NAME . Role            |
| Bandung, ID                  |
|                              |
| +--------------------------+ |
| | AI                  024  | |
| | [pattern]   [BUKA ->]    | |
| +--------------------------+ |
| +--------------------------+ |
| | TOOLS               038  | |
| +--------------------------+ |
| +--------------------------+ |
| | WEBSITES            019  | |
| +--------------------------+ |
|                              |
| +------------+ +-----------+ |
| | PROJECTS   | | TECH      | |
| | 012        | | STACK 026 | |
| +------------+ +-----------+ |
| +------------+ +-----------+ |
| | LEARNING   | | SETUP  02 | |
| +------------+ +-----------+ |
| +------------+ +-----------+ |
| | TIMELINE   | | STATS     | |
| +------------+ +-----------+ |
|                              |
| SOCIAL   [IG][TT][YT][X]     |
+------------------------------+
```

**Komponen:** page hero, collection tile (counter `mono` + pola CSS + CTA), secondary tile, social strip (logo + `aria-label` platform), footer.

**State:** loading = 3 tile skeleton setinggi tile final; error statistik = tile tetap tampil dengan counter `--` + retry inline; koleksi kosong = tile tetap tampil dengan `0 item`; sosial kosong = strip disembunyikan, bukan empty state.

**Interaksi:** tile = satu tautan (bukan kartu dengan beberapa tombol); hover = border `accent` + translateY(-2px); sosial = tautan eksternal `target=_blank rel="noopener noreferrer"`; `Enter` pada tile membuka rute.

**Animasi:** GSAP — counter 600 ms `power2.out`, category pattern drift 12 s loop (pause saat hidden/off-screen). Motion — tile stagger 40 ms masuk, hover `dur-1`. `lite`: counter tanpa tween (langsung nilai akhir) atau 300 ms; pattern statis; tanpa parallax.

**Data/API:** `GET /api/v1/profile`, `GET /api/v1/statistics`, `GET /api/v1/social-media`.

### 4.2 `/ai` — Koleksi AI

**Tujuan:** menampilkan seluruh AI yang pernah/sedang dipakai, dikelompokkan per kategori tetap (Chatbot, Image Generation, Video Generation, Voice AI, Coding AI, Automation).

**Anatomi:** page title + deskripsi singkat → untuk setiap kategori: Category Header (§4.3) → masonry → Load More → spacer `space-16`.

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Home / AI                                                 [ Search ]  14:32  (*)  |
|              +---------------------------------------------------------------------------------+
| MAIN         |  AI COLLECTION                                       24 item . 6 kategori          |
| > AI         |  Seluruh AI yang pernah dan sedang saya gunakan.                                |
|              |  +---------------------------------------------------------------------------+  |
|              |  | 01 / CHATBOT                                      [scanline + red sweep]  |  |
|              |  | CHATBOT                                                    006            |  |
|              |  | Asisten percakapan yang dipakai harian.                                    |  |
|              |  +---------------------------------------------------------------------------+  |
|              |                                                                                 |
|              |  +--------------+ +--------------+ +--------------+ +--------------+            |
|              |  | [logo] Name  | | [logo] Name  | | [logo] Name  | | [logo] Name  |            |
|              |  | Chatbot . *  | | Chatbot . *  | | Chatbot . o  | | Chatbot . o  |            |
|              |  | desc 2 baris | |              | | desc 3 baris | |              |            |
|              |  +--------------+ +--------------+ +--------------+ +--------------+            |
|              |  +--------------+ +--------------+ +--------------+ +--------------+            |
|              |  | [logo] Name  | | [logo] Name  | | [logo] Name  | | [logo] Name  |            |
|              |  +--------------+ +--------------+ +--------------+ +--------------+            |
|              |                        [ LOAD MORE  +12 ]                                  |
|              |                                                                                 |
|              |  +---------------------------------------------------------------------------+  |
|              |  | 02 / CODING AI                                    [grid drift + pulse]   |  |
|              |  | CODING AI                                                  004            |  |
|              |  +---------------------------------------------------------------------------+  |
|              |  +--------------+ +--------------+ +--------------+ +--------------+            |
|              |  ~ kartu ~                                                                      |
|              |                                                                                 |
+--------------+---------------------------------------------------------------------------------+
| DB (*) ONLINE . OWNER (*) ONLINE . Bandung . VISITORS 12,480 . Privacy Policy                 |
+-------------------------------------------------------------------------------------------------+
```

```text
+------------------------------+
| [=] RF            [S]  (*)  |
|------------------------------|
| Home / AI                    |
| AI COLLECTION    24 . 6 kat  |
|                              |
| +--------------------------+ |
| | CHATBOT            006   | |
| | [pattern + counter]      | |
| +--------------------------+ |
| +--------------------------+ |
| | [logo] Name              | |
| | Chatbot . *              | |
| | desc 2 baris             | |
| +--------------------------+ |
| +--------------------------+ |
| | [logo] Name              | |
| +--------------------------+ |
| +--------------------------+ |
| | [logo] Name              | |
| +--------------------------+ |
| [ LOAD MORE +12 ]            |
| +--------------------------+ |
| | CODING AI          004   | |
| +--------------------------+ |
+------------------------------+
```

**Komponen:** page header, Category Header, masonry, item card, status pill, Load More, end-of-list marker.

**State:**
- Loading: skeleton header (240 px) + 6 skeleton kartu; skeleton tidak memakai shimmer terang — pulsa opasitas `surface` 0.6→1.
- Empty kategori: animated empty state di dalam section (glyph grid + `Belum ada item di kategori ini`), header tetap tampil.
- Empty halaman (semua kategori kosong): satu empty state halaman + tautan ke `/workspace`.
- Error: panel error + `Retry` (refetch section, bukan reload halaman).
- Not found: tidak berlaku.

**Interaksi:** klik kartu → `/ai/:id`; keyboard Tab ke kartu, Enter membuka; Load More mempertahankan posisi scroll dan fokus pada tombol (berubah menjadi `Loading…` lalu fokus ke kartu pertama yang baru); setelah `nextCursor = null`, tombol diganti teks `Semua item sudah dimuat`.

**Animasi:** Motion — kartu masuk fade+translateY 8 px, stagger 24 ms, hanya untuk 12 item pertama per section; setelah append, item baru fade 160 ms tanpa re-animasi layout. GSAP — counter 600 ms, pattern drift. Tidak ada animasi layout penuh setelah Load More (TD-08). `lite`: stagger 0, semua item fade 150 ms.

**Data/API:** `GET /api/v1/collections/ai?limit=12&cursor=` (+ `categoryId`), `GET /api/v1/statistics` untuk total. Counter kategori diturunkan dari jumlah item (bila API menyertakan total); jika tidak, hitung dari hasil yang dimuat dan tandai `24+`.

### 4.3 Category Header (komponen bersama)

**Tujuan:** memberi identitas visual per kategori tanpa warna aksen tambahan.

**Struktur:** eyebrow `01 / CHATBOT`, judul `h2` (nama kategori, diterjemahkan — TD-15), deskripsi 1–2 baris (ditulis di kode, bukan CMS), counter besar `display` (96–160 px) dengan angka tabular, area pola CSS 100% × 200–280 px.

```text
+-------------------------------------------------------------------------------------------+
| 01 / CHATBOT                                                              +-------------+  |
| CHATBOT                                                                   |   0 0 6     |  |
| Asisten percakapan yang dipakai harian.                                   +-------------+  |
|                                                                                           |
|  [ pola CSS: garis scanline 2px . gradient merah 18% . chrome edge kiri ]                  |
+-------------------------------------------------------------------------------------------+
```

**Sistem pola (6 varian, dipilih `index % 6`):**

| # | Pola | Animasi | Intensitas |
|---|---|---|---|
| 01 | Scanline horizontal | sweep vertikal 8 s | merah 18%, chrome garis |
| 02 | Grid radial | drift diagonal 14 s | chrome 22%, merah titik |
| 03 | Hatch diagonal | geser 10 s | merah 12%, chrome 30% |
| 04 | Ring konsentris | pulse skala 6 s | chrome 26%, merah 8% |
| 05 | Dot matrix | wave opasitas 12 s | chrome 18%, merah 14% |
| 06 | Kolom terpotong | glitch sesekali 5 s | merah 24%, chrome 20% |

Aturan: pola hanya memakai `--rf-accent`, `--rf-accent-glow`, `--rf-chrome-gradient`, `--rf-grid-line`. Tidak boleh menambah hue. Tidak boleh membuat pola yang sama dua kali berurutan pada halaman yang sama.

**Counter:** animasi 0 → N dalam 600 ms saat section masuk viewport (sekali saja, `ScrollTrigger once`). `aria-hidden="true"` pada angka animasi + teks SR `24 item` di luar area visual. `lite`: nilai langsung tampil tanpa tween, pola statis.

### 4.4 `/ai/:id` — Detail Item AI

**Tujuan:** informasi lengkap satu item + tautan keluar + navigasi A–Z dalam kategori.

**Anatomi:** breadcrumb (`Home / AI / <Kategori> / <Nama>`) → grid 12 kolom: kiri (4) logo + status + meta, kanan (8) nama, deskripsi, links; bawah: prev/next. Di `<xl` menjadi satu kolom.

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Home / AI / Chatbot / Example AI                          [ Search ]  14:32  (*) |
|              +---------------------------------------------------------------------------------+
| MAIN         |  +---------------------------+------------------------------------------------+  |
| > AI         |  | +-----------------------+ |  EXAMPLE AI                                    |  |
|              |  | |                       | |  Chatbot . AI                                  |  |
|              |  | |      LOGO 240         | |  (o) SEDANG DIGUNAKAN                          |  |
|              |  | |                       | |                                                |  |
|              |  | +-----------------------+ |  Deskripsi panjang 3–6 baris. Paragraf         |  |
|              |  | (o) SEDANG DIGUNAKAN      | |  dibatasi 68ch. Tidak ada rich text.           |  |
|              |  |                           | |                                                |  |
|              |  | KATEGORI   Chatbot        | |  +------------------------------------------+  |  |
|              |  | SUBKATEGORI Chatbot       | |  | [ Website  -> ]  [ Docs  -> ]            |  |  |
|              |  | DITAMBAHKAN 12 Mar 2026   | |  +------------------------------------------+  |  |
|              |  +---------------------------+------------------------------------------------+  |
|              |                                                                                 |
|              |  +---------------------------+  +---------------------------+                   |
|              |  | <- PREV  (A–Z)            |  | NEXT  (A–Z) ->            |                   |
|              |  | Another AI                |  | Next Example              |                   |
|              |  +---------------------------+  +---------------------------+                   |
+--------------+---------------------------------------------------------------------------------+
| DB (*) ONLINE . OWNER (*) ONLINE . Bandung . VISITORS 12,480 . Privacy Policy                 |
+-------------------------------------------------------------------------------------------------+
```

```text
+------------------------------+
| [=] RF            [S]  (*)  |
|------------------------------|
| Home / AI / Chatbot          |
|                              |
| +--------------------------+ |
| |        LOGO 160          | |
| +--------------------------+ |
| EXAMPLE AI                   |
| Chatbot . AI                 |
| (o) SEDANG DIGUNAKAN         |
|                              |
| Deskripsi 3–6 baris.         |
|                              |
| [ Website -> ]               |
| [ Docs -> ]                  |
|                              |
| +------------+ +-----------+ |
| | <- PREV    | | NEXT ->   | |
| +------------+ +-----------+ |
+------------------------------+
```

**Komponen:** breadcrumb, logo (rasio 1:1, `object-fit: contain`, fallback ikon), title `h3`, meta kategori/subkategori, status pill, description, link list (label + ikon eksternal), prev/next, tombol kembali ke kategori (teks, bukan ikon saja).

**Status (label publik):** `CURRENTLY_USING` = `Sedang Digunakan`; `PREVIOUSLY_USED` = `Pernah Digunakan`; `EXPLORING` = `Sedang Dieksplorasi`; `WANT_TO_TRY` = `Ingin Dicoba`. Semua memakai dot + teks; tidak ada warna berbeda per status (semua `accent`/`chrome`).

**State:** loading = skeleton 2 kolom (logo block 240, 4 baris teks); not found = `404` halaman (bukan state inline) karena URL adalah identitas; error = panel error + `Retry`; media logo gagal = fallback kotak ikon + inisial nama; deskripsi kosong = section disembunyikan; links kosong = section `Tautan` disembunyikan; prev/next batas = tombol `disabled` + `aria-disabled`, bukan hilang.

**Interaksi:** links buka tab baru; prev/next hanya di kategori sama, urutan `lower(name) ASC, id ASC` (TD-07) — pada batas kategori tombol nonaktif; back browser mengembalikan posisi scroll daftar (lihat §5.7); breadcrumb kategori kembali ke section kategori terkait (anchor), bukan ke atas halaman.

**Animasi:** Motion — transisi antar-item: konten lama fade 120 ms + konten baru fade+translateY 8 px 200 ms; logo scale 0.98→1. GSAP — garis aksen kiri panel tumbuh 240 ms. `lite`: hanya fade 150 ms.

**Data/API:** detail item — **belum ada endpoint detail di blueprint §7.4** (lihat §12 butir 5). Prev/next diturunkan dari daftar kategori terurut A–Z. `GET /api/v1/collections/ai`.

### 4.5 `/tools` — Koleksi Tools

Sama dengan §4.2 dengan perbedaan: kategori awal Development, Design, Productivity, Automation, Media & Content; admin dapat menambah kategori/subkategori (blueprint §5.2). Judul `TOOLS COLLECTION`, deskripsi kode, counter total.

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Home / Tools                                               [ Search ]  14:32 (*)  |
|              +---------------------------------------------------------------------------------+
| MAIN         |  TOOLS COLLECTION                                    38 item . 5 kategori          |
| > Tools      |  +---------------------------------------------------------------------------+  |
|              |  | 01 / DEVELOPMENT TOOLS                            [hatch diagonal]        |  |
|              |  | DEVELOPMENT TOOLS                                          012            |  |
|              |  +---------------------------------------------------------------------------+  |
|              |  +--------------+ +--------------+ +--------------+ +--------------+            |
|              |  | [logo] Name  | | [logo] Name  | | [logo] Name  | | [logo] Name  |            |
|              |  +--------------+ +--------------+ +--------------+ +--------------+            |
|              |                        [ LOAD MORE  +12 ]                                  |
|              |  ... kategori berikutnya ...                                                   |
+--------------+---------------------------------------------------------------------------------+
| DB (*) ONLINE . OWNER (*) ONLINE . Bandung . VISITORS 12,480 . Privacy Policy                 |
+-------------------------------------------------------------------------------------------------+
```

```text
+------------------------------+
| [=] RF            [S]  (*)  |
|------------------------------|
| Home / Tools                 |
| TOOLS COLLECTION  38 . 5     |
| +--------------------------+ |
| | DEVELOPMENT TOOLS  012   | |
| | [hatch + counter]        | |
| +--------------------------+ |
| +--------------------------+ |
| | [logo] Name              | |
| | Development . *          | |
| +--------------------------+ |
| +--------------------------+ |
| | [logo] Name              | |
| +--------------------------+ |
| [ LOAD MORE +12 ]            |
+------------------------------+
```

**Komponen/state/interaksi/animasi:** sama dengan §4.2. **Data/API:** `GET /api/v1/collections/tools?limit=12&cursor=&categoryId=`.

### 4.6 `/tools/:id` — Detail Tool

**Tujuan:** detail satu tool + tautan keluar + prev/next A–Z dalam kategori. **Anatomi:** identik §4.4 (grid 4/8 → 1 kolom di `<xl`).

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Home / Tools / Development / Example Tool                  [ Search ]  14:32 (*) |
|              +---------------------------------------------------------------------------------+
| MAIN         |  +---------------------------+------------------------------------------------+  |
| > Tools      |  | +-----------------------+ |  EXAMPLE TOOL                                  |  |
|              |  | |      LOGO 240         | |  Development Tools . Development               |  |
|              |  | +-----------------------+ |  (o) PERNAH DIGUNAKAN                          |  |
|              |  | (o) PERNAH DIGUNAKAN      | |                                                |  |
|              |  | KATEGORI    Development   | |  Deskripsi 3–6 baris, maks 68ch.                |  |
|              |  | SUBKATEGORI Development   | |                                                |  |
|              |  | DITAMBAHKAN 12 Mar 2026   | |  [ Website  -> ]   [ Docs  -> ]                |  |
|              |  +---------------------------+------------------------------------------------+  |
|              |  +---------------------------+  +---------------------------+                   |
|              |  | <- PREV  Another Tool     |  | NEXT  Next Tool  ->        |                   |
|              |  +---------------------------+  +---------------------------+                   |
+--------------+---------------------------------------------------------------------------------+
| DB (*) ONLINE . OWNER (*) ONLINE . Bandung . VISITORS 12,480 . Privacy Policy                 |
+-------------------------------------------------------------------------------------------------+
```

```text
+------------------------------+
| [=] RF            [S]  (*)  |
|------------------------------|
| Home / Tools / Development   |
| +--------------------------+ |
| |        LOGO 160          | |
| +--------------------------+ |
| EXAMPLE TOOL                 |
| Development . *              |
| Deskripsi 3–6 baris.         |
| [ Website -> ]               |
| [ Docs -> ]                  |
| +------------+ +-----------+ |
| | <- PREV    | | NEXT ->   | |
| +------------+ +-----------+ |
+------------------------------+
```

**Komponen/state/interaksi/animasi:** sama dengan §4.4. **Data/API:** `GET /api/v1/collections/tools` (endpoint detail belum ada — §12 butir 5).

### 4.7 `/websites` — Koleksi Websites

Sama dengan §4.2; kategori sepenuhnya dikelola admin (blueprint §5.3), sehingga jumlah section tidak tetap. Bila kategori > 8, section tetap dirender berurutan (tanpa tab) dan nav halaman memakai daftar isi ringkas di atas (teks, bukan filter).

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Home / Websites                                            [ Search ]  14:32 (*)  |
|              +---------------------------------------------------------------------------------+
| MAIN         |  WEBSITES COLLECTION                                 19 item . 4 kategori          |
| > Websites   |  +---------------------------------------------------------------------------+  |
|              |  | 01 / LEARNING PLATFORMS                           [ring pulse]           |  |
|              |  | LEARNING PLATFORMS                                          007            |  |
|              |  +---------------------------------------------------------------------------+  |
|              |  +--------------+ +--------------+ +--------------+ +--------------+            |
|              |  | [logo] Name  | | [logo] Name  | | [logo] Name  | | [logo] Name  |            |
|              |  +--------------+ +--------------+ +--------------+ +--------------+            |
+--------------+---------------------------------------------------------------------------------+
| DB (*) ONLINE . OWNER (*) ONLINE . Bandung . VISITORS 12,480 . Privacy Policy                 |
+-------------------------------------------------------------------------------------------------+
```

```text
+------------------------------+
| [=] RF            [S]  (*)  |
|------------------------------|
| Home / Websites              |
| WEBSITES         19 . 4      |
| +--------------------------+ |
| | LEARNING PLATFORMS  007  | |
| +--------------------------+ |
| +--------------------------+ |
| | [logo] Name              | |
| | Learning . *             | |
| +--------------------------+ |
| +--------------------------+ |
| | [logo] Name              | |
| +--------------------------+ |
| [ LOAD MORE +12 ]            |
+------------------------------+
```

State tambahan: kategori kosong (baru dibuat admin) tetap tampil dengan empty state dan counter `000`; kategori tanpa item tidak boleh menyembunyikan header. Animasi/interaksi sama §4.2. **Data/API:** `GET /api/v1/collections/websites?limit=12&cursor=&categoryId=`.

### 4.8 `/websites/:id` — Detail Website

**Tujuan:** detail satu website + tautan keluar + prev/next A–Z. **Anatomi:** identik §4.4.

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Home / Websites / Learning / Example Site                  [ Search ]  14:32 (*) |
|              +---------------------------------------------------------------------------------+
| MAIN         |  +---------------------------+------------------------------------------------+  |
| > Websites   |  | +-----------------------+ |  EXAMPLE SITE                                  |  |
|              |  | |      LOGO 240         | |  Learning Platforms . Learning                 |  |
|              |  | +-----------------------+ |  (o) SEDANG DIGUNAKAN                          |  |
|              |  | (o) SEDANG DIGUNAKAN      | |                                                |  |
|              |  | KATEGORI    Learning      | |  Deskripsi 3–6 baris, maks 68ch.                |  |
|              |  | SUBKATEGORI Learning      | |                                                |  |
|              |  | DITAMBAHKAN 12 Mar 2026   | |  [ Kunjungi  -> ]                               |  |
|              |  +---------------------------+------------------------------------------------+  |
|              |  +---------------------------+  +---------------------------+                   |
|              |  | <- PREV  Another Site     |  | NEXT  Next Site  ->        |                   |
|              |  +---------------------------+  +---------------------------+                   |
+--------------+---------------------------------------------------------------------------------+
| DB (*) ONLINE . OWNER (*) ONLINE . Bandung . VISITORS 12,480 . Privacy Policy                 |
+-------------------------------------------------------------------------------------------------+
```

```text
+------------------------------+
| [=] RF            [S]  (*)  |
|------------------------------|
| Home / Websites / Learning   |
| +--------------------------+ |
| |        LOGO 160          | |
| +--------------------------+ |
| EXAMPLE SITE                 |
| Learning . *                 |
| Deskripsi 3–6 baris.         |
| [ Kunjungi -> ]              |
| +------------+ +-----------+ |
| | <- PREV    | | NEXT ->   | |
| +------------+ +-----------+ |
+------------------------------+
```

**Komponen/state/interaksi/animasi:** sama dengan §4.4. **Data/API:** `GET /api/v1/collections/websites` (endpoint detail belum ada — §12 butir 5).

### 4.9 `/projects`

**Tujuan:** daftar proyek sebagai kartu. **Tidak ada halaman detail** (blueprint §5.5). Satu primary link per proyek.

**Anatomi:** page header + masonry kartu (12 + 12) + end marker. Kategori tampil sebagai label pada kartu.

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Home / Projects                                            [ Search ]  14:32 (*)  |
|              +---------------------------------------------------------------------------------+
| MAIN         |  PROJECTS                                             12 proyek . 4 kategori         |
| > Projects   |  +---------------------------+ +---------------------------+                      |
|              |  | [thumb opsional]          | | [thumb opsional]          |                      |
|              |  | PROJECT TITLE             | | PROJECT TITLE             |                      |
|              |  | Website . 2026            | | AI . 2026                 |                      |
|              |  | Deskripsi 2–4 baris.      | | Deskripsi 2–4 baris.      |                      |
|              |  | [ BUKA PROYEK  -> ]       | | [ BUKA PROYEK  -> ]       |                      |
|              |  +---------------------------+ +---------------------------+                      |
|              |  +---------------------------+ +---------------------------+                      |
|              |  | [thumb opsional]          | | [thumb opsional]          |                      |
|              |  +---------------------------+ +---------------------------+                      |
|              |                        [ LOAD MORE  +12 ]                                  |
+--------------+---------------------------------------------------------------------------------+
| DB (*) ONLINE . OWNER (*) ONLINE . Bandung . VISITORS 12,480 . Privacy Policy                 |
+-------------------------------------------------------------------------------------------------+
```

```text
+------------------------------+
| [=] RF            [S]  (*)  |
|------------------------------|
| Home / Projects              |
| PROJECTS    12 . 4 kategori  |
| +--------------------------+ |
| | [thumb]                  | |
| | PROJECT TITLE            | |
| | Website . 2026           | |
| | Deskripsi 2–4 baris.     | |
| | [ BUKA PROYEK -> ]       | |
| +--------------------------+ |
| +--------------------------+ |
| | [thumb]                  | |
| +--------------------------+ |
| [ LOAD MORE +12 ]            |
+------------------------------+
```

**Komponen:** card (thumbnail opsional, judul `h4`, kategori `caption`, tahun opsional, deskripsi 3 baris clamp, primary CTA), Load More.

**State:** thumbnail kosong atau gagal = blok `surface-raised` dengan wordmark RF, tanpa ikon rusak; deskripsi kosong = clamp 0; link wajib ada (validasi admin); error = retry; empty = animated empty state.

**Interaksi:** seluruh kartu membuka link eksternal proyek di tab baru. Tidak ada klik ke detail, tidak ada modal detail, tidak ada `Lihat semua`. Klik pada judul = link yang sama dengan CTA (satu tujuan).

**Animasi:** Motion stagger 24 ms; hover: border `accent` + thumbnail scale 1.02 (maks). GSAP tidak dipakai di halaman ini selain counter header. `lite`: tanpa scale thumbnail.

**Data/API:** `GET /api/v1/projects?limit=12&cursor=`.

### 4.10 `/tech-stack`

**Tujuan:** menampilkan teknologi yang dipakai membangun RF, dikelompokkan per lapisan.

**Anatomi:** page header → grup (Frontend, Backend, Infrastructure, External Services) → grid chip/kartu (logo + nama). Nama teknologi tidak diterjemahkan (TD-15). Tanpa detail, tanpa versi angka wajib, tanpa progress.

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Home / Tech Stack                                          [ Search ]  14:32 (*)  |
|              +---------------------------------------------------------------------------------+
| MAIN         |  TECH STACK                                                26 teknologi             |
| > Tech Stack |                                                                                 |
|              |  FRONTEND                                                            012        |
|              |  [React] [Vite] [TypeScript] [Tailwind] [GSAP] [Motion] [Zustand] [>]            |
|              |  BACKEND                                                             008        |
|              |  [Node] [Express] [Prisma] [PostgreSQL] [Zod] [>]                                |
|              |  INFRASTRUCTURE                                                      004        |
|              |  [Vercel] [Railway] [Cloudinary] [>]                                             |
|              |  EXTERNAL SERVICES                                                   002        |
|              |  [DeepL] [Resend]                                                                |
+--------------+---------------------------------------------------------------------------------+
| DB (*) ONLINE . OWNER (*) ONLINE . Bandung . VISITORS 12,480 . Privacy Policy                 |
+-------------------------------------------------------------------------------------------------+
```

```text
+------------------------------+
| [=] RF            [S]  (*)  |
|------------------------------|
| Home / Tech Stack            |
| TECH STACK        26         |
| FRONTEND           012       |
| [React] [Vite] [TS]          |
| [Tailwind] [GSAP] [>]        |
| BACKEND            008       |
| [Node] [Express] [>]         |
+------------------------------+
```

**Komponen:** group heading + counter kecil, tech chip 44 px tinggi (logo 20 + nama), horizontal scroll untuk >6 item dengan fade tepi.

**State:** loading = 3 grup skeleton; error = retry; grup kosong disembunyikan; ikon gagal = inisial 2 huruf.

**Interaksi:** chip bukan tautan (tidak ada URL teknologi); tooltip nama penuh jika terpotong. Tidak ada filter.

**Animasi:** Motion fade+stagger 16 ms; GSAP tidak dipakai. `lite`: tanpa stagger.

**Data/API:** `GET /api/v1/tech-stack`. Sumber pengelolaan Tech Stack belum tercantum pada daftar CRUD (§12 butir 6).

### 4.11 `/learning-journey`

**Tujuan:** bidang yang sedang/telah dipelajari. Hanya logo dan nama bidang (blueprint §5.6). Tanpa persentase, level, atau progress bar.

**Anatomi:** header → grid kartu bidang (logo 48 + nama). Urutan A–Z.

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Home / Learning Journey                                    [ Search ]  14:32 (*)  |
|              +---------------------------------------------------------------------------------+
| MAIN         |  LEARNING JOURNEY                                          9 bidang                |
| > Learning   |  +--------------+ +--------------+ +--------------+ +--------------+            |
|              |  | [logo]       | | [logo]       | | [logo]       | | [logo]       |            |
|              |  | PROGRAMMING  | | AI           | | CYBERSECURITY| | DESIGN       |            |
|              |  +--------------+ +--------------+ +--------------+ +--------------+            |
|              |  +--------------+ +--------------+ +--------------+ +--------------+            |
|              |  | NETWORKING   | | ...          | |              | |              |            |
|              |  +--------------+ +--------------+ +--------------+ +--------------+            |
+--------------+---------------------------------------------------------------------------------+
| DB (*) ONLINE . OWNER (*) ONLINE . Bandung . VISITORS 12,480 . Privacy Policy                 |
+-------------------------------------------------------------------------------------------------+
```

```text
+------------------------------+
| [=] RF            [S]  (*)  |
|------------------------------|
| Home / Learning Journey      |
| LEARNING JOURNEY        9    |
| +------------+ +-----------+ |
| | [logo]     | | [logo]    | |
| | PROGRAMMING| | AI        | |
| +------------+ +-----------+ |
| +------------+ +-----------+ |
| | [logo]     | | [logo]    | |
| +------------+ +-----------+ |
+------------------------------+
```

**Komponen:** field card (logo, nama, tanpa CTA), grid 2/3/4 kolom.

**State:** empty = `Belum ada bidang` + glyph; error = retry; logo gagal = inisial.

**Interaksi:** tidak ada navigasi; kartu bukan tautan. Hover hanya mengubah border (tidak ada affordance klik palsu).

**Animasi:** Motion stagger 24 ms. GSAP tidak dipakai. `lite`: fade 150 ms.

**Data/API:** `GET /api/v1/learning-journey`.

### 4.12 `/setup`

**Tujuan:** ringkasan spesifikasi perangkat. Tanpa foto, tanpa halaman detail (blueprint §5.7).

**Anatomi:** header → daftar kartu perangkat, tiap kartu berisi baris spesifikasi (label + nilai, `dl`).

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Home / Setup                                              [ Search ]  14:32 (*)   |
|              +---------------------------------------------------------------------------------+
| MAIN         |  SETUP & DEVICES                                            2 perangkat             |
| > Setup      |  +---------------------------------------------------------------------------+  |
|              |  | MAIN RIG                                                                 |  |
|              |  | PROCESSOR   ..............  [ nilai ]                                    |  |
|              |  | RAM         ..............  [ nilai ]                                    |  |
|              |  | GPU         ..............  [ nilai ]                                    |  |
|              |  | STORAGE     ..............  [ nilai ]                                    |  |
|              |  | OS          ..............  [ nilai ]                                    |  |
|              |  | LAINNYA     ..............  [ label: nilai ]                             |  |
|              |  +---------------------------------------------------------------------------+  |
|              |  +---------------------------------------------------------------------------+  |
|              |  | SECOND DEVICE ...                                                        |  |
|              |  +---------------------------------------------------------------------------+  |
+--------------+---------------------------------------------------------------------------------+
| DB (*) ONLINE . OWNER (*) ONLINE . Bandung . VISITORS 12,480 . Privacy Policy                 |
+-------------------------------------------------------------------------------------------------+
```

```text
+------------------------------+
| [=] RF            [S]  (*)  |
|------------------------------|
| Home / Setup                 |
| SETUP & DEVICES         2    |
| +--------------------------+ |
| | MAIN RIG                 | |
| | PROCESSOR  ....  [nilai] | |
| | RAM        ....  [nilai] | |
| | GPU        ....  [nilai] | |
| +--------------------------+ |
+------------------------------+
```

**Komponen:** device card, definition list dua kolom (label 40% / nilai 60%), "spesifikasi lain" sebagai baris tambahan.

**State:** loading = 2 kartu skeleton; field kosong = baris disembunyikan; semua kosong = empty state; error = retry.

**Interaksi:** tidak ada tautan, tidak ada expand/collapse. Teks panjang wrap, nilai teknis memakai `mono` bila mengandung angka/tipe.

**Animasi:** Motion fade+stagger 40 ms. GSAP tidak dipakai. `lite`: fade saja.

**Data/API:** `GET /api/v1/devices`.

### 4.13 `/timeline`

**Tujuan:** riwayat aktivitas teknologi. Teks saja; tanpa gambar atau video (blueprint §5.8).

**Anatomi:** header → rail vertikal kiri 2 px + entri kronologis (terbaru di atas) → Load More 20 + 20.

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Home / Timeline                                            [ Search ]  14:32 (*)  |
|              +---------------------------------------------------------------------------------+
| MAIN         |  TIMELINE                                                 41 entri . terbaru 2026   |
| > Timeline   |  |                                                                                |
|              |  o  2026-11-02   MEMULAI PROYEK RF DASHBOARD                                    |
|              |  |   Kategori . Development                                                      |
|              |  |   Deskripsi 2–3 baris.                                                        |
|              |  |                                                                                |
|              |  o  2026-10-18   MIGRASI KE POSTGRESQL 16                                       |
|              |  |   Kategori . Infrastructure                                                   |
|              |  |   Deskripsi ...                                                               |
|              |  |                                                                                |
|              |  o  2026-09-30   ...                                                            |
|              |  |                                                                                |
|              |                          [ LOAD MORE  +20 ]                                    |
+--------------+---------------------------------------------------------------------------------+
| DB (*) ONLINE . OWNER (*) ONLINE . Bandung . VISITORS 12,480 . Privacy Policy                 |
+-------------------------------------------------------------------------------------------------+
```

```text
+------------------------------+
| [=] RF            [S]  (*)  |
|------------------------------|
| Home / Timeline              |
| TIMELINE        41 . 2026    |
| o 2026-11-02                 |
| | MEMULAI PROYEK RF          |
| | Development . 2 baris      |
| o 2026-10-18                 |
| | MIGRASI KE PG 16           |
| | Infrastructure             |
| [ LOAD MORE +20 ]            |
+------------------------------+
```

**Komponen:** timeline rail, node (8 px, ring `accent`), date `mono`, title `h4`, category `caption`, description body-sm (maks 3 baris di list), Load More.

**State:** loading = 6 skeleton entri; empty = `Belum ada entri`; error = retry; tanggal tidak valid tidak dirender (validasi server).

**Interaksi:** tidak ada tautan detail. Teks panjang di-truncate 3 baris tanpa "baca selengkapnya" — deskripsi dibatasi di CMS (≤ 280 karakter) agar tidak terpotong.

**Animasi:** GSAP — rail draw 400 ms + node pop 200 ms saat section masuk; Motion fade per entri 24 ms stagger. `lite`: tanpa rail draw, fade 150 ms.

**Data/API:** `GET /api/v1/timeline?limit=20&cursor=`.

### 4.14 `/statistics`

**Tujuan:** angka publik: total AI, Tools, Websites, Projects, Social Media (blueprint §5.9) + total pengunjung.

**Anatomi:** header → 6 kartu angka besar (3×2 desktop, 2×3 mobile) → catatan definisi hitungan (satu kunjungan = satu page load, TD-03) → tautan ke koleksi.

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Home / Statistics                                          [ Search ]  14:32 (*)  |
|              +---------------------------------------------------------------------------------+
| MAIN         |  STATISTICS                                                                     |
| > Statistics |  +----------------+ +----------------+ +----------------+                        |
|              |  | AI             | | TOOLS          | | WEBSITES       |                        |
|              |  | 024            | | 038            | | 019            |                        |
|              |  +----------------+ +----------------+ +----------------+                        |
|              |  +----------------+ +----------------+ +----------------+                        |
|              |  | PROJECTS       | | SOCIAL MEDIA   | | VISITORS       |                        |
|              |  | 012            | | 017            | | 12,480         |                        |
|              |  +----------------+ +----------------+ +----------------+                        |
|              |  Dihitung per page load. Tanpa IP, tanpa cookie analitik.                      |
+--------------+---------------------------------------------------------------------------------+
| DB (*) ONLINE . OWNER (*) ONLINE . Bandung . VISITORS 12,480 . Privacy Policy                 |
+-------------------------------------------------------------------------------------------------+
```

```text
+------------------------------+
| [=] RF            [S]  (*)  |
|------------------------------|
| Home / Statistics            |
| +------------+ +-----------+ |
| | AI     024 | | TOOLS  038| |
| +------------+ +-----------+ |
| +------------+ +-----------+ |
| | WEB    019 | | PROJ   012| |
| +------------+ +-----------+ |
| +------------+ +-----------+ |
| | SOCIAL 017 | | VISIT 12k | |
| +------------+ +-----------+ |
| Dihitung per page load.      |
+------------------------------+
```

**Komponen:** stat tile (label `caption`, angka `display`/`h1` mono, tautan konteks), catatan metodologi.

**State:** loading = angka `--` dengan skeleton baris; error = `--` + retry; data lama = tampil apa adanya + timestamp "Diperbarui HH:MM" (bukan realtime).

**Interaksi:** tile dapat menautkan ke halaman terkait (AI → `/ai`, dst.), kecuali Visitors. Angka tidak animasi ulang setiap refetch.

**Animasi:** counter count-up 600 ms saat masuk viewport, sekali. `lite`: nilai langsung.

**Data/API:** `GET /api/v1/statistics`, `GET /api/v1/visitor-count`.

### 4.15 `/about`

**Tujuan:** profil, bio, minat teknologi, tujuan personal (blueprint §5.10) + unduh CV (RF-026).

**Anatomi:** hero profil (avatar opsional, nama, headline) → dua kolom: bio (kiri, `measure-text`) dan minat + tujuan (kanan, stacked); CTA `Unduh CV` di hero.

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Home / About                                               [ Search ]  14:32 (*)  |
|              +---------------------------------------------------------------------------------+
| MAIN         |  +---------------------------+------------------------------------------------+  |
| > About      |  | +-----------------------+ |  OWNER NAME                                    |  |
|              |  | |     AVATAR 160        | |  Role / Headline                               |  |
|              |  | +-----------------------+ |  Bandung, ID                                   |  |
|              |  |                           |  [ UNDUH CV (PDF)  v ]                         |  |
|              |  +---------------------------+------------------------------------------------+  |
|              |                                                                                 |
|              |  BIO                            |  TECH INTERESTS                              |
|              |  paragraf 68ch, 4–8 baris       |  . item                                      |
|              |  ...                            |  . item                                      |
|              |                                 |  PERSONAL GOALS                              |
|              |                                 |  . item                                      |
+--------------+---------------------------------------------------------------------------------+
| DB (*) ONLINE . OWNER (*) ONLINE . Bandung . VISITORS 12,480 . Privacy Policy                 |
+-------------------------------------------------------------------------------------------------+
```

```text
+------------------------------+
| [=] RF            [S]  (*)  |
|------------------------------|
| Home / About                 |
| +--------------------------+ |
| |      AVATAR 120          | |
| +--------------------------+ |
| OWNER NAME                   |
| Role . Bandung, ID           |
| [ UNDUH CV (PDF) ]           |
| BIO                          |
| paragraf 68ch ...            |
| TECH INTERESTS               |
| . item  . item               |
| PERSONAL GOALS               |
| . item                       |
+------------------------------+
```

**Komponen:** avatar (fallback inisial), identity, CV download (label ukuran file), bio, interest list, goal list.

**State:** CV tidak tersedia = tombol `disabled` + caption `CV belum tersedia`; avatar gagal = inisial; bio kosong = section disembunyikan; error profil = retry; tanpa loading penuh — skeleton hero + 2 kolom.

**Interaksi:** CV diunduh dari `GET /api/v1/resume` (PDF, 10 MB — TD-14), tab baru atau unduhan langsung; tidak ada form kontak di halaman ini (kontak punya rute sendiri).

**Animasi:** Motion — hero fade 280 ms, list stagger 24 ms. GSAP — garis chrome vertikal draw 300 ms. `lite`: fade saja.

**Data/API:** `GET /api/v1/profile`, `GET /api/v1/resume`.

### 4.16 `/contact`

**Tujuan:** mengirim pesan ke email Admin tanpa menyimpan pesan di database (blueprint §5.11). reCAPTCHA v2 checkbox + honeypot + time-trap (TD-12).

**Anatomi:** header → dua kolom: kiri info singkat + tautan Privacy Policy, kanan form (name, email, message, reCAPTCHA, submit). Di `<lg` satu kolom, form lebih dulu.

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Home / Contact                                              [ Search ]  14:32 (*) |
|              +---------------------------------------------------------------------------------+
| MAIN         |  CONTACT                                                                        |
| > Contact    |  +--------------------------------+ +------------------------------------------+  |
|              |  | KIRIM PESAN                    | | NAMA                                     |  |
|              |  | Pesan langsung ke email Admin. | | [ ______________________________________ ] |  |
|              |  | Tidak disimpan di database.    | | EMAIL                                    |  |
|              |  | Balasan 1–3 hari kerja.        | | [ ______________________________________ ] |  |
|              |  |                                | | PESAN                                    |  |
|              |  | [ Privacy Policy -> ]          | | [                                        ] |  |
|              |  |                                | | [                                        ] |  |
|              |  |                                | | [x] Saya bukan robot (reCAPTCHA v2)      |  |
|              |  |                                | | [ KIRIM PESAN ]          0 / 1000         |  |
|              |  +--------------------------------+ +------------------------------------------+  |
+--------------+---------------------------------------------------------------------------------+
| DB (*) ONLINE . OWNER (*) ONLINE . Bandung . VISITORS 12,480 . Privacy Policy                 |
+-------------------------------------------------------------------------------------------------+
```

```text
+------------------------------+
| [=] RF            [S]  (*)  |
|------------------------------|
| Home / Contact               |
| KIRIM PESAN                  |
| Pesan langsung ke email      |
| Admin. Tidak disimpan.       |
| NAMA                         |
| [ ______________________ ]   |
| EMAIL                        |
| [ ______________________ ]   |
| PESAN                        |
| [                      ]     |
| [                      ]     |
| [x] reCAPTCHA v2             |
| [ KIRIM PESAN ]   0/1000     |
| [ Privacy Policy -> ]        |
+------------------------------+
```

**Field & validasi**

| Field | Tipe | Wajib | Validasi | Pesan error |
|---|---|---|---|---|
| `name` | text | Ya | 2–80 karakter, trim | `Nama minimal 2 karakter` |
| `email` | email | Ya | format RFC dasar, ≤ 254 | `Format email tidak valid` |
| `message` | textarea | Ya | 20–1000 karakter, counter | `Pesan minimal 20 karakter` |
| `company` (honeypot) | text | Tidak | harus kosong, `tabindex=-1`, `autocomplete=off`, tersembunyi visual | Tidak ada pesan — submit ditolak silent (200 palsu) |
| `recaptchaToken` | hidden | Ya | token v2 checkbox | `Selesaikan verifikasi` |
| time-trap | hidden | — | submit < 3000 ms sejak form tampil ditolak | Silent reject |

**State:**
- Idle: tombol aktif, reCAPTCHA dimuat lazy saat form masuk viewport.
- Submitting: tombol `Mengirim…` + spinner, field `disabled`, reCAPTCHA tidak di-reset sampai respons.
- Success: form diganti panel sukses (ikon centang, `Pesan terkirim`, `Kirim pesan lain`) — tanpa redirect.
- Validation error: inline per field, `aria-invalid`, `aria-describedby`, fokus ke field pertama yang salah.
- Captcha gagal/kedaluwarsa: pesan + reset widget.
- Rate limit (3/jam/IP): `Terlalu banyak pesan. Coba lagi dalam 1 jam.` dengan `Retry-After`.
- Server/email error 502: pesan retry + isi form dipertahankan; reCAPTCHA di-reset.
- Offline: status `Tidak ada koneksi` + tombol kirim nonaktif.

**Interaksi:** Enter di input teks memindahkan fokus (bukan submit); `Ctrl/Cmd+Enter` di textarea submit; semua field punya label persisten (bukan placeholder-only); autofill diizinkan.

**Animasi:** Motion — panel sukses fade+scale 0.98→1, 240 ms; error shake 120 ms (2 px, maks 2 kali; dimatikan `lite`). GSAP tidak dipakai. `lite`: tanpa shake.

**Data/API:** `POST /api/v1/contact` (`name`, `email`, `message`, `recaptchaToken`, honeypot, timing). Backend memverifikasi reCAPTCHA server-side, mengirim via SMTP ke `ADMIN_EMAIL`, `replyTo` pengunjung, subjek `[RF Contact] <nama>` (TD-12). Tidak ada endpoint baca pesan.

### 4.17 `/privacy-policy`

**Tujuan:** menjelaskan data yang diproses. Halaman statis (tidak dikelola CMS — §12 butir 7).

**Anatomi:** header → kolom tunggal `68ch` dengan daftar section bernomor + daftar isi ringkas (anchor).

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Home / Privacy Policy                                      [ Search ]  14:32 (*)  |
|              +---------------------------------------------------------------------------------+
| MAIN         |  PRIVACY POLICY                                     Terakhir diperbarui 2026-11-14   |
| > Privacy    |  +---------------------------+------------------------------------------------+  |
|              |  | ISI                       |  01  DATA YANG DIKUMPULKAN                    |  |
|              |  | 01 Data dikumpulkan       |      - visitor event (tanpa IP)                 |  |
|              |  | 02 Visitor counter        |      - email pada form kontak                   |  |
|              |  | 03 Cookie sesi admin      |      - label kota pemilik                       |  |
|              |  | 04 Kontak                 |  02  VISITOR COUNTER                           |  |
|              |  | 05 Lokasi pemilik         |      Satu event per page load ...               |  |
|              |  | 06 Pihak ketiga           |  03  COOKIE SESI ADMIN                         |  |
|              |  | 07 Hak & kontak           |      rf_sess, HttpOnly, 30 hari ...             |  |
|              |  +---------------------------+------------------------------------------------+  |
+--------------+---------------------------------------------------------------------------------+
| DB (*) ONLINE . OWNER (*) ONLINE . Bandung . VISITORS 12,480 . Privacy Policy                 |
+-------------------------------------------------------------------------------------------------+
```

```text
+------------------------------+
| [=] RF            [S]  (*)  |
|------------------------------|
| Home / Privacy Policy        |
| PRIVACY POLICY               |
| 2026-11-14                   |
| 01 DATA DIKUMPULKAN          |
| - visitor event (tanpa IP)   |
| - email form kontak          |
| - label kota pemilik         |
| 02 VISITOR COUNTER           |
| ...                          |
+------------------------------+
```

**Komponen:** TOC sticky (`lg+`), section heading `h2`, paragraf, list, catatan pihak ketiga (Cloudinary, DeepL, reCAPTCHA, SMTP), tanggal berlaku.

**Isi wajib:** data yang dikumpulkan (visitId, entryPath, referrerHost, isOwner, createdAt; tanpa IP/UA/lokasi pengunjung), cookie `rf_sess` hanya untuk admin, lokasi pemilik = label kota disimpan ≤ 30 hari, kontak dikirim via email dan tidak disimpan, pihak ketiga, kontak privasi.

**State:** statis; tanpa loading/error data. Anchor aktif mengikuti scroll.

**Interaksi:** TOC scroll ke anchor, `scroll-margin-top: 96px`; tidak ada tautan eksternal wajib.

**Animasi:** tanpa animasi konten; hanya smooth scroll (dimatikan pada `lite`/reduce motion → `auto`).

**Data/API:** tidak ada (konten statis di frontend).

### 4.18 Custom 404

**Tujuan:** rute tidak dikenal atau item yang tidak ada.

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |                                                              [ Search ]  14:32 (*) |
|              +---------------------------------------------------------------------------------+
|              |                                                                                 |
|              |     404                                                                         |
|              |     HALAMAN TIDAK DITEMUKAN                                                     |
|              |     URL yang Anda buka tidak ada atau item sudah dihapus.                       |
|              |                                                                                 |
|              |     [ KEMBALI KE WORKSPACE ]   [ BUKA PENCARIAN ]                               |
|              |                                                                                 |
+--------------+---------------------------------------------------------------------------------+
| DB (*) ONLINE . OWNER (*) ONLINE . Bandung . VISITORS 12,480 . Privacy Policy                 |
+-------------------------------------------------------------------------------------------------+
```

```text
+------------------------------+
| [=] RF            [S]  (*)  |
|------------------------------|
|                              |
|   404                        |
|   HALAMAN TIDAK DITEMUKAN    |
|   URL tidak ada atau item    |
|   sudah dihapus.             |
|   [ KEMBALI KE WORKSPACE ]   |
|   [ BUKA PENCARIAN ]         |
+------------------------------+
```

**Komponen:** kode `display` dengan glitch sekali (bukan loop), pesan, dua aksi.

**State:** status HTTP 404 (prerender juga 404), `document.title = "404 — RF"`, `noindex`.

**Interaksi:** dua tombol; fokus awal ke judul untuk pembaca layar (`tabindex=-1`).

**Animasi:** GSAP glitch 360 ms sekali saat mount, lalu statis; Motion fade konten. `lite`: tanpa glitch.

**Data/API:** `GET /api/v1/statistics` tidak diperlukan; shell tetap memuat presence/visitor.

---

## 5. Global Search

**Cakupan:** AI, Tools, Websites, Projects, Tech Stack. Partial match, case-insensitive, tanpa typo correction, tanpa riwayat, tanpa halaman hasil terpisah (blueprint §3.4).

### 5.1 Overlay Desktop

```text
+----------------------------------------------------------------------------------------------+
|  ( backdrop rgba(0,0,0,.72) — konten di belakang inert )                                      |
|                                                                                              |
|   +--------------------------------------------------------------------------------------+   |
|   | [Q]  cari nama item...                                                    [ESC]      |   |
|   +--------------------------------------------------------------------------------------+   |
|   | [AI x] [TOOLS] [WEBSITES] [PROJECTS] [TECH STACK]        <- chips multi-select        |   |
|   +--------------------------------------------------------------------------------------+   |
|   | AI                                                                                    |   |
|   |   [logo] Example AI            Chatbot                          ENTER / klik           |   |
|   |   [logo] Another AI           Coding AI                                               |   |
|   | TOOLS                                                                                 |   |
|   |   [logo] Example Tool          Development                                            |   |
|   | WEBSITES                                                                              |   |
|   |   [logo] Example Site          Learning                                               |   |
|   |                                                                                        |   |
|   | ↑↓ navigasi   Enter buka   Esc tutup   Tab pindah fokus      12 hasil . maks 20        |   |
|   +--------------------------------------------------------------------------------------+   |
|                                                                                              |
+----------------------------------------------------------------------------------------------+
```

Lebar panel 720 px, `max-height: min(640px, 80dvh)`, `surface-raised`, border chrome, `elev-2`, `radius-sm`, posisi 15vh dari atas.

### 5.2 Overlay Mobile (full-screen)

```text
+------------------------------+
| [<]  [ cari...        ]  [X] |
|------------------------------|
| [AI x][TOOLS][WEB][PRJ][TS]  |
|------------------------------|
| AI                           |
| [logo] Example AI            |
|        Chatbot               |
| [logo] Another AI            |
|        Coding AI             |
| TOOLS                        |
| [logo] Example Tool          |
|------------------------------|
| 12 hasil                     |
+------------------------------+
```

Mobile: overlay menutupi seluruh viewport (`z-search`), input sticky di atas, chips scroll horizontal dengan fade tepi, daftar scroll internal, `100dvh`, safe-area inset bawah.

### 5.3 Perilaku & Keyboard

| Aksi | Hasil |
|---|---|
| Buka | Klik trigger, `/` (di luar input), `Ctrl/Cmd+K` |
| Animasi buka | Input melebar dari 0.96 → 1 + panel fade/translateY 8 px, 200 ms (`dur-3`) |
| Ketik | Debounce 200 ms; minimum 3 karakter; query di-trim |
| `↑` / `↓` | Pindah antarhasil (melompati header grup); berhenti di ujung, tidak wrap |
| `Enter` | Buka hasil aktif; bila belum ada aktivasi → hasil pertama |
| `Esc` | Tutup overlay; bila input berisi → kosongkan input lebih dulu, Esc kedua menutup |
| `Tab` / `Shift+Tab` | Input → chips → hasil → footer hint; focus trap di dalam overlay |
| `Home` / `End` | Hasil pertama / terakhir |
| `PageUp/Down` | Geser 8 hasil |
| Klik backdrop | Tutup |
| Pilih hasil | Tutup overlay, navigasi ke detail/route, scroll ke atas |

`aria`: `role="dialog"` `aria-modal="true"` `aria-label="Pencarian global"`, input `role="combobox"` `aria-expanded` `aria-controls`, hasil `role="listbox"`/`option`, `aria-activedescendant` mengikuti item aktif, hitungan hasil diumumkan `aria-live="polite"`.

### 5.4 Chips Kategori

- Lima chip: `AI`, `Tools`, `Websites`, `Projects`, `Tech Stack`. Label dari kamus UI, bukan data CMS.
- Multi-select. Tidak ada chip = semua kategori. `aria-pressed` per chip.
- Klik chip saat loading membatalkan request lama (AbortController) dan memulai query baru.
- Tidak ada chip "All" — kosongkan semua = semua.
- State chip tidak bertahan setelah overlay ditutup.

### 5.5 State

| State | Tampilan |
|---|---|
| Idle (query < 3) | Hint `Ketik minimal 3 karakter` + daftar kategori yang dapat dicari |
| Loading | 5 skeleton baris (48 px) tanpa mengosongkan hasil lama; indikator kecil di kanan input |
| Results | Grup berurutan AI → Tools → Websites → Projects → Tech Stack; maks 5 per grup, 20 total |
| Empty | Animated empty state: glyph grid + `Tidak ada hasil untuk "<query>"` + saran `Coba kata kunci lain` |
| Error | Panel inline `Pencarian gagal` + `Coba lagi` (mempertahankan query) |
| Rate limit (429) | `Terlalu banyak pencarian. Tunggu beberapa detik.` + disable input sementara |

### 5.6 Reset

- Menutup overlay mengosongkan query, chip, indeks aktif, dan cache hasil pencarian (TanStack Query `gcTime: 0` untuk key search).
- Kembali dari halaman detail ke halaman asal **tidak** membuka overlay dan **tidak** memulihkan query/filter.
- Tidak ada riwayat, saran, atau "pencarian terakhir".

### 5.7 Kembali dari Detail

- Detail menyimpan posisi scroll daftar asal di `sessionStorage` (`rf.scroll:<path>`) saat navigasi keluar.
- `popstate`/back memulihkan posisi setelah data daftar siap; bila item tidak ada di halaman pertama, muat halaman yang memuat item (maks 3 Load More otomatis) lalu scroll ke kartu dan beri fokus sementara.
- Overlay pencarian tetap tertutup. Query dihapus.

**Data/API:** `GET /api/v1/search?q=<query>&types=ai,tools,websites,projects,tech_stack`. Respons dikelompokkan per tipe; maksimum 20. Tidak ada endpoint saran.

---

## 6. Audio & Theme Controls

### 6.1 Penempatan

Sidebar bagian `DISPLAY` dan `AUDIO` (desktop expanded), popover pada rail, dan section paling bawah drawer mobile. Tidak ada kontrol audio mengambang di konten.

```text
+------------------------------+
| DISPLAY                      |
| [VOID][EMBER][ION][CHR][SIG] |
| LANGUAGE  [ ID ] [ EN ]      |
|------------------------------|
| AUDIO                        |
| [>] Track Title              |
|     Artist / source          |
| [====|----------]  40%       |
| [MUTE]  [TRACK LIST 3/7]     |
+------------------------------+
```

### 6.2 Mini Player

| Elemen | Spesifikasi |
|---|---|
| Play/Pause | 44×44, ikon 20, `aria-label` dinamis (`Putar musik` / `Jeda musik`) |
| Judul track | 1 baris, ellipsis, `body-sm`; marquee hanya bila hover dan full tier |
| Volume | Slider horizontal 96 px, langkah 5%, nilai `mono` di kanan; keyboard `←/→` 5%, `Home/End` 0/100 |
| Master mute | Toggle 44 px, ikon speaker; mengontrol musik **dan** SFX (TD-05) |
| Track list | Tombol membuka popover daftar track (judul, durasi, indikator aktif) |
| Status | Track aktif: border kiri `accent` + label `Sedang diputar` (bukan hanya warna) |

Volume musik dipersist di `localStorage` (`rf.audio.volume`), mute di `localStorage` (`rf.audio.muted`) — pengecualian aturan sessionStorage, sesuai TD-05.

### 6.3 Fallback Play Music

- Autoplay dicoba saat Welcome Screen mount. Gagal (promise rejected / `play()` ditolak) → tombol `PLAY MUSIC` muncul dengan fade 200 ms.
- Tombol juga muncul di sidebar bila autoplay belum pernah berhasil pada sesi ini.
- Menekan Play saat master mute aktif: mute dimatikan otomatis + toast `Mute dimatikan` + ikon berubah. Ini satu-satunya aksi yang mengubah mute secara implisit.
- Audio tidak pernah memblokir navigasi atau menampilkan modal.

### 6.4 Track List

- Popover 320 px, daftar maks 7 track, tinggi maks 320 px (scroll).
- Item: nomor `mono`, judul, durasi, indikator aktif. Klik = putar track tersebut.
- Track berasal dari URL eksternal royalty-free (tidak diunggah ke Cloudinary — TD-14).
- Tidak ada shuffle, repeat, atau antrean pengguna jika tidak didefinisikan; perilaku akhir track = lanjut ke track berikutnya, berhenti di track terakhir.

### 6.5 Kontinuitas

- Satu elemen `<audio>` di root layout, tidak di-mount ulang saat navigasi. Route change tidak menghentikan atau me-restart track.
- Posisi waktu dipertahankan antar-route. Reload memulai dari awal track default.
- SFX: volume tetap 0.35, tidak dapat diatur terpisah, tunduk master mute. Tidak ada SFX saat halaman pertama dimuat sebelum interaksi pengguna.
- `document.hidden` tidak menghentikan musik (hanya animasi yang pause — TD-10).

### 6.6 Theme Switcher

- Lima chip: `VOID`, `EMBER`, `ION`, `CHROME`, `SIGNAL`. Nama tidak diterjemahkan.
- Setiap chip: swatch 3 garis (bg/accent/chrome) + label; `aria-pressed`.
- Perubahan langsung (160 ms warna), tanpa reload, tanpa flash.
- Pada rail: satu ikon palet yang membuka popover 5 chip vertikal.
- Bahasa (`ID`/`EN`) berada di grup yang sama tetapi bukan bagian dari sistem tema; pilihan bahasa disimpan sesuai kebijakan i18n (bukan sessionStorage tema).

---

## 7. Admin Dashboard

Rute admin mengikuti blueprint §2.1; konvensi URL admin yang dipakai di dokumen ini: `/admin` (login bila belum terautentikasi, overview bila sudah), `/admin/<resource>` untuk CRUD. Rute admin tidak tercantum di blueprint §2.3 — lihat §12 butir 8.

**Prinsip:** admin adalah alat kerja, bukan etalase. Kepadatan lebih tinggi, animasi minimal, tanpa background particles. Tema mengikuti tema publik yang aktif; admin tidak punya theme switcher sendiri.

### 7.1 Login

**Tujuan:** autentikasi satu akun Admin (blueprint §9.1).

```text
+----------------------------------------------------------------------------------------------+
|                                                                                              |
|                  +--------------------------------------------------------+                  |
|                  |  [RF]  RF ADMIN                                        |                  |
|                  |                                                        |                  |
|                  |  USERNAME                                              |                  |
|                  |  [ __________________________________________________ ]|                  |
|                  |  PASSWORD                                              |                  |
|                  |  [ __________________________________________________ ]|                  |
|                  |                                                        |                  |
|                  |  [!] Pesan error (jika ada)                            |                  |
|                  |  [ MASUK ]                                             |                  |
|                  |                                                        |                  |
|                  |  Sesi berakhir setelah 90 hari. Logout manual kapan pun.|                  |
|                  +--------------------------------------------------------+                  |
|                                                                                              |
+----------------------------------------------------------------------------------------------+
```

Panel 400 px, `surface`, border chrome, `radius-sm`, tanpa sidebar/header publik. Mobile: panel penuh dengan padding 16, tombol 44 px.

| State | Tampilan |
|---|---|
| Idle | Form kosong, fokus otomatis ke username |
| Submitting | Tombol `Memeriksa…`, field disabled, spinner inline |
| Salah kredensial | `Username atau password salah` (tidak membedakan mana yang salah) |
| Rate limit (429) | `Terlalu banyak percobaan. Coba lagi dalam MM:SS` + countdown; tombol disabled |
| Lockout (10 gagal) | `Akun terkunci sementara. Coba lagi dalam 15 menit` |
| Server error | `Tidak dapat menghubungi server` + `Coba lagi` |
| Sukses | Redirect ke `/admin` (overview); fokus ke `h1` |

**Interaksi:** Enter submit; `autocomplete="username"`/`current-password`; tidak ada "lupa password" (reset via database — §11); tidak ada remember-me (sesi sudah persisten — TD-06); error diumumkan `role="alert"`.

**Animasi:** hanya fade panel 200 ms. Tanpa GSAP.

**Data/API:** `POST /api/v1/admin/auth/login`, `GET /api/v1/admin/auth/session`.

### 7.2 Shell Admin

```text
+--------------+---------------------------------------------------------------------------------+
| [RF] RF      |  Admin / AI Management                                    (*) DB  (*) OWNER 14:32 |
| ADMIN        +---------------------------------------------------------------------------------+
|              |  AI MANAGEMENT                                        [ + TAMBAH AI ]             |
| KONTEN       |  [ Search by name... ]                                    Urut: terbaru  v       |
|  Overview    |  +---------------------------------------------------------------------------+  |
|  AI          |  | LOGO | NAMA | KATEGORI | SUBKATEGORI | STATUS | LINKS | DIPERBARUI | AKSI |  |
|  Tools       |  +---------------------------------------------------------------------------+  |
|  Websites    |  | [o]  | Name | Chatbot  | Chatbot     | *      | 2     | 12 Mar     | E D  |  |
|  Social      |  +---------------------------------------------------------------------------+  |
|  Projects    |                        [ LOAD MORE  +24 ]                                  |
|  Learning    |                                                                                 |
|  Setup       |                                                                                 |
|  Timeline    |                                                                                 |
|  Media       |                                                                                 |
|              |                                                                                 |
| SISTEM       |                                                                                 |
|  Profile     |                                                                                 |
|  CV          |                                                                                 |
|  Visitors    |                                                                                 |
|  Email       |                                                                                 |
|  Backup      |                                                                                 |
|  Auth        |                                                                                 |
|              |                                                                                 |
| [ Lihat Situs] [ LOGOUT ]                                                                    |
+--------------+---------------------------------------------------------------------------------+
```

Sidebar 280 px (rail 64 px `lg`–`xl` opsional), topbar 72 px: breadcrumb, indikator DB + owner, jam, tombol `Lihat Situs` (tab baru), `Logout`. Tidak ada search global publik di admin.

**State shell:** sesi kedaluwarsa pada request apa pun → redirect `/admin` + toast `Sesi berakhir, silakan masuk kembali`; DB offline → banner tipis di bawah topbar `Database tidak tersedia. Perubahan tidak dapat disimpan.` (bukan modal); 401/403 pada mutasi → dialog sesi berakhir.

### 7.3 Overview

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Admin / Overview                                                              |
|              +---------------------------------------------------------------------------------+
|              |  OVERVIEW                                              [ + AI ] [ + TOOL ] ...     |
|              |  +----------+ +----------+ +----------+ +----------+ +----------+ +----------+   |
|              |  | AI   24  | | TOOLS 38 | | WEB  19  | | PROJ 12  | | SOCIAL 17| | VISIT 12k|   |
|              |  +----------+ +----------+ +----------+ +----------+ +----------+ +----------+   |
|              |  +-----------------------------------------+ +-----------------------------+  |
|              |  | KUNJUNGAN 30 HARI                       | | KONTEN TERBARU              |  |
|              |  |                                         | | AI . Name . 12 Mar          |  |
|              |  |  ##                                     | | Tool . Name . 11 Mar        |  |
|              |  |  ####      ##                           | | Website . Name . 10 Mar     |  |
|              |  |  ######  #####  ###                     | | Project . Name . 09 Mar     |  |
|              |  |  +-----------------------------------+  | | [ Kelola Konten -> ]        |  |
|              |  |  | chart: bar/line, 1 seri, chrome   |  | +-----------------------------+  |
|              |  +-----------------------------------------+                                |
|              |  +-----------------------------------------+ +-----------------------------+  |
|              |  | QUICK ACTIONS                           | | STATUS SISTEM               |  |
|              |  | [ + AI ] [ + Tool ] [ + Website ]       | | DB (*) ONLINE               |  |
|              |  | [ + Project ] [ UPLOAD MEDIA ]          | | OWNER (*) ONLINE . Bandung  |  |
|              |  | [ BACKUP ]                              | | Terakhir dicek 14:32        |  |
|              |  +-----------------------------------------+ +-----------------------------+  |
+-------------------------------------------------------------------------------------------------+
```

**Komponen:** 6 stat card (angka + label + delta tidak ditampilkan karena tidak diminta), chart kunjungan 30 hari (satu seri, warna chrome; gridline `border`), daftar 6–8 konten terbaru lintas tipe (tipe, nama, tanggal, tautan edit), quick actions, status sistem, kartu pesan masuk.

**Pesan masuk:** karena pesan kontak tidak disimpan (blueprint §5.11, TD-12), kartu hanya boleh menampilkan informasi yang memang tersedia dari mekanisme email (mis. status konfigurasi email terakhir). Bila tidak ada data, tampilkan `Pesan tidak disimpan. Kontak dikirim langsung ke email Admin.` — bukan daftar pesan palsu. Lihat §12 butir 9.

**State:** loading = skeleton kartu dan chart; error overview = panel retry per blok (stat, chart, latest) agar satu kegagalan tidak mengosongkan halaman; chart kosong = `Belum ada kunjungan pada periode ini`; DB offline = banner + status merah.

**Interaksi:** klik stat card → daftar terkait; klik item terbaru → form edit; quick actions membuka panel tambah; chart tooltip per hari (tanpa library warna tambahan).

**Animasi:** hanya chart draw 400 ms dan fade 200 ms. Tanpa GSAP scroll animation.

**Data/API:** `GET /api/v1/admin/overview`, `GET /api/v1/presence`, `GET /api/v1/admin/auth/session`.

### 7.4 Pola CRUD (berlaku untuk §7.5–7.19)

**Anatomi daftar:** judul + jumlah → primary action kanan → search by name → sort (default `createdAt DESC`) → tabel → Load More (24, +48 untuk media; untuk konten 24 + 24) → empty state.

**Anatomi form:** panel kanan 520 px (desktop) atau sheet full-screen (mobile), `z-drawer`, dengan header (judul + close), body scroll, footer sticky (`Batal`, `Simpan`). Tidak ada preview, draft, atau publish toggle — simpan = langsung publik (blueprint §6.2).

**Aturan tabel:** header sticky, zebra tidak dipakai (garis 1 px), baris 56 px, aksi `Edit` dan `Hapus` selalu terlihat (bukan menu tersembunyi di desktop), kolom angka rata kanan, `mono` untuk tanggal/ID.

**Konfirmasi hapus:** dialog pada `z-search` (di atas panel form), teks `Hapus "<nama>"? Tindakan ini permanen.` + tombol `Hapus permanen` (fill `accent`, teks putih) dan `Batal`. Tidak ada undo, tidak ada Trash.

**Validasi umum:** trim spasi, required, panjang maksimum per field, URL harus `http(s)`, Zod client + server, error inline di bawah field, simpan diblokir saat ada error. Toast sukses `Tersimpan` 3 detik; toast error tidak auto-dismiss (dismiss manual).

**Aksesibilitas:** dialog hapus = `role="alertdialog"`, fokus awal ke `Batal`, Escape menutup, fokus kembali ke tombol pemicu.

### 7.5 AI Management (`/admin/ai`)

**Kolom list:** `LOGO` (40 px), `NAMA`, `KATEGORI`, `SUBKATEGORI`, `STATUS`, `LINKS` (jumlah), `DIPERBARUI`, `AKSI`.

| Field form | Tipe input | Wajib | Validasi |
|---|---|---|---|
| Nama | text | Ya | 2–80 karakter, trim, unik tidak disyaratkan |
| Kategori | select (kategori AI) | Ya | harus ada di daftar |
| Subkategori | select (difilter kategori) | Ya | harus milik kategori terpilih |
| Deskripsi | textarea | Ya | 10–600 karakter, counter |
| Logo | media picker | Ya | raster ≤ 5 MB (PNG/JPG/WEBP/AVIF) atau SVG ≤ 512 KB di folder logo (TD-14) |
| Status penggunaan | select 4 nilai | Ya | `CURRENTLY_USING`, `PREVIOUSLY_USED`, `EXPLORING`, `WANT_TO_TRY` |
| Links | repeatable (label + URL) | Ya, min 1 | label 1–40, URL `https`, maks 5 baris, tidak duplikat |
| Source locale | select `id`/`en` | Ya | default `id` |

**Aksi:** `Simpan` (create/update), `Hapus` (konfirmasi), `Ganti logo` (picker), `Tambah link`/`Hapus link`. Tidak ada duplicate.

**Data/API:** `POST/PATCH/DELETE /api/v1/admin/ai[/:id]`, `GET /api/v1/collections/ai`, `GET /api/v1/admin/media`.

### 7.6 Tools Management (`/admin/tools`)

**Kolom list:** `LOGO`, `NAMA`, `KATEGORI`, `SUBKATEGORI`, `STATUS`, `LINKS`, `DIPERBARUI`, `AKSI`.

| Field form | Tipe input | Wajib | Validasi | Aksi |
|---|---|---|---|---|
| Nama | text | Ya | 2–80 karakter, trim | — |
| Kategori | select (kategori Tools) | Ya | harus ada di daftar | `Kelola Kategori` |
| Subkategori | select (difilter kategori) | Ya | harus milik kategori terpilih | — |
| Deskripsi | textarea | Ya | 10–600 karakter, counter | — |
| Logo | media picker | Ya | raster ≤ 5 MB / SVG ≤ 512 KB (TD-14) | `Ganti logo` |
| Status penggunaan | select 4 nilai | Ya | `CURRENTLY_USING`, `PREVIOUSLY_USED`, `EXPLORING`, `WANT_TO_TRY` | — |
| Links | repeatable (label + URL) | Ya, min 1 | label 1–40, URL `https`, maks 5, tidak duplikat | `Tambah link`, `Hapus link` |
| Source locale | select `id`/`en` | Ya | default `id` | — |

**Aksi:** `Simpan` (create/update), `Hapus` (konfirmasi), `Ganti logo`, `Kelola Kategori`. Tidak ada duplicate.

### 7.7 Websites Management (`/admin/websites`)

**Kolom list:** `LOGO`, `NAMA`, `KATEGORI`, `SUBKATEGORI` (opsional), `STATUS`, `LINKS`, `DIPERBARUI`, `AKSI`.

| Field form | Tipe input | Wajib | Validasi |
|---|---|---|---|
| Nama | text | Ya | 2–80 |
| Kategori | select + `+ Kategori` | Ya | maks 60 karakter |
| Subkategori | select | Tidak | harus milik kategori |
| Deskripsi | textarea | Ya | 10–600 |
| Logo | media picker | Ya | aturan TD-14 |
| Status penggunaan | select | Ya | 4 nilai |
| Links | repeatable | Ya | min 1, maks 5, URL https |
| Source locale | select | Ya | `id`/`en` |

**Aksi:** `Simpan`, `Hapus`, `Ganti logo`, `Kelola Kategori`. Menghapus kategori yang masih dipakai ditolak server (409) → tampilkan daftar item yang memakai.

### 7.8 Social Media Management (`/admin/social-media`)

**Kolom list:** `LOGO`, `PLATFORM`, `USERNAME`, `URL`, `DIBUAT`, `AKSI`.

| Field form | Tipe input | Wajib | Validasi |
|---|---|---|---|
| Platform | text | Ya | 2–40, contoh Instagram/TikTok/YouTube/Facebook/X/Discord |
| Username | text | Ya | 1–50, tanpa spasi di awal/akhir |
| URL profil | url | Ya | `https`, domain bebas |
| Logo | media picker | Ya | aturan TD-14 |

**Aksi:** `Simpan`, `Hapus`. Username dan URL tidak diterjemahkan (TD-15). Tidak ada urutan manual — urut `createdAt ASC`.

### 7.9 Projects Management (`/admin/projects`)

**Kolom list:** `THUMBNAIL`, `JUDUL`, `KATEGORI`, `LINK UTAMA`, `DIBUAT`, `AKSI`.

| Field form | Tipe input | Wajib | Validasi |
|---|---|---|---|
| Judul | text | Ya | 2–80 |
| Kategori | select (Website, Mobile App, AI, Automation, Game, lainnya + custom) | Ya | 1–40 |
| Deskripsi | textarea | Ya | 10–600 |
| Primary link | url | Ya | `https`, tepat satu link |
| Thumbnail | media picker | Tidak | folder `Projects`, aturan TD-14 |
| Source locale | select | Ya | `id`/`en` |

**Aksi:** `Simpan`, `Hapus`, `Ganti thumbnail`, `Hapus thumbnail`. Tidak ada field link sekunder, tidak ada halaman detail, tidak ada galeri.

### 7.10 Learning Journey Management (`/admin/learning-journey`)

**Kolom list:** `LOGO`, `BIDANG`, `DIBUAT`, `AKSI`.

| Field form | Tipe input | Wajib | Validasi |
|---|---|---|---|
| Nama bidang | text | Ya | 2–60, unik |
| Logo | media picker | Ya | aturan TD-14 |
| Source locale | select | Ya | `id`/`en` |

**Aksi:** `Simpan`, `Hapus`, `Ganti logo`. Tidak ada field persentase, level, progress, atau deskripsi (blueprint §5.6).

### 7.11 Setup & Devices Management (`/admin/setup`)

**Kolom list:** `NAMA PERANGKAT`, `PROCESSOR`, `RAM`, `OS`, `DIPERBARUI`, `AKSI`.

| Field form | Tipe input | Wajib | Validasi |
|---|---|---|---|
| Nama perangkat | text | Ya | 2–60 |
| Processor | text | Ya | 1–80 |
| RAM | text | Ya | 1–40 (teks bebas, mis. `32 GB`) |
| GPU | text | Tidak | 1–80 |
| Storage | text | Ya | 1–80 |
| OS | text | Ya | 1–60 |
| Spesifikasi lain | repeatable (label + nilai) | Tidak | maks 8 baris, label 1–30, nilai 1–80 |

**Aksi:** `Simpan`, `Hapus`, `Tambah spesifikasi`. Tidak ada upload foto perangkat dan tidak ada halaman detail (blueprint §5.7). Spesifikasi tidak diterjemahkan (TD-15).

### 7.12 Timeline Management (`/admin/timeline`)

**Kolom list:** `TANGGAL`, `JUDUL`, `KATEGORI`, `DESKRIPSI` (potongan 60 karakter), `DIBUAT`, `AKSI`. Urut default `date DESC`.

| Field form | Tipe input | Wajib | Validasi |
|---|---|---|---|
| Tanggal | date | Ya | format `YYYY-MM-DD`, tidak di masa depan |
| Judul | text | Ya | 2–100 |
| Kategori | text + datalist nilai yang ada | Ya | 1–40 |
| Deskripsi | textarea | Ya | 10–280 karakter |
| Source locale | select | Ya | `id`/`en` |

**Aksi:** `Simpan`, `Hapus`. Tidak ada upload gambar/video (blueprint §5.8), tidak ada rich text.

### 7.13 Media Library (`/admin/media`)

**Tujuan:** melihat, mengunggah, memilih ulang, dan menghapus metadata media. Penghapusan **tidak** menghapus aset Cloudinary (TD-09).

**Anatomi:** folder tabs (AI, Tools, Websites, Projects, Profile) → toolbar (search nama file, toggle grid/list, `Upload`) → area grid/list + info panel kanan 320 px (muncul saat item dipilih) → Load More 24 + 48.

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Admin / Media Library                                         [ UPLOAD ]       |
|              +---------------------------------------------------------------------------------+
|              |  [ AI ] [ Tools ] [ Websites ] [ Projects ] [ Profile ]        [grid|list]     |
|              |  [ Search nama file... ]                                    24 dari 96           |
|              |  +---------------------------------------------+ +----------------------------+  |
|              |  | [img]   [img]   [img]   [img]               | | [ PREVIEW 240 ]            |  |
|              |  | name    name    name    name                | | logo-rf.png                |  |
|              |  | 240x240 1200x630 800x600 512x512            | | PNG . 84 KB . 240x240      |  |
|              |  |                                             | | Folder: Profile            |  |
|              |  | [img]   [img]   [img]   [img]               | | Public ID: rf/profile/...  |  |
|              |  | name    name    name    name                | | Diunggah: 12 Mar 2026      |  |
|              |  |                                             | | ALT [ ________________ ]   |  |
|              |  |                                             | | DIPAKAI OLEH  3 item       |  |
|              |  |                                             | | - AI . Example AI          |  |
|              |  |                                             | | - Profile . Avatar         |  |
|              |  |                                             | | [ SALIN URL ] [ HAPUS ]    |  |
|              |  +---------------------------------------------+ +----------------------------+  |
|              |                        [ LOAD MORE  +48 ]                                       |
+-------------------------------------------------------------------------------------------------+
```

**Grid:** kolom 4 (≥1280), 3 (1024–1279), 3 (768–1023), 2 (<768). Sel: thumbnail 4:3 `object-fit: cover`, nama file 1 baris, dimensi `mono`. List: baris 56 px (thumbnail 32, nama, folder, format, ukuran, dipakai, tanggal, aksi).

**Info panel:** preview, nama file, format, ukuran, dimensi, folder, publicId, tanggal, ALT (editable, diterjemahkan — TD-15), daftar item yang memakai (tautan ke form edit), tombol `Salin URL`, `Hapus`. Panel menutup dengan `X`; pada mobile menjadi sheet bawah.

**Upload dropzone:** area 200 px, border dashed chrome, teks `Tarik file ke sini atau pilih file`, menerima PNG/JPG/WEBP/AVIF ≤ 5 MB, SVG ≤ 512 KB khusus folder logo (TD-14). Drag-over = border `accent` + background `surface-raised`. Upload per file: progress bar (persen), status `Mengunggah`, `Memverifikasi`, `Selesai`, `Gagal`. Validasi ukuran/format dilakukan **sebelum** upload; file invalid ditolak dengan alasan per file. Multi-file diizinkan; antrean berurutan, maks 10 per batch. Setelah upload, metadata dikirim ke backend; item muncul tanpa reload.

**Indikator media terpakai:** badge di sel `3` (jumlah referensi) + ikon rantai; tooltip `Dipakai oleh 3 item`. Media dengan referensi > 0 tidak dapat dihapus (server 409); tombol `Hapus` menampilkan daftar referensi dan `Tutup`.

| Field form | Tipe input | Wajib | Validasi | Aksi |
|---|---|---|---|---|
| File | dropzone / file input | Ya | PNG/JPG/WEBP/AVIF ≤ 5 MB; SVG ≤ 512 KB hanya folder logo; tidak ada audio/video (TD-14) | `Unggah`, `Batal` |
| Folder | select (AI, Tools, Websites, Projects, Profile) | Ya | harus salah satu folder tetap | — |
| ALT | text | Ya | 1–120 karakter, diterjemahkan | `Simpan ALT` |
| URL | read-only | — | `https` Cloudinary | `Salin URL` |
| Hapus | tombol | — | ditolak 409 bila dipakai | `Hapus` + dialog |

**Kolom list media:** `THUMBNAIL`, `NAMA FILE`, `FOLDER`, `FORMAT`, `UKURAN`, `DIMENSI`, `DIPAKAI` (jumlah), `DIUNGGAH`, `AKSI`.

**Picker modal:** `role="dialog"`, 800×560, header `Pilih Media` + folder tabs + search, grid 4 kolom, klik = pilih lalu `Gunakan` (atau double-click), item terpilih = border `accent` + centang. Tombol `Upload baru` membuka dropzone di dalam modal. Tidak ada edit ALT di picker. Setelah dipilih, picker menutup dan field logo/thumbnail menampilkan preview.

**State:** empty folder = dropzone + `Belum ada media di folder ini`; loading = 12 skeleton sel; error = retry; upload gagal = baris error per file + `Coba lagi`; hapus 409 = dialog referensi; media hilang di Cloudinary = thumbnail fallback ikon + badge `Tidak tersedia`.

**Data/API:** `GET /api/v1/admin/media?folder=&limit=24&cursor=`, `POST /api/v1/admin/media/signature`, `POST /api/v1/admin/media`, `DELETE /api/v1/admin/media/:id`. Folder tetap lima (blueprint §6.3), tanpa folder custom.

### 7.14 Profile Management (`/admin/profile`)

| Field form | Tipe input | Wajib | Validasi | Aksi |
|---|---|---|---|---|
| Nama tampilan | text | Ya | 2–60 | `Simpan` |
| Headline / role | text | Ya | 2–80 | `Simpan` |
| Bio | textarea | Ya | 20–1200, diterjemahkan | `Simpan` |
| Tech interests | repeatable text | Ya, min 1 | maks 12 item, 1–40 karakter | `Tambah`, `Hapus` |
| Personal goals | repeatable text | Ya, min 1 | maks 12 item, 1–80 karakter | `Tambah`, `Hapus` |
| Avatar | media picker | Tidak | folder `Profile`, TD-14 | `Ganti avatar` |
| Source locale | select | Ya | `id`/`en` | `Simpan` |

**Kartu lokasi (SiteConfiguration, TD-01):** label saat ini, `ownerLocationUpdatedAt`, tombol `Perbarui lokasi` (manual), status izin, dan pesan error spesifik: izin ditolak, timeout 10 detik, tidak tersedia. Data > 30 hari → badge `Kedaluwarsa` + label publik `Location unavailable`. Koordinat tidak pernah ditampilkan di UI publik; di admin boleh ditampilkan 3 desimal.

**Aksi:** `Simpan`, `Perbarui lokasi`, `Ganti avatar`. Perubahan lokasi tidak memicu permintaan otomatis berulang.

### 7.15 CV Management (`/admin/cv`)

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Admin / CV                                                                     |
|              +---------------------------------------------------------------------------------+
|              |  +---------------------------------------------------------------------------+  |
|              |  | [PDF]  rf-cv-2026.pdf            2.4 MB . 12 Mar 2026                    |  |
|              |  |        [ UNDUH ]  [ GANTI FILE ]                                          |  |
|              |  +---------------------------------------------------------------------------+  |
|              |  +---------------------------------------------------------------------------+  |
|              |  | [ GANTI FILE ]  dropzone PDF . maks 10 MB . hanya .pdf                    |  |
|              |  | [!] Mengganti CV langsung mengganti file yang diunduh pengunjung.        |  |
|              |  +---------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------------------------+
```

| Field form | Tipe input | Wajib | Validasi | Aksi |
|---|---|---|---|---|
| File CV | file input / dropzone | Ya | PDF, ≤ 10 MB, magic bytes `%PDF-` (TD-14), satu file aktif | `Ganti file`, `Unduh` |

**Aksi:** `Ganti file` (konfirmasi karena menimpa), `Unduh`. Tidak ada riwayat versi, tidak ada draft.

**State:** belum ada CV = empty state + `Unggah CV`; upload progress; gagal = alasan (ukuran/format/verifikasi); sukses = toast + metadata diperbarui.

**Data/API:** `GET/POST /api/v1/resume` (unggah via signed Cloudinary + metadata).

### 7.16 Visitor Statistics (`/admin/visitors`)

**Tujuan:** membaca data `VisitorEvent`. Read-only, tanpa IP/UA (TD-03).

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Admin / Visitor Statistics                                                     |
|              +---------------------------------------------------------------------------------+
|              |  TOTAL 12,480   .   PENGUNJUNG 11,902   .   OWNER 578                          |
|              |  +---------------------------------------------+ +----------------------------+  |
|              |  | KUNJUNGAN PER HARI (30 hari)                | | RINGKASAN                  |  |
|              |  |  ####                                       | | Hari ini        142        |  |
|              |  |  ######  ####                               | | 7 hari          980        |  |
|              |  |  +---------------------------------------+  | | 30 hari         4,210      |  |
|              |  +---------------------------------------------+ +----------------------------+  |
|              |  +---------------------------------------------+ +----------------------------+  |
|              |  | ENTRY PATH TERATAS                          | | REFERRER HOST              |  |
|              |  | /workspace            4,102                 | | google.com        2,140    |  |
|              |  | /ai                   2,884                 | | (direct)          1,902    |  |
|              |  +---------------------------------------------+ +----------------------------+  |
+-------------------------------------------------------------------------------------------------+
```

**Kolom/metrik:** total, total non-owner, total owner, per hari (7/30), entry path teratas (maks 10), referrer host teratas (maks 10). Tidak ada daftar per-event, tidak ada ekspor, tidak ada filter tanggal kustom (tidak diminta).

**State:** loading skeleton chart + angka; empty = `Belum ada kunjungan`; error = retry.

**Data/API:** `GET /api/v1/admin/overview` (agregat) atau endpoint statistik admin pada `docs/api-spec.md` — belum dirinci di blueprint §7.4 (§12 butir 5).

### 7.17 Email Configuration (`/admin/email`)

**Tujuan:** menampilkan konfigurasi pengiriman kontak. Perubahan provider dilakukan via environment (TD-12), bukan dari UI.

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Admin / Email Configuration                                                    |
|              +---------------------------------------------------------------------------------+
|              |  STATUS  (*) TERKONFIGURASI                                                     |
|              |  PROVIDER     Resend SMTP             HOST     smtp.resend.com:465              |
|              |  FROM         no-reply@<domain>       ADMIN    <admin email>                    |
|              |  VERIFIKASI   SPF (*)  DKIM (*)       TANGGAPAN 10 detik                        |
|              |  [!] Perubahan konfigurasi dilakukan melalui environment variable dan deploy.    |
+-------------------------------------------------------------------------------------------------+
```

| Field | Sumber | Editabel |
|---|---|---|
| Provider, host, port, from, admin email | env (masked sebagian) | Tidak |
| Status konfigurasi | health check server | Tidak |
| Keterangan SPF/DKIM | catatan statis | Tidak |

**State:** terkonfigurasi / belum terkonfigurasi / gagal verifikasi (dengan alasan generik, tanpa membocorkan secret). Tidak ada tombol `Kirim test` karena tidak didefinisikan (§12 butir 11).

**Data/API:** `GET /api/v1/admin/overview` atau endpoint konfigurasi email pada `docs/api-spec.md` — belum dirinci.

### 7.18 Backup & Restore (`/admin/backup`)

**Dua panel terpisah.** Backup tidak memerlukan re-auth; restore wajib re-autentikasi (TD-13).

```text
+--------------+---------------------------------------------------------------------------------+
| RF           |  Admin / Backup & Restore                                                       |
|              +---------------------------------------------------------------------------------+
|              |  +-------------------------------------+ +-------------------------------------+  |
|              |  | BACKUP                              | | RESTORE                             |  |
|              |  | pg_dump . format .sql . maks 100 MB | | Unggah .sql . maks 100 MB           |  |
|              |  | [ BUAT BACKUP ]                     | | [ PILIH FILE ]                      |  |
|              |  | Status: siap                       | | [!] Mengganti seluruh data          |  |
|              |  | Terakhir: 10 Mar 2026 21:04        | | [ MULAI RESTORE ]                   |  |
|              |  +-------------------------------------+ +-------------------------------------+  |
+-------------------------------------------------------------------------------------------------+
```

**Alur Backup:** klik → `Menyiapkan dump…` → unduhan dimulai (`rf-backup-YYYYMMDD-HHmm.sql`) → toast `Backup diunduh`. Gagal/timeout → panel error + `Coba lagi`. Tidak ada backup terjadwal, tidak ada penyimpanan di server.

**Alur Restore (wajib berurutan):**

| Langkah | UI | Aturan |
|---|---|---|
| 1. Pilih file | dropzone `.sql` ≤ 100 MB | tolak ekstensi/ukuran salah sebelum upload |
| 2. Validasi | `Memeriksa file…` | header dump PostgreSQL, hanya SQL, tolak `\!`, `\connect`, `CREATE DATABASE`, `ALTER SYSTEM`, `COPY ... FROM PROGRAM` |
| 3. Re-auth | dialog password admin | salah → 401 + tidak melanjutkan; 3 gagal → keluar dialog |
| 4. Konfirmasi | `alertdialog` + ketik `RESTORE` | tombol aktif hanya bila teks cocok |
| 5. Progress | stepper: `Snapshot` → `Restore` → `Verifikasi` | progress indeterminate + elapsed; tidak dapat ditutup; peringatan layanan berhenti |
| 6. Hasil | sukses: ringkasan tabel + jumlah row; gagal: alasan + status rollback | sukses = snapshot dihapus; gagal = snapshot disimpan 24 jam |

**Batas & fallback:** request maksimum 4 menit; file > 80 MB → arahkan ke `npm run restore -- <file.sql>` via Railway Shell dengan instruksi yang dapat disalin. Snapshot gagal → restore dibatalkan sebelum eksekusi.

**State khusus:** sesi habis di tengah proses → dialog login ulang, proses tidak diulang otomatis; koneksi terputus → status `Tidak diketahui` + instruksi verifikasi manual via Railway; restore sukses → semua query cache di-invalidate dan halaman di-reload.

**Data/API:** `POST /api/v1/admin/backup` (stream unduhan), `POST /api/v1/admin/restore` (multipart + password).

### 7.19 Authentication Settings (`/admin/auth`)

| Field form | Tipe input | Wajib | Validasi |
|---|---|---|---|
| Username | text | Ya | 3–32, `[a-z0-9._-]`, unik |
| Password saat ini | password | Ya | verifikasi server |
| Password baru | password | Ya | ≥ 12 karakter, tidak sama dengan username, konfirmasi cocok |
| Konfirmasi password baru | password | Ya | sama dengan password baru |

**Info sesi (read-only):** login terakhir, expiry sliding, batas absolut 90 hari, jumlah sesi aktif. Tidak ada daftar sesi individual dan tidak ada tombol revoke per sesi (tidak diminta; revoke otomatis sesuai TD-06).

**Aksi:** `Simpan kredensial`. Sukses → sesi lain di-revoke, session ID dirotasi, toast `Kredensial diperbarui`, sesi saat ini tetap aktif. Gagal verifikasi → `Password saat ini salah`. Tidak ada fitur reset password dari UI.

---

## 8. State & Feedback

| Komponen | Anatomi | Perilaku | Durasi | Aksesibilitas |
|---|---|---|---|---|
| Skeleton | Blok `surface` dengan radius sesuai elemen; tanpa shimmer terang | Hanya untuk konten yang belum pernah dimuat; refetch menampilkan data lama + indikator kecil | Sampai data siap; minimum 200 ms agar tidak berkedip | `aria-hidden="true"`; container `aria-busy="true"` |
| Empty | Glyph grid 48 + judul `h4` + 1 baris penjelasan + aksi opsional | Animasi masuk 240 ms; tidak ada ilustrasi berwarna | Persisten | Teks nyata, bukan hanya ikon |
| Error + retry | Panel border `accent`, judul `Gagal memuat`, 1 baris sebab generik, tombol `Coba lagi` | Retry = refetch blok terkait, bukan reload halaman; setelah 2 gagal beruntun tampilkan kode korelasi | Persisten sampai sukses | `role="alert"`, fokus tidak dipindah otomatis |
| Toast | 320 px, `surface-raised`, border kiri 2 px `accent` (error) atau chrome (info), ikon + teks + `X` | Sukses 3 detik; error persisten; maks 3 bertumpuk; tidak menutupi kontrol | 160 ms masuk, 120 ms keluar | `role="status"` sukses, `role="alert"` error; dapat ditutup keyboard |
| Confirmation dialog | Overlay + panel 400 px, judul, 1 paragraf konsekuensi, `Batal` + aksi destruktif | Fokus awal `Batal`; Escape menutup; klik backdrop menutup hanya untuk aksi non-destruktif | 200 ms | `role="alertdialog"`, `aria-modal`, focus trap, fokus kembali |
| Not found | Kode `404`/`Tidak ditemukan`, penjelasan, 1–2 aksi | Untuk detail item yang tidak ada, aksi `Kembali ke <kategori>` | Statis | `h1` fokus saat mount |
| Image fallback | Kotak `surface-raised` + inisial 2 huruf atau ikon kategori | `onError` sekali; tidak retry otomatis berulang | — | `alt` tetap deskriptif; dekoratif = `alt=""` |
| Inline field error | Teks 12 px `accent-aa` di bawah field + border field | Muncul setelah blur atau submit, bukan setiap ketikan | 120 ms | `aria-invalid`, `aria-describedby` |
| Progress (upload/restore) | Bar 4 px + persen `mono` + label tahap | Indeterminate bila server tidak memberi persen | — | `role="progressbar"` + `aria-valuenow` (bila ada) |
| Offline banner | Bar tipis di bawah header | Tampil saat `navigator.onLine = false`; hilang otomatis saat online | 160 ms | `role="status"` |

**Aturan umum:** satu jenis kegagalan = satu pesan. Tidak ada pesan teknis mentah (stack, SQL, nama tabel) di UI. Kode korelasi hanya untuk dukungan.

---

## 9. Interaksi & Aksesibilitas

| Area | Ketentuan |
|---|---|
| Target sentuh | Semua kontrol ≥ 44×44 px; jarak antar-target ≥ 8 px. Ikon dalam tabel admin minimal 32 px area klik + padding |
| Fokus | Selalu terlihat (`focus-ring`); tidak ada `outline: none` tanpa pengganti; fokus tidak hilang saat konten berubah (Load More memindahkan fokus ke item baru pertama) |
| Skip link | Elemen pertama di DOM: `Langsung ke konten` → `#main`, terlihat saat fokus, 44 px |
| Landmark | `header`, `nav` (sidebar), `main` (id), `footer`; satu `h1` per halaman |
| ARIA | `aria-label` untuk ikon-tombol (search, mute, hide, close, prev/next); `aria-current="page"` pada nav aktif; `aria-expanded` untuk popover/drawer; `aria-live="polite"` untuk hasil search dan counter |
| Keyboard | Seluruh alur dapat diselesaikan tanpa mouse: sidebar, drawer, search, form, tabel admin, dialog, picker media, restore |
| Urutan Tab | Mengikuti urutan visual; drawer dan modal memerangkap fokus; konten belakang `inert` |
| Escape | Menutup lapisan teratas satu per satu: toast → dialog → picker → search → drawer/popover |
| Reduced motion | `prefers-reduced-motion: reduce` → tier `lite` (TD-10). Animasi tidak dimatikan total; hanya dikurangi. Tidak ada autoplay video, tidak ada marquee, tidak ada parallax |
| Kontras | Teks ≥ 4.5:1, teks besar ≥ 3:1, border kontrol ≥ 3:1 terhadap latar bersebelahan. Diuji untuk 5 tema |
| Warna | Status selalu disertai teks/bentuk; link dalam paragraf memakai `underline` + `accent-aa`, bukan warna saja |
| Zoom | Layout tetap berfungsi pada 200% zoom dan 320 px lebar; tidak ada scroll horizontal pada body |
| Form | Label persisten, `autocomplete`, pesan error spesifik, tidak ada CAPTCHA yang memblokir tanpa alternatif (reCAPTCHA v2 checkbox wajib) |
| Judul halaman | `document.title` unik per rute; perubahan rute mengumumkan judul via `aria-live` halus |
| Bahasa | `lang` mengikuti bahasa aktif (`id`/`en`); istilah teknis tidak diterjemahkan |

---

## 10. Responsive Rules

### 10.1 Perubahan per Breakpoint

| Rentang | Navigasi | Grid | Header | Footer | Lain |
|---|---|---|---|---|---|
| `< 640` | Drawer + backdrop | 1 kolom; tile 2 kolom untuk stat kecil | Hamburger, wordmark, search ikon, dot status; jam disembunyikan | 2 baris | Gutter 16; padding halaman 16; hero 1 kolom; tabel admin = card list |
| `640–767` (`sm`) | Drawer | 2 kolom masonry; 2 kolom tile | Sama; search tetap ikon | 2 baris | Gutter 16; kartu lebih rapat |
| `768–1023` (`md`) | Drawer | 2 kolom masonry | Jam tampil; search ikon/input ringkas | 1 baris | Gutter 24; tabel admin mulai terlihat (scroll horizontal) |
| `1024–1279` (`lg`) | Sidebar persisten (expanded/rail), drawer nonaktif | 3 kolom masonry | Breadcrumb + search input + jam + status | 1 baris | Detail 2 kolom; sidebar 280 atau rail 64 |
| `1280–1535` (`xl`) | Sidebar 280 | 4 kolom masonry | Penuh | 1 baris | Info panel media 320 tampil sebagai kolom |
| `≥ 1536` (`2xl`) | Sidebar 280 | 4 kolom, konten max 1440 | Penuh | 1 baris | Ruang simetris di kedua sisi; tidak menambah kolom |

### 10.2 Masonry

| Lebar | Kolom | Gap | Varian tinggi |
|---|---|---|---|
| `< 640` | 1 | 16 | S/M/L tetap, lebar penuh |
| `640–1023` | 2 | 16 | S 200, M 260, L 320 |
| `1024–1279` | 3 | 24 | S 240, M 320, L 420 |
| `≥ 1280` | 4 | 24 | S 240, M 320, L 420 |

Tidak ada kartu yang melebar 2 kolom. Reflow setelah Load More tanpa animasi posisi; item baru fade 160 ms.

### 10.3 Tabel Admin

| Rentang | Tampilan |
|---|---|
| `≥ 768` | Tabel penuh; kolom prioritas: nama + status + aksi selalu terlihat; kolom sekunder dapat di-scroll horizontal dengan header sticky |
| `< 768` | Setiap baris menjadi card list: judul (nama), 2–3 pasangan label–nilai, status, dan baris aksi `Edit`/`Hapus` 44 px. Header kolom tidak ditampilkan. Tidak ada horizontal scroll |
| `< 768` form | Sheet full-screen, footer sticky, field satu kolom, picker media full-screen |
| Media Library `< 768` | Grid 2 kolom; info panel menjadi bottom sheet 80dvh |

### 10.4 Elemen yang Berubah

- Sidebar → drawer di `< lg`; rail hanya `lg+`.
- Search trigger → ikon di `< md`; overlay selalu full-screen di `< md`.
- Breadcrumb dibatasi 2 level di mobile; level menengah diringkas menjadi `…` dengan menu.
- Footer menyusut menjadi 2 baris; DB/owner status tetap tampil.
- Chart admin: sumbu Y disembunyikan di `< sm`, tooltip tetap.
- Timeline: rail 2 px tetap, padding kiri 24 → 16.
- Contact: kolom info turun ke bawah form.
- Detail item: logo di atas (bukan kolom kiri), prev/next menjadi 2 tombol lebar penuh.

---

## 11. Larangan

Daftar berikut **tidak boleh** muncul di UI mana pun.

**Fitur produk**

1. Filter status pada daftar konten (publik maupun admin).
2. Bulk action, checkbox seleksi massal, "pilih semua".
3. Draft, preview, publish/unpublish, jadwal publikasi — simpan = langsung publik.
4. Duplicate item.
5. Trash, recycle bin, undo hapus, restore item.
6. Activity log, audit trail, riwayat perubahan konten.
7. Halaman hasil pencarian terpisah (`/search?q=`), riwayat pencarian, saran pencarian, typo correction, autocomplete dari data pengguna.
8. Halaman detail Project; modal detail Project; lebih dari satu link pada Project.
9. Halaman detail Setup/Device; foto perangkat; galeri perangkat.
10. Persentase, level, progress bar, atau badge pencapaian pada Learning Journey.
11. Gambar/video pada Timeline.
12. Multi-admin, daftar pengguna, role, permission, undangan.
13. "Lupa password" / reset password via email; reset hanya lewat database.
14. Backup terjadwal, penyimpanan backup di database/Cloudinary, unduh backup lama dari UI.
15. Komentar, rating, review, favorit, like, share count pengunjung.
16. External analytics (GA, Plausible, pixel), cookie consent banner pihak ketiga.
17. PWA install prompt, service worker, offline mode.
18. Maintenance mode, coming soon, countdown.
19. Polling status DB/presence; auto-refresh halaman berkala.
20. Peta dengan koordinat presisi, alamat jalan, atau lokasi pengunjung.
21. Menampilkan IP, user agent, atau data fingerprint pengunjung.
22. Volume SFX terpisah, mute kedua untuk SFX, equalizer.
23. Lebih dari lima tema, theme editor kustom, mode terang, ikut `prefers-color-scheme`.
24. Folder media kustom di luar lima folder tetap; pembersihan otomatis aset Cloudinary.
25. Tombol "Kirim test email" atau editor konfigurasi email di dashboard (perubahan via env).
26. Notifikasi push, email marketing, newsletter.

**Visual**

27. Warna aksen per kategori, status, chart, atau tipe konten. Hanya black/red/chrome.
28. Gradient pelangi, neon hijau/biru/ungu, glassmorphism berwarna, ilustrasi 3D berwarna.
29. Emoji sebagai ikon antarmuka atau pengganti status.
30. Font dekoratif script, atau body text < 16 px.
31. Radius > 12 px pada panel/kartu utama; shadow berwarna selain hitam/merah.
32. Teks yang hanya mengandalkan warna untuk status; ikon tanpa label pada aksi utama.
33. Animasi loop tak terbatas pada elemen teks panjang, marquee otomatis, parallax pada tier `lite`.
34. Skeleton dengan shimmer terang; spinner layar penuh untuk navigasi internal.
35. Placeholder-only form, tooltip sebagai satu-satunya label.
36. Angka statistik yang berubah-ubah tanpa sumber (angka hiasan).
37. ID numerik atau slug SEO pada URL publik.
38. Bahasa campur dalam satu kalimat (label UI mengikuti kamus `id`/`en` secara konsisten).

---

## 12. Perlu Klarifikasi

Butir berikut tidak dapat diputuskan dari blueprint/TD. Spesifikasi di atas memakai asumsi yang ditandai; asumsi harus dikonfirmasi sebelum implementasi terkait.

| # | Isu | Asumsi dokumen ini | Dampak bila berbeda |
|---|---|---|---|
| 1 | Tema "default saat reload" vs `sessionStorage` yang bertahan saat reload | Key ditulis ke sessionStorage untuk antar-route, tetapi diabaikan/direset ke `VOID` saat boot reload | Bila maksudnya bertahan sampai tab ditutup, hapus reset saat boot |
| 2 | Social Media ada di sitemap §2.1 tetapi tidak ada di daftar URL §2.3 | Ditampilkan sebagai section di `/workspace` | Bila perlu rute `/social-media`, tambah halaman + wireframe |
| 3 | Label root breadcrumb | `Home` (label UI), bukan `Workspace` | Ganti label di kamus |
| 4 | Bentuk halaman koleksi: section per kategori vs satu grid dengan header | Section per kategori, Load More per section; subkategori hanya label; tanpa filter | Bila perlu filter/nav kategori, tambah komponen chip |
| 5 | Endpoint detail item, prev/next, statistik admin, konfigurasi email tidak ada di §7.4 | Detail memakai data list; endpoint dirujuk ke `docs/api-spec.md` yang belum tersedia | Perlu spesifikasi API sebelum implementasi detail/admin |
| 6 | Tech Stack tidak punya halaman CRUD di daftar admin | Konten dikelola di luar 15 layar CRUD (seed/konfigurasi) | Perlu layar admin Tech Stack |
| 7 | Sumber konten Privacy Policy | Statis di frontend | Bila via CMS, perlu model + layar admin |
| 8 | Rute admin (`/admin/ai` dst.) tidak tercantum di §2.3 | Konvensi `/admin/<resource>` | Sesuaikan router |
| 9 | Overview "incoming message information" padahal pesan tidak disimpan | Kartu status email, bukan daftar pesan | Perlu mekanisme penyimpanan pesan (bertentangan §5.11) |
| 10 | UI kelola kategori/subkategori (create/rename/delete) tidak dirinci | Panel `Kelola Kategori` dari halaman koleksi admin | Perlu layar/route tersendiri |
| 11 | Email Configuration editabel atau read-only | Read-only (TD-12: perubahan via env) | Bila editabel, perlu alur simpan + verifikasi |
| 12 | Font final dan ketersediaan CV | Placeholder `<TBD>` + fallback stack; CV opsional | Token font harus diisi sebelum implementasi visual |

---

**Selesai.** Dokumen ini mencakup 18 halaman publik (termasuk Welcome Screen dan 404) dan 18 layar admin (login, shell, overview, 15 modul). Setiap penyimpangan dari blueprint/TD dicatat di §12.

