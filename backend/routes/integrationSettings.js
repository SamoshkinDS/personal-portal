import express from "express";
import { pool } from "../db/connect.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

const VALID_KEYS = new Set([
  "webhook_interview",
  "webhook_tests",
  "webhook_promptmaster",
  "webhook_articles_queue",
  "api_key_n8n",
  "api_log_requests",
]);

router.use(authRequired);

router.get("/settings", async (_req, res) => {
  try {
    const rows = await pool.query("SELECT key, value FROM settings");
    const payload = {};
    rows.rows.forEach((row) => {
      if (VALID_KEYS.has(row.key)) {
        payload[row.key] = row.value;
      }
    });
    return res.json({ settings: payload });
  } catch (err) {
    console.error("GET /api/integration/settings", err);
    return res.status(500).json({ message: "Не удалось загрузить настройки интеграций" });
  }
});

router.patch("/settings", async (req, res) => {
  try {
    const data = req.body || {};
    const entries = Object.entries(data).filter(([key]) => VALID_KEYS.has(key));
    if (!entries.length) {
      return res.status(400).json({ message: "Нет допустимых ключей" });
    }
    const promises = entries.map(([key, value]) =>
      pool.query(
        `
        INSERT INTO settings (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `,
        [key, value ?? null]
      )
    );
    await Promise.all(promises);
    const rows = await pool.query("SELECT key, value FROM settings WHERE key = ANY($1)", [
      entries.map(([key]) => key),
    ]);
    const payload = {};
    rows.rows.forEach((row) => {
      payload[row.key] = row.value;
    });
    return res.json({ settings: payload });
  } catch (err) {
    console.error("PATCH /api/integration/settings", err);
    return res.status(500).json({ message: "Не удалось сохранить настройки" });
  }
});

export default router;
