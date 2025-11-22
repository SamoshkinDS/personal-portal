import express from "express";
import { pool } from "../db/connect.js";
import { authRequired, requirePermission } from "../middleware/auth.js";
import { verifyJwt } from "../lib/jwt.js";
import sanitizeHtml from "sanitize-html";

const analyticsRouter = express.Router();
const articlesRouter = express.Router();
const articlesQueueRouter = express.Router();

const VALID_STATUSES = new Set(["draft", "processing", "finished", "published"]);
const analyticsGuard = [authRequired, requirePermission(["view_analytics"])];
const QUEUE_TOKEN = (process.env.ARTICLES_QUEUE_TOKEN || "").trim();
const SANITIZE_OPTS = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(["h1", "h2", "img", "table", "thead", "tbody", "tr", "th", "td"]),
  allowedAttributes: {
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    "*": ["class", "style"],
  },
};

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => String(t || "").trim())
    .filter(Boolean)
    .slice(0, 20);
}

function mapTopic(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    tags: row.tags || [],
    parentTopicId: row.parent_topic_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    articleCount: typeof row.article_count !== "undefined" ? Number(row.article_count || 0) : undefined,
  };
}

function mapArticle(row) {
  return {
    id: row.id,
    topicId: row.topic_id,
    queueId: row.queue_id,
    title: row.title,
    summary: row.summary,
    content: sanitizeHtml(row.content || "", SANITIZE_OPTS),
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapQueue(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    content: sanitizeHtml(row.content || "", SANITIZE_OPTS),
    tags: row.tags || [],
    publishedArticleId: row.published_article_id,
    publishedTopicId: row.published_topic_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function attachUserFromAuth(req) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = verifyJwt(token);
    req.user = { id: decoded.sub, username: decoded.username };
    return req.user;
  } catch {
    return null;
  }
}

function queueAccessGuard(req, res, next) {
  const providedToken = String(req.query.token || req.headers["x-queue-token"] || "").trim();
  const statusParam = String(req.query.status || "").toLowerCase();
  const allowProcessingFeed =
    req.method === "GET" && statusParam === "processing" && QUEUE_TOKEN && providedToken === QUEUE_TOKEN;

  if (allowProcessingFeed) {
    return next();
  }

  return authRequired(req, res, (err) => {
    if (err) return;
    return requirePermission(["view_analytics"])(req, res, next);
  });
}

async function breadcrumbsForTopic(topicId) {
  const items = [];
  let currentId = topicId;
  while (currentId) {
    const q = await pool.query(
      "SELECT id, slug, title, parent_topic_id FROM topics WHERE id = $1",
      [currentId]
    );
    if (!q.rows.length) break;
    const row = q.rows[0];
    items.push({ id: row.id, slug: row.slug, title: row.title });
    currentId = row.parent_topic_id;
  }
  return items.reverse();
}

analyticsRouter.use(...analyticsGuard);

analyticsRouter.get("/topics", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim().toLowerCase();
    const includeCounts = String(req.query.includeCounts || "1") !== "0";

    const countTable = includeCounts
      ? `LEFT JOIN (SELECT topic_id, COUNT(*) AS article_count FROM articles GROUP BY topic_id) a ON a.topic_id = t.id`
      : "";
    const countSelect = includeCounts ? "COALESCE(a.article_count, 0) AS article_count" : "0 AS article_count";

    const topicsRes = await pool.query(
      `
      SELECT t.*, ${countSelect}
      FROM topics t
      ${countTable}
      ORDER BY COALESCE(t.parent_topic_id, 0), lower(t.title)
    `
    );

    const topicRows = topicsRes.rows;
    const articleMatchIds = new Set();
    if (search) {
      const arts = await pool.query(
        `
        SELECT DISTINCT topic_id
        FROM articles
        WHERE lower(title) LIKE $1 OR lower(summary) LIKE $1
      `,
        [`%${search}%`]
      );
      arts.rows.forEach((r) => articleMatchIds.add(r.topic_id));
    }

    const byId = new Map();
    topicRows.forEach((row) => {
      byId.set(row.id, { ...mapTopic(row), children: [], matches: false });
    });

    const roots = [];
    byId.forEach((topic) => {
      const selfMatches =
        !search ||
        topic.title.toLowerCase().includes(search) ||
        (topic.description || "").toLowerCase().includes(search) ||
        (topic.tags || []).some((tag) => tag.toLowerCase().includes(search)) ||
        articleMatchIds.has(topic.id);
      topic.matches = selfMatches;
      if (topic.parentTopicId && byId.has(topic.parentTopicId)) {
        byId.get(topic.parentTopicId).children.push(topic);
      } else {
        roots.push(topic);
      }
    });

    function filterTree(node) {
      const filteredChildren = node.children.map(filterTree).filter(Boolean);
      const hasChildMatch = filteredChildren.length > 0;
      const isMatch = search ? node.matches || hasChildMatch : true;
      if (!isMatch) return null;
      const { matches, ...rest } = node;
      return { ...rest, children: filteredChildren };
    }

    const filtered = roots
      .map(filterTree)
      .filter(Boolean);

    return res.json({ topics: filtered });
  } catch (e) {
    console.error("GET /api/analytics/topics", e);
    return res.status(500).json({ message: "Не удалось загрузить темы" });
  }
});

