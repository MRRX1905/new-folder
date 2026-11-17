# Acceptance Test Plan — RF Personal Tech Dashboard

**Versi:** 1.0  
**Tanggal:** 2026-11-14  
**Status:** Draft untuk review  
**Acuan mengikat:** `docs/blueprint-v1.0.md`, `docs/technical-decisions.md` (TD-01 s/d TD-15). Bila konflik, TD menang.

> Dokumen ini hanya mendefinisikan pengujian. Tidak ada fitur baru yang ditetapkan di sini. Kode status HTTP yang belum diatur TD mengikuti konvensi REST dan wajib diselaraskan dengan `docs/api-spec.md` sebelum suite integration dibekukan.

## Konvensi

| Kode | Arti |
|---|---|
| `U` | Unit test — Vitest, tanpa I/O |
| `I` | Integration/API — Supertest + PostgreSQL test database |
| `E` | E2E — Playwright, Chromium + WebKit |
| `S` | SEO/prerender — `curl` + parser HTML/XML |
| `P` | Performance — Lighthouse CI, Playwright trace, rAF sampling |
| `A` | Accessibility — axe + keyboard manual |
| `M` | Manual visual/motion — checklist, rekaman layar, perangkat nyata |
| P0 | Blocker: keamanan, kehilangan data, alur inti. Wajib lulus |
| P1 | Major: fitur utama, SEO, performa target. Wajib lulus |
| P2 | Minor: kosmetik, tepi, kenyamanan. Boleh backlog |

ID kasus: `TC-<RF>-<nn>`, `UNIT-<nn>`, `SEC-<nn>`, `PERF-<nn>`, `SEO-<nn>`, `RESP-<nn>`, `A11Y-<nn>`, `BAK-<nn>`.

---

## Strategi

### Lapisan Uji

| Lapisan | Perkakas | Cakupan | Sinyal lulus |
|---|---|---|---|
| Unit | Vitest | Fungsi murni: pemilih tier animasi (TD-10), skema Zod, parser cursor/limit, formatter, sanitizer wrapper, aturan urutan A–Z, validasi ukuran/format file, guard SQL restore | Semua lulus; tidak ada `test.skip` pada P0 |
| API / Integration | Supertest + PostgreSQL 16 | Seluruh endpoint `/api/v1`, auth, CSRF, rate limit, CRUD, media metadata, backup/restore, translate/contact dengan stub | Semua lulus pada DB bersih; tidak ada state bocor antar-spec |
| E2E | Playwright Chromium + WebKit | Alur pengunjung, admin, cookie persisten, drawer, search, audio fallback, backup/restore UI | Semua P0/P1 lulus; trace tersimpan saat gagal |
| SEO / Prerender | `curl`, parser HTML/XML, validasi JSON-LD | HTML hasil build, metadata, sitemap, robots, status 404, freshness Deploy Hook | Tanpa JS, konten dan metadata terbaca |
| Performance | Lighthouse CI, Playwright trace, Chrome Performance panel, rAF sampling | Budget Web Vitals, JS, FPS, long task, tier `lite`/`full` | Semua budget terpenuhi pada build produksi |
| Accessibility | axe-core + keyboard manual + screen reader | WCAG 2.2 AA dasar | 0 critical/serious; seluruh alur keyboard selesai |
| Manual visual/motion | Checklist, rekaman layar, iPhone/Android nyata | Glitch, ambient background, swipe, masonry, tema, audio, SFX | Sign-off QA + pemilik |

### Cakupan Unit

Unit test menargetkan logika yang tidak memerlukan browser/DB. Kasus integration yang memakai logika sama tetap dijalankan untuk memverifikasi wiring.

| ID | Target | Hasil yang diharapkan |
|---|---|---|
| UNIT-01 | Pemilih tier animasi (TD-10) | `lite` untuk `deviceMemory<=4`, `hardwareConcurrency<=4`, `saveData`, atau reduced motion; `full` untuk kombinasi lain |
| UNIT-02 | Skema Zod CRUD | Payload valid lolos; URL invalid, enum `usageStatus` salah, `sourceLocale` salah, dan field wajib kosong ditolak dengan pesan field |
| UNIT-03 | Parser cursor/limit (TD-08) | Default 12/20/24 sesuai konteks; cursor invalid ditolak; `nextCursor=null` berhenti |
| UNIT-04 | Komparator A–Z (TD-07) | `lower(name)` ASC; tie-break `id` ASC; unicode sederhana tidak mengubah urutan dasar |
| UNIT-05 | Validator upload (TD-14) | Raster 5 MB, SVG 512 KB hanya folder logo, PDF 10 MB dengan magic `%PDF-`; tipe lain ditolak |
| UNIT-06 | Guard SQL restore (TD-13) | `\!`, `COPY ... FROM PROGRAM`, `CREATE DATABASE`, `\connect`, `ALTER SYSTEM`, header non-PG ditolak; SQL biasa lolos |
| UNIT-07 | Sanitizer SVG (TD-14) | `<script>`, handler `on*`, `foreignObject`, dan `javascript:` dihapus; SVG bersih dipertahankan |
| UNIT-08 | Batas batch translate (TD-04) | >50 teks atau >5.000 karakter ditolak; teks tunggal >5.000 karakter dikeluarkan dari batch |

### Environment

| Environment | Frontend | Backend | Database | Layanan eksternal | Tujuan |
|---|---|---|---|---|---|
| Local | Vite dev/preview di `localhost` | Express lokal, port terpisah, proxy `/api` | PostgreSQL 16 via container | Stub Cloudinary, SMTP capture, DeepL stub, reCAPTCHA test key | Siklus cepat, debugging |
| CI | Build produksi + static preview | Express hasil build, satu origin dengan proxy | PostgreSQL 16 service container, DB per run | Seluruh layanan eksternal di-stub | Gate merge |
| Staging | Vercel preview/production | Railway staging | Railway PostgreSQL 16 terpisah | Cloudinary folder uji, Resend test domain, DeepL key terbatas, reCAPTCHA v2 test key | Uji same-site cookie, Deploy Hook, restore drill, Safari nyata |

Staging **wajib** memakai custom domain same-site (`rf.<domain>` + `api.rf.<domain>`) sesuai TD-06. Tanpa ini RF-018 dan SEC-08 tidak valid diuji.

### Seeding, Fixture, dan Isolasi

| Aspek | Ketentuan |
|---|---|
| Migrasi | `npx prisma migrate deploy` sebelum seed; tidak ada `db push` |
| Seed admin | Satu akun dari seed; password di-hash Argon2id (m=19456 KiB, t=2, p=1) |
| ID fixture | cuid2 24 karakter yang ditetapkan di file fixture, bukan acak, agar URL stabil |
| Reset | `TRUNCATE ... RESTART IDENTITY CASCADE` pada seluruh tabel sebelum tiap spec integration; drop DB setelah run |
| Isolasi | Satu database per run dan per shard/worker (`rf_test_<run_id>_<shard>`); restore drill memakai database disposable terpisah |
| E2E paralel | Project read-only paralel dengan DB per worker; project mutasi (auth, CMS, backup) berjalan serial `workers: 1` |
| Waktu | Playwright `page.clock` untuk Welcome 5 detik; expiry sesi diuji dengan mengubah timestamp row `Session` di DB |
| Jaringan | Route interception/`fulfill` untuk 429, timeout, dan respons Cloudinary; tidak ada panggilan layanan berbayar di CI |
| Bukti | Screenshot + video saat gagal, trace Playwright, laporan Lighthouse, coverage, bundle stats |

### Data Uji

