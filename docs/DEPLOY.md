# Deploy (native, tanpa Docker)

Dipasang langsung di VPS `103.235.75.156` mengikuti pola aplikasi lain di server itu:

```
Internet ─► Cloudflare (proxy, SSL Full strict) ─► nginx :443 (sites-available/ridhoreynaldo.com, Cloudflare Origin CA)
                                                      └─► Next.js standalone 127.0.0.1:3200 (systemd portfolio.service, user portfolio)
                                                             └─► PgBouncer 127.0.0.1:6432 ─► PostgreSQL (database `portfolio`)
kode   : /opt/portfolio/releases/<waktu>-<commit>  →  /opt/portfolio/current (symlink, diganti atomik)
config : /etc/portfolio/app.env (root:portfolio 0640) — DATABASE_URL, DATABASE_URL_DIRECT, COOKIE_SECURE, SEED_ADMIN_*
SSL    : /etc/ssl/cloudflare/ridhoreynaldo.com.{pem,key} (Origin CA 15 tahun; tidak di git)
```

Semua data (konten, pelanggan, order, tagihan, file QRIS/bukti bayar sebagai `bytea`) ada di **satu database Postgres `portfolio`** — tanpa SQLite, tanpa folder upload.

## Pertama kali (sekali)

```bash
# 1) sertifikat Origin CA dari Cloudflare (SSL/TLS → Origin Server) — dari laptop
scp fullchain.pem root@103.235.75.156:/etc/ssl/cloudflare/ridhoreynaldo.com.pem
scp privkey.pem   root@103.235.75.156:/etc/ssl/cloudflare/ridhoreynaldo.com.key

# 2) user, folder, app.env, salinan repo
ssh root@103.235.75.156 'bash -s' < deploy/setup-server.sh
# 3) role + database `portfolio` di PostgreSQL yang ada, didaftarkan ke PgBouncer global
ssh root@103.235.75.156 'bash -s' < deploy/setup-db.sh
```

Cloudflare: DNS `ridhoreynaldo.com` dan `www` → `103.235.75.156` (proxied), SSL/TLS **Full (strict)**.

## Rilis (setiap update)

```bash
git push origin main
bash deploy/deploy.sh          # server menarik commit dari GitHub → release.sh: npm ci, build, migrasi+seed, restart, nginx, cek kesehatan, rollback otomatis
```

Yang dilakukan `migrate` (idempotent): migrasi SQL `drizzle/`, sinkron permission (termasuk `package.* order.* invoice.* customer.* payment.*`), role `super_admin`/`admin`/`customer`, super admin pertama dari `SEED_ADMIN_*`, menu admin & menu PUBLIC **Layanan**, dan konten awal (`scripts/seed-content.ts` — tidak menimpa data yang ada).

Setelah login admin (`/login`, email & password awal di `/etc/portfolio/app.env`): ganti password, **Pembayaran & QRIS** → unggah QRIS + rekening, cek **Paket Layanan** (harga placeholder) dan **Profil** (email/telepon/foto).

## Alur jasa & pembayaran

1. Pelanggan daftar di `/register` (role `customer`, tanpa akses admin) → pesan paket di `/order/<slug>` → order `pending`.
2. Admin: **Order** → status `Aktif` (+ catatan) → **Buat tagihan**, atau **Generate** tagihan bulanan untuk semua order aktif berpaket bulanan.
3. Pelanggan: **/portal** → buka tagihan → scan QRIS / transfer → unggah bukti → `menunggu verifikasi`.
4. Admin: **Tagihan** → cek bukti → **Lunas**.

## Perintah di server

```bash
systemctl status portfolio            # proses web
journalctl -u portfolio -f            # log
curl -s http://127.0.0.1:3200/api/health
ls -la /opt/portfolio/releases        # rilis (5 terakhir); rollback: ln -sfn <rilis> /opt/portfolio/current && systemctl restart portfolio
```

## Dev lokal

```bash
docker compose -f docker-compose.dev.yml up -d    # hanya database lokal (opsional; bisa juga Postgres lokal biasa)
cp .env.example .env
npm install && npm run db:migrate && npm run dev
```

## Troubleshooting

| Gejala | Solusi |
|---|---|
| Cloudflare 526 / 525 | sertifikat di `/etc/ssl/cloudflare/ridhoreynaldo.com.*` tidak ada / key tidak cocok; `nginx -t` |
| Redirect loop https | mode SSL Cloudflare masih *Flexible* → **Full (strict)** |
| migrate: `password authentication failed` | jalankan ulang `deploy/setup-db.sh` (menulis ulang URL & userlist PgBouncer) |
| Login berhasil tapi langsung logout | `COOKIE_SECURE=true` tetapi diakses lewat http |
| Unggah QRIS/bukti gagal "Body exceeded" | > 5 MB; aplikasi membatasi 3 MB; nginx `client_max_body_size 6m` |
| Pelanggan masuk ke /admin | tidak bisa: akun tanpa permission diarahkan ke `/portal` |
| Halaman publik tidak berubah setelah edit | action harus memanggil `revalidatePortfolio()`; paksa: `systemctl restart portfolio` |
| `prepared statement … does not exist` | `DATABASE_URL` harus lewat PgBouncer dengan `prepare:false` (default project ini) |
