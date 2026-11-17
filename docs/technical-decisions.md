# Technical Decision Register — RF Personal Tech Dashboard

**Versi:** 1.0  
**Tanggal:** 2026-11-14  
**Acuan:** Blueprint v1.0, Bagian 17  
**Status:** Semua TD diputuskan. Butir yang memerlukan tindakan pemilik ditandai **OWNER ACTION**.

Keputusan di bawah bersifat mengikat untuk implementasi. Perubahan hanya melalui revisi dokumen ini.

---

## Ringkasan Keputusan

| ID | Topik | Keputusan | Status |
|---|---|---|---|
| TD-01 | Lokasi owner | Manual + auto maks 1×/24 jam; publik hanya label kota; kedaluwarsa 30 hari | Final |
| TD-02 | Owner presence | Heartbeat 60 dtk (visible) / 5 mnt (hidden); offline setelah 180 dtk | Final |
| TD-03 | Visitor event | Satu event per full page load; idempotency key; bot dikecualikan; tanpa IP | Final |
| TD-04 | Provider terjemahan | DeepL API Free via proxy backend; timeout 5 dtk; tanpa cache | Final |
| TD-05 | Cakupan mute | Master mute = musik + SFX | Final |
| TD-06 | Sesi admin | Cookie HttpOnly 30 hari sliding, cap absolut 90 hari, rotasi, Argon2id | Final |
| TD-07 | Jenis ID publik | cuid2 (24 karakter), dibangkitkan di application layer | Final |
| TD-08 | Load More | 12 + 12 (koleksi), 20 + 20 (timeline), 24 + 48 (media) | Final |
| TD-09 | Orphan media | Hapus media = DB saja; Cloudinary tidak pernah dihapus oleh aplikasi | Final |
| TD-10 | Optimasi animasi | Dua tier: full / lite, dipilih saat boot; target 60 fps / ≥30 fps | Final |
| TD-11 | Rendering SEO | SSR prerender saat build + Vercel Deploy Hook (debounce 5 mnt) | Final |
| TD-12 | Email provider | Nodemailer SMTP; default Resend; reCAPTCHA v2 checkbox | Final |
| TD-13 | Backup & restore | pg_dump/psql di container; single transaction; snapshot wajib; verifikasi + auto-rollback | Final |
| TD-14 | Upload limit | Raster 5 MB, SVG 512 KB (disanitasi), PDF 10 MB | Final |
| TD-15 | Cakupan terjemahan | Field konten tertentu + nama kategori; bukan URL/username/spesifikasi | Final |

---

## TD-01 — Akurasi dan Frekuensi Lokasi

**Keputusan**

1. Sumber: browser Geolocation API, hanya dari sesi admin.
2. Pemicu: tombol manual "Perbarui lokasi" + otomatis maksimum 1×/24 jam saat Admin Dashboard dibuka.
3. Parameter: `enableHighAccuracy: false`, `timeout: 10000`, `maximumAge: 300000`.
4. Penyimpanan: `ownerLat`, `ownerLng` (dibulatkan 3 desimal, ±110 m), `ownerLocationLabel`, `ownerLocationUpdatedAt` pada `SiteConfiguration`.
5. Publik menerima **hanya** `ownerLocationLabel` + `ownerLocationUpdatedAt`. Koordinat tidak pernah masuk response publik.
6. Label dihasilkan reverse geocode Nominatim (1 req/detik, User-Agent `rf-dashboard/1.0`), di-cache 7 hari.
7. Umur data: > 30 hari → label disembunyikan, tampil `Location unavailable`.
8. Tidak ada pelacakan latar belakang, tidak ada lokasi pengunjung, tidak ada penyimpanan riwayat lokasi.

**Alasan**
Frekuensi rendah menghindari pelacakan berkelanjutan dan menghemat kuota Nominatim. Label kota memenuhi kebutuhan tampilan tanpa membocorkan alamat.

**Konsekuensi**
Peta (jika ditambahkan) memakai pusat kota, zoom 10. Akurasi tinggi tidak tersedia.

---

## TD-02 — Owner Heartbeat dan Offline Timeout

**Keputusan**

1. Endpoint tulis: `POST /api/v1/admin/presence/heartbeat` — memerlukan sesi admin valid.
2. Interval: 60 detik saat tab visible; 5 menit saat `document.hidden`.
3. Offline: tidak ada heartbeat selama 180 detik.
4. Penyimpanan: `ownerLastSeenAt` pada `SiteConfiguration`.
5. Endpoint publik: `GET /api/v1/presence` → `{ status: "ONLINE" | "OFFLINE", lastSeenAt }`, cache 30 detik.
6. Pengunjung tidak memiliki endpoint tulis presence. Tidak ada presence pengunjung.
7. Pemilik yang membuka situs publik dengan sesi admin aktif tetap mengirim heartbeat. Sesuai §11.2.

