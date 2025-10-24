# Personal Portal — актуальное состояние проекта

## Архитектура и стек
- **Фронтенд**: React 18 + Vite, маршрутизация на `react-router-dom`, анимации `framer-motion`, уведомления `react-hot-toast`, графики `recharts`, стили через Tailwind (`darkMode: "class"`). 【F:package.json†L1-L22】【F:tailwind.config.js†L1-L6】
- **Бэкенд**: Node.js + Express, база PostgreSQL через `pg`, дополнительный HTTP‑клиент `undici` для Outline API и `web-push` для уведомлений. 【F:backend/package.json†L1-L18】
- **Стартовые сервисы**: backend и frontend разворачиваются независимо; взаимодействие происходит через REST API (`VITE_API_BASE_URL`). 【F:src/utils/api.js†L1-L22】

## Фронтенд: структура и функциональность
### Каркас интерфейса
- Компонент `App` регистрирует push‑подписку, хранит глобальный AuthContext и рисует маршруты с анимацией. 【F:src/App.jsx†L1-L119】
- Общий каркас страницы задаёт `PageShell` (фон, шапка, область контента), `Header` отображает пользователя, уведомления и переключатель темы, а `Sidebar` управляет навигацией, включая мобильные свайпы и сворачивание. 【F:src/components/PageShell.jsx†L1-L33】【F:src/components/Header.jsx†L1-L104】【F:src/components/Sidebar.jsx†L1-L160】

### Основные разделы
- **Главная (`/`)** — дерево задач с вложенностью, drag & drop и модальными окнами для добавления/редактирования, данные тянутся из `/api/todos`; на первом экране также быстрые ссылки на ключевые разделы. 【F:src/pages/Home.jsx†L1-L118】【F:src/pages/Home.jsx†L200-L320】
- **Аналитика (`/analytics`)** — карточки статей с фильтрами и модальным просмотром. 【F:src/pages/Analytics.jsx†L1-L140】
- **Нейросервисы (`/ai`)** — справочник по AI‑инструментам с подробными описаниями и статусами. 【F:src/pages/AI.jsx†L1-L132】
- **Документация (`/docs`)** — каталог внешних ссылок и просмотр внутренних MD‑файлов, загружаемых напрямую. 【F:src/pages/Docs.jsx†L1-L140】
- **Заметки (`/posts`)** — список заметок с optimistic UI поверх REST API `/api/posts`. 【F:src/pages/Posts.jsx†L1-L96】
- **VPN** — хаб `/vpn`, страницы Outline с управлением ключами/лимитами и заглушка VLESS. Outline использует хук `useOutlineKeys` для загрузки ключей, метрик и лимитов. 【F:src/App.jsx†L200-L272】【F:src/pages/vpn/Outline.jsx†L1-L160】【F:src/hooks/useOutlineKeys.js†L1-L120】【F:src/pages/vpn/VLESS.jsx†L1-L33】
- **Настройки (`/settings`)** — профиль пользователя (GET/PUT `/api/user/profile`) и переключатель темы. 【F:src/pages/Settings.jsx†L1-L120】
- **Админ‑панель (`/admin/*`)** — дашборд со статистикой сервера, карточками перехода, таблицами пользователей/контента/логов и отправкой событий в push. 【F:src/pages/admin/Index.jsx†L1-L78】【F:src/pages/admin/Users.jsx†L1-L160】【F:src/pages/admin/Content.jsx†L1-L120】【F:src/pages/admin/Logs.jsx†L1-L80】

### Глобальные UX‑паттерны
- Тематический режим хранится в `useTheme` и синхронизируется через `localStorage`. 【F:src/hooks/useTheme.js†L1-L120】
- Уведомления открываются из шапки; хук `useNotifications` хранит непрочитанные в IndexedDB и синхронизируется с `/api/notifications`. 【F:src/hooks/useNotifications.js†L1-L96】
- Service Worker `sw.js` показывает push‑уведомления и возвращает пользователя в приложение при клике. 【F:public/sw.js†L1-L48】

## Бэкенд и API
- Точка входа `backend/index.js` настраивает Express, регистрирует маршруты, создаёт таблицы и эндпоинт `/api/system-stats`. 【F:backend/index.js†L1-L140】【F:backend/index.js†L140-L196】
- Подключение к PostgreSQL через `backend/db/connect.js`. 【F:backend/db/connect.js†L1-L16】

