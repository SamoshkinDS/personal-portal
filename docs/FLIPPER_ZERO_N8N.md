name: Flipper Zero — интеграция n8n
description: Очередь flipper_article_queue, протокол взаимодействия с n8n/AI, примеры payload и статусов.

# Flipper Zero — Интеграция с n8n и очередь контента

## Очередь flipper_article_queue
- Поля: `id`, `article_id?`, `operation` (`generate`|`update`|`regenerate`), `payload` (JSONB), `source`, `status` (`pending`|`processing`|`done`|`error`), `error_message`, `locked_at`, `processed_at`, `created_by_id`, audit.
- Роуты: `GET/POST/PATCH/DELETE /api/flipper/queue` (auth + `manage_flipper`), ответ листинга — `{ items: [...] }`.
- Создание задачи: POST `/api/flipper/queue` body `operation`, `payload`, опционально `article_id`, `source`, `status`.
- N8N-пуллинг: `GET /api/flipper/queue?status=pending&limit=1` → `PATCH /api/flipper/queue/:id` c `status=processing`, `locked_at`.

## Базовый пайплайн n8n
```
[Trigger/cron]
 → GET /api/flipper/queue?status=pending&limit=1
 → PATCH /api/flipper/queue/:id { status: 'processing', locked_at: ISO }
 → AI (формирование промта из payload)
 → POST /api/flipper/articles (generate) или PATCH /api/flipper/articles/:id (update/regenerate)
 → PATCH /api/flipper/queue/:id { status: 'done', processed_at: ISO }
```
Ошибки: `PATCH /api/flipper/queue/:id { status: 'error', error_message }`.

## Структуры payload
- Минимум: `{ "title": "...", "category_id": <id> }`.
- Опционально: `firmware_id`, `type`, `points`, `module_slug`, `extended_requirements`.
- Пример generate: гайд BLE-замков — см. блок ТЗ (points, extended_requirements).
- Пример regenerate: `{ "article_id": 7, "reason": "переписать" }`.

## Формат ответа AI
```json
{
  "title": "RFID — основы работы",
  "summary": "Кратко...",
  "content_markdown": "# Заголовок...",
  "tags": ["rfid", "nfc", "security"]
}
```

## Сохранение статей
- Создание: POST `/api/flipper/articles` с `title`, `slug`, `category_id`, `type`, `summary`, `content_raw`, `tags`.
- Обновление: PATCH `/api/flipper/articles/:id` с `summary`, `content_raw`, `tags`.
- Статусы публикации: `draft/review/published/archived`; публично выдаются только `published`.

## Права
- Все операции очереди и записи контента — `manage_flipper`.
- Публичные GET: категории, опубликованные статьи, активные модули.

## Логирование
- Логировать создание задач, смену статусов, ошибки и успешные публикации (оставлено на уровень сервиса/n8n).
