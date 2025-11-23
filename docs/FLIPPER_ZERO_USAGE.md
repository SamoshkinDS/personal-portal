name: Flipper Zero — инструкция по использованию
description: Как администрировать раздел Flipper Zero: создание категорий, прошивок, модулей, статей, гайдов и уязвимостей, работа с очередью n8n.

# Flipper Zero — инструкция по использованию

## 1. Навигация
- В админке появился пункт `Администрирование → Flipper Zero`.
- Внутри вкладки: Категории, Прошивки, Модули, Статьи, Очередь задач.

## 2. Категории
1. Открыть Категории → Создать категорию.
2. Поля: Название, Slug (латиница), Тип (basic/firmware/module/guide/vuln), Описание (опц.), Родитель (опц.), Позиция.
3. Пример: `RFID / NFC` / `rfid_nfc` / `basic`.
4. Отображение: `/flipper/basic` и `/flipper/basic/:slug`.

## 3. Прошивки
1. Прошивки → Создать.
2. Поля: Название, Slug (`unleashed` и т.д.), краткое/полное описание, ссылки.
3. Страница: `/flipper/firmware/<slug>`; список `/flipper/firmware`.

## 4. Модули
1. Модули → Создать.
2. Поля: Название, Slug, основная прошивка, supported_firmwares, категория, описание, source_url, активность.
3. Страница: `/flipper/module/<slug>`; список `/flipper/modules`.

## 5. Статьи
1. Статьи → Создать.
2. Поля: Заголовок, Slug, Категория, Тип (`feature_basic`, `feature_custom_fw`, `module_custom`, `guide_scenario`, `vuln_check`), прошивка (опц.), summary, контент (Markdown), теги.
3. Страница: `/flipper/article/<slug>`; общий список `/flipper/articles`.

## 6. Гайды (guide_scenario)
- Это статьи с `type = guide_scenario`.
- Автосписок: `/flipper/guides`; деталь: `/flipper/guide/<slug>`.

## 7. Уязвимости (vuln_check)
- Статьи с `type = vuln_check`.
- Автосписок: `/flipper/vulns`; деталь: `/flipper/vuln/<slug>`.

## 8. Очередь задач (n8n)
1. Очередь → Создать задачу.
2. Поля: operation (`generate`/`update`/`regenerate`), payload (JSON), article_id (опц.), source (опц.).
3. Поток: задача `pending` → n8n ставит `processing` → AI генерирует markdown → сохранение статьи → статус `done` (или `error` с описанием).
4. Пример payload:
   ```json
   {
     "title": "Основы RFID",
     "category_id": 1,
     "type": "feature_basic",
     "points": ["Что такое RFID", "Как работает эмуляция"]
   }
   ```

## 9. Связи
```
Категории → группируют статьи
Прошивки → связаны со статьями и модулями
Модули → могут ссылаться на прошивки/категории
Статьи → основной контент, показываются в разделах и деталях
```

## 10. Отладка
- Проверить slug и статус (published/active).
- Проверить ответы API.
- Убедиться, что seed загрузился (ensureFlipperSchema).

## 11. Итог
- Все сущности создаются из админки Flipper Zero.
- Страницы раздела `/flipper/*` автоматически подхватывают данные.
- Очередь n8n позволяет генерировать и обновлять контент без ручного ввода.
