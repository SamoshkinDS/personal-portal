import { pool } from "./connect.js";

const DEFAULT_PERMISSIONS = { view: true, edit: false, create: false, delete: false };

export async function ensureSharedLinksSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shared_links (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      page_type VARCHAR(64) NOT NULL,
      permissions JSONB NOT NULL DEFAULT '${JSON.stringify(DEFAULT_PERMISSIONS)}',
      token TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      revoked BOOLEAN NOT NULL DEFAULT FALSE,
      opened_at TIMESTAMPTZ,
      views_count INTEGER NOT NULL DEFAULT 0,
      CHECK (page_type IN ('wish-list')),
      CHECK (jsonb_typeof(permissions) = 'object')
    );
    CREATE INDEX IF NOT EXISTS shared_links_owner_idx ON shared_links(owner_id);
    CREATE INDEX IF NOT EXISTS shared_links_token_idx ON shared_links(token);
    CREATE INDEX IF NOT EXISTS shared_links_expires_idx ON shared_links(expires_at);
    CREATE INDEX IF NOT EXISTS shared_links_page_idx ON shared_links(page_type);
  `);
}