**Alasan**
Cookie admin adalah satu-satunya pembeda owner vs visitor. Tidak perlu mekanisme tambahan.

**Konsekuensi**
Logout atau sesi kedaluwarsa langsung memutus heartbeat → OFFLINE dalam ≤ 180 detik.

---

## TD-03 — Definisi Satu Visitor Event

**Keputusan**

1. Satu event = satu **full page load** aplikasi. Route change tidak dihitung.
2. Refresh dihitung. Tab baru dihitung. Kunjungan ulang dihitung.
3. Idempotency: `visitId` (UUID) dibuat di memori saat boot, dikirim ke `POST /api/v1/visits`, kolom `visitId` `@unique`.
4. Transport: `navigator.sendBeacon`, fallback `fetch(..., { keepalive: true })`. Dikirim 1 detik setelah boot.
5. React Strict Mode dan retry jaringan tidak menggandakan event karena unique constraint.
6. Bot dikecualikan: UA cocok regex `bot|crawler|spider|headless|preview|facebookexternalhit|lighthouse` → 204 tanpa menulis. `navigator.webdriver` → tidak mengirim.
7. Tidak menyimpan IP, geolocation, atau UA penuh. Disimpan: `visitId`, `createdAt`, `isOwner`, `entryPath`, `referrerHost`.
8. Admin dihitung dan ditandai `isOwner = true`; total publik mencakup admin.
9. Rate limit endpoint: 60 req/menit per IP (in-memory), respons 204 idempoten.

**Alasan**
Unique `visitId` menyelesaikan masalah double-send tanpa fingerprinting. Menolak penyimpanan IP menjaga privasi dan menyederhanakan kepatuhan.

**Konsekuensi**
Crawler tanpa JS tidak terhitung (sisi baik: mengurangi noise). Statistik adalah page load, bukan unique visitor.

---

## TD-04 — Provider Terjemahan Gratis

**Keputusan**

1. Provider: **DeepL API Free** (`DEEPL_API_KEY`, `DEEPL_API_URL=https://api-free.deepl.com/v2/translate`).
2. Arsitektur: proxy backend `POST /api/v1/translate` → `{ targetLang: "id" | "en", texts: string[] }`.
3. Batas per request: ≤ 50 teks dan ≤ 5.000 karakter total.
4. Teks > 5.000 karakter tidak diterjemahkan; tampil asli.
5. Timeout server 5 detik; timeout klien 6 detik. Gagal/timeout/429 → tampil teks asli.
6. **Tanpa cache** sesuai blueprint. Hanya in-flight request coalescing (request identik yang bersamaan digabung, tidak disimpan).
7. Rate limit endpoint: 20 req/menit per IP.
8. Kuota 500.000 karakter/bulan. Bila habis → 429 → fallback teks asli.
9. Fallback provider (belum diimplementasikan): LibreTranslate self-hosted di Railway.

**Alasan**
DeepL memberi kualitas terbaik untuk pasangan ID↔EN pada volume gratis. Fallback ke teks asli menjamin kegagalan provider tidak memblokir halaman.

**Konsekuensi**
Biaya nol selama kuota cukup. Tidak ada kontrol atas uptime provider. Butuh **OWNER ACTION**: buat akun DeepL API Free.

---

## TD-05 — Cakupan Tombol Mute

**Keputusan**

1. Satu tombol master mute di sidebar mengontrol **musik dan SFX**.
2. State mute dan volume musik dipersist di `localStorage`.
3. Sound effect memakai volume tetap `0.35`, tidak dapat diatur terpisah.
4. Player musik memiliki play/pause dan volume sendiri. Menekan Play saat master mute aktif mematikan mute secara otomatis (dengan feedback visual).
5. Autoplay gagal → tombol `Play Music` muncul. Audio tidak pernah memblokir masuk Workspace.

**Alasan**
Dua kontrol mute bersamaan membingungkan. Master mute sesuai §4.8 dan menutup catatan bahwa cakupan SFX belum ditentukan.

---

## TD-06 — Durasi dan Rotasi Sesi Admin

**Keputusan**

