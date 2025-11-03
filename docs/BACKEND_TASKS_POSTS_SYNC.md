name: Синхронизация задач и постов
description: REST API и фоновые процессы для консистентности задач и заметок.

Синхронизация задач и постов с бэкендом

Цель: перенести хранение «задач» (Home.jsx) и «заметок» (Posts.jsx) из localStorage в PostgreSQL и общаться с сервером через REST API на Express, сохранив мгновенную отзывчивость интерфейса (optimistic UI) и встроив авторизацию через существующий AuthContext.

Состав изменений
- Сервер: добавлены таблицы `user_todos` и `user_posts` в PostgreSQL, роуты `/api/todos` и `/api/posts` в `backend/`.
- Клиент: страницы `src/pages/Home.jsx` и `src/pages/Posts.jsx` переведены на `fetch` против API. Добавлен вспомогательный хелпер `apiAuthFetch` для автоматической подстановки Bearer‑токена.
- Интеграция с AuthContext: запросы выполняются от имени залогиненного пользователя, идентификатор берётся из JWT токена.

Архитектура и схемы
- Таблицы
  - user_todos
    - id SERIAL PRIMARY KEY
    - user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    - text VARCHAR(500) NOT NULL
    - done BOOLEAN DEFAULT FALSE
    - created_at TIMESTAMP DEFAULT NOW()
    - updated_at TIMESTAMP DEFAULT NOW()
    - Индексы: (user_id), (created_at DESC)
  - user_posts
    - id SERIAL PRIMARY KEY
    - user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    - text TEXT NOT NULL
    - created_at TIMESTAMP DEFAULT NOW()
    - Индексы: (user_id), (created_at DESC)

- Места в коде
  - Серверная инициализация таблиц: backend/index.js (раздел Ensure DB tables…)
  - Роуты: backend/routes/todos.js, backend/routes/posts.js
  - Клиентские страницы: src/pages/Home.jsx, src/pages/Posts.jsx
  - Хедер авторизации: src/utils/api.js (функция apiAuthFetch)

REST API
- Авторизация: все эндпоинты требуют заголовок `Authorization: Bearer <JWT>`.

- Todos (/api/todos)
  - GET /api/todos
    - Ответ: { todos: [ { id, text, done, created_at } ] }
  - POST /api/todos
    - Тело: { text: string, done?: boolean }
    - Ответ: { todo: { id, text, done, created_at } }
  - PATCH /api/todos/:id
    - Тело: { text?: string, done?: boolean }
    - Ответ: { todo: { id, text, done, created_at } }
  - DELETE /api/todos/:id
    - Ответ: { message: "Deleted" }

- Posts (/api/posts)
  - GET /api/posts
    - Ответ: { posts: [ { id, text, created_at } ] }
  - POST /api/posts
    - Тело: { text: string }
    - Ответ: { post: { id, text, created_at } }
  - DELETE /api/posts/:id
    - Ответ: { message: "Deleted" }

DTO и отображение на фронте
- TodoDTO (от сервера): { id: number, text: string, done: boolean, created_at: string }
  - В Home.jsx напрямую используется id/text/done; created_at — опционально для сортировки/меток.
- PostDTO (от сервера): { id: number, text: string, created_at: string }
  - В Posts.jsx отображение даты: `new Date(created_at).toLocaleString("ru-RU")` → поле `date` в UI.

Optimistic UI
- Добавление
  - Клиент добавляет временную запись с `tempId`, сразу рендерит, очищает ввод.
  - После успешного POST заменяет временный id на `id` из ответа.
  - В случае ошибки — откатывает список и возвращает введённый текст в поле.
- Обновление (todo.done)
  - Сначала локально переключается `done`, затем PATCH.
  - При ошибке состояние откатывается.
- Удаление
  - Сначала локально удаляется элемент, затем DELETE.
  - При ошибке набор откатывается.

Интеграция с AuthContext
- Хранилище токена остаётся прежним: `localStorage.getItem("token")`.
- Новый помощник `apiAuthFetch(path, options)` (см. src/utils/api.js):
  - Берёт токен из localStorage и автоматически добавляет заголовок Authorization, если он ещё не установлен в переданных headers.
- Страницы Home и Posts используют `useAuth()` для того, чтобы не стартовать загрузку без авторизации, и `apiAuthFetch` для запросов.
- Поведение при неавторизованном пользователе: списки не загружаются (UI пустой, без ошибок). Дополнительно можно показать подсказку «Войдите, чтобы использовать задачи/заметки».

Миграции
- В текущей реализации таблицы создаются при старте сервера (idempotent DDL) в backend/index.js.
- Для продакшн окружений рекомендуется закрепить миграции отдельно. Базовые SQL‑скрипты:

  -- users уже существует в проекте
  CREATE TABLE IF NOT EXISTS user_todos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text VARCHAR(500) NOT NULL,
    done BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_user_todos_user_id ON user_todos(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_todos_created_at ON user_todos(created_at DESC);

  CREATE TABLE IF NOT EXISTS user_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_user_posts_user_id ON user_posts(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_posts_created_at ON user_posts(created_at DESC);

- Если требуется строгий контроль версий через инструмент миграций (например, Knex):
  1. Добавьте Knex в backend, настройте подключение к той же БД.
  2. Сгенерируйте миграции, перенесите в них DDL из блока выше.
  3. Уберите auto‑DDL из backend/index.js.

Сборка и переменные окружения
- Backend (backend/.env):
  - PORT=4000
  - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME — параметры подключения к PostgreSQL
  - JWT_SECRET, JWT_EXPIRES_IN — секрет и TTL токенов (можно оставить дефолт, но лучше задать в проде)
- Frontend (.env*):
  - VITE_API_BASE_URL — базовый URL API (локально: http://localhost:4000)

Как запустить
1) Поднимите PostgreSQL и создайте пользователя/базу из backend/.env.
2) В каталоге backend: `npm i && npm run start`.
3) В корне фронтенда: `npm i && npm run dev`.
4) Войдите/зарегистрируйтесь в UI, затем используйте задачи и заметки — данные сохраняются в БД.

Точки интеграции в коде
- backend/index.js: монтирование роутов `/api/todos` и `/api/posts`, создание таблиц
- backend/routes/todos.js и backend/routes/posts.js: CRUD‑эндпоинты
- src/pages/Home.jsx: переход с localStorage на запросы, optimistic UI
- src/pages/Posts.jsx: переход с localStorage на запросы, optimistic UI
- src/utils/api.js: `apiAuthFetch` для автоматического добавления Authorization

Замечания
- Существующие страницы админки и профиля не изменялись.
- Если требуется отображать данные оффлайн без логина — можно добавить fallback в память/IndexedDB, но это выходит за рамки текущей задачи.

