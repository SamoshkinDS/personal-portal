name: Укрепление безопасности портала (ноябрь 2025)
description: Закрытие публичных поверхностей, усиление прав доступа и защита от XSS/брутфорса.

- API analytics и статьи требуют `view_analytics`; сторонний токен допускается только для processing‑фида очереди.
- VPN/VLESS API доступны только при `view_vpn` или флаге `vpn_can_create`; роль NON_ADMIN без прав больше не проходит.
- JWT‑секрет обязателен (module `lib/jwt.js`), убран дефолтный ключ; rate-limit на login/register/exists/reset, сброс пароля только по токену с вводом текущего пароля.
- Публичный сброс пароля убран, смена пароля перенесена в защищённый раздел настроек.
- `/api/integration/settings` закрыт правом `admin_access`; HTML в analytics статьях/очереди очищается через sanitize-html.
- backend/.env дополнен примером `JWT_SECRET` для dev; добавлен middleware rateLimit.
- Дата: 22.11.2025.
