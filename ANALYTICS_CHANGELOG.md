# Аналитика: темы, статьи и очередь — что изменилось

## Кратко
- Добавлены таблицы и API для тем, статей и очереди статей (включая обработку n8n и публикацию).
- Развернутый раздел в UI: главная аналитики, страницы темы/статьи, страница очереди с модалками и фильтрами.
- Навигация дополнена подпунктами аналитики, есть инструкция по API для интеграций.

## Архитектура
- Бэкенд: новые сущности (`topics`, `articles`, `articles_queue`) и роуты `backend/routes/analytics.js`. Схема и сидинг в `backend/db/analyticsSchema.js`; инициализация из `backend/index.js`.
- После публикации запись очереди ссылается на созданную статью (`published_article_id`, `published_topic_id`, `status=published`), а статья хранит `queue_id`.
- Поиск тем учитывает совпадения в заголовках/описаниях/тегах и найденные статьи.
- Опциональный токен безопасности для GET `/api/articles-queue?status=processing`: `ARTICLES_QUEUE_TOKEN` (query `token` или header `x-queue-token`).

## UI и маршруты
- `/analytics` — карточки тем с поиском и ссылкой на очередь.
- `/analytics/topics/:topicId` — хлебные крошки, описание, теги, подтемы, статьи.
- `/analytics/articles/:articleId` — контент, теги, отметка «Из очереди #», inline-редактирование summary/content.
- `/analytics/queue` — таблица очереди, фильтр статуса, чекбокс «Скрывать опубликованные», редактирование полей, контент черновика, публикация через дерево тем, модалка инструкции для n8n.
- Sidebar: подпункты «Главная» и «Очередь статей» в разделе аналитики.

## API точки
- Темы: `GET /api/analytics/topics`, `GET /api/analytics/topics/:idOrSlug`.
- Статьи: `GET /api/analytics/articles/:id`, `PATCH /api/analytics/articles/:id`.
- Очередь (UI): `GET/POST/PATCH /api/articles-queue`, `GET /api/articles-queue/:id`, `POST /api/articles-queue/:id/publish`.
- Интеграция n8n: `GET /api/articles-queue?status=processing[&token=...]`, `POST /api/articles` (queue_id, title, content, tags?, status=finished).

## Настройки и данные
- ENV: `ARTICLES_QUEUE_TOKEN` (необязательно) — токен для публичной выдачи статуса processing.
- Сидинг: стартовые темы (Моделирование процессов, Интеграции и API, Базы данных), одна статья BPMN и три записи очереди разных статусов.
- Требуемые таблицы и триггеры создаются автоматически при старте бэкенда.
