import express from "express";
import { authRequired } from "../middleware/auth.js";
import { pool } from "../db/connect.js";

const router = express.Router();

// Public endpoint so the client can always fetch the configured VAPID key
router.get("/public-key", (req, res) => {
  const publicKey = (process.env.WEB_PUSH_PUBLIC_KEY || "").trim();
  if (!publicKey) {
    return res.status(404).json({ message: "Push notifications are not configured" });
  }
  return res.json({ publicKey });
});

router.use(authRequired);

// Get notifications. For now, proxy admin logs as notifications.
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(500, Number(req.query.limit) || 100);
    const q = await pool.query(
      "SELECT id, created_at, message FROM admin_logs ORDER BY created_at DESC LIMIT $1",
      [limit]
    );
    const items = q.rows.map((r) => ({
      id: r.id,
      type: "log",
      title: "Событие системы",
      body: r.message,
      created_at: r.created_at,
    }));
    return res.json({ notifications: items });
  } catch (e) {
    console.error("GET /api/notifications", e);
    return res.status(500).json({ message: "Failed to load notifications" });
  }
});

// Store push subscription for current user
router.post("/subscribe", async (req, res) => {
  try {
    const userId = req.user.id;
    const sub = req.body || {};
    const endpoint = sub?.endpoint;
    if (!endpoint) return res.status(400).json({ message: "Invalid subscription" });
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, data)
       VALUES ($1, $2, $3)
       ON CONFLICT (endpoint)
       DO UPDATE SET user_id = EXCLUDED.user_id, data = EXCLUDED.data, updated_at = NOW()`,
      [userId, String(endpoint), JSON.stringify(sub)]
    );
    return res.status(201).json({ message: "Subscribed" });
  } catch (e) {
    console.error("POST /api/notifications/subscribe", e);
    return res.status(500).json({ message: "Failed to subscribe" });
  }
});

export default router;
