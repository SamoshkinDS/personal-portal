import express from "express";
import { pool } from "../db/connect.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

function mapArticle(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.use(authRequired);

router.get("/", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim().toLowerCase();
    const limit = Math.min(Math.max(Number(req.query.limit) || 200, 10), 1000);
    const params = [];
    const filters = [];
    if (search) {
      params.push(`%${search}%`);
      params.push(`%${search}%`);
      filters.push(
        `(lower(title) LIKE $${params.length - 1} OR lower(description) LIKE $${params.length})`
      );
    }
    params.push(limit);
    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const rows = await pool.query(
      `
      SELECT id, title, description, content, created_at, updated_at
      FROM cheat_articles
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT $${params.length}
    `,
      params
    );

    return res.json({ items: rows.rows.map(mapArticle) });
  } catch (err) {
    console.error("GET /api/cheats", err);
    return res.status(500).json({ message: "Не удалось загрузить шпаргалки" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Неверный идентификатор" });
    }
    const row = await pool.query(
      `
      SELECT id, title, description, content, created_at, updated_at
      FROM cheat_articles
      WHERE id = $1
      LIMIT 1
    `,
      [id]
    );
    if (!row.rows.length) {
      return res.status(404).json({ message: "Статья не найдена" });
    }
    return res.json({ item: mapArticle(row.rows[0]) });
  } catch (err) {
    console.error("GET /api/cheats/:id", err);
    return res.status(500).json({ message: "Не удалось загрузить статью" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, content } = req.body || {};
    const trimmedTitle = String(title || "").trim();
    if (!trimmedTitle) {
      return res.status(400).json({ message: "Тайтл обязателен" });
    }
    const trimmedDescription = description ? String(description).trim() : null;
    const trimmedContent = content ? String(content).trim() : null;
    const result = await pool.query(
      `
      INSERT INTO cheat_articles (title, description, content)
      VALUES ($1, $2, $3)
      RETURNING id, title, description, content, created_at, updated_at
    `,
      [trimmedTitle, trimmedDescription, trimmedContent]
    );
    return res.status(201).json({ item: mapArticle(result.rows[0]) });
  } catch (err) {
    console.error("POST /api/cheats", err);
    return res.status(500).json({ message: "Не удалось создать статью" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Неверный идентификатор" });
    }
    const { title, description, content } = req.body || {};
    const updates = [];
    const params = [];
    if (title !== undefined) {
      const trimmed = String(title || "").trim();
      if (!trimmed) {
        return res.status(400).json({ message: "Тайтл обязателен" });
      }
      params.push(trimmed);
      updates.push(`title = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description ? String(description).trim() : null);
      updates.push(`description = $${params.length}`);
    }
    if (content !== undefined) {
      params.push(content ? String(content).trim() : null);
      updates.push(`content = $${params.length}`);
    }
    if (!updates.length) {
      return res.status(400).json({ message: "Нет данных для обновления" });
    }
    params.push(id);
    const result = await pool.query(
      `
      UPDATE cheat_articles
      SET ${updates.join(", ")}, updated_at = now()
      WHERE id = $${params.length}
      RETURNING id, title, description, content, created_at, updated_at
    `,
      params
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: "Статья не найдена" });
    }
    return res.json({ item: mapArticle(result.rows[0]) });
  } catch (err) {
    console.error("PATCH /api/cheats/:id", err);
    return res.status(500).json({ message: "Не удалось обновить статью" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Неверный идентификатор" });
    }
    const result = await pool.query(
      `
      DELETE FROM cheat_articles
      WHERE id = $1
      RETURNING id
    `,
      [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: "Статья не найдена" });
    }
    return res.json({ message: "Статья удалена" });
  } catch (err) {
    console.error("DELETE /api/cheats/:id", err);
    return res.status(500).json({ message: "Не удалось удалить статью" });
  }
});

router.post("/import", async (req, res) => {
  try {
    const payload = Array.isArray(req.body)
      ? req.body
      : Array.isArray(req.body?.articles)
        ? req.body.articles
        : [];
    if (!payload.length) {
      return res.status(400).json({ message: "Нет данных для импорта" });
    }
    let imported = 0;
    for (const entry of payload) {
      const title = String(entry.title || "").trim();
      if (!title) {
        return res.status(400).json({ message: "Каждый объект должен содержать title" });
      }
      const description = entry.description ? String(entry.description).trim() : null;
      const content = entry.content ? String(entry.content).trim() : null;
      await pool.query(
        `
        INSERT INTO cheat_articles (title, description, content)
        VALUES ($1, $2, $3)
      `,
        [title, description, content]
      );
      imported += 1;
    }
    return res.status(201).json({ imported });
  } catch (err) {
    console.error("POST /api/cheats/import", err);
    return res.status(500).json({ message: "Не удалось импортировать статьи" });
  }
});

export default router;