### Основные модули
- **Аутентификация (`/api/auth`)** — регистрация, логин, проверка токена и сброс пароля. Контроллер `authHandlers` возвращает JWT и список прав пользователя. 【F:backend/routes/auth.js†L1-L14】【F:backend/controllers/authHandlers.js†L1-L120】
- **Профиль (`/api/user/profile`)** — CRUD профиля пользователя. 【F:backend/routes/user.js†L1-L44】
- **Задачи (`/api/todos`)** — древовидные todo, drag & drop порядок, optimistic обновления. 【F:backend/routes/todos.js†L1-L120】
- **Заметки (`/api/posts`)** — хранение коротких постов. 【F:backend/routes/posts.js†L1-L60】
- **Админка (`/api/admin/*`)** — управление пользователями, контентом, логами и правами с защитой `requirePermission('admin_access')`; добавление логов отправляет push всем подписчикам. 【F:backend/routes/admin.js†L1-L200】【F:backend/routes/admin.js†L200-L260】
- **VPN (`/api/vpn/outline/*`)** — прокси к Outline API с кэшем, проверкой прав на создание ключей, управлением лимитами и метриками. 【F:backend/routes/vpn.js†L1-L200】
- **Уведомления (`/api/notifications`)** — выдача событий журнала и сохранение push‑подписок. 【F:backend/routes/notifications.js†L1-L60】

### База данных
- Автоинициализация таблиц: `users`, `user_profiles`, `user_todos`, `user_posts`, `permissions`, `user_permissions`, `content_items`, `admin_logs`, `push_subscriptions`. 【F:backend/index.js†L24-L132】
- Таблица `user_todos` хранит родителя и позицию для дерева задач; `permissions` и `user_permissions` реализуют гибкий RBAC. 【F:backend/index.js†L52-L104】

## Аутентификация и авторизация
- JWT хранится в `localStorage`, контекст `AuthContext` валидирует токен при монтировании и отдаёт пользователя с ролями/правами. 【F:src/context/AuthContext.jsx†L1-L64】
- Middleware `authRequired`, `requireRole` и `requirePermission` проверяют токен, статус блокировки и набор прав, роль `ALL` имеет полный доступ. 【F:backend/middleware/auth.js†L1-L60】
- Клиентские маршруты сверяют права (`view_analytics`, `view_ai`, `view_vpn`, `admin_access`) перед рендером страниц. 【F:src/App.jsx†L120-L208】

## Уведомления и push
- `registerPush` регистрирует Service Worker, запрашивает разрешение, подписывает пользователя через VAPID и отправляет подписку на бэкенд. 【F:src/push/registerPush.js†L1-L56】
- Серверный модуль `utils/push.js` конфигурируется через `WEB_PUSH_*` и рассылает уведомления всем подписчикам. 【F:backend/utils/push.js†L1-L36】

## Конфигурация окружения
- **Фронтенд `.env`**: `VITE_API_BASE_URL`, `VITE_VAPID_PUBLIC_KEY` (для push). 【F:src/utils/api.js†L1-L22】【F:src/push/registerPush.js†L17-L48】
- **Бэкенд `.env`**: параметры PostgreSQL (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`), JWT (`JWT_SECRET`, `JWT_EXPIRES_IN`), Outline (`OUTLINE_API_URL`, `OUTLINE_CACHE_TTL_MS`, `OUTLINE_API_INSECURE`), push (`WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_CONTACT`). 【F:backend/db/connect.js†L1-L16】【F:backend/routes/vpn.js†L1-L48】【F:backend/utils/push.js†L1-L26】

## Сборка и деплой
- Скрипты npm: `npm run dev`/`build`/`preview` на фронте, `npm run start`/`dev` в backend. 【F:package.json†L5-L14】【F:backend/package.json†L5-L13】
- `deploy.sh` бережно сохраняет `.env`, обновляет репозиторий, собирает фронт, устанавливает зависимости, перезапускает systemd‑сервис backend и перезагружает Nginx. 【F:deploy.sh†L1-L120】
- Эндпоинт `/api/system-stats` используется админкой для отображения метрик с мок‑значениями при недоступности сервера. 【F:backend/index.js†L140-L196】【F:src/utils/systemInfo.js†L1-L18】

## Документация в репозитории
- `docs/` содержит тематические карты по синхронизации задач, VPN, уведомлениям, RBAC и новым разделам (см. README внутренних страниц). Страница `/docs` показывает эти материалы напрямую. 【F:src/pages/Docs.jsx†L86-L138】
