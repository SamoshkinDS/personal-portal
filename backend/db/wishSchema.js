import { pool } from "./connect.js";

const PRIORITIES = ["низкий", "средний", "высокий"];
const ARCHIVE_REASONS = ["Куплено", "Не актуально"];

export async function ensureWishSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wish_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      price NUMERIC(12,2),
      priority VARCHAR(16) NOT NULL DEFAULT 'средний',
      link TEXT,
      description TEXT,
      target_date DATE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      archived_at TIMESTAMPTZ,
      archive_reason VARCHAR(32),
      image_url TEXT,
      image_key TEXT,
      CHECK (priority IN ('низкий','средний','высокий')),
      CHECK (archive_reason IS NULL OR archive_reason IN ('Куплено','Не актуально'))
    );
    CREATE INDEX IF NOT EXISTS wish_items_user_idx ON wish_items(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS wish_items_archived_idx ON wish_items(user_id, archived_at NULLS FIRST);
    CREATE INDEX IF NOT EXISTS wish_items_priority_idx ON wish_items(user_id, priority);
    CREATE INDEX IF NOT EXISTS wish_items_target_date_idx ON wish_items(user_id, target_date DESC NULLS LAST);
  `);

  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'wish_items_set_updated_at') THEN
        CREATE TRIGGER wish_items_set_updated_at
        BEFORE UPDATE ON wish_items
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END $$;
  `);
}

export function normalizePriority(value) {
  const val = String(value || "").toLowerCase();
  const match = PRIORITIES.find((p) => p.toLowerCase() === val);
  return match || "средний";
}

export function normalizeArchiveReason(value) {
  const val = String(value || "").toLowerCase();
  const match = ARCHIVE_REASONS.find((r) => r.toLowerCase() === val);
  return match || null;
}
