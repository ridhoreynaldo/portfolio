#!/usr/bin/env bash
# Jalan DI SERVER (dipanggil deploy/deploy.sh): pasang satu commit dari GitHub.
#   ssh root@SERVER 'bash -s -- <commit>' < deploy/release.sh
#   1. ambil commit → /opt/portfolio/releases/<waktu>-<commit>
#   2. npm ci, next build (standalone) + bundle skrip migrasi, migrasi + seed database
#   3. pasang unit systemd & vhost nginx, ganti symlink `current` atomik, restart
#   4. cek kesehatan; bila gagal kembali ke rilis sebelumnya. Simpan 5 rilis.
set -euo pipefail

APP=portfolio
BASE="/opt/$APP"
REPO="$BASE/repo.git"
ENVF="/etc/$APP/app.env"
PORT=3200
DOMAIN=ridhoreynaldo.com
COMMIT="${1:?pakai: release.sh <commit>}"
NGX_AVAIL=/etc/nginx/sites-available/$DOMAIN
NGX_ENABLED=/etc/nginx/sites-enabled/$DOMAIN

exec 8>/run/$APP-release.lock
flock 8

[ -d "$REPO" ] || { echo "belum ada $REPO; jalankan deploy/setup-server.sh" >&2; exit 1; }
grep -q '^DATABASE_URL=' "$ENVF" || { echo "DATABASE_URL belum ada; jalankan deploy/setup-db.sh" >&2; exit 1; }
[ -f /etc/ssl/cloudflare/$DOMAIN.key ] || { echo "sertifikat /etc/ssl/cloudflare/$DOMAIN.key belum ada (lihat setup-server.sh)" >&2; exit 1; }

echo ">> ambil kode dari GitHub"
git -C "$REPO" fetch -q origin
SHA="$(git -C "$REPO" rev-parse --verify "$COMMIT^{commit}")"
ID="$(date +%Y%m%d-%H%M%S)-${SHA:0:7}"
REL="$BASE/releases/$ID"
PREV="$(readlink -f "$BASE/current" 2>/dev/null || true)"
mkdir -p "$REL"
git -C "$REPO" archive "$SHA" | tar -x -C "$REL"
echo "$SHA" > "$REL/REVISION"
cd "$REL"

echo ">> npm ci"
npm ci --no-audit --no-fund --loglevel=error
echo ">> build (standalone) + bundle migrasi"
NEXT_TELEMETRY_DISABLED=1 npm run build 2>&1 | tail -n 15
npm run build:migrate 2>&1 | tail -n 2
# standalone butuh aset statis & public di sampingnya (sama seperti Dockerfile)
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
chown -R root:root "$REL"
chown -R "$APP:$APP" "$REL/.next/standalone"   # cache Next.js (.next/cache) ditulis saat runtime

echo ">> migrasi database + seed (idempotent)"
runuser -u "$APP" -- bash -c "set -a; . '$ENVF'; set +a; cd '$REL' && MIGRATIONS_DIR='$REL/drizzle' node dist/migrate.mjs"

echo ">> unit systemd"
install -m 0644 deploy/$APP.service /etc/systemd/system/$APP.service
systemctl daemon-reload
systemctl enable $APP.service >/dev/null 2>&1

echo ">> aktifkan rilis (atomik)"
ln -sfn "$REL" "$BASE/current.new"
mv -Tf "$BASE/current.new" "$BASE/current"
systemctl restart $APP.service

echo ">> nginx: vhost $DOMAIN saja (situs lain tidak disentuh)"
if ! cmp -s deploy/nginx/$DOMAIN.conf "$NGX_AVAIL"; then
  [ -f "$NGX_AVAIL" ] && cp -a "$NGX_AVAIL" "$NGX_AVAIL.prev"
  install -m 0644 deploy/nginx/$DOMAIN.conf "$NGX_AVAIL"
  ln -sfn "$NGX_AVAIL" "$NGX_ENABLED"
  if nginx -t 2>/tmp/$APP-nginx-test.log; then
    systemctl reload nginx
  else
    cat /tmp/$APP-nginx-test.log >&2
    echo "!! vhost ditolak nginx; dikembalikan ke versi sebelumnya" >&2
    if [ -f "$NGX_AVAIL.prev" ]; then mv -f "$NGX_AVAIL.prev" "$NGX_AVAIL"; else rm -f "$NGX_AVAIL" "$NGX_ENABLED"; fi
    nginx -t >/dev/null 2>&1 && systemctl reload nginx
  fi
fi

echo ">> cek kesehatan"
ok=0
for _ in $(seq 1 40); do
  if curl -fsS -m 3 "http://127.0.0.1:$PORT/api/health" | grep -q '"ok":true'; then ok=1; break; fi
  sleep 1
done
if [ "$ok" != 1 ]; then
  echo "!! web tidak sehat." >&2
  journalctl -u $APP.service -n 30 --no-pager >&2 || true
  if [ -n "$PREV" ] && [ -d "$PREV" ] && [ "$PREV" != "$REL" ]; then
    echo "!! kembali ke rilis sebelumnya: $PREV" >&2
    ln -sfn "$PREV" "$BASE/current.new" && mv -Tf "$BASE/current.new" "$BASE/current"
    systemctl restart $APP.service
  fi
  exit 1
fi
code="$(curl -sk -o /dev/null -w '%{http_code}' -m 5 --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/api/health" || true)"
echo "   lewat nginx (lokal, Origin CA): HTTP $code"

echo ">> bersihkan rilis lama (simpan 5)"
ls -1dt "$BASE"/releases/*/ | tail -n +6 | xargs -r rm -rf
echo "SELESAI: commit ${SHA:0:7} aktif → https://$DOMAIN"
