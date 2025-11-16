import express from "express";
import { pool } from "../db/connect.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

function mapTest(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    topicId: row.topic_id,
    topicTitle: row.topic_title,
    relatedArticleId: row.related_article_id,
    relatedArticleTitle: row.related_article_title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapQuestion(row) {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    explanation: row.explanation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.use(authRequired);

router.get("/", async (req, res) => {
  try {
    const statusFilter = String(req.query.status || "").trim().toLowerCase();
    const topicFilter = Number(req.query.topicId || req.query.topic_id);
    const limit = Math.min(Math.max(Number(req.query.limit) || 200, 10), 1000);
    const params = [];
    const filters = [];
    if (statusFilter) {
      params.push(statusFilter);
      filters.push(`lower(status) = $${params.length}`);
    }
    if (Number.isFinite(topicFilter)) {
      params.push(topicFilter);
      filters.push(`topic_id = $${params.length}`);
    }
    params.push(limit);
    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const rows = await pool.query(
      `
      SELECT t.*, p.title AS topic_title, a.title AS related_article_title
      FROM tests t
      LEFT JOIN topics p ON p.id = t.topic_id
      LEFT JOIN articles a ON a.id = t.related_article_id
      ${whereClause}
      ORDER BY t.updated_at DESC
      LIMIT $${params.length}
    `,
      params
    );

    return res.json({ items: rows.rows.map(mapTest) });
  } catch (err) {
    console.error("GET /api/tests", err);
    return res.status(500).json({ message: "Не удалось загрузить тесты" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Неверный идентификатор" });
    }
    const [testRes, questionsRes] = await Promise.all([
      pool.query(
        `
        SELECT t.*, p.title AS topic_title, a.title AS related_article_title
        FROM tests t
        LEFT JOIN topics p ON p.id = t.topic_id
        LEFT JOIN articles a ON a.id = t.related_article_id
        WHERE t.id = $1
        LIMIT 1
      `,
        [id]
      ),
      pool.query(
        `
        SELECT id, question, answer, explanation, created_at, updated_at
        FROM test_questions
        WHERE test_id = $1
        ORDER BY id
      `,
        [id]
      ),
    ]);
    if (!testRes.rows.length) {
      return res.status(404).json({ message: "Тест не найден" });
    }
    return res.json({
      item: mapTest(testRes.rows[0]),
      questions: questionsRes.rows.map(mapQuestion),
    });
  } catch (err) {
    console.error("GET /api/tests/:id", err);
    return res.status(500).json({ message: "Не удалось загрузить тест" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, topicId, description, relatedArticleId } = req.body || {};
    const trimmedTitle = String(title || "").trim();
    if (!trimmedTitle) {
      return res.status(400).json({ message: "Название обязательно" });
    }
    const topic = Number(topicId);
    if (!Number.isFinite(topic)) {
      return res.status(400).json({ message: "Тема обязательна" });
    }
    const article = Number(relatedArticleId);
    const status = "pending_generation";
    const result = await pool.query(
      `
      INSERT INTO tests (title, topic_id, description, related_article_id, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, title, topic_id, description, related_article_id, status, created_at, updated_at
    `,
      [trimmedTitle, topic, description || null, Number.isFinite(article) ? article : null, status]
    );
    return res.status(201).json({ item: mapTest(result.rows[0]) });
  } catch (err) {
    console.error("POST /api/tests", err);
    return res.status(500).json({ message: "Не удалось создать тест" });
  }
});

router.post("/response", async (req, res) => {
  try {
    const { test_id, questions } = req.body || {};
    const testId = Number(test_id);
    if (!Number.isFinite(testId)) {
      return res.status(400).json({ message: "test_id обязателен" });
    }
    if (!Array.isArray(questions) || !questions.length) {
      return res.status(400).json({ message: "Вопросы обязательны" });
    }
    const testRes = await pool.query("SELECT id, status FROM tests WHERE id = $1 LIMIT 1", [testId]);
    if (!testRes.rows.length) {
      return res.status(404).json({ message: "Тест не найден" });
    }
    const insertPromises = questions.map((entry) => {
      const text = String(entry.question || "").trim();
      if (!text) return null;
      const answer = entry.answer ? String(entry.answer).trim() : null;
      const explanation = entry.explanation ? String(entry.explanation).trim() : null;
      return pool.query(
        `
        INSERT INTO test_questions (test_id, question, answer, explanation)
        VALUES ($1, $2, $3, $4)
      `,
        [testId, text, answer, explanation]
      );
    });
    await Promise.all(insertPromises.filter(Boolean));
    await pool.query("UPDATE tests SET status = 'completed', updated_at = now() WHERE id = $1", [
      testId,
    ]);
    return res.json({ message: "Вопросы сохранены" });
  } catch (err) {
    console.error("POST /api/tests/response", err);
    return res.status(500).json({ message: "Не удалось обработать ответ" });
  }
});

export default router;
