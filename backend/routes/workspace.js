import express from "express";
import { pool } from "../db/connect.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();
router.use(authRequired);

const AVAILABLE_WIDGETS = new Set(["meter_deadline", "upcoming_payments"]);

async function ensureWorkspaceSettings() {
  const existing = await pool.query("SELECT * FROM workspace_settings ORDER BY id ASC LIMIT 1");
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }
  const inserted = await pool.query(
    "INSERT INTO workspace_settings (enabled_widgets, auto_task_lead_days) VALUES ($1, $2) RETURNING *",
    [["meter_deadline", "upcoming_payments"], 3]
  );
  return inserted.rows[0];
}

function mapSettings(row) {
  return {
    enabled_widgets: Array.isArray(row?.enabled_widgets) ? row.enabled_widgets : [],
    auto_task_lead_days: row?.auto_task_lead_days ?? 3,
  };
}

router.get("/settings", async (_req, res) => {
  try {
    const settings = await ensureWorkspaceSettings();
    return res.json({ success: true, data: { settings: mapSettings(settings) } });
  } catch (err) {
    console.error("GET /api/workspace/settings", err);
    return res.status(500).json({ success: false, error: "Не удалось загрузить настройки Workspace" });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const current = await ensureWorkspaceSettings();
    const payload = req.body || {};

    let enabledWidgets = current.enabled_widgets || [];
    if (payload.enabled_widgets) {
      const incoming = Array.isArray(payload.enabled_widgets) ? payload.enabled_widgets : [];
      enabledWidgets = incoming
        .map((id) => String(id || "").trim())
        .filter((id) => AVAILABLE_WIDGETS.has(id));
      if (!enabledWidgets.length) {
        enabledWidgets = current.enabled_widgets || [];
      }
    }

    let autoTaskLeadDays = current.auto_task_lead_days ?? 3;
    if (payload.auto_task_lead_days !== undefined) {
      const parsed = Number(payload.auto_task_lead_days);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 14) {
        return res.status(400).json({ success: false, error: "Количество дней должно быть от 1 до 14" });
      }
      autoTaskLeadDays = parsed;
    }

    const updated = await pool.query(
      `
      UPDATE workspace_settings
      SET enabled_widgets = $1,
          auto_task_lead_days = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `,
      [enabledWidgets, autoTaskLeadDays, current.id]
    );

    return res.json({ success: true, data: { settings: mapSettings(updated.rows[0]) } });
  } catch (err) {
    console.error("PUT /api/workspace/settings", err);
    return res.status(500).json({ success: false, error: "Не удалось сохранить настройки Workspace" });
  }
});

export default router;
