# Подготовка к собеседованию

## Изменения
- добавлена новая страница `/analytics/interview` с фильтрами, таблицей, модалками просмотра/редактирования и поддержкой импорта;
- расширен `Sidebar` и `router.jsx`, добавлен `interviewApi`, UI использует `Modal`, `PageShell`, `react-hot-toast`, `useDebouncedValue`;
- реализованы бекенд-эндпоинты в `backend/routes/interview.js`, новая таблица `interview_questions` + схема/инициализация в `backend/db/interviewSchema.js`;
- создана техническая карточка `docs/ANALYTICS_INTERVIEW_PREPARATION.md`.

## Архитектура
- данные вопросов связываются с таблицами `topics` и `articles`, API возвращает `topic_title` и `related_article_title`, а также поддерживает фильтры `topicId` и `search`;
- операции CRUD и импорт вынесены на `/api/interview`, при этом JSON-импорт и n8n используют общий `POST /api/interview/import`;
- фронтенд работает через `interviewApi`, делает `GET /api/interview/questions`, использует `Modal` для редактирования/инструкции/импорта и `react-hot-toast` для сообщений.

## Настройки
- все новые запросы защищены `authRequired` и требуют Bearer-токена; n8n-интеграция должна передавать тот же токен;
- JSON-импорт ожидает массив объектов `{ topic, question, answer?, explanation?, relatedArticleId? }` со ссылкой на существующую тему.