analyticsRouter.get("/topics/:idOrSlug", async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const asNumber = Number(idOrSlug);
    const whereClause = Number.isFinite(asNumber)
      ? "(t.id = $1 OR t.slug = $2)"
      : "t.slug = $1";
    const params = Number.isFinite(asNumber) ? [asNumber, idOrSlug] : [idOrSlug];
    const topicRes = await pool.query(
      `
      SELECT t.*, COALESCE(a.article_count, 0) AS article_count
      FROM topics t
      LEFT JOIN (SELECT topic_id, COUNT(*) AS article_count FROM articles GROUP BY topic_id) a ON a.topic_id = t.id
      WHERE ${whereClause}
      LIMIT 1
    `,
      params
    );
    if (!topicRes.rows.length) return res.status(404).json({ message: "Тема не найдена" });
    const topic = mapTopic(topicRes.rows[0]);

    const subtopicsRes = await pool.query(
      `
      SELECT c.*, COALESCE(a.article_count, 0) AS article_count
      FROM topics c
      LEFT JOIN (SELECT topic_id, COUNT(*) AS article_count FROM articles GROUP BY topic_id) a ON a.topic_id = c.id
      WHERE c.parent_topic_id = $1
      ORDER BY lower(c.title)
    `,
      [topic.id]
    );

    const articlesRes = await pool.query(
      `
      SELECT id, topic_id, queue_id, title, summary, content, tags, created_at, updated_at
      FROM articles
      WHERE topic_id = $1
      ORDER BY updated_at DESC
    `,
      [topic.id]
    );

    const breadcrumbs = await breadcrumbsForTopic(topic.id);

    return res.json({
      topic,
      breadcrumbs,
      subtopics: subtopicsRes.rows.map(mapTopic),
      articles: articlesRes.rows.map(mapArticle),
    });
  } catch (e) {
    console.error("GET /api/analytics/topics/:idOrSlug", e);
    return res.status(500).json({ message: "Не удалось загрузить тему" });
  }
});

