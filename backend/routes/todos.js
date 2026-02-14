import express from "express";
import { authRequired } from "../middleware/auth.js";
import { pool } from "../db/connect.js";

const router = express.Router();

router.use(authRequired);

async function ensureDefaultList(userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let lists = await client.query(
      `SELECT id, title, position, created_at
       FROM user_todo_lists
       WHERE user_id = $1
       ORDER BY position ASC, created_at ASC`,
      [userId]
    );
    if (lists.rows.length === 0) {
      const inserted = await client.query(
        `INSERT INTO user_todo_lists (user_id, title, position)
         VALUES ($1, $2, 0)
         RETURNING id, title, position, created_at`,
        [userId, "ToDo"]
      );
      lists = { rows: inserted.rows };
    }
    const defaultListId = Number(lists.rows[0].id);
    await client.query(
      `UPDATE user_todos
       SET list_id = $1
       WHERE user_id = $2 AND (list_id IS NULL)` ,
      [defaultListId, userId]
    );
    await client.query("COMMIT");
    return lists.rows;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function ensureListOwnership(userId, listId, client = pool) {
  if (listId === null || listId === undefined) return false;
  const numeric = Number(listId);
  if (!Number.isFinite(numeric)) return false;
  const q = await client.query(
    `SELECT id FROM user_todo_lists WHERE user_id = $1 AND id = $2`,
    [userId, numeric]
  );
  return q.rows.length > 0;
}

async function nextTaskPosition(userId, listId, client = pool) {
  const q = await client.query(
    `SELECT COALESCE(MAX(position), -1) + 1 AS pos
     FROM user_todos
     WHERE user_id = $1 AND list_id = $2`,
    [userId, listId]
  );
  return Number(q.rows[0]?.pos || 0);
}

async function normalizeTaskPositions(userId, listId, client = pool) {
  if (!Number.isFinite(Number(listId))) return;
  const q = await client.query(
    `SELECT id
     FROM user_todos
     WHERE user_id = $1 AND list_id = $2
     ORDER BY position ASC, created_at ASC, id ASC`,
    [userId, listId]
  );
  for (let i = 0; i < q.rows.length; i += 1) {
    const todoId = q.rows[i].id;
    await client.query(`UPDATE user_todos SET position = $1 WHERE id = $2`, [i, todoId]);
  }
}

function parseDueAt(raw) {
  if (raw === undefined) return undefined;
  if (raw === null || raw === "") return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return undefined; // signal invalid
  }
  return date;
}

router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const lists = await ensureDefaultList(userId);
    const tasksRes = await pool.query(
      `SELECT id, list_id, text, done, position, created_at, due_at
       FROM user_todos
       WHERE user_id = $1
    ORDER BY list_id ASC, position ASC, created_at ASC`,
      [userId]
    );
    const now = new Date().toUTCString();
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("ETag", `${Date.now()}`);
    res.setHeader("Last-Modified", now);
    return res.json({ lists, tasks: tasksRes.rows });
  } catch (e) {
    console.error("GET /todos", e);
    return res.status(500).json({ message: "Failed to load todos" });
  }
});

router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { text = "", done = false, listId: rawListId, position, dueAt } = req.body || {};
    const trimmed = String(text).trim();
    if (!trimmed) return res.status(400).json({ message: "text is required" });

    let targetListId = Number(rawListId);
    let listsCache = null;
    if (!Number.isFinite(targetListId)) {
      listsCache = await ensureDefaultList(userId);
      targetListId = Number(listsCache[0].id);
    }
    if (!(await ensureListOwnership(userId, targetListId, client))) {
      return res.status(400).json({ message: "Invalid listId" });
    }

    const dueAtValue = parseDueAt(dueAt);
    if (dueAt !== undefined && dueAtValue === undefined) {
      return res.status(400).json({ message: "dueAt is invalid" });
    }

    await client.query("BEGIN");
    let finalPosition = Number(position);
    if (!Number.isFinite(finalPosition)) {
      finalPosition = await nextTaskPosition(userId, targetListId, client);
    }
    const insert = await client.query(
      `INSERT INTO user_todos (user_id, list_id, text, done, position, due_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, list_id, text, done, position, created_at, due_at`,
      [userId, targetListId, trimmed, !!done, finalPosition, dueAtValue ?? null]
    );
    await normalizeTaskPositions(userId, targetListId, client);
    await client.query("COMMIT");
    return res.status(201).json({ todo: insert.rows[0] });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("POST /todos", e);
    return res.status(500).json({ message: "Failed to create todo" });
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

    const existingRes = await client.query(
      `SELECT list_id FROM user_todos WHERE user_id = $1 AND id = $2`,
      [userId, id]
    );
    if (existingRes.rows.length === 0) return res.status(404).json({ message: "Todo not found" });
    const existingListId = Number(existingRes.rows[0].list_id);

    const { text, done, listId: rawListId, position, dueAt } = req.body || {};

    const dueAtValue = parseDueAt(dueAt);
    if (dueAt !== undefined && dueAtValue === undefined) {
      return res.status(400).json({ message: "dueAt is invalid" });
    }

    let targetListId = existingListId;
    if (rawListId !== undefined) {
      const maybeList = Number(rawListId);
      if (!Number.isFinite(maybeList)) {
        return res.status(400).json({ message: "listId must be numeric" });
      }
      if (!(await ensureListOwnership(userId, maybeList, client))) {
        return res.status(400).json({ message: "Invalid listId" });
      }
      targetListId = maybeList;
    }

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
    if (rawListId !== undefined) {
      fields.push(`list_id = $${idx++}`);
      values.push(targetListId);
    }
    if (position !== undefined) {
      const pos = Number(position);
      if (!Number.isFinite(pos)) return res.status(400).json({ message: "position must be numeric" });
      fields.push(`position = $${idx++}`);
      values.push(pos);
    }
    if (dueAt !== undefined) {
      fields.push(`due_at = $${idx++}`);
      values.push(dueAtValue ?? null);
    }

    if (fields.length === 0) return res.status(400).json({ message: "Nothing to update" });
    fields.push(`updated_at = NOW()`);

    await client.query("BEGIN");
    values.push(userId);
    values.push(id);
    const sql = `UPDATE user_todos SET ${fields.join(", ")}
                 WHERE user_id = $${idx++} AND id = $${idx}
                 RETURNING id, list_id, text, done, position, created_at, due_at`;
    const q = await client.query(sql, values);
    if (q.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Todo not found" });
    }

    const affectedLists = new Set([existingListId, targetListId]);
    for (const listId of affectedLists) {
      if (Number.isFinite(Number(listId))) {
        await normalizeTaskPositions(userId, listId, client);
      }
    }

    await client.query("COMMIT");
    return res.json({ todo: q.rows[0] });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("PATCH /todos/:id", e);
    return res.status(500).json({ message: "Failed to update todo" });
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
    const existing = await client.query(
      `SELECT list_id FROM user_todos WHERE user_id = $1 AND id = $2`,
      [userId, id]
    );
    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Todo not found" });
    }
    const listId = Number(existing.rows[0].list_id);
    await client.query("DELETE FROM user_todos WHERE user_id = $1 AND id = $2", [userId, id]);
    if (Number.isFinite(listId)) {
      await normalizeTaskPositions(userId, listId, client);
    }
    await client.query("COMMIT");
    return res.json({ message: "Deleted" });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("DELETE /todos/:id", e);
    return res.status(500).json({ message: "Failed to delete todo" });
  } finally {
    client.release();
  }
});

export default router;
