name: Обзор админ-панели
description: Описание разделов админки и основные сценарии управления.

# Админ-панель Personal Portal: текущие возможности

## Доступ и авторизация
- Все эндпоинты `/api/admin/*` защищены мидлварой `authRequired` + `requirePermission('admin_access')`. Дополнительно используются вспомогательные проверки для ролей и блокировки пользователя. 【F:backend/routes/admin.js†L1-L26】【F:backend/middleware/auth.js†L1-L60】
- На клиенте маршруты `/admin`, `/admin/users`, `/admin/content`, `/admin/logs` отображаются только при наличии permission `admin_access` или роли `ALL`. 【F:src/App.jsx†L200-L232】
- Страница пользователей позволяет выдавать granular permissions, включая `admin_access`, `manage_users`, `view_logs`, `manage_content`, `vpn_create`. Данные подгружаются через REST и отображаются в модальном окне. 【F:src/pages/admin/Users.jsx†L1-L120】【F:src/pages/admin/Users.jsx†L160-L240】

## Дашборд `/admin`
- Компонент `AdminHome` показывает карточки навигации и блок метрик. Карточки ссылаются на разделы пользователей, контента и журнала. 【F:src/pages/admin/Index.jsx†L1-L48】
- Метрики сервера подгружаются из `/api/system-stats` и обновляются каждые 15 секунд; при ошибке используются мок‑данные. Данные отображаются в карточках `ServerStatCard` и графиках `SystemCharts`. 【F:src/pages/admin/Index.jsx†L48-L76】【F:src/utils/systemInfo.js†L1-L18】【F:src/components/SystemCharts.jsx†L1-L116】

## Управление пользователями
- API `GET /api/admin/users` возвращает профили с основными полями, блокировкой, ролью и флагом `vpn_can_create`. PATCH‑маршруты позволяют переключать блокировку и роль пользователя. 【F:backend/routes/admin.js†L8-L68】
- Для permissions используется набор эндпоинтов `/api/admin/permissions`, `/api/admin/users/:id/permissions` (GET/PUT) с транзакционным обновлением. 【F:backend/routes/admin.js†L200-L260】
- UI страницы предоставляет модальное окно с вкладками для роли, доступа к VPN и чекбоксами прав. Изменения отправляются через `apiFetch` и подтверждаются toast‑уведомлениями. 【F:src/pages/admin/Users.jsx†L120-L240】

## Управление контентом
- Таблица `content_items` хранит статьи, ссылки и посты; CRUD реализован в `/api/admin/content`. Маршруты фильтруют по типу (`type=article/post/link`). 【F:backend/routes/admin.js†L68-L136】
- Интерфейс `AdminContent` переключает вкладки (`articles`, `posts`, `links`), отображает сетку ввода и таблицу с результатами. Удаление происходит без перезагрузки списка. 【F:src/pages/admin/Content.jsx†L1-L120】

## Журнал событий и push
- `GET /api/admin/logs` возвращает до 500 последних записей из `admin_logs`, `POST /api/admin/logs` добавляет новую запись и инициирует push всем подписчикам через `sendPushToAll`. 【F:backend/routes/admin.js†L136-L196】【F:backend/utils/push.js†L1-L36】
- Страница `AdminLogs` даёт форму для добавления записи и таблицу с историей. Успешная запись обновляет журнал и автоматически доставляет push уведомление (если настроен VAPID). 【F:src/pages/admin/Logs.jsx†L1-L76】

## Работа с VPN правами
- Создание ключей Outline доступно только ролям `ALL` или пользователям с `vpn_can_create`/permission `vpn_create`. Проверка выполняется в роуте `POST /api/vpn/outline/keys`, который запрашивает профиль пользователя. 【F:backend/routes/vpn.js†L1-L88】
- В админке можно выдавать разрешение `vpn_create` через модальное окно пользователя (чекбокс в секции Permissions). 【F:src/pages/admin/Users.jsx†L160-L220】

## Расширение и доработки
- Добавление новых прав достаточно описать в таблице `permissions` (инициализируется в `backend/index.js`) — UI пользователей автоматически подхватит их как чекбоксы. 【F:backend/index.js†L80-L110】【F:src/pages/admin/Users.jsx†L40-L80】
- Для интеграции внешних логов можно расширить `/api/admin/logs` или подключить отдельный источник, сохранив push‑оповещения через `sendPushToAll`.
