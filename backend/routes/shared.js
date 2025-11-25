import express from "express";
import crypto from "crypto";
import { pool } from "../db/connect.js";
import { authRequired, requirePermission } from "../middleware/auth.js";

const PAGE_TYPES = ["wish-list"];
const DURATION_MAP = {
  "1h": 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
  "1m": 30 * 24 * 60 * 60 * 1000,
  forever: null,
};

const router = express.Router();
const publicRouter = express.Router();

function respond(res, status, payload) {
  return res.status(status).json({
    success: payload.success,
    data: payload.data ?? null,
    error: payload.error ?? null,
  });
}

function normalizePermissions() {
  // Пока доступны только права на просмотр
  return { view: true, edit: false, create: false, delete: false };
}

function computeExpiresAt({ duration, expiresAt }) {
  if (duration === undefined && expiresAt === undefined) return undefined;
  if (duration && DURATION_MAP.hasOwnProperty(duration)) {
    const ms = DURATION_MAP[duration];
    if (ms === null) return null;
    return new Date(Date.now() + ms).toISOString();
  }
  if (expiresAt) {
    const parsed = new Date(expiresAt);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return null;
}

function mapLink(row) {
  const asDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };
  const expiresAt = asDate(row.expires_at);
  const revoked = Boolean(row.revoked);
  const expired = expiresAt ? new Date(expiresAt) <= new Date() : false;
  const status = revoked ? "revoked" : expired ? "expired" : "active";

  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerUsername: row.owner_username || null,
    pageType: row.page_type,
    permissions: row.permissions || { view: false, edit: false, create: false, delete: false },
    token: row.token,
    createdAt: asDate(row.created_at),
    expiresAt,
    revoked,
    openedAt: asDate(row.opened_at),
    viewsCount: Number(row.views_count) || 0,
    status,
  };
}

async function generateUniqueToken() {
  let attempts = 0;
  while (attempts < 5) {
    const token = crypto.randomBytes(24).toString("hex");
    const check = await pool.query("SELECT 1 FROM shared_links WHERE token = $1 LIMIT 1", [token]);
    if (check.rows.length === 0) return token;
    attempts += 1;
  }
  throw new Error("Не удалось сгенерировать токен");
}

async function userHasAdminAccess(userId) {
  const user = await pool.query("SELECT role FROM users WHERE id = $1", [userId]);
  if (user.rows.length === 0) return false;
  if (user.rows[0].role === "ALL") return true;
  const perms = await pool.query("SELECT 1 FROM user_permissions WHERE user_id = $1 AND perm_key = 'admin_access' LIMIT 1", [userId]);
  return perms.rows.length > 0;
}

async function assertOwnerOrAdmin(linkId, currentUserId) {
  const { rows } = await pool.query("SELECT owner_id FROM shared_links WHERE id = $1", [linkId]);
  if (!rows.length) {
    const error = new Error("Ссылка не найдена");
    error.status = 404;
    throw error;
  }
  const isOwner = rows[0].owner_id === currentUserId;
  const isAdmin = await userHasAdminAccess(currentUserId);
  if (!isOwner && !isAdmin) {
    const error = new Error("Доступ запрещён");
    error.status = 403;
    throw error;
  }
}

router.use(authRequired);

