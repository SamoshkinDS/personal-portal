# Каркас интерфейса и навигация

## Общая структура приложения
- Корневой компонент `App` оборачивает всё в `AuthProvider`, регистрирует Service Worker/push через `registerPush()` и применяет анимации переходов `framer-motion` для каждой страницы. 【F:src/App.jsx†L1-L76】
- После авторизации рендерится макет с `Sidebar` и контентной областью; в шапке `Header` размещены уведомления, переключатель темы и кнопка выхода. Все страницы наследуют единый вид через `PageShell`. 【F:src/App.jsx†L120-L208】【F:src/components/PageShell.jsx†L1-L33】

## Sidebar и мобильное поведение
- `Sidebar` содержит конфигурацию навигации `NAV`, включая вложенные группы для VPN и админки. Отображаемые пункты фильтруются по роли (`ALL`, `NON_ADMIN`, `ANALYTICS`, `NEURAL`, `VPN`). 【F:src/components/Sidebar.jsx†L1-L120】
- Компонент поддерживает сворачивание (`isCollapsed`), подсветку активного маршрута и вложенные подменю с анимацией. Для мобильного режима предусмотрена панель, которая открывается свайпом, контролируется глобальной функцией `window.__toggleSidebar`. 【F:src/components/Sidebar.jsx†L120-L220】【F:src/App.jsx†L80-L118】
- Логотип и быстрая навигация на главную оформлены через ссылку внутри сайдбара; при клике используется `history.pushState`, чтобы не перезагружать SPA. 【F:src/components/Sidebar.jsx†L180-L232】

## Header и уведомления
- `Header` отслеживает прокрутку для добавления тени, отображает текущего пользователя из `AuthContext`, а также рендерит кнопки: меню (для мобильных), уведомления, переключатель темы, действия страницы и logout. 【F:src/components/Header.jsx†L1-L84】
- Кнопка уведомлений использует хук `useNotifications`, который хранит непрочитанные события в IndexedDB и подгружает их с сервера при открытии панели. Панель реализована компонентом `NotificationsPanel`. 【F:src/components/Header.jsx†L64-L104】【F:src/hooks/useNotifications.js†L1-L80】
- Тема переключается через `useTheme`, который хранит состояние в `localStorage` и добавляет/удаляет класс `dark` на `document.documentElement`. 【F:src/components/Header.jsx†L60-L80】【F:src/hooks/useTheme.js†L1-L84】

## PageShell и контент
- `PageShell` оборачивает страницы заголовком, градиентной подложкой и контейнером контента. Компонент принимает `actions`, `onLogout`, `contentClassName` для кастомизации страниц. 【F:src/components/PageShell.jsx†L1-L33】
- Заголовок страницы анимируется при каждом переходе, что обеспечивает единый visual language в разных разделах. 【F:src/components/PageShell.jsx†L15-L28】

## Регистрация push и Service Worker
- `registerPush` подключается один раз при монтировании `AppRoutes`: регистрирует `public/sw.js`, запрашивает разрешение Notification API, подписывает пользователя через VAPID ключ и отправляет subscription на `/api/notifications/subscribe`. 【F:src/App.jsx†L40-L68】【F:src/push/registerPush.js†L1-L56】
- Service Worker `sw.js` обрабатывает события `push` и `notificationclick`, открывая окно портала и фокусируя существующие вкладки. 【F:public/sw.js†L1-L48】

## Навигационные маршруты
- `Routes` в `App` проверяют авторизацию и права на основании `user.permissions`, блокируя доступ к разделам без нужного permission (`view_analytics`, `view_ai`, `view_vpn`, `admin_access`). 【F:src/App.jsx†L120-L208】
- Для неавторизованных пользователей доступны `/login`, `/register`, `/reset-password`, остальные маршруты редиректят на форму входа. 【F:src/App.jsx†L40-L76】

## Дополнительные элементы UX
- Свайпы на мобильных устроены через обработчики `onTouchStart/onTouchMove` в `App`, позволяя открывать/закрывать боковое меню жестами. 【F:src/App.jsx†L80-L118】
- Для навигации между страницами используются анимированные контейнеры `RouteTransition`, что создаёт эффект плавного перехода. 【F:src/App.jsx†L12-L36】
