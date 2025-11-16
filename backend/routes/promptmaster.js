import express from "express";
import { authRequired, requirePermission } from "../middleware/auth.js";
import { pool } from "../db/connect.js";
import { VALID_STATUSES, ensurePromptmasterSchema } from "../db/promptmasterSchema.js";

const router = express.Router();

let schemaReadyPromise = null;

function parseId(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function ensureSchemaReady() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = ensurePromptmasterSchema().catch((err) => {
      schemaReadyPromise = null;
      throw err;
    });
  }
  return schemaReadyPromise;
}

async function guarded(asyncHandler) {
  await ensureSchemaReady();
  return asyncHandler();
}

let cachedSettings = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

async function loadSettings() {
  const now = Date.now();
  if (cachedSettings && now - cachedAt < CACHE_TTL_MS) return cachedSettings;
  const rows = await pool.query(
    `
    SELECT key, value
    FROM prompt_settings
  `
  );
  const map = new Map(rows.rows.map((r) => [r.key, r.value]));
  cachedSettings = {
    webhookUrl: (process.env.PROMPTMASTER_WEBHOOK_URL || map.get("webhookUrl") || "").trim(),
    webhookToken: (process.env.PROMPTMASTER_WEBHOOK_TOKEN || map.get("webhookToken") || "").trim(),
    responseToken: (process.env.PROMPTMASTER_RESPONSE_TOKEN || map.get("responseToken") || "").trim(),
  };
  cachedAt = now;
  return cachedSettings;
}

async function saveSettings(partial = {}) {
  const entries = Object.entries(partial).filter(([, v]) => v !== undefined);
  for (const [key, value] of entries) {
    await pool.query(
      `
      INSERT INTO prompt_settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `,
      [key, value]
    );
  }
  cachedAt = 0;
  return loadSettings();
}

async function dispatchToWebhook(requestId, query) {
  const cfg = await loadSettings();
  if (!cfg.webhookUrl) {
    return { ok: false, message: "PROMPTMASTER_WEBHOOK_URL is not configured" };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(cfg.webhookUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(cfg.webhookToken ? { Authorization: `Bearer ${cfg.webhookToken}` } : {}),
      },
      body: JSON.stringify({ request_id: requestId, query }),
    });
    clearTimeout(timeout);
    if (res.ok) return { ok: true };
    const text = await res.text().catch(() => "");
    return { ok: false, message: text || `Webhook responded with ${res.status}` };
  } catch (error) {
    return { ok: false, message: error.message || "Webhook call failed" };
  }
}

