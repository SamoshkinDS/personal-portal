import express from "express";
import multer from "multer";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../db/connect.js";
import { authRequired, requirePermission } from "../middleware/auth.js";
import { uploadBuffer, deleteByKey, isS3Ready } from "../services/s3Client.js";
import { normalizeUploadFile } from "../utils/imageUpload.js";

const router = express.Router();

const IMAGE_MAX_MB = Number(process.env.IMAGE_MAX_MB) || 10;
const MAX_FILE_SIZE = IMAGE_MAX_MB * 1024 * 1024;
const PREVIEW_WIDTH = Number(process.env.IMAGE_PREVIEW_WIDTH) || 800;
const PREVIEW_QUALITY = Number(process.env.IMAGE_PREVIEW_QUALITY) || 75;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp)$/i.test(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }
    cb(null, true);
  },
});

router.use(authRequired);

router.get("/categories", async (req, res) => {
  try {
    const canManage = await userCanManagePlants(req.user?.id);
    const includeInactive = canManage && String(req.query.all || "") === "1";
    const categories = await fetchCategories({ includeInactive, withCounts: true });
    res.json({ categories });
  } catch (error) {
    console.error("GET /api/plants/tools/categories", error);
    return respondError(res, error, "Не удалось загрузить категории");
  }
});

router.put("/categories/:id", requirePermission("plants_admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Некорректный id" });
    const name = toNullableText(req.body?.name);
    const slug = normalizeSlug(req.body?.slug);
    const icon = toNullableText(req.body?.icon);
    const isActive = parseBoolean(req.body?.is_active);
    const sortOrder = toNullableInt(req.body?.sort_order, 0);
    if (!name) return res.status(400).json({ message: "Укажите название категории" });
    if (!slug) return res.status(400).json({ message: "Укажите slug категории" });

    const updated = await pool.query(
      `UPDATE tools_categories
       SET name = $1, slug = $2, icon = $3, is_active = $4, sort_order = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING id, name, slug, icon, is_active, sort_order`,
      [name, slug, icon, isActive, sortOrder, id]
    );
    if (!updated.rows.length) {
      return res.status(404).json({ message: "Категория не найдена" });
    }
    res.json({ category: updated.rows[0] });
  } catch (error) {
    console.error("PUT /api/plants/tools/categories/:id", error);
    if (isUniqueViolation(error)) {
      return res.status(400).json({ message: "Категория с таким slug уже существует" });
    }
    return respondError(res, error, "Не удалось сохранить категорию");
  }
});