analyticsRouter.get("/articles/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Некорректный id" });
    const artRes = await pool.query(
      `
      SELECT
        a.*,
        t.id AS t_id,
        t.slug AS t_slug,
        t.title AS t_title,
        t.description AS t_description,
        t.tags AS t_tags,
        t.parent_topic_id AS t_parent_id
      FROM articles a
      LEFT JOIN topics t ON t.id = a.topic_id
      WHERE a.id = $1
      LIMIT 1
    `,
      [id]
    );
    if (!artRes.rows.length) return res.status(404).json({ message: "Статья не найдена" });
    const row = artRes.rows[0];
    const article = mapArticle(row);
    const topic = row.t_id
      ? {
          id: row.t_id,
          slug: row.t_slug,
          title: row.t_title,
          description: row.t_description,
          tags: row.t_tags || [],
          parentTopicId: row.t_parent_id,
        }
      : null;
    const breadcrumbs = topic ? await breadcrumbsForTopic(topic.id) : [];
    return res.json({ article, topic, breadcrumbs });
  } catch (e) {
    console.error("GET /api/analytics/articles/:id", e);
    return res.status(500).json({ message: "Не удалось загрузить статью" });
  }
});

analyticsRouter.patch("/articles/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Некорректный id" });
    const { title, summary, content, tags } = req.body || {};
    if (
      typeof title === "undefined" &&
      typeof summary === "undefined" &&
      typeof content === "undefined" &&
      typeof tags === "undefined"
    ) {
      return res.status(400).json({ message: "Нет данных для обновления" });
    }
    const updates = [];
    const params = [];
    if (typeof title !== "undefined") {
      params.push(String(title || "").trim() || null);
      updates.push(`title = $${params.length}`);
    }
    if (typeof summary !== "undefined") {
      params.push(summary || null);
      updates.push(`summary = $${params.length}`);
    }
    if (typeof content !== "undefined") {
      params.push(content || null);
      updates.push(`content = $${params.length}`);
    }
    if (typeof tags !== "undefined") {
      params.push(normalizeTags(tags));
      updates.push(`tags = $${params.length}`);
    }
    params.push(id);
    const upd = await pool.query(
      `
      UPDATE articles
      SET ${updates.join(", ")}, updated_at = now()
      WHERE id = $${params.length}
      RETURNING id, topic_id, queue_id, title, summary, content, tags, created_at, updated_at
    `,
      params
    );
    if (!upd.rows.length) return res.status(404).json({ message: "Статья не найдена" });
    return res.json({ article: mapArticle(upd.rows[0]) });
  } catch (e) {
    console.error("PATCH /api/analytics/articles/:id", e);
    return res.status(500).json({ message: "Не удалось обновить статью" });
  }
});

analyticsRouter.delete("/articles/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Некорректный id" });

    // Load article to keep relations for cleanup
    const art = await pool.query(
      "SELECT id, queue_id FROM articles WHERE id = $1",
      [id]
    );
    if (!art.rows.length) return res.status(404).json({ message: "Статья не найдена" });

    await pool.query("DELETE FROM articles WHERE id = $1", [id]);

    if (art.rows[0].queue_id) {
      await pool.query(
        `
        UPDATE articles_queue
        SET status = 'finished',
            published_article_id = NULL,
            published_topic_id = NULL,
            updated_at = now()
        WHERE id = $1
      `,
        [art.rows[0].queue_id]
      );
    }

    return res.json({ message: "Статья удалена" });
  } catch (e) {
    console.error("DELETE /api/analytics/articles/:id", e);
    return res.status(500).json({ message: "Не удалось удалить статью" });
  }
});

articlesRouter.use(...analyticsGuard);

articlesRouter.post("/", async (req, res) => {
  try {
    const { queue_id, title, content, tags = [], status, summary } = req.body || {};
    const queueId = Number(queue_id);
    if (!Number.isFinite(queueId)) return res.status(400).json({ message: "queue_id обязателен" });
    const trimmedTitle = String(title || "").trim();
    if (!trimmedTitle) return res.status(400).json({ message: "title обязателен" });
    const normalizedTags = normalizeTags(tags);

    const queueRes = await pool.query("SELECT * FROM articles_queue WHERE id = $1", [queueId]);
    if (!queueRes.rows.length) return res.status(404).json({ message: "Запись очереди не найдена" });

    const nextStatus = status && VALID_STATUSES.has(status) ? status : "finished";
    await pool.query(
      `
      UPDATE articles_queue
      SET title = $1, description = COALESCE(description, $2), content = $3, tags = $4, status = $5, updated_at = now()
      WHERE id = $6
    `,
      [trimmedTitle, summary || null, content || null, normalizedTags, nextStatus, queueId]
    );

    return res.status(201).json({ message: "Статья сохранена", queueId });
  } catch (e) {
    console.error("POST /api/articles", e);
    return res.status(500).json({ message: "Не удалось сохранить статью" });
  }
});

