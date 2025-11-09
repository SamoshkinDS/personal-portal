#!/usr/bin/env bash
set -euo pipefail

# Load only needed vars from backend/.env (safe parser, no eval)
ENV_FILE="${XRAY_ENV_FILE:-/var/www/personal-portal/backend/.env}"
if [ -f "$ENV_FILE" ]; then
  while IFS='=' read -r key value; do
    # strip CR and surrounding quotes
    value="${value%$'\r'}"
    case "$key" in
      DB_NAME|DB_USER|DB_PASSWORD|DB_HOST|XRAY_CONFIG_PATH|XRAY_INBOUND_TAG)
        # remove optional surrounding quotes
        value="${value%\"}"; value="${value#\"}"
        export "$key"="$value"
      ;;
    esac
  done < <(grep -E '^(DB_NAME|DB_USER|DB_PASSWORD|DB_HOST|XRAY_CONFIG_PATH|XRAY_INBOUND_TAG)=' "$ENV_FILE" || true)
fi

# Non-interactive psql password when called from API
if [ "${XRAY_SYNC_NONINTERACTIVE:-}" = "1" ] && [ -n "${DB_PASSWORD:-}" ]; then
  export PGPASSWORD="$DB_PASSWORD"
fi

# Xray paths and inbound tag
CONFIG_FILE="${XRAY_CONFIG_PATH:-/usr/local/etc/xray/config.json}"
TMP_FILE="$(mktemp /tmp/xray_config_XXXX.json)"
INBOUND_TAG="${XRAY_INBOUND_TAG:-vless-in}"

echo "[INFO] Синхронизация пользователей Xray с БД..."

# DB params with defaults
DB_NAME="${DB_NAME:-portal_prod}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-}"

# Build psql options
PSQL_OPTS=(-U "$DB_USER" -d "$DB_NAME" -t -A -F ",")
if [ -n "$DB_HOST" ]; then
  PSQL_OPTS+=( -h "$DB_HOST" )
fi

# Fetch users
USERS_CSV=$(psql "${PSQL_OPTS[@]}" -c 'SELECT uuid::text, name FROM public."vless_keys";' || true)
if [ -z "$USERS_CSV" ]; then
  echo "[ERROR] Не удалось получить пользователей из БД" >&2
  exit 1
fi

# CSV -> JSON and map to {id,email}
USERS_JSON=$(printf '%s\n' "$USERS_CSV" | jq -R -s -c 'split("\n")[:-1] | map(split(",") | {"id": .[0], "email": (. [1] + "@vpn")})')
if [ -z "$USERS_JSON" ] || [ "$USERS_JSON" = "[]" ]; then
  echo "[ERROR] Список пользователей пуст" >&2
  exit 1
fi

CLIENTS_BLOCK=$(echo "$USERS_JSON" | jq '[.[] | { id: .id, email: .email }]')

# Update clients for inbound tag
jq --argjson clients "$CLIENTS_BLOCK" --arg tag "$INBOUND_TAG" \
  '(.inbounds[] | select(.tag == $tag) | .settings.clients) = $clients' \
  "$CONFIG_FILE" > "$TMP_FILE"

# Validate JSON
if ! jq empty "$TMP_FILE" >/dev/null 2>&1; then
  echo "[ERROR] Ошибка в JSON — проверка не пройдена" >&2
  rm -f "$TMP_FILE"
  exit 1
fi

mv "$TMP_FILE" "$CONFIG_FILE"
systemctl restart xray
echo "[OK] Конфигурация клиентов Xray обновлена."