router.post("/items", requirePermission("plants_admin"), upload.single("photo"), async (req, res) => {
  try {
    const payload = parseItemPayload(req.body);
    if (!payload.name) return res.status(400).json({ message: "Название обязательно" });
    const category = await resolveCategory(payload.category_id, payload.category_slug);
    if (!category) return res.status(404).json({ message: "Категория не найдена" });

    const inserted = await pool.query(
      `INSERT INTO tools_items (category_id, name, description, buy_link, extra_fields, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        category.id,
        payload.name,
        payload.description,
        payload.buy_link,
        payload.extra_fields,
        payload.sort_order,
      ]
    );

    const itemId = inserted.rows[0].id;
    if (req.file) {
      const photo = await savePhoto({
        file: req.file,
        categorySlug: category.slug,
        itemId,
      });
      await pool.query(
        `UPDATE tools_items
         SET photo_url = $1, photo_preview_url = $2, photo_key = $3, photo_preview_key = $4
         WHERE id = $5`,
        [photo.photo_url, photo.photo_preview_url, photo.photo_key, photo.photo_preview_key, itemId]
      );
    }

    const item = await fetchItem(itemId);
    res.status(201).json({ item });
  } catch (error) {
    console.error("POST /api/plants/tools/items", error);
    return respondError(res, error, "Не удалось создать элемент");
  }
});

router.patch("/items/:id", requirePermission("plants_admin"), upload.single("photo"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Некорректный id" });
    const existing = await fetchItem(id);
    if (!existing) return res.status(404).json({ message: "Элемент не найден" });

    const payload = parseItemPayload(req.body, true);
    const updates = [];
    const params = [];

    if (payload.name !== undefined) {
      if (!payload.name) return res.status(400).json({ message: "Название обязательно" });
      updates.push(`name = $${updates.length + 1}`);
      params.push(payload.name);
    }
    if (payload.description !== undefined) {
      updates.push(`description = $${updates.length + 1}`);
      params.push(payload.description);
    }
    if (payload.buy_link !== undefined) {
      updates.push(`buy_link = $${updates.length + 1}`);
      params.push(payload.buy_link);
    }
    if (payload.extra_fields !== undefined) {
      updates.push(`extra_fields = $${updates.length + 1}`);
      params.push(payload.extra_fields);
    }
    if (payload.sort_order !== undefined) {
      updates.push(`sort_order = $${updates.length + 1}`);
      params.push(payload.sort_order);
    }
    if (payload.category_id || payload.category_slug) {
      const category = await resolveCategory(payload.category_id, payload.category_slug);
      if (!category) return res.status(404).json({ message: "Категория не найдена" });
      updates.push(`category_id = $${updates.length + 1}`);
      params.push(category.id);
      existing.category_slug = category.slug;
    }

    if (updates.length) {
      params.push(id);
      await pool.query(
        `UPDATE tools_items SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${params.length}`,
        params
      );
    }

    if (req.file) {
      const categorySlug = payload.category_slug || existing.category_slug;
      const photo = await savePhoto({
        file: req.file,
        categorySlug,
        itemId: id,
        previous: {
          photo_key: existing.photo_key,
          photo_preview_key: existing.photo_preview_key,
        },
      });
      await pool.query(
        `UPDATE tools_items
         SET photo_url = $1, photo_preview_url = $2, photo_key = $3, photo_preview_key = $4, updated_at = NOW()
         WHERE id = $5`,
        [photo.photo_url, photo.photo_preview_url, photo.photo_key, photo.photo_preview_key, id]
      );
    }

    const item = await fetchItem(id);
    res.json({ item });
  } catch (error) {
    console.error("PATCH /api/plants/tools/items/:id", error);
    return respondError(res, error, "Не удалось сохранить элемент");
  }
});

router.delete("/items/:id", requirePermission("plants_admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Некорректный id" });
    const existing = await fetchItem(id);
    if (!existing) return res.status(404).json({ message: "Элемент не найден" });

    await pool.query("DELETE FROM tools_items WHERE id = $1", [id]);
    await removeAssets(existing);

    res.json({ message: "Удалено" });
  } catch (error) {
    console.error("DELETE /api/plants/tools/items/:id", error);
    return respondError(res, error, "Не удалось удалить элемент");
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const canManage = await userCanManagePlants(req.user?.id);
    const category = await fetchCategoryBySlug(req.params.slug, { includeInactive: canManage });
    if (!category) return res.status(404).json({ message: "Категория не найдена" });
    const items = await fetchItems(category.id);
    res.json({ category, items });
  } catch (error) {
    console.error("GET /api/plants/tools/:slug", error);
    return respondError(res, error, "Не удалось загрузить раздел");
  }
});

router.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: `Файл слишком большой. Максимум ${IMAGE_MAX_MB} МБ.` });
    }
    return res.status(400).json({ message: error.message });
  }
  if (error.message === "Unsupported file type") {
    return res.status(400).json({ message: "Поддерживаемые форматы: jpeg, png, webp" });
  }
  return next(error);
});

export default router;

async function fetchCategories({ includeInactive = false, withCounts = false } = {}) {
  const parts = [];
  const params = [];
  if (!includeInactive) {
    parts.push("c.is_active = TRUE");
  }
  const where = parts.length ? `WHERE ${parts.join(" AND ")}` : "";
  const joins = withCounts ? "LEFT JOIN tools_items ti ON ti.category_id = c.id" : "";
  const countSelect = withCounts ? ", COUNT(ti.id)::int AS items_count" : "";
  const group = withCounts ? "GROUP BY c.id" : "";
  const q = await pool.query(
    `SELECT c.id, c.name, c.slug, c.icon, c.is_active, c.sort_order${countSelect}
     FROM tools_categories c
     ${joins}
     ${where}
     ${group}
     ORDER BY c.sort_order ASC, LOWER(c.name);`,
    params
  );
  return q.rows;
}

async function fetchCategoryBySlug(slug, { includeInactive = false } = {}) {
  const clauses = ["slug = $1"];
  const params = [slug];
  if (!includeInactive) {
    clauses.push("is_active = TRUE");
  }
  const q = await pool.query(
    `SELECT id, name, slug, icon, is_active, sort_order
     FROM tools_categories
     WHERE ${clauses.join(" AND ")}
     LIMIT 1;`,
    params
  );
  return q.rows[0] || null;
}

async function fetchItems(categoryId) {
  const q = await pool.query(
    `SELECT
      i.id,
      i.name,
      i.description,
      i.photo_url,
      i.photo_preview_url,
      i.buy_link,
      i.extra_fields,
      i.sort_order,
      i.category_id,
      c.name AS category_name,
      c.slug AS category_slug
     FROM tools_items i
     JOIN tools_categories c ON c.id = i.category_id
     WHERE i.category_id = $1
     ORDER BY i.sort_order ASC, LOWER(i.name);`,
    [categoryId]
  );
  return q.rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    photo_url: row.photo_preview_url || row.photo_url,
    buy_link: row.buy_link,
    extra_fields: row.extra_fields || {},
    sort_order: row.sort_order,
    category_slug: row.category_slug,
    category: {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
    },
    full_image_url: row.photo_url,
    photo_preview_url: row.photo_preview_url,
  }));
}

async function fetchItem(id) {
  const q = await pool.query(
    `SELECT
      i.id,
      i.name,
      i.description,
      i.photo_url,
      i.photo_preview_url,
      i.photo_key,
      i.photo_preview_key,
      i.buy_link,
      i.extra_fields,
      i.sort_order,
      i.category_id,
      c.name AS category_name,
      c.slug AS category_slug
     FROM tools_items i
     JOIN tools_categories c ON c.id = i.category_id
     WHERE i.id = $1
     LIMIT 1;`,
    [id]
  );
  const row = q.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    photo_url: row.photo_url,
    photo_preview_url: row.photo_preview_url,
    photo_key: row.photo_key,
    photo_preview_key: row.photo_preview_key,
    buy_link: row.buy_link,
    extra_fields: row.extra_fields || {},
    sort_order: row.sort_order,
    category_id: row.category_id,
    category_name: row.category_name,
    category_slug: row.category_slug,
  };
}

async function resolveCategory(categoryId, categorySlug) {
  if (categoryId) {
    const q = await pool.query("SELECT id, name, slug FROM tools_categories WHERE id = $1", [categoryId]);
    if (q.rows.length) return q.rows[0];
  }
  if (categorySlug) {
    const q = await pool.query("SELECT id, name, slug FROM tools_categories WHERE slug = $1", [categorySlug]);
    if (q.rows.length) return q.rows[0];
  }
  return null;
}

function parseItemPayload(body = {}, allowPartial = false) {
  const payload = {
    name: toNullableText(body.name),
    description: toNullableText(body.description),
    buy_link: toNullableText(body.buy_link),
    category_id: toNullableInt(body.category_id),
    category_slug: toNullableText(body.category_slug),
    sort_order: toNullableInt(body.sort_order, 0),
    extra_fields: parseExtraFields(body.extra_fields),
  };
  if (!allowPartial && payload.extra_fields === undefined) {
    payload.extra_fields = {};
  }
  if (allowPartial) {
    Object.keys(payload).forEach((key) => {
      if (body[key] === undefined) delete payload[key];
    });
  }
  return payload;
}

function parseExtraFields(raw) {
  if (raw === undefined) return undefined;
  if (raw === null || raw === "") return {};
  if (typeof raw === "object") return normalizeExtraFields(raw);
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return normalizeExtraFields(parsed);
    }
  } catch {
    // ignore
  }
  return {};
}

function normalizeExtraFields(obj) {
  const result = {};
  Object.entries(obj || {}).forEach(([key, value]) => {
    if (value === undefined) return;
    if (key === "plants" || key === "plant_ids") {
      result.plants = parseIntArray(value);
      return;
    }
    result[key] = value;
  });
  return result;
}

async function savePhoto({ file, categorySlug, itemId, previous }) {
  if (!isS3Ready()) {
    throw validationError("S3 не настроен, загрузка фото недоступна");
  }
  const normalized = await normalizeUploadFile(file);
  const baseKey = `tools/${categorySlug || "items"}/${itemId}-${uuidv4()}.${normalized.extension}`;
  const previewKey = `tools/${categorySlug || "items"}/${itemId}-preview-${uuidv4()}.webp`;

  const [fullBuffer, previewBuffer] = await Promise.all([
    Promise.resolve(normalized.buffer),
    sharp(normalized.buffer)
      .resize({ width: PREVIEW_WIDTH })
      .withMetadata()
      .webp({ quality: PREVIEW_QUALITY })
      .toBuffer(),
  ]);

  const [photo_url, photo_preview_url] = await Promise.all([
    uploadBuffer({
      key: baseKey,
      body: fullBuffer,
      contentType: file.mimetype || "image/jpeg",
    }),
    uploadBuffer({
      key: previewKey,
      body: previewBuffer,
      contentType: "image/webp",
    }),
  ]);

  if (previous?.photo_key) await deleteByKey(previous.photo_key);
  if (previous?.photo_preview_key) await deleteByKey(previous.photo_preview_key);

  return {
    photo_url,
    photo_preview_url,
    photo_key: baseKey,
    photo_preview_key: previewKey,
  };
}

async function removeAssets(item) {
  if (!isS3Ready()) return;
  await Promise.all([deleteByKey(item.photo_key), deleteByKey(item.photo_preview_key)]);
}

async function userCanManagePlants(userId) {
  if (!userId) return false;
  const userRow = await pool.query("SELECT role FROM users WHERE id = $1", [userId]);
  if (userRow.rows[0]?.role === "ALL") return true;
  const permRow = await pool.query(
    "SELECT 1 FROM user_permissions WHERE user_id = $1 AND perm_key = $2 LIMIT 1",
    [userId, "plants_admin"]
  );
  return permRow.rows.length > 0;
}

function toNullableText(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

function toNullableInt(value, fallback = null) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

function parseBoolean(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return false;
  return ["1", "true", "yes", "on", "да", "y"].includes(normalized);
}

function parseIntArray(value) {
  if (!value) return [];
  const arr = Array.isArray(value) ? value : String(value).split(",");
  return arr
    .map((item) => Number(item))
    .filter((num) => Number.isFinite(num) && num > 0);
}

function normalizeSlug(value) {
  if (value === undefined || value === null) return "";
  const slug = String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0400-\u04FF_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug;
}

function isUniqueViolation(error) {
  return error?.code === "23505";
}

function validationError(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function respondError(res, error, fallback) {
  if (error?.status && Number.isInteger(error.status)) {
    return res.status(error.status).json({ message: error.message });
  }
  return res.status(500).json({ message: fallback });
}
