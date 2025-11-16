name: Промтмастер — генератор промтов
description: Страница /ai/promptmaster с очередью запросов в n8n и библиотекой готовых промтов.

## Функциональные блоки
- Поле запроса: большой input с placeholder «Мне нужна идея для развития своего сайта», отправка создаёт черновик в prompt_requests, сразу вызывает webhook в n8n.
- Очередь: таблица с колонками Запрос / Статус / Дата / Действие (раскрыть), итоговый промт скрыт до клика; поддержаны статусы Черновик → Отправлено → В работе → Завершено → Ошибка.
- Раскрытие: отображение result с кнопкой «Копировать»; при ошибке доступна «Повторить» для отправки вебхука ещё раз.
- Библиотека: сетка карточек папок и статей, хлебные крошки; детальная панель статьи с текстом промта и копированием.

## Backend
- Схема: `backend/db/promptmasterSchema.js` добавляет таблицы prompt_requests(id,query,result,status,created_at,updated_at), prompt_categories(id,title,description,parent_category_id,created_at,updated_at), prompt_articles(id,category_id,title,description,content,created_at,updated_at) + индексы и триггеры set_updated_at.
- Сиды: базовые категории и статьи по структуре ТЗ (Написание текстов, Продуктовая работа, IT & Аналитика, Общие промты) добавляются при первом старте.
- Маршруты: `backend/routes/promptmaster.js`, подключены в `backend/index.js` как `/api/promptmaster/*`.
  - POST `/api/promptmaster/requests` (auth, view_ai) — создать черновик, сразу вызвать webhook, статус → sent/error.
  - GET `/api/promptmaster/requests` (auth, view_ai) — список очереди (limit=100 по умолчанию).
  - POST `/api/promptmaster/webhook` (auth, view_ai) — ручной вызов вебхука н8n для request_id, можно переопределить query.
  - POST `/api/promptmaster/response` (публичный, опциональный токен) — обратный вызов от n8n с полями request_id, result_prompt, status (processing/done/error/...).
  - GET `/api/promptmaster/categories` (auth, view_ai) — корневой уровень или parentId, отдаёт categories + articles.
  - GET `/api/promptmaster/categories/:id` (auth, view_ai) — категория с дочерними элементами.
  - GET `/api/promptmaster/articles/:id` (auth, view_ai) — деталь статьи.
- Вызов webhook: POST на PROMPTMASTER_WEBHOOK_URL с {request_id,query}, Authorization Bearer PROMPTMASTER_WEBHOOK_TOKEN если задан; таймаут 8 c.
- Безопасность ответа: если PROMPTMASTER_RESPONSE_TOKEN указан — требуется заголовок `x-promptmaster-token` или query `token`.

## Frontend
- Страница: `src/pages/Promptmaster.jsx`, маршрут `/ai/promptmaster` (router.jsx) и пункт в сайдбаре `AI / Промтмастер`.
- API-обёртка: `src/api/promptmaster.js` (requests, webhook resend, categories/articles).
- UI: блок отправки запроса, таблица очереди (раскрытие результата, копирование, повтор при ошибке), блок библиотеки с карточками папок/статей, хлебные крошки, панель детали статьи с копированием.
- Статусы отображаются бейджами по статусам из БД (draft, sent, processing, done, error).

## ENV и интеграция
- PROMPTMASTER_WEBHOOK_URL — адрес webhook н8n для отправки запросов.
- PROMPTMASTER_WEBHOOK_TOKEN — необязательный Bearer для вызова вебхука.
- PROMPTMASTER_RESPONSE_TOKEN — токен, который должен прислать n8n в `x-promptmaster-token` или `?token=` при POST /api/promptmaster/response.

## Поток статусов
- Черновик: создаётся при POST /requests.
- Отправлено: после успешного вызова вебхука.
- В работе: n8n может выставить через /response c status=processing.
- Завершено: n8n отвечает /response с result_prompt (status=done по умолчанию).
- Ошибка: если webhook недоступен или n8n возвращает status=error.

## MVP чеклист (соответствие ТЗ)
- Поле запроса работает, создаёт запись и шлёт webhook.
- Очередь отображается и раскрывает промт, статусы обновляются.
- Webhook ответов обрабатывается, можно копировать итоговый промт.
- Библиотека промтов отображается, папки открываются, статьи читабельны и копируются.
