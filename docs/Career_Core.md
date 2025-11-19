name: Career Core
description: Основной блок «Профессиональное развитие» с базовыми сущностями навыков, курсов, проектов, интервью и технических знаний для будущих расширений.

- Добавлены миграции `backend/db/migrations/20251118_create_*` для `skills`, `courses`, `course_skills`, `portfolio_projects`, `project_skills`, `interviews`, `tech_knowledge`.
- Создан `backend/db/careerSchema.js` и подключён в `backend/index.js` для обеспечения схемы при старте сервера.
- Реализованы CRUD API `/api/career/*` через `backend/routes/career.js` и вспомогательный сервис `backend/services/careerService.js` с единым ответом `{ success, data, error }` и валидацией данных.
- Добавлена фронтенд-страница `src/pages/career/Dashboard.tsx` с компонентами метрик, радара, пирога и ленты активности.
- Добавлен раздел навыков `/career/skills` с карточками, фильтрами, CRUD-модалкой и подтверждением удаления.
- Добавлен раздел курсов `/career/courses` — карточки, фильтры по статусу/платформе/периоду, прогресс/рейтинги, привязка навыков и загрузка сертификатов.
- Добавлен раздел портфолио `/career/portfolio` с карточками, фильтрами, модалкой создания/редактирования и детальной страницей (`/career/portfolio/:projectId`).
- Добавлен раздел собеседований `/career/interviews` — фильтры/таблица, статистика, экспорт, CRUD, подробные сведения и копирование контактов.
- `/api/career/dashboard` теперь собирает метрики, радары и последнюю активность с кэшированием (5 минут) и возвращает структуру `{ metrics, skills_radar, courses_status, recent_activity }`.
- Добавлен раздел «База знаний» `/career/knowledge` с фильтрами, таблицей, шаблонами популярных технологий и карточкой CRUD/детали.
- `/api/career/courses/:id/certificate` теперь поддерживает загрузку файлов (PDF/JPG/PNG до 10 МБ) в S3 и сохраняет `certificate_file`/`certificate_url`.
- Добавлена генерация PDF-резюме `/api/career/portfolio/export` и UI `/career/portfolio/export` для выбора проектов и заполнения профиля.
- Добавлена визуализация `/career/portfolio/timeline`, которая использует `/api/career/portfolio/timeline` и рисует временную шкалу проектов с разделением по статусам.
- Добавлена расширенная аналитика `/career/analytics` с KPI, секциями по навыкам, курсам, проектам и собеседованиям, подпитываемая `/api/career/analytics`.
- Таблица `courses` теперь хранит `progress_percent` (0–100) для отображения прогресса во время `in_progress`.
- Новый бекенд: `/api/career/dashboard` выдаёт метрики/графики, `/api/career/dashboard/activity` — последние изменения.
- Все операции логируют ошибки в консоль и используют `authRequired` из `backend/middleware/auth.js`.
- Дата внедрения: 2025-11-18.
