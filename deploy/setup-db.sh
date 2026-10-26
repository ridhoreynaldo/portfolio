#!/usr/bin/env bash
# Database aplikasi di layanan yang SUDAH ADA di server (tanpa memasang apa pun, tanpa Docker):
#   - PostgreSQL (cluster yang ada) : role & database `portfolio` (satu DB untuk konten, pelanggan, order, tagihan, file)
#   - PgBouncer global (port 6432)  : didaftarkan di databases.ini + userlist.txt lalu reload (koneksi app lain tidak putus)
# Hasil ditulis ke /etc/portfolio/app.env. Sekali jalan, aman diulang (sandi yang sudah ada dipakai lagi).
#   ssh root@SERVER 'bash -s' < deploy/setup-db.sh
set -euo pipefail

APP=portfolio
NAME=portfolio            # nama role PostgreSQL & database
ENVF="/etc/$APP/app.env"
PGB=/etc/pgbouncer
PG_PORT=5432
PGB_PORT=6432
TS="$(date +%Y%m%d-%H%M%S)"

[ -f "$ENVF" ] || { echo "jalankan deploy/setup-server.sh dulu" >&2; exit 1; }
getenv() { grep -E "^$1=" "$ENVF" | tail -n1 | cut -d= -f2- || true; }
setenv() { if grep -qE "^$1=" "$ENVF"; then sed -i "s|^$1=.*|$1=$2|" "$ENVF"; else echo "$1=$2" >> "$ENVF"; fi; }
randpw() { head -c 64 /dev/urandom | tr -dc 'A-Za-z0-9' | head -c 32; }
pw_from_url() { sed -nE 's|^[a-z]+://[^:]+:([^@]+)@.*|\1|p' <<<"$1"; }

echo ">> PostgreSQL: role & database $NAME"
PGPW="$(pw_from_url "$(getenv DATABASE_URL)")"
[ -n "$PGPW" ] || PGPW="$(randpw)"
sudo -u postgres psql -q -v ON_ERROR_STOP=1 -v name="$NAME" -v pw="$PGPW" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN', :'name') WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'name') \gexec
SELECT format('ALTER ROLE %I WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L', :'name', :'pw') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'name', :'name') WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'name') \gexec
SELECT format('REVOKE ALL ON DATABASE %I FROM PUBLIC', :'name') \gexec
SQL
sudo -u postgres psql -q -v ON_ERROR_STOP=1 -d "$NAME" -c "ALTER SCHEMA public OWNER TO $NAME"

echo ">> PgBouncer global (port $PGB_PORT): daftarkan database & user"
cp -a "$PGB/databases.ini" "$PGB/databases.ini.bak-$TS"
cp -a "$PGB/userlist.txt" "$PGB/userlist.txt.bak-$TS"
grep -qE "^\s*$NAME\s*=" "$PGB/databases.ini" || echo "$NAME = host=127.0.0.1 port=$PG_PORT dbname=$NAME" >> "$PGB/databases.ini"
VERIFIER="$(sudo -u postgres psql -Atc "SELECT rolpassword FROM pg_authid WHERE rolname = '$NAME'")"
case "$VERIFIER" in SCRAM-SHA-256*) ;; *) echo "!! sandi role bukan SCRAM (password_encryption?)" >&2; exit 1 ;; esac
grep -vE "^\"$NAME\" " "$PGB/userlist.txt" > "$PGB/userlist.txt.new" || true
echo "\"$NAME\" \"$VERIFIER\"" >> "$PGB/userlist.txt.new"
chown --reference="$PGB/userlist.txt" "$PGB/userlist.txt.new"
chmod --reference="$PGB/userlist.txt" "$PGB/userlist.txt.new"
mv -f "$PGB/userlist.txt.new" "$PGB/userlist.txt"
systemctl reload pgbouncer.service
sleep 1
PGPASSWORD="$PGPW" psql -h 127.0.0.1 -p "$PGB_PORT" -U "$NAME" -d "$NAME" -Atc "SELECT 'pgbouncer ok'" \
  || { echo "!! login lewat PgBouncer gagal; kembalikan berkas *.bak-$TS bila perlu" >&2; exit 1; }
setenv DATABASE_URL "postgres://$NAME:$PGPW@127.0.0.1:$PGB_PORT/$NAME"
setenv DATABASE_URL_DIRECT "postgres://$NAME:$PGPW@127.0.0.1:$PG_PORT/$NAME"
chown "root:$APP" "$ENVF"; chmod 0640 "$ENVF"
echo "OK: DATABASE_URL & DATABASE_URL_DIRECT tertulis di $ENVF (sandi tidak ditampilkan)."