| Dataset | Jumlah | Tujuan |
|---|---|---|
| AI | 30 item, 6 subkategori | Load More 12 + 12 + 6, pencarian, Previous/Next |
| Tools | 18 item, 5 subkategori | Load More, kategori custom |
| Websites | 14 item, kategori custom | Load More, header kategori |
| Projects | 30 item | Load More 12 + 12 + 6 |
| Timeline | 45 entri | Load More 20 + 20 + 5 |
| Media | 80 file (5 folder) | Media Library 24 + 48 + 8, reuse, 409 |
| Social Media | 7 platform | Statistik, urutan |
| Learning Journey | 5 bidang | Tampilan kelompok |
| Devices | 3 perangkat | Spesifikasi panjang |
| VisitorEvent | 1.000 baris (termasuk 50 `isOwner`) | Counter, statistik |
| Locale | Campuran `sourceLocale` `id`/`en` | Terjemahan dan fallback |
| Edge | Kategori kosong, item tanpa media, nama unicode, nama sangat panjang | Empty state, fallback, overflow |

---

## Traceability Matrix

Setiap RF memiliki minimal satu kasus yang menguji perilaku nyata. Prasyarat `seed` berarti dataset pada bagian Data Uji sudah dimuat.

| ID | Kriteria | Tipe | Prasyarat | Langkah ringkas | Hasil yang diharapkan | TD | Prio |
|---|---|---|---|---|---|---|---|
| TC-001-01 | RF-001 Welcome Screen tampil | E | Build/preview, context baru, seed | Buka `/`; jangan berinteraksi | Logo, identitas, statistik, dan visitor counter tampil; workspace belum tampil | TD-03, TD-10 | P0 |
| TC-002-01 | RF-002 Pindah otomatis ≤5 detik | E | `page.clock`; autoplay diblokir | Buka `/`; majukan 5.000 ms | Workspace tampil ≤5,5 s; audio gagal tidak menahan transisi | TD-05 | P0 |
| TC-003-01 | RF-003 Klik langsung masuk | E | Welcome tampil | Klik CTA/area Welcome | Workspace tampil <500 ms; tidak ada layar antara | — | P0 |
| TC-004-01 | RF-004 Sidebar dapat disembunyikan | E | Viewport 1440×900 | Klik hide; klik floating button | Sidebar hilang; tombol floating terlihat; sidebar kembali | — | P1 |
| TC-005-01 | RF-005 Drawer mobile | E | Viewport 390×844, touch | Buka drawer; tutup via X; buka; tap backdrop | Drawer + backdrop tampil; tertutup sesuai aksi; fokus kembali ke pemicu | — | P1 |
| TC-005-02 | RF-005 Swipe drawer | M | iPhone Safari nyata, staging | Swipe ke kiri pada drawer terbuka | Drawer tertutup; tidak memicu navigasi atau pull-to-refresh | — | P1 |
| TC-006-01 | RF-006 Header kategori unik | E | 3 kategori berisi item | Buka `/ai`, `/tools`, `/websites`; bandingkan header | Header ada di tiap kategori; token gaya/kelas berbeda; counter tampil | TD-10 | P2 |
| TC-006-02 | RF-006 Pola visual berbeda | M | Tier `full` | Amati pola dan animasi header tiap kategori | Pola dan animasi berbeda; palet hitam/merah/chrome; tanpa aksen luar palet | TD-10 | P2 |
| TC-007-01 | RF-007 Detail item AI/Tools/Websites | I+E | 3 item seed (AI, TOOL, WEBSITE) | GET koleksi; buka `/ai/:id`, `/tools/:id`, `/websites/:id` | Breadcrumb, logo, nama, deskripsi, status, links tampil; data = seed | TD-07, TD-15 | P0 |
| TC-008-01 | RF-008 Prev/Next dalam kategori | E | Kategori ≥3 item | Buka item tengah; klik Prev lalu Next | Pindah item kategori sama; URL dan konten berubah | TD-07 | P1 |
| TC-008-02 | RF-008 Batas kategori | E | Item pertama dan terakhir | Buka batas; cek tombol | Prev disabled di item pertama; Next disabled di item terakhir | TD-07 | P1 |
| TC-009-01 | RF-009 Urutan A–Z | I | Seed nama campur huruf besar/kecil | GET koleksi; bandingkan urutan | `lower(name)` ASC, tie-break `id` ASC | TD-07 | P1 |
| TC-009-02 | RF-009 Urutan navigasi | E | Sama | Telusuri Prev/Next dari item pertama | Urutan sama dengan API; tidak melewati kategori | TD-07 | P1 |
| TC-010-01 | RF-010 Partial match | I+E | Seed `ChatGPT`, `GitHub` | Query `gpt`, `GITHUB`, lalu typo `ChatGTP` | Partial case-insensitive cocok; typo tidak dikoreksi (hasil kosong) | TD-08 | P0 |
| TC-011-01 | RF-011 Filter kategori multi-select | E | Seed 5 tipe | Pilih chip AI + Projects; lepas satu chip | Hanya tipe terpilih tampil; chip aktif terlihat; toggle melepas filter | TD-08 | P1 |
| TC-012-01 | RF-012 Hasil live | E | Seed, backend stub | Ketik kata kunci | Dropdown muncul tanpa submit; maks 5 per grup, 20 total | TD-08 | P0 |
| TC-012-02 | RF-012 Interaksi dropdown | E | Dropdown terbuka | Panah/Enter, Esc, klik luar, query kosong, kembali dari detail | Enter membuka pilihan; Esc/klik luar menutup; empty state; kembali mereset pencarian | TD-08 | P1 |
| TC-013-01 | RF-013 CRUD CMS | I | Sesi admin | CRUD 8 koleksi + kategori/subkategori via API; baca DB | 2xx; row sesuai; update mengubah; delete permanen; validasi menolak input invalid | TD-07 | P0 |
| TC-013-02 | RF-013 CRUD via UI | E | Sesi admin | CRUD via UI termasuk kategori/subkategori; konfirmasi hapus; cari; sort tanggal | List ter-update; dialog konfirmasi wajib; pencarian nama; sort `createdAt` | — | P0 |
| TC-013-03 | RF-013 Validasi referensi | I | Sesi admin | Kirim URL, tipe konten, dan `mediaId` invalid | 400; tidak ada row; pesan per field | TD-14 | P1 |
| TC-014-01 | RF-014 Perubahan langsung publik | I+E | Sesi admin, seed | Create/update/delete; GET publik segera | Publik berubah pada request berikutnya tanpa rebuild; snapshot SEO boleh tertinggal ≤10 menit | TD-11 | P0 |
| TC-015-01 | RF-015 Reuse media antar-item | I | 2 item AI, 1 media | Pasang `logoMediaId` sama; GET keduanya | Keduanya memakai media sama; tidak ada duplikasi row Media | TD-09 | P1 |
| TC-015-02 | RF-015 Pilih media existing | E | Media Library terisi | Pilih file existing pada form item | File terpilih tanpa upload ulang; metadata tampil | TD-14 | P1 |
| TC-016-01 | RF-016 Hapus item ≠ hapus media | I | Item dengan media | Hapus item; cek row Media dan stub Cloudinary | Row Media tetap; tidak ada panggilan Cloudinary Destroy | TD-09 | P0 |
| TC-016-02 | RF-016 Orphan media | I | Media menjadi tidak direferensikan | Hapus item, lalu hapus media orphan lewat admin | Row Media terhapus; aset Cloudinary tetap; nol panggilan Cloudinary Destroy | TD-09 | P0 |
| TC-017-01 | RF-017 Ganti username/password | I+E | Login admin | PATCH kredensial; logout; login kredensial baru | Kredensial baru berlaku; password lama 401; username lama 401 | TD-06 | P0 |
| TC-017-02 | RF-017 Revoke sesi lain | I | ≥2 sesi aktif | Ubah password | Semua sesi lain 401; sesi aktif dirotasi; sesi baru valid | TD-06 | P0 |
| TC-018-01 | RF-018 Sesi persisten | E | Chromium + WebKit `launchPersistentContext`; staging same-site | Login; tutup browser; buka profile sama | Masih login; cookie `rf_sess` HttpOnly, `SameSite=Lax`, `Path=/`, Secure di production | TD-06 | P0 |
| TC-018-02 | RF-018 Sliding expiry | I | Sesi aktif | Ubah timestamp sesi ke hari 29; request; ulangi 1 jam kemudian | Expiry diperpanjang; rotasi maksimum 1×/jam; Max-Age 30 hari | TD-06 | P1 |
| TC-018-03 | RF-018 Cap absolut 90 hari | I | Login hari 0 | Ubah timestamp ke hari 91; request admin API | 401; cookie dihapus; wajib login ulang | TD-06 | P0 |
| TC-018-04 | RF-018 Logout revoke | I+E | Login | Logout | Row Session terhapus; cookie terhapus; admin API 401 | TD-06 | P0 |
| TC-019-01 | RF-019 Lima tema | E | — | Pilih kelima tema | Tepat 5 pilihan; tema aktif berubah; CSS variables berubah | — | P2 |
| TC-019-02 | RF-019 Tema session-only | E | Tema dipilih | Reload; buka context baru | Reload dalam sesi sama bertahan (sessionStorage); context baru kembali default | — | P2 |
| TC-020-01 | RF-020 Ganti bahasa | I+E | Item `sourceLocale=id`; bahasa EN | Pilih EN | Field TD-15 diterjemahkan; UI statis EN; URL, username, spesifikasi tidak diterjemahkan | TD-04, TD-15 | P1 |
| TC-020-02 | RF-020 Locale sama | I | Item `sourceLocale=en` | Pilih EN | Tidak ada panggilan translate untuk item tersebut | TD-04, TD-15 | P2 |
| TC-021-01 | RF-021 Pilih musik | E | ≥2 track | Pilih track; play/pause; ubah volume | Track berganti; state play/pause benar; volume berubah | TD-05 | P2 |
| TC-021-02 | RF-021 Kontinuitas musik | E | Musik playing | Navigasi antar halaman | Audio tidak restart/berhenti; posisi berlanjut | TD-05 | P2 |
| TC-021-03 | RF-021 Master mute | E | Musik + SFX aktif | Aktifkan master mute; interaksi; tekan Play | Musik dan SFX senyap; Play mematikan mute dengan feedback visual | TD-05 | P1 |
| TC-022-01 | RF-022 Fallback autoplay | E | Kebijakan autoplay diblokir | Buka `/`; masuk workspace | Tombol `Play Music` muncul; klik memutar audio | TD-05 | P1 |
| TC-022-02 | RF-022 Audio tidak memblokir | E | Autoplay diblokir | Buka `/`; tunggu 5 detik | Transisi workspace tetap terjadi; tidak ada dialog blocking | TD-05 | P1 |
| TC-023-01 | RF-023 Statistik kategori | I+E | Seed | GET statistics; buka Welcome | 5 angka = COUNT DB: AI, Tools, Websites, Projects, Social Media | — | P2 |
| TC-024-01 | RF-024 Total visitor | I+E | 1.000 VisitorEvent (termasuk 50 owner) | GET visitor-count; buka `/`; tunggu beacon; GET ulang (poll ≤5 s) | Total awal = row count termasuk owner; tampil di Welcome; setelah page load bertambah 1 | TD-03 | P1 |
| TC-025-01 | RF-025 Contact mengirim email | I | SMTP capture + reCAPTCHA stub | POST kontak valid | 200; email ke `ADMIN_EMAIL`; `replyTo` pengunjung; subjek `[RF Contact] <nama>`; tidak ada row pesan | TD-12 | P0 |
| TC-026-01 | RF-026 Ganti CV | I+E | Sesi admin; PDF valid | Ganti CV; GET resume; unduh | Resume baru aktif; unduh 200 `application/pdf`; file lama tergantikan | TD-14 | P1 |
| TC-027-01 | RF-027 Backup SQL | I | Sesi admin; `pg_dump` tersedia | POST backup; unduh file | Nama `rf-backup-YYYYMMDD-HHmm.sql`; schema + data; tanpa `CREATE DATABASE`/owner/privileges; ≤100 MB | TD-13 | P0 |
| TC-028-01 | RF-028 Snapshot sebelum restore | I | Sesi admin; DB disposable; instrumentasi `/tmp` | Restore file valid; cek filesystem dan DB | `/tmp/pre-restore-<ts>.sql` dibuat sebelum `psql`; restore sukses; snapshot dihapus setelah sukses | TD-13 | P0 |
| TC-029-01 | RF-029 Custom 404 | E+S | Preview build | Buka `/tidak-ada` | Halaman 404 kustom tampil; HTTP status 404 | TD-11 | P2 |
| TC-029-02 | RF-029 Item tidak ditemukan | E | Seed | Buka `/ai/<cuid2-tidak-ada>` | Not found state/404; HTTP status 404 | TD-07, TD-11 | P2 |
| TC-030-01 | RF-030 Metadata publik | S | Build prerender | `curl` tiap rute publik; parse HTML | Title ≤60, description ≤155, canonical, OG/Twitter, hreflang id/en, JSON-LD ada | TD-11 | P1 |

