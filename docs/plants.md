name: Раздел «Растения»
description: Каталог комнатных растений с поиском/фильтрами, карточкой, статьёй и загрузкой изображений в S3/MinIO. Доступ из главного меню и с главной страницы портала.

## Навигация и маршруты
- Пункт в сайдбаре: `Растения` → `/plants` (добавлен в `src/components/Sidebar.jsx`).
- Быстрый доступ с главной страницы: карточка «Растения» (добавлено в `src/pages/Home.jsx`).
- Карточка растения: `/plants/:slug`.
- Настройки справочников: `/plants/settings` (только с правом `plants_admin`).

## Страницы и возможности
- `/plants` — каталог:
  - Адаптивная сетка карточек (фиксированная ширина карточки, авто-колонки).
  - Дебаунс-поиск, Drawer с мульти-фильтрами, чипсы выбранных фильтров, «Сбросить всё».
  - Сортировка: По алфавиту (RU), По дате добавления (новые → старые).
  - Ленивая подгрузка (infinite scroll) по `limit/offset` без дублей.
  - Пустые состояния и скелетоны.
  - Кнопка «Добавить» (только `plants_admin`) — быстрое создание по имени.
- `/plants/:slug` — карточка растения:
  - Слева: главное фото (плейсхолдер при отсутствии), соотношение 3:4, загрузка файла.
  - Справа: «паспорт» (названия, семья, происхождение, свет, полив, влажность, почва, температура, локация, токсичность, рост, дата и пр.), редактирование в модальном окне.
  - Галерея: добавление нескольких фото, удаление, превью.
  - Статья: редактор на Tiptap (HTML/JSON), отображение как форматированная статья.
- `/plants/settings` — управление справочниками и тегами (CRUD списков).

## Frontend (основные файлы)
- Каталог: `src/pages/plants/PlantsList.jsx`.
- Карточка: `src/pages/plants/PlantDetail.jsx`.
- Настройки: `src/pages/plants/PlantSettings.jsx`.
- Редактор статьи: `src/components/plants/PlantArticleEditor.jsx`.
- API-клиент: `src/api/plants.js`.
- Вспомогательные хуки: `src/hooks/useDebouncedValue.js`, `src/hooks/useQueryState.js`.
- Включение роутов: `src/App.jsx`.
- Навигация/линки: `src/components/Sidebar.jsx`, `src/pages/Home.jsx`.

## API (backend)
Базовый префикс: `/api/plants`.

- Получить список (поиск/фильтры/сортировка/пагинация):
  - `GET /api/plants?query=&light=1,3&watering=2&soil=...&humidity=...&temperature=...&tox_cat=1,2&tox_dog=0&tox_human=3&bloom=7&family=фикус&origin=юго-восточная%20азия&location=5&tags=1,4&sort=alpha_ru|created_desc&limit=24&offset=0`
  - Ответ: `{ items:[...], total, limit, offset }` (карточки с бейджами и токсичностью).
- Метаданные (справочники/теги/лимиты): `GET /api/plants/meta`.
- Получить одну карточку: `GET /api/plants/:identifier` (slug или id). Ответ включает развёрнутые справочники, теги, галерею, статью.
- Создать растение (только `plants_admin`): `POST /api/plants` — минимально `{ common_name }`.
- Обновить (частично, `plants_admin`): `PATCH /api/plants/:id` — любые поля паспорта; если меняются `english_name/latin_name`, backend регенерирует `slug`.
- Статья (`plants_admin`): `PUT /api/plants/:id/article` — сохраняет `content_rich` (JSON) и `content_text` (plain).
- Главное фото (`plants_admin`): `POST /api/plants/:id/image/main` (`multipart/form-data`: `file`); генерируется preview (webp), обе версии грузятся в S3; в БД сохраняются URL и ключи.
- Галерея (`plants_admin`): `POST /api/plants/:id/image/gallery` (мультзагрузка) и `DELETE /api/plants/:id/image/gallery/:imageId`.
- Справочники (`plants_admin`): `GET/POST/DELETE /api/plants/dicts/{light|watering|soil|humidity|temperature}`.
- Локации (`plants_admin`): `GET/POST/DELETE /api/plants/dicts/locations`.
- Теги (`plants_admin`): `GET /api/plants/tags`, `POST /api/plants/tags`, `DELETE /api/plants/tags/:id`.

Код: `backend/routes/plants.js` (подключено в `backend/index.js`).

## Хранилище изображений (S3/MinIO)
- Бакет: `plants/{plantId}/...` (главное и превью; галерея с uuid).
- Превью генерируется через `sharp` (по умолчанию ширина 800px, качество ~75).
- Публичный доступ READ; загрузка — через backend.
- Конфигурация клиента: `backend/services/s3Client.js` (генерация публичных URL, поддержка `S3_PUBLIC_BASE_URL`).

Переменные окружения (backend `.env`):
```
S3_ENDPOINT=http://127.0.0.1:9000
S3_BUCKET=personal-portal
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_BASE_URL=... (опционально)

IMAGE_MAX_MB=10
IMAGE_PREVIEW_WIDTH=800
IMAGE_PREVIEW_QUALITY=75
PLANTS_PAGE_LIMIT=24
```

## Схема БД
Файлы: `backend/db/plantsSchema.js` (создание таблиц и индексов при старте).

- Таблицы: `plants`, `plant_images`, `plant_articles`, `plant_tags`, `plant_tag_map`, справочники `dict_*`, `dict_locations`.
- Индексы `pg_trgm` для полей поиска (`common_name`, `latin_name`, `english_name`, `family`, `origin`).
- Триггеры на обновление `updated_at`.
- Поле `status` в `plants` (`created|in_progress|done`) — на будущее.

## Права и доступ
- Добавлено разрешение `plants_admin` (вставляется при инициализации БД в `backend/index.js`).
- Действия создания/редактирования/загрузки доступны только c `plants_admin` или ролью `ALL`.
- Просмотр — авторизованным пользователям.

## Поведение UI / UX детали
- Карточки каталога используют 4:3 превью, детальная — 3:4 (можно поменять в `PlantDetail.jsx`).
- После загрузки главного фото выполняется принудительное обновление карточки и bust-кэш по URL, чтобы новое изображение отобразилось без hard reload.
- В форме редактирования:
  - `blooming_month` можно оставить пустым (backend корректно принимает `null`).
  - `acquisition_date` нормализуется к `YYYY-MM-DD` и не «сдвигается» на день при сохранении.

## Сиды/данные
- Скрипт демо-сидов: `backend/scripts/seedPlants.js`.
  - Генерирует 10 растений с базовыми полями, случайные теги и справочники.
  - Запуск: `npm run seed:plants` (в каталоге `backend`).

## Известные нюансы
- Для корректного отображения S3 URL c внешнего браузера задайте `S3_PUBLIC_BASE_URL` (CDN/прокси) или откройте MinIO бакет на чтение.
- Если slug меняется при правке английского/латинского названия, старый путь редиректится на новый при запросе по `id`.

## Чек-лист приёмки
1) Меню и быстрый линк на главной ведут в каталог.
2) `/plants` — поиск/фильтры/сортировка, ленивая подгрузка, пустые состояния.
3) `/plants/:slug` — главное фото + превью, паспорт, теги, галерея, статья.
4) Настройки — CRUD справочников и тегов (только `plants_admin`).
5) Изображения лежат в S3 в структуре `plants/{id}/...`, превью генерируются.
6) Индексы `pg_trgm` созданы, поиск быстрый на больших списках.
