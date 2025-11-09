#!/bin/bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/personal-portal}"
LOG_DIR="${LOG_DIR:-/var/log/personal-portal}"
LOG_FILE="${LOG_FILE:-${LOG_DIR}/frontend-build.log}"

mkdir -p "$LOG_DIR"
touch "$LOG_FILE"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "=== Frontend build started at $(date '+%Y-%m-%d %H:%M:%S') ==="
cd "$PROJECT_DIR"

echo "🔧 Installing frontend dependencies..."
if ! (
  cd "$PROJECT_DIR"
  export npm_config_production=false
  npm ci --no-audit --no-fund
); then
  echo "!! npm ci failed, attempting to fix permissions..."
  sudo chown -R "$(whoami)":www-data "$PROJECT_DIR/node_modules" "$PROJECT_DIR/package-lock.json" 2>/dev/null || true
  sudo chmod -R 775 "$PROJECT_DIR/node_modules" "$PROJECT_DIR/package-lock.json" 2>/dev/null || true
  (
    cd "$PROJECT_DIR"
    export npm_config_production=false
    npm ci --no-audit --no-fund
  )
fi

echo "🏗️ Building frontend..."
export PATH="$PROJECT_DIR/node_modules/.bin:$PATH"
if ! command -v vite >/dev/null 2>&1; then
  echo "ℹ️ vite not found in PATH — installing as devDependency..."
  (
    cd "$PROJECT_DIR"
    npm_config_production=false npm i -D vite@^7
  )
fi
npx vite build

if command -v nginx >/dev/null 2>&1; then
  echo "-- Reloading Nginx..."
  if sudo nginx -t; then
    sudo systemctl reload nginx || echo "!! failed to reload nginx" >&2
  else
    echo "!! nginx configuration test failed" >&2
  fi
fi

if [ -d "$PROJECT_DIR/dist" ]; then
  echo "=== Frontend build finished successfully ==="
else
  echo "!! dist directory not found after build" >&2
  exit 1
fi
