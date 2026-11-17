# API Specification — RF Personal Tech Dashboard

| Atribut | Nilai |
|---|---|
| Versi | 1.0 |
| Tanggal | 2026-11-14 |
| Status | Kontrak final. Mengikat implementasi backend dan klien. |
| Acuan mengikat | `docs/technical-decisions.md` (TD-01…TD-15). Bila konflik dengan dokumen lain, TD menang. |
| Sumber struktur data | `prisma/schema.prisma`, `docs/erd.md` |
| Cakupan | 88 endpoint: 24 publik (2 di root, di luar `/api/v1`), 64 admin |
| Sifat | Dokumen kontrak. Tidak memuat kode implementasi. |

---

## Konvensi

### Base URL dan transport

| Lingkungan | Base URL |
|---|---|
| Production | `https://api.rf.<domain>/api/v1` |
| Development | `http://localhost:4000/api/v1` |

1. Hanya HTTPS di production. HTTP ditolak di edge.
2. Semua body request dan response JSON UTF-8. Pengecualian: `GET /api/v1/resume` (PDF), `GET /sitemap.xml` (XML), `GET /robots.txt` (teks), `POST /api/v1/admin/backup` (stream SQL), dan respons `204` (tanpa body).
3. `POST /api/v1/admin/restore` memakai `multipart/form-data`. Selain itu `application/json; charset=utf-8`.
4. `/sitemap.xml` dan `/robots.txt` berada di root host backend, bukan di bawah `/api/v1` (TD-11).
5. Tidak ada negosiasi versi. Perubahan breaking membuat `/api/v2`.
6. Nama field response memakai camelCase Prisma apa adanya. Tidak ada translasi nama field.
7. Body request bersifat strict: key tidak dikenal → `400 VALIDATION_ERROR`.

### Format data

| Konsep | Aturan | Contoh |
|---|---|---|
| ID | cuid2 24 karakter, `^[a-z][a-z0-9]{23}$` (TD-07) | `clx9a2bcdefghijklmnopqrs` |
| Timestamp | ISO 8601 UTC, milidetik, suffix `Z` | `2026-11-14T04:05:06.000Z` |
| Tanggal saja | `YYYY-MM-DD`, hanya `TimelineEntry.date` | `2026-11-02` |
| Enum | nilai Prisma huruf besar | `CURRENTLY_USING` |
| Locale | `id` atau `en` | `id` |
| URL | absolut `https://`, ≤ 2048 karakter | `https://example.com` |
| Angka | integer JSON, bukan string | `12480` |
| Boolean | JSON `true`/`false`, bukan `0`/`1` | `true` |

**Enum yang dipakai**

| Enum | Nilai |
|---|---|
| `CollectionType` | `AI`, `TOOL`, `WEBSITE` |
| `CategoryKind` | `AI`, `TOOL`, `WEBSITE`, `PROJECT` |
| `UsageStatus` | `CURRENTLY_USING`, `PREVIOUSLY_USED`, `EXPLORING`, `WANT_TO_TRY` |
| `Locale` | `id`, `en` |

**Field yang tidak pernah dikirim**

`nameSort`, `platformSort`, `titleSort`, `originalNameSort` (internal pengurutan), `passwordHash`, `tokenHash`, `ipHash`, `userAgentHash` (keamanan), `ownerLat`, `ownerLng` (hanya response admin; publik tidak pernah menerimanya — TD-01).

**Field nullable** dikirim sebagai `null`, tidak dihilangkan dari objek. Tidak ada `undefined` di JSON.

**Field computed** (bukan kolom database, dihitung server): `itemCount`, `usageCount`, `usages`, `hasResume`, `location.stale`, `smtpConfigured`, `prevId`, `nextId`, `prev`, `next`, `total`, `nextCursor`.

**Pemetaan penyimpanan teks-ganda.** `Profile.interests` dan `Profile.goals` bertipe `Text` di database. API memakai array string: saat menulis, item digabung dengan `\n`; saat membaca, dipecah per baris dan baris kosong dibuang. Urutan dipertahankan. Array kosong disimpan sebagai string kosong dan dikembalikan sebagai `[]`.

### Envelope dan kode error

