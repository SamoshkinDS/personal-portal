import express from "express";
import { authRequired, requirePermission } from "../middleware/auth.js";
import { pool } from "../db/connect.js";
import { VALID_STATUSES, ensurePromptmasterSchema } from "../db/promptmasterSchema.js";

const router = express.Router();

const WEBHOOK_URL = (process.env.PROMPTMASTER_WEBHOOK_URL || "").trim();
const WEBHOOK_TOKEN = (process.env.PROMPTMASTER_WEBHOOK_TOKEN || "").trim();
const RESPONSE_TOKEN = (process.env.PROMPTMASTER_RESPONSE_TOKEN || "").trim();
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

async function dispatchToWebhook(requestId, query) {
  if (!WEBHOOK_URL) {
    return { ok: false, message: "PROMPTMASTER_WEBHOOK_URL is not configured" };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(WEBHOOK_TOKEN ? { Authorization: `Bearer ${WEBHOOK_TOKEN}` } : {}),
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

// Endpoint for n8n to send back responses; token-protected when configured
router.post("/response", async (req, res) => {
  try {
    await ensureSchemaReady();
    if (RESPONSE_TOKEN) {
      const token = (req.headers["x-promptmaster-token"] || req.query.token || "").trim();
      if (token !== RESPONSE_TOKEN) {
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

export default router;
