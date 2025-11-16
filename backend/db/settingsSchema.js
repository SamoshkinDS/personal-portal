import { pool } from "./connect.js";

export async function ensureSettingsSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);`);
}
