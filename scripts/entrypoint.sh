#!/bin/sh
set -e

echo "[entrypoint] Menjalankan migrasi database..."
npx drizzle-kit migrate

echo "[entrypoint] Menjalankan seed data awal..."
node scripts/seed.mjs

echo "[entrypoint] Menjalankan aplikasi..."
exec node server.js
