# RF PERSONAL TECH DASHBOARD — Product & Technical Blueprint

**Brand:** RF  
**Document Version:** 1.0  
**Project Type:** Personal Technology Showcase & Interactive Dashboard  
**Status:** Approved Specification / Technical Decisions Pending  
**Primary Audience:** Friends and Community

> Catatan: Technical Decision Register sudah diselesaikan dan bersifat mengikat. Lihat `docs/technical-decisions.md`. Bila ada konflik, TD menang.

---

# 1. PROJECT OVERVIEW

## 1.1 Project Description

RF Personal Tech Dashboard adalah website interaktif yang berfungsi sebagai pusat informasi mengenai perjalanan, aktivitas, eksperimen, dan ekosistem teknologi pemilik website.

Website memungkinkan pengunjung melihat:

- AI yang pernah atau sedang digunakan.
- Tools dan aplikasi yang pernah digunakan.
- Website dan platform yang digunakan.
- Social Media.
- Projects yang pernah dibuat.
- Tech Stack yang digunakan untuk membangun RF.
- Learning Journey.
- Setup & Devices.
- Timeline aktivitas teknologi.
- Statistik keseluruhan.

RF bukan sekadar portofolio biasa. Website dirancang sebagai ruang eksplorasi teknologi dengan pendekatan Experimental Spatial UI, animasi intensif, dan interaksi visual.

## 1.2 Project Objectives

1. Menampilkan inventaris teknologi pemilik secara terstruktur.
2. Mendokumentasikan perjalanan penggunaan AI dan tools.
3. Menampilkan proyek dan eksperimen teknologi.
4. Menjadi identitas digital pemilik.
5. Menyediakan CMS agar seluruh konten dinamis dapat dikelola tanpa mengedit source code.
6. Menyediakan pengalaman eksplorasi yang menarik di desktop maupun mobile.

## 1.3 Product Scope

**Termasuk:**
- Public Website.
- Admin Dashboard.
- Content Management System.
- Media Library.
- Authentication.
- Database.
- Visitor Counter.
- Timeline.
- Statistics.
- Contact Form.
- Backup & Restore.
- SEO dan Open Graph.
- Bilingual content presentation.
- Audio dan theme controls.

**Tidak termasuk:**
- PWA.
- Komentar, rating, review, atau favorit pengunjung.
- External analytics.
- Activity Log.
- Maintenance Mode.
- Halaman sertifikat dan pendidikan.
- Sistem multi-admin.
- Sistem draft dan preview.

---

# 2. INFORMATION ARCHITECTURE

## 2.1 Sitemap

```text
RF WEBSITE
│
├── Welcome Screen
│
├── Public Workspace
│   │
│   ├── AI Collection
│   │   ├── AI Categories
│   │   └── AI Detail
│   │
│   ├── Tools Collection
│   │   ├── Tool Categories
│   │   └── Tool Detail
│   │
│   ├── Website Collection
│   │   ├── Website Categories
│   │   └── Website Detail
│   │
│   ├── Social Media
│   │
│   ├── Projects
│   │
│   ├── Tech Stack
│   │
│   ├── Learning Journey
│   │
│   ├── Setup & Devices
│   │
│   ├── Timeline
│   │
│   ├── Statistics
│   │
│   ├── About Me
│   │
│   └── Contact
│       └── Privacy Policy
│
├── Custom 404
│
└── Admin Dashboard
    │
    ├── Overview
    ├── AI Management
    ├── Tools Management
    ├── Website Management
    ├── Social Media Management
    ├── Projects Management
    ├── Learning Journey Management
    ├── Setup & Devices Management
    ├── Timeline Management
    ├── Media Library
    ├── Profile Management
    ├── CV Management
    ├── Visitor Statistics
    ├── Email Configuration
    ├── Backup & Restore
    ├── Authentication Settings
    └── Individual Configuration Pages
```

## 2.2 Navigation Structure

