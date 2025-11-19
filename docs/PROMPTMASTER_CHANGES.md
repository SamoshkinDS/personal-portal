Промтмастер обновлён: добавлены модальные формы создания контента и настройки webhook.

## Что сделано
- Страница `/ai/promptmaster`: кнопка «Добавить +» с модалкой для создания промта или папки; добавленный контент сразу появляется в каталоге.
- Кнопка «Настройки»: модалка с полями webhook-url/token/response-token, значения сохраняются в БД (prompt_settings) и используются, если env не заданы.
- API и схемы расширены: prompt_settings, эндпоинты GET/POST `/api/promptmaster/settings`, создание категорий/статей остаётся доступным; вебхук берёт URL/токен из env или БД.
- UI и API-обёртка обновлены, документация дополнена актуальными маршрутами и настройками.

## Архитектура
- Frontend: `src/pages/Promptmaster.jsx` (модалки Добавить/Настройки, формы промта/папки, детальная панель), `src/api/promptmaster.js` (settings, createCategory/createArticle). Навигация без изменений.
- Backend: `backend/routes/promptmaster.js` (новые GET/POST settings, создание категорий/статей, fallback к настройкам из prompt_settings), схема `backend/db/promptmasterSchema.js` добавляет prompt_settings с триггером set_updated_at.
- Документация: `docs/PROMPTMASTER.md` обновлена под новые маршруты и UI.

## Настройки и интеграция
- Env приоритетны: `PROMPTMASTER_WEBHOOK_URL`, `PROMPTMASTER_WEBHOOK_TOKEN`, `PROMPTMASTER_RESPONSE_TOKEN`. Если не заданы, используются значения из prompt_settings.
- Настройки редактируются через UI (модалка «Настройки», доступна при `view_ai`).

## API
- Очередь: POST `/api/promptmaster/requests`, GET `/api/promptmaster/requests`, POST `/api/promptmaster/webhook`, POST `/api/promptmaster/response`.
- Каталог: GET `/api/promptmaster/categories[?parentId|all=true]`, GET `/api/promptmaster/categories/:id`, POST `/api/promptmaster/categories`, GET `/api/promptmaster/articles/:id`, POST `/api/promptmaster/articles`.
- Настройки: GET `/api/promptmaster/settings`, POST `/api/promptmaster/settings`.