---

## Negative & Security Tests

Berlaku untuk semua non-GET admin: `Origin`/`Referer` allowlist + `X-RF-Client: web`. Untuk endpoint publik non-GET (`/visits`, `/contact`, `/translate`) lihat butir klarifikasi CL-03. Rate limit diuji per instance backend; TD-03 menyebut penyimpanan in-memory, TD-04/06 tidak menetapkan media penyimpanan (CL-12).

| ID | Skenario | Prasyarat | Langkah | Hasil yang diharapkan | TD | Prio |
|---|---|---|---|---|---|---|
| SEC-01 | Brute force login per IP | DB bersih; IP tetap | 5 login gagal dalam 15 menit; percobaan ke-6 dengan password benar | 429 + delay progresif; tidak ada sesi; setelah 15 menit kredensial benar diterima | TD-06 | P0 |
| SEC-02 | Lockout akun | DB bersih | 10 login gagal dari beberapa IP; lalu password benar | Akun terkunci 15 menit; password benar tetap ditolak tanpa sesi; setelah 15 menit berhasil | TD-06 | P0 |
| SEC-03 | Session fixation | Belum login | Catat cookie pra-login; login; bandingkan token | Token baru acak 32 byte; token lama 401; row `Session` dirotasi | TD-06 | P0 |
| SEC-04 | Rotasi saat perpanjangan | Sesi berumur 1 jam | Trigger sliding renewal; ulangi request dalam 1 jam | Session ID berubah; ID lama ditolak; rotasi maksimum 1×/jam | TD-06 | P1 |
| SEC-05 | Rotasi saat ganti kredensial | 2 sesi aktif (A, B) | Ganti password dari sesi A | Sesi B 401; sesi A dirotasi; password lama gagal | TD-06 | P0 |
| SEC-06 | CSRF tanpa header | Sesi admin valid, Origin sah | POST/PATCH/DELETE admin tanpa `X-RF-Client` | 403; tidak ada mutasi; row tidak berubah | TD-06 | P0 |
| SEC-07 | CSRF Origin/Referer asing | Sesi admin valid | Kirim `Origin`/`Referer` domain lain; lalu tanpa keduanya | 403 pada keduanya; hanya origin allowlist yang lolos | TD-06 | P0 |
| SEC-08 | Cookie lintas site | Staging same-site; Chromium + WebKit | Halaman domain lain melakukan `fetch` ke admin API | Cookie tidak terkirim (SameSite=Lax) → 401; atribut cookie sesuai TD-06 | TD-06 | P0 |
| SEC-09 | Admin API tanpa sesi | Tanpa cookie | GET/POST/PATCH/DELETE seluruh rute `/admin/**` | 401; tidak ada data/row berubah; pesan generik | TD-06 | P0 |
| SEC-10 | IDOR / salah tipe ID | Sesi admin; 1 item AI dan 1 tool | PATCH `/admin/tools/<id-AI>`; buka `/ai/<id-tool>` | 404; item tidak berubah; ID publik 24 karakter cuid2, bukan numerik | TD-07 | P0 |
| SEC-11 | SVG XSS upload | Sesi admin; SVG berisi `<script>`, `onload`, `foreignObject`, `javascript:` | Upload ke folder logo; buka hasil | Disanitasi atau 400; tidak ada script/event handler tersisa; tidak mengeksekusi JS saat dilihat | TD-14 | P0 |
| SEC-12 | File melebihi batas | Sesi admin | PNG 5 MB + 1 B; SVG 512 KB + 1 B; PDF 10 MB + 1 B; bypass validasi klien | Ditolak sebelum upload; bila dipaksa ke backend → 400; tidak ada row Media | TD-14 | P0 |
| SEC-13 | PDF palsu / format palsu | Sesi admin | PNG di-rename `.pdf`; PDF tanpa magic `%PDF-`; PDF di-rename `.png` | 400; magic bytes wajib; tidak ada metadata tersimpan | TD-14 | P0 |
| SEC-14 | Signature/upload tidak sah | Tanpa sesi; sesi valid | Minta signature tanpa sesi; periksa respons; POST metadata tanpa verifikasi | 401 tanpa sesi; signature berisi folder, `allowed_formats`, `max_file_size`, timestamp; secret tidak pernah dikirim; metadata tanpa verifikasi 400 | TD-14 | P0 |
| SEC-15 | Restore `\!` | Sesi admin; re-auth | Unggah dump berisi `\!` | 400; perintah tidak dieksekusi; DB tidak berubah | TD-13 | P0 |
| SEC-16 | Restore `COPY ... FROM PROGRAM` | Sesi admin; re-auth | Unggah dump berisi `COPY ... FROM PROGRAM` | 400; tidak ada eksekusi program; DB tidak berubah | TD-13 | P0 |
| SEC-17 | Restore `CREATE DATABASE` / `\connect` | Sesi admin; re-auth | Unggah dump berisi keduanya | 400; hanya schema `public` yang boleh disentuh; DB tidak berubah | TD-13 | P0 |
| SEC-18 | Restore `ALTER SYSTEM` / header salah | Sesi admin; re-auth | Unggah dump `ALTER SYSTEM`; file non-PostgreSQL | 400 pada keduanya; validasi header dump PostgreSQL | TD-13 | P0 |
| SEC-19 | Restore gagal di tengah transaksi | DB disposable; dump valid sampai pelanggaran constraint | Jalankan restore | `--single-transaction` rollback; DB identik dengan pra-restore; snapshot dipertahankan 24 jam; error generik | TD-13 | P0 |
| SEC-20 | Restore tanpa re-autentikasi | Sesi admin, tanpa password ulang | POST restore multipart | 401/403; tidak ada snapshot dibuat; file tidak dieksekusi | TD-13 | P0 |
| SEC-21 | Restore melebihi 100 MB | Sesi admin; re-auth | Unggah multipart >100 MB | 413; tidak ada snapshot/eksekusi; pesan mengarahkan CLI untuk file besar | TD-13 | P1 |
| SEC-22 | Translate provider 429 | Stub DeepL → 429 | Muat halaman bahasa EN | 200 dengan teks asli; tidak ada error UI; tidak ada cache/row terjemahan | TD-04 | P1 |
| SEC-23 | Translate timeout | Stub DeepL delay >5 s | Muat halaman bahasa EN | Teks asli tampil ≤6 s (timeout klien); halaman tetap dapat dipakai | TD-04 | P1 |
| SEC-24 | Batas batch translate | Sesi pengunjung | Kirim 51 teks; 5.001 karakter total; satu teks 5.001 karakter | 51 teks/5.001 karakter → 400; teks tunggal >5.000 karakter tidak diterjemahkan dan tampil asli | TD-04 | P1 |
| SEC-25 | Rate limit translate | IP tetap | 21 request dalam 1 menit | Request ke-21 → 429; UI fallback ke teks asli | TD-04 | P1 |
| SEC-26 | reCAPTCHA tidak valid | Sesi pengunjung; stub gagal | POST kontak dengan token invalid | 400; SMTP tidak menerima pesan; tidak ada retry otomatis | TD-12 | P0 |
| SEC-27 | reCAPTCHA expired/replay | Token sudah dipakai/kedaluwarsa | POST kontak ulang dengan token sama | 400; tidak ada email terkirim | TD-12 | P0 |
| SEC-28 | Spam contact rate limit | IP tetap; 3 pesan valid | Kirim pesan ke-4 dalam 1 jam | 429; tiga pesan pertama terkirim; pesan ke-4 tidak dikirim | TD-12 | P0 |
| SEC-29 | Honeypot dan time-trap | Form contact | Isi field honeypot; submit <3 detik setelah render | 400 pada keduanya; tidak ada email terkirim | TD-12 | P1 |
| SEC-30 | Double visit event | Mode StrictMode; `visitId` sama | Boot ganda + retry `POST /visits` dengan `visitId` sama | Satu row `VisitorEvent`; semua respons 204; unique constraint mencegah duplikat | TD-03 | P0 |
| SEC-31 | Bot dikecualikan | UA uji per token | Kirim `bot`, `crawler`, `spider`, `headless`, `preview`, `facebookexternalhit`, `lighthouse`; lalu `navigator.webdriver` | Semua 204 tanpa row; `webdriver` tidak mengirim request; UA normal menulis satu row | TD-03 | P0 |
| SEC-32 | Rate limit visits | IP tetap | 61 request `POST /visits` dalam 1 menit | Request ke-61 dibatasi; tidak ada row tambahan; kode 429 (lihat CL-13) | TD-03 | P2 |
| SEC-33 | Hapus media yang direferensikan | Media dipakai ≥2 item | DELETE media | 409; daftar referensi disertakan; row Media tetap | TD-09 | P0 |
| SEC-34 | Hapus media tanpa referensi | Media tidak dipakai | DELETE media; periksa stub Cloudinary | Row DB terhapus; nol panggilan Cloudinary Destroy; aset Cloudinary tetap | TD-09 | P0 |
| SEC-35 | Error tidak membocorkan internal | Berbagai input invalid | Picu 400/401/404/500 | Pesan generik + kode; tanpa stack trace, SQL, path server, env, atau secret | TD-06 | P1 |
| SEC-36 | CORS allowlist | Origin asing dan origin sah | Preflight + request ber-kredensial | Origin asing tanpa ACAO; origin sah mendapat ACAO tepat + credentials; `X-RF-Client` diizinkan | TD-06 | P0 |
| SEC-37 | Secret tidak ada di frontend | Build produksi | Pindai `dist/` untuk nama env secret | `CLOUDINARY_API_SECRET`, `SESSION_SECRET`, `DEEPL_API_KEY`, `MAIL_PASSWORD`, `RECAPTCHA_SECRET_KEY` tidak ditemukan; hanya `VITE_*` publik | TD-06, TD-12 | P0 |
| SEC-38 | Hash dan token | DB test | Periksa row Admin dan Session | Password `$argon2id$v=19$m=19456,t=2,p=1`; token sesi SHA-256 hex, bukan token cookie mentah | TD-06 | P0 |
| SEC-39 | Enumerasi username | DB bersih | Login username tidak ada vs password salah | Status, pesan, dan kelas waktu respons seragam; tidak membocorkan keberadaan username | TD-06 | P2 |