Public navigation menggunakan sidebar dengan:

- Logo RF.
- Nama brand.
- Daftar halaman.
- Theme Switcher.
- Language Switcher.
- Music Player.
- Tombol hide sidebar.

Header workspace berisi:

- Breadcrumb.
- Global Search.
- Jam lokal.
- Status indicator.

Sidebar desktop dapat menghilang sepenuhnya. Tombol floating di sisi kiri selalu tersedia untuk membukanya kembali.

Pada mobile, sidebar menjadi drawer dari kiri. Drawer menutupi sebagian layar dengan backdrop gelap dan dapat ditutup melalui tombol X, tap backdrop, atau swipe ke kiri.

## 2.3 URL Strategy

URL menggunakan ID, bukan slug SEO.

```text
/
/workspace
/ai
/ai/:id
/tools
/tools/:id
/websites
/websites/:id
/projects
/tech-stack
/learning-journey
/setup
/timeline
/statistics
/about
/contact
/privacy-policy
/admin
```

ID publik menggunakan cuid2 24 karakter (TD-07).

---

# 3. USER EXPERIENCE & USER FLOW

## 3.1 Welcome Screen Flow

```text
Visitor opens website
        |
        v
Welcome Screen
        |
        ├── Show RF logo animation
        ├── Show owner identity
        ├── Show statistics
        ├── Show visitor counter
        └── Attempt audio autoplay
                |
                v
        Wait maximum 5 seconds
                |
                ├── Visitor clicks → Enter Workspace
                |
                └── Timeout → Workspace
```

Welcome Screen menggunakan animasi logo glitch dan digital distortion. Tidak ada intro loading tambahan.

## 3.2 Visitor Flow

```text
Welcome Screen → Workspace → Choose Category → Browse Masonry Cards → Open Item → Item Detail
Item Detail → Open External Link / Previous Item / Next Item
```

Previous/Next hanya berpindah dalam kategori yang sama, mengikuti urutan A–Z. Tombol dinonaktifkan pada batas kategori.

## 3.3 Item Detail Navigation

Detail item menggunakan halaman khusus. Komponen:

- Breadcrumb kategori dan item.
- Logo item.
- Nama item.
- Deskripsi.
- Status penggunaan.
- Daftar external links.
- Previous/Next minimalis.
- Animasi transisi antaritem.

## 3.4 Search Flow

```text
Click Search Icon → Animated Search Input → Type Keyword → Live Search Dropdown
Dropdown: Category Chips, Grouped Results, Keyboard Navigation, Empty State
Select Result / Enter → Item Detail
```

Ketentuan pencarian:

- Partial match.
- Case-insensitive.
- Tidak mendukung typo correction.
- Tidak menyimpan riwayat.
- Multi-select kategori.
- Hasil berdasarkan kecocokan nama tertinggi.
- Tidak membuat halaman hasil pencarian terpisah.
- Enter membuka hasil pertama yang dipilih.
- Esc dan klik di luar menutup dropdown.
- Kembali dari detail mereset pencarian dan filter.

Cakupan: AI, Tools, Websites, Projects, Tech Stack.

## 3.5 Loading dan Error States

| Kondisi | Perilaku |
|---|---|
| Data loading | Skeleton loading |
| Page transition | Motion transition |
| Kategori kosong | Animated Empty State |
| Search kosong | Animated Empty State |
| Backend error | Error message + Retry |
| Item tidak ditemukan | Custom 404 atau not found state |
| Image gagal | Fallback image/icon |

---

# 4. UI/UX DESIGN SYSTEM

## 4.1 Visual Identity

**Design direction:** Experimental Tech / Experimental Spatial UI.

| Warna | Penggunaan |
|---|---|
| Black | Background dan struktur utama |
| Red | Aksen, active state, glow |
| Chrome | Highlight dan elemen visual |

Tidak ada warna aksen kategori di luar palet utama.

## 4.2 Typography

