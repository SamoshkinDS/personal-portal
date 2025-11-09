# ТЗ: раздел «Растения» для Личного портала

> Проект: Personal Portal (React 18 + Vite + Tailwind; Express + PostgreSQL; S3/MinIO).  
> Цель: реализовать новый навигационный блок «Растения» с каталогом, поиском/фильтрами, карточкой растения, статьёй и загрузкой изображений в S3.  
> Ответственный: Codex.  
> Все решения ниже согласованы с заказчиком.

---

## 1. Навигация и маршруты

- Пункт меню: **Растения** → `/plants`.
- Хлебные крошки: `Главная → Растения → {Название}`.
- URL карточки: `/plants/:slug` (человекочитаемый слаг).  
  - Источник для слага — поле **english_name** (если пусто, fallback на **latin_name**, далее translit).
  - Редирект со старого вида `/plants/:id` (если появится) на `/plants/:slug`.

---

## 2. Главная страница каталога `/plants`

### 2.1. Макет
- Адаптивная сетка карточек с фиксированной **шириной карточки ~260–300px** и авто-колонками (CSS Grid).
- Элементы карточки:
  - Фото (или плейсхолдер «цветок», серый).
  - Название обычное.
  - Бейджи (минимум): **Свет**, **Полив**, **Токсичность** (иконки+подсказки).

### 2.2. Поиск и фильтры
- Верхняя панель: **поле поиска** (debounce 300мс) + **кнопка «Фильтр»**.
- Фильтры раскрываются в **выезжающей панели (Drawer)**.
- Поддерживается **мультивыбор** для каждого фильтра, одновременная комбинация фильтров, «Показать выбранные» (чипсы) и «Сбросить всё».
- Стартовый набор фильтров:
  - Свет (справочник)
  - Полив (справочник)
  - Почва (справочник)
  - Влажность (справочник)
  - Температура (справочник — диапазоны не используем)
  - Токсичность (по адресату и уровню)
  - Период цветения (месяц)
  - Семейство (текст)
  - Происхождение (текст)
  - Локация (справочник «Комнаты/места»)
- Поиск — по: **common_name**, **latin_name/english_name**, **family**, **origin**.  
  Реализация: ILIKE по нескольким полям + **pg_trgm GIN** индексы для скорости.

### 2.3. Сортировка и подгрузка
- Переключатели сортировки: **По алфавиту (RU)** *(дефолт)*, **По дате добавления (новые→старые)**.
- Пагинация: **ленивая подгрузка** (infinite scroll) поверх серверных `limit/offset`. Дефолтный `limit` = **24** (меняется через env).
- Скелетоны/пустые состояния:
  - «Ничего не найдено» + советы изменить фильтры.
  - «Каталог пуст» — CTA «Добавить растение».

---

## 3. Карточка растения `/plants/:slug`

### 3.1. Структура
- **Слева**: блок изображения.
  - Если фото нет — плейсхолдер + кнопка «Загрузить фото».
  - Одно **главное** фото + (ниже) **галерея** (опциональные дополнительные фото).
- **Справа**: краткий «паспорт»:
  - **Обычное название**, **Латинское/English**, **Семейство**, **Происхождение**,
  - Свет, Полив, Влажность, Почва, Температура,
  - Токсичность (бейджи: для кошек/собак/людей, уровень),
  - Локация,
  - Теги.
- **Ниже**: вкладка **Статья** (одна запись на растение, редактор как в «Документация → Заметки»).

### 3.2. Действия
- «Редактировать данные» (форма в блоках).
- «Загрузить главное фото» и «Добавить в галерею».
- «Сохранить», «Отмена».
- Отдельная кнопка «Редактировать статью».

---

## 4. Роли и статусы

- Единая роль RBAC: **plants_admin** (создавать/редактировать/удалять данные и статьи, загружать фото). Просмотр — всем авторизованным.
- Поле статуса в БД: `status ∈ {created, in_progress, done}`. В UI не отображаем (на будущее).

---

## 5. Хранилище и изображения (S3/MinIO)

### 5.1. Путь и политика
- Бакет: существующий, папка: `plants/`.
- Ключи:
  - Главное фото: `plants/{plantId}/main.{ext}`
  - Превью: `plants/{plantId}/main_preview.{ext}`
  - Галерея: `plants/{plantId}/gallery/{uuid}.{ext}`
- **Схема загрузки**: **через бэкенд** (POST файл на API), бэкенд валидирует и:
  1) генерирует **preview** (resize/compress) с помощью `sharp`,
  2) грузит **main** и **preview** в S3,
  3) возвращает URLs и сохраняет в БД.
- Доступ к изображениям: **публичный READ**. Загрузка — только через backend.

---

## 6. Схема БД (PostgreSQL)

### 6.1. Основные таблицы