articlesQueueRouter.use(queueAccessGuard);

articlesQueueRouter.get("/", async (req, res) => {
  try {
    const status = String(req.query.status || "").toLowerCase() || "all";
    const hidePublished =
      String(req.query.hidePublished || req.query.hide_published || "false").toLowerCase() === "true";
    const token = (process.env.ARTICLES_QUEUE_TOKEN || "").trim();
    const user = attachUserFromAuth(req);
    const isProcessingFeed = status === "processing" && !user;

    if (!user && !isProcessingFeed) {
      return res.status(401).json({ message: "Требуется авторизация" });
    }

    if (isProcessingFeed && token) {
      const provided = String(req.query.token || req.headers["x-queue-token"] || "").trim();
      if (provided !== token) {
        return res.status(401).json({ message: "Неверный токен очереди" });
      }
    }

    const where = [];
    const params = [];
    if (status && status !== "all") {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
    if (hidePublished) {
      where.push(`status <> 'published'`);
    }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const listRes = await pool.query(
      `
      SELECT id, title, description, status, content, tags, published_article_id, published_topic_id, created_at, updated_at
      FROM articles_queue
      ${whereClause}
      ORDER BY created_at DESC
    `,
      params
    );
    return res.json({ items: listRes.rows.map(mapQueue) });
  } catch (e) {
    console.error("GET /api/articles-queue", e);
    return res.status(500).json({ message: "Не удалось загрузить очередь" });
  }
});

articlesQueueRouter.get("/:id", authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Некорректный id" });
    const itemRes = await pool.query(
      `
      SELECT id, title, description, status, content, tags, published_article_id, published_topic_id, created_at, updated_at
      FROM articles_queue
      WHERE id = $1
      LIMIT 1
    `,
      [id]
    );
    if (!itemRes.rows.length) return res.status(404).json({ message: "Запись не найдена" });
    return res.json({ item: mapQueue(itemRes.rows[0]) });
  } catch (e) {
    console.error("GET /api/articles-queue/:id", e);
    return res.status(500).json({ message: "Не удалось загрузить запись очереди" });
  }
});

articlesQueueRouter.post("/", authRequired, async (req, res) => {
  try {
    const { title, description, status = "draft", tags = [] } = req.body || {};
    const trimmedTitle = String(title || "").trim();
    if (!trimmedTitle) return res.status(400).json({ message: "Название обязательно" });
    const normalizedStatus = VALID_STATUSES.has(status) ? status : "draft";

    const ins = await pool.query(
      `
      INSERT INTO articles_queue (title, description, status, tags)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, description, status, content, tags, published_article_id, published_topic_id, created_at, updated_at
    `,
      [trimmedTitle, description || null, normalizedStatus, normalizeTags(tags)]
    );
    return res.status(201).json({ item: mapQueue(ins.rows[0]) });
  } catch (e) {
    console.error("POST /api/articles-queue", e);
    return res.status(500).json({ message: "Не удалось создать запись" });
  }
});

