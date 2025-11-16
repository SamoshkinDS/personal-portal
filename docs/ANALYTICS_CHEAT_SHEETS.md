name: Аналитика → Шпаргалка
description: Быстрая коллекция мини-статей с markdown-контентом, поиском, редактором и поддержкой JSON-порта.

## Локация и навигация
- Страница доступна из `Sidebar` → `Аналитика` → `Шпаргалка`.
- В шапке: заголовок, кнопки `Создать шпаргалку` и `Импорт JSON`, строка поиска по названию/контенту.
- Основной блок — карточки с заголовком, обрезанным описанием, датой обновления и кнопкой `Открыть`.

## UI и поведение
- Карточки отображаются адаптивной сеткой; при клике открывается модалка просмотра с markdown-контентом.
- В модалке просмотра выводится `title`, `content` (рендерится через `react-markdown`), кнопки `Редактировать` и `Удалить`.
- В модалке создания/редактирования поля: `title`, `description`, `content`, а справа показывается живой markdown-превью.
- Поиск запускает загрузку через `GET /api/cheats?search=...` с дебаунсом в 350 мс.
- Импорт JSON — отдельная модалка с выбором файла, проверкой формата, счетчиком объектов и кнопкой `Импортировать`.

## Backend
- Таблица `cheat_articles` (`backend/db/cheatSchema.js`): `id`, `title`, `description`, `content`, `created_at`, `updated_at`.
- Индексы по `lower(title)` и `updated_at` ускоряют поиск и сортировку; триггер `set_updated_at`.
- Роут `/api/cheats` (`backend/routes/cheat.js`) поддерживает:
  * `GET /api/cheats` — list с фильтрами `search`, `limit`.
  * `GET /api/cheats/:id` — чтение одной статьи.
  * `POST /api/cheats`, `PATCH /api/cheats/:id`, `DELETE /api/cheats/:id`.
  * `POST /api/cheats/import` — массовый импорт массива JSON-объектов.
- Все эндпоинты защищены `authRequired`, ошибки возвращают понятные сообщения.

## Фронтенд
- Новый API-обертка `src/api/cheat.js` инкапсулирует `GET`, `POST`, `PATCH`, `DELETE`, `import`.
- Страница `src/pages/analytics/CheatSheets.jsx` использует `PageShell`, `Modal`, `react-hot-toast`, `useDebouncedValue`, `react-markdown`.
- Маршрут `/analytics/cheats` добавлен в `router.jsx` и выводится в `Sidebar`.

## Импорт JSON
- Принимается массив объектов `{ title, description?, content? }`.
- Пример:
  ```
  [
    {
      "title": "User Story",
      "description": "Структура user story",
      "content": "# User Story..."
    }
  ]
  ```
- Интерфейс предупреждает, если JSON некорректный или не содержит объектов.
