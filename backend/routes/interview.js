import express from "express";
import { pool } from "../db/connect.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

function mapQuestion(row) {
  return {
    id: row.id,
    topicId: row.topic_id,
    topicTitle: row.topic_title,
    question: row.question,
    answer: row.answer,
    explanation: row.explanation,
    relatedArticleId: row.related_article_id,
    relatedArticleTitle: row.related_article_title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadQuestion(id) {
  const result = await pool.query(
    `
    SELECT q.*, t.title AS topic_title, a.title AS related_article_title
    FROM interview_questions q
    LEFT JOIN topics t ON t.id = q.topic_id
    LEFT JOIN articles a ON a.id = q.related_article_id
    WHERE q.id = $1
    LIMIT 1
  `,
    [id]
  );
  if (!result.rows.length) return null;
  return mapQuestion(result.rows[0]);
}

async function resolveTopicId(value, cache = new Map()) {
  if (value === undefined || value === null || value === "") return null;
  const normalized =
    typeof value === "number"
      ? `id:${value}`
      : `label:${String(value).trim().toLowerCase()}`;
  if (cache.has(normalized)) return cache.get(normalized);

  let resolved = null;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    const topicCheck = await pool.query("SELECT id FROM topics WHERE id = $1 LIMIT 1", [numeric]);
    if (topicCheck.rows.length) resolved = numeric;
  }

  if (resolved === null) {
    const search = String(value).trim().toLowerCase();
    if (search) {
      const topicRow = await pool.query(
        `
        SELECT id FROM topics
        WHERE lower(title) = $1 OR lower(slug) = $1
        LIMIT 1
      `,
        [search]
      );
      if (topicRow.rows.length) {
        resolved = topicRow.rows[0].id;
      }
    }
  }

  cache.set(normalized, resolved);
  return resolved;
}

async function ensureArticleExists(articleId) {
  if (articleId === undefined || articleId === null || articleId === "") return null;
  const parsed = Number(articleId);
  if (!Number.isFinite(parsed)) return null;
  const articleCheck = await pool.query("SELECT id FROM articles WHERE id = $1 LIMIT 1", [parsed]);
  if (!articleCheck.rows.length) return null;
  return parsed;
}

router.use(authRequired);

router.get("/questions", async (req, res) => {
  try {
    const topicId = Number(req.query.topicId || req.query.topic_id);
    const searchTerm = String(req.query.search || "").trim().toLowerCase();
    const requestedLimit = Math.min(Math.max(Number(req.query.limit) || 200, 10), 1000);

    const filters = [];
    const params = [];
    if (Number.isFinite(topicId)) {
      params.push(topicId);
      filters.push(`q.topic_id = $${params.length}`);
    }
    if (searchTerm) {
      params.push(`%${searchTerm}%`);
      filters.push(`lower(q.question) LIKE $${params.length}`);
    }
    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    params.push(requestedLimit);

    const rows = await pool.query(
      `
      SELECT q.*, t.title AS topic_title, a.title AS related_article_title
      FROM interview_questions q
      LEFT JOIN topics t ON t.id = q.topic_id
      LEFT JOIN articles a ON a.id = q.related_article_id
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT $${params.length}
    `,
      params
    );

    return res.json({ items: rows.rows.map(mapQuestion) });
  } catch (err) {
    console.error("GET /api/interview/questions", err);
    return res.status(500).json({ message: "Не удалось загрузить вопросы" });
  }
});

router.post("/questions", async (req, res) => {
  try {
    const payload = req.body || {};
    const topicValue = payload.topicId ?? payload.topic_id ?? payload.topic;
    const resolvedTopic = await resolveTopicId(topicValue);
    if (!resolvedTopic) {
      return res.status(400).json({ message: "Выберите существующую тему" });
    }
    const questionText = String(payload.question || "").trim();
    if (!questionText) {
      return res.status(400).json({ message: "Вопрос не может быть пустым" });
    }
    const answer = typeof payload.answer === "string" ? payload.answer.trim() : payload.answer || null;
    const explanation = typeof payload.explanation === "string" ? payload.explanation.trim() : payload.explanation || null;
    const relatedArticleId = await ensureArticleExists(
      payload.relatedArticleId ?? payload.related_article_id ?? payload.relatedArticle
    );

    const insert = await pool.query(
      `
      INSERT INTO interview_questions (topic_id, question, answer, explanation, related_article_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
      [resolvedTopic, questionText, answer || null, explanation || null, relatedArticleId ?? null]
    );

    const item = await loadQuestion(insert.rows[0].id);
    return res.status(201).json({ item });
  } catch (err) {
    console.error("POST /api/interview/questions", err);
    return res.status(500).json({ message: "Не удалось создать вопрос" });
  }
});

router.patch("/questions/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Неверный идентификатор вопроса" });
    }
    const payload = req.body || {};
    const updates = [];
    const params = [];

    if (payload.topicId || payload.topic_id || payload.topic) {
      const resolvedTopic = await resolveTopicId(
        payload.topicId ?? payload.topic_id ?? payload.topic
      );
      if (!resolvedTopic) {
        return res.status(400).json({ message: "Выберите существующую тему" });
      }
      params.push(resolvedTopic);
      updates.push(`topic_id = $${params.length}`);
    }

    if (payload.question !== undefined) {
      const text = String(payload.question || "").trim();
      if (!text) {
        return res.status(400).json({ message: "Вопрос не может быть пустым" });
      }
      params.push(text);
      updates.push(`question = $${params.length}`);
    }

    if (payload.answer !== undefined) {
      params.push(payload.answer ? String(payload.answer).trim() : null);
      updates.push(`answer = $${params.length}`);
    }

    if (payload.explanation !== undefined) {
      params.push(payload.explanation ? String(payload.explanation).trim() : null);
      updates.push(`explanation = $${params.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(payload, "relatedArticleId") ||
        Object.prototype.hasOwnProperty.call(payload, "related_article_id") ||
        Object.prototype.hasOwnProperty.call(payload, "relatedArticle")) {
      const resolvedArticle = await ensureArticleExists(
        payload.relatedArticleId ?? payload.related_article_id ?? payload.relatedArticle
      );
      params.push(resolvedArticle ?? null);
      updates.push(`related_article_id = $${params.length}`);
    }

    if (!updates.length) {
      return res.status(400).json({ message: "Нет данных для обновления" });
    }

    params.push(id);
    const updateQuery = `
      UPDATE interview_questions
      SET ${updates.join(", ")}, updated_at = now()
      WHERE id = $${params.length}
      RETURNING id
    `;

    const updated = await pool.query(updateQuery, params);
    if (!updated.rows.length) {
      return res.status(404).json({ message: "Вопрос не найден" });
    }

    const item = await loadQuestion(id);
    if (!item) return res.status(404).json({ message: "Вопрос не найден" });
    return res.json({ item });
  } catch (err) {
    console.error("PATCH /api/interview/questions/:id", err);
    return res.status(500).json({ message: "Не удалось обновить вопрос" });
  }
});

router.delete("/questions/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Неверный идентификатор вопроса" });
    }
    const deleted = await pool.query(
      `
      DELETE FROM interview_questions
      WHERE id = $1
      RETURNING id
    `,
      [id]
    );
    if (!deleted.rows.length) {
      return res.status(404).json({ message: "Вопрос не найден" });
    }
    return res.json({ message: "Вопрос удалён" });
  } catch (err) {
    console.error("DELETE /api/interview/questions/:id", err);
    return res.status(500).json({ message: "Не удалось удалить вопрос" });
  }
});