Karakter tipografi: futuristic, bold, geometric, experimental, high contrast.

## 4.3 Layout System

- Desktop-first.
- Responsive mobile.
- Floating panels.
- Asymmetric composition.
- Variable-size Masonry cards.
- Sidebar navigation.
- Breadcrumb navigation.
- Dynamic content areas.

## 4.4 Category Header

Setiap kategori memiliki:

- CSS-generated visual header.
- Pola visual berbeda.
- Animasi berbeda.
- Variasi intensitas hitam, merah, dan chrome.
- Judul dan deskripsi kategori.
- Large animated item counter.

Deskripsi kategori ditulis langsung di kode, bukan CMS.

## 4.5 Motion System

Teknologi: GSAP, Motion for React.

Efek: parallax, scroll animation, hover animation, page transition, floating panel movement, counter animation, glitch, ambient background motion, micro-interactions.

Animasi tetap berjalan pada mobile dan saat Reduce Motion aktif, tetapi diuji terhadap performa perangkat.

## 4.6 Background

Kombinasi animated particles, grid, noise texture, red glow, ambient motion.

## 4.7 Theme System

Lima tema futuristik. Pengunjung dapat mengganti tema melalui sidebar. Pilihan tema hanya berlaku selama website terbuka dan kembali ke default ketika dibuka ulang (session storage, bukan local storage).

## 4.8 Audio System

- Autoplay attempt.
- Fallback Play Music button.
- External royalty-free tracks.
- Multiple tracks.
- Volume control.
- Music continuity across page navigation.
- Sound effects fixed volume, selalu aktif kecuali master mute.
- Master mute mengontrol musik + SFX (TD-05).

---

# 5. CONTENT MANAGEMENT SPECIFICATION

## 5.1 AI Collection

Subkategori tetap: Chatbot, Image Generation, Video Generation, Voice AI, Coding AI, Automation.

## 5.2 Tools Collection

Subkategori awal: Development Tools, Design Tools, Productivity Tools, Automation Tools, Media & Content Tools.

Admin dapat menambah kategori dan subkategori custom.

## 5.3 Websites Collection

Kategori sepenuhnya dikelola Admin (create, edit, delete).

## 5.4 Social Media

Daftar platform awal: Instagram, TikTok, YouTube, Facebook, X, Discord, platform lain.

Setiap entri: logo, username, link profil.

## 5.5 Projects

Kategori: Website, Mobile App, AI, Automation, Game, lainnya.

Setiap proyek hanya memiliki kartu dan satu primary link. Tidak ada halaman detail proyek.

## 5.6 Learning Journey

Dikelompokkan berdasarkan bidang: Programming, AI, Cybersecurity, Design, Networking, lainnya. Hanya logo dan nama bidang. Tidak ada persentase progres atau skill level.

## 5.7 Setup & Devices

Ringkasan spesifikasi perangkat. Field: device name, processor, RAM, GPU, storage, OS, spesifikasi lain. Tidak ada foto perangkat atau halaman detail.

## 5.8 Timeline

Admin memasukkan date, title, category, description. Hanya teks, tanpa gambar atau video.

## 5.9 Statistics

Statistik publik: total AI, total Tools, total Websites, total Projects, total Social Media. Welcome Screen juga menampilkan statistik tersebut.

## 5.10 About Me

Profile, bio, tech interests, personal goals.

## 5.11 Contact

Formulir mengirim pesan langsung ke email Admin. Ketentuan: reCAPTCHA v2 checkbox (TD-12), validasi input, server-side verification, tidak menyimpan pesan di database, tidak ada notifikasi dashboard.

## 5.12 CV Management

Admin dapat mengganti file CV/Resume PDF. Pengunjung dapat mengunduhnya.

---

# 6. ADMIN DASHBOARD ARCHITECTURE

## 6.1 Dashboard Overview

- Total content.
- Visitor count.
- Incoming message information jika tersedia dari mekanisme email.
- Latest activity berupa ringkasan konten terbaru, bukan Activity Log.
- Charts.
- Quick Actions.