Response sukses mengembalikan resource langsung (tanpa envelope). Daftar memakai `{ items, total }`; daftar berpaginasi menambahkan `nextCursor` sehingga menjadi `{ items, nextCursor, total }` (lihat Pagination). `DELETE` mengembalikan `204` tanpa body. Angka pada seluruh contoh JSON bersifat ilustratif dan tidak mewakili satu dataset yang sama antar endpoint.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Payload tidak valid.",
    "details": {
      "fields": [
        { "path": "title", "message": "Minimal 2 karakter." }
      ],
      "requestId": "req_01jc9x2m4p"
    }
  }
}
```

`details` boleh `null`. `message` ringkas, tidak pernah memuat stack trace, SQL, path file server, nama environment variable, atau secret. Klien wajib memetakan `code` dan `details.fields[].path`, bukan `message`.

| `code` | HTTP | Pemicu |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod gagal, cursor rusak, enum/tipe salah, `q` terlalu pendek, tanggal tidak valid, koordinat di luar rentang, file restore ditolak validator SQL |
| `UNAUTHORIZED` | 401 | Tanpa sesi, sesi kedaluwarsa/dicabut, kredensial login salah, password re-auth salah, batas absolut 90 hari tercapai |
| `FORBIDDEN` | 403 | `Origin`/`Referer` di luar allowlist, `X-RF-Client` hilang/salah, aksi butuh re-auth yang belum dipenuhi |
| `NOT_FOUND` | 404 | Route atau resource tidak ada, ID valid tetapi tidak ditemukan |
| `CONFLICT` | 409 | Unique constraint, kategori masih dipakai, media masih direferensikan, restore/backup lain sedang berjalan, sesi tidak dapat dirotasi |
| `PAYLOAD_TOO_LARGE` | 413 | Body JSON > 1 MB, multipart restore > 100 MB, file restore > 80 MB untuk jalur web, dump > 100 MB |
| `RATE_LIMITED` | 429 | Limit endpoint terlampaui (tabel §Rate Limits) |
| `UPSTREAM_ERROR` | 502 | Cloudinary, DeepL, SMTP, atau Nominatim gagal/timeout |
| `INTERNAL` | 500 | Bug, PostgreSQL tidak tersedia, `pg_dump`/`psql` gagal, verifikasi restore gagal |

Catatan pemetaan:

1. PostgreSQL tidak tersedia pada endpoint data → `500 INTERNAL` dengan `details.reason = "database_unavailable"`. `GET /api/v1/health` tetap `200` dan melaporkan `database: "OFFLINE"` (§Public API).
2. Timeout restore 4 menit → `500 INTERNAL`, `details.stage = "timeout"`, disertai arahan CLI.
3. Metode HTTP salah pada path yang ada → `404 NOT_FOUND` (bukan 405), konsisten dengan router Express.
4. `429` selalu menyertakan header `Retry-After` dan `details.retryAfterSeconds`.
5. Semua response menyertakan `X-Request-Id`; nilai yang sama dikembalikan di `error.details.requestId`.

### Header

**Request**

| Header | Wajib | Keterangan |
|---|---|---|
| `Content-Type` | ya, bila ada body | `application/json` atau `multipart/form-data` (restore) |
| `X-RF-Client: web` | ya untuk semua non-GET, kecuali dua endpoint publik | `POST /api/v1/visits` dan `POST /api/v1/translate` dikecualikan (sendBeacon tidak dapat menyetel header) |
| `Origin` atau `Referer` | ya untuk semua non-GET | Harus cocok dengan `FRONTEND_ORIGIN`; keduanya absen → 403 |
| `Cookie: rf_sess` | ya untuk `/api/v1/admin/**` kecuali login | Token sesi mentah 32 byte |

**Response**

| Header | Kapan | Nilai |
|---|---|---|
| `X-Request-Id` | semua | `req_` + 12–24 karakter |
| `RateLimit-Limit` | endpoint ber-rate-limit | integer kuota per jendela |
| `RateLimit-Remaining` | idem | integer sisa |
| `RateLimit-Reset` | idem | detik sampai reset |
| `Retry-After` | 429 | detik |
| `Cache-Control` | semua | lihat tabel cache |
| `Vary` | semua | `Origin` |
| `Set-Cookie` | login, rotasi, logout, 401 | `rf_sess=…` |

`Access-Control-Allow-Origin` hanya origin tunggal dari allowlist, `Access-Control-Allow-Credentials: true`, `Access-Control-Allow-Headers: Content-Type, X-RF-Client`, `Access-Control-Max-Age: 600`. Preflight `OPTIONS` tidak memerlukan CSRF.

**Cache**

| Endpoint | `Cache-Control` |
|---|---|
| `/api/v1/health` | `no-store` |
| `/api/v1/presence` | `public, max-age=30, stale-while-revalidate=30` |
| `/api/v1/visitor-count` | `public, max-age=30, stale-while-revalidate=60` |
| `/api/v1/profile`, `/categories`, `/subcategories`, `/collections/**`, `/social-media`, `/projects`, `/tech-stack`, `/learning-journey`, `/devices`, `/timeline`, `/statistics`, `/contact/config` | `public, max-age=60, stale-while-revalidate=300` |
| `/api/v1/resume` | `public, max-age=300` |
| `/api/v1/search` | `no-store` |
| `/sitemap.xml`, `/robots.txt` | `public, max-age=3600` |
| `/api/v1/admin/**` (semua metode) | `no-store` |
| Semua `POST`/`PATCH`/`PUT`/`DELETE` publik | `no-store` |

### Pagination cursor

1. Query: `limit` (integer) dan `cursor` (string opaque). Tidak ada `page`/`offset`.
2. Cursor = base64url tanpa padding dari JSON `{ "sortValue": <string|"YYYY-MM-DD">, "id": <cuid2> }`.
3. `sortValue` adalah nilai kolom urut yang sudah dinormalisasi, bukan `name` mentah: koleksi/proyek memakai `nameSort`/`titleSort`, timeline memakai `date`, media memakai `createdAt` ISO.
4. Cursor tidak ditandatangani; server memvalidasi bentuk, tipe, dan konsistensi dengan `sort`/filter aktif. Cursor tidak valid → `400 VALIDATION_ERROR`, `details.field = "cursor"`.
5. Cursor terikat pada kombinasi `sort`, `q`, dan filter. Klien wajib membuang cursor saat filter berubah.
6. `nextCursor` = cursor item terakhir pada halaman bila masih ada data berikutnya; `null` bila habis. `nextCursor = null` menghentikan Load More (TD-08).
7. `total` = jumlah seluruh baris yang cocok dengan filter, bukan jumlah halaman. Dihitung tanpa cursor.
8. Urutan selalu deterministik dengan tie-break `id`: `ASC` memakai `(sortValue ASC, id ASC)`, `DESC` memakai `(sortValue DESC, id DESC)` (TD-07).

Contoh cursor: `eyJzb3J0VmFsdWUiOiJjaGF0Z3B0IiwiaWQiOiJjbHg5YTJiY2RlZmdoaWprbG1ub3BxcnMifQ`

| Konteks | Default `limit` | Max `limit` | Langkah TD-08 |
|---|---|---|---|
| `GET /collections/:type` | 12 | 48 | 12 + 12 |
| `GET /collections/:type/sections` | 12 tetap | 12 tetap | 12 awal per kategori |
| `GET /projects` | 12 | 48 | 12 + 12 |
| `GET /timeline` | 20 | 100 | 20 + 20 |
| `GET /admin/media` | 24 | 96 | 24 + 48 |
| List admin lain | 24 | 100 | operasional |
| `GET /search` | 5 per grup, 20 total | tetap | tanpa Load More |

`limit` di luar rentang → `400 VALIDATION_ERROR`, `details.field = "limit"`.

### Idempotensi `visitId`

1. `visitId` adalah UUID v4 yang dibuat di memori klien saat boot, satu per full page load (TD-03).
2. `VisitorEvent.visitId` `@unique`. Pengiriman ganda (Strict Mode, retry jaringan) menghasilkan `204` tanpa baris baru.
3. Format divalidasi `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`. Format salah → `400 VALIDATION_ERROR`.
4. UA bot (regex TD-03) → `204` tanpa menulis. `navigator.webdriver` tidak mengirim request.
5. `isOwner` ditentukan server dari cookie `rf_sess` yang valid; klien tidak boleh mengirim field ini.
6. Duplikat, bot, dan sukses sama-sama `204` tanpa body. Klien tidak boleh membedakannya.

### Batas payload dan timeout

| Item | Batas | Perilaku |
|---|---|---|
| Body JSON | 1 MB | `413 PAYLOAD_TOO_LARGE` sebelum parsing |
| Field teks panjang | sesuai skema per endpoint | `400 VALIDATION_ERROR` |
| Multipart restore | 100 MB | `413` |
| File restore jalur web | 80 MB | `413` + arahan CLI (§Backup & Restore API) |
| Dump backup | 100 MB | `413` sebelum streaming |
| Timeout request umum | 15 detik | `500 INTERNAL` |
| Timeout SMTP | 10 detik | `502 UPSTREAM_ERROR` (TD-12) |
| Timeout DeepL | 5 detik | `200` dengan teks asli (TD-04) |
| Timeout restore | 240 detik | `500 INTERNAL`, `details.stage = "timeout"` (TD-13) |

### Objek bersama

**`MediaRef`** — dipakai semua endpoint yang menyertakan media.

```json
{
  "id": "cmd4e5fghijklmnopqrstuvw",
  "publicId": "rf/ai/chatgpt",
  "secureUrl": "https://res.cloudinary.com/demo/image/upload/v1/rf/ai/chatgpt.png",
  "format": "png",
  "resourceType": "image",
  "bytes": 84512,
  "width": 512,
  "height": 512,
  "alt": "Logo ChatGPT",
  "originalName": "chatgpt.png",
  "sourceLocale": "id",
  "folderId": "cfolder2abcdefghijklmnop",
  "createdAt": "2026-03-12T04:05:06.000Z"
}
```

`width`/`height` bernilai `null` untuk aset non-raster. Transformasi delivery (`f_auto,q_auto,w_<size>,dpr_auto`) diterapkan klien pada `secureUrl` (TD-14); API tidak menyimpan varian.

**`CategoryRef`** `{ "id", "name" }` · **`SubcategoryRef`** `{ "id", "name" }` · **`Link`** `{ "id", "label", "url", "sortOrder" }`

**`CollectionCard`** — payload kartu masonry dan item pada Load More.

```json
{
  "id": "clx9a2bcdefghijklmnopqrs",
  "name": "ChatGPT",
  "description": "Asisten percakapan untuk riset harian.",
  "usageStatus": "CURRENTLY_USING",
  "sourceLocale": "id",
  "category": { "id": "clx9a2bcdefghijklmnopqrt", "name": "Chatbot" },
  "subcategory": { "id": "clx9a2bcdefghijklmnopqru", "name": "Chatbot" },
  "logo": null
}
```

`logo` bertipe `MediaRef | null`. `subcategory` boleh `null`.

### Catatan konsistensi schema

Butir berikut adalah temuan nyata terhadap `prisma/schema.prisma`. Kontrak mengikuti schema; penyimpangan dicatat, bukan ditambal diam-diam.

1. **`TechStackItem` belum ada di schema.** Kontrak memakai bentuk yang ditetapkan: `id`, `name`, `nameSort`, `category` (String), `description?`, `logoMediaId?`, `primaryUrl?`, `sourceLocale`, `sortOrder`, `createdAt`, `updatedAt`. Model wajib ditambahkan sebelum implementasi `/tech-stack`.
2. **`Profile.locationLabel` ada tetapi tidak dipakai.** Sumber lokasi publik adalah `SiteConfiguration.ownerLocationLabel` + `ownerLocationUpdatedAt` (TD-01). Koordinat tidak pernah masuk response publik.
3. **`Device.notes` hanya satu kolom teks.** UI menghendaki daftar label–nilai (maks 8 baris). Kontrak memakai `notes: string` ≤ 800 karakter; daftar terstruktur memerlukan tabel baru.
4. **`LearningField.description` dan `Profile.tagline` nullable** meski sebagian layar menandainya wajib. API memperlakukannya opsional; validasi wajib hanya di UI.
5. **`TimelineEntry` tidak punya `updatedAt`.** Response timeline tidak memuat `updatedAt`; sort admin hanya `createdAt` atau `date`.
6. **`Category.description` ada**, sedangkan blueprint §4.4 menetapkan deskripsi header kategori ditulis di kode. Field dikembalikan API, tidak dirender v1.
7. **Folder media tetap lima** (AI, Tools, Websites, Projects, Profile). CV, logo social media, dan logo learning disimpan di folder `Profile` karena tidak ada folder khusus.
8. **`Project` tidak punya kolom tahun.** Angka tahun pada kartu diturunkan klien dari `createdAt`.
9. **Tidak ada unique constraint** pada `LearningField.name` maupun `TechStackItem(category, name)`. API menegakkan `409 CONFLICT` di application layer.

---

## Autentikasi & Sesi

### Cookie `rf_sess`

| Atribut | Nilai | Sumber |
|---|---|---|
| Nama | `rf_sess` | TD-06 |
| Isi | 32 byte acak, base64url | TD-06 |
| `HttpOnly` | ya | TD-06 |
| `Secure` | ya di production, tidak di localhost | TD-06 |
| `SameSite` | `Lax` | TD-06 |
| `Path` | `/` | TD-06 |
| `Max-Age` | 2592000 (30 hari) | TD-06 |
| Domain | host backend (`api.rf.<domain>`), tanpa `Domain` attribute | TD-06 |

Database hanya menyimpan `Session.tokenHash` = SHA-256(token). Token mentah tidak pernah dikembalikan di body response.

### Alur

1. **Login.** `POST /api/v1/admin/auth/login` memverifikasi username + password Argon2id (m=19456 KiB, t=2, p=1). Sukses → buat `Session` baru (token baru, `expiresAt` = now + 30 hari, `absoluteExpiresAt` = now + 90 hari), perbarui `Admin.lastLoginAt`, kirim `Set-Cookie`. Gagal → `401 UNAUTHORIZED` dengan pesan seragam, tanpa membedakan username/password.
2. **Validasi.** Setiap request admin: hash cookie, cari `Session` dengan `revokedAt = null`, `expiresAt > now`, `absoluteExpiresAt > now`. Gagal salah satu → `401` + cookie dihapus.
3. **Sliding expiry.** `expiresAt` diperpanjang ke now + 30 hari maksimum 1× per jam per sesi. Saat perpanjangan, token dirotasi: row lama di-revoke, row baru dibuat, `Set-Cookie` baru dikirim. Request dalam jendela 1 jam tidak merotasi.
4. **Cap absolut.** Melewati `absoluteExpiresAt` (90 hari) → `401`, cookie dihapus, wajib login ulang. Tidak ada perpanjangan absolut.
5. **Logout.** `POST /api/v1/admin/auth/logout` menghapus row `Session` dan mengirim cookie kedaluwarsa. `204`.
6. **Ganti kredensial.** `PATCH /api/v1/admin/auth/credentials` memverifikasi password saat ini, memperbarui `passwordHash` + `passwordUpdatedAt`, me-revoke **semua sesi lain**, dan merotasi sesi aktif. Sesi pemanggil tetap valid dengan token baru.
7. **Re-auth.** `POST /api/v1/admin/auth/reauth` memverifikasi password dan mengembalikan `reauthToken` berumur 5 menit, sekali pakai, khusus `POST /api/v1/admin/restore`. Token tidak disimpan di database; ditandatangani HMAC dengan `SESSION_SECRET` dan nonce in-memory (asumsi satu instance, CL-12).

Contoh response sesi (dipakai `GET /admin/auth/session` dan login):

```json
{
  "admin": {
    "id": "clx9a2bcdefghijklmnopqrs",
    "username": "rf",
    "passwordUpdatedAt": "2026-10-01T02:00:00.000Z",
    "lastLoginAt": "2026-11-14T04:05:06.000Z",
    "createdAt": "2026-01-02T03:04:05.000Z"
  },
  "session": {
    "createdAt": "2026-11-14T04:05:06.000Z",
    "expiresAt": "2026-12-14T04:05:06.000Z",
    "absoluteExpiresAt": "2027-02-12T04:05:06.000Z",
    "lastUsedAt": "2026-11-14T04:05:06.000Z"
  }
}
```

### CSRF

| Aturan | Cakupan |
|---|---|
| Header `X-RF-Client: web` wajib | Semua non-GET (`POST`, `PATCH`, `PUT`, `DELETE`) |
| Dikecualikan dari header | `POST /api/v1/visits`, `POST /api/v1/translate` |
| `Origin` atau `Referer` harus cocok `FRONTEND_ORIGIN` | Semua non-GET, termasuk dua endpoint yang dikecualikan |
| Keduanya absen | `403 FORBIDDEN`, `details.reason = "origin_missing"` |
| Nilai berbeda | `403 FORBIDDEN`, `details.reason = "origin_mismatch"` |
| Header hilang/salah | `403 FORBIDDEN`, `details.reason = "csrf_header"` |
| `OPTIONS` preflight | Tidak memerlukan header maupun Origin allowlist |

`SameSite=Lax` adalah lapis kedua, bukan pengganti. Endpoint publik yang dikecualikan tetap divalidasi Origin + rate limit (TD-06, CL-03).

### 401 vs 403

| Kondisi | Status | Efek |
|---|---|---|
| Tidak ada cookie sesi | `401 UNAUTHORIZED` | Tidak ada perubahan data |
| Cookie tidak dikenal / hash tidak cocok | `401 UNAUTHORIZED` | Cookie dihapus |
| `expiresAt` atau `absoluteExpiresAt` lewat | `401 UNAUTHORIZED` | Cookie dihapus |
| `revokedAt` terisi (logout, ganti password, rotasi) | `401 UNAUTHORIZED` | Cookie dihapus |
| Sesi valid, `X-RF-Client` hilang/salah | `403 FORBIDDEN` | Sesi tetap aktif |
| Sesi valid, Origin/Referer asing | `403 FORBIDDEN` | Sesi tetap aktif |
| Sesi valid, restore tanpa `reauthToken` valid | `403 FORBIDDEN` | Tidak ada snapshot/eksekusi |
| Kredensial login salah | `401 UNAUTHORIZED` | Tidak ada sesi baru |
| Password re-auth salah | `401 UNAUTHORIZED` | `reauthToken` tidak diterbitkan |

### Endpoint publik (tanpa sesi)

`GET /profile`, `/categories`, `/subcategories`, `/collections/**`, `/social-media`, `/projects`, `/tech-stack`, `/learning-journey`, `/devices`, `/timeline`, `/statistics`, `/search`, `/visitor-count`, `/presence`, `/contact/config`, `/resume`, `/health`, `POST /visits`, `POST /contact`, `POST /translate`, `GET /sitemap.xml`, `GET /robots.txt`.

Cookie `rf_sess` yang dikirim ke endpoint publik hanya dipakai untuk menandai `isOwner` pada `POST /visits`; tidak membuka data tambahan.

## Public API

Tanpa sesi. Rate limit per IP kecuali dinyatakan lain. Semua contoh memakai base `/api/v1`.

| # | Method | Path | Cache | Limit | RF |
|---|---|---|---|---|---|
| 1 | GET | `/profile` | 60 s | 300/menit | RF-001 |
| 2 | GET | `/categories` | 60 s | 300/menit | RF-006 |
| 3 | GET | `/subcategories` | 60 s | 300/menit | RF-006 |
| 4 | GET | `/collections/:type/sections` | 60 s | 300/menit | RF-006, RF-007 |
| 5 | GET | `/collections/:type` | 60 s | 300/menit | RF-007, RF-014 |
| 6 | GET | `/collections/:type/:id` | 60 s | 300/menit | RF-007, RF-008, RF-009, RF-029 |
| 7 | GET | `/social-media` | 60 s | 300/menit | RF-014 |
| 8 | GET | `/projects` | 60 s | 300/menit | RF-014 |
| 9 | GET | `/tech-stack` | 60 s | 300/menit | RF-014 |
| 10 | GET | `/learning-journey` | 60 s | 300/menit | RF-014 |
| 11 | GET | `/devices` | 60 s | 300/menit | RF-014 |
| 12 | GET | `/timeline` | 60 s | 300/menit | RF-014 |
| 13 | GET | `/statistics` | 60 s | 300/menit | RF-023 |
| 14 | GET | `/search` | `no-store` | 60/menit | RF-010, RF-011, RF-012 |
| 15 | GET | `/visitor-count` | 30 s | 300/menit | RF-024 |
| 16 | GET | `/presence` | 30 s | 300/menit | — |
| 17 | POST | `/visits` | `no-store` | 60/menit | RF-024 |
| 18 | GET | `/contact/config` | 60 s | 300/menit | RF-025 |
| 19 | POST | `/contact` | `no-store` | 3/jam | RF-025 |
| 20 | GET | `/resume` | 300 s | 60/menit | RF-026 |
| 21 | POST | `/translate` | `no-store` | 20/menit | RF-020 |
| 22 | GET | `/health` | `no-store` | 60/menit | — |
| 23 | GET | `/sitemap.xml` (root) | 3600 s | 60/menit | RF-030 |
| 24 | GET | `/robots.txt` (root) | 3600 s | 60/menit | RF-030 |

`:type` ∈ `ai` | `tools` | `websites`, dipetakan ke `CollectionType` `AI` | `TOOL` | `WEBSITE`.

### GET /profile

Response 200.

```json
{
  "id": "clx9a2bcdefghijklmnopqrs",
  "displayName": "RF",
  "tagline": "Builder & technology explorer",
  "bio": "Paragraf bio pemilik.",
  "interests": ["AI", "Backend", "Cybersecurity"],
  "goals": ["Membangun dashboard ini", "Mendalami distributed system"],
  "avatar": null,
  "location": {
    "label": "Bandung, ID",
    "updatedAt": "2026-11-13T09:00:00.000Z",
    "stale": false
  },
  "hasResume": true,
  "sourceLocale": "id",
  "updatedAt": "2026-11-13T09:00:00.000Z"
}
```

| Aturan | Nilai |
|---|---|
| `location.label` | `SiteConfiguration.ownerLocationLabel`; `null` bila kosong atau `ownerLocationUpdatedAt` > 30 hari |
| `location.stale` | `true` bila data > 30 hari; label publik menjadi `null` (TD-01) |
| `hasResume` | `true` bila ada satu row `Resume` |
| `interests`/`goals` | hasil pemisahan newline (lihat Konvensi) |

Error: `404 NOT_FOUND` bila singleton `Profile` belum di-seed (kesalahan deployment), `500 INTERNAL` bila PostgreSQL tidak tersedia.

### GET /categories

Query: `kind` opsional (`ai`|`tool`|`website`|`project`). Tanpa pagination.

```json
{
  "items": [
    {
      "id": "clx9a2bcdefghijklmnopqrt",
      "kind": "AI",
      "name": "Chatbot",
      "description": "Asisten percakapan.",
      "sortOrder": 1,
      "sourceLocale": "id",
      "itemCount": 6,
      "subcategories": [
        { "id": "clx9a2bcdefghijklmnopqru", "name": "Chatbot", "sortOrder": 1, "itemCount": 6 }
      ],
      "createdAt": "2026-01-02T03:04:05.000Z",
      "updatedAt": "2026-01-02T03:04:05.000Z"
    }
  ],
  "total": 6
}
```

`itemCount` = `CollectionItem` untuk kind AI/TOOL/WEBSITE, `Project` untuk kind PROJECT. Urutan `sortOrder ASC, name ASC, id ASC`. `description` tersedia tetapi header publik v1 memakai teks dari kode (blueprint §4.4).

Error: `400 VALIDATION_ERROR` bila `kind` bukan enum.

### GET /subcategories

Query: `categoryId` opsional (cuid2). Tanpa pagination.

```json
{
  "items": [
    {
      "id": "clx9a2bcdefghijklmnopqru",
      "categoryId": "clx9a2bcdefghijklmnopqrt",
      "name": "Chatbot",
      "sortOrder": 1,
      "sourceLocale": "id",
      "itemCount": 6,
      "createdAt": "2026-01-02T03:04:05.000Z",
      "updatedAt": "2026-01-02T03:04:05.000Z"
    }
  ],
  "total": 1
}
```

Urutan `sortOrder ASC, name ASC, id ASC`. `categoryId` tidak dikenal → daftar kosong, bukan 404.

### GET /collections/:type/sections

Payload satu halaman koleksi: setiap kategori membawa 12 item pertama dan cursor-nya sendiri (TD-08). Dipakai saat mount `/ai`, `/tools`, `/websites`.

Query: tidak ada. `limit` tetap 12; nilai lain → `400 VALIDATION_ERROR`.

```json
{
  "type": "AI",
  "total": 24,
  "categories": [
    {
      "id": "clx9a2bcdefghijklmnopqrt",
      "name": "Chatbot",
      "description": "Asisten percakapan.",
      "sortOrder": 1,
      "itemCount": 6,
      "items": [
        {
          "id": "clx9a2bcdefghijklmnopqrs",
          "name": "ChatGPT",
          "description": "Asisten percakapan untuk riset harian.",
          "usageStatus": "CURRENTLY_USING",
          "sourceLocale": "id",
          "category": { "id": "clx9a2bcdefghijklmnopqrt", "name": "Chatbot" },
          "subcategory": { "id": "clx9a2bcdefghijklmnopqru", "name": "Chatbot" },
          "logo": null
        }
      ],
      "nextCursor": "eyJzb3J0VmFsdWUiOiJjaGF0Z3B0IiwiaWQiOiJjbHg5YTJiY2RlZmdoaWprbG1ub3BxcnMifQ"
    }
  ],
  "generatedAt": "2026-11-14T04:05:06.000Z"
}
```

Aturan: kategori kosong tetap tampil (`itemCount: 0`, `items: []`, `nextCursor: null`); urutan kategori `sortOrder, name, id`; item `name ASC, id ASC` (TD-07); `total` = jumlah item seluruh kategori pada tipe tersebut.

Error: `400 VALIDATION_ERROR` (`type` tidak dikenal, `limit` dikirim).

### GET /collections/:type

Load More per kategori.

| Query | Tipe | Wajib | Aturan |
|---|---|---|---|
| `categoryId` | cuid2 | tidak | Bila ada, hasil dibatasi kategori tersebut; cursor terikat nilai ini |
| `limit` | int | tidak | default 12, 1–48 |
| `cursor` | string | tidak | dari `nextCursor` sebelumnya |

```json
{
  "items": [
    {
      "id": "clx9a2bcdefghijklmnopqrs",
      "name": "ChatGPT",
      "description": "Asisten percakapan untuk riset harian.",
      "usageStatus": "CURRENTLY_USING",
      "sourceLocale": "id",
      "category": { "id": "clx9a2bcdefghijklmnopqrt", "name": "Chatbot" },
      "subcategory": { "id": "clx9a2bcdefghijklmnopqru", "name": "Chatbot" },
      "logo": null
    }
  ],
  "nextCursor": null,
  "total": 24
}
```

Urutan `nameSort ASC, id ASC`. Tidak ada filter `usageStatus` di publik (blueprint melarang filter status).

Error: `400 VALIDATION_ERROR` (`type`, `limit`, `cursor`), `404 NOT_FOUND` bila `categoryId` tidak ada.

### GET /collections/:type/:id

Detail item + navigasi A–Z dalam kategori yang sama (TD-07, RF-008/RF-009).

```json
{
  "id": "clx9a2bcdefghijklmnopqrs",
  "type": "AI",
  "name": "ChatGPT",
  "description": "Asisten percakapan untuk riset harian.",
  "usageStatus": "CURRENTLY_USING",
  "sourceLocale": "id",
  "category": { "id": "clx9a2bcdefghijklmnopqrt", "name": "Chatbot" },
  "subcategory": { "id": "clx9a2bcdefghijklmnopqru", "name": "Chatbot" },
  "logo": null,
  "links": [
    { "id": "clx9a2bcdefghijklmnopqrv", "label": "Website", "url": "https://chatgpt.com", "sortOrder": 0 }
  ],
  "prevId": null,
  "nextId": "clx9a2bcdefghijklmnopqrw",
  "prev": null,
  "next": { "id": "clx9a2bcdefghijklmnopqrw", "name": "Claude" },
  "createdAt": "2026-03-12T04:05:06.000Z",
  "updatedAt": "2026-03-12T04:05:06.000Z"
}
```

| Field | Aturan |
|---|---|
| `prevId`/`nextId` | cuid2 atau `null` pada batas kategori; urutan `nameSort ASC, id ASC` |
| `prev`/`next` | `{ id, name }` atau `null`; disertakan agar label tombol tidak perlu request tambahan |
| `links` | urut `sortOrder ASC, id ASC`; maksimum 5 |
| `type` | harus sesuai segmen path; item tipe lain → `404` |

Error: `404 NOT_FOUND` (ID tidak ada, ID milik tipe lain, atau `type` tidak dikenal), `400 VALIDATION_ERROR` (`type` bukan `ai|tools|websites`).

### GET /social-media

Tanpa pagination, tanpa rute publik sendiri; dirender sebagai section `/workspace`.

```json
{
  "items": [
    {
      "id": "clx9a2bcdefghijklmnopqrs",
      "platform": "Instagram",
      "username": "rf",
      "profileUrl": "https://instagram.com/rf",
      "logo": null,
      "sortOrder": 0,
      "createdAt": "2026-01-02T03:04:05.000Z",
      "updatedAt": "2026-01-02T03:04:05.000Z"
    }
  ],
  "total": 1
}
```

Urutan `sortOrder ASC, platformSort ASC, id ASC`. `platform`, `username`, `profileUrl` tidak diterjemahkan (TD-15). Tidak ada `sourceLocale` pada model ini.

### GET /projects

| Query | Tipe | Wajib | Aturan |
|---|---|---|---|
| `categoryId` | cuid2 | tidak | filter kategori kind `PROJECT` |
| `limit` | int | tidak | default 12, 1–48 |
| `cursor` | string | tidak | urutan `titleSort ASC, id ASC` |

```json
{
  "items": [
    {
      "id": "clx9a2bcdefghijklmnopqrs",
      "title": "RF Dashboard",
      "description": "Dashboard personal berbasis React dan Express.",
      "primaryUrl": "https://rf.example.com",
      "category": { "id": "clx9a2bcdefghijklmnopqrt", "name": "Website" },
      "cover": null,
      "sourceLocale": "id",
      "createdAt": "2026-03-12T04:05:06.000Z",
      "updatedAt": "2026-03-12T04:05:06.000Z"
    }
  ],
  "nextCursor": null,
  "total": 1
}
```

Tidak ada endpoint detail proyek (blueprint §5.5). Tahun pada kartu diturunkan klien dari `createdAt`. `primaryUrl` tepat satu per proyek.

### GET /tech-stack

Tanpa pagination; dikelompokkan per `category` (String bebas, tidak diterjemahkan).

```json
{
  "total": 26,
  "groups": [
    {
      "category": "Frontend",
      "count": 12,
      "items": [
        {
          "id": "clx9a2bcdefghijklmnopqrs",
          "name": "React",
          "description": null,
          "primaryUrl": "https://react.dev",
          "logo": null,
          "sortOrder": 1
        }
      ]
    }
  ]
}
```

Urutan grup mengikuti kemunculan pertama pada `sortOrder ASC, name ASC, id ASC`; item di dalam grup memakai urutan yang sama. Grup kosong tidak mungkin ada (turunan dari item). `category` peka huruf besar/kecil apa adanya; admin menormalkan saat menulis.

### GET /learning-journey

```json
{
  "items": [
    {
      "id": "clx9a2bcdefghijklmnopqrs",
      "name": "Programming",
      "description": null,
      "logo": null,
      "sortOrder": 1,
      "sourceLocale": "id",
      "createdAt": "2026-01-02T03:04:05.000Z",
      "updatedAt": "2026-01-02T03:04:05.000Z"
    }
  ],
  "total": 1
}
```

Urutan `sortOrder ASC, nameSort ASC, id ASC`. Tidak ada persentase, level, atau progress di kontrak. `description` ada di schema tetapi tidak dirender v1.

### GET /devices

```json
{
  "items": [
    {
      "id": "clx9a2bcdefghijklmnopqrs",
      "name": "Main Rig",
      "processor": "Ryzen 7 7700",
      "ram": "32 GB",
      "gpu": "RTX 4070",
      "storage": "1 TB NVMe",
      "operatingSystem": "Arch Linux",
      "notes": "Monitor 27 inci 1440p",
      "sortOrder": 1,
      "createdAt": "2026-01-02T03:04:05.000Z",
      "updatedAt": "2026-01-02T03:04:05.000Z"
    }
  ],
  "total": 1
}
```

Urutan `sortOrder ASC, nameSort ASC, id ASC`. Spesifikasi tidak diterjemahkan (TD-15). Tidak ada foto atau halaman detail.

### GET /timeline

| Query | Tipe | Wajib | Aturan |
|---|---|---|---|
| `limit` | int | tidak | default 20, 1–100 |
| `cursor` | string | tidak | urutan `date DESC, id DESC` |

```json
{
  "items": [
    {
      "id": "clx9a2bcdefghijklmnopqrs",
      "date": "2026-11-02",
      "title": "Memulai proyek RF Dashboard",
      "category": "Development",
      "description": "Inisialisasi repository dan struktur proyek.",
      "sourceLocale": "id",
      "createdAt": "2026-11-02T08:15:00.000Z"
    }
  ],
  "nextCursor": null,
  "total": 41
}
```

Tidak ada `updatedAt` pada model ini. `date` adalah tanggal saja. Deskripsi dibatasi 280 karakter oleh admin agar tidak terpotong di UI.

### GET /statistics

```json
{
  "collections": { "ai": 24, "tools": 38, "websites": 19 },
  "projects": 12,
  "socialMedia": 7,
  "techStack": 26,
  "learningFields": 9,
  "devices": 2,
  "timelineEntries": 41,
  "generatedAt": "2026-11-14T04:05:06.000Z"
}
```

Blueprint §5.9 mewajibkan lima angka (AI, Tools, Websites, Projects, Social Media). `techStack`, `learningFields`, `devices`, dan `timelineEntries` ditambahkan karena tile `/workspace` menampilkannya. Total pengunjung tidak ada di sini; pakai `/visitor-count`. `generatedAt` dipakai label "Diperbarui HH:MM".

Hitung = `COUNT(*)` setiap tabel, bukan estimasi.

### GET /search

| Query | Tipe | Wajib | Aturan |
|---|---|---|---|
| `q` | string | ya | trim, 3–80 karakter, case-insensitive, partial; `q` dinormalisasi lowercase + strip diakritik lalu dibandingkan `ILIKE %q%` pada kolom sort |
| `types` | csv | tidak | subset `ai,tools,websites,projects,tech_stack`; kosong = semua |
| `limit` | int | tidak | maksimum 20 total; 1–20 |

```json
{
  "query": "gpt",
  "types": ["ai"],
  "total": 2,
  "groups": [
    {
      "type": "ai",
      "items": [
        {
          "id": "clx9a2bcdefghijklmnopqrs",
          "name": "ChatGPT",
          "subtitle": "Chatbot",
          "logo": null
        }
      ]
    }
  ],
  "truncated": false
}
```

| Aturan | Nilai |
|---|---|
| Grup | `ai`, `tools`, `websites`, `projects`, `tech_stack`, urutan tetap itu |
| Maks per grup | 5 (TD-08) |
| Maks total | 20; `truncated: true` bila ada hasil terpotong |
| Urutan | `nameSort ASC, id ASC` per grup |
| Cakupan field | `CollectionItem.name`, `Project.title`, `TechStackItem.name` |
| `subtitle` | nama kategori; `null` untuk `tech_stack` |
| Typo correction / saran / riwayat | tidak ada |

Error: `400 VALIDATION_ERROR` bila `q` < 3 karakter setelah trim atau `types` memuat nilai asing; `429 RATE_LIMITED`.

### GET /visitor-count

```json
{ "total": 12480 }
```

Total kumulatif `VisitorEvent`, termasuk owner (TD-03). Tanpa IP, tanpa rincian harian.

### GET /presence

```json
{ "status": "ONLINE", "lastSeenAt": "2026-11-14T04:04:10.000Z" }
```

`ONLINE` bila `ownerLastSeenAt` ≤ 180 detik lalu, selain itu `OFFLINE` dengan `lastSeenAt` terakhir atau `null` (TD-02). Cache 30 detik; klien tidak melakukan polling.

### POST /visits

Tanpa `X-RF-Client`. Origin + rate limit tetap berlaku.

Body (`application/json`, atau `text/plain` berisi JSON untuk `sendBeacon`):

```json
{
  "visitId": "6f1a2b3c-4d5e-4f60-8a9b-0c1d2e3f4a5b",
  "entryPath": "/workspace",
  "referrerHost": "google.com"
}
```

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `visitId` | uuid v4 | ya | unik; duplikat → 204 tanpa baris |
| `entryPath` | string | ya | mulai `/`, ≤ 512, tanpa query string |
| `referrerHost` | string\|null | tidak | ≤ 255, tanpa skema/path; `null` untuk direct |

Response `204` tanpa body untuk sukses, duplikat, dan bot. `isOwner` diisi server dari cookie sesi admin valid.

Error: `400 VALIDATION_ERROR` (`visitId`/`entryPath`), `403 FORBIDDEN` (Origin), `429 RATE_LIMITED` (request ke-61/menit, `Retry-After`).

### GET /contact/config

```json
{ "captchaEnabled": true }
```

Dibaca dari `ContactConfiguration.captchaEnabled`. `siteKey` reCAPTCHA berasal dari `VITE_RECAPTCHA_SITE_KEY` di frontend, bukan dari endpoint ini. Cache 60 detik.

### POST /contact

Wajib `X-RF-Client: web`.

```json
{
  "name": "Budi",
  "email": "budi@example.com",
  "message": "Halo, saya ingin bertanya tentang proyek RF Dashboard.",
  "recaptchaToken": "03AGdBq26…",
  "company": "",
  "formAgeMs": 8400
}
```

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `name` | string | ya | 2–80, trim |
| `email` | string | ya | format email, ≤ 254 |
| `message` | string | ya | 20–1000 |
| `recaptchaToken` | string | kondisional | wajib bila `captchaEnabled = true`; ≤ 4096 |
| `company` | string | tidak | honeypot; harus kosong/absen |
| `formAgeMs` | int | ya | ≥ 3000; > 86400000 ditolak |

Response `200 { "ok": true }`. Pesan tidak disimpan di database; dikirim ke `ContactConfiguration.recipientEmail` dengan `replyTo` = email pengunjung dan subjek `<subjectPrefix> <name>` (TD-12).

Error: `400 VALIDATION_ERROR` (field, honeypot terisi, `formAgeMs` < 3000, reCAPTCHA gagal/kedaluwarsa), `429 RATE_LIMITED` (pesan ke-4/jam), `502 UPSTREAM_ERROR` (SMTP gagal/timeout 10 detik; form boleh dikirim ulang), `500 INTERNAL`.

### GET /resume

Response `200` dengan `Content-Type: application/pdf`, `Content-Length` = `Media.bytes`, `Content-Disposition: inline; filename="<originalName>"`. Body = byte PDF dari Cloudinary yang diproksi backend.

Error: `404 NOT_FOUND` bila belum ada `Resume`, `502 UPSTREAM_ERROR` bila Cloudinary gagal, `500 INTERNAL`.

### POST /translate

Tanpa `X-RF-Client`. Detail lengkap di §Translate API.

```json
{ "targetLang": "en", "texts": ["Halo dunia", "Selamat datang"] }
```

```json
{
  "translations": ["Hello world", "Welcome"],
  "degraded": false,
  "skipped": []
}
```

Error: `400 VALIDATION_ERROR` (batch > 50 teks atau total > 5.000 karakter setelah teks oversized dikeluarkan), `429 RATE_LIMITED` (20/menit).

### GET /health

```json
{ "database": "ONLINE", "checkedAt": "2026-11-14T04:05:06.000Z" }
```

`database` = `ONLINE` bila `SELECT 1` berhasil dalam 2 detik, selain itu `OFFLINE`. Selalu `200` agar footer dapat merender status (blueprint §11.3); tidak ada polling. Cache `no-store`.

### GET /sitemap.xml

Root host backend. `Content-Type: application/xml; charset=utf-8`, cache 1 jam (TD-11). Memuat seluruh rute publik statis dan seluruh item koleksi, dengan `lastmod` dari `updatedAt` (timeline memakai `createdAt`).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://rf.example.com/workspace</loc><lastmod>2026-11-14</lastmod></url>
  <url><loc>https://rf.example.com/ai/clx9a2bcdefghijklmnopqrs</loc><lastmod>2026-03-12</lastmod></url>
</urlset>
```

Rute: `/`, `/workspace`, `/ai`, `/ai/:id`, `/tools`, `/tools/:id`, `/websites`, `/websites/:id`, `/projects`, `/tech-stack`, `/learning-journey`, `/setup`, `/timeline`, `/statistics`, `/about`, `/contact`, `/privacy-policy`. `/admin` tidak dimuat.

### GET /robots.txt

`Content-Type: text/plain; charset=utf-8`, cache 1 jam.

```text
User-agent: *
Allow: /
Disallow: /admin
Sitemap: https://rf.example.com/sitemap.xml
```

Origin `https://rf.example.com` berasal dari `FRONTEND_ORIGIN`.

## Admin API

Semua endpoint di bawah `/api/v1/admin` memerlukan cookie `rf_sess` valid (kecuali login) dan `X-RF-Client: web` pada non-GET. `Cache-Control: no-store`. Setiap mutasi sukses menjadwalkan Vercel Deploy Hook dengan debounce 5 menit (TD-11); kegagalan hook tidak menggagalkan response.

**Pola CRUD admin** (berlaku untuk koleksi, kategori, subkategori, social media, projects, tech stack, learning, devices, timeline):

| Method | Path | Sukses | Body |
|---|---|---|---|
| GET | `/admin/<resource>` | 200 | — |
| POST | `/admin/<resource>` | 201 | objek penuh |
| PATCH | `/admin/<resource>/:id` | 200 | partial, key tak dikenal ditolak |
| DELETE | `/admin/<resource>/:id` | 204 | — |

`GET /:id` hanya disediakan untuk koleksi (`/admin/collections/:type/:id`) dan media (`/admin/media/:id`). Resource lain mengirim objek penuh pada list sehingga form edit tidak memerlukan request tambahan.

Query list: `q` (1–80, cari nama/judul), `sort` (`createdAt:desc` default, `createdAt:asc`, `updatedAt:desc`, `name:asc`/`title:asc` bila ada), `limit` (default 24, 1–100), `cursor`. Response `{ items, nextCursor, total }`.

Error standar: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 CONFLICT`.

### Autentikasi

| Method | Path | Fungsi |
|---|---|---|
| POST | `/admin/auth/login` | Buat sesi + `Set-Cookie` |
| POST | `/admin/auth/logout` | Hapus row sesi + cookie |
| GET | `/admin/auth/session` | Validasi sesi + data admin |
| PATCH | `/admin/auth/credentials` | Ganti username/password |
| POST | `/admin/auth/reauth` | Token re-auth 5 menit untuk restore |

**POST /admin/auth/login**

```json
{ "username": "rf", "password": "kata-sandi-panjang" }
```

| Field | Aturan |
|---|---|
| `username` | 3–32, `[a-z0-9._-]` |
| `password` | 1–128 |

`200` → objek `{ admin, session }` (§Autentikasi & Sesi) + `Set-Cookie: rf_sess=…`. Error: `401` kredensial salah (pesan seragam, timing seragam), `429` 5 gagal/15 menit per IP atau lockout akun 15 menit setelah 10 gagal (`details.lockedUntil`, `Retry-After`), `403` CSRF.

**POST /admin/auth/logout** → `204`, `Set-Cookie` kedaluwarsa. Idempoten: tanpa sesi tetap `204` setelah CSRF lolos.

**GET /admin/auth/session** → `200 { admin, session }`. Rotasi sliding dapat mengirim `Set-Cookie` baru. Error `401`.

**PATCH /admin/auth/credentials**

```json
{
  "currentPassword": "kata-sandi-lama",
  "username": "rf-new",
  "password": "kata-sandi-baru-yang-panjang"
}
```

`username` dan `password` keduanya opsional, minimal satu. Aturan: username 3–32 `[a-z0-9._-]` unik; password ≥ 12, ≤ 128, tidak sama dengan username. Response `200`:

```json
{
  "admin": { "id": "clx9a2bcdefghijklmnopqrs", "username": "rf-new", "passwordUpdatedAt": "2026-11-14T04:10:00.000Z" },
  "rotated": true,
  "revokedSessions": 2
}
```

Error: `401` password saat ini salah (`details.field = "currentPassword"`), `409` username sudah dipakai, `400` validasi.

**POST /admin/auth/reauth**

```json
{ "password": "kata-sandi-panjang" }
```

```json
{ "reauthToken": "reauth_…", "expiresAt": "2026-11-14T04:15:00.000Z" }
```

`reauthToken` berlaku 5 menit, sekali pakai, hanya untuk `POST /admin/restore`. Error: `401` password salah, `429` 5 percobaan/15 menit per sesi.

### Overview

**GET /admin/overview** — agregat dashboard; tidak ada data pesan kontak.

```json
{
  "counts": {
    "ai": 24, "tools": 38, "websites": 19, "projects": 12,
    "socialMedia": 7, "techStack": 26, "learningFields": 9,
    "devices": 2, "timelineEntries": 41, "media": 80
  },
  "visitors": {
    "total": 12480,
    "owner": 578,
    "nonOwner": 11902,
    "last30Days": [{ "date": "2026-11-13", "count": 142 }]
  },
  "latest": [
    { "type": "AI", "id": "clx9a2bcdefghijklmnopqrs", "name": "ChatGPT", "createdAt": "2026-11-12T04:05:06.000Z" }
  ],
  "email": { "smtpConfigured": true, "recipientEmail": "owner@example.com", "captchaEnabled": true },
  "system": { "database": "ONLINE", "ownerLastSeenAt": "2026-11-14T04:04:10.000Z" }
}
```

`latest` maksimum 8 item lintas tipe, urut `createdAt DESC`. `last30Days` selalu 30 elemen, hari tanpa kunjungan diisi `0`. Tidak ada inbox, tidak ada activity log.

### Koleksi AI / Tools / Websites

Endpoint kanonik: `/api/v1/admin/collections/:type` dengan `:type` ∈ `ai` | `tools` | `websites`.

| Rute frontend | Endpoint API |
|---|---|
| `/admin/ai` | `/api/v1/admin/collections/ai` |
| `/admin/tools` | `/api/v1/admin/collections/tools` |
| `/admin/websites` | `/api/v1/admin/collections/websites` |

Pemetaan ke enum: `ai` → `AI`, `tools` → `TOOL`, `websites` → `WEBSITE`. Segmen `/admin/ai` adalah rute UI; kontrak API tidak memakai bentuk itu.

| Method | Path | Catatan |
|---|---|---|
| GET | `/admin/collections/:type` | list + `q`, `sort`, `limit`, `cursor` |
| POST | `/admin/collections/:type` | 201 |
| GET | `/admin/collections/:type/:id` | form edit |
| PATCH | `/admin/collections/:type/:id` | partial; `type` immutable |
| DELETE | `/admin/collections/:type/:id` | 204; media tidak dihapus (TD-09) |

Body create/update:

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `categoryId` | cuid2 | ya | harus ada dan `kind` cocok dengan `:type` (AI→`AI`, TOOL→`TOOL`, WEBSITE→`WEBSITE`), selain itu `400` |
| `subcategoryId` | cuid2\|null | tidak | harus milik `categoryId`; pelanggaran → `400` |
| `name` | string | ya | 2–80 |
| `description` | string | ya | 10–600 |
| `logoMediaId` | cuid2 | ya (create) | media harus ada; `null` ditolak |
| `usageStatus` | enum | ya | 4 nilai `UsageStatus` |
| `sourceLocale` | `id`\|`en` | ya | default `id` |
| `links` | array | ya | 1–5 item `{ label 1–40, url https ≤2048 }`; pada PATCH, kirim ulang seluruh array untuk mengganti |

Response list menyertakan `category`, `subcategory`, `logo`, `links`, dan `linksCount` (computed). Urutan default `createdAt DESC, id DESC`.

Error khusus: `400` kategori salah jenis, subkategori bukan milik kategori, media bukan gambar, `links` > 5; `404` item tidak ada atau milik tipe lain (SEC-10); `409` hanya untuk konflik unique, bukan untuk penghapusan — menghapus item tidak menghapus media (TD-09).

### Kategori dan Subkategori

| Method | Path | Catatan |
|---|---|---|
| GET | `/admin/categories` | query `kind`, `q`, `sort`, `limit`, `cursor` |
| POST | `/admin/categories` | 201 |
| PATCH | `/admin/categories/:id` | `kind` tidak dapat diubah |
| DELETE | `/admin/categories/:id` | 409 bila masih dipakai item/proyek |
| GET | `/admin/subcategories` | query `categoryId`, `q`, `limit`, `cursor` |
| POST | `/admin/subcategories` | 201 |
| PATCH | `/admin/subcategories/:id` | `categoryId` tidak dapat diubah |
| DELETE | `/admin/subcategories/:id` | 204; item terkait menjadi `subcategoryId: null` |

**Category body**: `kind` (enum, wajib saat create), `name` 2–60, `description` 0–280 nullable, `sortOrder` int 0–9999 default 0, `sourceLocale` default `id`. Unik `(kind, name)` → `409`.

**Subcategory body**: `categoryId` wajib saat create, `name` 2–60, `sortOrder`, `sourceLocale`. Unik `(categoryId, name)` → `409`.

**DELETE kategori** mengembalikan `409` dengan daftar referensi bila masih dipakai:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Kategori masih digunakan.",
    "details": {
      "references": [
        { "type": "CollectionItem", "id": "clx9a2bcdefghijklmnopqrs", "name": "ChatGPT" }
      ]
    }
  }
}
```

Subkategori milik kategori dihapus cascade; item tidak terhapus.

### Social Media

| Method | Path | Catatan |
|---|---|---|
| GET | `/admin/social-media` | list |
| POST | `/admin/social-media` | 201 |
| PATCH | `/admin/social-media/:id` | partial |
| DELETE | `/admin/social-media/:id` | 204 |

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `platform` | string | ya | 2–40 |
| `username` | string | ya | 1–50, trim |
| `profileUrl` | url | ya | `https`, ≤ 2048, unik → `409` |
| `logoMediaId` | cuid2 | ya | media harus ada |
| `sortOrder` | int | tidak | 0–9999, default 0 |

Tidak ada `sourceLocale`: platform dan username tidak diterjemahkan (TD-15).

### Projects

| Method | Path | Catatan |
|---|---|---|
| GET | `/admin/projects` | list |
| POST | `/admin/projects` | 201 |
| PATCH | `/admin/projects/:id` | partial |
| DELETE | `/admin/projects/:id` | 204 |

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `categoryId` | cuid2 | ya | harus `CategoryKind.PROJECT` |
| `title` | string | ya | 2–80 |
| `description` | string | ya | 10–600 |
| `primaryUrl` | url | ya | `https`, ≤ 2048; tepat satu |
| `coverMediaId` | cuid2\|null | tidak | boleh `null` |
| `sourceLocale` | `id`\|`en` | ya | default `id` |

Tidak ada link sekunder, galeri, atau endpoint detail.

### Tech Stack

| Method | Path | Catatan |
|---|---|---|
| GET | `/admin/tech-stack` | list |
| POST | `/admin/tech-stack` | 201 |
| PATCH | `/admin/tech-stack/:id` | partial |
| DELETE | `/admin/tech-stack/:id` | 204 |

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `name` | string | ya | 2–60 |
| `category` | string | ya | 2–40, contoh `Frontend`, `Backend`, `Infrastructure`, `External Services` |
| `description` | string\|null | tidak | ≤ 280 |
| `logoMediaId` | cuid2\|null | tidak | boleh `null` |
| `primaryUrl` | url\|null | tidak | `https`, ≤ 2048, boleh `null` |
| `sourceLocale` | `id`\|`en` | ya | default `id` |
| `sortOrder` | int | tidak | 0–9999 |

Kombinasi `(category, name)` duplikat → `409` (ditegakkan application layer; schema belum punya unique constraint). `nameSort` dihitung server.

### Learning Journey

| Method | Path | Catatan |
|---|---|---|
| GET | `/admin/learning-journey` | list |
| POST | `/admin/learning-journey` | 201 |
| PATCH | `/admin/learning-journey/:id` | partial |
| DELETE | `/admin/learning-journey/:id` | 204 |

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `name` | string | ya | 2–60, unik → `409` |
| `logoMediaId` | cuid2 | ya | media harus ada |
| `description` | string\|null | tidak | ≤ 280; tidak dirender v1 |
| `sortOrder` | int | tidak | 0–9999 |
| `sourceLocale` | `id`\|`en` | ya | default `id` |

Tidak ada persentase, level, atau progress.

### Devices

| Method | Path | Catatan |
|---|---|---|
| GET | `/admin/devices` | list |
| POST | `/admin/devices` | 201 |
| PATCH | `/admin/devices/:id` | partial |
| DELETE | `/admin/devices/:id` | 204 |

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `name` | string | ya | 2–60 |
| `processor` | string | ya | 1–80 |
| `ram` | string | ya | 1–40 |
| `gpu` | string\|null | tidak | ≤ 80 |
| `storage` | string | ya | 1–80 |
| `operatingSystem` | string | ya | 1–60 |
| `notes` | string\|null | tidak | ≤ 800 |
| `sortOrder` | int | tidak | 0–9999 |

`notes` adalah satu kolom teks, bukan daftar label–nilai (lihat Catatan konsistensi schema butir 3).

### Timeline

| Method | Path | Catatan |
|---|---|---|
| GET | `/admin/timeline` | default sort `date:desc` |
| POST | `/admin/timeline` | 201 |
| PATCH | `/admin/timeline/:id` | partial |
| DELETE | `/admin/timeline/:id` | 204 |

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `date` | `YYYY-MM-DD` | ya | valid, tidak di masa depan, 1970-01-01…2100-12-31 |
| `title` | string | ya | 2–100 |
| `category` | string | ya | 1–40, bebas |
| `description` | string | ya | 10–280 |
| `sourceLocale` | `id`\|`en` | ya | default `id` |

Response tidak memuat `updatedAt`. `sort` yang diterima: `date:desc` (default), `date:asc`, `createdAt:desc`.

### Media

| Method | Path | Catatan |
|---|---|---|
| GET | `/admin/media/folders` | daftar folder + jumlah media |
| GET | `/admin/media` | query `folderId`, `q`, `limit`, `cursor` |
| GET | `/admin/media/:id` | detail + daftar pemakaian |
| POST | `/admin/media/signature` | signature Cloudinary |
| POST | `/admin/media` | commit metadata setelah upload |
| PATCH | `/admin/media/:id` | hanya `alt` dan `sourceLocale` |
| DELETE | `/admin/media/:id` | 204; 409 bila masih dipakai |

`GET /admin/media` — urutan `createdAt DESC, id DESC`; default `limit` 24, max 96 (TD-08).

```json
{
  "items": [
    {
      "id": "cmd4e5fghijklmnopqrstuvw",
      "publicId": "rf/ai/chatgpt",
      "secureUrl": "https://res.cloudinary.com/demo/image/upload/v1/rf/ai/chatgpt.png",
      "format": "png",
      "resourceType": "image",
      "bytes": 84512,
      "width": 512,
      "height": 512,
      "alt": "Logo ChatGPT",
      "originalName": "chatgpt.png",
      "sourceLocale": "id",
      "folderId": "cfolder2abcdefghijklmnop",
      "folder": { "id": "cfolder2abcdefghijklmnop", "name": "AI" },
      "usageCount": 3,
      "createdAt": "2026-03-12T04:05:06.000Z"
    }
  ],
  "nextCursor": null,
  "total": 80
}
```

`GET /admin/media/folders` → `{ "items": [{ "id", "name", "mediaCount" }], "total": 5 }`, urut `name ASC`.

`GET /admin/media/:id` → `MediaRef` + field `usages`:

```json
{
  "usages": [
    { "type": "CollectionItem", "id": "clx9a2bcdefghijklmnopqrs", "name": "ChatGPT", "field": "logoMediaId" }
  ]
}
```

`PATCH /admin/media/:id` body `{ "alt": "…", "sourceLocale": "id" }`. `alt` 0–120 karakter atau `null`. `folderId`, `publicId`, `secureUrl`, dan `bytes` immutable; upaya mengubah → `400 VALIDATION_ERROR`.

`DELETE /admin/media/:id` → `204` hanya menghapus row database; aset Cloudinary tidak disentuh (TD-09). Bila masih direferensikan → `409` dengan `details.references` berisi `{ type, id, name, field }`.

### Profile dan Lokasi

| Method | Path | Catatan |
|---|---|---|
| GET | `/admin/profile` | profil + konfigurasi lokasi/presence |
| PATCH | `/admin/profile` | ubah profil |
| POST | `/admin/site/location` | simpan koordinat + reverse geocode |

**GET /admin/profile** → `200`:

```json
{
  "profile": {
    "id": "clx9a2bcdefghijklmnopqrs",
    "displayName": "RF",
    "tagline": "Builder & technology explorer",
    "bio": "Paragraf bio.",
    "interests": ["AI", "Backend"],
    "goals": ["Membangun dashboard ini"],
    "avatar": null,
    "sourceLocale": "id",
    "updatedAt": "2026-11-13T09:00:00.000Z"
  },
  "site": {
    "defaultLocale": "id",
    "location": {
      "label": "Bandung, ID",
      "lat": -6.917,
      "lng": 107.619,
      "updatedAt": "2026-11-13T09:00:00.000Z",
      "stale": false
    },
    "presence": { "lastSeenAt": "2026-11-14T04:04:10.000Z", "status": "ONLINE" }
  }
}
```

`lat`/`lng` hanya ada di response admin (dibulatkan 3 desimal). Response publik tidak pernah memuatnya.

**PATCH /admin/profile** body partial:

| Field | Tipe | Aturan |
|---|---|---|
| `displayName` | string | 2–60 |
| `tagline` | string\|null | ≤ 80 |
| `bio` | string | 20–1200 |
| `interests` | string[] | 1–12 item, masing-masing 1–40 |
| `goals` | string[] | 1–12 item, masing-masing 1–80 |
| `avatarMediaId` | cuid2\|null | media harus ada |
| `sourceLocale` | `id`\|`en` | — |

Response `200` = bentuk publik `/profile` + `site`. Error `400`, `404` media.

**POST /admin/site/location**

```json
{ "lat": -6.917464, "lng": 107.619123 }
```

Validasi: `lat` −90…90, `lng` −180…180, keduanya angka. Server membulatkan 3 desimal, reverse geocode Nominatim (User-Agent `rf-dashboard/1.0`, cache 7 hari, TD-01), lalu menulis `ownerLat`, `ownerLng`, `ownerLocationLabel`, `ownerLocationUpdatedAt` dalam satu update.

```json
{
  "lat": -6.917,
  "lng": 107.619,
  "label": "Bandung, ID",
  "updatedAt": "2026-11-14T04:05:06.000Z"
}
```

Error: `400` koordinat di luar rentang, `502 UPSTREAM_ERROR` bila geocoding gagal (tidak ada penulisan parsial), `429` (10/menit).

### CV

| Method | Path | Catatan |
|---|---|---|
| GET | `/admin/cv` | metadata CV aktif |
| PUT | `/admin/cv` | pasang media PDF sebagai CV |
| DELETE | `/admin/cv` | hapus row `Resume` |

**GET /admin/cv** → `200 { "media": MediaRef | null, "updatedAt": string | null }`. Tidak ada CV bukan `404`.

**PUT /admin/cv** body `{ "mediaId": "cmd4e5fghijklmnopqrstuvw" }`.

| Validasi | Aturan |
|---|---|
| Media ada | `404 NOT_FOUND` |
| `format` | `pdf`, selain itu `400` |
| `bytes` | ≤ 10 MB (TD-14) |
| Magic bytes | server memverifikasi `%PDF-` pada byte awal aset; gagal → `400` |
| Folder | `Profile` |
| Efek | upsert satu row `Resume`; media lama tetap ada (TD-09) |

Response `200 { media, updatedAt }`. **DELETE /admin/cv** → `204`; media tidak dihapus.

### Visitor Statistics

**GET /admin/visitors**

| Query | Nilai | Default |
|---|---|---|
| `days` | `7` \| `30` | `30` |

```json
{
  "totals": { "all": 12480, "owner": 578, "visitor": 11902 },
  "daily": [{ "date": "2026-11-13", "count": 142, "owner": 12 }],
  "topEntryPaths": [{ "path": "/workspace", "count": 4102 }],
  "topReferrerHosts": [{ "host": "google.com", "count": 2140 }, { "host": null, "count": 1902 }],
  "generatedAt": "2026-11-14T04:05:06.000Z"
}
```

`daily` selalu tepat `days` elemen (hari kosong = 0). `topEntryPaths` dan `topReferrerHosts` maksimum 10 baris. `totals` kumulatif, bukan dibatasi `days`. Tidak ada daftar per-event, IP, atau user agent.

### Email Configuration

| Method | Path | Catatan |
|---|---|---|
| GET | `/admin/email` | konfigurasi + status SMTP |
| PATCH | `/admin/email` | ubah 4 field yang diizinkan |
| POST | `/admin/email/test` | kirim email uji |

**GET /admin/email**

```json
{
  "smtpConfigured": true,
  "recipientEmail": "owner@example.com",
  "fromName": "RF",
  "subjectPrefix": "[RF Contact]",
  "captchaEnabled": true,
  "updatedAt": "2026-11-13T09:00:00.000Z"
}
```

`smtpConfigured` dihitung dari kelengkapan `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `ADMIN_EMAIL`. Kredensial SMTP tidak pernah dikembalikan, tidak dapat diedit lewat API (TD-12).

**PATCH /admin/email** body partial: `recipientEmail` (email valid, ≤ 254), `fromName` (2–80), `subjectPrefix` (1–40), `captchaEnabled` (boolean). Key lain → `400 VALIDATION_ERROR`. Response `200` = bentuk GET.

**POST /admin/email/test** body `{}`. Mengirim email uji ke `recipientEmail` dengan `fromName` dan `subjectPrefix` aktif. `200 { "sentAt": "…", "to": "owner@example.com" }`. Error: `502 UPSTREAM_ERROR` (SMTP gagal/timeout 10 detik), `409 CONFLICT` bila `smtpConfigured = false`, `429` (3/jam per sesi).

### Backup dan Restore

| Method | Path | Catatan |
|---|---|---|
| POST | `/admin/backup` | stream unduhan `.sql` |
| GET | `/admin/backup/status` | kapabilitas + batas |
| POST | `/admin/restore` | multipart + `reauthToken` |

Detail lengkap di §Backup & Restore API.

### Presence Heartbeat

**POST /admin/presence/heartbeat** — tanpa body. Menulis `SiteConfiguration.ownerLastSeenAt = now()`. `204`. Dipanggil 60 detik saat tab visible, 5 menit saat `document.hidden` (TD-02). Error: `401`, `403`, `429` (10/menit per sesi).

## Media Upload Flow

Signed direct upload (TD-14). Browser tidak pernah memegang `CLOUDINARY_API_SECRET`.

```text
1. POST /admin/media/signature        → parameter bertanda tangan
2. Browser → Cloudinary (langsung)    → public_id, secure_url, metadata
3. POST /admin/media                  → verifikasi server + row Media
4. GET  /admin/media                  → daftar, reuse
5. DELETE /admin/media/:id            → DB saja (409 bila dipakai)
```

### 1. Signature

**POST /admin/media/signature**

```json
{
  "folderId": "cfolder2abcdefghijklmnop",
  "kind": "logo-svg",
  "bytes": 148213,
  "originalName": "react.svg"
}
```

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `folderId` | cuid2 | ya | harus salah satu dari lima folder tetap |
| `kind` | enum | ya | `raster` \| `logo-svg` \| `pdf` |
| `bytes` | int | tidak | bila dikirim, harus ≤ batas `kind` → `400` lebih awal |
| `originalName` | string | tidak | 1–200; dipakai sebagai hint nama file |

Response `200` — delapan field ini adalah payload persis yang dikirim ke Cloudinary. Nama field memakai snake_case karena ditentukan Cloudinary, bukan konvensi API.

```json
{
  "folder": "rf/ai",
  "allowed_formats": "svg",
  "max_file_size": 524288,
  "timestamp": 1763097600,
  "signature": "c1f0e5d2b9a8476f3e0d1c2b3a495867e0f1d2c3",
  "apiKey": "123456789012345",
  "cloudName": "rf-dashboard",
  "uploadUrl": "https://api.cloudinary.com/v1_1/rf-dashboard/auto/upload"
}
```

| Field | Asal |
|---|---|
| `folder` | peta folder tetap (tabel di bawah) |
| `allowed_formats` | daftar format sesuai `kind`, dipisah koma |
| `max_file_size` | batas byte sesuai `kind` (TD-14) |
| `timestamp` | unix detik saat signature dibuat; kedaluwarsa 10 menit |
| `signature` | SHA-1 dari parameter terurut (`folder`, `allowed_formats`, `max_file_size`, `timestamp`) + `CLOUDINARY_API_SECRET` |
| `apiKey` | `CLOUDINARY_API_KEY` |
| `cloudName` | `CLOUDINARY_CLOUD_NAME` |
| `uploadUrl` | endpoint upload Cloudinary yang sesuai cloud |

`signature` hanya berlaku untuk empat parameter bertanda tangan di atas; client tidak boleh menambahkan parameter lain yang memengaruhi path (`public_id` ditentukan Cloudinary dan dikembalikan pada respons upload).

### 2. Peta folder, format, dan batas

| `kind` | Folder diizinkan | Cloudinary `folder` | `allowed_formats` | `max_file_size` |
|---|---|---|---|---|
| `raster` | AI, Tools, Websites, Projects, Profile | `rf/ai`, `rf/tools`, `rf/websites`, `rf/projects`, `rf/profile` | `png,jpg,jpeg,webp,avif` | 5242880 (5 MB) |
| `logo-svg` | AI, Tools, Websites, Profile | sesuai folder | `svg` | 524288 (512 KB) |
| `pdf` | Profile | `rf/profile` | `pdf` | 10485760 (10 MB) |

`logo-svg` ditolak untuk folder `Projects` (cover bukan logo). Audio dan video tidak diizinkan dalam bentuk apa pun; hanya URL eksternal (TD-14).

### 3. Direct upload

```bash
curl -X POST "https://api.cloudinary.com/v1_1/rf-dashboard/auto/upload" \
  -F "file=@react.svg" \
  -F "folder=rf/ai" \
  -F "allowed_formats=svg" \
  -F "max_file_size=524288" \
  -F "timestamp=1763097600" \
  -F "signature=c1f0e5d2b9a8476f3e0d1c2b3a495867e0f1d2c3" \
  -F "api_key=123456789012345"
```

Cloudinary mengembalikan `public_id`, `secure_url`, `format`, `resource_type`, `bytes`, `width`, `height`. Nilai ini dikirim ke langkah commit.

### 4. Commit

**POST /admin/media**

```json
{
  "folderId": "cfolder2abcdefghijklmnop",
  "publicId": "rf/ai/react",
  "secureUrl": "https://res.cloudinary.com/rf-dashboard/image/upload/v1/rf/ai/react.svg",
  "format": "svg",
  "resourceType": "image",
  "bytes": 148213,
  "width": null,
  "height": null,
  "originalName": "react.svg",
  "alt": "Logo React",
  "sourceLocale": "id"
}
```

Verifikasi server berurutan; gagal di langkah mana pun → tidak ada row `Media`.

1. **Autentikasi + CSRF** (`401`/`403`).
2. **Folder cocok**: prefix `publicId` harus `rf/<folder>` milik `folderId`; pelanggaran → `400`, `details.reason = "folder_mismatch"`.
3. **Ambil metadata aset dari Cloudinary** berdasarkan `publicId`. Aset tidak ditemukan → `400`, `details.reason = "asset_not_found"`. Cloudinary tidak dapat dihubungi → `502 UPSTREAM_ERROR`.
4. **Bandingkan** `format`, `resource_type`, `bytes`, `width`, `height` hasil Cloudinary dengan body. Body hanya hint; nilai otoritatif dari Cloudinary. Selisih `bytes` > 0 atau `format` berbeda → `400`, `details.reason = "metadata_mismatch"`.
5. **Batas TD-14** terhadap metadata Cloudinary, bukan body: raster ≤ 5 MB, SVG ≤ 512 KB, PDF ≤ 10 MB. Pelanggaran → `400`, `details.reason = "file_too_large"` atau `"format_not_allowed"`.
6. **SVG**: unduh aset, sanitasi dengan DOMPurify + jsdom. `<script>`, atribut `on*`, `foreignObject`, `javascript:`, dan referensi eksternal dihapus. Bila hasil sanitasi berbeda, server menimpa aset di `publicId` yang sama. Bila sanitizer gagal/parse error → `400`, `details.reason = "svg_rejected"`; aset Cloudinary dibiarkan yatim.
7. **PDF**: verifikasi magic bytes `%PDF-` pada 5 byte pertama. Gagal → `400`, `details.reason = "pdf_magic_invalid"`.
8. **Duplikat**: `publicId` sudah ada → `409 CONFLICT`.
9. **Simpan** row `Media` (`sourceLocale` default `id`, `originalName` fallback nama file dari `publicId`, `alt` opsional 0–120).

Response `201` = `MediaRef`.

### 5. Batas dan penanganan khusus

| Kasus | Perilaku |
|---|---|
| File > batas di browser | Ditolak sebelum upload (validasi `File.size`); tidak ada signature |
| Signature kedaluwarsa | Cloudinary menolak; client minta signature baru |
| Multi-file | Antrean berurutan, maksimum 10 file per batch; satu commit per file |
| Media dipakai ulang | `logoMediaId`/`coverMediaId`/`avatarMediaId` menunjuk row `Media` yang sama; tidak ada duplikasi |
| Hapus media terpakai | `409` + `details.references`; aset Cloudinary tetap |
| Hapus media bebas | `204`, row DB hilang, aset Cloudinary tetap (TD-09) |
| Aset hilang di Cloudinary | Thumbnail fallback di UI; row `Media` tidak dihapus otomatis |
| SVG gagal sanitasi | `400`; aset Cloudinary yatim, pembersihan manual |

Aplikasi tidak pernah memanggil Cloudinary Destroy API (TD-09).

---

## Backup & Restore API

TD-13. Tidak ada backup terjadwal dan tidak ada penyimpanan backup di server.

### GET /admin/backup/status

```json
{
  "pgDumpAvailable": true,
  "psqlAvailable": true,
  "database": "ONLINE",
  "backupMaxBytes": 104857600,
  "restoreMaxBytes": 104857600,
  "restoreWebMaxBytes": 83886080,
  "restoreTimeoutSeconds": 240,
  "snapshotRetentionHours": 24
}
```

`database` memakai cek yang sama dengan `/health`. `restoreWebMaxBytes` = 80 MB, ambang arahan CLI.

### POST /admin/backup

Tanpa re-auth. Response `200` stream:

| Header | Nilai |
|---|---|
| `Content-Type` | `application/sql; charset=utf-8` |
| `Content-Disposition` | `attachment; filename="rf-backup-YYYYMMDD-HHmm.sql"` |
| `Cache-Control` | `no-store` |
| `Transfer-Encoding` | `chunked` |

Perintah: `pg_dump --format=plain --no-owner --no-privileges --clean --if-exists --no-comments`, tanpa `-C`, di-stream langsung (TD-13).

Error sebelum streaming: `401`, `403`, `413 PAYLOAD_TOO_LARGE` bila `pg_database_size` > 100 MB (`details.maxBytes`, arahkan CLI), `502 UPSTREAM_ERROR` bila `pg_dump` gagal start, `409 CONFLICT` bila backup lain sedang berjalan. Error setelah streaming dimulai tidak dapat mengubah status HTTP; koneksi diputus dan kegagalan dicatat di log server.

### POST /admin/restore

`multipart/form-data`:

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `file` | file | ya | `.sql`, ≤ 80 MB untuk jalur web (hard cap 100 MB saat parsing) |
| `reauthToken` | string | ya | dari `POST /admin/auth/reauth`, umur ≤ 5 menit, sekali pakai |

Urutan eksekusi:

1. **CSRF + sesi** → `401`/`403`.
2. **Re-auth** → token tidak valid/kedaluwarsa/sudah dipakai → `403 FORBIDDEN`, `details.reason = "reauth_required"`. Tidak ada snapshot.
3. **Ukuran** → > 80 MB → `413`, `details.fallback = "npm run restore -- <file.sql>"`; > 100 MB → `413` sebelum membaca body.
4. **Validasi isi** → header dump PostgreSQL, hanya perintah SQL; tolak `\!`, `\connect`, `CREATE DATABASE`, `ALTER SYSTEM`, `COPY ... FROM PROGRAM`. Pelanggaran → `400 VALIDATION_ERROR`, `details.reason` menyebut aturan yang dilanggar. Tidak ada eksekusi.
5. **Snapshot wajib** → `pg_dump` ke `/tmp/pre-restore-<ts>.sql`. Gagal → `500 INTERNAL`, `details.stage = "snapshot"`; restore dibatalkan, DB tidak berubah.
6. **Eksekusi** → `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` lalu `psql "$DATABASE_URL" --single-transaction -v ON_ERROR_STOP=1 -f <file>`. Error SQL → rollback otomatis oleh `--single-transaction`; `400` bila pelanggaran constraint/data, `500 INTERNAL` bila kegagalan server.
7. **Verifikasi** → `_prisma_migrations` ada dan versi terakhir cocok dengan binary; hitung row tabel inti. Gagal → restore snapshot otomatis, `500 INTERNAL`, `details.stage = "verification"`, `details.rolledBack = true`.
8. **Selesai** → snapshot dihapus. Snapshot disimpan 24 jam bila gagal (`/tmp`, ephemeral).

Response sukses `200`:

```json
{
  "restored": true,
  "filename": "rf-backup-20261114-2130.sql",
  "bytes": 18432000,
  "durationMs": 41250,
  "migration": { "latest": "20261114093000_init", "matched": true },
  "counts": { "collection_items": 81, "projects": 12, "media": 80 }
}
```

| Kondisi | Status | `details.stage` |
|---|---|---|
| Re-auth tidak valid | 403 | — |
| File > 80 MB | 413 | — |
| File > 100 MB | 413 | — |
| Header/isi SQL ditolak | 400 | `validation` |
| Snapshot gagal | 500 | `snapshot` |
| Error SQL saat restore | 400 | `execution` |
| Verifikasi pasca-commit gagal | 500 | `verification` |
| Melebihi 240 detik | 500 | `timeout` |
| Restore lain berjalan | 409 | — |

Timeout dan file besar memakai jalur CLI: `npm run restore -- <file.sql>` melalui Railway Shell (TD-13). Restore menghentikan layanan sementara; klien harus menonaktifkan navigasi selama proses.

---

## Translate API

TD-04. Proxy DeepL API Free, tanpa cache, hanya in-flight coalescing.

**POST /api/v1/translate** — publik, tanpa `X-RF-Client`, Origin tetap divalidasi.

```json
{ "targetLang": "en", "texts": ["Halo dunia", "Selamat datang di RF"] }
```

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `targetLang` | `id`\|`en` | ya | bahasa tujuan |
| `texts` | string[] | ya | 1–50 item; total ≤ 5.000 karakter setelah teks oversized dikeluarkan |
Response `200`:

```json
{
  "translations": ["Hello world", "Welcome to RF"],
  "degraded": false,
  "skipped": []
}
```

`skipped` = array indeks (integer) dari `texts` yang tidak diterjemahkan. `translations` selalu sepanjang `texts`.

Aturan:

1. **Batas batch.** Lebih dari 50 teks → `400 VALIDATION_ERROR`. Total karakter (setelah teks > 5.000 karakter dikeluarkan) > 5.000 → `400`.
2. **Teks tunggal > 5.000 karakter** tidak diterjemahkan dan tidak menggagalkan request: dikembalikan apa adanya, indeksnya masuk `skipped`, `degraded: true` bila ada item lain yang tetap diterjemahkan. Bila semua item di-skip, response `200` dengan teks asli.
3. **Urutan** `translations` sama dengan `texts`. Panjang array selalu sama.
4. **Tanpa cache.** Request identik yang bersamaan digabung (in-flight coalescing), tidak disimpan setelah selesai.
5. **Timeout 5 detik** di server, 6 detik di klien. Timeout → `200` dengan teks asli + `degraded: true`.
6. **Provider 429 / kuota habis** → `200` dengan teks asli + `degraded: true`. Bukan `429` dari API kita.
7. **Rate limit API kita**: 20 request/menit/IP → `429 RATE_LIMITED`, `Retry-After`. Klien menampilkan teks asli.
8. **Kegagalan sebagian** tidak mungkin: satu request DeepL untuk seluruh batch. Gagal → semua teks asli.
9. **Cakupan field** mengikuti TD-15; endpoint tidak memfilter isi, pemanggil hanya mengirim field yang diizinkan. String UI memakai kamus statis, bukan endpoint ini.
10. `sourceLang` tidak dikirim; DeepL mendeteksi otomatis. `detectedSourceLang` tidak dikembalikan.

Error: `400 VALIDATION_ERROR`, `429 RATE_LIMITED`, `403 FORBIDDEN` (Origin), `500 INTERNAL`.

## Rate Limits

Nilai bertanda **†** adalah default operasional; TD tidak menetapkannya. Nilai dapat diubah lewat environment tanpa mengubah kontrak. Penyimpanan penghitung in-memory per instance backend; bila Railway menjalankan lebih dari satu instance, pindahkan ke penyimpanan bersama (CL-12).

| Endpoint | Kunci | Limit | Jendela | Sumber |
|---|---|---|---|---|
| `POST /admin/auth/login` | IP | 5 gagal | 15 menit | TD-06 |
| `POST /admin/auth/login` | akun | 10 gagal → lockout 15 menit | 15 menit | TD-06 |
| `POST /admin/auth/reauth` | sesi | 5 | 15 menit | † |
| `POST /contact` | IP | 3 | 1 jam | TD-12 |
| `POST /visits` | IP | 60 | 1 menit | TD-03 |
| `POST /translate` | IP | 20 | 1 menit | TD-04 |
| `GET /search` | IP | 60 | 1 menit | † |
| `GET /resume` | IP | 60 | 1 menit | † |
| `GET /health`, `/sitemap.xml`, `/robots.txt` | IP | 60 | 1 menit | † |
| `GET` publik lain | IP | 300 | 1 menit | † |
| `GET /admin/**` | sesi | 240 | 1 menit | † |
| `POST/PATCH/PUT/DELETE /admin/**` | sesi | 60 | 1 menit | † |
| `POST /admin/media/signature` | sesi | 30 | 1 menit | † |
| `POST /admin/site/location` | sesi | 10 | 1 menit | † |
| `POST /admin/backup` | sesi | 3 | 1 jam | † |
| `POST /admin/restore` | sesi | 3 | 1 jam | † |
| `POST /admin/email/test` | sesi | 3 | 1 jam | † |
| `POST /admin/presence/heartbeat` | sesi | 10 | 1 menit | † |

Perilaku:

1. Kuota dihitung per endpoint, bukan gabungan.
2. `429` menyertakan `Retry-After`, `RateLimit-Reset`, dan `details.retryAfterSeconds`.
3. Login memakai delay progresif; lockout akun mengembalikan `details.lockedUntil` dan berlaku lintas IP.
4. Login sukses mereset penghitung gagal untuk IP dan akun.
5. `POST /visits` yang terkena limit tetap `429` (CL-13); klien mengabaikan kegagalan ini.
6. Rate limit tidak dihitung untuk preflight `OPTIONS`.

---

## Traceability

| Endpoint | RF |
|---|---|
| `GET /profile` | RF-001, RF-003 |
| `GET /statistics` | RF-023 |
| `GET /visitor-count` | RF-024 |
| `GET /presence` | — (TD-02, indikator footer) |
| `GET /health` | — (blueprint §11.3, indikator footer) |
| `GET /categories`, `GET /subcategories` | RF-006, RF-007 |
| `GET /collections/:type/sections` | RF-006, RF-007, RF-014, RF-023 |
| `GET /collections/:type` | RF-007, RF-009, RF-014 |
| `GET /collections/:type/:id` | RF-007, RF-008, RF-009, RF-029 |
| `GET /social-media` | RF-014 |
| `GET /projects` | RF-014 |
| `GET /tech-stack` | RF-014 |
| `GET /learning-journey` | RF-014 |
| `GET /devices` | RF-014 |
| `GET /timeline` | RF-014 |
| `GET /search` | RF-010, RF-011, RF-012 |
| `POST /visits` | RF-003, RF-024 |
| `GET /contact/config`, `POST /contact` | RF-025 |
| `GET /resume` | RF-026 |
| `POST /translate` | RF-020 |
| `GET /sitemap.xml`, `GET /robots.txt` | RF-030 |
| `POST /admin/auth/login`, `/logout` | RF-017, RF-018 |
| `GET /admin/auth/session` | RF-018 |
| `PATCH /admin/auth/credentials` | RF-017, RF-018 |
| `GET /admin/overview` | RF-013, RF-023, RF-024 |
| `GET/POST/PATCH/DELETE /admin/collections/:type[/:id]` | RF-007, RF-013, RF-014, RF-015, RF-016 |
| `GET/POST/PATCH/DELETE /admin/categories[/:id]` | RF-006, RF-013, RF-014 |
| `GET/POST/PATCH/DELETE /admin/subcategories[/:id]` | RF-006, RF-013, RF-014 |
| `GET/POST/PATCH/DELETE /admin/social-media[/:id]` | RF-013, RF-014 |
| `GET/POST/PATCH/DELETE /admin/projects[/:id]` | RF-013, RF-014 |
| `GET/POST/PATCH/DELETE /admin/tech-stack[/:id]` | RF-013, RF-014 |
| `GET/POST/PATCH/DELETE /admin/learning-journey[/:id]` | RF-013, RF-014 |
| `GET/POST/PATCH/DELETE /admin/devices[/:id]` | RF-013, RF-014 |
| `GET/POST/PATCH/DELETE /admin/timeline[/:id]` | RF-013, RF-014 |
| `GET /admin/media`, `GET /admin/media/folders`, `GET /admin/media/:id` | RF-015 |
| `POST /admin/media/signature`, `POST /admin/media`, `PATCH /admin/media/:id` | RF-015, RF-016 |
| `DELETE /admin/media/:id` | RF-016 |
| `GET/PATCH /admin/profile` | RF-013, RF-014 |
| `POST /admin/site/location` | — (TD-01) |
| `GET /admin/cv`, `PUT /admin/cv`, `DELETE /admin/cv` | RF-015, RF-026 |
| `GET /admin/visitors` | RF-024 |
| `GET/PATCH /admin/email`, `POST /admin/email/test` | RF-025 |
| `POST /admin/backup` | RF-027 |
| `GET /admin/backup/status` | RF-027, RF-028 |
| `POST /admin/restore` | RF-028 |
| `POST /admin/auth/reauth` | RF-028 |
| `POST /admin/presence/heartbeat` | — (TD-02) |

RF yang tidak punya endpoint sendiri: RF-001/002/003 (Welcome Screen, murni UI + data di atas), RF-004/005 (shell/drawer), RF-019 (tema, sessionStorage), RF-021/022 (audio), RF-029 (404, frontend + `404` dari endpoint detail). RF-030 dipenuhi endpoint sitemap/robots + metadata prerender.

---

## Perubahan dari Blueprint

### Endpoint ditambah

| Endpoint | Alasan |
|---|---|
| `GET /collections/:type/sections` | `/ai`, `/tools`, `/websites` merender section per kategori dengan Load More sendiri (TD-08); satu request untuk mount halaman |
| `GET /collections/:type/:id` | Blueprint §7.4 tidak punya endpoint detail; RF-007/008/009 memerlukannya, termasuk `prevId`/`nextId` |
| `GET /categories`, `GET /subcategories` | Header kategori, breadcrumb, dan selektor admin memerlukan taksonomi publik; blueprint hanya menyebut model |
| `GET /contact/config` | `captchaEnabled` dapat diubah admin; form perlu tahu apakah widget reCAPTCHA dirender |
| `GET /presence` | TD-02 butir 5 menetapkan endpoint publik yang tidak ada di §7.4 |
| `POST /admin/presence/heartbeat` | TD-02 butir 1 |
| `GET /health` | Blueprint §11.3 mewajibkan indikator status DB tanpa menetapkan endpoint |
| `POST /translate` | TD-04 menetapkan proxy; tidak ada di §7.4 |
| `POST /admin/auth/reauth` | TD-13 mewajibkan re-autentikasi sebelum restore |
| `GET /admin/visitors` | Layar `/admin/visitors` butuh agregat; §7.4 hanya menyebut overview |
| `GET/PATCH /admin/email`, `POST /admin/email/test` | Gap decision: empat field dapat diedit + tombol test; §7.4 tidak merinci |
| `GET /admin/backup/status` | UI perlu kapabilitas `pg_dump`/`psql` dan batas sebelum memulai |
| `GET/PUT/DELETE /admin/cv` | §7.4 hanya punya `GET /resume` publik; penggantian CV butuh endpoint admin |
| `GET /admin/media/folders`, `GET /admin/media/:id`, `PATCH /admin/media/:id` | Tab folder, info panel "dipakai oleh", dan edit ALT pada Media Library |
| `POST /admin/site/location` | TD-01 butir 2 mewajibkan pembaruan lokasi manual dari admin |
| `GET /sitemap.xml`, `GET /robots.txt` | TD-11 butir 6; di root backend, bukan `/api/v1` |

### Endpoint diganti atau distandarkan

| Blueprint | Menjadi | Alasan |
|---|---|---|
| `POST /admin/ai`, `PATCH/DELETE /admin/ai/:id` | `/admin/collections/:type[/:id]` dengan `type=ai` | Satu controller untuk tiga tipe; rute frontend `/admin/ai`, `/admin/tools`, `/admin/websites` memetakan ke sini |
| `POST /admin/tools`, `/admin/websites` (tanpa PATCH/DELETE) | CRUD penuh per tipe | CL-15: CMS menuntut CRUD lengkap |
| `POST /admin/social-media`, `/projects`, `/timeline` (tanpa PATCH/DELETE) | CRUD penuh | CL-15 |
| — | `/admin/tech-stack` | Tech Stack sebelumnya tidak punya layar/CRUD; model `TechStackItem` ditetapkan sebagai gap decision |
| — | `/admin/learning-journey`, `/admin/devices` | Model ada dan layar admin ada, endpoint tidak dirinci di §7.4 |
| — | `/admin/categories`, `/admin/subcategories` | Panel "Kelola Kategori" memerlukan CRUD taksonomi |
| `GET /admin/overview` | tetap, isi diubah | Tanpa data pesan masuk; hanya status konfigurasi email + tombol test (gap decision) |
| `POST /admin/backup`, `POST /admin/restore` | tetap, kontrak diperjelas | Butuh status, batas ukuran, re-auth, dan pemetaan error |
| `POST /api/v1/visits` | tetap, menerima `text/plain` berisi JSON | `sendBeacon` lintas-origin dengan `application/json` memicu preflight yang tidak dapat ditangani beacon |
| `POST /api/v1/contact` | tetap, wajib `X-RF-Client` | Bukan pengecualian CSRF; hanya `/visits` dan `/translate` yang dikecualikan |

### Tidak dibuat

| Item | Keputusan |
|---|---|
| Rute publik Social Media (`/social-media`) | Tidak ada; dirender sebagai section `/workspace`, data dari `GET /social-media` |
| Endpoint CMS Privacy Policy | Tidak ada; halaman statis di kode |
| Endpoint inbox/pesan kontak | Tidak ada; pesan tidak disimpan, hanya dikirim via SMTP |
| Endpoint upload audio/video | Tidak ada; media hanya URL eksternal |
| Endpoint hapus aset Cloudinary | Tidak ada; aplikasi tidak pernah memanggil Destroy API (TD-09) |
| Endpoint draft/publish, bulk, trash, duplicate | Tidak ada; simpan = langsung publik |
| Endpoint activity log / audit trail | Tidak ada; dilarang blueprint |
| Endpoint backup terjadwal / riwayat backup | Tidak ada; backup manual, tanpa penyimpanan server |

### Butir terbuka

| # | Butir | Dampak | Usulan |
|---|---|---|---|
| 1 | `TechStackItem` belum ada di `prisma/schema.prisma` | Seluruh §Tech Stack gagal diimplementasi | Tambahkan model sesuai bentuk di §Catatan konsistensi schema butir 1 |
| 2 | `Device.notes` tidak dapat menyimpan daftar label–nilai | UI "spesifikasi lain" maks 8 baris tidak terpenuhi | Tambah model `DeviceSpec` atau ubah kontrak menjadi satu blok teks |
| 3 | `Profile.locationLabel` vs `SiteConfiguration.ownerLocationLabel` | Dua sumber lokasi | Tetapkan `SiteConfiguration` (TD-01); tandai `Profile.locationLabel` deprecated |
| 4 | `reauthToken` memakai nonce in-memory | Gagal bila backend multi-instance | Paksa satu instance atau pindahkan nonce ke penyimpanan bersama |
| 5 | Honeypot dan time-trap: 400 vs "200 palsu" | `ui-wireframe-spec.md` §4.16 menulis silent 200; `acceptance-test-plan.md` SEC-29 mengharapkan 400 | Kontrak ini memilih `400 VALIDATION_ERROR` agar dapat diuji; perlu konfirmasi |
| 6 | `LearningField.description` dan `Category.description` ada di schema tetapi tidak dirender | Data bisa terisi tanpa terlihat | Konfirmasi apakah field dipakai atau dihapus dari schema |
| 7 | Folder media untuk CV, logo social media, logo learning | Tidak ada folder khusus | Ditampung di folder `Profile`; konfirmasi bila perlu folder baru |
| 8 | Batas `limit` maksimum (48/100/96) | TD-08 hanya menetapkan langkah, bukan plafon | Nilai operasional; dapat disetel tanpa perubahan kontrak |

