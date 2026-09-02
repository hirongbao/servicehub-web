#!/usr/bin/env bash
set -Eeuo pipefail

APP_ROOT="/opt/apps/servicehub-admin"
SOURCE_DIR="$APP_ROOT/source"
RELEASES_DIR="$APP_ROOT/releases"
CURRENT_LINK="$APP_ROOT/current"
LOCK_FILE="/tmp/servicehub-admin-deploy.lock"

exec 9>"$LOCK_FILE"
flock -n 9 || { echo "another admin deployment is already running"; exit 0; }

release_dir="$RELEASES_DIR/$(date +%Y%m%d%H%M%S)"
mkdir -p "$RELEASES_DIR"

cd "$SOURCE_DIR"
git fetch origin main
git pull --ff-only origin main
npm ci
npm run build

mkdir -p "$release_dir"
cp -a dist server.js package.json package-lock.json "$release_dir/"
ln -sfn "$release_dir" "$CURRENT_LINK"

systemctl --user restart servicehub-admin.service

for i in $(seq 1 30); do
  if curl -fsS --max-time 2 http://127.0.0.1:3000/ >/dev/null; then
    echo "admin deployment succeeded"
    exit 0
  fi
  sleep 1
done

echo "admin deployment failed health check" >&2
systemctl --user status servicehub-admin.service --no-pager >&2 || true
exit 1
