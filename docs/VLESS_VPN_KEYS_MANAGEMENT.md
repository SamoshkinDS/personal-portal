## VLESS Keys & Xray Stats

**Purpose:** provide a unified flow for provisioning VLESS keys, exposing metrics from Xray gRPC, and surfacing historical traffic charts inside the VPN dashboard.

### Backend
- Router ackend/routes/vless.js now covers:
  - GET /api/vless/keys – list stored keys with synthesized config URLs.
  - POST /api/vless/keys – create a key with a generated UUID.
  - PATCH /api/vless/keys/:id – rename/update comment.
  - DELETE /api/vless/keys/:id – remove a key.
  - GET /api/vless/stats/:email – fetch live uplink/downlink via Xray gRPC (admin only).
  - POST /api/vless/sync – pull stats for every email from the Xray config and persist deltas > 1 MB.
  - GET /api/vless/stats/history/:email – return the last 7/30 days of stored samples.
- Service ackend/services/xray.js bootstraps a gRPC client (@grpc/grpc-js + @grpc/proto-loader), reads Xray config (/usr/local/etc/xray/config.json by default) and syncs into PostgreSQL.
- New helpers & configuration:
  - XRAY_API_HOST, XRAY_API_PORT, XRAY_API_EMAIL_FIELD – endpoint + default email.
  - XRAY_CONFIG_PATH (optional) – override Xray config path.
  - Cron (node-cron) runs every 5 minutes unless XRAY_CRON_DISABLED=true.
- Database:
  `sql
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
  `
  Records only append when the uplink/downlink delta exceeds 1 MB.

### Frontend
- Hook src/hooks/useVlessKeys.js wraps authenticated REST calls for CRUD operations.
- Page src/pages/vpn/Vless.jsx combines:
  - Header with quick link to the setup guide.
  - Admin-only "VLESS Traffic" card (summary, sync button, 7/30 day toggle, Recharts area chart).
  - Create/edit/delete flow for keys, clipboard helpers, inline validation.
- Guides:
  - src/pages/vpn/VlessGuide.jsx – step-by-step client installation + screenshots.
  - src/pages/vpn/RoutesGuide.jsx – selective proxy routing walkthrough.
  - /vpn landing (src/pages/vpn/Index.jsx) links to the new guide.

### Environment Checklist
`env
XRAY_API_HOST=127.0.0.1
XRAY_API_PORT=10085
XRAY_API_EMAIL_FIELD=main@vpn
XRAY_CONFIG_PATH=/usr/local/etc/xray/config.json
XRAY_CRON_DISABLED=false
VLESS_DOMAIN=vpn.example.com
VLESS_PORT=4443
VLESS_TEMPLATE=vless://@:?security=tls&allowInsecure=0&encryption=none&type=ws&host=&path=/ws&sni=&fp=chrome
`
Adjust the template or override per environment as needed.

### Operations
- Run 
pm install in the root workspace and /backend to install eact-icons, @grpc/grpc-js, @grpc/proto-loader, and 
ode-cron updates.
- Ensure the Xray config specifies email for each client; the sync job maps those emails to stats.
- Trigger manual sync via POST /api/vless/sync or the "Sync now" button to snapshot traffic immediately.
- Graf-like chart data is pulled from less_stats; defaults to 7 days with optional ?range=30 query.
