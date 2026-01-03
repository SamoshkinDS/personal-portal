import { pool } from "./connect.js";

export async function ensureVpnSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vpn_saved_links (
      user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      link TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}