1. Cookie: `rf_sess`, `HttpOnly`, `Secure` (production), `SameSite=Lax`, `Path=/`, `Max-Age` 30 hari.
2. Sliding expiry 30 hari, diperbarui maksimum 1×/jam per request.
3. Batas absolut 90 hari sejak login → wajib login ulang.
4. Rotasi session ID: saat login, saat perpanjangan expiry, saat kredensial berubah. Sesi lama langsung di-revoke.
5. Logout menghapus row `Session` dan cookie. Ganti password me-revoke semua sesi lain.
6. Token cookie: 32 byte acak; DB menyimpan SHA-256(token).
7. Password: **Argon2id** (m = 19 MiB, t = 2, p = 1).
8. Login rate limit: 5 gagal/15 menit per IP → 429 dengan delay progresif; 10 gagal → lockout akun 15 menit.
9. CSRF: validasi `Origin`/`Referer` terhadap allowlist + header wajib `X-RF-Client: web` untuk semua non-GET. `SameSite=Lax` sebagai lapis kedua.

**Prasyarat wajib — OWNER ACTION**

Cookie persisten tidak berfungsi pada kombinasi `*.vercel.app` + `*.railway.app`: cookie dianggap third-party dan diblokir Safari (ITP) serta Chrome. Deploy wajib memakai custom domain dengan pola:

```text
rf.<domain>        → Vercel (frontend)
api.rf.<domain>    → Railway (backend)
```

Kedua host berada pada registrable domain yang sama sehingga `SameSite=Lax` berfungsi. Tanpa ini, RF-018 tidak dapat dipenuhi.

**Konsekuensi**
`FRONTEND_ORIGIN` = `https://rf.<domain>`. Tidak ada refresh token terpisah; sesi tunggal dengan rotasi.

---

## TD-07 — Jenis ID Publik

**Keputusan**

1. Semua primary key dan ID URL memakai **cuid2**, 24 karakter, dibangkitkan di application layer (`@paralleldrive/cuid2`), bukan default database.
2. URL: `/ai/<cuid2>`, `/tools/<cuid2>`, `/websites/<cuid2>`. Tanpa slug.
3. Urutan A–Z: `ORDER BY lower(name) ASC, id ASC`.
4. Tidak ada endpoint lookup berdasarkan ID numerik.

**Alasan**
Tidak dapat dienumerasi, URL-safe, tidak memerlukan migrasi tipe saat backup/restore.

**Konsekuensi**
Panjang URL tetap. Index tidak berurutan secara waktu — tidak relevan pada skala ini.

---

## TD-08 — Load More

**Keputusan**

| Konteks | Awal | Tambahan |
|---|---|---|
| Koleksi AI / Tools / Websites | 12 | +12 |
| Projects | 12 | +12 |
| Timeline | 20 | +20 |
| Media Library (admin) | 24 | +48 |
| Search | maks 5 per grup, 20 total | tanpa load more |

1. API memakai cursor pagination `?limit=&cursor=`.
2. Masonry me-reflow setelah append tanpa animasi layout penuh.
3. Load More berhenti saat `nextCursor = null`.

---

## TD-09 — Kebijakan Orphan Media Cloudinary

**Keputusan**

1. Menghapus item CMS **tidak** menghapus file Cloudinary maupun metadata Media.
2. Menghapus Media yang masih direferensikan item → `409 Conflict`, daftar referensi disertakan.
3. Menghapus Media yang tidak direferensikan → hapus row DB saja. Aset Cloudinary dipertahankan.
4. Aplikasi tidak pernah memanggil Cloudinary Destroy API.
5. Tidak ada orphan scanner di v1. Pembersihan manual melalui Cloudinary Console.
6. `publicId` disimpan agar penelusuran manual memungkinkan.

**Alasan**
Blueprint melarang Activity Log dan menghindari kehilangan aset permanen akibat salah hapus.

**Konsekuensi**
Konsumsi storage Cloudinary dapat tumbuh. Pemilik bertanggung jawab membersihkan secara berkala.

---

## TD-10 — Optimasi Animasi untuk Perangkat Terbatas

**Keputusan**

1. Tier ditentukan saat boot:
   - `lite` jika `navigator.deviceMemory <= 4` **atau** `hardwareConcurrency <= 4` **atau** `saveData` **atau** `prefers-reduced-motion: reduce`.
   - selain itu `full`.