## 6.2 CMS CRUD

Semua koleksi dinamis: Create, Read, Update, Delete.

Ketentuan:

- Perubahan langsung dipublikasikan.
- Tidak ada draft, preview, bulk action, duplicate item.
- Pencarian berdasarkan nama.
- Sorting berdasarkan tanggal pembuatan.
- Tidak ada filter status.
- Penghapusan permanen dengan confirmation dialog.
- Tidak ada Trash/Recycle Bin.

## 6.3 Media Library

Fitur: melihat file, upload, memilih file yang ada, reuse, folder grouping, informasi media, penggunaan media yang sama pada beberapa item.

```text
Media Library
├── AI
├── Tools
├── Websites
├── Projects
└── Profile
```

Menghapus item CMS tidak otomatis menghapus file Cloudinary (TD-09).

---

# 7. TECHNICAL ARCHITECTURE

## 7.1 Technology Stack

**Frontend:** React, Vite, TypeScript, React Router, Tailwind CSS v4, Custom CSS, CSS Variables, GSAP, Motion for React, shadcn/ui, Base UI, Phosphor Icons, Zustand, React Context, TanStack Query, Fetch API, React Hook Form, Zod.

**Backend:** Node.js, Express.js, TypeScript, Prisma ORM, Zod.

**Infrastructure:** Vercel (frontend), Railway (backend), Railway PostgreSQL, Cloudinary.

## 7.2 High-Level Architecture

```text
VISITORS → VERCEL FRONTEND (React + Vite) → EXPRESS REST API (RAILWAY)
Express → Prisma → PostgreSQL (Railway)
Express → Auth System
Express → Services: Cloudinary, Email Provider
```

## 7.3 Application Layers

- **Presentation:** halaman publik, Admin Dashboard, komponen UI, animasi, interaksi.
- **Application:** business logic, autentikasi, CMS operations, visitor counting, translation orchestration, backup management.
- **Data:** Prisma ORM.
- **External Services:** Cloudinary, email delivery, reCAPTCHA, translation service.

## 7.4 API Architecture

REST API prefix `/api/v1`.

### Public API

```text
GET    /api/v1/profile
GET    /api/v1/collections/ai
GET    /api/v1/collections/tools
GET    /api/v1/collections/websites
GET    /api/v1/social-media
GET    /api/v1/projects
GET    /api/v1/tech-stack
GET    /api/v1/learning-journey
GET    /api/v1/devices
GET    /api/v1/timeline
GET    /api/v1/statistics
GET    /api/v1/search
GET    /api/v1/visitor-count
POST   /api/v1/visits
POST   /api/v1/contact
GET    /api/v1/resume
```

### Admin API

```text
POST   /api/v1/admin/auth/login
POST   /api/v1/admin/auth/logout
GET    /api/v1/admin/auth/session
PATCH  /api/v1/admin/auth/credentials

GET    /api/v1/admin/overview

POST   /api/v1/admin/ai
PATCH  /api/v1/admin/ai/:id
DELETE /api/v1/admin/ai/:id

POST   /api/v1/admin/tools
POST   /api/v1/admin/websites
POST   /api/v1/admin/social-media
POST   /api/v1/admin/projects
POST   /api/v1/admin/timeline

GET    /api/v1/admin/media
POST   /api/v1/admin/media/signature
POST   /api/v1/admin/media
DELETE /api/v1/admin/media/:id

POST   /api/v1/admin/backup
POST   /api/v1/admin/restore
```

Endpoint lengkap didefinisikan pada API Specification (`docs/api-spec.md`).

## 7.5 Data Fetching

TanStack Query untuk fetching, caching, refetching, loading states, error states, mutation handling. Fetch API + custom API client sebagai transport layer.

---

# 8. DATABASE DESIGN

PostgreSQL + Prisma ORM.

