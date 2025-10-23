# Руководство по установке и развёртыванию Personal Portal

## 1. Предварительные требования
- **Node.js 18+** и npm 9+ для сборки фронтенда (Vite) и запуска backend‑сервисов. 【F:package.json†L1-L14】【F:backend/package.json†L5-L13】
- **PostgreSQL 13+** с доступом к базе, пользователю и паролю (используется через `pg`). 【F:backend/db/connect.js†L1-L16】
- **Git** для загрузки репозитория и обновлений в продакшене. 【F:deploy.sh†L31-L58】
- (Опционально) Доступ к Outline Management API и VAPID‑ключи для push‑уведомлений.

## 2. Структура проекта
```
personal-portal/
├─ src/                # фронтенд на React + Vite
├─ backend/            # сервер Express + PostgreSQL
├─ public/sw.js        # service worker для push
├─ deploy.sh           # сценарий продакшен-деплоя
└─ docs/               # документация проекта
```

## 3. Настройка окружения
### 3.1 Фронтенд `.env`
Создайте `.env` (или `.env.development`) в корне проекта и задайте:
```
VITE_API_BASE_URL=http://localhost:4000
VITE_VAPID_PUBLIC_KEY=<публичный VAPID ключ>   # опционально для push
```
Переменные читаются через `apiUrl` и `registerPush`. 【F:src/utils/api.js†L1-L22】【F:src/push/registerPush.js†L17-L48】

### 3.2 Бэкенд `.env`
В каталоге `backend/` создайте файл `.env`:
```
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=personal_portal
DB_USER=portal_user
DB_PASSWORD=<пароль>
JWT_SECRET=<случайная_строка>
JWT_EXPIRES_IN=7d
OUTLINE_API_URL=https://outline.example.com:9090/<token>
OUTLINE_CACHE_TTL_MS=10000
OUTLINE_API_INSECURE=false
WEB_PUSH_PUBLIC_KEY=<если используете push>
WEB_PUSH_PRIVATE_KEY=<если используете push>
WEB_PUSH_CONTACT=mailto:admin@example.com
```
Эти переменные используются в модуле подключения к БД, VPN‑роутах и push‑утилитах. 【F:backend/db/connect.js†L1-L16】【F:backend/routes/vpn.js†L1-L48】【F:backend/utils/push.js†L1-L26】

## 4. Локальный запуск
1. **Установите зависимости фронтенда**:
   ```bash
   npm install
   npm run dev
   ```
   Фронтенд стартует на `http://localhost:5173` и проксирует API через `VITE_API_BASE_URL`.
2. **Установите зависимости бэкенда**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Сервер поднимется на `http://localhost:4000`, автоматически создаст необходимые таблицы и индексы. 【F:backend/index.js†L24-L132】
3. **Проверьте подключение** — авторизуйтесь на `http://localhost:5173/login`, задачи/заметки начнут сохраняться в PostgreSQL (`/api/todos`, `/api/posts`). 【F:backend/routes/todos.js†L1-L120】【F:backend/routes/posts.js†L1-L60】
4. (Опционально) Настройте push‑уведомления: пропишите VAPID‑ключи и убедитесь, что браузер разрешает уведомления (`registerPush`). 【F:src/push/registerPush.js†L1-L56】

## 5. Развёртывание на сервере
### 5.1 Подготовка окружения
- Скопируйте репозиторий в `/var/www/personal-portal` (либо обновите пути в `deploy.sh`).
- Создайте systemd‑сервис для backend (например, `/etc/systemd/system/personal-portal-backend.service`) с запуском `node backend/index.js` и рабочей директорией проекта.
- Настройте Nginx как обратный прокси на фронтенд сборку (`dist/`) и backend API (`/api`).

### 5.2 Использование `deploy.sh`
Скрипт автоматизирует обновление:
1. **Резервирует `.env` файлы** фронта и бэка в `/tmp/personal-portal-env-backup`. 【F:deploy.sh†L19-L48】
2. **Подтягивает актуальный код** из ветки `main` (`git fetch`, `git reset --hard`). 【F:deploy.sh†L50-L67】
3. **Восстанавливает `.env`** на место. 【F:deploy.sh†L69-L79】
4. **Выполняет `npm ci` + `npm run build`** для фронтенда и `npm ci` в `backend/`. 【F:deploy.sh†L81-L111】
5. **Перезапускает systemd‑сервис** backend и делает `nginx -t` + reload. 【F:deploy.sh†L103-L118】
6. **Проверяет доступность API** локально и через публичный URL. 【F:deploy.sh†L120-L133】

Запустите деплой из корня проекта:
```bash
npm run deploy
```
(Скрипт обёрнут в `package.json`.) 【F:package.json†L8-L12】

### 5.3 После деплоя
- Убедитесь, что PostgreSQL использует отдельного пользователя с ограниченными правами.
- Проверьте, что `WEB_PUSH_*` и `OUTLINE_*` заполнены, если используете push и VPN‑интеграцию.
- Для отката можно повторно запустить `deploy.sh` после переключения ветки или сброса к нужному коммиту.

## 6. Типичные проблемы и подсказки
- **`npm ci` падает**: очистите `node_modules` и `package-lock.json`, затем повторите установку (скрипт подсказывает это в логах). 【F:deploy.sh†L88-L102】
- **Пуши не доходят**: проверьте корректность VAPID‑ключей и, что `configureWebPushFromEnv` не выводит предупреждений. 【F:backend/utils/push.js†L6-L24】
- **Outline API недоступен**: добавьте `OUTLINE_API_INSECURE=true` для тестового окружения с самоподписанным сертификатом. 【F:backend/routes/vpn.js†L1-L36】

После выполнения этих шагов портал будет доступен как локально, так и в продакшене с автоматизированным обновлением.
