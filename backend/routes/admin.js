import express from "express";
import { authRequired, requireRole, requirePermission } from "../middleware/auth.js";
import { pool } from "../db/connect.js";
import { sendPushToAll } from "../utils/push.js";

const router = express.Router();

// Admin-only routes via permission
router.use(authRequired, requirePermission("admin_access"));

router.get("/users", async (req, res) => {
  try {
    const q = await pool.query(`
      SELECT u.id, u.username, u.created_at, u.last_login, u.role, u.is_blocked, u.vpn_can_create,
             p.name, p.email, p.phone
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      ORDER BY u.created_at DESC
    `);
    return res.json({ users: q.rows });
  } catch (e) {
    console.error("/admin/users", e);
    return res.status(500).json({ message: "Failed to list users" });
  }
});

router.patch("/users/:id/block", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { isBlocked } = req.body || {};
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
    await pool.query("UPDATE users SET is_blocked = $1 WHERE id = $2", [!!isBlocked, id]);
    return res.json({ message: "Updated" });
  } catch (e) {
    console.error("/admin/users/:id/block", e);
    return res.status(500).json({ message: "Failed to update block status" });
  }
});

router.patch("/users/:id/role", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { role, vpnCanCreate } = req.body || {};
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
    const allowed = ["ALL", "NON_ADMIN", "ANALYTICS", "NEURAL", "VPN"];
    if (!allowed.includes(role)) return res.status(400).json({ message: "Invalid role" });
    await pool.query(
      "UPDATE users SET role = $1, vpn_can_create = $2 WHERE id = $3",
      [role, !!vpnCanCreate, id]
    );
    return res.json({ message: "Updated" });
  } catch (e) {
    console.error("/admin/users/:id/role", e);
    return res.status(500).json({ message: "Failed to update role" });
  }
});

// Content management
router.get("/content", async (req, res) => {
  try {
    const { type } = req.query || {};
    let q;
    if (type) {
      q = await pool.query(
        "SELECT id, type, title, description, url, created_at FROM content_items WHERE type = $1 ORDER BY created_at DESC",
        [String(type)]
      );
    } else {
      q = await pool.query(
        "SELECT id, type, title, description, url, created_at FROM content_items ORDER BY created_at DESC"
      );
    }
    return res.json({ items: q.rows });
  } catch (e) {
    console.error("GET /admin/content", e);
    return res.status(500).json({ message: "Failed to load content" });
  }
});

router.post("/content", async (req, res) => {
  try {
    const { type, title, description = "", url = "" } = req.body || {};
    if (!type || !title) return res.status(400).json({ message: "type and title are required" });
    const ins = await pool.query(
      "INSERT INTO content_items (type, title, description, url) VALUES ($1, $2, $3, $4) RETURNING id, type, title, description, url, created_at",
      [String(type), String(title), String(description), String(url)]
    );
    return res.status(201).json({ item: ins.rows[0] });
  } catch (e) {
    console.error("POST /admin/content", e);
    return res.status(500).json({ message: "Failed to create content" });
  }
});

router.put("/content/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, description = "", url = "" } = req.body || {};
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
    await pool.query(
      "UPDATE content_items SET title = $1, description = $2, url = $3 WHERE id = $4",
      [String(title || ""), String(description), String(url), id]
    );
    return res.json({ message: "Updated" });
  } catch (e) {
    console.error("PUT /admin/content/:id", e);
    return res.status(500).json({ message: "Failed to update content" });
  }
});

router.delete("/content/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
    await pool.query("DELETE FROM content_items WHERE id = $1", [id]);
    return res.json({ message: "Deleted" });
  } catch (e) {
    console.error("DELETE /admin/content/:id", e);
    return res.status(500).json({ message: "Failed to delete content" });
  }
});

// Logs
router.get("/logs", async (req, res) => {
  try {
    const q = await pool.query(
      "SELECT id, created_at, message FROM admin_logs ORDER BY created_at DESC LIMIT 500"
    );
    return res.json({ logs: q.rows });
  } catch (e) {
    console.error("GET /admin/logs", e);
    return res.status(500).json({ message: "Failed to load logs" });
  }
});

router.post("/logs", async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ message: "message is required" });
    const s = await pool.query("INSERT INTO admin_logs (message) VALUES ($1) RETURNING id, created_at", [String(message)]);
    // Fire-and-forget push notification (if VAPID configured)
    sendPushToAll('Журнал событий', String(message), '/admin/logs').catch(() => {});
    return res.status(201).json({ message: "Created", id: s.rows[0].id, created_at: s.rows[0].created_at });
  } catch (e) {
    console.error("POST /admin/logs", e);
    return res.status(500).json({ message: "Failed to create log" });
  }
});

