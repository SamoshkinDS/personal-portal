CREATE TABLE IF NOT EXISTS vless_keys (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL,
  name TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  stats_json JSONB DEFAULT '{}'::jsonb
);