router.post("/import", async (req, res) => {
  try {
    const payload = Array.isArray(req.body)
      ? req.body
      : Array.isArray(req.body?.questions)
        ? req.body.questions
        : [];
    if (!payload.length) {
      return res.status(400).json({ message: "Нет данных для импорта" });
    }

    const topicCache = new Map();
    let imported = 0;

    for (const entry of payload) {
      const questionText = String(entry.question || "").trim();
      if (!questionText) {
        return res.status(400).json({ message: "Каждый объект должен содержать вопрос" });
      }
      const topicValue = entry.topic ?? entry.topicId ?? entry.topic_id;
      const topicId = await resolveTopicId(topicValue, topicCache);
      if (!topicId) {
        return res.status(400).json({ message: `Тема не найдена: ${topicValue || "пустое значение"}` });
      }
      const answerText = typeof entry.answer === "string" ? entry.answer.trim() : entry.answer || null;
      const explanationText =
        typeof entry.explanation === "string" ? entry.explanation.trim() : entry.explanation || null;
      const relatedArticleId = await ensureArticleExists(
        entry.relatedArticleId ?? entry.related_article_id ?? entry.relatedArticle
      );

      await pool.query(
        `
        INSERT INTO interview_questions (topic_id, question, answer, explanation, related_article_id)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [topicId, questionText, answerText || null, explanationText || null, relatedArticleId ?? null]
      );
      imported += 1;
    }

    return res.status(201).json({ imported });
  } catch (err) {
    console.error("POST /api/interview/import", err);
    return res.status(500).json({ message: "Импорт не удался" });
  }
});

router.get("/articles", async (req, res) => {
  try {
    const maxLimit = Math.min(Math.max(Number(req.query.limit) || 100, 10), 1000);
    const rows = await pool.query(
      `
      SELECT a.id, a.title, a.topic_id, t.title AS topic_title
      FROM articles a
      LEFT JOIN topics t ON t.id = a.topic_id
      ORDER BY a.created_at DESC
      LIMIT $1
    `,
      [maxLimit]
    );
    return res.json({
      items: rows.rows.map((row) => ({
        id: row.id,
        title: row.title,
        topicId: row.topic_id,
        topicTitle: row.topic_title,
      })),
    });
  } catch (err) {
    console.error("GET /api/interview/articles", err);
    return res.status(500).json({ message: "Не удалось загрузить статьи" });
  }
});

export default router;
