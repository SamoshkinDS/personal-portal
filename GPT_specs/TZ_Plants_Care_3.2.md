# ТЗ‑3.2: Доработка карточки растения (интеграция проблем)

> Цель: добавить блоки для отображения связанных вредителей, заболеваний и лекарств в карточку растения.  
> Эта интеграция не изменяет структуру базовых страниц из ТЗ‑3.1.

---

## 1. Изменения в таблицах

### 1.1. Связи «растение ↔ вредитель/заболевание»
```sql
CREATE TABLE plant_pest (
  plant_id INT REFERENCES plants(id) ON DELETE CASCADE,
  pest_id INT REFERENCES pests(id) ON DELETE CASCADE,
  PRIMARY KEY (plant_id, pest_id)
);

CREATE TABLE plant_disease (
  plant_id INT REFERENCES plants(id) ON DELETE CASCADE,
  disease_id INT REFERENCES diseases(id) ON DELETE CASCADE,
  PRIMARY KEY (plant_id, disease_id)
);
```

### 1.2. Галерея симптомов (опционально)
```sql
CREATE TABLE disease_symptom_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_id INT REFERENCES diseases(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  preview_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pest_symptom_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pest_id INT REFERENCES pests(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  preview_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 2. UI изменения в карточке растения

### 2.1. Новый таб «Проблемы»
Внизу карточки добавить таб **«Проблемы»** с тремя секциями:

- **Вредители** — список связанных вредителей (мини‑карточки со ссылками).
- **Заболевания** — список связанных заболеваний.
- **Рекомендованные лекарства** — собираются автоматически: объединение всех лекарств, связанных с указанными вредителями/заболеваниями (реализуется на этапе 3.3 через таблицы связей).

### 2.2. Добавление связей
- Кнопка **«Добавить вредителя»** → модальное окно с поиском по каталогу `/pests` (multi‑select).
- Кнопка **«Добавить заболевание»** → аналогично.
- После подтверждения — отправка на API и обновление списка.

### 2.3. Отображение
- Мини‑карточки (🐛/🧫/💊) в сетке: иконка, название, danger/type бейдж.
- Tooltip при ховере с кратким описанием/симптомами.
- Клик — переход на детальную страницу сущности.

---

## 3. API

- `GET /api/plants/:id/problems` — возвращает:
  ```json
  {
    "pests": [ { "id":1,"slug":"...", "name":"...", "danger_level":"..." } ],
    "diseases": [ { "id":2,"slug":"...", "name":"...", "disease_type":"..." } ],
    "medicines": []  // заполняется после ТЗ‑3.3
  }
  ```
- `POST /api/plants/:id/pests` — body: `{ "ids": [1,2,3] }`
- `POST /api/plants/:id/diseases` — body: `{ "ids": [4,5] }`
- `DELETE /api/plants/:id/pests/:pestId`
- `DELETE /api/plants/:id/diseases/:diseaseId`

Права: только `plants_admin`.

---

## 4. Сообщения и состояния

- Если у растения нет связанных проблем — текст: «Для этого растения пока не зафиксированы вредители или болезни».
- При добавлении/удалении — toast‑уведомления.
- Состояния загрузки — skeleton и спиннеры.

---

## 5. Тестовые данные

- Добавить 3 растения, каждому связать 2 вредителя и 1 заболевание из ТЗ‑3.1.

---

## 6. Принятие работ

1. На карточке растения появился таб «Проблемы» с секциями.
2. Добавление/удаление связей работает; права соблюдены.
3. Данные корректно подгружаются с API.
