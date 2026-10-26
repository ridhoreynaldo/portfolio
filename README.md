# Portfolio

Portofolio pribadi (tema **galactic × cyberpunk**) + **portal jasa & pembayaran** (order, tagihan bulanan, QRIS) + panel admin dengan RBAC granular. **Next.js 16 · React 19 · Drizzle ORM · PostgreSQL (via PgBouncer) · Tailwind 4 · TypeScript** — stack dan struktur yang sama dengan [`wa-gateway`](https://github.com/ridhoreynaldo/wa-gateway), tanpa Redis.

Repo ini adalah **aplikasi**. Infra (Postgres/PgBouncer, nginx, SSL, backup) ada di repo [`devops`](https://github.com/ridhoreynaldo/devops); aplikasi di-deploy ke `devops/04-apps/portfolio`.

- Deploy: [`docs/DEPLOY.md`](docs/DEPLOY.md)
- Arsitektur & keputusan teknis: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Fitur

| Publik | Portal pelanggan | Admin |
|---|---|---|
| Hero + tagline, tentang, **biodata**, pengalaman (timeline), **skill** (per kategori), **sertifikasi**, proyek (tag, ikon tech, modal detail, statistik pengguna), **jasa & layanan** (katalog paket + harga), kontak | `/register` (akun `customer`), `/order` katalog & form pemesanan, `/portal` tagihan (QRIS, transfer, **unggah bukti bayar**, konfirmasi WA), pesanan, akun | Login (sesi DB, rate-limit), dashboard (+ ringkasan order/tagihan), profil & biodata, CRUD pengalaman/sertifikasi/skill, project, **paket layanan**, **order** (konfirmasi/aktifkan), **tagihan** (manual atau **generate bulanan**, verifikasi → lunas), **pelanggan**, **pembayaran & QRIS** (unggah gambar), **menu dinamis**, user (multi-role), **role & permission granular**, ganti password |

Data: satu database PostgreSQL untuk semuanya (konten, pelanggan, order, tagihan, file QRIS/bukti sebagai `bytea`) — tanpa SQLite/volume upload. Seed awal (`scripts/seed-content.ts`) mengisi profil, pengalaman, sertifikasi, skill, project (SIAKAD, manajemen aset & pembayaran asrama, DSS AHP/SMART, K-Means, WA gateway, dll) dan paket layanan **tanpa menimpa** data yang sudah ada.

Keamanan: permission dicek di halaman **dan** server action; akun pelanggan (tanpa permission) tidak bisa masuk `/admin`; bukti bayar hanya bisa dibuka pemilik & admin; unggahan divalidasi tipe (sniff header) & ukuran (≤ 3 MB); anti-eskalasi hak (non-super tidak bisa memberi permission yang tidak ia miliki, menyentuh role/akun sistem, atau mengubah role sendiri; super admin terakhir tidak bisa dicabut); semua URL konten divalidasi http(s) saat simpan dan saat render (anti stored-XSS); password scrypt (hash bcrypt lama tetap diterima lalu di-rehash); sesi di DB dan dicabut saat password/role berubah.

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
