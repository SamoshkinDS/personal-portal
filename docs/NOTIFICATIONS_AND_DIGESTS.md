name: Уведомления и дайджесты
description: Потоки push-уведомлений, IndexedDB и REST API для подписок.

Уведомления и дайджесты

Цель: реализовать центр уведомлений: колокольчик в Header, выезжающая панель, хранение непрочитанных в IndexedDB. Подключить push через Service Worker, добавить API `/api/notifications` и отобразить журнал событий из `backend/routes/admin.js`.

Состав изменений
- Бэкенд
  - Роутер `backend/routes/notifications.js`:
    - `GET /api/notifications?limit=100` — возвращает события из `admin_logs` как уведомления.
    - `POST /api/notifications/subscribe` — сохраняет PushSubscription текущего пользователя.
  - Создана таблица `push_subscriptions` (инициализация в `backend/index.js`).
  - Добавлен утилитный модуль `backend/utils/push.js` (web-push) и отправка push при создании записи в журнале: `backend/routes/admin.js` (POST `/admin/logs`).
  - Переменные окружения (опционально для отправки push):
    - `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_CONTACT`.

- Фронтенд
  - Service Worker: `public/sw.js` — обрабатывает `push` и показывает `showNotification`, переход по клику.
  - Регистрация SW и подписки: `src/push/registerPush.js`, вызывается в `src/App.jsx`.
  - IndexedDB helper: `src/utils/idb.js`.
  - Хук уведомлений: `src/hooks/useNotifications.js` — хранит непрочитанные локально, грузит события с сервера.
  - Панель уведомлений: `src/components/NotificationsPanel.jsx`.
  - Колокольчик в Header с бейджем: `src/components/Header.jsx`.

Модель данных (клиент)
- Непрочитанные события хранятся в IndexedDB, объект `unread_notifications` с ключом `id`.
- Структура элемента: `{ id: string, type: 'log' | string, title: string, body: string, created_at: string }`.
- Серверные логи мапятся в `id: 'srv-<id>'`, чтобы не конфликтовать с локальными.

REST API
- `GET /api/notifications?limit=100` → `{ notifications: [{ id, type, title, body, created_at }] }`
- `POST /api/notifications/subscribe` → `{ message: 'Subscribed' }` (тело: стандартный PushSubscription)

Push-уведомления
- Клиент регистрирует SW (`/sw.js`) и пытается подписаться через `PushManager`.
- Для VAPID укажите публичный ключ в `VITE_VAPID_PUBLIC_KEY` (на фронте) и пару ключей + контакт в бэкенде.
- При создании записи в `/admin/logs` сервер отправляет push всем подписчикам (если настроены ключи).

Поведение UI
- Колокольчик в Header показывает число непрочитанных (из IndexedDB).
- Панель уведомлений: «Обновить» (запрос к `/api/notifications`), «Отметить все прочитанными» (очистка IndexedDB), «Прочитать» (удаление из IndexedDB по одному).
- Пуши, пришедшие в SW, показываются пользователю; при клике — фокусируется окно и выполняется переход на URL из payload (если передан).

Примечания и улучшения
- Реад-статус намеренно локальный (IndexedDB). При необходимости можно добавить серверную синхронизацию.
- Для дайджестов можно запланировать крон‑джоб на бэкенде, который будет рассылать/создавать записи с периодической сводкой.

