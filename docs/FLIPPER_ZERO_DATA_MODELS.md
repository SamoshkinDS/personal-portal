name: Flipper Zero — модели данных
description: Таблицы и связи для раздела Flipper Zero (категории, прошивки, статьи/контент, модули и очередь генерации контента).

# Flipper Zero — Модели данных

## Базовые таблицы (MVP)

1. `flipper_categories` — категории контента: slug, title, description, type (`basic`, `firmware`, `module`, `guide`, `vuln`), parent_id, position, is_active, audit.
2. `flipper_firmwares` — список прошивок: slug (`official`, `unleashed`, `marauder`, `momentum`, `bunnyloader`), name, short_description, raw/rendered описания, ссылки, is_custom, is_active, audit.
3. `flipper_articles` — основная база материалов: title, slug, category_id, firmware_id, type (`feature_basic`, `feature_custom_fw`, `module_custom`, `guide_scenario`, `vuln_check`), summary, raw/rendered контент, tags (JSONB), complexity_level (`beginner`, `intermediate`, `advanced`), estimated_duration_min, status (`draft`, `review`, `published`, `archived`), published_at, audit.
4. `flipper_modules` — модули/плагины: slug, name, short_description, raw/rendered, firmware_id, supported_firmwares (JSONB), category_id, source_url, is_active, audit.
5. `flipper_article_queue` — очередь задач для n8n/ИИ: article_id, operation (`generate`, `update`, `regenerate`), payload (JSONB), source, status (`pending`, `processing`, `done`, `error`), error_message, locked_at, processed_at, created_by_id, audit.

## Статус

- Реализовано в `backend/db/flipperSchema.js`, подключено в `backend/index.js` (ensureFlipperSchema). Все таблицы создаются при старте, есть индексы и триггеры `set_updated_at`.
