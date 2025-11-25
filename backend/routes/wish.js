import express from "express";
import multer from "multer";
import path from "path";
import { pool } from "../db/connect.js";
import { authRequired } from "../middleware/auth.js";
import { uploadFile, deleteFile } from "../services/storageService.js";
import { isS3Ready } from "../services/s3Client.js";
import { normalizeArchiveReason, normalizePriority } from "../db/wishSchema.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Только PNG/JPEG файлы"));
    }
    cb(null, true);
  },
});

router.use(authRequired);

function respond(res, status, payload) {
  return res.status(status).json({
    success: payload.success,
    data: payload.data ?? null,
    error: payload.error ?? null,
  });
}

function safeFileName(name = "") {
  const ext = path.extname(name) || "";
  const base = name.replace(ext, "").replace(/[^a-z0-9._-]+/gi, "-") || "wish";
  return `${base}${ext || ".jpg"}`;
}

function mapWish(row) {
  const asDate = (value, withTime = false) => {
    if (!value) return null;
    if (value instanceof Date) {
      return withTime ? value.toISOString() : value.toISOString().slice(0, 10);
    }
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return null;
      return withTime ? d.toISOString() : d.toISOString().slice(0, 10);
    } catch {
      return null;
    }
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

function parsePrice(raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 0) return NaN;
  return Math.round(num * 100) / 100;
}

function parseTargetDate(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

async function handleImageUpload(file, userId, currentKey = null) {
  let imageUrl = null;
  let imageKey = currentKey || null;
  if (!file) return { imageUrl, imageKey };
  if (!isS3Ready()) {
    const error = new Error("S3 недоступен для загрузки изображений");
    error.status = 503;
    throw error;
  }
  const ext = path.extname(file.originalname || "") || ".jpg";
  const key = `wish/${userId}/${Date.now()}-${safeFileName(file.originalname || `wish${ext}`)}`;
  imageUrl = await uploadFile({ body: file.buffer, key, contentType: file.mimetype });
  if (currentKey && currentKey !== key) {
    await deleteFile(currentKey);
  }
  imageKey = key;
  return { imageUrl, imageKey };
}

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, title, price, priority, link, description, target_date, created_at, updated_at, archived_at, archive_reason, image_url
       FROM wish_items
       WHERE user_id = $1
       ORDER BY archived_at NULLS FIRST, priority DESC, created_at DESC`,
      [req.user.id]
    );
    const items = rows.map(mapWish);
    const active = items.filter((item) => !item.archivedAt);
    const archived = items.filter((item) => Boolean(item.archivedAt));
    return respond(res, 200, { success: true, data: { active, archived } });
  } catch (err) {
    console.error("GET /api/wish", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить wish list" });
  }
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    if (!title) {
      return respond(res, 400, { success: false, error: "Название обязательно" });
    }
    const price = parsePrice(req.body?.price);
    if (Number.isNaN(price)) {
      return respond(res, 400, { success: false, error: "Цена должна быть неотрицательным числом" });
    }
    const priority = normalizePriority(req.body?.priority);
    const link = req.body?.link ? String(req.body.link).trim().slice(0, 1000) : null;
    const description = req.body?.description ? String(req.body.description).trim().slice(0, 2000) : null;
    const targetDateRaw = req.body?.targetDate || req.body?.target_date;
    const targetDate = targetDateRaw ? parseTargetDate(targetDateRaw) : null;
    if (targetDateRaw && !targetDate) {
      return respond(res, 400, { success: false, error: "Неверный формат даты" });
    }

    let imageUrl = null;
    let imageKey = null;
    if (req.file) {
      const uploaded = await handleImageUpload(req.file, req.user.id);
      imageUrl = uploaded.imageUrl;
      imageKey = uploaded.imageKey;
    }

    const { rows } = await pool.query(
      `INSERT INTO wish_items (user_id, title, price, priority, link, description, target_date, archived_at, archive_reason, image_url, image_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NULL,NULL,$8,$9)
       RETURNING *`,
      [req.user.id, title, price, priority, link, description, targetDate, imageUrl, imageKey]
    );
    return respond(res, 201, { success: true, data: { item: mapWish(rows[0]) } });
  } catch (err) {
    console.error("POST /api/wish", err);
    if (err.status === 503) {
      return respond(res, 503, { success: false, error: err.message || "S3 недоступен" });
    }
    if (err.message?.includes("wish list") || err.message?.includes("S3")) {
      return respond(res, 400, { success: false, error: err.message });
    }
    return respond(res, 500, { success: false, error: "Не удалось создать карточку" });
  }
});

router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const id = req.params.id;
    const existing = await pool.query("SELECT * FROM wish_items WHERE id = $1 AND user_id = $2", [id, req.user.id]);
    if (existing.rows.length === 0) {
      return respond(res, 404, { success: false, error: "Элемент не найден или недоступен" });
    }
    const current = existing.rows[0];
    const title = req.body?.title !== undefined ? String(req.body.title || "").trim() : current.title;
    if (!title) {
      return respond(res, 400, { success: false, error: "Название обязательно" });
    }
    const priceRaw = req.body?.price !== undefined ? req.body.price : current.price;
    const price = parsePrice(priceRaw);
    if (Number.isNaN(price)) {
      return respond(res, 400, { success: false, error: "Цена должна быть неотрицательным числом" });
    }
    const priority = req.body?.priority ? normalizePriority(req.body.priority) : current.priority;
    const link =
      req.body?.link !== undefined ? (req.body.link ? String(req.body.link).trim().slice(0, 1000) : null) : current.link;
    const description =
      req.body?.description !== undefined
        ? req.body.description
          ? String(req.body.description).trim().slice(0, 2000)
          : null
        : current.description;
    let targetDate = current.target_date;
    if (req.body?.targetDate !== undefined || req.body?.target_date !== undefined) {
      const targetDateRaw = req.body?.targetDate ?? req.body?.target_date;
      targetDate = targetDateRaw ? parseTargetDate(targetDateRaw) : null;
      if (targetDateRaw && !targetDate) {
        return respond(res, 400, { success: false, error: "Неверный формат даты" });
      }
    }
    const removeImage = String(req.body?.removeImage || "false").toLowerCase() === "true";

    let imageUrl = current.image_url;
    let imageKey = current.image_key;
    if (req.file) {
      const uploaded = await handleImageUpload(req.file, req.user.id, current.image_key);
      imageUrl = uploaded.imageUrl;
      imageKey = uploaded.imageKey;
    } else if (removeImage && current.image_key) {
      await deleteFile(current.image_key);
      imageUrl = null;
      imageKey = null;
    }

    const { rows } = await pool.query(
      `UPDATE wish_items
       SET title = $1,
           price = $2,
           priority = $3,
           link = $4,
           description = $5,
           target_date = $6,
           image_url = $7,
           image_key = $8,
           updated_at = NOW()
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [title, price, priority, link, description, targetDate, imageUrl, imageKey, id, req.user.id]
    );
    return respond(res, 200, { success: true, data: { item: mapWish(rows[0]) } });
  } catch (err) {
    console.error("PUT /api/wish/:id", err);
    if (err.status === 503) {
      return respond(res, 503, { success: false, error: err.message || "S3 недоступен" });
    }
    return respond(res, 500, { success: false, error: "Не удалось обновить карточку" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { rows } = await pool.query("DELETE FROM wish_items WHERE id = $1 AND user_id = $2 RETURNING *", [
      id,
      req.user.id,
    ]);
    if (rows.length === 0) {
      return respond(res, 404, { success: false, error: "Элемент не найден" });
    }
    if (rows[0].image_key) {
      await deleteFile(rows[0].image_key);
    }
    return respond(res, 200, { success: true, data: { message: "Карточка удалена" } });
  } catch (err) {
    console.error("DELETE /api/wish/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось удалить карточку" });
  }
});

