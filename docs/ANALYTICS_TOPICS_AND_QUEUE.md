name: Аналитика — темы, статьи и очередь
description: Каталог знаний с темами, статьями и очередью публикаций с интеграцией n8n.

## Состав доработки
- UX: новые страницы `Аналитика / Главная`, `Тема`, `Статья`, `Очередь статей`, модалки выбора темы и инструкции для n8n.
- Backend: схема `topics`, `articles`, `articles_queue`, API для дерева тем, статей, очереди, публикации и приема результатов от n8n.
- Интеграция: GET `/api/articles-queue?status=processing` для n8n, POST `/api/articles` для загрузки готовых статей, publish из UI в выбранную тему/подтему.
- Фильтры очереди: статус (все/черновик/обработка/завершено/опубликовано) + чекбокс «Скрывать опубликованные».
- Статусы очереди: draft, processing, finished, published; публикация переносит контент в `articles` и помечает очередь как published.

## Backend
- Файл схемы: `backend/db/analyticsSchema.js`
  - Таблицы `topics` (slug, title, description, tags, parent_topic_id, timestamps), `articles` (topic_id, queue_id, title, summary, content, tags, timestamps), `articles_queue` (title, description, status, content, tags, published_article_id, published_topic_id, timestamps).
  - Индексы по parent_topic_id, topic_id, status; триггеры set_updated_at на все таблицы.
  - Сидинг: базовые темы/подтемы (Моделирование процессов, Интеграции и API, Базы данных) + примерные статьи и записи очереди.
- Роуты: `backend/routes/analytics.js`
  - `/api/analytics/topics` (GET, auth) — дерево тем, search по названию/описанию/тегам + совпадения статей.
  - `/api/analytics/topics/:idOrSlug` (GET, auth) — тема, хлебные крошки, подтемы, статьи.
  - `/api/analytics/articles/:id` (GET, auth) — статья с темой/крошками; `/api/analytics/articles/:id` (PATCH) — редактирование summary/content/tags.
  - `/api/articles-queue` (GET) — список/фильтр очереди; GET status=processing доступен для n8n (при наличии `ARTICLES_QUEUE_TOKEN` проверяется query/header). POST/PATCH/GET:id/PUBLISH — под auth.
  - `/api/articles` (POST) — точка для n8n: сохраняет контент в очереди, выставляет статус finished.
  - Публикация: `/api/articles-queue/:id/publish` — создает статью в выбранной теме, помечает очередь published, сохраняет ссылки.
- Инициализация: `ensureAnalyticsSchema()` подключено в `backend/index.js`.
- Опциональный ENV: `ARTICLES_QUEUE_TOKEN` — токен для публичного GET status=processing.

## Frontend
- API-клиент: `src/api/analytics.js` — темы, статьи, очередь, публикация, обновление.
- Страницы:
  - `src/pages/Analytics.jsx` — главная аналитики: поиск по темам/статьям, карточки тем, ссылка на очередь.
  - `src/pages/analytics/Topic.jsx` — страница темы: хлебные крошки, описание, теги, сетка подтем, список статей.
  - `src/pages/analytics/Article.jsx` — просмотр/редактирование статьи, теги, крошки, отметка «Из очереди #id».
  - `src/pages/analytics/Queue.jsx` — очередь статей: фильтры, таблица, предпросмотр/редактирование, модалка публикации, модалка инструкции для n8n.
- Навигация: `Sidebar` теперь раскрывает аналитику (Главная, Очередь статей); роуты в `src/router.jsx`.
- UI требования: карточки тем/подтем (сеткой), статьи списком, таблица очереди, белые центрированные модалки.

## API сводка
- Темы: `GET /api/analytics/topics?search=&includeCounts=1`, `GET /api/analytics/topics/:idOrSlug`.
- Статьи: `GET /api/analytics/articles/:id`, `PATCH /api/analytics/articles/:id`.
- Очередь: `GET /api/articles-queue?status=...&hidePublished=...`, `POST /api/articles-queue`, `PATCH /api/articles-queue/:id`, `GET /api/articles-queue/:id`, `POST /api/articles-queue/:id/publish`.
- n8n: `GET /api/articles-queue?status=processing[&token=...]`, `POST /api/articles` (body: queue_id, title, content, tags?, status=finished).

## Статусы и правила
- draft — ручной черновик, не отдается в n8n.
- processing — доступно для n8n (GET status=processing).
- finished — n8n загрузил контент, готово к публикации.
- published — опубликовано в выбранную тему; по умолчанию скрывается фильтром «Скрывать опубликованные».

## UX заметки
- Preview очереди открывается при клике по строке: редактирование title/description/content/status, кнопка публикации (активна при наличии контента).
- Публикация требует выбора темы/подтемы в дереве; после публикации есть ссылка на статью.
- Поиск на главной фильтрует по названиям/описаниям/тегам тем и совпадениям статей.