---

## Performance & Animation

### Budget

| Metrik | Budget | Kondisi | Alat ukur |
|---|---|---|---|
| LCP | ≤2,5 s | Desktop, 4G, build produksi | Lighthouse CI |
| INP | ≤200 ms | Interaksi skrip: navigasi, search, buka detail, submit form | Event Timing API + Playwright |
| CLS | ≤0,1 | Semua rute publik, muat awal | Lighthouse CI |
| Entry JS | ≤300 kB gzip | Total JS awal rute `/` | Build manifest/bundle analyzer |
| Route chunk | ≤120 kB gzip | Tiap chunk rute lazy | Build manifest/bundle analyzer |
| FPS desktop | ≥60 | Tier `full`, animasi + scroll | rAF sampling, Chrome Performance |
| FPS mobile | ≥30 | Android 2020 mid-range, tier `lite` | rAF sampling + CPU throttle 4× |
| Long task | <50 ms | Idle animation dan interaksi | PerformanceObserver `longtask` |

Catatan pengukuran: INP adalah metrik lapangan; di lab diproksikan dengan `event.duration` p95 dari interaksi skrip. Emulasi mobile (CPU throttle, `deviceMemory`) adalah proksi; validasi perangkat nyata dilakukan manual di staging.

### Kasus

| ID | Skenario | Alat | Langkah | Ambang lulus | Tier | Prio |
|---|---|---|---|---|---|---|
| PERF-01 | Web Vitals rute utama | Lighthouse CI | Ukur `/`, `/workspace`, `/ai`, `/ai/:id`, `/projects`, `/contact` desktop 4G | LCP ≤2,5 s; INP ≤200 ms; CLS ≤0,1 di semua rute | full | P0 |
| PERF-02 | Budget entry JS | Build manifest | Jumlahkan JS awal rute `/` | ≤300 kB gzip | full | P1 |
| PERF-03 | Budget route chunk | Build manifest | Periksa setiap chunk rute | ≤120 kB gzip per chunk | full | P1 |
| PERF-04 | FPS desktop | rAF sampling + trace | Rekam 10 s di kategori, detail, dan page transition | ≥60 fps; tidak ada frame drop >2 frame beruntun | full | P1 |
| PERF-05 | FPS mobile | rAF sampling + CPU throttle 4× | 390×844, `deviceMemory=4`, 10 s animasi | ≥30 fps | lite | P1 |
| PERF-06 | Long task | PerformanceObserver | 10 s idle + interaksi search/drawer | Tidak ada task >50 ms | lite + full | P1 |
| PERF-07 | Pemilihan tier | E2E emulation | Variasikan `deviceMemory`, `hardwareConcurrency`, `saveData`, `prefers-reduced-motion` | `lite` bila salah satu kondisi TD-10; selain itu `full` | lite/full | P1 |
| PERF-08 | Reduksi tier lite | E2E + inspeksi DOM/canvas | Bandingkan efek aktif pada kedua tier | Lite: particles berat/glitch berulang/blur besar/parallax pointer mati; transisi opacity/transform 150–250 ms tetap | lite | P2 |
| PERF-09 | Batas particle dan DPR | Evaluasi canvas | Hitung particle; baca DPR canvas | ≤80 (lite/mobile), ≤160 (desktop); DPR ≤1,5 | lite/full | P2 |
| PERF-10 | Satu rAF loop | Instrumentasi requestAnimationFrame | Sembunyikan tab; scroll canvas keluar viewport | Tidak ada tick saat `document.hidden` atau canvas off-screen; loop aktif lagi saat kembali | lite/full | P2 |
| PERF-11 | Delivery gambar | Inspeksi network/DOM | Cek `loading` dan URL Cloudinary per lebar viewport | Below-fold lazy; URL memuat `f_auto,q_auto,w_<size>,dpr_auto`; lebar sesuai viewport/DPR | full | P2 |
| PERF-12 | Load More dan masonry | E2E + trace | Klik Load More sampai `nextCursor=null` | AI 12→24→30; tools 12→18; websites 12→14; timeline 20→40→45; media 24→72→80; append tanpa animasi layout penuh; berhenti di null | full | P1 |

