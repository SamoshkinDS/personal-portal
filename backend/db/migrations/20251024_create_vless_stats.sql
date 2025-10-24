CREATE TABLE IF NOT EXISTS vless_stats (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  uplink BIGINT DEFAULT 0,
  downlink BIGINT DEFAULT 0,
  total BIGINT GENERATED ALWAYS AS (uplink + downlink) STORED,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vless_stats_email_created_at
  ON vless_stats(email, created_at DESC);
