import express from "express";
import { authRequired } from "../middleware/auth.js";
import { pool } from "../db/connect.js";

const router = express.Router();

router.use(authRequired);

function normalizeParentId(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num;
}

async function ensureParentOwnership(userId, parentId) {
  if (parentId === null) return true;
  const check = await pool.query(
    "SELECT id FROM user_todos WHERE user_id = $1 AND id = $2",
    [userId, parentId]
  );
  return check.rows.length > 0;
}

async function nextPosition(userId, parentId, client = pool) {
  const q = await client.query(
    `SELECT COALESCE(MAX(position), -1) + 1 AS pos
     FROM user_todos
     WHERE user_id = $1 AND COALESCE(parent_id, 0) = COALESCE($2, 0)`,
    [userId, parentId]
  );
  return Number(q.rows[0]?.pos || 0);
}

// GET /api/todos
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const q = await pool.query(
      `SELECT id, text, done, parent_id, position, created_at
       FROM user_todos
       WHERE user_id = $1
       ORDER BY COALESCE(parent_id, 0), position ASC, created_at ASC`,
      [userId]
    );
    return res.json({ todos: q.rows });
  } catch (e) {
    console.error("GET /todos", e);
    return res.status(500).json({ message: "Failed to load todos" });
  }
});

// POST /api/todos
router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { text = "", done = false, parentId: rawParentId = null, position } = req.body || {};
    const trimmed = String(text).trim();
    if (!trimmed) return res.status(400).json({ message: "text is required" });

    const parentId = normalizeParentId(rawParentId);
    if (!(await ensureParentOwnership(userId, parentId))) {
      return res.status(400).json({ message: "Invalid parentId" });
    }

    await client.query("BEGIN");
    let finalPosition = Number(position);
    if (!Number.isFinite(finalPosition)) {
      finalPosition = await nextPosition(userId, parentId, client);
    }

    const ins = await client.query(
      `INSERT INTO user_todos (user_id, text, done, parent_id, position)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, text, done, parent_id, position, created_at`,
      [userId, trimmed, !!done, parentId, finalPosition]
    );
    await client.query("COMMIT");
    return res.status(201).json({ todo: ins.rows[0] });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("POST /todos", e);
    return res.status(500).json({ message: "Failed to create todo" });
  } finally {
    client.release();
  }
});

// PATCH /api/todos/:id
router.patch("/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

    const { text, done, parentId: rawParentId, position } = req.body || {};

    const fields = [];
    const values = [];
    let idx = 1;

    if (typeof text === "string") {
      fields.push(`text = $${idx++}`);
      values.push(text.trim());
    }
    if (typeof done === "boolean") {
      fields.push(`done = $${idx++}`);
      values.push(done);
    }
    if (rawParentId !== undefined) {
      const parentIdValue = normalizeParentId(rawParentId);
      if (parentIdValue === id) {
        return res.status(400).json({ message: "parentId cannot reference the same todo" });
      }
      if (!(await ensureParentOwnership(userId, parentIdValue))) {
        return res.status(400).json({ message: "Invalid parentId" });
      }
      fields.push(`parent_id = $${idx++}`);
      values.push(parentIdValue);
    }
    if (position !== undefined) {
      const pos = Number(position);
      if (!Number.isFinite(pos)) return res.status(400).json({ message: "position must be numeric" });
      fields.push(`position = $${idx++}`);
      values.push(pos);
    }

    if (fields.length === 0) return res.status(400).json({ message: "Nothing to update" });
    fields.push(`updated_at = NOW()`);

    values.push(userId);
    values.push(id);
    const sql = `UPDATE user_todos SET ${fields.join(", ")} WHERE user_id = $${idx++} AND id = $${idx} RETURNING id, text, done, parent_id, position, created_at`;
    const q = await client.query(sql, values);
    if (q.rows.length === 0) return res.status(404).json({ message: "Todo not found" });
    return res.json({ todo: q.rows[0] });
  } catch (e) {
    console.error("PATCH /todos/:id", e);
    return res.status(500).json({ message: "Failed to update todo" });
  } finally {
    client.release();
  }
});

// DELETE /api/todos/:id
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
    await pool.query("DELETE FROM user_todos WHERE user_id = $1 AND id = $2", [userId, id]);
    return res.json({ message: "Deleted" });
  } catch (e) {
    console.error("DELETE /todos/:id", e);
    return res.status(500).json({ message: "Failed to delete todo" });
  }
});

export default router;