---

## SEO & Prerender

Prerender diuji pada artefak build (`dist/`) dan preview, bukan dev server. `curl` tanpa eksekusi JS; parser: `cheerio`/`linkedom` untuk HTML dan parser XML untuk sitemap.

| ID | Pemeriksaan | Alat | Target | Hasil yang diharapkan | TD | Prio |
|---|---|---|---|---|---|---|
| SEO-01 | Konten tanpa JS | `curl` + parser | Seluruh rute publik pada URL strategy + detail item | HTML berisi teks konten utama (nama, deskripsi) dan bukan shell kosong | TD-11 | P0 |
| SEO-02 | Title dan description | Parser HTML | Semua rute publik | Title unik ≤60 karakter; description ≤155; tidak ada duplikat antar-rute | TD-11 | P1 |
| SEO-03 | Open Graph/Twitter | Parser HTML | Semua rute publik | `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `twitter:card`, `twitter:title`, `twitter:image` ada dan konsisten | TD-11 | P1 |
| SEO-04 | Canonical | Parser HTML | Semua rute publik | Tepat satu `link rel=canonical` absolut, menunjuk URL sendiri | TD-11 | P1 |
| SEO-05 | Hreflang dan locale | Parser HTML | Semua rute publik | `hreflang=id` dan `en` timbal balik; `og:locale` sesuai | TD-11 | P1 |
| SEO-06 | JSON-LD | Parser + validator | Semua rute publik | Blok JSON-LD valid, dapat di-parse, berisi properti sesuai tipe yang dipilih; tidak ada JSON rusak | TD-11 | P1 |
| SEO-07 | OG image | `curl` header + inspeksi | Semua rute publik | URL Cloudinary transformasi 1200×630; status 200; `content-type: image/*` | TD-11, TD-14 | P2 |
| SEO-08 | sitemap.xml | `curl` + parser XML | Staging (rewrite Vercel), backend endpoint | XML valid; memuat seluruh rute publik statis + semua item; `lastmod` wajar; cache 1 jam | TD-11 | P1 |
| SEO-09 | robots.txt | `curl` | Staging | 200 `text/plain`; memuat referensi sitemap absolut; tidak memblokir rute publik | TD-11 | P1 |
| SEO-10 | Status 404 | `curl -I` | Rute tidak dikenal dan ID tidak dikenal | HTTP 404 (bukan 200 shell); body halaman 404 kustom | TD-11 | P2 |
| SEO-11 | Freshness Deploy Hook | Staging + log hook | Mutasi CMS; amati hook dan deployment | Hook dipanggil setelah mutasi, di-debounce 5 menit (satu build per jendela); HTML baru tersaji ≤±10 menit | TD-11 | P0 |
| SEO-12 | Build tanpa API | Build CI dengan API dimatikan | Jalankan `npm run build` | Build exit 0; rute terkait memakai shell CSR; build tidak gagal | TD-11 | P1 |
| SEO-13 | Rute baru pasca-build | Staging | Tambah item setelah build terakhir; akses URL | Shell CSR tersaji (bukan 500/404) sampai rebuild berikutnya; diterima sebagai trade-off | TD-11 | P2 |

---

## Responsive & Browser

### Matriks

| Kelas | Viewport | Fokus |
|---|---|---|
| Mobile kecil | 360×800, 390×844 | Drawer, masonry 1 kolom, form admin, tabel |
| Tablet | 768×1024 | Sidebar/drawer, masonry 2 kolom |
| Laptop | 1024×768, 1280×800 | Sidebar collapse, grid |
| Desktop | 1440×900, 1920×1080 | Layout asimetris, header kategori, tabel admin |

Browser: Chrome (desktop), Edge (desktop), Firefox (desktop), Safari iOS (iPhone nyata). Chromium/WebKit Playwright menjadi proksi otomatis; Safari iOS nyata wajib untuk swipe, autoplay, cookie ITP.

| ID | Skenario | Matriks | Alat | Hasil yang diharapkan | Prio |
|---|---|---|---|---|---|
| RESP-01 | Smoke publik | 7 viewport | Playwright | Tidak ada horizontal scroll; navigasi terjangkau; konten tidak terpotong | P0 |
| RESP-02 | Smoke admin | 7 viewport | Playwright | Form dan aksi utama terjangkau; tidak ada dialog keluar layar | P0 |
| RESP-03 | Drawer dan swipe | 360, 390 | Playwright + iPhone | Drawer + backdrop; tutup via X/backdrop; swipe kiri menutup di iOS | P1 |
| RESP-04 | Sidebar collapse | ≥1024 | Playwright | Hide/show berfungsi; floating button tetap terlihat; di <1024 menjadi drawer | P1 |
| RESP-05 | Masonry reflow | 7 viewport | Playwright + screenshot | Tidak ada kartu tumpang tindih/terpotong; reflow setelah Load More tanpa layout penuh | P1 |
| RESP-06 | Tabel admin mobile | 360, 390, 768 | Playwright + manual | Tabel dapat digeser/terbaca; aksi baris terjangkau; tidak menutupi navigasi | P1 |
| RESP-07 | Cross-browser alur kritis | Chrome, Edge, Firefox, Safari iOS | Manual + Playwright | Login, CMS, search, detail, contact, audio fallback berperilaku sama | P1 |

---

## Accessibility

Target: WCAG 2.2 AA dasar. Uji otomatis dengan axe tidak menggantikan uji keyboard dan screen reader.

| ID | Kriteria | Target | Alat | Hasil yang diharapkan | Prio |
|---|---|---|---|---|---|
| A11Y-01 | Keyboard publik | Welcome → workspace → sidebar → search → detail → contact | Playwright keyboard + manual | Seluruh alur selesai tanpa mouse; urutan fokus logis | P0 |
| A11Y-02 | Keyboard admin | Login → CRUD → media → backup/restore | Playwright keyboard + manual | Seluruh alur selesai tanpa mouse; dialog dapat dikonfirmasi/dibatalkan | P0 |
| A11Y-03 | Focus visible | Semua kontrol interaktif, 5 tema | Inspeksi visual + screenshot | Indikator fokus terlihat jelas, tidak tertutup glow/animasi | P1 |
| A11Y-04 | Focus trap drawer | Drawer mobile | Keyboard + manual | Fokus terperangkap selama drawer terbuka; Esc menutup; fokus kembali ke pemicu | P1 |
| A11Y-05 | Focus trap search | Search overlay | Keyboard + manual | Fokus terperangkap; Esc menutup; panah/Enter bekerja; fokus kembali | P1 |
| A11Y-06 | Label dan error form | Contact, login, seluruh form CMS | axe + manual | Setiap input berlabel; required diumumkan; error terhubung ke field | P1 |
| A11Y-07 | Kontras | Teks dan komponen UI, 5 tema | axe + color picker | Teks normal ≥4,5:1; teks besar/komponen ≥3:1; tetap terpenuhi di atas background animasi | P1 |
| A11Y-08 | Alt media | Logo, media library, gambar konten | axe + manual | Media informatif punya alt; dekoratif diabaikan; fallback ikon tidak menjadi noise | P1 |
| A11Y-09 | Reduced motion | Tier `lite` | Emulasi `prefers-reduced-motion` | Efek berat direduksi, bukan dihapus total; tidak ada informasi hilang; transisi tetap 150–250 ms | P1 |
| A11Y-10 | Struktur semantik | Semua halaman | axe + manual | Satu `h1` per halaman; heading berurutan; landmark nav/main/footer; bahasa halaman benar | P2 |
| A11Y-11 | Audit otomatis | Rute publik + admin utama | axe-core | 0 pelanggaran critical/serious; pelanggaran moderate dicatat dan dinilai | P1 |

---

## Backup & Restore Drill

> **Bahaya:** restore bersifat full replace. Drill hanya dijalankan pada database staging disposable atau container lokal. Jangan pernah menunjuk `DATABASE_URL` produksi. Restore menghentikan layanan sementara (TD-13).

### Prosedur End-to-End

1. Siapkan database bersih; `npx prisma migrate deploy`; seed baseline (18 tabel: Admin, Session, Profile, CollectionItem, Category, Subcategory, ItemLink, Project, SocialMedia, LearningField, Device, TimelineEntry, Media, MediaFolder, Resume, VisitorEvent, SiteConfiguration, ContactConfiguration).
2. Catat `SELECT count(*)` tiap tabel dan versi migrasi terakhir; simpan sebagai baseline.
3. Login admin; `POST /api/v1/admin/backup`; unduh dan simpan `rf-backup-YYYYMMDD-HHmm.sql`; verifikasi nama, ukuran, dan isi.
4. Ubah data: create 3 item, update 2 item, delete 1 item, tambah 5 VisitorEvent; catat count baru (harus berbeda dari baseline).
5. Re-autentikasi password admin; `POST /api/v1/admin/restore` multipart dengan file backup.
6. Verifikasi snapshot `/tmp/pre-restore-<ts>.sql` dibuat **sebelum** eksekusi `psql`; setelah sukses snapshot dihapus.
7. Verifikasi `SELECT count(*)` seluruh tabel kembali ke baseline; `npx prisma migrate status` melaporkan up to date; aplikasi boot; smoke publik + admin.
8. Jalankan skenario gagal: file rusak, verifikasi pasca-commit gagal, snapshot gagal, file >100 MB. Pastikan auto-rollback dan retensi snapshot sesuai TD-13.

### Kasus

| ID | Skenario | Langkah | Hasil yang diharapkan | TD | Prio |
|---|---|---|---|---|---|
| BAK-01 | Baseline dan backup | Seed; catat count; unduh backup | File `.sql` valid; memuat seluruh schema + data; ≤100 MB | TD-13 | P0 |
| BAK-02 | Mutasi setelah backup | Ubah data sesuai prosedur langkah 4 | Count berubah; backup lama tetap merepresentasikan baseline | TD-13 | P0 |
| BAK-03 | Restore sukses | Restore file baseline; bandingkan count | Seluruh 18 tabel kembali ke baseline; tidak ada data mutasi tersisa | TD-13 | P0 |
| BAK-04 | Status migrasi | `npx prisma migrate status` setelah restore | Up to date; `_prisma_migrations` versi terakhir cocok dengan binary | TD-13 | P0 |
| BAK-05 | Snapshot wajib | Instrumentasi filesystem; restore sukses | Snapshot dibuat sebelum `psql`; dihapus setelah sukses | TD-13 | P0 |
| BAK-06 | File rusak/terpotong | Restore dump truncate | Transaksi rollback; DB identik pra-restore; snapshot dipertahankan 24 jam; error 500 generik | TD-13 | P0 |
| BAK-07 | Verifikasi pasca-commit gagal | Restore dump tanpa `_prisma_migrations` | Verifikasi gagal → auto-restore snapshot; DB kembali pra-restore; 500; snapshot dipertahankan | TD-13 | P0 |
| BAK-08 | Snapshot gagal | Buat `/tmp` tidak dapat ditulis | Restore dibatalkan sebelum `psql`; DB tidak berubah; error jelas | TD-13 | P0 |
| BAK-09 | Batas ukuran | File 80 MB, 90 MB, 100 MB, 100 MB + 1 B | ≤100 MB diproses; >100 MB ditolak 413 tanpa eksekusi; 80–100 MB mengikuti CL-04 | TD-13 | P1 |
| BAK-10 | Auto-rollback penuh | Setelah BAK-06/07, jalankan smoke publik + admin | Aplikasi berfungsi; count = pra-restore; tidak ada partial restore | TD-13 | P0 |
| BAK-11 | Timeout 4 menit | Staging; dump besar mendekati batas | Request selesai ≤4 menit atau gagal dengan pesan yang mengarahkan `npm run restore -- <file.sql>`; tidak ada state setengah jadi | TD-13 | P1 |

---

## Exit Criteria & Severity

### Definisi Lulus per Fase

| Fase | Cakupan wajib | Kriteria lulus |
|---|---|---|
| Phase 1 — Foundation | Auth, API foundation, Prisma, integrasi frontend-backend | 100% P0 auth/security lulus (RF-017, RF-018; SEC-01 s/d 10, 38); migrasi bersih; 0 blocker/critical; custom domain same-site tersedia untuk uji sesi |
| Phase 2 — Admin CMS | CRUD, kategori, media, profile, CV | RF-013 s/d 017, RF-026 lulus; SEC-11 s/d 14, 33, 34 lulus; TD-09/TD-14 terverifikasi; 0 blocker; tidak ada major terbuka |
| Phase 3 — Public Website | Welcome, workspace, sidebar, koleksi, halaman statis | RF-001 s/d 012, RF-014, RF-023, RF-024, RF-029 lulus; smoke responsif 7 viewport lulus; keyboard publik lulus; sign-off visual desktop + mobile |
| Phase 4 — Interaction | Search, detail navigation, tema, bahasa, audio, transisi | RF-019 s/d 022 lulus; PERF-04 s/d 08, 12 lulus pada tier `lite` dan `full`; fallback translasi/audio lulus; 60/30 fps terpenuhi |
| Phase 5 — Infrastructure | Visitor, presence, contact, backup/restore, SEO, performance | RF-025, RF-027, RF-028, RF-030 lulus; seluruh SEC, SEO, PERF, BAK lulus; Lighthouse dan restore drill staging lulus; 0 blocker/critical |
| Phase 6 — Testing & Production | Regresi penuh, cross-browser, staging, go-live | Seluruh P0/P1 dieksekusi; cross-browser dan Safari iOS lulus; tidak ada blocker/critical; checklist go-live terpenuhi |

### Tingkat Defect

| Tingkat | Definisi | Contoh | Aturan rilis |
|---|---|---|---|
| Blocker | Kehilangan data, bypass auth, kebocoran secret, situs mati, restore merusak DB | CSRF berhasil; cookie dapat dibaca JS; `\!` tereksekusi | Wajib nol |
| Critical | Alur inti gagal tanpa workaround; keamanan serius | Login tidak persisten di domain wajib; CMS tidak menyimpan; SVG XSS | Wajib nol |
| Major | Fitur utama terganggu tetapi ada workaround; aksesibilitas serius; satu viewport rusak | Drawer tidak dapat ditutup di satu browser; tabel admin tidak terbaca di 360 px | Boleh rilis hanya dengan workaround terdokumentasi + sign-off pemilik |
| Minor | Kosmetik, copy, jitter animasi, ketidakrapian non-blokir | Glitch terlalu cepat; hover tidak konsisten | Boleh masuk backlog |

Severity tidak ditentukan oleh jumlah RF yang terdampak, tetapi oleh dampak keamanan, data, dan alur inti.

### Syarat Production Go-Live

| # | Syarat | Bukti |
|---|---|---|
| 1 | 0 blocker, 0 critical; seluruh P0 dieksekusi 100% dan lulus | Laporan test run |
| 2 | Seluruh P1 lulus; major tersisa hanya dengan workaround + sign-off | Daftar defect |
| 3 | 7 OWNER ACTION selesai: domain, DeepL, Resend, Cloudinary, Railway, reCAPTCHA, Deploy Hook | Konfigurasi staging/production |
| 4 | Cookie persisten terbukti pada `rf.<domain>` + `api.rf.<domain>` di Safari iOS nyata | TC-018-01, SEC-08 |
| 5 | Restore drill staging dalam 7 hari terakhir lulus, termasuk auto-rollback | BAK-01 s/d 11 |
| 6 | Lighthouse CI lulus budget pada build produksi staging | Laporan Lighthouse |
| 7 | Prerender + metadata + sitemap + 404 diverifikasi di staging | SEO-01 s/d 13 |
| 8 | Kontak nyata terkirim dan diterima `ADMIN_EMAIL`; reCAPTCHA aktif | TC-025-01, SEC-26 |
| 9 | Smoke publik + admin setelah deploy production | Checklist manual |

---

## CI Pipeline

Urutan job bersifat serial untuk gate merge. E2E dan integration memakai PostgreSQL 16 service container; seluruh layanan eksternal di-stub kecuali job staging.

| # | Job | Perintah | Depends on | Waktu target | Memblokir merge |
|---|---|---|---|---|---|
| 1 | Lint | `npm run lint` | — | ≤5 menit | Ya |
| 2 | Typecheck | `npm run typecheck` (frontend + backend) | 1 | ≤5 menit | Ya |
| 3 | Unit | `npm run test:unit -- --coverage` | 2 | ≤10 menit | Ya |
| 4 | Build | `npm run build` (frontend + prerender dengan fixture API) dan build backend | 3 | ≤15 menit | Ya |
| 5 | Integration | `npx prisma migrate deploy`, seed, `npm run test:integration` | 4 | ≤20 menit | Ya |
| 6 | E2E | `npx playwright test` (Chromium + WebKit; shard; mutasi serial) | 5 | ≤30 menit | Ya untuk suite P0/P1 |
| 7 | Lighthouse CI | `npx lhci autorun` pada preview build + stub API | 6 | ≤15 menit | Ya untuk rute dan budget P0 |
| 8 | Artefak | Unggah `coverage/`, `playwright-report/`, `test-results/`, `.lighthouseci/`, `dist/`, bundle stats | 7 | ≤3 menit | Tidak |

### Gate dan Jadwal

| Pipeline | Isi | Gate |
|---|---|---|
| Pull request | Job 1–7 | Lint, typecheck, unit, build, integration, E2E P0/P1, Lighthouse budget harus hijau |
| Main | Job 1–8 + regresi penuh | Semua gate PR + artefak tersimpan |
| Nightly | Full E2E lintas browser, backup drill, staging smoke, SEO freshness | Kegagalan membuat build berikutnya tidak dapat dirilis sampai diperbaiki |
| Release | Build produksi, migrasi, smoke staging, promo production | Checklist go-live |

Aturan flaky: retry maksimum 1 kali untuk E2E; P0 tidak boleh lulus karena retry. Tes yang di-quarantine wajib punya issue dan tidak boleh P0.

---

## Manual QA Checklist

Item di bawah tidak dapat dinilai andal oleh otomasi: estetika motion, fallback autoplay pada browser nyata, swipe, dan pembacaan visual. Jalankan pada build produksi staging, desktop 1440 + iPhone nyata.

### Halaman Publik

| Halaman | Item manual | Lulus bila |
|---|---|---|
| Welcome | Glitch logo, digital distortion, ambient background, statistik, counter | Animasi mulus tanpa patah; teks terbaca; transisi 5 detik terasa wajar; tidak ada layout shift |
| Workspace | Komposisi panel, breadcrumb, jam, status indicator | Panel tidak tumpang tindih; jam/status tampil benar; navigasi jelas |
| AI (list + detail) | Header kategori, masonry, hover, transisi detail, Previous/Next | Pola header khas; kartu tidak terpotong; hover halus; transisi tidak berkedip |
| Tools (list + detail) | Sama seperti AI, kategori custom | Header dan pola berbeda dari AI; kategori custom tampil benar |
| Websites (list + detail) | Sama, kategori sepenuhnya CMS | Header khas; kategori hasil CMS tampil tanpa hardcode |
| Social Media | Ikon, username, link keluar | Logo tajam; link membuka profil yang benar; tidak ada ikon rusak |
| Projects | Kartu, primary link, masonry | Satu link utama per kartu; kartu tidak terpotong |
| Tech Stack | Kelompok, ikon, keterbacaan | Tidak ada ikon pecah; teks tidak overflow |
| Learning Journey | Kelompok bidang, logo, tanpa progres | Hanya logo + nama; tidak ada persentase/level yang bocor |
| Setup & Devices | Spesifikasi panjang | Teks panjang wrap rapi; tidak ada scroll horizontal |
| Timeline | Urutan, tipografi, Load More | Kronologi terbaca; append tidak melompat |
| Statistics | Angka, animasi counter | Angka benar; animasi tidak mengubah tata letak |
| About Me | Bio, interests, goals, foto | Teks terjemahan tidak terpotong; gambar tajam |
| Contact | reCAPTCHA, error, sukses, honeypot tak terlihat | Widget tampil; error jelas; sukses tanpa menyimpan pesan |
| Privacy Policy | Keterbacaan, bahasa | Tidak ada placeholder; bahasa konsisten |
| 404 | Kustom, navigasi kembali | Tampil kustom; status 404; jalan kembali jelas |

### Halaman Admin

| Halaman | Item manual | Lulus bila |
|---|---|---|
| Overview | Chart, quick actions, ringkasan konten | Chart render; angka konsisten; quick action membuka halaman benar |
| AI Management | Form, editor, konfirmasi hapus, pencarian, sort | Form valid; dialog konfirmasi jelas; list konsisten |
| Tools Management | Sama + kategori/subkategori custom | Kategori custom dapat dikelola tanpa error |
| Websites Management | Sama + kategori penuh | Kategori dapat create/edit/delete |
| Social Media Management | Logo, username, link | Validasi URL; ikon pratinjau benar |
| Projects Management | Kartu, primary link | Hanya satu primary link; pratinjau sesuai |
| Learning Journey | Bidang + logo | Tidak ada field progres/level |
| Setup & Devices | Spesifikasi panjang | Input panjang tidak merusak layout |
| Timeline | Date, title, category, description | Tanggal tersimpan benar; tanpa upload gambar |
| Media Library | Folder, grid, info, reuse, hapus | File lama dapat dipakai ulang; 409 tampil informatif; tidak ada tombol hapus Cloudinary |
| Profile Management | Bio, interests, goals | Perubahan tampil di publik setelah simpan |
| CV Management | Upload PDF, ganti, unduh | File lama tergantikan; unduh benar |
| Visitor Statistics | Total kunjungan, penanda owner | Angka cocok dengan data; owner terhitung dan ditandai |
| Email Configuration | Konfigurasi pengirim/tujuan, validasi input | Tersimpan; error validasi jelas; tidak ada secret yang tampil di UI |
| Backup & Restore | Unduh, unggah, re-auth, error | Nama file benar; re-auth wajib; error rollback terbaca |
| Authentication Settings | Ganti username/password | Tersimpan; validasi jelas; sesi lain logout setelah password berubah |
| Configuration Pages | Lokasi owner, presence, konfigurasi situs | Perubahan tersimpan; validasi jelas; label kota tidak membocorkan koordinat |

### Lintas Halaman (Tidak Terotomasi)

| Item | Cara cek | Lulus bila |
|---|---|---|
| Glitch dan ambient motion | Rekam layar 30 detik, tier `full` | Tidak ada tearing/flicker; intensitas wajar; tidak mengganggu teks |
| Autoplay fallback | Safari iOS dan Chrome dengan autoplay diblokir | `Play Music` muncul; sekali klik memutar; masuk workspace tetap mungkin |
| Swipe drawer | iPhone nyata, dari tepi kiri | Mengikuti jari; menutup tanpa membuka navigasi lain |
| Masonry dan reflow | Desktop + mobile, setelah Load More | Tidak ada kartu bertumpuk; reflow halus |
| SFX dan master mute | Interaksi hover/klik/navigasi | SFX konsisten; master mute mematikan musik + SFX |
| Tema | Kelima tema, 3 halaman | Palet konsisten; kontras tetap terbaca; tidak ada warna aksen luar palet |
| Reduced motion | macOS/iOS reduced motion aktif | Efek berat berkurang; konten dan alur tetap utuh |

---

## Asumsi & Butir Klarifikasi

Butir berikut belum ditetapkan blueprint/TD atau tidak dapat diuji deterministik tanpa keputusan tambahan. Tidak ada kasus yang bergantung pada butir ini yang boleh menjadi gate produksi sebelum diselesaikan.

| ID | Butir | Dampak | Usulan default |
|---|---|---|---|
| CL-01 | `docs/api-spec.md` belum tersedia; kode status dan bentuk respons belum mengikat | Suite integration dan expected result SEC | Bekukan API spec sebelum Phase 1 selesai |
| CL-02 | Social Media tidak ada di URL strategy, hanya di sitemap dan CMS | Rute publik yang diuji untuk RF-013/SEO | Tegaskan apakah tampil di `/workspace` atau halaman sendiri |
| CL-03 | TD-06 menyebut `X-RF-Client` untuk “semua non-GET”; `sendBeacon` pada `/visits` tidak dapat mengirim header kustom | SEC-06/07 dan perilaku pengunjung | Terapkan header pada rute admin ber-sesi; endpoint publik tanpa cookie cukup Origin allowlist + rate limit |
| CL-04 | Perilaku restore 80–100 MB: diterima dengan arahan CLI atau ditolak | BAK-09 | <80 MB normal; 80–100 MB terima + arahan CLI; >100 MB 413 |
| CL-05 | Tipe dan properti JSON-LD tidak ditentukan | SEO-06 | Tetapkan tipe per halaman (mis. Person/WebSite) sebelum Phase 5 |
| CL-06 | Overview menyebut “incoming message information” padahal pesan tidak disimpan | Cakupan admin Overview | Hapus dari UI atau definisikan sumber data |
| CL-07 | Nama lima tema dan daftar track musik tidak ditentukan | TC-019/021 | Uji jumlah dan perilaku; nama menyusul |
| CL-08 | Welcome “maksimum 5 detik” vs tepat 5 detik | TC-002-01 | Uji batas atas 5,5 detik |
| CL-09 | Ketersediaan custom domain staging, kredensial Cloudinary/Resend/DeepL/reCAPTCHA | RF-018, RF-025, RF-020 | Selesaikan OWNER ACTION sebelum Phase 5 |
| CL-10 | Playwright WebKit bukan Safari/ITP nyata | TC-018-01, SEC-08 | Wajib uji iPhone Safari nyata di staging |
| CL-11 | Restore drill bersifat destruktif | BAK dan SEC-15 s/d 21 | Sediakan database staging disposable khusus drill |
| CL-12 | TD-03 menyebut rate limit in-memory; TD-04/06 tidak menetapkan media penyimpanan; Railway dapat menjalankan >1 instance | SEC-01/25/28/32 | Konfirmasi single instance atau pindahkan ke penyimpanan bersama |
| CL-13 | TD-03 menyebut respons 204 idempoten sekaligus rate limit 60/menit; status saat limit tidak eksplisit | SEC-32 | Tetapkan 429 untuk request ke-61 |
| CL-14 | `MAIL_FROM` wajib domain terverifikasi (SPF/DKIM) | TC-025-01 di staging | Verifikasi domain sebelum uji email nyata |
| CL-15 | Blueprint hanya mencantumkan POST untuk tools/websites/social/projects/timeline; PATCH/DELETE tidak dirinci, padahal CMS menuntut CRUD | TC-013-01, SEC-10 | Definisikan `PATCH/DELETE /api/v1/admin/<collection>/:id` di API spec |

### Ringkasan Cakupan

| Kelompok | Jumlah kasus |
|---|---|
| Traceability RF-001 s/d RF-030 | 49 |
| Unit | 8 |
| Negative & Security | 39 |
| Performance & Animation | 12 |
| SEO & Prerender | 13 |
| Responsive & Browser | 7 |
| Accessibility | 11 |
| Backup & Restore Drill | 11 |
| **Total** | **150** |

Checklist manual per halaman tidak dihitung sebagai kasus otomatis; itemnya menjadi syarat sign-off QA.

