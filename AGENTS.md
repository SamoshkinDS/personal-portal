AGENTS: Personal Portal

Этот файл описывает, как Codex CLI должен работать с репозиторием Personal Portal (личный портал с задачами, аналитикой, AI‑инструментами, VPN и каталогом растений).

Цель — помогать развивать проект, не ломая существующую архитектуру, интеграции и процессы деплоя, и оставлять понятный след изменений в документации.

---

Общее описание проекта

- Personal Portal — личный портал с домашним дашбордом, задачами, заметками, аналитикой, AI‑модулями, управлением VPN и каталогом растений/ухода.
- Архитектура: SPA на React 18 + Vite в корне репозитория (`src/`) и backend на Node.js + Express + PostgreSQL в `backend/`, общаются через REST‑API `/api/*`.
- Основные домены:
  - Домашний дашборд и задачи (todos, списки задач, заметки).
  - Wish List — личные списки желаний пользователя (приватные карточки с приоритетами, ссылками и архивом).

- Workspace — настраиваемая страница рабочего стола с виджетами, авто-задачами и доской задач, собирающей данные из квартиры/финансов.
  - Shared links — временные публичные ссылки на Wish List c токеном /shared/:token, ограниченными правами и отзывом.
  - Аналитика: темы, статьи, очередь публикаций, интервью, знания/тесты.
  - Квартира: управляющая компания, телефоны, внешние камеры и учёт водяных счётчиков (/home).
  - AI-разделы: общие AI-инструменты (`AI.jsx`), интеграция с n8n, Promptmaster.
  - Профессиональное развитие: навыки, курсы, портфолио, интервью и технические знания с REST-API под `/api/career`, включая `/dashboard` (кэшируется 5 минут), `/dashboard/activity` и секцию портфолио.
- Курсы: `/career/courses` — список курсов, фильтры по статусу/платформе/периоду, прогресс/рейтинги, привязка навыков и работа с сертификатами.
  - VPN: Outline API, VLESS/Xray‑ключи и статистика.
  - Финансы: `accounting` (счета, транзакции, доходы, категории, напоминания).
  - Растения и уход: растения, вредители, болезни, лекарства, проблемы.
- Бизнес‑логика и дизайн многих блоков подробно описаны в `docs/*.md` и `GPT_specs/*.md`. Перед изменениями в конкретном модуле нужно прочитать соответствующий файл.

---

Технологический стек

Фронтенд

- React 18 + Vite 7.
- Маршрутизация: `react-router-dom` (основной роутер — `src/router.jsx`).
- Стили: Tailwind CSS (`tailwind.config.js`, `darkMode: "class"`), глобальные стили — `src/index.css`.
- Основные библиотеки:
  - `framer-motion` — анимации переходов маршрутов и UI‑элементов.
  - `react-hot-toast` — всплывающие уведомления.
  - `react-hook-form` — формы.
  - `react-markdown` + `remark-gfm` — рендеринг Markdown.
  - `recharts` — графики и диаграммы.
  - `@tiptap/*` — rich‑text редактор для контента.
- Конфигурация: через `VITE_*` переменные (`.env`, `.env.development`, `.env.production`), в первую очередь:
  - `VITE_API_BASE_URL` — базовый URL backend‑API.
  - `VITE_APP_NAME`, `VITE_APP_TITLE` — текстовые настройки UI.
  - `VITE_VAPID_PUBLIC_KEY` — публичный VAPID‑ключ для Web Push (опционально, может быть взят с backend).

Бэкенд

- Node.js (ESM, `"type": "module"`), Express (`backend/index.js`).
- PostgreSQL через `pg` (`backend/db/connect.js`), схемы по доменам:
  - `ensure*Schema`-функции в `backend/db/*Schema.js` (plants, care, analytics, promptmaster, interview, tests, settings и т.д.).
  - Дополнительные SQL-миграции в `backend/db/migrations/*.sql`.
