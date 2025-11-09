#!/bin/bash
set -euo pipefail

PROJECT_DIR="/var/www/personal-portal"
BACKEND_DIR="$PROJECT_DIR/backend"
BRANCH="main"
SERVICE_NAME="personal-portal-backend"
BACKUP_DIR="/tmp/personal-portal-env-backup"
LOG_DIR="/var/log/personal-portal"
LOG_FILE="$LOG_DIR/deploy.log"

mkdir -p "$LOG_DIR"
touch "$LOG_FILE"
exec > >(tee -a "$LOG_FILE") 2>&1

CURRENT_USER=$(whoami)
RUN_CMD="sudo"
if [ "$CURRENT_USER" = "root" ]; then
  RUN_CMD=""
fi

run_cmd() {
  if [ -z "$RUN_CMD" ]; then
    "$@"
  else
    sudo "$@"
  fi
}

NOW_TS=$(date '+%Y-%m-%d %H:%M:%S')
echo "=== ✅ Starting deploy at $NOW_TS ==="
echo "🧩 Node version: $(node -v)"
echo "🧩 NPM version: $(npm -v)"

if [ ! -w "$PROJECT_DIR" ]; then
  echo "⚠️ Нет прав на запись в $PROJECT_DIR, пытаюсь поправить..."
  run_cmd chown -R $(whoami):www-data "$PROJECT_DIR" || echo "⚠️ Не удалось изменить владельца (нужно sudo)"
  run_cmd chmod -R 775 "$PROJECT_DIR" || echo "⚠️ Не удалось изменить права (нужно sudo)"
fi

echo "📦 Backing up environment files..."
mkdir -p "$BACKUP_DIR"
if [ -f "$BACKEND_DIR/.env" ]; then
  cp "$BACKEND_DIR/.env" "$BACKUP_DIR/" 2>/dev/null || sudo cp "$BACKEND_DIR/.env" "$BACKUP_DIR/"
fi

cd "$PROJECT_DIR"
echo "🔄 Updating repository..."
git fetch origin "$BRANCH" || { echo "❌ Git fetch failed"; exit 1; }
git reset --hard "origin/$BRANCH" || { echo "❌ Git reset failed"; exit 1; }

echo "🔧 Installing frontend dependencies..."
if ! (
  cd "$PROJECT_DIR"
  export npm_config_production=false
  npm ci --no-audit --no-fund
); then
  echo "⚠️ npm ci failed, trying to fix permissions..."
  run_cmd chown -R $(whoami):www-data "$PROJECT_DIR/node_modules" "$PROJECT_DIR/package-lock.json" 2>/dev/null || true
  run_cmd chmod -R 775 "$PROJECT_DIR/node_modules" "$PROJECT_DIR/package-lock.json" 2>/dev/null || true
  (
    cd "$PROJECT_DIR"
    export npm_config_production=false
    npm ci --no-audit --no-fund
  ) || { echo "❌ npm install окончательно упал"; exit 1; }
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
npx vite build || { echo "❌ Frontend build failed"; exit 1; }
if [ -d "$PROJECT_DIR/dist" ]; then
  echo "✅ Frontend build completed"
else
  echo "❌ Frontend build directory not found" >&2
  exit 1
fi

echo "🛠️ Updating backend dependencies..."
cd "$BACKEND_DIR"
if ! npm ci --no-audit --no-fund; then
  echo "⚠️ Backend npm ci failed, trying to fix permissions..."
  run_cmd chown -R $(whoami):www-data node_modules package-lock.json 2>/dev/null || true
  run_cmd chmod -R 775 node_modules package-lock.json 2>/dev/null || true
  npm ci --no-audit --no-fund || { echo "❌ Backend npm install окончательно упал"; exit 1; }
fi

cd "$PROJECT_DIR"
echo "🔁 Restarting backend service..."
if ${RUN_CMD:-} systemctl restart "$SERVICE_NAME"; then
  echo "✅ Сервис $SERVICE_NAME успешно перезапущен"
else
  echo "❌ Не удалось перезапустить $SERVICE_NAME, смотрите systemctl status" >&2
  exit 1
fi

echo "🌐 Reloading Nginx..."
if ${RUN_CMD:-} nginx -t; then
  ${RUN_CMD:-} systemctl reload nginx || echo "⚠️ Не удалось перезагрузить Nginx" >&2
  echo "✅ Nginx конфигурация применена"
else
  echo "❌ nginx configuration test failed" >&2
fi

echo "🩺 Checking API..."
sleep 5  # даём сервису 5 секунды на запуск
if curl -fs http://127.0.0.1:4000/api/ >/dev/null; then
  echo "✅ Backend доступен локально"
else
  echo "❌ Backend не отвечает локально" >&2
fi

if curl -fs -k https://samoshechkin.ru/api/ >/dev/null; then
  echo "✅ API доступен публично"
else
  echo "❌ API недоступен публично" >&2
fi

echo "=== ✅ Deploy complete at $(date '+%Y-%m-%d %H:%M:%S') ==="