```sql
-- Растения
CREATE TABLE plants (
  id               SERIAL PRIMARY KEY,
  slug             TEXT UNIQUE NOT NULL,
  common_name      TEXT NOT NULL,
  latin_name       TEXT,
  english_name     TEXT,
  family           TEXT,
  origin           TEXT,
  light_id         INT REFERENCES dict_light(id),
  watering_id      INT REFERENCES dict_watering(id),
  soil_id          INT REFERENCES dict_soil(id),
  humidity_id      INT REFERENCES dict_humidity(id),
  temperature_id   INT REFERENCES dict_temperature(id),
  description      TEXT,
  max_height_cm    INT,
  leaf_color       TEXT,
  flower_color     TEXT,
  blooming_month   INT CHECK (blooming_month BETWEEN 1 AND 12),
  toxicity_for_cats_level   INT,
  toxicity_for_dogs_level   INT,
  toxicity_for_humans_level INT,
  acquisition_date DATE,
  location_id      INT REFERENCES dict_locations(id),
  main_image_url   TEXT,
  main_preview_url TEXT,
  status           TEXT DEFAULT 'created',
  created_by       INT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Галерея изображений (доп. фото)
CREATE TABLE plant_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id    INT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  preview_url TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Статья (одна на растение)
CREATE TABLE plant_articles (
  plant_id     INT PRIMARY KEY REFERENCES plants(id) ON DELETE CASCADE,
  content_rich JSONB,
  content_text TEXT,
  updated_by   INT,
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Теги (опционально)
CREATE TABLE plant_tags (
  id   SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);
CREATE TABLE plant_tag_map (
  plant_id INT REFERENCES plants(id) ON DELETE CASCADE,
  tag_id   INT REFERENCES plant_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (plant_id, tag_id)
);
```

### 6.2. Справочники (страница «Настройки растений»)

```sql
CREATE TABLE dict_light       (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL);
CREATE TABLE dict_watering    (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL);
CREATE TABLE dict_soil        (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL);
CREATE TABLE dict_humidity    (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL);
CREATE TABLE dict_temperature (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL);

CREATE TABLE dict_locations   (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL);
```