2. `lite`: matikan particles berat, glitch berulang, blur besar, dan parallax pointer. Sisakan transisi opacity/transform 150–250 ms.
3. `full`: seluruh efek aktif. DPR canvas dibatasi 1.5.
4. Satu rAF loop global; pause saat `document.hidden` atau canvas di luar viewport.
5. Jumlah particle: maksimum 80 (lite/mobile) dan 160 (desktop), diskalakan terhadap luas viewport.
6. GSAP memakai `gsap.matchMedia()`; `ScrollTrigger` dengan `fastScrollEnd`; `will-change` hanya selama animasi berlangsung.
7. Target performa: 60 fps desktop, ≥ 30 fps mobile kelas menengah (Android 2020), long task < 50 ms.
8. Sesuai blueprint, animasi tidak dimatikan total pada reduce motion — hanya direduksi.

---

## TD-11 — Strategi Rendering SEO (React + Vite)

**Keputusan**

1. **SSR prerender saat build**: `src/entry-server.tsx` + skrip `prerender` yang mengekstrak seluruh rute publik (statis + semua item) dari API, lalu menulis `dist/<route>/index.html` berisi HTML, meta, dan JSON-LD.
2. API tidak tersedia saat build → rute tersebut jatuh ke shell CSR; build tidak gagal.
3. **Freshness**: backend memicu Vercel Deploy Hook setelah mutasi CMS, di-debounce 5 menit.
4. Runtime pengunjung tetap menerima data terbaru segera via TanStack Query. Snapshot SEO menyusul ≤ ±10 menit.
5. Navigasi internal setelah load pertama berjalan CSR dengan hydration.
6. `sitemap.xml` dan `robots.txt` dihasilkan endpoint backend, direwrite oleh Vercel, cache 1 jam.
7. Metadata wajib: title ≤ 60 karakter, description ≤ 155, canonical, `hreflang` id/en, `og:locale`, OG image 1200×630 via transformasi Cloudinary.

**Konsekuensi**
Crawler tanpa JS hanya menerima HTML penuh untuk rute yang berhasil diprerender. Rute yang dibuat setelah build terakhir menerima shell sampai rebuild berikutnya. Diterima sebagai trade-off.

**Alternatif bila SEO menjadi kritis:** migrasi ke SSR framework (Astro/Next). Di luar cakupan v1.

---

## TD-12 — Email Delivery Provider

**Keputusan**

1. Implementasi tunggal: Nodemailer SMTP memakai env yang sudah ada (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `ADMIN_EMAIL`).
2. Default provider: **Resend SMTP** — `smtp.resend.com:465`, user `resend`, password = API key.
3. Penggantian provider = perubahan env, tanpa perubahan kode (Brevo, SendGrid, Mailgun, Gmail app password).
4. `MAIL_FROM` wajib pada domain terverifikasi (SPF + DKIM).
5. Contact form: kirim ke `ADMIN_EMAIL`, `replyTo` = email pengunjung, subjek `[RF Contact] <nama>`. Tidak disimpan di database.
6. Anti-abuse: **reCAPTCHA v2 checkbox** (score v3 tidak deterministik), honeypot field, time-trap (submit < 3 detik ditolak), rate limit 3 pesan/jam/IP.
7. Timeout kirim 10 detik; gagal → 502 dengan pesan retry.

**OWNER ACTION:** akun Resend + verifikasi domain (atau set env provider lain).

---

## TD-13 — Mekanisme Backup dan Restore di Railway

**Keputusan**

1. Container backend menyertakan `postgresql-client-17` (Alpine: `apk add postgresql17-client`). Railway Postgres 16 kompatibel.
2. **Backup**: `pg_dump --format=plain --no-owner --no-privileges --clean --if-exists --no-comments`, di-stream langsung sebagai unduhan. Nama `rf-backup-YYYYMMDD-HHmm.sql`. Batas 100 MB.
3. Dump **tanpa** `-C` (tidak membuat database) — restore hanya menyasar schema `public`.
4. **Restore**:
   - Multipart ≤ 100 MB + re-autentikasi password admin.
   - Validasi: header dump PostgreSQL, hanya perintah SQL, tolak `\!`, `\connect`, `CREATE DATABASE`, `ALTER SYSTEM`, `COPY ... FROM PROGRAM`.
   - Snapshot keamanan wajib: `pg_dump` ke `/tmp/pre-restore-<ts>.sql`. Jika snapshot gagal → restore dibatalkan.
   - Eksekusi: sisipkan `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` lalu `psql "$DATABASE_URL" --single-transaction -v ON_ERROR_STOP=1 -f file`.
   - Verifikasi: `_prisma_migrations` ada dan versi terakhir cocok dengan binary; hitung row tabel inti.
   - Verifikasi gagal setelah commit → restore snapshot otomatis, laporkan 500.
   - Snapshot dihapus setelah sukses; disimpan 24 jam setelah gagal (`/tmp`, ephemeral).
