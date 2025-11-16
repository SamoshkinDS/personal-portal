name: Аналитика → Тестирование знаний
description: Интерфейс для создания тестов по аналитике с интеграцией n8n и просмотром вопросов/ответов.

## Страница
- Расположена в разделе `Аналитика` → `Knowledge Tests`.
- Отображает заголовок, фильтр по теме, поиск по названию/описанию и кнопки `Создать тест`, `Инструкция по n8n`.
- Список тестов — карточки с темой, статусом, описанием и ссылкой на страницу теста (`/analytics/tests/:testId`).

## Модалки
- **Создать тест**: поля `title`, `topic`, `description`, `relatedArticleId`. После сохранения статус автоматически ставится `pending_generation`.
- **Инструкция n8n**: GET/POST примеры, пояснение ошибок (обязателен `test_id`, массив вопросов), формат payload.

## API
- `GET /api/tests` — список с фильтрами `status`/`topicId`.
- `GET /api/tests/:id` — полный тест с вопросами.
- `POST /api/tests` — создание теста в статусе `pending_generation`.
- `POST /api/tests/response` — n8n отправляет `test_id` и массив `{ question, answer, explanation }`, сайт сохраняет вопросы и ставит статус `completed`.
- Все вызовы требуют `authRequired`.

## База данных
- `tests` хранит заголовок, описание, тему, статус, привязку к статье и `created_at/updated_at` (trigger `set_updated_at`).
- `test_questions` содержит вопросы/ответы/объяснения со временем, удаляется при удалении теста.
- Индексы: `tests(topic_id)`, `tests(status)`, `test_questions(test_id)`.

## Примечания
- Страница использует `testsApi` (`src/api/tests.js`), `KnowledgeTestsPage` (`src/pages/analytics/KnowledgeTests.jsx`), `TestDetail` (`src/pages/analytics/TestDetail.jsx`).
- Маршруты зарегистрированы в `router.jsx`, пункт отображается в `Sidebar`.
