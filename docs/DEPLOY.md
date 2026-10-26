# Deploy

Aplikasi ini menempel ke infra bersama repo [`devops`](https://github.com/ridhoreynaldo/devops) (Postgres+PgBouncer, nginx gateway, SSL, backup). Kontrak aplikasi: `devops/docs/APPS.md`.

```
Internet ─► Cloudflare (proxy, SSL Full strict) ─► global_gateway (nginx, devops; Origin CA) ──► portfolio_web:3000 (repo ini)
                                                      network docker: global-gateway-net
                                                      infra_pgbouncer ◄── DATABASE_URL      infra_postgres ◄── DATABASE_URL_DIRECT (migrasi)
```

Semua data (konten, pelanggan, order, tagihan, file QRIS/bukti bayar) ada di **satu database Postgres `portfolio`** di `01-infra` — tidak ada SQLite/volume upload.

## Produksi di server devops

```bash
cd /opt/devops
git pull                                   # vhost ridhoreynaldo-com.conf (443, Origin CA) + snippet cloudflare-realip

# 1) SSL Cloudflare Origin CA (sekali; file TIDAK di git) — dari laptop:
#    scp fullchain.pem privkey.pem root@<vps>:/opt/devops/00-gateway/ssl/ridhoreynaldo-com/
#    lihat devops/00-gateway/ssl/README.md. Cloudflare: SSL/TLS → Full (strict).
make nginx-reload

# 2) Database + user khusus aplikasi (sekali). Database `portfolio` lama tetap dipakai →
#    script membuat role `portfolio` dan memindahkan kepemilikan tabel lama (perlu untuk migrasi).
make app-db A=portfolio                    # cetak DATABASE_URL & DATABASE_URL_DIRECT

# 3) Deploy (clone dari 04-apps/apps.list, berhenti meminta .env saat pertama kali)
make deploy A=portfolio
nano 04-apps/portfolio/.env                # tempel 2 URL dari langkah 2; COOKIE_SECURE=true; SEED_ADMIN_*
make deploy A=portfolio                    # build → container migrate (migrasi 0005 + seed) → web
```

Verifikasi: `docker logs portfolio_migrate` harus berakhir `[migrate] seed selesai`; `curl -sI https://ridhoreynaldo.com | head -3` → `HTTP/2 200`.

Yang dilakukan `migrate` (idempotent, aman diulang tiap deploy):
- migrasi SQL (`drizzle/`), sinkron permission (termasuk `package.* order.* invoice.* customer.* payment.*`), role `super_admin`/`admin`/**`customer`**;
- super admin pertama dari `SEED_ADMIN_EMAIL/PASSWORD` bila belum ada;
- menu admin (grup **Layanan & Pembayaran**) dan menu PUBLIC **Layanan** (`#layanan`);
- **konten awal** (`scripts/seed-content.ts`): profil hanya mengisi kolom yang masih kosong; pengalaman/sertifikasi/skill/paket hanya bila tabel kosong; project ditambahkan per slug tanpa menimpa yang sudah ada.

Setelah login admin: **Pembayaran & QRIS** → unggah gambar QRIS + rekening; cek **Paket Layanan** (harga placeholder) dan **Profil** (email/telepon/foto).

Update versi berikutnya: `make deploy A=portfolio` (git pull + build + migrasi otomatis).

## Alur jasa & pembayaran

1. Pelanggan daftar di `/register` (role `customer`, tanpa akses admin) → pesan paket di `/order/<slug>` → order `pending`.
2. Admin: **Order** → status `Aktif` (+ catatan) → **Buat tagihan** (atau **Generate** tagihan bulanan untuk semua order aktif berpaket bulanan).
3. Pelanggan: **/portal** → buka tagihan → scan QRIS / transfer → unggah bukti → status `menunggu verifikasi`.
4. Admin: **Tagihan** → cek bukti → **Lunas**.

File (QRIS, bukti) disimpan sebagai `bytea` di tabel `files`, diakses via `/api/files/<id>` (QRIS publik; bukti hanya pemilik & admin).

## Dev lokal

```bash
docker compose -f docker-compose.dev.yml up -d
cp .env.example .env    # pakai blok Dev lokal
npm install && npm run db:migrate && npm run dev
```

## Troubleshooting

| Gejala | Solusi |
|---|---|
| Cloudflare 526 / 525 | sertifikat Origin CA belum ada di `00-gateway/ssl/ridhoreynaldo-com/` atau key tidak cocok; `make nginx-test` |
| Redirect loop https | mode SSL Cloudflare masih *Flexible* → ubah ke **Full (strict)** |
| migrate: `must be owner of table …` | kepemilikan tabel lama masih `postgres` → jalankan ulang `make app-db A=portfolio`, lalu deploy lagi |
| migrate: `password authentication failed` | URL tidak cocok dengan output `create-app-db.sh`; cek `infra_pgbouncer` healthy |
| Login berhasil tapi langsung logout | `COOKIE_SECURE=true` tapi diakses lewat http |
| Unggah QRIS/bukti gagal "Body exceeded" | > 5 MB (batas server action) — aplikasi membatasi 3 MB; nginx `client_max_body_size 6m` di vhost |
| Pelanggan masuk ke /admin | tidak bisa: akun tanpa permission diarahkan ke `/portal` |
| Halaman publik tidak berubah setelah edit | cache tag belum dibatalkan — pastikan action memanggil `revalidatePortfolio()`; paksa: restart container web |
| `prepared statement … does not exist` | `DATABASE_URL` harus lewat PgBouncer dengan `prepare:false` (default project ini) |
