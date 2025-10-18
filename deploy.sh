#!/bin/bash
set -e

# ===============================
# 🚀 Personal Portal — Deploy Script (extended .env safety)
# ===============================
# Выполняется автоматически через:
#   npm run deploy
# или вручную:
#   bash deploy.sh
#
# 🔧 Что делает:
# 1. Сохраняет все .env файлы (в корне и backend)
# 2. Обновляет код из GitHub
# 3. Восстанавливает .env файлы
# 4. Устанавливает зависимости и собирает фронтенд (Vite)
# 5. Перезапускает backend-сервис
# 6. Перезагружает nginx и проверяет API
# ===============================

PROJECT_DIR="/var/www/personal-portal"
BACKEND_DIR="$PROJECT_DIR/backend"
BRANCH="main"
SERVICE_NAME="personal-portal-backend"

# --- Пути к .env файлам ---
ENV_FILES=(
  "$PROJECT_DIR/.env"
  "$PROJECT_DIR/.env.production"
  "$PROJECT_DIR/.env.development"
  "$BACKEND_DIR/.env"
  "$BACKEND_DIR/.env.production"
  "$BACKEND_DIR/.env.development"
)

BACKUP_DIR="/tmp/personal-portal-env-backup"
mkdir -p "$BACKUP_DIR"

echo "=== 🚀 Starting deploy at $(date) ==="
cd "$PROJECT_DIR" || { echo "❌ ERROR: Project folder not found"; exit 1; }

# --- 0️⃣ BACKUP ENV FILES ---
echo "💾 Backing up environment files..."
for FILE in "${ENV_FILES[@]}"; do
  if [ -f "$FILE" ]; then
    BASENAME=$(basename "$FILE")
    cp "$FILE" "$BACKUP_DIR/$BASENAME"
    echo "✅ Saved $BASENAME"
  else
    echo "⚠️ Skipped missing $FILE"
  fi
done

# --- 1️⃣ GIT UPDATE ---
echo "📦 Updating repository..."
if ! git fetch origin "$BRANCH"; then
  echo "⚠️ Git fetch failed! Проверь подключение к GitHub."
  exit 1
fi

if ! git reset --hard "origin/$BRANCH"; then
  echo "⚠️ Git reset failed! Возможно, локальные изменения блокируют pull."
  echo "Используй 'git status' и 'git stash' вручную."
  exit 1
fi

# --- 2️⃣ RESTORE ENV FILES ---
echo "♻️ Restoring environment files..."
for FILE in "${ENV_FILES[@]}"; do
  BASENAME=$(basename "$FILE")
  if [ -f "$BACKUP_DIR/$BASENAME" ]; then
    TARGET_DIR=$(dirname "$FILE")
    mv "$BACKUP_DIR/$BASENAME" "$TARGET_DIR/$BASENAME"
    echo "✅ Restored $BASENAME"
  fi
done

# --- 3️⃣ INSTALL FRONTEND DEPENDENCIES ---
echo "🧩 Installing frontend dependencies..."
if ! npm ci --no-audit --no-fund; then
  echo "⚠️ npm install failed! Попробуй очистить кэш: 'sudo rm -rf node_modules package-lock.json && npm install'"
  exit 1
fi

# --- 4️⃣ BUILD FRONTEND ---
echo "🏗️ Building frontend..."
if ! npm run build; then
  echo "❌ Frontend build failed! Проверь vite.config.js и ошибки выше."
  exit 1
fi

# --- 5️⃣ BACKEND DEPLOY ---
echo "🛠️ Updating backend..."
cd "$BACKEND_DIR" || { echo "❌ Backend folder missing"; exit 1; }

if ! npm ci --no-audit --no-fund; then
  echo "⚠️ Backend npm install failed! Попробуй удалить node_modules и установить заново."
  exit 1
fi

echo "♻️ Restarting backend service..."
if systemctl is-active --quiet "$SERVICE_NAME"; then
  sudo systemctl restart "$SERVICE_NAME"
else
  echo "⚠️ Backend service not active — trying to start it..."
  sudo systemctl start "$SERVICE_NAME"
fi

# --- 6️⃣ RELOAD NGINX ---
echo "🌐 Reloading Nginx..."
if ! sudo nginx -t; then
  echo "❌ Nginx config error! Проверь /etc/nginx/sites-available/personal-portal"
  exit 1
fi

sudo systemctl reload nginx

# --- 7️⃣ HEALTH CHECK ---
echo "🩺 Checking backend health..."
sleep 2
if curl -fs http://127.0.0.1:4000/api/ >/dev/null; then
  echo "✅ Local backend is running"
else
  echo "⚠️ Backend may not be responding locally"
fi

if curl -fs -k https://samoshechkin.ru/api/ >/dev/null; then
  echo "✅ Public API reachable at https://samoshechkin.ru/api/"
else
  echo "⚠️ Public API unreachable! Проверь nginx proxy_pass или SSL-сертификаты."
fi

echo "=== ✅ Deploy complete at $(date) ==="
