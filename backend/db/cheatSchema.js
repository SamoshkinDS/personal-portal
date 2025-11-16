import { pool } from "./connect.js";

export async function ensureCheatSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cheat_articles (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_cheat_articles_title ON cheat_articles(lower(title));`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_cheat_articles_updated_at ON cheat_articles(updated_at);`);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'cheat_articles_set_updated_at') THEN
        CREATE TRIGGER cheat_articles_set_updated_at
        BEFORE UPDATE ON cheat_articles
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END$$;
  `);
}