5. Batas waktu request 4 menit (limit Railway). File > 80 MB → arahkan ke CLI `npm run restore -- <file.sql>` melalui Railway Shell.
6. Tidak ada backup terjadwal. Tidak ada penyimpanan backup di DB atau Cloudinary.

**Risiko yang diterima**
Disk `/tmp` ephemeral: snapshot hilang bila container restart di tengah proses. Restore bersifat menghentikan layanan sementara.

---

## TD-14 — Batas Ukuran Upload dan Tipe File

**Keputusan**

| Jenis | Format | Batas | Catatan |
|---|---|---|---|
| Logo / ikon | PNG, JPG, WEBP, AVIF | 5 MB | transformasi `f_auto,q_auto` |
| Logo SVG | SVG | 512 KB | hanya folder logo; disanitasi DOMPurify + jsdom |
| Media umum | PNG, JPG, WEBP, AVIF | 5 MB | |
| CV | PDF | 10 MB | validasi magic bytes `%PDF-` |
| Audio / video | — | — | tidak diizinkan; hanya URL eksternal |

1. Upload langsung ke Cloudinary dengan signature berisi `folder`, `allowed_formats`, `max_file_size`, `timestamp`.
2. Validasi ganda: `File.size` di browser (tolak sebelum upload) + verifikasi metadata di backend (`resource_type`, `format`, `bytes`).
3. Metadata hanya disimpan setelah verifikasi lolos.
4. Delivery: `f_auto,q_auto,w_<size>,dpr_auto`.
5. SVG yang gagal sanitasi ditolak.

---

## TD-15 — Cakupan Pengelolaan Bahasa dan Terjemahan

**Keputusan**

1. Diterjemahkan via API: `CollectionItem.name`/`description`, `Project.title`/`description`, `TimelineEntry.title`/`description`, `Profile.bio`/`interests`/`goals`, `Category.name`, `Subcategory.name`, `LearningField.name`, `Media.alt`.
2. Tidak diterjemahkan: URL, username sosial media, spesifikasi perangkat, nama model, angka, isi CV, nama tema.
3. `sourceLocale` (`id` | `en`) disimpan per item, bukan per field.
4. String UI memakai kamus statis frontend (`id`, `en`), bukan provider.
5. Terjemahan dipicu per halaman saat bahasa aktif ≠ `sourceLocale`, dibatch ≤ 50 teks.
6. Kegagalan → tampil teks asli tanpa indikator yang mengganggu.

---

## Tindakan yang Diperlukan Pemilik

| # | Kebutuhan | Memblokir |
|---|---|---|
| 1 | Custom domain + subdomain `api.` | RF-018 (sesi persisten), CORS, cookie |
| 2 | Akun DeepL API Free + key | RF-020 (terjemahan) |
| 3 | Akun Resend + verifikasi domain (SPF/DKIM) | RF-025 (contact form) |
| 4 | Cloudinary account (cloud name, key, secret) | RF-015, RF-016, RF-026 |
| 5 | Railway project + PostgreSQL 16 | seluruh backend |
| 6 | reCAPTCHA v2 keys | RF-025 |
| 7 | Vercel Deploy Hook URL → env backend | TD-11 freshness |

---

## Dampak terhadap Blueprint

Keputusan berikut mempersempit atau mengubah pernyataan blueprint dan harus dianggap berlaku:

| ID | Perubahan |
|---|---|
| D-01 | Cookie persisten mensyaratkan penempatan same-site (custom domain). `vercel.app` + `railway.app` tidak memenuhi RF-018. |
| D-02 | "Perubahan langsung dipublikasikan" berlaku untuk runtime; snapshot SEO tertinggal ≤ ±10 menit. |
| D-03 | Satu kunjungan = satu page load. Bot dikecualikan. IP tidak disimpan. |
| D-04 | Penghapusan media tidak menghapus aset Cloudinary, termasuk saat admin menghapus media dari library. |
| D-05 | Lokasi publik berupa label kota, bukan koordinat. |
| D-06 | Master mute mencakup SFX dan musik (menutup catatan §4.8). |
| D-07 | reCAPTCHA memakai v2 checkbox, bukan v3. |
| D-08 | Tidak ada cache terjemahan; hanya penggabungan request bersamaan. |
| D-09 | Backup/restore memakai `pg_dump`/`psql` dengan single transaction, bukan eksekusi SQL upload tanpa isolasi. |
