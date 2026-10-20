# Portfolio

Portofolio pribadi + panel admin dengan RBAC granular. **Next.js 16 · React 19 · Drizzle ORM · PostgreSQL (via PgBouncer) · Tailwind 4 · TypeScript** — stack dan struktur yang sama dengan [`wa-gateway`](https://github.com/ridhoreynaldo/wa-gateway), tanpa Redis.

Repo ini adalah **aplikasi**. Infra (Postgres/PgBouncer, nginx, SSL, backup) ada di repo [`devops`](https://github.com/ridhoreynaldo/devops); aplikasi di-deploy ke `devops/04-apps/portfolio`.

- Deploy: [`docs/DEPLOY.md`](docs/DEPLOY.md)
- Arsitektur & keputusan teknis: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Fitur

| Publik | Admin |
|---|---|
| Hero + tagline, tentang, **biodata**, pengalaman (timeline), **skill** (per kategori), **sertifikasi**, proyek (tag, ikon tech, modal detail, statistik pengguna), kontak (email/WA/GitHub/LinkedIn) | Login (sesi DB, rate-limit), dashboard, profil & biodata, CRUD pengalaman/sertifikasi/skill (form dibangkitkan dari config), project, **menu dinamis** (sidebar admin per permission; menu PUBLIC menyalakan/mematikan section), user (multi-role), **role & permission granular** (`project.create`), ganti password |

Keamanan: permission dicek di halaman **dan** server action; anti-eskalasi hak (non-super tidak bisa memberi permission yang tidak ia miliki, menyentuh role/akun sistem, atau mengubah role sendiri; super admin terakhir tidak bisa dicabut); semua URL konten divalidasi http(s) saat simpan dan saat render (anti stored-XSS); password scrypt (hash bcrypt lama tetap diterima lalu di-rehash); sesi di DB dan dicabut saat password/role berubah.

## Dev lokal

```bash
cp .env.example .env                              # pakai blok "Dev lokal" di dalamnya
docker compose -f docker-compose.dev.yml up -d    # postgres + pgbouncer
npm install
npm run db:migrate                                # migrasi + seed (permission, role, menu, super admin dari SEED_ADMIN_*)
npm run dev                                       # http://localhost:3000  ·  admin: /login
```

Ubah skema: edit `src/modules/*/schema.ts` → `npm run db:generate` → review SQL di `drizzle/` → `npm run db:migrate`.

## Perintah

| | |
|---|---|
| `npm run typecheck` | cek tipe |
| `npm run build` / `build:migrate` | build web / bundle skrip migrasi |
| `docker compose up -d --build` | produksi di server devops |
