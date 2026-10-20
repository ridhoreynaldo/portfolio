# Deploy

Aplikasi ini menempel ke infra bersama repo [`devops`](https://github.com/ridhoreynaldo/devops) (Postgres+PgBouncer, nginx gateway, SSL, backup). Kontrak aplikasi: `devops/docs/APPS.md`.

```
Internet ─► global_gateway (nginx, devops) ──► portfolio_web:3000 (repo ini)
                network docker: global-gateway-net
                infra_pgbouncer ◄── DATABASE_URL      infra_postgres ◄── DATABASE_URL_DIRECT (migrasi)
```

## Produksi di server devops

```bash
cd /opt/devops

# 1) Database + user khusus aplikasi. Database `portfolio` dari versi 1 sudah ada →
#    script membuat role `portfolio` dan MEMINDAHKAN kepemilikan semua tabel lama ke role itu (perlu untuk migrasi).
make app-db A=portfolio               # cetak DATABASE_URL & DATABASE_URL_DIRECT

# 2) Deploy (clone dari 04-apps/apps.list, berhenti meminta .env)
make deploy A=portfolio
nano 04-apps/portfolio/.env           # tempel 2 URL dari langkah 1; COOKIE_SECURE=true; SEED_ADMIN_* (opsional: akun lama tetap bisa login)
make deploy A=portfolio               # build → container migrate (migrasi 0004 + seed) → web

# 3) Vhost domain utama sudah menunjuk ke portfolio_web:3000 (template primary-domain-ssl); kalau belum:
make nginx-reload
```

Verifikasi: `docker logs portfolio_migrate` harus berakhir `[migrate] seed selesai`; `curl -s http://portfolio_web:3000/api/health` dari container gateway → `{"ok":true}`.

Login pertama setelah migrasi: akun lama (`ADMIN_EMAIL` versi 1) tetap bisa login dengan password lama — hash bcrypt diterima lalu diganti scrypt. Jika tidak ada user ber-role `super_admin`, migrate membuat akun dari `SEED_ADMIN_EMAIL/PASSWORD`.

Update versi berikutnya: `make deploy A=portfolio` (git pull + build + migrasi otomatis).

## Dev lokal

```bash
docker compose -f docker-compose.dev.yml up -d
cp .env.example .env    # pakai blok Dev lokal
npm install && npm run db:migrate && npm run dev
```

## Troubleshooting

| Gejala | Solusi |
|---|---|
| migrate: `must be owner of table …` | kepemilikan tabel lama masih `postgres` → jalankan ulang `make app-db A=portfolio` (memindahkan owner), lalu deploy lagi |
| migrate: `password authentication failed` | URL tidak cocok dengan output `create-app-db.sh`; cek `infra_pgbouncer` healthy |
| Login berhasil tapi langsung logout | `COOKIE_SECURE=true` tapi diakses lewat http |
| Halaman publik tidak berubah setelah edit | cache tag belum dibatalkan — pastikan action memanggil `revalidatePortfolio()`; paksa: restart container web |
| `prepared statement … does not exist` | `DATABASE_URL` harus lewat PgBouncer dengan `prepare:false` (default project ini) |
