#!/usr/bin/env bash
# Deploy dari laptop:  bash deploy/deploy.sh
# Server memasang kode yang SUDAH ada di GitHub (bukan berkas dari laptop), jadi lokal = GitHub = server.
# Variabel: DEPLOY_HOST (bawaan root@103.235.75.156), BRANCH (bawaan main)
set -euo pipefail

HOST="${DEPLOY_HOST:-root@103.235.75.156}"
BRANCH="${BRANCH:-main}"
cd "$(dirname "$0")/.."

if [ -n "$(git status --porcelain)" ]; then
  echo "!! ada perubahan yang belum di-commit. Commit & push dulu:" >&2
  git status --short >&2
  exit 1
fi
git fetch -q origin "$BRANCH"
SHA="$(git rev-parse HEAD)"
if ! git merge-base --is-ancestor "$SHA" "origin/$BRANCH"; then
  echo "!! commit ${SHA:0:7} belum ada di origin/$BRANCH. Jalankan: git push origin $BRANCH" >&2
  exit 1
fi

echo ">> pasang commit ${SHA:0:7} ($(git log -1 --format=%s)) di $HOST"
ssh "$HOST" "bash -s -- $SHA" < deploy/release.sh
