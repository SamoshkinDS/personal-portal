name: Аналитика → Подготовка к собеседованию
description: Страница собирает вопросы по темам аналитики, позволяет смотреть ответы, править записи и импортировать JSON/через n8n.

## Локация и структура
- Страница доступна в разделе `Аналитика` через пункт `Подготовка к собеседованию` в `Sidebar`.
- Верхняя панель содержит заголовок, фильтр по теме, поиск по тексту, кнопки «Добавить вопрос» и «Инструкция по импорту».
- Основная область — таблица с колонками `Вопрос`, `Тема`, `Статья`, `Действие`. Клик по строке открывает модалку с полями и действиями.
- В таблице вопросы подгружаются с фильтрами (topicId, search) и ограничением 500 записей, показываются в порядке создания.

## Модалки и управление
- **Просмотр вопроса**: отображаются вопрос, ответ, объяснение, кнопка просмотра связанной статьи, кнопки `Редактировать`/`Удалить`.
- **Форма добавления/редактирования**: универсальная модалка с селектами `Тема`, `Связанная статья` и textarea для `Вопроса`, `Ответа`, `Объяснения`. Сохранение вызывает `POST`/`PATCH`, благодаря чему UI всегда актуален.
- **Импорт JSON**: отдельная модалка с выбором файла, валидацией массива, предпросмотром количества объектов, кнопками «Импортировать» и «Сбросить».
- **Инструкция по импорту**: описывает три метода (ручной, JSON, n8n), содержит пример JSON и пример вызова API, список проверок (тема и question обязательны, связанная статья должна существовать).

## API
- **GET `/api/interview/questions`** — возвращает список вопросов с joined полями `topic_title` и `related_article_title`; принимает `topicId`, `search`, `limit`.
- **POST `/api/interview/questions`**, **PATCH `/api/interview/questions/:id`**, **DELETE `/api/interview/questions/:id`** — CRUD, требуют поле `topicId`/`topic`, проверяют существование темы и связанной статьи.
- **POST `/api/interview/import`** — принимает массив объектов из JSON или n8n; подставляет `topic`/`topicId`, `question`, `answer`, `explanation`, `relatedArticleId`.
- **GET `/api/interview/articles`** — возвращает последние статьи (id, title, topicTitle) для селекта «Связанная статья».

## База данных
- Новая таблица `interview_questions` (см. `backend/db/interviewSchema.js`):
  | Поле | Тип | Описание |
  | --- | --- | --- |
  | id | `serial` | PK |
  | topic_id | `int` | FK → `topics.id`, `ON DELETE RESTRICT` |
  | question | `text` | текст вопроса |
  | answer | `text` | текст ответа |
  | explanation | `text` | объяснение |
  | related_article_id | `int` | nullable FK → `articles.id` |
  | created_at / updated_at | `timestamptz` | метки времени, триггер `set_updated_at` |
- Индексы по `topic_id` и `updated_at` поддерживают фильтр и сортировку.

## Импорт и автоматизация
- JSON: массив объектов `{ topic, question, answer?, explanation?, relatedArticleId? }`. Тема ищется по `id`, `title` или `slug`. Пример:
  ```
  [
    {
      "topic": "API",
      "question": "Что такое REST?",
      "answer": "...",
      "explanation": "...",
      "relatedArticleId": 12
    }
  ]
  ```
- n8n: POST `/api/interview/import` с body как в примере; поток должен хранить Bearer-токен, чтобы пройти `authRequired`.
- При ошибках сервер возвращает HTTP 400 (отсутствуют тема/вопрос, тема не найдена, статья не существует) или 500 с объяснением.

## Примечания
- Frontend использует `PageShell`, `Modal`, `react-hot-toast`, `useDebouncedValue` и `interviewApi` (в `src/api/interview.js`) для запросов.
- Новая страница — `src/pages/analytics/InterviewPreparation.jsx`.
- Маршрут добавлен в `router.jsx` и отображается в `Sidebar`.
