#!/bin/bash
set -e

PROJECT_DIR="/var/www/personal-portal"
BACKEND_DIR="$PROJECT_DIR/backend"
BRANCH="main"
SERVICE_NAME="personal-portal-backend"
BACKUP_DIR="/tmp/personal-portal-env-backup"

echo "=== 🚀 Starting deploy at $(date) ==="

# 🧾 Проверка прав и попытка автоисправления
if [ ! -w "$PROJECT_DIR" ]; then
  echo "⚠️ Недостаточно прав на $PROJECT_DIR, пытаюсь исправить..."
  sudo chown -R $(whoami):www-data "$PROJECT_DIR" || echo "⚠️ Не удалось сменить владельца (нужен sudo)"
  sudo chmod -R 775 "$PROJECT_DIR" || echo "⚠️ Не удалось применить chmod (нужен sudo)"
fi

# 💾 Резервная копия .env перед обновлением
echo "💾 Backing up environment files..."
mkdir -p "$BACKUP_DIR"
if [ -f "$BACKEND_DIR/.env" ]; then
  cp "$BACKEND_DIR/.env" "$BACKUP_DIR/" 2>/dev/null || sudo cp "$BACKEND_DIR/.env" "$BACKUP_DIR/"
fi

# 📦 GIT update
cd "$PROJECT_DIR"
echo "📦 Updating repository..."
git fetch origin "$BRANCH" || { echo "⚠️ Git fetch failed"; exit 1; }
git reset --hard "origin/$BRANCH" || { echo "⚠️ Git reset failed"; exit 1; }

# 🧩 Установка зависимостей фронта
echo "🧩 Installing frontend dependencies..."
if ! npm ci --no-audit --no-fund; then
  echo "⚠️ npm install failed, пытаюсь исправить права и повторить..."
  sudo chown -R $(whoami):www-data node_modules package-lock.json 2>/dev/null || true
  sudo chmod -R 775 node_modules package-lock.json 2>/dev/null || true
  npm ci --no-audit --no-fund || { echo "❌ npm install все еще не удалось"; exit 1; }
fi

# 🏗️ Сборка фронтенда
echo "🏗️ Building frontend..."
npm run build || { echo "❌ Frontend build failed"; exit 1; }

# 🛠️ Backend
echo "🛠️ Updating backend..."
cd "$BACKEND_DIR"
if ! npm ci --no-audit --no-fund; then
  echo "⚠️ Backend npm install failed, пытаюсь исправить права..."
  sudo chown -R $(whoami):www-data node_modules package-lock.json 2>/dev/null || true
  sudo chmod -R 775 node_modules package-lock.json 2>/dev/null || true
  npm ci --no-audit --no-fund || { echo "❌ Backend npm install все еще не удалось"; exit 1; }
fi

# ♻️ Перезапуск сервиса
echo "♻️ Restarting backend service..."
if sudo systemctl restart "$SERVICE_NAME"; then
  echo "✅ Сервис $SERVICE_NAME успешно перезапущен"
else
  echo "⚠️ Не удалось перезапустить сервис, проверь systemctl status"
fi



# 🌐 Проверка nginx
echo "🌐 Reloading Nginx..."
if sudo nginx -t; then
  sudo systemctl reload nginx
  echo "✅ Nginx успешно перезагружен"
else
  echo "⚠️ Ошибка проверки nginx.conf"
fi



# 🩺 Health check
echo "🩺 Checking API..."
if curl -fs http://127.0.0.1:4000/api/ >/dev/null; then
  echo "✅ Backend работает локально"
else
  echo "⚠️ Backend не отвечает локально"
fi

if curl -fs -k https://samoshechkin.ru/api/ >/dev/null; then
  echo "✅ API доступен публично"
else
  echo "⚠️ API не доступен извне"
fi

echo "=== ✅ Deploy complete at $(date) ==="
