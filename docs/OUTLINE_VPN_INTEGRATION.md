name: Интеграция Outline VPN
description: Настройка API Outline, UI и управление ключами доступа.

Интеграция Outline API для VPN ключей

Цель: добавить реальную работу с Outline Management API в раздел VPN — вывод списка ключей, создание и удаление. Реализовать сервис на бэкенде с кешированием и хук на фронтенде, обновить UI в стиле Outline Manager. Добавить страницу-инструкцию для пользователей.

Состав изменений
- Бэкенд
  - Новый роутер `backend/routes/vpn.js` с путями `/api/vpn/outline/*`.
  - Кеширование ответов для списка ключей (in-memory, TTL по умолчанию 10 секунд).
  - Конфигурация через переменные окружения в `backend/.env`:
    - `OUTLINE_API_URL` — базовый URL Management API, например: `https://<host>:9090/<API_TOKEN>`
- `OUTLINE_API_INSECURE=true` — разрешить самоподписанный сертификат (если требуется). Реализовано через per‑request TLS‑исключение в HTTP‑клиенте, без глобального отключения проверки сертификатов.
    - `OUTLINE_CACHE_TTL_MS=10000` — время жизни кеша в миллисекундах
- Фронтенд
  - Хук `src/hooks/useOutlineKeys.js`: загрузка ключей, создание, удаление, состояния `loading` и `error`.
  - Обновлённый UI на `src/pages/vpn/Outline.jsx`: список ключей с копированием `accessUrl`, форма создания, кнопка обновления.
  - Новая страница `src/pages/vpn/OutlineGuide.jsx` — краткая инструкция по созданию ключа и подключению на мобильном.
  - Маршрут `"/vpn/outline/guide"` добавлен в `src/App.jsx`.

REST API (бэкенд портала)
- Авторизация обязательна, проверяется ролью: допускаются `ALL`, `VPN`, `NON_ADMIN`.
- Эндпоинты:
  - `GET /api/vpn/outline/keys`
    - Ответ: `{ keys: OutlineKey[] }`, данные кешируются на TTL.
  - `POST /api/vpn/outline/keys` body `{ name?: string }`
    - Создаёт ключ; если передано `name`, задаёт имя отдельным запросом.
    - Ответ: `{ key: OutlineKey }`, кеш сбрасывается.
  - `DELETE /api/vpn/outline/keys/:id`
    - Удаляет ключ, кеш сбрасывается.

Типы/DTO (как их отдаёт Outline)
- `OutlineKey` (пример): `{ id: string, name?: string, accessUrl?: string, password?: string, port?: number, method?: string }`
  - На фронте отображаются `name` (если есть), а также `accessUrl` (с кнопкой «копировать»). Для резервного отображения формируется строка из метода/пароля/порта.

Кеширование
- Простое in-memory хранилище на процессе бэкенда с TTL (`OUTLINE_CACHE_TTL_MS`).
- Кеш используется только для `GET /outline/keys`, при `POST/DELETE` — инвалидируется.

Интеграция с AuthContext
- На фронте используется `apiAuthFetch`, автоматически добавляющий Bearer‑токен (см. `src/utils/api.js`).
- Доступ к маршрутам Outline ограничен через `authRequired` + `requireRole` на бэкенде.

UI и UX
- Страница `VPN → Outline` показывает:
  - Поле «Название ключа», кнопки «Создать ключ» и «Обновить».
  - Состояния загрузки/ошибки.
  - Список ключей с названием, `accessUrl`, кнопкой «Копировать» и «Удалить».
  - Ссылка на страницу «Инструкция». Визуально стилистика приближена к Outline Manager (чёткие списки, кнопки действий справа).

Настройка окружения
- В `backend/.env` добавьте:
  ```
  OUTLINE_API_URL=https://your-outline-host:9090/REPLACE_WITH_API_TOKEN
  OUTLINE_API_INSECURE=true
  OUTLINE_CACHE_TTL_MS=10000
  ```
  Примечание: если на сервере используется самоподписанный сертификат, флаг `OUTLINE_API_INSECURE=true` позволяет временно отключать проверку CA для этих запросов.

Как это работает
- Бэкенд проксирует запросы к Outline Management API, скрывая токен от фронтенда.
- Ответы списка краткосрочно кешируются, чтобы не перегружать Outline и ускорить UI.
- Фронтенд использует хук `useOutlineKeys` для единообразной работы (загрузка/ошибки) и минимального кода в UI.

Дополнительно реализовано
- Переименование ключей: PUT `/api/vpn/outline/keys/:id/name` (проксирует Outline `PUT /access-keys/:id/name`).
- Показ трафика: GET `/api/vpn/outline/metrics` (проксирует Outline `GET /metrics/transfer`, в UI выводится «Трафик» на строке ключа).
- Управление лимитами:
  - Пер-ключевой лимит: PUT `/api/vpn/outline/keys/:id/data-limit` body `{ bytes }`, DELETE `/api/vpn/outline/keys/:id/data-limit`.
  - Глобальный лимит для всех ключей: PUT `/api/vpn/outline/server/access-key-data-limit` body `{ bytes }`, DELETE `/api/vpn/outline/server/access-key-data-limit`.
  - Просмотр текущего глобального лимита: GET `/api/vpn/outline/server` (поле `accessKeyDataLimit.bytes`).
- Разделение прав: создание ключа разрешено только при `users.vpn_can_create = true` либо при роли `ALL`. На фронтенде кнопка «Создать ключ» становится неактивной при отсутствии разрешения.
