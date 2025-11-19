# Тестирование знаний

## Изменения
- добавлена таблица `tests` + `test_questions` и роут `/api/tests` с CRUD и `response`-эндпоинтом для n8n (`backend/db/testsSchema.js`, `backend/routes/tests.js`);
- создан API-клиент `testsApi` (`src/api/tests.js`), страница списка тестов `KnowledgeTestsPage` с фильтром/модалкой и инструкции (`src/pages/analytics/KnowledgeTests.jsx`) и карточка маршрута в `Sidebar`/`router.jsx`;
- реализована страница просмотра `TestDetail` (`src/pages/analytics/TestDetail.jsx`) с раскрывающимися ответами и добавлена документация `docs/ANALYTICS_KNOWLEDGE_TESTS.md`.

## Архитектура
- `tests` связаны с `topics`/`articles`, статус `pending_generation` используется n8n для выбора задач, после ответа статус становится `completed`;
- `test_questions` хранит вопрос/ответ/пояснение и удаляется при удалении теста.

## Настройки
- n8n использует `/api/tests?status=pending_generation` и `/api/tests/response`, оба защищены auth; POST требует `test_id` и хотя бы один вопрос с `question`.
