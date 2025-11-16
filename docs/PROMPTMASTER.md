name: Промтмастер — генератор промтов
description: Страница /ai/promptmaster с очередью запросов в n8n и библиотекой готовых промтов.

## Функциональные блоки
- Поле запроса: большой input с placeholder «Мне нужна идея для развития своего сайта», отправка создаёт черновик в prompt_requests и сразу вызывает webhook в n8n.
- Очередь: таблица с колонками Запрос / Статус / Дата / Действие (раскрыть) — статусы Черновик → Отправлено → В работе → Завершено → Ошибка.
- Раскрытие: итоговый промт показывается по клику с кнопкой «Копировать», при ошибке есть «Повторить».
- Библиотека: сетка карточек папок и статей, хлебные крошки, боковая панель деталей промта.
- Создание контента: модалка «Добавить +» с режимами «Промт» и «Папка», формы добавляют записи в БД и обновляют каталог.
- Настройки: кнопка «Настройки» открывает модалку с webhook-url/token/response-token; значения сохраняются в prompt_settings и используются, если env не заданы.

## Backend
- Схема: `backend/db/promptmasterSchema.js` — таблицы prompt_requests, prompt_categories, prompt_articles, prompt_settings, индексы и триггеры set_updated_at.
- Сиды: базовые категории и статьи из ТЗ добавляются при первом старте.
- Маршруты `backend/routes/promptmaster.js` (`/api/promptmaster/*`, auth view_ai):
  - POST `/requests` — создать черновик, вызвать webhook, статус → sent/error.
  - GET `/requests` — список очереди (limit=100 по умолчанию).
  - POST `/webhook` — ручной вызов webhook для request_id, можно переопределить query.
  - POST `/response` — обратный вызов от n8n с request_id, result_prompt, status.
  - GET `/categories` (root или parentId) / GET `/categories?all=true` — плоский список папок.
  - GET `/categories/:id` — категория с дочерними элементами.
  - POST `/categories` — создать папку (title, description?, parentId?).
  - GET `/articles/:id` — деталь статьи.
  - POST `/articles` — создать статью/промт (categoryId, title, description?, content?).
  - GET `/settings` / POST `/settings` — чтение/сохранение webhook-url/token/response-token.
- Вызов webhook: POST на PROMPTMASTER_WEBHOOK_URL (или сохранённый в БД) с {request_id, query}; Authorization Bearer PROMPTMASTER_WEBHOOK_TOKEN при наличии; таймаут 8 с.
- Ответ от n8n: проверка PROMPTMASTER_RESPONSE_TOKEN (env или БД) через заголовок `x-promptmaster-token` или query `token`.

## Frontend
- Страница: `src/pages/Promptmaster.jsx`, маршрут `/ai/promptmaster`, пункт в сайдбаре `AI / Промтмастер`.
- API: `src/api/promptmaster.js` — очередь запросов, resend webhook, категории/статьи, создание контента, плоский список папок, загрузка/сохранение настроек.
- UI: отправка запроса, таблица очереди, карточки папок/статей, хлебные крошки, детальная панель, модалка «Добавить +» (Промт/Папка), модалка «Настройки».
- Статусы отображаются бейджами draft/sent/processing/done/error.

## ENV и интеграция
- PROMPTMASTER_WEBHOOK_URL / PROMPTMASTER_WEBHOOK_TOKEN — приоритет над значениями из БД.
- PROMPTMASTER_RESPONSE_TOKEN — токен, который должен присылать n8n в ответе.

## Поток статусов
- Прогресс: Черновик → Отправлено → В работе → Завершено, Ошибка при недоступном webhook или ответе n8n со статусом error.

## MVP чеклист
- Поле запроса работает, запрос отправляется в webhook.
- Очередь отображает статусы и раскрывает итоговый промт.
- Ответы webhook обрабатываются, копирование доступно.
- Библиотека открывает папки и статьи, копирование работает.
- Можно добавлять папки и промты из UI.
- Настройки webhook/token можно менять через модалку и сохранять в БД.