articlesQueueRouter.patch("/:id", authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Некорректный id" });
    const { title, description, status, content, tags = [] } = req.body || {};
    if (!title && !description && !status && typeof content === "undefined" && !tags) {
      return res.status(400).json({ message: "Нет данных для обновления" });
    }
    const normalizedStatus = status && VALID_STATUSES.has(status) ? status : null;
    const normalizedTags = tags ? normalizeTags(tags) : null;

    const updates = [];
    const params = [];
    if (title !== undefined) {
      params.push(String(title || "").trim() || null);
      updates.push(`title = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description || null);
      updates.push(`description = $${params.length}`);
    }
    if (normalizedStatus) {
      params.push(normalizedStatus);
      updates.push(`status = $${params.length}`);
    }
    if (typeof content !== "undefined") {
      params.push(content || null);
      updates.push(`content = $${params.length}`);
    }
    if (normalizedTags) {
      params.push(normalizedTags);
      updates.push(`tags = $${params.length}`);
    }
    params.push(id);
    const updateSql = `
      UPDATE articles_queue
      SET ${updates.join(", ")}, updated_at = now()
      WHERE id = $${params.length}
      RETURNING id, title, description, status, content, tags, published_article_id, published_topic_id, created_at, updated_at
    `;
    const upd = await pool.query(updateSql, params);
    if (!upd.rows.length) return res.status(404).json({ message: "Запись не найдена" });
    return res.json({ item: mapQueue(upd.rows[0]) });
  } catch (e) {
    console.error("PATCH /api/articles-queue/:id", e);
    return res.status(500).json({ message: "Не удалось обновить запись" });
  }
});

articlesQueueRouter.post("/:id/publish", authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Некорректный id" });
    const { topicId } = req.body || {};
    const topic = Number(topicId);
    if (!Number.isFinite(topic)) return res.status(400).json({ message: "Нужно выбрать тему" });

    const topicRes = await pool.query(
      "SELECT id, slug, title, description, tags, parent_topic_id FROM topics WHERE id = $1 LIMIT 1",
      [topic]
    );
    if (!topicRes.rows.length) return res.status(404).json({ message: "Тема не найдена" });

    const queueRes = await pool.query(
      `
      SELECT id, title, description, status, content, tags
      FROM articles_queue
      WHERE id = $1
      LIMIT 1
    `,
      [id]
    );
    if (!queueRes.rows.length) return res.status(404).json({ message: "Запись очереди не найдена" });
    const queueItem = queueRes.rows[0];
    if (!queueItem.content) {
      return res.status(400).json({ message: "Добавьте контент статьи перед публикацией" });
    }
    if (queueItem.status === "published") {
      return res.status(400).json({ message: "Статья уже опубликована" });
    }

    const articleIns = await pool.query(
      `
      INSERT INTO articles (topic_id, queue_id, title, summary, content, tags)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, topic_id, queue_id, title, summary, content, tags, created_at, updated_at
    `,
      [
        topicRes.rows[0].id,
        queueItem.id,
        queueItem.title,
        queueItem.description,
        queueItem.content,
        queueItem.tags || [],
      ]
    );

    await pool.query(
      `
      UPDATE articles_queue
      SET status = 'published',
          published_article_id = $1,
          published_topic_id = $2,
          updated_at = now()
      WHERE id = $3
    `,
      [articleIns.rows[0].id, topicRes.rows[0].id, queueItem.id]
    );

    const breadcrumbs = await breadcrumbsForTopic(topicRes.rows[0].id);
    return res.status(201).json({
      article: mapArticle(articleIns.rows[0]),
      topic: mapTopic(topicRes.rows[0]),
      breadcrumbs,
    });
  } catch (e) {
    console.error("POST /api/articles-queue/:id/publish", e);
    return res.status(500).json({ message: "Не удалось опубликовать статью" });
  }
});

articlesQueueRouter.delete("/:id", authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Некорректный id" });
    const del = await pool.query(
      `
      DELETE FROM articles_queue
      WHERE id = $1
      RETURNING id
    `,
      [id]
    );
    if (!del.rows.length) return res.status(404).json({ message: "Запись не найдена" });
    return res.json({ message: "Удалено" });
  } catch (e) {
    console.error("DELETE /api/articles-queue/:id", e);
    return res.status(500).json({ message: "Не удалось удалить запись" });
  }
});

export { analyticsRouter, articlesRouter, articlesQueueRouter };