// Registration requests
const logAdminAction = async (message) => {
  try {
    await pool.query("INSERT INTO admin_logs (message) VALUES ($1)", [message]);
  } catch (e) {
    console.error("logAdminAction error", e);
  }
};

router.get("/registration-requests", async (req, res) => {
  try {
    const q = await pool.query(
      "SELECT id, login, status, created_at, updated_at FROM registration_requests ORDER BY created_at DESC"
    );
    return res.json({ requests: q.rows });
  } catch (e) {
    console.error("GET /admin/registration-requests", e);
    return res.status(500).json({ message: "Failed to load requests" });
  }
});

router.post("/registration-requests/:id/reject", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
    const q = await pool.query("SELECT id, login, status FROM registration_requests WHERE id = $1", [id]);
    if (!q.rows.length) return res.status(404).json({ message: "Request not found" });
    const reqRow = q.rows[0];
    if (reqRow.status === "rejected") return res.json({ message: "Уже отклонено" });
    await pool.query("UPDATE registration_requests SET status = 'rejected', updated_at = NOW() WHERE id = $1", [id]);
    await logAdminAction(`Заявка ${reqRow.login} отклонена админом ${req.user?.username || "unknown"}`);
    return res.json({ message: "Отклонено" });
  } catch (e) {
    console.error("POST /admin/registration-requests/:id/reject", e);
    return res.status(500).json({ message: "Failed to reject" });
  }
});

router.post("/registration-requests/:id/approve", async (req, res) => {
  const client = await pool.connect();
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      client.release();
      return res.status(400).json({ message: "Invalid id" });
    }
    await client.query("BEGIN");
    const q = await client.query("SELECT id, login, password_hash, status FROM registration_requests WHERE id = $1 FOR UPDATE", [id]);
    if (!q.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Request not found" });
    }
    const reqRow = q.rows[0];
    if (reqRow.status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Request is not pending" });
    }
    const existingUser = await client.query("SELECT id FROM users WHERE username = $1", [reqRow.login]);
    if (existingUser.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "User with this login already exists" });
    }
    const insUser = await client.query(
      "INSERT INTO users (username, password_hash, role, is_blocked, vpn_can_create) VALUES ($1, $2, $3, false, false) RETURNING id",
      [reqRow.login, reqRow.password_hash, "NON_ADMIN"]
    );
    const newUserId = insUser.rows[0].id;
    await client.query("UPDATE registration_requests SET status = 'approved', updated_at = NOW() WHERE id = $1", [id]);
    await client.query("COMMIT");
    await logAdminAction(`Заявка ${reqRow.login} одобрена админом ${req.user?.username || "unknown"}`);
    return res.json({ message: "Одобрено", userId: newUserId });
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error("POST /admin/registration-requests/:id/approve", e);
    return res.status(500).json({ message: "Failed to approve" });
  } finally {
    client.release();
  }
});

// Permissions management
router.get("/permissions", async (req, res) => {
  try {
    const q = await pool.query("SELECT key, description FROM permissions ORDER BY key");
    return res.json({ permissions: q.rows });
  } catch (e) {
    console.error("GET /admin/permissions", e);
    return res.status(500).json({ message: "Failed to list permissions" });
  }
});

router.get("/users/:id/permissions", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
    const q = await pool.query("SELECT perm_key FROM user_permissions WHERE user_id = $1 ORDER BY perm_key", [id]);
    return res.json({ permissions: q.rows.map((r) => r.perm_key) });
  } catch (e) {
    console.error("GET /admin/users/:id/permissions", e);
    return res.status(500).json({ message: "Failed to load permissions" });
  }
});

router.put("/users/:id/permissions", async (req, res) => {
  const client = await pool.connect();
  try {
    const id = Number(req.params.id);
    const { permissions = [] } = req.body || {};
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
    await client.query("BEGIN");
    await client.query("DELETE FROM user_permissions WHERE user_id = $1", [id]);
    for (const key of permissions) {
      if (typeof key !== "string" || !key) continue;
      await client.query("INSERT INTO user_permissions (user_id, perm_key) VALUES ($1, $2) ON CONFLICT DO NOTHING", [id, key]);
    }
    await client.query("COMMIT");
    return res.json({ message: "Permissions updated" });
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error("PUT /admin/users/:id/permissions", e);
    return res.status(500).json({ message: "Failed to update permissions" });
  } finally {
    client.release();
  }
});

export default router;