## 8.1 Models

| Model | Tanggung jawab |
|---|---|
| Admin | Identitas akun Admin |
| Session | Sesi autentikasi |
| Profile | Informasi pemilik |
| CollectionItem | Item AI, Tools, Websites |
| Category | Kategori konten |
| Subcategory | Subkategori |
| ItemLink | External links |
| Project | Data proyek |
| SocialMedia | Akun sosial media |
| LearningField | Bidang pembelajaran |
| Device | Perangkat dan spesifikasi |
| TimelineEntry | Riwayat aktivitas |
| Media | Metadata Cloudinary |
| MediaFolder | Pengelompokan media |
| Resume | File CV |
| VisitorEvent | Data kunjungan |
| SiteConfiguration | Konfigurasi dinamis |
| ContactConfiguration | Konfigurasi email/contact |

## 8.2 CollectionItem Structure

```text
CollectionItem
├── id
├── type            (AI | TOOL | WEBSITE)
├── categoryId
├── subcategoryId
├── name
├── description
├── logoMediaId
├── usageStatus     (CURRENTLY_USING | PREVIOUSLY_USED | EXPLORING | WANT_TO_TRY)
├── sourceLocale
├── createdAt
└── updatedAt
```

## 8.3 Relationship Design

```text
Category → Subcategory → CollectionItem → ItemLink
                                     └→ Media
Category → Project
```

Relasi media memakai referensi yang dapat dipakai ulang.

## 8.4 Data Integrity

- Primary key setiap record.
- Foreign key untuk relasi.
- Unique constraint pada username Admin.
- Validasi URL external links.
- Validasi tipe konten.
- Validasi referensi media.
- Timestamp pembuatan dan perubahan.

---

# 9. AUTHENTICATION & SECURITY

## 9.1 Admin Authentication

- Satu akun Admin.
- Login username + password.
- Akun pertama dibuat melalui database/seed.
- Kredensial dapat diganti melalui Admin Dashboard.
- Reset password melalui database.

## 9.2 Session Strategy

Target: admin tetap login setelah browser ditutup sampai logout.

Ketentuan mengikat (TD-06):

- Persistent HttpOnly cookie `rf_sess`.
- Secure pada production, SameSite=Lax, Path=/.
- Sliding expiry 30 hari, cap absolut 90 hari.
- Rotasi session ID pada login/perpanjangan/perubahan kredensial.
- Session revocation saat logout.
- Argon2id password hashing (m=19 MiB, t=2, p=1).
- Login rate limit 5 gagal/15 menit per IP, lockout akun 15 menit setelah 10 gagal.
- CSRF: Origin/Referer allowlist + header `X-RF-Client: web`.
- Validasi session di server.

## 9.3 Security Requirements

- Cloudinary API Secret hanya di backend.
- API Admin memerlukan autentikasi.
- Server-side validation.
- Sanitasi input.
- CORS dibatasi ke domain resmi.
- HTTPS.
- Rate limiting.
- Proteksi brute force.
- reCAPTCHA pada contact form.
- Environment variables untuk secret.
- Error response tidak membocorkan informasi internal.

---

# 10. CLOUDINARY MEDIA UPLOAD

Signed direct upload.

```text
ADMIN BROWSER → (signature) EXPRESS BACKEND → (signed params) ADMIN BROWSER
ADMIN BROWSER → (direct upload) CLOUDINARY → (secure URL + public ID) ADMIN BROWSER
ADMIN BROWSER → (metadata) EXPRESS BACKEND → POSTGRESQL
```

Ketentuan:

1. Browser meminta signature ke backend.
2. Backend membuat signature menggunakan secret.
3. Browser mengunggah langsung ke Cloudinary.
4. Cloudinary mengembalikan informasi file.
5. Backend menyimpan metadata media ke PostgreSQL.
6. Media dapat digunakan kembali.

Batas unggah: TD-14. Penghapusan item tidak menghapus file Cloudinary (TD-09).

