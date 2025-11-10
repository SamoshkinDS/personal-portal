# ТЗ‑3.1: Разделы «Вредители», «Заболевания» и «Лекарства»

> Цель: создать три самостоятельных страницы‑каталога с карточками, фильтрами, статьями и фото, аналогично разделу «Растения».  
> Эти страницы пока не связаны с растениями и друг с другом.

---

## 1. Общие принципы

- Отдельные маршруты:
  - `/pests` — Вредители
  - `/diseases` — Заболевания
  - `/medicines` — Лекарства
- Все три страницы имеют общую структуру интерфейса: поиск, фильтры, карточки, статья.
- Роли: `plants_admin` — полные права CRUD, просмотр — всем авторизованным.
- Скелетоны, плавная подгрузка, поиск с debounce 300 мс.
- Цветовые темы карточек:
  - 🐛 Вредители — красно‑оранжевая палитра
  - 🧫 Заболевания — фиолетово‑синяя
  - 💊 Лекарства — зелёная

---

## 2. Вредители (Pests)

### 2.1. Таблица `pests`
```sql
CREATE TABLE pests (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  danger_level TEXT,            -- low / medium / high
  symptoms TEXT,                -- признаки поражения
  active_period TEXT,           -- например: весна-лето
  fight_text JSONB,             -- rich content "Как бороться"
  created_by INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.2. Индексы
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_pests_name_trgm ON pests USING GIN (name gin_trgm_ops);
CREATE INDEX idx_pests_slug ON pests(slug);
```

### 2.3. API
- `GET /api/pests?query=&danger=low,high&active=лето&limit=24&offset=0`
- `GET /api/pests/:slug`
- `POST /api/pests` *(plants_admin)* — минимально `name`
- `PATCH /api/pests/:id` *(plants_admin)*
- `DELETE /api/pests/:id` *(plants_admin)*

### 2.4. UI
- **/pests**: поле поиска, кнопка «Фильтр», карточки (фото, название, danger‑бейдж, краткое описание).
- **/pests/:slug**: слева фото (или плейсхолдер), справа блок «паспорт» (danger, период активности), ниже rich‑блок **«Как бороться»** (fight_text).

---

## 3. Заболевания (Diseases)

### 3.1. Таблица `diseases`
```sql
CREATE TABLE diseases (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  reason TEXT,                  -- причина (перелив, нехватка света и т.д.)
  disease_type TEXT,            -- грибковое, бактериальное и т.п.
  symptoms TEXT,
  treatment_text JSONB,         -- rich "Как лечить"
  prevention TEXT,              -- советы по профилактике
  created_by INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.2. Индексы
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_diseases_name_trgm ON diseases USING GIN (name gin_trgm_ops);
CREATE INDEX idx_diseases_slug ON diseases(slug);
```

### 3.3. API
- `GET /api/diseases?query=&type=грибковое&reason=перелив&limit=24&offset=0`
- `GET /api/diseases/:slug`
- `POST /api/diseases` *(plants_admin)* — минимально `name`
- `PATCH /api/diseases/:id` *(plants_admin)*
- `DELETE /api/diseases/:id` *(plants_admin)*

### 3.4. UI
- **/diseases**: поиск, фильтр по типу и причине; карточки (🧫 иконка, фото, название, тип).
- **/diseases/:slug**: фото, описание, блоки **Причины**, **Признаки**, **Как лечить** (treatment_text), **Профилактика**.

---

## 4. Лекарства (Medicines)

### 4.1. Таблица `medicines`
```sql
CREATE TABLE medicines (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  medicine_type TEXT,            -- фунгицид / инсектицид / универсальное
  form TEXT,                     -- спрей / раствор / порошок
  concentration TEXT,
  expiration_date DATE,
  instruction JSONB,             -- rich-инструкция
  shop_links TEXT,               -- текстовое поле со ссылками через \n
  created_by INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.2. Индексы
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_medicines_name_trgm ON medicines USING GIN (name gin_trgm_ops);
CREATE INDEX idx_medicines_slug ON medicines(slug);
```

### 4.3. API
- `GET /api/medicines?query=&type=инсектицид&form=спрей&limit=24&offset=0`
- `GET /api/medicines/:slug`
- `POST /api/medicines` *(plants_admin)* — минимально `name`
- `PATCH /api/medicines/:id` *(plants_admin)*
- `DELETE /api/medicines/:id` *(plants_admin)*

### 4.4. UI
- **/medicines**: поиск, фильтры по типу и форме; карточки (💊 иконка, фото, название, тип).
- **/medicines/:slug**: фото + блоки **Описание**, **Инструкция** (instruction), **Ссылки на магазины** (разбивать `\n` на список).

---

## 5. Общие требования

- Rich‑редактор тот же, что в «Документация → Заметки» (хранить JSON и plain).
- Плейсхолдер‑иконки, если нет фото.
- Логи изменений: `pests_history`, `diseases_history`, `medicines_history` (id, entity_id, user_id, field, old, new, changed_at).
- Валидации: `name` обязателен, slug формируется автоматически из `name` (kebab‑case, транслит).

---

## 6. Принятие работ

1. Три страницы рендерятся, фильтры и поиск работают.
2. CRUD доступен для `plants_admin`.
3. Карточки корректно отображают данные, статьи сохраняются.
4. Индексы созданы, ответы списка ≤ 200 мс на 10k записей.
