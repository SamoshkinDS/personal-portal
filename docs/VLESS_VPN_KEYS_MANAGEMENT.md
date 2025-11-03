name: Управление ключами VLESS
description: Генерация, выдача и ротация ключей доступа для VPN.

## VLESS Keys & Xray Stats

**Purpose:** provide a unified flow for provisioning VLESS keys, exposing metrics from Xray gRPC, and surfacing historical traffic charts inside the VPN dashboard.

### Backend
- Router `backend/routes/vless.js` covers:
  - `GET /api/vless/keys` — list stored keys with synthesized config URLs.
  - `POST /api/vless/keys` — create a key with a generated UUID.
  - `PATCH /api/vless/keys/:id` — rename/update comment.
  - `DELETE /api/vless/keys/:id` — remove a key.
  - `GET /api/vless/stats/:scope?` — live uplink/downlink via Xray gRPC. `aggregate` (or empty scope) returns inbound totals; any other scope is treated as a user email (admin only).
  - `POST /api/vless/sync` — pull stats for every email found in the Xray config and persist deltas > 1 MB (admin only).
  - `GET /api/vless/stats/history/:scope?` — 7/30 day history; `aggregate` sums totals across all stored emails.
- Service `backend/services/xray.js` bootstraps a gRPC client (`@grpc/grpc-js` + `@grpc/proto-loader`), reads Xray config (`/usr/local/etc/xray/config.json` by default) and syncs uplink/downlink counters into PostgreSQL.
- Configuration knobs:
  - `XRAY_API_HOST`, `XRAY_API_PORT`, `XRAY_API_EMAIL_FIELD` — upstream endpoint and optional default email.
  - `XRAY_INBOUND_TAG` — inbound tag used when aggregating traffic (defaults to `vless-in`).
  - `XRAY_CONFIG_PATH` — optional override for the Xray JSON config.
  - `XRAY_CRON_DISABLED=true` — disables the 5-minute cron sync (enabled by default).
- Database schema:
  ```sql
  CREATE TABLE IF NOT EXISTS vless_keys (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL,
    name TEXT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    stats_json JSONB DEFAULT '{}'::jsonb
  );

  CREATE TABLE IF NOT EXISTS vless_stats (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    uplink BIGINT DEFAULT 0,
    downlink BIGINT DEFAULT 0,
    total BIGINT GENERATED ALWAYS AS (uplink + downlink) STORED,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
  Records append only when the uplink/downlink delta exceeds 1 MB.

### Frontend
- Hook `src/hooks/useVlessKeys.js` wraps authenticated CRUD operations.
- Page `src/pages/vpn/Vless.jsx` includes:
  - Header with shortcut to the setup guide.
  - Admin-only “VLESS Traffic” card showing aggregate totals, manual sync, 7/30 day toggle, and a Recharts area chart.
  - Create/edit/delete flow for keys plus clipboard helpers.
- When the sync job runs, it attempts to map e-mail statistics back onto keys whose `name` or `comment` matches the e-mail (case-insensitive) and stores the latest counters in `vless_keys.stats_json` so the table shows per-user usage.
- Guides:
  - `src/pages/vpn/VlessGuide.jsx` — client installation walkthrough with screenshots.
  - `src/pages/vpn/RoutesGuide.jsx` — selective proxy routing setup.
  - `/vpn` landing (`src/pages/vpn/Index.jsx`) links to both guides.

### Environment checklist
```env
XRAY_API_HOST=127.0.0.1
XRAY_API_PORT=10085
XRAY_API_EMAIL_FIELD=main@vpn
XRAY_INBOUND_TAG=vless-in
XRAY_CONFIG_PATH=/usr/local/etc/xray/config.json
XRAY_CRON_DISABLED=false
VLESS_DOMAIN=vpn.example.com
VLESS_PORT=4443
VLESS_TEMPLATE=vless://${UUID}@${VLESS_DOMAIN}:${VLESS_PORT}?security=tls&allowInsecure=0&encryption=none&type=ws&host=${VLESS_DOMAIN}&path=/ws&sni=${VLESS_DOMAIN}&fp=chrome
```
Adjust the template or override per environment as needed.

### Operations
- Run `npm install` in the project root and `backend/` to refresh `react-icons`, `@grpc/grpc-js`, `@grpc/proto-loader`, and `node-cron`.
- Ensure the Xray config specifies `email` for each client so the sync job can map stats.
- Trigger manual sync via `POST /api/vless/sync` or the “Sync now” button to snapshot traffic immediately.
- Aggregate chart data is pulled from `vless_stats`; defaults to 7 days with optional `?range=30` query.