### 6.3. Индексы для поиска

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_plants_common_name_trgm   ON plants USING GIN (common_name gin_trgm_ops);
CREATE INDEX idx_plants_latin_name_trgm    ON plants USING GIN (latin_name gin_trgm_ops);
CREATE INDEX idx_plants_english_name_trgm  ON plants USING GIN (english_name gin_trgm_ops);
CREATE INDEX idx_plants_family_trgm        ON plants USING GIN (family gin_trgm_ops);
CREATE INDEX idx_plants_origin_trgm        ON plants USING GIN (origin gin_trgm_ops);
```
---

## 7. API (Express)

Базовый префикс: `/api/plants`.

### 7.1. Список с поиском/фильтрами
`GET /api/plants?query=&light=1,3&watering=2&soil=...&humidity=...&temperature=...&tox_cat=1,2&tox_dog=0&tox_human=3&bloom=7&family=фикус&origin=юго-восточная%20азия&location=5&tags=1,4&sort=alpha_ru|created_desc&limit=24&offset=0`

**Ответ:**
```json
{
  "items": [
    {
      "id": 12,
      "slug": "ficus-elastica",
      "common_name": "Фикус каучуконосный",
      "main_image_url": "https://s3.../plants/12/main.jpg",
      "light": "Яркий рассеянный",
      "watering": "Умеренный",
      "toxicity": {"cats":2,"dogs":2,"humans":1}
    }
  ],
  "total": 138,
  "limit": 24,
  "offset": 0
}
```

### 7.2. Получить одно растение
`GET /api/plants/:slug`

**Ответ (с развёрнутыми справочниками):**
```json
{
  "plant": {
    "id": 12,
    "slug": "ficus-elastica",
    "common_name": "Фикус каучуконосный",
    "latin_name": "Ficus elastica",
    "english_name": "Rubber plant",
    "family": "Тутовые",
    "origin": "Юго-Восточная Азия",
    "light": {"id":1,"name":"Яркий рассеянный"},
    "watering": {"id":2,"name":"Умеренный"},
    "soil": {"id":3,"name":"Воздушный субстрат"},
    "humidity": {"id":1,"name":"Средняя"},
    "temperature": {"id":2,"name":"18–24°C"},
    "location": {"id":5,"name":"Гостиная / подоконник"},
    "tags": [{"id":1,"name":"суккулент"}],
    "main_image_url":"https://.../plants/12/main.jpg",
    "main_preview_url":"https://.../plants/12/main_preview.jpg"
  },
  "article": { "content_rich": { "type":"doc", "content":[] }, "content_text": "" },
  "gallery": [
    {"id":"uuid-1","image_url":"https://.../plants/12/gallery/uuid-1.jpg","preview_url":"https://.../preview.jpg"}
  ]
}
```

### 7.3. Создать растение
`POST /api/plants` *(роль: plants_admin)*

```json
{ "common_name": "Фикус каучуконосный" }
```

**Ответ:**
```json
{ "id": 45, "slug": "ficus-elastica", "common_name": "Фикус каучуконосный" }
```

### 7.4. Обновить растение (частично)
`PATCH /api/plants/:id` *(plants_admin)* — тело: любые поля из схемы.  
Бэкенд регенерирует `slug`, если изменили `english_name/latin_name`.

### 7.5. Изображения
- **Главное фото:** `POST /api/plants/:id/image/main`  
  - `multipart/form-data`: `file`  
  - Валидация: тип jpeg/png/webp; до 10 МБ. Генерация **preview** (ширина 800px, качество ~75), загрузка обоих файлов в S3, сохранение `main_image_url`/`main_preview_url`.
- **Галерея – добавить:** `POST /api/plants/:id/image/gallery` (мультзагрузка).
- **Галерея – удалить:** `DELETE /api/plants/:id/image/gallery/:imageId`.

### 7.6. CRUD статьи
- `PUT /api/plants/:id/article` — сохраняет `content_rich` и `content_text`.
- `GET /api/plants/:id/article`.

### 7.7. Справочники и локации
- `GET/POST/DELETE /api/plants/dicts/{light|watering|soil|humidity|temperature}`
- `GET/POST/DELETE /api/plants/dicts/locations`

### 7.8. Валидации
- `common_name` — обязателен на create.
- Все ID справочников — должны существовать.
- Ограничения по типу/размеру изображений.

---

## 8. Frontend

### 8.1. Routes
- `/plants` — список.
- `/plants/:slug` — карточка.
- `/plants/settings` — справочники (только plants_admin).

### 8.2. Компоненты
- `PlantListPage`, `PlantCard`, `PlantFiltersDrawer`.
- `PlantDetail` → `ImageBlock`, `PassportBlock`, `TagsList`, `Gallery`.
- `ArticleEditor` — из «Документация/Заметки».
- `CreatePlantDialog` — модал «Добавить растение» (только имя).

### 8.3. UI/UX
- Состояние фильтров хранить в query-string.  
- Дебаунс поиска, кэширование ответов по параметрам.
- Плейсхолдеры изображений, тосты об успехе/ошибках.
- Скелетоны и плавные лоадеры при догрузке.

---

## 9. Производительность и безопасность

- Сложные фильтры — через SQL с индексами (§6.3).  
- Пределы: `limit ≤ 60`; rate-limit по IP (например, 60 req/мин на список).  
- Валидация входа (`express-validator`/`zod`).  
- Кэш загружаемых картинок (long-cache headers).

---

## 10. Тестовые данные

- Сгенерировать **10** растений без фото, заполнить базовые поля и по одному значению справочников; 2–3 общих тега.

---

## 11. Принятие работ (чек-лист)

1. Пункт «Растения» в меню; хлебные крошки корректны.
2. `/plants` рендерит карточки с плейсхолдерами; поиск/фильтры/сортировка работают совместно; есть «Сбросить всё».
3. Ленивая подгрузка без дублей; «ничего не найдено» и «каталог пуст» отображаются корректно.
4. Карточка `/plants/:slug`: загрузка главного фото, генерация превью, сохранение ссылок в БД; «паспорт» и теги видны.
5. Галерея добавляет/удаляет фото; превью генерируются.
6. Статья редактируется и сохраняется; отображается в карточке.
7. Роли: только `plants_admin` видит добавление/редактирование/настройки.
8. Страница «Настройки растений» управляет справочниками и локациями.
9. API соответствует контрактам; ошибки корректно типизированы (400/401/403/413/500).
10. Индексы созданы; поиск быстрый (список ≤200мс при пустом кэше на 10k записей).
11. В репо — миграции и сиды.

---

## 12. Технические детали

- Генерация `slug`: lower-kebab, транслит из **english_name** или **latin_name**; коллизии — добавлять `-n`.
- Превью: ширина **800px**, качество ~75 (env).  
- В статье хранить `content_text` (plain) для поисковых задач.
- Токсичность: уровни `0..3` для **кошек/собак/людей**.
- `temperature_id` — текстовые пресеты (без чисел).
- `status` хранится, но в UI не показывается.
- Миграции — как принято в проекте.
- Конфиги — через `.env`.

---

## 13. Рекомендации

- SVG-иконки для бейджей «Свет/Полив/Токсичность».
- В перспективе: CDN/Reverse-proxy для картинок.
- Возможный переход на presigned GET/PUT при необходимости приватности.

---

## 14. План работ

1) БД и миграции.  
2) API: список/деталь/CRUD/изображения/статья/справочники.  
3) Фронт: список с поиском/фильтрами/ленивой подгрузкой.  
4) Карточка: паспорт, фото, галерея, статья.  
5) Настройки: справочники/локации.  
6) Роль и защита.  
7) Сиды/смоки и приёмка.

---

## 15. Пример `.env`

```
S3_ENDPOINT=https://s3.samoshechkin.ru
S3_BUCKET=your-bucket
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_REGION=us-east-1
IMAGE_MAX_MB=10
IMAGE_PREVIEW_WIDTH=800
IMAGE_PREVIEW_QUALITY=75
PLANTS_PAGE_LIMIT=24
```
