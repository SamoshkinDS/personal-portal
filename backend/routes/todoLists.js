import express from "express";
import { authRequired } from "../middleware/auth.js";
import { pool } from "../db/connect.js";

const router = express.Router();

router.use(authRequired);

async function ensureDefaultList(userId, client = pool) {
  const lists = await client.query(
    `SELECT id, title, position, created_at
     FROM user_todo_lists
     WHERE user_id = $1
     ORDER BY position ASC, created_at ASC`,
    [userId]
  );
  if (lists.rows.length > 0) {
    return lists.rows;
  }
  const inserted = await client.query(
    `INSERT INTO user_todo_lists (user_id, title, position)
     VALUES ($1, $2, 0)
     RETURNING id, title, position, created_at`,
    [userId, "ToDo"]
  );
  return inserted.rows;
}

async function nextListPosition(userId, client = pool) {
  const q = await client.query(
    `SELECT COALESCE(MAX(position), -1) + 1 AS pos
     FROM user_todo_lists WHERE user_id = $1`,
    [userId]
  );
  return Number(q.rows[0]?.pos || 0);
}

async function normalizeListPositions(userId, client = pool) {
  const q = await client.query(
    `SELECT id
     FROM user_todo_lists
     WHERE user_id = $1
     ORDER BY position ASC, created_at ASC, id ASC`,
    [userId]
  );
  for (let i = 0; i < q.rows.length; i += 1) {
    const listId = q.rows[i].id;
    await client.query(`UPDATE user_todo_lists SET position = $1 WHERE id = $2`, [i, listId]);
  }
}

router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    let lists = await ensureDefaultList(userId);
    lists = lists.sort((a, b) => a.position - b.position);
    return res.json({ lists });
  } catch (error) {
    console.error("GET /todo-lists", error);
    return res.status(500).json({ message: "Failed to load lists" });
  }
});

router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const title = String(req.body?.title || "").trim();
    const position = req.body?.position;
    if (!title) return res.status(400).json({ message: "title is required" });

    await client.query("BEGIN");
    let finalPosition = Number(position);
    if (!Number.isFinite(finalPosition)) {
      finalPosition = await nextListPosition(userId, client);
    }
    const inserted = await client.query(
      `INSERT INTO user_todo_lists (user_id, title, position)
       VALUES ($1, $2, $3)
       RETURNING id, title, position, created_at`,
      [userId, title, finalPosition]
    );
    await normalizeListPositions(userId, client);
    await client.query("COMMIT");
    return res.status(201).json({ list: inserted.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /todo-lists", error);
    return res.status(500).json({ message: "Failed to create list" });
  } finally {
    client.release();
  }
});

router.patch("/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

    const { title, position } = req.body || {};
    if (title === undefined && position === undefined) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    await client.query("BEGIN");
    const existing = await client.query(
      `SELECT id FROM user_todo_lists WHERE user_id = $1 AND id = $2`,
      [userId, id]
    );
    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "List not found" });
    }

    const fields = [];
    const values = [];
    let idx = 1;
    if (typeof title === "string") {
      const trimmed = title.trim();
      if (!trimmed) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "title cannot be empty" });
      }
      fields.push(`title = $${idx++}`);
      values.push(trimmed);
    }
    if (position !== undefined) {
      const pos = Number(position);
      if (!Number.isFinite(pos)) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "position must be numeric" });
      }
      fields.push(`position = $${idx++}`);
      values.push(pos);
    }
    if (fields.length > 0) {
      const sql = `UPDATE user_todo_lists SET ${fields.join(", ")}, updated_at = NOW()
                   WHERE user_id = $${idx++} AND id = $${idx}
                   RETURNING id, title, position, created_at`;
      values.push(userId, id);
      const updated = await client.query(sql, values);
      await normalizeListPositions(userId, client);
      await client.query("COMMIT");
      return res.json({ list: updated.rows[0] });
    }
    await client.query("ROLLBACK");
    return res.status(400).json({ message: "Nothing to update" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("PATCH /todo-lists/:id", error);
    return res.status(500).json({ message: "Failed to update list" });
  } finally {
    client.release();
  }
});

router.delete("/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

    await client.query("BEGIN");
    const lists = await client.query(
      `SELECT id FROM user_todo_lists WHERE user_id = $1 ORDER BY position ASC, created_at ASC`,
      [userId]
    );
    if (lists.rows.length <= 1) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Cannot delete the last list" });
    }
    if (!lists.rows.some((row) => row.id === id)) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "List not found" });
    }
    const fallback = lists.rows.find((row) => row.id !== id);
    await client.query(
      `UPDATE user_todos SET list_id = $1 WHERE user_id = $2 AND list_id = $3`,
      [fallback.id, userId, id]
    );
    await client.query(`DELETE FROM user_todo_lists WHERE user_id = $1 AND id = $2`, [userId, id]);
    await normalizeListPositions(userId, client);
    await client.query("COMMIT");
    return res.json({ message: "Deleted", fallbackListId: fallback.id });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("DELETE /todo-lists/:id", error);
    return res.status(500).json({ message: "Failed to delete list" });
  } finally {
    client.release();
  }
});

export default router;
