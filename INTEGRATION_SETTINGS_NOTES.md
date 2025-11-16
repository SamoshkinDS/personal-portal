# Настройки интеграций

## Изменения
- создана таблица `settings` (key/value) и маршруты `/api/integration/settings` с GET/PATCH для вебхуков/n8n (`backend/db/settingsSchema.js`, `backend/routes/integrationSettings.js`);
- добавлены страница `IntegrationSettings` (`src/pages/analytics/IntegrationSettings.jsx`), API-клиент `integrationSettingsApi` и роут `/analytics/settings`, карточки инструкций и модалка;
- задокументирована новая страница в `docs/ANALYTICS_INTEGRATION_SETTINGS.md`.

## Архитектура
- backend хранит значения в `settings` и отдает только предопределённые ключи через `VALID_KEYS`;
- frontend заполняет поля формы, отправляет `PATCH` и отображает карточки инструкций с методами n8n.

## Настройки
- Ключ `api_log_requests` хранит строку `"true"`/`"false"` для чекбокса логирования.