- Career-модуль: `backend/routes/career.js`, `backend/services/careerService.js`, `backend/db/careerSchema.js` с единым форматом `{ success, data, error }` и маршрутом `/api/career`.
- Career-модуль: `backend/routes/career.js`, `backend/services/careerService.js`, `backend/db/careerSchema.js` с единым форматом `{ success, data, error }` и маршрутом `/api/career`.
- Безопасность:
  - JWT‑аутентификация через `jsonwebtoken` (`backend/controllers/authHandlers.js`, `backend/middleware/auth.js`).
  - Пароли — через `bcrypt`.
  - RBAC (permissions) через таблицы `permissions`, `user_permissions` и middleware `authRequired`, `requireRole`, `requirePermission` (`backend/middleware/auth.js`, `docs/RBAC_PERMISSIONS.md`).
- Дополнительные технологии:
  - `node-cron` — фоновые задачи (VPN/Xray, accounting).
  - `multer` + `sharp` — загрузка и обработка изображений (блок растений).
  - `undici` / глобальный `fetch` — HTTP‑клиент для внешних API.
  - `uuid` — для идентификаторов.
- Инфраструктура:
  - PostgreSQL — основная БД, конфиг через `backend/.env` (`DB_*` переменные).
  - Web Push — `web-push` (`backend/utils/push.js`).
  - Service Worker — `public/sw.js` + клиентская логика `src/push/registerPush.js`.

Интеграции

- Outline VPN Management API:
  - Роутер: `backend/routes/vpn.js`, монтируется на `/api/vpn/outline/*`.
  - Конфиг: `OUTLINE_API_URL`, `OUTLINE_CACHE_TTL_MS`, `OUTLINE_API_INSECURE` (`backend/.env`).
  - `docs/OUTLINE_VPN_INTEGRATION.md` описывает API и UI.
- Xray / VLESS:
  - gRPC‑клиент: `backend/services/xray.js` (`proto/stats.proto`).
  - REST‑роуты: `backend/routes/vless.js`, `backend/routes/xray.js`.
  - Конфиг: `XRAY_API_HOST`, `XRAY_API_PORT`, `XRAY_API_EMAIL_FIELD`, `XRAY_CONFIG_PATH`, `XRAY_INBOUND_TAG`, `XRAY_CRON_DISABLED`, `XRAY_SYNC_*`, `VLESS_*`.
- n8n:
  - Бэкенд: `backend/routes/n8n.js` (`/api/n8n`), защищённый доступ через `authRequired` + `requirePermission(['view_ai'])`.
  - Фронтенд: `src/pages/N8NIntegration.jsx`, `src/api/*` (специфика в `docs/n8n-integration.md` и `GPT_specs/n8n_integration_spec_clean_utf8.md`).
  - Конфиг: `N8N_API_BASE_URL` / `N8N_BASE_URL`, `N8N_API_KEY`, `N8N_APP_BASE_URL`, `N8N_WORKFLOWS_PATH`, `N8N_EXECUTIONS_PATH`.
