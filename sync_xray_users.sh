#!/bin/bash
# Путь к конфигу Xray
CONFIG_FILE="/usr/local/etc/xray/config.json"
# Временный файл для нового конфига
TMP_FILE="/tmp/xray_config_new.json"
# Данные для подключения к PostgreSQL
DB_NAME="portal_prod"
DB_USER="postgres"
DB_HOST="localhost"

echo "[INFO] Синхронизация пользователей Xray с БД..."

# Получаем список UUID и email из таблицы vless_keys
# Форматируем в JSON-массив
USERS_JSON=$(psql -U "$DB_USER" -h "$DB_HOST" -d "$DB_NAME" -t -A -F"," -c \
  "SELECT uuid, name FROM public.\"vless_keys\";" | jq -R -s -c \
  'split("\n")[:-1] | map(split(",") | {"id": .[0], "email": (. [1] + "@vpn")})')

if [[ -z "$USERS_JSON" || "$USERS_JSON" == "[]" ]]; then
  echo "[ERROR] Не удалось получить пользователей из БД или список пуст."
  exit 1
fi

# Создаём обновлённый блок клиентов
CLIENTS_BLOCK=$(echo "$USERS_JSON" | jq '[.[] | {id: .id, email: .email}]')

# Обновляем блок clients в config.json
jq --argjson clients "$CLIENTS_BLOCK" '
  (.inbounds[] | select(.tag == "vless-in") | .settings.clients) = $clients
' "$CONFIG_FILE" > "$TMP_FILE"

# Проверяем синтаксис
if ! jq empty "$TMP_FILE" 2>/dev/null; then
  echo "[ERROR] Ошибка в JSON после обновления!"
  exit 1
fi

# Перезаписываем конфиг и перезапускаем Xray
mv "$TMP_FILE" "$CONFIG_FILE"
systemctl restart xray

echo "[OK] Конфиг обновлён и Xray перезапущен."