---

# 11. LOCATION, PRESENCE & VISITOR COUNTER

## 11.1 Owner Location

- Hanya lokasi pemilik, tidak mengambil lokasi pengunjung.
- GPS gagal → gunakan lokasi terakhir yang berhasil.
- Publik hanya label kota (TD-01).
- Data > 30 hari disembunyikan.

## 11.2 Owner Activity Status

Status ONLINE/OFFLINE berdasarkan heartbeat sesi admin (TD-02): 60 detik visible, 5 menit hidden, offline setelah 180 detik.

## 11.3 Database Status

Footer menampilkan ONLINE/OFFLINE berdasarkan ketersediaan PostgreSQL. Dicek saat halaman dibuka atau refresh, bukan polling.

## 11.4 Visitor Counter

- Setiap website open dihitung (satu per full page load, TD-03).
- Kunjungan ulang dihitung.
- Admin dihitung dan ditandai.
- Bot dikecualikan.
- Total pengunjung tampil di Welcome Screen.

---

# 12. TRANSLATION ARCHITECTURE

Bahasa Indonesia dan Inggris. Admin memasukkan satu bahasa sumber per konten (`sourceLocale`).

```text
Visitor selects language → Fetch original → Same language? → Show original
                                          → Different? → Free translation service
                                                          → Success: show translation
                                                          → Failure: show original
```

Tidak ada translation cache (TD-04). Provider: DeepL API Free via backend proxy. Cakupan field: TD-15.

---

# 13. BACKUP & RESTORE

## 13.1 Backup

Manual, format `.sql`, berisi seluruh data PostgreSQL termasuk metadata media dan URL Cloudinary serta konfigurasi DB.

Tidak termasuk: server configuration, environment variables, binary Cloudinary, secret.

## 13.2 Restore

Full Replace. Wajib snapshot sementara sebelum restore. Implementasi: TD-13.

---

# 14. SEO & PERFORMANCE

## 14.1 SEO

- Unique page title, meta description, Open Graph, Twitter/X Cards.
- Sitemap.xml, robots.txt, favicon RF.
- Page-specific metadata, metadata otomatis berdasarkan konten.
- Rendering: SSR prerender saat build + Deploy Hook (TD-11).

## 14.2 Performance

- Lazy loading image, responsive image delivery.
- Code splitting, route-based chunking.
- Skeleton loading.
- Optimized animation lifecycle (TD-10).
- Efficient event listeners.
- Pagination melalui Load More (TD-08).
- Query optimization, caching.

---

# 15. DEPLOYMENT ARCHITECTURE

```text
PUBLIC USERS → VERCEL (React + Vite) → RAILWAY (Express) → RAILWAY POSTGRESQL
MEDIA → CLOUDINARY
```

## 15.2 Environment Variables

```env
# Frontend
VITE_API_BASE_URL=
VITE_RECAPTCHA_SITE_KEY=

# Backend
NODE_ENV=
PORT=
DATABASE_URL=
SESSION_SECRET=
FRONTEND_ORIGIN=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Contact Form
MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM=
ADMIN_EMAIL=

# Captcha
RECAPTCHA_SECRET_KEY=

# Translation
DEEPL_API_KEY=
DEEPL_API_URL=
```

Secret hanya di environment backend.

## 15.3 Deployment Stages

1. Setup repository dan project structure.
2. Setup frontend.
3. Setup backend.
4. Setup database dan Prisma.
5. Implement authentication.
6. Implement CMS.
7. Implement media upload.
8. Implement public pages.
9. Implement animations.
10. Implement visitor system.
11. Implement contact form.
12. Implement backup/restore.
13. Implement SEO.
14. Testing.
15. Production deployment.

---

# 16. FUNCTIONAL ACCEPTANCE CRITERIA

