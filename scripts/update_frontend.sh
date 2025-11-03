#!/bin/bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/personal-portal}"

echo "=== Frontend build started at $(date '+%Y-%m-%d %H:%M:%S') ==="
cd "$PROJECT_DIR"

echo "-- Installing frontend dependencies..."
if ! npm ci --no-audit --no-fund; then
  echo "!! npm ci failed, attempting to fix permissions..."
  sudo chown -R "$(whoami)":www-data node_modules package-lock.json 2>/dev/null || true
  sudo chmod -R 775 node_modules package-lock.json 2>/dev/null || true
  npm ci --no-audit --no-fund
fi

echo "-- Building frontend..."
npm run build

if command -v nginx >/dev/null 2>&1; then
  echo "-- Reloading Nginx..."
  if sudo nginx -t; then
    sudo systemctl reload nginx || echo "!! failed to reload nginx" >&2
  else
    echo "!! nginx configuration test failed" >&2
  fi
fi

echo "=== Frontend build finished ==="