router.post("/:id/archive", async (req, res) => {
  try {
    const id = req.params.id;
    const reason = normalizeArchiveReason(req.body?.reason || req.body?.archiveReason);
    if (!reason) {
      return respond(res, 400, { success: false, error: "Нужно выбрать причину архивации" });
    }
    const { rows } = await pool.query(
      `UPDATE wish_items
       SET archived_at = NOW(),
           archive_reason = $1,
           updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [reason, id, req.user.id]
    );
    if (rows.length === 0) {
      return respond(res, 404, { success: false, error: "Элемент не найден" });
    }
    return respond(res, 200, { success: true, data: { item: mapWish(rows[0]) } });
  } catch (err) {
    console.error("POST /api/wish/:id/archive", err);
    return respond(res, 500, { success: false, error: "Не удалось архивировать элемент" });
  }
});

router.post("/:id/unarchive", async (req, res) => {
  try {
    const id = req.params.id;
    const { rows } = await pool.query(
      `UPDATE wish_items
       SET archived_at = NULL,
           archive_reason = NULL,
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.user.id]
    );
    if (rows.length === 0) {
      return respond(res, 404, { success: false, error: "Элемент не найден" });
    }
    return respond(res, 200, { success: true, data: { item: mapWish(rows[0]) } });
  } catch (err) {
    console.error("POST /api/wish/:id/unarchive", err);
    return respond(res, 500, { success: false, error: "Не удалось вернуть элемент из архива" });
  }
});

export default router;