- S3:
  - Клиент: `backend/services/s3Client.js` (`uploadBuffer`, `deleteByKey`, `isS3Ready`).
  - Конфиг: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_FORCE_PATH_STYLE`, `S3_PUBLIC_BASE_URL`.
  - Использование — в первую очередь блок растений (`backend/routes/plants.js`, `docs/plants.md`).
- AI‑сервер / Promptmaster:
  - Бэкенд: `backend/routes/promptmaster.js` (очередь запросов, библиотека статей, настройки вебхука).
  - Фронтенд: `src/pages/Promptmaster.jsx`, `src/api/promptmaster.js`, документация — `docs/PROMPTMASTER*.md`.
  - Конфиг: `PROMPTMASTER_WEBHOOK_URL`, `PROMPTMASTER_WEBHOOK_TOKEN`, `PROMPTMASTER_RESPONSE_TOKEN`.
- Push‑уведомления:
  - Бэкенд: `backend/routes/notifications.js`, `backend/utils/push.js`.
  - Клиент: `src/push/registerPush.js`.
  - Конфиг: `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_CONTACT` (backend), `VITE_VAPID_PUBLIC_KEY` (frontend, опционально).

---

Структура папок

Корень репозитория

- `src/` — фронтенд (React SPA).
- `backend/` — бэкенд (Express + PostgreSQL).
- `public/` — статические файлы (включая `sw.js`).
- `dist/` — собранный фронтенд Vite (артефакт билда, не редактировать).
- `docs/` — документация по блокам, интеграциям и архитектуре; добавлен `docs/Career_Core.md`.
- `GPT_specs/` — технические задания/спеки для GPT/Codex по отдельным блокам.
- `scripts/` — операционные скрипты (`deploy.sh`, `update_frontend.sh`, `update_backend.sh`, `sync_xray_users.sh`).
- `images/` — статические изображения для UI/доков.
- `.env`, `.env.development`, `.env.production` — конфиг фронтенда.
- `backend/.env` — конфиг бэкенда (БД, интеграции, секреты).

Фронтенд (`src/`)

- `pages/` — route‑уровневые страницы:
  - `analytics/` — аналитика (темы, статьи, очередь, интервью, тесты, настройки интеграций).
  - `accounting/` — финансы.
  - `vpn/` — Outline/VLESS UI и гайды.
  - `car/` - страница автомобиля (Changan UNI V).
  - `home/` - Квартира: УК, телефоны, камеры, счётчики.
- `plants/` и `care/` — растения и уход.
- `admin/` — админ-панель.
- `career/` — страница дашборда профессионального развития с метриками, радаром и активностью.
- `career/` — страница дашборда профессионального развития с метриками, радаром, активностью и разделами `/career/skills`, `/career/courses`, `/career/portfolio`.
- `career/` — страница дашборда профессионального развития с метриками, радаром, активностью и разделами `/career/skills`, `/career/courses`, `/career/portfolio`, `/career/interviews`.
- `career/` — страница дашборда профессионального развития с метриками, радаром, активностью и разделами `/career/skills`, `/career/courses`, `/career/portfolio`, `/career/interviews`, `/career/knowledge`.
- `career/` — страница дашборда профессионального развития с метриками, радаром, активностью и разделами `/career/skills`, `/career/courses`, `/career/portfolio`, `/career/interviews`, `/career/knowledge`, `/career/portfolio/export`.
- `career/` — страница дашборда профессионального развития с метриками, радаром, активностью и разделами `/career/skills`, `/career/courses`, `/career/portfolio`, `/career/interviews`, `/career/knowledge`, `/career/portfolio/export`, `/career/portfolio/timeline`.
- `career/` — страница дашборда профессионального развития с метриками, радаром, активностью и разделами `/career/skills`, `/career/courses`, `/career/portfolio`, `/career/interviews`, `/career/knowledge`, `/career/portfolio/export`, `/career/portfolio/timeline`, `/career/analytics`.
- базовые страницы: `Home`, `WishList`, `AI`, `N8NIntegration`, `Promptmaster`, `Workspace`, `Docs`, `Settings`, `Login`, `DebugDnd`, `NotFound` и др.
- `components/` — переиспользуемые компоненты (Layout, Sidebar, Header, модалки и т.п.).
- `context/` — контексты (в первую очередь `AuthContext`).
- `api/` — API-клиенты поверх `apiAuthFetch` (`analytics.js`, `accounting.js`, `career.js`, `plants.js`, `promptmaster.js`, `integrationSettings.js`, `car.js`, `home.js` и др.).
- `api/wish.js` — клиент для приватного списка желаний.
- `hooks/` — кастомные хуки.
- `push/` — логика push‑подписки и общения с `/api/notifications`.
- `utils/` — утилиты (`api.js` и т.д.).
- Корневые файлы: `App.jsx`, `router.jsx`, `main.jsx`, `index.css`.

Бэкенд (`backend/`)

- `index.js` — точка входа: инициализация Express, регистрация маршрутов, cron‑задачи, начальная инициализация БД.
- `routes/` — роутеры по доменам (`auth.js`, `admin.js`, `user.js`, `todos.js`, `todoLists.js`, `posts.js`, `vpn.js`, `vless.js`, `xray.js`, `notifications.js`, `actions.js`, `n8n.js`, `notes.js`, `accounting.js`, `plants.js`, `pests.js`, `diseases.js`, `medicines.js`, `problems.js`, `analytics.js`, `promptmaster.js`, `cheat.js`, `interview.js`, `tests.js`, `integrationSettings.js`, `career.js`, `car.js`, `home.js`, `wish.js` и др.).
- `routes/` — роутеры по доменам (`auth.js`, `admin.js`, `user.js`, `todos.js`, `todoLists.js`, `posts.js`, `vpn.js`, `vless.js`, `xray.js`, `notifications.js`, `actions.js`, `n8n.js`, `notes.js`, `accounting.js`, `plants.js`, `pests.js`, `diseases.js`, `medicines.js`, `problems.js`, `analytics.js`, `promptmaster.js`, `cheat.js`, `interview.js`, `tests.js`, `integrationSettings.js`, `career.js`, `car.js`, `home.js`, `wish.js` и др.).
- `controllers/` — контроллеры (например, `authController.js`, `authHandlers.js`).
- `middleware/` — middleware авторизации и прав (`auth.js`).
- `db/` — подключение к БД (`connect.js`), схемы (`*Schema.js`, `careerSchema.js`), миграции (`migrations/*.sql`).
- `services/` — интеграции и задачи (`s3Client.js`, `xray.js`, `accountingJobs.js`, `accountingUtils.js`, `careerService.js`).
- `services/` — интеграции и задачи (`s3Client.js`, `storageService.js`, `xray.js`, `accountingJobs.js`, `accountingUtils.js`, `careerService.js`).
- `utils/` — утилиты (`slugify.js`, `imageUpload.js`, `push.js`).
- `scripts/` — вспомогательные скрипты (например, `seedPlants.js`).
- `proto/` — gRPC‑описания (`stats.proto`).

---

Как запускать dev / тесты / build

Предварительные условия

- Node.js 18+ и npm 9+.
- Локальный PostgreSQL; настройки в `backend/.env` (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
- `.env.development` для фронтенда настроен так, чтобы `VITE_API_BASE_URL` указывал на backend (`http://localhost:8080` или `http://localhost:4000` — в зависимости от конфигурации).

Фронтенд

- Установка зависимостей (из корня):
  - `npm install` (или `npm ci` для чистой установки).
- Dev‑режим:
  - `npm run dev` (Vite, обычно `http://localhost:5173`).
- Build:
  - `npm run build` — создаёт `dist/`.
- Preview:
  - `npm run preview` — локальный предпросмотр собранного билда.

Бэкенд

- Установка зависимостей:
  - `cd backend`
  - `npm install` (или `npm ci`).
- Dev‑режим:
  - `npm run dev` (nodemon, порт из `PORT` в `backend/.env`, сейчас 8080).
- Продакшн‑режим:
  - `npm start` (обычно под системным сервисом `personal-portal-backend`).
- Дополнительно:
  - `npm run seed:plants` — первичное наполнение данных по растениям.

Тесты

- Явных `test`‑скриптов в `package.json` нет; автотесты не настроены.
- Проверка корректности изменений выполняется через:
  - запуск dev‑серверов frontend+backend;
  - ручной прогон сценариев, описанных в `docs/*.md`, и проверку ключевых `/api/*` маршрутов.

---

Код-стайл и архитектурные правила

Общие принципы

- Сохранять текущую модульную структуру:
  - один домен — один роутер в `backend/routes/*` и соответствующие модули в `src/pages/*`, `src/api/*`;
  - не смешивать несколько доменов в одном большом файле без необходимости.
- Не менять публичные контракты (`/api/*` пути, формат JSON‑ответов, поля объектов) без необходимости; если меняем — синхронно обновлять фронтенд‑клиентов и документацию в `docs/`.
- Использовать современный JS (ESM, async/await, optional chaining); не добавлять CommonJS (`require`, `module.exports`).
- Сообщения об ошибках и пользовательские тексты — по умолчанию на русском языке (подробнее см. раздел «Как Codex должен вести себя»).

Фронтенд

- Компоненты:
  - только функциональные компоненты + хуки, без классовых.
  - новые страницы — в `src/pages/<domain>/` с регистрацией в `src/router.jsx`.
- Маршрутизация:
  - использовать существующий `createBrowserRouter` в `src/router.jsx`;
  - оборачивать страницы в `RouteTransition`;
  - доступ по правам — через `PermissionGate` и `buildPermissionState`.
- HTTP:
  - для всех запросов использовать `apiFetch`/`apiAuthFetch` (`src/utils/api.js`), а не голый `fetch`;
  - логику работы с API выносить в `src/api/*.js`, а компоненты — только потребляют эти функции.
- Стили:
  - Tailwind utility‑классы;
  - изменения в `tailwind.config.js` минимальные и осознанные.
- Авторизация:
  - `AuthContext` (`src/context/AuthContext.jsx`) — единственный источник истины для пользователя;
  - токен хранится в `localStorage` под ключом `token`, пользователь — под `auth`.

Бэкенд

- Логика:
  - в `backend/index.js` — только сборка приложения, роутеры, cron‑задачи и базовые миграции;
  - доменные SQL‑операции и схемы — в `backend/db/*Schema.js` и/или отдельных сервисах.
- Маршруты:
  - для нового домена — отдельный файл `backend/routes/<domain>.js`;
  - авторизация — через `authRequired` и, при необходимости, `requireRole`/`requirePermission`.
- Ошибки:
  - возвращать JSON вида `{ message: string, ... }` с осмысленными HTTP‑кодами;
  - технические детали логировать через `console.error`, но не выдавать стеки в ответах.
- RBAC:
  - новые права описывать в БД и в `docs/RBAC_PERMISSIONS.md`;
  - на фронтенде использовать `PermissionGate` и `buildPermissionState`, а не «магические» проверки `user.role` прямо в компонентах.

Документация

- Перед изменениями в конкретном блоке:
  - найти и прочитать профильные файлы в `docs/` и, при наличии, в `GPT_specs/`;
  - следить за тем, чтобы новые изменения не противоречили зафиксированной там архитектуре/UX.
- После изменений — обязательно обновлять соответствующие `docs/*.md` (см. правила ниже).

---

Особенности интеграций (S3, n8n, AI-сервер и др.)

S3 и изображения

- Реализовано в `backend/services/s3Client.js`.
- Используется в первую очередь в `backend/routes/plants.js` для загрузки и выдачи изображений растений.
- При работе с S3:
  - использовать `uploadBuffer`, `deleteByKey`, `buildPublicUrl`, `isS3Ready`;
  - не дублировать создание клиентов и конфигурацию.

n8n

- Бэкенд:
  - `backend/routes/n8n.js`, смонтирован как `/api/n8n`;
  - использует `N8N_API_BASE_URL`/`N8N_BASE_URL`, `N8N_API_KEY`, опционально `N8N_APP_BASE_URL`, `N8N_WORKFLOWS_PATH`, `N8N_EXECUTIONS_PATH`;
  - при отсутствии конфига должен возвращать 503 и человекочитаемые сообщения, а не падать.
- Фронтенд:
  - `src/pages/N8NIntegration.jsx` + API‑клиенты в `src/api/*`;
  - полное описание — `docs/n8n-integration.md`, `GPT_specs/n8n_integration_spec_clean_utf8.md`.
- Блок растений:
  - использует n8n‑webhook для генерации описаний (`n8n_generate_description_url` в настройках растений).

AI‑сервер / Promptmaster

- Бэкенд:
  - `backend/routes/promptmaster.js`:
    - очередь запросов (`prompt_requests`), статусы (`draft`, `sent`, `processing`, `done`, `error`);
    - библиотека категорий/статей (`prompt_categories`, `prompt_articles`);
    - интеграция с внешним AI‑сервисом через вебхук (`PROMPTMASTER_WEBHOOK_URL`, `PROMPTMASTER_WEBHOOK_TOKEN`, `PROMPTMASTER_RESPONSE_TOKEN`).
- Фронтенд:
  - `src/pages/Promptmaster.jsx`, `src/api/promptmaster.js`;
  - документация — `docs/PROMPTMASTER.md`, `docs/PROMPTMASTER_CHANGES.md`.

VPN / Outline / Xray

- Outline:
  - `backend/routes/vpn.js`, `docs/OUTLINE_VPN_INTEGRATION.md`;
  - кэширование access‑keys в памяти, управление правами на создание ключей.
- VLESS/Xray:
  - `backend/services/xray.js` (gRPC‑клиент);
  - `backend/routes/vless.js`, `backend/routes/xray.js`;
  - cron‑задачи для синхронизации статистики — в `backend/index.js`.

Push-уведомления

- Бэкенд:
  - `backend/utils/push.js` — конфигурация VAPID и отправка уведомлений;
  - `backend/routes/notifications.js` — выдача публичного ключа и приём подписок.
- Клиент:
  - `src/push/registerPush.js` — регистрация service worker, подписка, отправка подписки на backend.

---

Как Codex должен вести себя

Общий подход

- При начале любой задачи:
  - прочитать `AGENTS.md` и релевантные файлы в `docs/` и `GPT_specs/`;
  - определить домен (frontend/backend/конкретный блок);
  - кратко сформулировать план (несколько шагов) и действовать по нему.
- Изменения должны быть минимальными и локальными:
  - не переименовывать существующие файлы/роуты/таблицы/env‑переменные без явной необходимости;
  - не трогать `deploy.sh` и продакшен‑скрипты в `scripts/` без явного запроса.

Фронтенд и бэкенд вместе

- Любое изменение контракта API:
  - синхронно обновлять `src/api/*` и использующие компоненты;
  - при необходимости — обновлять документацию в `docs/` (см. правило ниже).
- Новые права/роли:
  - добавлять в БД и описывать в `docs/RBAC_PERMISSIONS.md`;
  - на фронте — отражать в `PermissionGate`/`buildPermissionState` (`src/router.jsx`).

Документация по доработкам (обязательное правило)

- Для **каждой завершённой доработки**, выполненной Codex, нужно зафиксировать самое важное в Markdown‑документе в каталоге `docs/`:
  - если для блока уже есть тематический файл (например, `PROMPTMASTER_CHANGES.md`, `ANALYTICS_CHANGELOG.md`, `plants.md`, `OUTLINE_VPN_INTEGRATION.md` и т.п.), дописать туда краткое описание изменений;
  - если подходящего файла нет, создать новый файл вида:
    - `docs/<БЛОК>_<КРАТКОЕ_ИМЯ_ФИЧИ>.md`
    - структура файла:
      - `name:` — короткое имя фичи/блока;
      - `description:` — 1–3 предложения по‑русски, о чём доработка;
      - ниже — список/абзацы: что сделано, какие файлы/API/таблицы затронуты, дата, при необходимости ссылка на задачу/коммит.
- При добавлении нового крупного блока или интеграции:
  - обновить этот `AGENTS.md`, кратко описав новый блок в разделах «Технологический стек» и «Структура папок»;
  - при необходимости создать один или несколько файлов в `docs/` для этого блока.

Язык ТЗ и текстов

- Все новые технические задания (ТЗ), внутренние спецификации и документация в `docs/` должны быть:
  - **по умолчанию на русском языке**;
  - английский допустим только для:
    - имён библиотек, модулей, функций, полей в БД/JSON;
    - цитирования внешней документации или сообщений сторонних API;
    - случаев, когда оригинальная спецификация сервиса доступна только на английском.
- Большинство пользовательских текстов в UI (заголовки страниц, описания, подсказки, сообщения об ошибках) должны быть на **русском языке**:
  - не переводить существующие английские тексты без явной задачи;
  - но новые тексты писать по‑русски, за исключением явно технических фрагментов.

Обновление AGENTS.md

- При появлении нового крупного блока, интеграции или значимой архитектурной части Codex должен:
  - при выполнении соответствующей задачи **обновить этот `AGENTS.md`**, добавив/уточнив:
    - описание блока в «Общее описание проекта» и/или «Технологический стек»;
    - структуру файлов/папок в «Структура папок»;
    - особенности интеграций в «Особенности интеграций».
- Обновление `AGENTS.md` — нормальная часть задач по развитию архитектуры и интеграций, а не «последняя мысль». Если изменения затрагивают структуру проекта или интеграции — нужно явно проверить и при необходимости править этот файл.
\n- S3 Storage Manager:\n  - Внутренний UI /admin/s3 для администраторов с просмотром бакетов/объектов и управлением публичностью.\n  - Backend-прокси /api/s3/* для операций листинга, загрузки, удаления, создания бакетов/папок и применения публичной политики.

- Flipper Zero:
  - Планируемый раздел с корневой страницей, базовыми функциями, кастомными прошивками, модулями/гайдами и базой уязвимостей.
  - Спека: docs/FLIPPER_ZERO_SECTION_STRUCTURE.md; фронтенд в src/pages/flipper*, возможные /api/flipper* (после проработки дизайна и данных).
