import { pool } from "./connect.js";

const WORKSPACE_TRIGGER = "workspace_settings_set_updated_at";

async function ensureWorkspaceTrigger() {
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = '${WORKSPACE_TRIGGER}') THEN
        CREATE TRIGGER ${WORKSPACE_TRIGGER}
        BEFORE UPDATE ON workspace_settings
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END$$;
  `);
}

export async function ensureWorkspaceSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS workspace_settings (
      id SERIAL PRIMARY KEY,
      enabled_widgets TEXT[] DEFAULT ARRAY[]::TEXT[],
      auto_task_lead_days SMALLINT NOT NULL DEFAULT 3,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await ensureWorkspaceTrigger();

  await pool.query(`
    INSERT INTO workspace_settings (id, enabled_widgets, auto_task_lead_days)
    SELECT 1, ARRAY['meter_deadline','upcoming_payments'], 3
    WHERE NOT EXISTS (SELECT 1 FROM workspace_settings);
  `);
}
