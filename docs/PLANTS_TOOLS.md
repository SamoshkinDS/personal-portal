name: Материалы и оборудование
description: Новый раздел инвентаря с категориями и карточками товаров/материалов для ухода за растениями.

- Добавлены таблицы `tools_categories` и `tools_items` (jsonb `extra_fields`, хранение фото в S3 с preview) в `ensurePlantsSchema`.
- Реализованы API `/api/plants/tools/categories`, `/api/plants/tools/:slug` и CRUD элементов в `backend/routes/plantTools.js` с проверкой прав `plants_admin` для изменений.
- Фронтенд: страницa списков `/plants/tools` и категории `/plants/tools/:slug` с карточками, модалками и загрузкой фото; управление категориями в настройках растений.
- Обновлены `src/router.jsx`, `src/components/Sidebar.jsx`, `src/api/plantTools.js` и `src/pages/plants/PlantSettings.jsx` для настройки категорий.
- Дата: 2025-11-21.
