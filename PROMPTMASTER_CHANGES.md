Промтмастер внедрён как новая страница внутри AI & ML.

## Что сделано
- Добавлена страница `/ai/promptmaster` с отправкой запросов, очередью и библиотекой промтов.
- Реализованы API и схемы БД для очереди (prompt_requests) и каталога (prompt_categories/prompt_articles) с начальными данными.
- Встроены вебхуки для передачи запросов в n8n и приёма готовых промтов, плюс стартовые хлебные крошки/карточки в UI.

## Архитектура
- Frontend: `src/pages/Promptmaster.jsx` опирается на `src/api/promptmaster.js`, использует PageShell, бейджи статусов, раскрытие таблицы, панель деталей статьи. Путь и пункт меню добавлены в `src/router.jsx` и `src/components/Sidebar.jsx`.
- Backend: `backend/routes/promptmaster.js` обслуживает очередь, библиотеку, пересылку webhook и обратный ответ от n8n. Схема в `backend/db/promptmasterSchema.js` создаёт таблицы, индексы, триггеры и сирит стартовые категории/статьи.
- Инициализация: `backend/index.js` подключает новые маршруты и ensurePromptmasterSchema.

## Настройки и интеграция
- `PROMPTMASTER_WEBHOOK_URL` — адрес webhook в n8n для исходящих запросов (POST body `{ request_id, query }`).
- `PROMPTMASTER_WEBHOOK_TOKEN` — опциональный Bearer для этого вызова.
- `PROMPTMASTER_RESPONSE_TOKEN` — если задан, обязателен в `x-promptmaster-token` или ?token= при POST `/api/promptmaster/response` от n8n.
- Доступ контролируется правом `view_ai`, как и остальные страницы AI.

## API и данные
- Очередь: POST `/api/promptmaster/requests` (создать + вызвать webhook), GET `/api/promptmaster/requests` (лист), POST `/api/promptmaster/webhook` (ручной resend), POST `/api/promptmaster/response` (ответ n8n, status/result_prompt).
- Библиотека: GET `/api/promptmaster/categories` (root или parentId), GET `/api/promptmaster/categories/:id`, GET `/api/promptmaster/articles/:id`.
- Таблицы: prompt_requests, prompt_categories, prompt_articles, статусы draft/sent/processing/done/error.
