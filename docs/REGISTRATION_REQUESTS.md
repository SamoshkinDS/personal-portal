name: Регистрация через заявки
description: Поток регистрации с подтверждением администратором и управлением заявками в админке.

- Добавлена таблица `registration_requests` (login, password_hash, status pending/approved/rejected, created_at/updated_at).
- POST `/api/auth/register` создаёт заявку после валидации логина/пароля; при успехе сообщение «Заявка отправлена. После подтверждения вы сможете войти.»
- POST `/api/auth/login`: если есть заявка pending → «Ваша заявка ещё не подтверждена.», rejected → «Заявка отклонена.».
- Админ-роуты: GET `/api/admin/registration-requests`, POST `/api/admin/registration-requests/:id/approve|reject` (с логированием в admin_logs).
- Админ UI `/admin/users`: табы «Пользователи / Заявки», таблица заявок с кнопками «✔ Подтвердить» (создаёт пользователя) и «✖ Отклонить» (через модал).
