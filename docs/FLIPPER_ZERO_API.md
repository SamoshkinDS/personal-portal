name: Flipper Zero — API
description: REST-эндпоинты для раздела Flipper Zero (категории, прошивки, статьи, модули, очередь генерации).

# Flipper Zero — API Спецификация (реализация)

Базовый префикс: `/api/flipper/*`. Защита: публичные GET для категорий/публикуемых статей/активных модулей, всё остальное — `authRequired` + `requirePermission(['manage_flipper'])`.

## Категории
- `GET /api/flipper/categories` — фильтры: `type`, `parent_id`.
- `GET /api/flipper/categories/:id`
- `POST /api/flipper/categories` — `slug`, `title`, `type`, `description?`, `parent_id?`, `position?`.
- `PATCH /api/flipper/categories/:id`
- `DELETE /api/flipper/categories/:id`

## Прошивки
- `GET /api/flipper/firmwares` (`active?`)
- `GET /api/flipper/firmwares/:id`
- `POST /api/flipper/firmwares`
- `PATCH /api/flipper/firmwares/:id`
- `DELETE /api/flipper/firmwares/:id`

## Статьи
- `GET /api/flipper/articles` — фильтры: `category_id`, `firmware_id`, `type`, `status`, `search`, `limit/offset` (публикуются только `status=published` без auth).
- `GET /api/flipper/articles/:id` — публично только published.
- `POST /api/flipper/articles`
- `PATCH /api/flipper/articles/:id`
- `PATCH /api/flipper/articles/:id/status`
- `DELETE /api/flipper/articles/:id`

## Модули
- `GET /api/flipper/modules` — `firmware_id`, `category_id`, `active`, `search`, `limit/offset` (без auth только активные).
- `GET /api/flipper/modules/:id` — публично только активные.
- `POST /api/flipper/modules`
- `PATCH /api/flipper/modules/:id`
- `DELETE /api/flipper/modules/:id`

## Очередь задач (n8n)
- `GET /api/flipper/queue` — фильтры: `status`, `article_id`, `operation`, `limit/offset`.
- `POST /api/flipper/queue`
- `PATCH /api/flipper/queue/:id`
- `DELETE /api/flipper/queue/:id`

## Вспомогательные
- `POST /api/flipper/utils/slug` — `title` → `slug`.
- `POST /api/flipper/utils/preview` — `{ markdown }` → `{ html }` (упрощённый sanitizer).

## Статус
- Реализовано в `backend/routes/flipper.js`, подключено в `backend/index.js` (префикс `/api/flipper`).