router.get("/", requirePermission("admin_access"), async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT sl.*, u.username AS owner_username
       FROM shared_links sl
       LEFT JOIN users u ON u.id = sl.owner_id
       ORDER BY sl.created_at DESC`
    );
    return respond(res, 200, { success: true, data: { links: rows.map(mapLink) } });
  } catch (err) {
    console.error("GET /api/shared", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить ссылки" });
  }
});

router.post("/", async (req, res) => {
  try {
    const pageType = String(req.body?.pageType || "").trim() || "wish-list";
    if (!PAGE_TYPES.includes(pageType)) {
      return respond(res, 400, { success: false, error: "Тип страницы не поддерживается" });
    }
    const duration = req.body?.duration;
    const expiresAtRaw = computeExpiresAt({ duration, expiresAt: req.body?.expiresAt });
    const expiresAt = expiresAtRaw === undefined ? null : expiresAtRaw;
    let ownerId = req.user.id;
    if (req.body?.ownerId && (await userHasAdminAccess(req.user.id))) {
      const parsed = Number(req.body.ownerId);
      if (Number.isNaN(parsed)) {
        return respond(res, 400, { success: false, error: "ownerId должен быть числом" });
      }
      const ownerExists = await pool.query("SELECT id FROM users WHERE id = $1", [parsed]);
      if (!ownerExists.rows.length) {
        return respond(res, 404, { success: false, error: "Указанный владелец не найден" });
      }
      ownerId = parsed;
    }

    const token = await generateUniqueToken();
    const permissions = normalizePermissions();
    const insert = await pool.query(
      `INSERT INTO shared_links (owner_id, page_type, permissions, token, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [ownerId, pageType, permissions, token, expiresAt]
    );
    const created = mapLink(insert.rows[0]);
    return respond(res, 201, { success: true, data: { link: created } });
  } catch (err) {
    console.error("POST /api/shared", err);
    const status = err.status || 500;
    const message = err.status === 404 ? err.message : "Не удалось создать ссылку";
    return respond(res, status, { success: false, error: message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    await assertOwnerOrAdmin(req.params.id, req.user.id);
    const { rows } = await pool.query(
      `SELECT sl.*, u.username AS owner_username
       FROM shared_links sl
       LEFT JOIN users u ON u.id = sl.owner_id
       WHERE sl.id = $1`,
      [req.params.id]
    );
    if (!rows.length) {
      return respond(res, 404, { success: false, error: "Ссылка не найдена" });
    }
    return respond(res, 200, { success: true, data: { link: mapLink(rows[0]) } });
  } catch (err) {
    console.error("GET /api/shared/:id", err);
    const status = err.status || 500;
    return respond(res, status, { success: false, error: err.message || "Не удалось загрузить ссылку" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    await assertOwnerOrAdmin(req.params.id, req.user.id);
    const duration = req.body?.duration;
    const expiresAt = computeExpiresAt({ duration, expiresAt: req.body?.expiresAt });
    const permissions = normalizePermissions();

    const sets = ["permissions = $1"];
    const values = [permissions];
    if (expiresAt !== undefined) {
      sets.push(`expires_at = $${sets.length + 1}`);
      values.push(expiresAt);
    }
    values.push(req.params.id);

    const update = await pool.query(`UPDATE shared_links SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`, values);
    if (!update.rows.length) {
      return respond(res, 404, { success: false, error: "Ссылка не найдена" });
    }
    return respond(res, 200, { success: true, data: { link: mapLink(update.rows[0]) } });
  } catch (err) {
    console.error("PUT /api/shared/:id", err);
    const status = err.status || 500;
    return respond(res, status, { success: false, error: err.message || "Не удалось обновить ссылку" });
  }
});

router.post("/:id/revoke", async (req, res) => {
  try {
    await assertOwnerOrAdmin(req.params.id, req.user.id);
    const update = await pool.query(
      `UPDATE shared_links
       SET revoked = TRUE
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );
    if (!update.rows.length) {
      return respond(res, 404, { success: false, error: "Ссылка не найдена" });
    }
    return respond(res, 200, { success: true, data: { link: mapLink(update.rows[0]) } });
  } catch (err) {
    console.error("POST /api/shared/:id/revoke", err);
    const status = err.status || 500;
    return respond(res, status, { success: false, error: err.message || "Не удалось отозвать ссылку" });
  }
});

async function loadPublicLink(token) {
  const { rows } = await pool.query(
    `SELECT sl.*, u.username AS owner_username
     FROM shared_links sl
     LEFT JOIN users u ON u.id = sl.owner_id
     WHERE token = $1`,
    [token]
  );
  return rows[0] || null;
}

function mapWish(row) {
  const asDate = (value, withTime = false) => {
    if (!value) return null;
    if (value instanceof Date) {
      return withTime ? value.toISOString() : value.toISOString().slice(0, 10);
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return withTime ? d.toISOString() : d.toISOString().slice(0, 10);
  };

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    price: row.price !== null && row.price !== undefined ? Number(row.price) : null,
    priority: row.priority,
    link: row.link,
    description: row.description,
    targetDate: asDate(row.target_date),
    createdAt: asDate(row.created_at, true),
    updatedAt: asDate(row.updated_at, true),
    archivedAt: asDate(row.archived_at, true),
    archiveReason: row.archive_reason,
    imageUrl: row.image_url,
  };
}

publicRouter.get("/:token", async (req, res) => {
  try {
    const link = await loadPublicLink(req.params.token);
    if (!link) {
      return respond(res, 404, { success: false, error: "Доступ недоступен" });
    }
    const mappedLink = mapLink(link);
    const now = new Date();
    if (mappedLink.revoked || (mappedLink.expiresAt && new Date(mappedLink.expiresAt) <= now) || !mappedLink.permissions?.view) {
      return respond(res, 404, { success: false, error: "Доступ недоступен" });
    }

    const wishes = await pool.query(
      `SELECT id, user_id, title, price, priority, link, description, target_date, created_at, updated_at, archived_at, archive_reason, image_url
       FROM wish_items
       WHERE user_id = $1
       ORDER BY archived_at NULLS FIRST, priority DESC, created_at DESC`,
      [link.owner_id]
    );
    const items = wishes.rows.map(mapWish);
    const active = items.filter((item) => !item.archivedAt);
    const archived = items.filter((item) => Boolean(item.archivedAt));

    await pool.query(
      `UPDATE shared_links
       SET views_count = views_count + 1,
           opened_at = COALESCE(opened_at, NOW())
       WHERE id = $1`,
      [link.id]
    );

    return respond(res, 200, {
      success: true,
      data: { sharedLink: mappedLink, items: { active, archived } },
    });
  } catch (err) {
    console.error("GET /shared/:token", err);
    return respond(res, 500, { success: false, error: "Доступ недоступен" });
  }
});

export default router;
export { publicRouter as sharedPublicRouter };
