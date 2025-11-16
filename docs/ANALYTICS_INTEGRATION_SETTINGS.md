name: Аналитика → Настройки
description: Управление вебхуками, API-ключом n8n и инструкциями по интеграциям в одном месте.

## Раздел
- Страница доступна как `Аналитика` → `Integrations` и отображает заголовок, сохранение вебхуков и инструкции n8n.
- Интерфейс разбит на карту настроек вебхуков и сетку карточек инструкций (две колонки).

## Настройки
- Хранятся в таблице `settings` (ключ/значение) с ключами: `webhook_interview`, `webhook_tests`, `webhook_promptmaster`, `webhook_articles_queue`, `api_key_n8n`, `api_log_requests`.
- Значения сохраняются через `PATCH /api/integration/settings`, чтение доступно по `GET /api/integration/settings`.
- Настройки защищены `authRequired`, связаны с `integrationSettingsApi`.

## Инструкции
- Карточки описывают:
  * `POST /api/interview/import`
  * `POST /api/cheats/import`
  * `GET /api/tests?status=pending_generation`
  * `POST /api/promptmaster`
- Клик открывает модалку с описанием процесса, примером payload, списком типичных ошибок и советами для n8n.

## UI
- Страница построена с `PageShell`, `Modal`, стандартными `input`/`textarea`.
- Карточки инструкций появляются в две колонки и открывают широкие модалки с деталями.
