# Portfolio + Admin RBAC

Aplikasi web portfolio dengan panel admin lengkap: autentikasi JWT, kontrol akses
berbasis peran (RBAC), menu sidebar dinamis, manajemen proyek, dan pengaturan
konten situs — semuanya dalam Bahasa Indonesia.

Tema visual: **galactic / antigravity** — dark mode profesional dengan starfield
animasi, panel kaca (glassmorphism), dan aksen gradien violet → cyan → fuchsia.

## Tech Stack

| Komponen   | Pilihan | Alasan |
|------------|---------|--------|
| Framework  | Next.js 15 (App Router) + React 19 | Full-stack dalam satu codebase, SSR + API routes |
| Bahasa     | TypeScript (strict) | Type-safe end-to-end |
| Styling    | Tailwind CSS v4 | Utility-first, cepat |
| Database   | PostgreSQL via PgBouncer | Pooling di sisi infra |
| ORM        | **Drizzle ORM** | Lihat "Kenapa Drizzle?" di bawah |
| Auth       | JWT (jose, HS256) + cookie httpOnly | Stateless, tanpa Redis |
| Password   | bcryptjs | Hashing standar industri |
| Ikon       | lucide-react | Konsisten & ringan |

### Kenapa Drizzle? (ORM vs Raw Query)

- **Type-safe**: skema TypeScript → query ikut tercek; salah nama kolom ketahuan
  saat `tsc`, bukan saat runtime.
- **Ringan & SQL-like**: sintaksnya dekat SQL mentah, tanpa query builder yang
  berat dan tanpa N+1 tersembunyi ala ORM klasik.
- **Migrasi deklaratif**: `drizzle-kit generate` membuat file migrasi SQL dari
  `db/schema.ts` — bisa di-review sebelum dijalankan.
- **Aman untuk PgBouncer**: Drizzle tidak memakai *named prepared statement*
  secara default, sehingga kompatibel dengan PgBouncer **transaction mode**.

## Struktur Folder

```
app/
  page.tsx              → halaman publik portfolio
  login/page.tsx        → halaman login
  admin/
    layout.tsx          → guard session + sidebar menu dinamis
    page.tsx            → dashboard statistik
    menus|users|roles|projects|settings/page.tsx → CRUD admin
  api/
    health/route.ts     → healthcheck (tanpa auth)
    auth/               → login, logout, me
    public/             → projects & settings (publik)
    admin/              → CRUD menus, users, roles, projects, settings
components/
  Starfield.tsx         → canvas bintang + meteor
  Modal.tsx, StatCard.tsx, Forbidden.tsx
  admin/                → Sidebar, Topbar, icons, useAdminData
db/
  schema.ts             → definisi tabel Drizzle
  index.ts              → Pool (max 10) + drizzle
drizzle/                → file migrasi hasil generate (di-commit)
drizzle.config.ts
lib/
  auth.ts               → JWT + cookie session
  password.ts           → bcrypt hash/compare
  rbac.ts               → requireSession/requirePermission/requireRole
  menus.ts              → bangun menu tree sesuai peran
  api.ts                → mapping error → response HTTP
middleware.ts           → proteksi /admin/* via JWT
scripts/
  seed.mjs              → seed idempotent (roles, permissions, menus, admin, konten)
  entrypoint.sh         → migrate → seed → start (untuk Docker)
Dockerfile              → multi-stage node:20-alpine
```

## Cara Jalan Lokal

```bash
npm install
cp .env.example .env   # lalu isi nilainya

# Siapkan database PostgreSQL lokal (atau arahkan PG* ke server yang ada)
npm run db:generate    # buat file migrasi dari db/schema.ts
npm run db:migrate     # jalankan migrasi
npm run db:seed        # isi data awal (roles, menu, user admin, konten contoh)

npm run dev            # http://localhost:3000
```

Login dengan `ADMIN_EMAIL` / `ADMIN_PASSWORD` yang diisi di `.env`.

## Environment Variables

| Nama | Keterangan |
|------|------------|
| `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` | Koneksi PostgreSQL (via PgBouncer). Dibaca otomatis oleh `pg` Pool. |
| `JWT_SECRET` | Kunci HS256 untuk JWT — wajib string acak panjang di production |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Akun super admin awal (dipakai seed) |
| `NODE_ENV` | `production` di container |
| `PORT` | `3000` |
| `HOSTNAME` | `0.0.0.0` |

## RBAC & Menu Dinamis

Peran bawaan (dari seed):

| Peran | Hak |
|-------|-----|
| `super_admin` | Semua permission, semua menu. Tidak bisa dihapus / diubah namanya. |
| `admin` | `projects.manage` + `settings.manage`; menu Dashboard, Proyek, Pengaturan |
| `user` | Tanpa permission; menu Dashboard saja |

Permission keys: `menus.manage`, `users.manage`, `roles.manage`,
`projects.manage`, `settings.manage`.

Alur proteksi berlapis:

1. `middleware.ts` — memverifikasi JWT untuk semua `/admin/*`; redirect ke
   `/login` bila tidak valid.
2. `requirePermission(key)` di setiap API admin — melempar `FORBIDDEN` bila
   peran user tidak punya izin (super_admin selalu lolos).
3. Sidebar dirender dari tabel `menus` yang difilter per peran — user hanya
   melihat menu yang boleh diaksesnya.

Menu sepenuhnya dinamis: tambah/ubah/hapus dari halaman **Master Data → Menu
Dinamis**, atur ikon (20 ikon lucide populer), path, parent (submenu), urutan,
status aktif, dan peran mana yang boleh melihat.

## Catatan PgBouncer

- Aplikasi konek ke **PgBouncer** (bukan langsung ke PostgreSQL).
- `new Pool({ max: 10 })` — pool kecil; pooling utama dilakukan PgBouncer.
- Jangan gunakan *named prepared statement* (default Drizzle sudah aman).
- Cookie auth: `httpOnly`, `sameSite: lax`, `secure: false` karena akses via
  HTTP tanpa SSL.

## Deploy

Container di-build dari `Dockerfile` (multi-stage, output standalone).
Saat container start, `scripts/entrypoint.sh` otomatis menjalankan:

```
npx drizzle-kit migrate && node scripts/seed.mjs && exec node server.js
```

Healthcheck dari luar: `GET /api/health` → `{ "ok": true }`.

Di repo `devops-2`, aplikasi ini di-deploy sebagai service di layer
`04-apps` (contoh service `portfolio`), dengan env `PG*` mengarah ke
PgBouncer dan port `3000`.

## Scripts npm

| Script | Fungsi |
|--------|--------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Jalankan hasil build |
| `npm run db:generate` | Generate migrasi dari skema |
| `npm run db:migrate` | Jalankan migrasi |
| `npm run db:seed` | Seed data awal (idempotent) |
