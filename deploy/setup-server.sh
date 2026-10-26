#!/usr/bin/env bash
# Persiapan server SEKALI (idempotent, aman diulang). Jalankan di server sebagai root:
#   ssh root@SERVER 'bash -s' < deploy/setup-server.sh
# Lalu: deploy/setup-db.sh (PostgreSQL + PgBouncer yang SUDAH ADA) dan deploy/deploy.sh dari laptop.
# Mengikuti pola server ini: user per aplikasi, /opt/<app>/releases + current, /etc/<app>/app.env.
# Tanpa Docker, tanpa paket baru, tidak menyentuh aplikasi lain.
set -euo pipefail

APP=portfolio
USER_NAME=portfolio
REPO_URL="https://github.com/ridhoreynaldo/portfolio.git"   # repo publik → cukup HTTPS, tanpa deploy key
ETC="/etc/$APP"

echo ">> user & folder"
id "$USER_NAME" >/dev/null 2>&1 || useradd --system --home-dir "/opt/$APP" --shell /usr/sbin/nologin "$USER_NAME"
install -d -o root -g root -m 0755 "/opt/$APP" "/opt/$APP/releases"
install -d -o root -g "$USER_NAME" -m 0750 "$ETC"

echo ">> konfigurasi $ETC/app.env"
if [ ! -f "$ETC/app.env" ]; then
  pass="$(head -c 64 /dev/urandom | tr -dc 'A-Za-z0-9' | head -c 20)"
  umask 0137
  cat > "$ETC/app.env" <<EOF
# Dibuat oleh deploy/setup-server.sh. Hanya root & grup $USER_NAME yang bisa membaca. JANGAN masuk git.
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
# Diakses lewat https://ridhoreynaldo.com (Cloudflare) → cookie secure
COOKIE_SECURE=true
SESSION_TTL_DAYS=7
TZ_APP=Asia/Jakarta
DB_POOL_MAX=5
# DATABASE_URL (PgBouncer) & DATABASE_URL_DIRECT (migrasi) diisi oleh deploy/setup-db.sh
# Super admin pertama — hanya dipakai migrate bila belum ada super admin. Ganti password setelah login.
SEED_ADMIN_EMAIL=admin@ridhoreynaldo.com
SEED_ADMIN_PASSWORD=$pass
EOF
  chown "root:$USER_NAME" "$ETC/app.env"
  chmod 0640 "$ETC/app.env"
  echo "   app.env dibuat (password admin awal ada di $ETC/app.env)"
else
  echo "   app.env sudah ada, dipertahankan"
fi

echo ">> salinan repo di server (/opt/$APP/repo.git)"
if [ ! -d "/opt/$APP/repo.git" ]; then
  git init -q --bare "/opt/$APP/repo.git"
  git -C "/opt/$APP/repo.git" remote add origin "$REPO_URL"
  git -C "/opt/$APP/repo.git" config remote.origin.fetch "+refs/heads/*:refs/heads/*"
fi
git -C "/opt/$APP/repo.git" fetch -q origin && echo "   akses GitHub OK"

echo ">> sertifikat Cloudflare Origin CA: /etc/ssl/cloudflare/ridhoreynaldo.com.{pem,key}"
install -d -m 0755 /etc/ssl/cloudflare
if [ -f /etc/ssl/cloudflare/ridhoreynaldo.com.pem ] && [ -f /etc/ssl/cloudflare/ridhoreynaldo.com.key ]; then
  chmod 0644 /etc/ssl/cloudflare/ridhoreynaldo.com.pem; chmod 0600 /etc/ssl/cloudflare/ridhoreynaldo.com.key
  echo "   ada"
else
  echo "   !! belum ada — salin dari laptop: scp fullchain.pem root@SERVER:/etc/ssl/cloudflare/ridhoreynaldo.com.pem ; scp privkey.pem root@SERVER:/etc/ssl/cloudflare/ridhoreynaldo.com.key"
fi
echo "OK: server siap. Berikutnya: deploy/setup-db.sh lalu deploy/deploy.sh"
