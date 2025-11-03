name: RBAC и права доступа
description: Матрица разрешений, middleware и ограничения на интерфейсе.

Ролевая модель с гранулярными правами (RBAC)

Цель: усилить контроль доступа в Personal Portal, добавив таблицу `permissions`, слой RBAC в мидлваре и UI для управления правами. Разделы фронтенда переключены на проверку конкретных permissions вместо жёстко заданных ролей.

Схема БД
- Таблица `permissions`:
  - `key VARCHAR(64) PRIMARY KEY`
  - `description TEXT`
- Таблица `user_permissions`:
  - `user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`
  - `perm_key VARCHAR(64) REFERENCES permissions(key) ON DELETE CASCADE`
  - `PRIMARY KEY (user_id, perm_key)`

Инициализация
- В `backend/index.js` создаются таблицы и добавляются базовые права:
  - `view_analytics` — доступ к разделу «Аналитика»
  - `view_ai` — доступ к разделу «AI»
  - `view_vpn` — доступ к разделу «VPN»
  - `admin_access` — вход в админ‑панель (покрывает все разделы админки)
  - `manage_users` — (зарезервировано) детальное управление пользователями
  - `view_logs` — (зарезервировано) просмотр логов
  - `manage_content` — (зарезервировано) управление контентом
  - `vpn_create` — создание ключей Outline

Мидлвары (RBAC)
- Файл: `backend/middleware/auth.js`
  - `authRequired` — проверка JWT, прикрепление `req.user`
  - `requireRole(roles)` — прежняя проверка роли (сохранена для совместимости)
  - `requirePermission(perms, mode = 'any')` — новая проверка прав:
    - Разрешает доступ, если роль пользователя `ALL` (суперпользователь), либо если пользователь имеет хотя бы одно из указанных прав (режим `any`) или все (`all`).

Серверные guard'ы админки
- Файл: `backend/routes/admin.js`
  - Глобальная защита роутера админки переведена на `requirePermission('admin_access')` вместо роли `ALL`.
  - Это делает серверную проверку консистентной с фронтендом и позволяет выдавать доступ в админку без назначения суперроли.
  - При желании можно развесить более узкие права на отдельные эндпоинты (например, `manage_users`, `view_logs`, `manage_content`).

API для управления правами
- Файл: `backend/routes/admin.js`
  - `GET /api/admin/permissions` → `{ permissions: [{ key, description }] }`
  - `GET /api/admin/users/:id/permissions` → `{ permissions: string[] }`
  - `PUT /api/admin/users/:id/permissions` body `{ permissions: string[] }` → обновляет набор прав пользователя

Auth API
- Файл: `backend/controllers/authHandlers.js`
  - Методы `login` и `me` теперь возвращают массив прав пользователя в поле `user.permissions: string[]`.

UI админки
- Файл: `src/pages/admin/Users.jsx`
  - Добавлены чекбоксы с правами (колонка «Permissions») и кнопка «Сохранить» на строку пользователя.
  - Роль и флаг `VPN create` (наследие) сохранены для совместимости.

Маршрутизация фронтенда
- Файл: `src/App.jsx`
  - Доступ к разделам основан на правах из `user.permissions`:
    - `/analytics` → `view_analytics`
    - `/ai` → `view_ai`
    - `/vpn` и дочерние → `view_vpn`
    - `/admin/*` → `admin_access` (совпадает с серверной защитой роутов)
  - Пользователь с ролью `ALL` имеет доступ ко всем разделам.

Интеграция с Outline
- Файл: `src/pages/vpn/Outline.jsx` — создание ключей разрешено при наличии одного из условий: роль `ALL`, `user.vpnCanCreate` или право `vpn_create`.

Замечания
- Серверные эндпоинты админки по‑прежнему охраняются через `requireRole(['ALL'])`. Для постепенного перехода возможно заменить на `requirePermission('admin_access')` при необходимости.
- Список прав можно расширять через таблицу `permissions` — UI автоматически подхватит новые ключи.

Как назначить доступ в админку
1) Откройте `Админка → Пользователи`.
2) В строке нужного пользователя отметьте чекбокс права `admin_access` в секции Permissions.
3) Нажмите «Сохранить». С этого момента пользователь сможет открыть разделы `/admin/*`.
4) При необходимости выдайте и другие права: `manage_users`, `view_logs`, `manage_content`, `vpn_create`.
