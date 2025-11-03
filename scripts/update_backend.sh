#!/bin/bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/personal-portal}"
BACKEND_DIR="${BACKEND_DIR:-$PROJECT_DIR/backend}"
SERVICE_NAME="${SERVICE_NAME:-personal-portal-backend}"

echo "=== Backend update started at $(date '+%Y-%m-%d %H:%M:%S') ==="

if [ ! -d "$BACKEND_DIR" ]; then
  echo "!! backend directory not found: $BACKEND_DIR" >&2
  exit 1
fi

cd "$BACKEND_DIR"

echo "-- Installing backend dependencies..."
if ! npm ci --no-audit --no-fund; then
  echo "!! npm ci failed, fixing permissions and retrying..."
  sudo chown -R "$(whoami)":www-data node_modules package-lock.json 2>/dev/null || true
  sudo chmod -R 775 node_modules package-lock.json 2>/dev/null || true
  npm ci --no-audit --no-fund
fi

echo "-- Restarting service: $SERVICE_NAME"
if ! sudo systemctl restart "$SERVICE_NAME"; then
  echo "!! failed to restart service $SERVICE_NAME" >&2
fi

if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
  echo "-- Service $SERVICE_NAME is active"
else
  echo "!! Service $SERVICE_NAME is not active" >&2
fi

echo "=== Backend update finished ==="
