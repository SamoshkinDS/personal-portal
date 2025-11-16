# Шпаргалки аналитика

## Изменения
- создан новый API-слой `cheatApi` (/src/api/cheat.js) и страница `/analytics/cheats` с карточками, search, modals и markdown-превью (`src/pages/analytics/CheatSheets.jsx`);
- добавлена таблица `cheat_articles` и роут `/api/cheats` с CRUD + импортом (`backend/db/cheatSchema.js`, `backend/routes/cheat.js`), подключено к `ensure...` и экспорту в `backend/index.js`;
- UI доступен через `Sidebar` и `router.jsx`, по импорту записана документация `docs/ANALYTICS_CHEAT_SHEETS.md`.

## Архитектура
- frontend делает запросы к `/api/cheats`, хранит список в стейте, показывает md-превью и использует `react-hot-toast` для уведомлений;
- backend хранит markdown-текст в поле `content`, индексирует `lower(title)` и обновляет timestamp через `set_updated_at`; импорт ожидает массив объектов и безопасно игнорирует пустые поля.

## Настройки
- Все новые маршруты работают в `authRequired`; JSON-импорт должен содержать `title`, остальные поля — опциональны.