| ID | Kriteria penerimaan |
|---|---|
| RF-001 | Welcome Screen tampil ketika website dibuka |
| RF-002 | Welcome Screen berpindah otomatis setelah 5 detik |
| RF-003 | Klik pada Welcome Screen langsung masuk Workspace |
| RF-004 | Pengunjung dapat membuka dan menyembunyikan sidebar |
| RF-005 | Sidebar mobile mendukung drawer dan swipe |
| RF-006 | Kategori memiliki header visual CSS unik |
| RF-007 | Item AI, Tools, dan Websites memiliki halaman detail |
| RF-008 | Detail item mendukung Previous/Next dalam kategori |
| RF-009 | Previous/Next mengikuti A–Z |
| RF-010 | Global Search mendukung partial match |
| RF-011 | Search mendukung filter kategori multi-select |
| RF-012 | Search menampilkan hasil secara langsung |
| RF-013 | Admin dapat mengelola konten melalui CMS |
| RF-014 | Perubahan CMS langsung tampil di publik |
| RF-015 | Admin dapat menggunakan kembali media |
| RF-016 | Item CMS yang dihapus tidak menghapus media Cloudinary |
| RF-017 | Admin dapat mengubah username dan password |
| RF-018 | Session tetap aktif sesuai kebijakan persistensi |
| RF-019 | Pengunjung dapat memilih lima tema |
| RF-020 | Pengunjung dapat mengganti bahasa |
| RF-021 | Pengunjung dapat memilih musik |
| RF-022 | Audio memiliki fallback jika autoplay diblokir |
| RF-023 | Statistik kategori tampil di Welcome Screen |
| RF-024 | Total visitor tampil di Welcome Screen |
| RF-025 | Contact form mengirim email |
| RF-026 | Admin dapat mengganti CV PDF |
| RF-027 | Admin dapat membuat backup SQL |
| RF-028 | Restore wajib membuat backup sementara |
| RF-029 | Custom 404 tersedia |
| RF-030 | SEO metadata tersedia pada halaman publik |

---

# 17. TECHNICAL DECISION REGISTER

Seluruh TD-01 s/d TD-15 telah diputuskan. Lihat `docs/technical-decisions.md`.

---

# 18. IMPLEMENTATION PRIORITY

**Phase 1: Foundation** — repository, project structure, frontend setup, backend setup, database, Prisma, API foundation, authentication.

**Phase 2: Admin CMS** — Admin Dashboard, CMS CRUD, categories, Media Library, Cloudinary, profile, CV.

**Phase 3: Public Website** — Welcome Screen, Workspace, Sidebar, Header, AI/Tools/Websites Collection, Social Media, Projects, Tech Stack, Learning Journey, Setup & Devices, Timeline, Statistics, About Me, Contact.

**Phase 4: Interaction & Experience** — Global Search, item detail navigation, theme switcher, language switcher, translation, background animation, audio system, page transitions.

**Phase 5: Infrastructure & Security** — visitor counter, owner presence, owner location, contact email, reCAPTCHA, backup & restore, SEO, performance.

**Phase 6: Testing & Production** — functional, API, security, responsive, browser, animation performance, SEO verification, deployment, production validation.

---

# 19. FINAL PROJECT PRINCIPLES

1. Seluruh konten dinamis dikelola melalui Admin Dashboard.
2. Tidak boleh ada kebutuhan mengedit source code untuk menambah atau mengubah item CMS.
3. Semua perubahan CMS langsung dipublikasikan.
4. Public Website dan Admin Dashboard dipisahkan secara jelas.
5. Secret dan kredensial tidak boleh terekspos di frontend.
6. Setiap item memiliki struktur data konsisten.
7. Media dapat digunakan ulang.
8. Navigasi dan animasi harus konsisten.
9. Desain desktop dan mobile diuji terpisah.
10. Keputusan pending wajib diselesaikan sebelum implementasi fitur terkait.
11. Tidak boleh mengubah keputusan produk tanpa klarifikasi.
12. Fitur diuji berdasarkan acceptance criteria.