function mapRequest(row) {
  return {
    id: row.id,
    query: row.query,
    result: row.result,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function fetchListing(parentId) {
  const params = [];
  let where = "parent_category_id IS NULL";
  if (typeof parentId === "number") {
    params.push(parentId);
    where = "parent_category_id = $1";
  } else if (parentId === null) {
    // explicit root
    where = "parent_category_id IS NULL";
  }

  const catQuery = await pool.query(
    `
    SELECT id, title, description, parent_category_id, created_at, updated_at
    FROM prompt_categories
    WHERE ${where}
    ORDER BY title
  `,
    params
  );

  const artQuery = await pool.query(
    `
    SELECT id, category_id, title, description, content, created_at, updated_at
    FROM prompt_articles
    WHERE ${where.replace("parent_category_id", "category_id")}
    ORDER BY title
  `,
    params
  );

  return { categories: catQuery.rows, articles: artQuery.rows };
}

async function fetchAllCategories() {
  const { rows } = await pool.query(
    `
    SELECT id, title, description, parent_category_id, created_at, updated_at
    FROM prompt_categories
    ORDER BY title
  `
  );
  return rows;
}

// Endpoint for n8n to send back responses; token-protected when configured
router.post("/response", async (req, res) => {
  try {
    await ensureSchemaReady();
    const cfg = await loadSettings();
    const responseToken = cfg.responseToken;
    if (responseToken) {
      const token = (req.headers["x-promptmaster-token"] || req.query.token || "").trim();
      if (token !== responseToken) {
        return res.status(403).json({ message: "Invalid response token" });
      }
    }

    const requestId = parseId(req.body?.request_id);
    if (!requestId) return res.status(400).json({ message: "request_id is required" });

    const incomingStatus = String(req.body?.status || "").toLowerCase();
    const nextStatus = VALID_STATUSES.has(incomingStatus) ? incomingStatus : "done";
    const result = typeof req.body?.result_prompt === "string" ? req.body.result_prompt : null;
    const updated = await pool.query(
      `
      UPDATE prompt_requests
      SET status = $1,
          result = COALESCE($2, result),
          updated_at = now()
      WHERE id = $3
      RETURNING id, query, result, status, created_at, updated_at
    `,
      [nextStatus, result, requestId]
    );
    if (!updated.rows.length) return res.status(404).json({ message: "Request not found" });
    return res.json({ request: mapRequest(updated.rows[0]) });
  } catch (error) {
    console.error("POST /api/promptmaster/response error", error);
    return res.status(500).json({ message: "Failed to accept response" });
  }
});

// Authenticated routes
router.use(authRequired, requirePermission(["view_ai"]));

router.get("/requests", async (req, res) => {
  try {
    await guarded(async () => {});
    const limitRaw = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 100;
    const list = await pool.query(
      `
      SELECT id, query, result, status, created_at, updated_at
      FROM prompt_requests
      ORDER BY created_at DESC
      LIMIT $1
    `,
      [limit]
    );
    return res.json({ requests: list.rows.map(mapRequest) });
  } catch (error) {
    console.error("GET /api/promptmaster/requests error", error);
    return res.status(500).json({ message: "Failed to load requests" });
  }
});

router.post("/requests", async (req, res) => {
  try {
    await guarded(async () => {});
    const query = String(req.body?.query || "").trim();
    if (!query) return res.status(400).json({ message: "query is required" });

    const created = await pool.query(
      `
      INSERT INTO prompt_requests (query, status)
      VALUES ($1, 'draft')
      RETURNING id, query, result, status, created_at, updated_at
    `,
      [query]
    );
    let request = mapRequest(created.rows[0]);

    const webhookResult = await dispatchToWebhook(request.id, request.query);
    const nextStatus = webhookResult.ok ? "sent" : "error";
    const updated = await pool.query(
      `
      UPDATE prompt_requests
      SET status = $1, updated_at = now()
      WHERE id = $2
      RETURNING id, query, result, status, created_at, updated_at
    `,
      [nextStatus, request.id]
    );
    request = mapRequest(updated.rows[0]);

    return res.status(webhookResult.ok ? 201 : 202).json({ request, webhook: webhookResult });
  } catch (error) {
    console.error("POST /api/promptmaster/requests error", error);
    return res.status(500).json({ message: "Failed to create request" });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    await guarded(async () => {});
    const requestId = parseId(req.body?.request_id || req.body?.id);
    if (!requestId) return res.status(400).json({ message: "request_id is required" });
    const overrideQuery = typeof req.body?.query === "string" ? req.body.query.trim() : null;

    const existing = await pool.query(
      `
      SELECT id, query, result, status, created_at, updated_at
      FROM prompt_requests
      WHERE id = $1
    `,
      [requestId]
    );
    if (!existing.rows.length) return res.status(404).json({ message: "Request not found" });
    const payloadQuery = overrideQuery || existing.rows[0].query;

    const webhookResult = await dispatchToWebhook(requestId, payloadQuery);
    const nextStatus = webhookResult.ok ? "sent" : "error";
    const updated = await pool.query(
      `
      UPDATE prompt_requests
      SET query = $1, status = $2, updated_at = now()
      WHERE id = $3
      RETURNING id, query, result, status, created_at, updated_at
    `,
      [payloadQuery, nextStatus, requestId]
    );
    return res.json({ request: mapRequest(updated.rows[0]), webhook: webhookResult });
  } catch (error) {
    console.error("POST /api/promptmaster/webhook error", error);
    return res.status(500).json({ message: "Failed to call webhook" });
  }
});

router.get("/categories", async (req, res) => {
  try {
    await guarded(async () => {});
    const parentRaw = req.query.parentId ?? req.query.parent_id;
    const parentId = parentRaw === undefined ? undefined : parseId(parentRaw);
    const includeAll = String(req.query.all || "").toLowerCase() === "true";
    if (includeAll) {
      const categories = await fetchAllCategories();
      return res.json({ categories, articles: [] });
    }
    const listing = await fetchListing(parentId ?? null);
    return res.json(listing);
  } catch (error) {
    console.error("GET /api/promptmaster/categories error", error);
    return res.status(500).json({ message: "Failed to load categories" });
  }
});

router.get("/categories/:id", async (req, res) => {
  try {
    await guarded(async () => {});
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const category = await pool.query(
      `
      SELECT id, title, description, parent_category_id, created_at, updated_at
      FROM prompt_categories
      WHERE id = $1
      LIMIT 1
    `,
      [id]
    );
    if (!category.rows.length) return res.status(404).json({ message: "Category not found" });
    const listing = await fetchListing(id);

    return res.json({
      category: category.rows[0],
      children: listing.categories,
      articles: listing.articles,
    });
  } catch (error) {
    console.error("GET /api/promptmaster/categories/:id error", error);
    return res.status(500).json({ message: "Failed to load category" });
  }
});

router.post("/categories", async (req, res) => {
  try {
    await guarded(async () => {});
    const title = String(req.body?.title || "").trim();
    const description = req.body?.description ? String(req.body.description).trim() : null;
    const parentIdRaw = req.body?.parentId ?? req.body?.parent_id ?? null;
    const parentId = parentIdRaw === null || parentIdRaw === undefined ? null : parseId(parentIdRaw);
    if (!title) return res.status(400).json({ message: "title is required" });

    let parent = null;
    if (parentId) {
      const parentRes = await pool.query(
        `
        SELECT id, title, description
        FROM prompt_categories
        WHERE id = $1
        LIMIT 1
      `,
        [parentId]
      );
      if (!parentRes.rows.length) return res.status(404).json({ message: "Parent category not found" });
      parent = parentRes.rows[0];
    }

    const inserted = await pool.query(
      `
      INSERT INTO prompt_categories (title, description, parent_category_id)
      VALUES ($1, $2, $3)
      RETURNING id, title, description, parent_category_id, created_at, updated_at
    `,
      [title, description || null, parent?.id || null]
    );
    return res.status(201).json({ category: inserted.rows[0] });
  } catch (error) {
    console.error("POST /api/promptmaster/categories error", error);
    return res.status(500).json({ message: "Failed to create category" });
  }
});

router.post("/articles", async (req, res) => {
  try {
    await guarded(async () => {});
    const title = String(req.body?.title || "").trim();
    const description = req.body?.description ? String(req.body.description).trim() : null;
    const content = req.body?.content ? String(req.body.content).trim() : null;
    const categoryId = parseId(req.body?.categoryId || req.body?.category_id);

    if (!title) return res.status(400).json({ message: "title is required" });
    if (!categoryId) return res.status(400).json({ message: "categoryId is required" });

    const cat = await pool.query(
      `
      SELECT id FROM prompt_categories WHERE id = $1 LIMIT 1
    `,
      [categoryId]
    );
    if (!cat.rows.length) return res.status(404).json({ message: "Category not found" });

    const inserted = await pool.query(
      `
      INSERT INTO prompt_articles (category_id, title, description, content)
      VALUES ($1, $2, $3, $4)
      RETURNING id, category_id, title, description, content, created_at, updated_at
    `,
      [categoryId, title, description || null, content || null]
    );
    return res.status(201).json({ article: inserted.rows[0] });
  } catch (error) {
    console.error("POST /api/promptmaster/articles error", error);
    return res.status(500).json({ message: "Failed to create article" });
  }
});

router.get("/articles/:id", async (req, res) => {
  try {
    await guarded(async () => {});
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    const art = await pool.query(
      `
      SELECT a.id, a.category_id, a.title, a.description, a.content, a.created_at, a.updated_at,
             c.title AS category_title, c.parent_category_id
      FROM prompt_articles a
      LEFT JOIN prompt_categories c ON c.id = a.category_id
      WHERE a.id = $1
      LIMIT 1
    `,
      [id]
    );
    if (!art.rows.length) return res.status(404).json({ message: "Article not found" });
    return res.json({ article: art.rows[0] });
  } catch (error) {
    console.error("GET /api/promptmaster/articles/:id error", error);
    return res.status(500).json({ message: "Failed to load article" });
  }
});

router.get("/settings", async (req, res) => {
  try {
    await guarded(async () => {});
    const cfg = await loadSettings();
    return res.json({ settings: cfg });
  } catch (error) {
    console.error("GET /api/promptmaster/settings error", error);
    return res.status(500).json({ message: "Failed to load settings" });
  }
});

router.post("/settings", async (req, res) => {
  try {
    await guarded(async () => {});
    const next = await saveSettings({
      webhookUrl: req.body?.webhookUrl,
      webhookToken: req.body?.webhookToken,
      responseToken: req.body?.responseToken,
    });
    return res.json({ settings: next });
  } catch (error) {
    console.error("POST /api/promptmaster/settings error", error);
    return res.status(500).json({ message: "Failed to save settings" });
  }
});

export default router;
