import express from "express";
import multer from "multer";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../db/connect.js";
import { authRequired, requirePermission } from "../middleware/auth.js";
import { ensureUniquePlantSlug } from "../utils/slugify.js";
import { uploadBuffer, deleteByKey, isS3Ready } from "../services/s3Client.js";

const router = express.Router();

const IMAGE_MAX_MB = Number(process.env.IMAGE_MAX_MB) || 10;
const MAX_FILE_SIZE = IMAGE_MAX_MB * 1024 * 1024;
const PAGE_LIMIT_DEFAULT = Number(process.env.PLANTS_PAGE_LIMIT) || 24;
const MAX_ALLOWED_LIMIT = 60;
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

const DICT_TABLES = {
  light: "dict_light",
  watering: "dict_watering",
  soil: "dict_soil",
  humidity: "dict_humidity",
  temperature: "dict_temperature",
  locations: "dict_locations",
};

const META_TABLES = new Set([...Object.values(DICT_TABLES), "plant_tags"]);

const STATUS_VALUES = new Set(["created", "in_progress", "done"]);

router.use(authRequired);

router.get("/", async (req, res) => {
  try {
    const limitParam = Number(req.query.limit);
    const offsetParam = Number(req.query.offset);
    const limit = Math.min(
      MAX_ALLOWED_LIMIT,
      Number.isFinite(limitParam) && limitParam > 0 ? limitParam : PAGE_LIMIT_DEFAULT
    );
    const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;
    const params = [];
    const filters = buildFilterClauses(req.query, params);
    const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const sortParam = String(req.query.sort || "alpha_ru");
    const orderBy =
      sortParam === "created_desc"
        ? "p.created_at DESC NULLS LAST"
        : `LOWER(p.common_name) ASC`;

    const itemsQuery = `
      SELECT
        p.id,
        p.slug,
        p.common_name,
        p.main_image_url,
        p.main_preview_url,
        dl.name AS light_name,
        dw.name AS watering_name,
        p.toxicity_for_cats_level,
        p.toxicity_for_dogs_level,
        p.toxicity_for_humans_level
      FROM plants p
      LEFT JOIN dict_light dl ON p.light_id = dl.id
      LEFT JOIN dict_watering dw ON p.watering_id = dw.id
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2};
    `;
    const listParams = params.slice();
    listParams.push(limit);
    listParams.push(offset);
    const [itemsQ, countQ] = await Promise.all([
      pool.query(itemsQuery, listParams),
      pool.query(`SELECT COUNT(*)::int AS count FROM plants p ${whereSql}`, params),
    ]);

    const items = itemsQ.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      common_name: row.common_name,
      main_image_url: row.main_image_url,
      main_preview_url: row.main_preview_url,
      light: row.light_name,
      watering: row.watering_name,
      toxicity: {
        cats: row.toxicity_for_cats_level,
        dogs: row.toxicity_for_dogs_level,
        humans: row.toxicity_for_humans_level,
      },
    }));

    res.json({
      items,
      total: countQ.rows[0]?.count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("GET /api/plants error", error);
    return respondError(res, error, "Failed to load plants");
  }
});

router.get("/meta", async (_req, res) => {
  try {
    const [light, watering, soil, humidity, temperature, locations, tags] = await Promise.all([
      fetchDict("dict_light"),
      fetchDict("dict_watering"),
      fetchDict("dict_soil"),
      fetchDict("dict_humidity"),
      fetchDict("dict_temperature"),
      fetchDict("dict_locations"),
      fetchDict("plant_tags"),
    ]);
    res.json({
      dicts: { light, watering, soil, humidity, temperature, locations },
      tags,
      config: {
        pageLimit: PAGE_LIMIT_DEFAULT,
        maxUploadMb: IMAGE_MAX_MB,
        s3Ready: isS3Ready(),
      },
    });
  } catch (error) {
    console.error("GET /api/plants/meta", error);
    return respondError(res, error, "Failed to load metadata");
  }
});

router.get("/tags", async (_req, res) => {
  try {
    const tags = await fetchDict("plant_tags");
    res.json({ tags });
  } catch (error) {
    console.error("GET /api/plants/tags", error);
    return respondError(res, error, "Failed to load tags");
  }
});

router.post("/tags", requirePermission("plants_admin"), async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ message: "name is required" });
    const inserted = await pool.query(
      "INSERT INTO plant_tags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id, name",
      [name]
    );
    if (!inserted.rows.length) {
      const existing = await pool.query("SELECT id, name FROM plant_tags WHERE lower(name) = lower($1)", [name]);
      return res.json({ tag: existing.rows[0] });
    }
    res.status(201).json({ tag: inserted.rows[0] });
  } catch (error) {
    console.error("POST /api/plants/tags", error);
    return respondError(res, error, "Failed to create tag");
  }
});

router.delete("/tags/:id", requirePermission("plants_admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid tag id" });
    const deleted = await pool.query("DELETE FROM plant_tags WHERE id = $1 RETURNING id", [id]);
    if (!deleted.rows.length) return res.status(404).json({ message: "Tag not found" });
    res.json({ message: "Tag removed" });
  } catch (error) {
    console.error("DELETE /api/plants/tags/:id", error);
    return respondError(res, error, "Failed to remove tag");
  }
});

router.get("/dicts/:dict", requirePermission("plants_admin"), async (req, res) => {
  try {
    const table = DICT_TABLES[req.params.dict];
    if (!table) return res.status(400).json({ message: "Unknown dictionary" });
    const rows = await fetchDict(table);
    res.json({ items: rows });
  } catch (error) {
    console.error("GET /api/plants/dicts/:dict", error);
    return respondError(res, error, "Failed to load dictionary");
  }
});

router.post("/dicts/:dict", requirePermission("plants_admin"), async (req, res) => {
  try {
    const table = DICT_TABLES[req.params.dict];
    if (!table) return res.status(400).json({ message: "Unknown dictionary" });
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ message: "name is required" });
    const inserted = await pool.query(
      `INSERT INTO ${table} (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id, name`,
      [name]
    );
    if (!inserted.rows.length) {
      const existing = await pool.query(`SELECT id, name FROM ${table} WHERE lower(name) = lower($1)`, [name]);
      return res.json({ item: existing.rows[0] });
    }
    res.status(201).json({ item: inserted.rows[0] });
  } catch (error) {
    console.error("POST /api/plants/dicts/:dict", error);
    return respondError(res, error, "Failed to create dictionary record");
  }
});

router.delete("/dicts/:dict/:id", requirePermission("plants_admin"), async (req, res) => {
  try {
    const table = DICT_TABLES[req.params.dict];
    if (!table) return res.status(400).json({ message: "Unknown dictionary" });
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
    const deleted = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [id]);
    if (!deleted.rows.length) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Record removed" });
  } catch (error) {
    console.error("DELETE /api/plants/dicts", error);
    return respondError(res, error, "Failed to remove dictionary record");
  }
});

router.post("/", requirePermission("plants_admin"), async (req, res) => {
  try {
    const body = req.body || {};
    const commonName = String(body.common_name || "").trim();
    if (!commonName) return res.status(400).json({ message: "common_name is required" });
    const englishName = body.english_name ? String(body.english_name).trim() : "";
    const latinName = body.latin_name ? String(body.latin_name).trim() : "";
    const slug = await ensureUniquePlantSlug({
      englishName,
      latinName,
      commonName,
    });
    const inserted = await pool.query(
      `INSERT INTO plants (slug, common_name, latin_name, english_name, family, origin, light_id, watering_id, soil_id, humidity_id, temperature_id, description, max_height_cm, leaf_color, flower_color, blooming_month, toxicity_for_cats_level, toxicity_for_dogs_level, toxicity_for_humans_level, acquisition_date, location_id, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       RETURNING id, slug, common_name`,
      [
        slug,
        commonName,
        latinName || null,
        englishName || null,
        nullableText(body.family),
        nullableText(body.origin),
        toNullableInt(body.light_id),
        toNullableInt(body.watering_id),
        toNullableInt(body.soil_id),
        toNullableInt(body.humidity_id),
        toNullableInt(body.temperature_id),
        nullableText(body.description),
        toNullableInt(body.max_height_cm),
        nullableText(body.leaf_color),
        nullableText(body.flower_color),
        toNullableMonth(body.blooming_month),
        toNullableToxic(body.toxicity_for_cats_level),
        toNullableToxic(body.toxicity_for_dogs_level),
        toNullableToxic(body.toxicity_for_humans_level),
        nullableDate(body.acquisition_date),
        toNullableInt(body.location_id),
        validateStatus(body.status),
        req.user?.id || null,
      ]
    );
    res.status(201).json({ plant: inserted.rows[0] });
  } catch (error) {
    console.error("POST /api/plants", error);
    return respondError(res, error, "Failed to create plant");
  }
});

router.patch("/:id", requirePermission("plants_admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
    const body = req.body || {};
    const allowedFields = [
      "common_name",
      "latin_name",
      "english_name",
      "family",
      "origin",
      "light_id",
      "watering_id",
      "soil_id",
      "humidity_id",
      "temperature_id",
      "description",
      "max_height_cm",
      "leaf_color",
      "flower_color",
      "blooming_month",
      "toxicity_for_cats_level",
      "toxicity_for_dogs_level",
      "toxicity_for_humans_level",
      "acquisition_date",
      "location_id",
      "status",
    ];
    const sets = [];
    const params = [];
    for (const field of allowedFields) {
      if (!(field in body)) continue;
      let value = body[field];
      if (field.endsWith("_id")) {
        value = toNullableInt(value);
      } else if (field === "max_height_cm") {
        value = toNullableInt(value);
      } else if (field === "blooming_month") {
        value = toNullableMonth(value);
      } else if (field.startsWith("toxicity_for_")) {
        value = toNullableToxic(value);
      } else if (field === "acquisition_date") {
        value = nullableDate(value);
      } else if (field === "status") {
        value = validateStatus(value);
      } else {
        value = nullableText(value);
      }
      sets.push(`${field} = $${params.length + 1}`);
      params.push(value);
    }
    if (!sets.length && !Array.isArray(body.tags) && !Array.isArray(body.tag_names)) {
      return res.status(400).json({ message: "Nothing to update" });
    }
    if (sets.length) {
      params.push(id);
      await pool.query(
        `UPDATE plants SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${params.length}`,
        params
      );
    }
    const shouldRegenerateSlug = "english_name" in body || "latin_name" in body;
    if (shouldRegenerateSlug) {
      const q = await pool.query("SELECT english_name, latin_name, common_name FROM plants WHERE id = $1", [id]);
      if (q.rows.length) {
        const { english_name, latin_name, common_name } = q.rows[0];
        const slug = await ensureUniquePlantSlug({
          englishName: english_name,
          latinName: latin_name,
          commonName: common_name,
          existingId: id,
        });
        await pool.query("UPDATE plants SET slug = $1 WHERE id = $2", [slug, id]);
      }
    }
    if (Array.isArray(body.tags) || Array.isArray(body.tag_names)) {
      await upsertPlantTags(id, body.tags, body.tag_names);
    }
    const plant = await fetchPlantDetail({ id });
    res.json({ plant });
  } catch (error) {
    console.error("PATCH /api/plants/:id", error);
    return respondError(res, error, "Failed to update plant");
  }
});

router.get("/:identifier/article", async (req, res) => {
  try {
    const plantId = await resolvePlantId(req.params.identifier);
    if (!plantId) return res.status(404).json({ message: "Plant not found" });
    const article = await fetchArticle(plantId);
    res.json({ article });
  } catch (error) {
    console.error("GET /api/plants/:id/article", error);
    return respondError(res, error, "Failed to load article");
  }
});

router.put("/:id/article", requirePermission("plants_admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
    const contentRich = req.body?.content_rich;
    const contentText = String(req.body?.content_text || "");
    if (!contentRich || typeof contentRich !== "object") {
      return res.status(400).json({ message: "content_rich must be an object" });
    }
    const saved = await pool.query(
      `INSERT INTO plant_articles (plant_id, content_rich, content_text, updated_by)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (plant_id)
       DO UPDATE SET content_rich = EXCLUDED.content_rich,
                     content_text = EXCLUDED.content_text,
                     updated_by = EXCLUDED.updated_by,
                     updated_at = NOW()
       RETURNING plant_id, content_rich, content_text, updated_by, updated_at`,
      [id, contentRich, contentText, req.user?.id || null]
    );
    res.json({ article: saved.rows[0] });
  } catch (error) {
    console.error("PUT /api/plants/:id/article", error);
    return respondError(res, error, "Failed to save article");
  }
});

router.post("/:id/image/main", requirePermission("plants_admin"), upload.single("file"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
    if (!req.file) return res.status(400).json({ message: "file is required" });
    if (!isS3Ready()) return res.status(400).json({ message: "S3 is not configured" });

    const ext = getExtension(req.file);
    if (!ext) return res.status(400).json({ message: "Unsupported file type" });

    const previewBuffer = await sharp(req.file.buffer)
      .rotate()
      .resize({ width: PREVIEW_WIDTH, withoutEnlargement: true })
      .webp({ quality: PREVIEW_QUALITY });

    const mainKey = `plants/${id}/main.${ext}`;
    const previewKey = `plants/${id}/main_preview.webp`;

    const [current] = (
      await pool.query("SELECT main_image_key, main_preview_key FROM plants WHERE id = $1", [id])
    ).rows;
    if (!current) return res.status(404).json({ message: "Plant not found" });

    const [mainUrl, previewUrl] = await Promise.all([
      uploadBuffer({ key: mainKey, body: req.file.buffer, contentType: req.file.mimetype }),
      uploadBuffer({
        key: previewKey,
        body: previewBuffer,
        contentType: "image/webp",
        cacheControl: "public, max-age=31536000",
      }),
    ]);

    const updated = await pool.query(
      `UPDATE plants
       SET main_image_url = $1,
           main_preview_url = $2,
           main_image_key = $3,
           main_preview_key = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, slug, main_image_url, main_preview_url`,
      [mainUrl, previewUrl, mainKey, previewKey, id]
    );

    if (current?.main_image_key && current.main_image_key !== mainKey) {
      deleteByKey(current.main_image_key);
    }
    if (current?.main_preview_key && current.main_preview_key !== previewKey) {
      deleteByKey(current.main_preview_key);
    }

    res.json({ plant: updated.rows[0] });
  } catch (error) {
    console.error("POST /api/plants/:id/image/main", error);
    return respondError(res, error, "Failed to upload image");
  }
});

router.post("/:id/image/gallery", requirePermission("plants_admin"), upload.array("files", 10), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ message: "files are required" });
    if (!isS3Ready()) return res.status(400).json({ message: "S3 is not configured" });
    const exists = await pool.query("SELECT 1 FROM plants WHERE id = $1", [id]);
    if (!exists.rows.length) return res.status(404).json({ message: "Plant not found" });

    const uploads = [];
    for (const file of files) {
      const ext = getExtension(file);
      if (!ext) {
        return res.status(400).json({ message: `Unsupported file type: ${file.originalname}` });
      }
      const photoId = uuidv4();
      const mainKey = `plants/${id}/gallery/${photoId}.${ext}`;
      const previewKey = `plants/${id}/gallery/${photoId}_preview.webp`;
      const previewBuffer = await sharp(file.buffer)
        .rotate()
        .resize({ width: PREVIEW_WIDTH, withoutEnlargement: true })
        .webp({ quality: PREVIEW_QUALITY });
      const [imageUrl, previewUrl] = await Promise.all([
        uploadBuffer({ key: mainKey, body: file.buffer, contentType: file.mimetype }),
        uploadBuffer({
          key: previewKey,
          body: previewBuffer,
          contentType: "image/webp",
          cacheControl: "public, max-age=31536000",
        }),
      ]);
      uploads.push({ id: photoId, imageUrl, previewUrl, mainKey, previewKey });
    }

    for (const entry of uploads) {
      await pool.query(
        `INSERT INTO plant_images (id, plant_id, image_url, preview_url, image_key, preview_key)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [entry.id, id, entry.imageUrl, entry.previewUrl, entry.mainKey, entry.previewKey]
      );
    }

    const gallery = await pool.query(
      "SELECT id, image_url, preview_url FROM plant_images WHERE plant_id = $1 ORDER BY created_at ASC",
      [id]
    );
    res.json({ gallery: gallery.rows });
  } catch (error) {
    console.error("POST /api/plants/:id/image/gallery", error);
    return respondError(res, error, "Failed to upload gallery images");
  }
});

router.delete(
  "/:id/image/gallery/:imageId",
  requirePermission("plants_admin"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
      const imageId = String(req.params.imageId);
      const deleted = await pool.query(
        `DELETE FROM plant_images
         WHERE plant_id = $1 AND id = $2
         RETURNING image_key, preview_key`,
        [id, imageId]
      );
      if (!deleted.rows.length) return res.status(404).json({ message: "Image not found" });
      const row = deleted.rows[0];
      if (row.image_key) deleteByKey(row.image_key);
      if (row.preview_key) deleteByKey(row.preview_key);
      res.json({ message: "Image removed" });
    } catch (error) {
      console.error("DELETE /api/plants/:id/image/gallery/:imageId", error);
      return respondError(res, error, "Failed to remove image");
    }
  }
);

router.get("/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier;
    const isNumeric = /^\d+$/.test(identifier);
    const plant = await fetchPlantDetail(
      isNumeric ? { id: Number(identifier) } : { slug: identifier }
    );
    if (!plant) {
      return res.status(404).json({ message: "Plant not found" });
    }
    const gallery = await pool.query(
      "SELECT id, image_url, preview_url FROM plant_images WHERE plant_id = $1 ORDER BY created_at ASC",
      [plant.id]
    );
    const tags = await pool.query(
      `SELECT t.id, t.name
       FROM plant_tag_map pt
       JOIN plant_tags t ON t.id = pt.tag_id
       WHERE pt.plant_id = $1
       ORDER BY t.name`,
      [plant.id]
    );
    const article = await fetchArticle(plant.id);
    res.json({
      plant: { ...plant, tags: tags.rows },
      gallery: gallery.rows,
      article,
      redirect_slug: isNumeric ? plant.slug : null,
    });
  } catch (error) {
    console.error("GET /api/plants/:identifier", error);
    return respondError(res, error, "Failed to load plant");
  }
});

router.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(413)
        .json({ message: `File too large. Max ${IMAGE_MAX_MB} MB per file.` });
    }
    return res.status(400).json({ message: error.message });
  }
  if (error.message === "Unsupported file type") {
    return res.status(400).json({ message: "Supported formats: jpeg, png, webp" });
  }
  return next(error);
});

export default router;

function nullableText(value) {
  const val = value === undefined || value === null ? "" : String(value);
  const trimmed = val.trim();
  return trimmed ? trimmed : null;
}

function toNullableInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toNullableMonth(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < 1 || n > 12) throw validationError("blooming_month must be between 1 and 12");
  return n;
}

function toNullableToxic(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < 0 || n > 3) throw validationError("toxicity level must be between 0 and 3");
  return n;
}

function nullableDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function validateStatus(status) {
  if (status === undefined || status === null || status === "") return "created";
  const normalized = String(status).trim().toLowerCase();
  if (!STATUS_VALUES.has(normalized)) {
    throw validationError("Invalid status value");
  }
  return normalized;
}

function parseIntArray(source) {
  if (!source) return [];
  const parts = Array.isArray(source) ? source : String(source).split(",");
  const cleaned = [];
  for (const part of parts) {
    const n = Number(part);
    if (Number.isFinite(n)) cleaned.push(n);
  }
  return [...new Set(cleaned)];
}

function buildFilterClauses(query, params) {
  const clauses = [];
  const search = String(query.query || "").trim();
  if (search) {
    const like = `%${search}%`;
    params.push(like);
    clauses.push(
      `(p.common_name ILIKE $${params.length} OR p.latin_name ILIKE $${params.length} OR p.english_name ILIKE $${params.length} OR p.family ILIKE $${params.length} OR p.origin ILIKE $${params.length})`
    );
  }
  const dictFilters = [
    { key: "light", column: "p.light_id" },
    { key: "watering", column: "p.watering_id" },
    { key: "soil", column: "p.soil_id" },
    { key: "humidity", column: "p.humidity_id" },
    { key: "temperature", column: "p.temperature_id" },
    { key: "location", column: "p.location_id" },
  ];
  for (const { key, column } of dictFilters) {
    const arr = parseIntArray(query[key]);
    if (arr.length) {
      params.push(arr);
      clauses.push(`${column} = ANY($${params.length}::int[])`);
    }
  }
  const bloom = parseIntArray(query.bloom);
  if (bloom.length) {
    params.push(bloom);
    clauses.push(`p.blooming_month = ANY($${params.length}::int[])`);
  }
  const toxFilters = [
    { key: "tox_cat", column: "p.toxicity_for_cats_level" },
    { key: "tox_dog", column: "p.toxicity_for_dogs_level" },
    { key: "tox_human", column: "p.toxicity_for_humans_level" },
  ];
  for (const { key, column } of toxFilters) {
    const arr = parseIntArray(query[key]);
    if (arr.length) {
      params.push(arr);
      clauses.push(`${column} = ANY($${params.length}::int[])`);
    }
  }
  if (typeof query.family === "string") {
    const value = query.family.trim();
    if (value) {
      params.push(`%${value}%`);
      clauses.push(`p.family ILIKE $${params.length}`);
    }
  }
  if (typeof query.origin === "string") {
    const value = query.origin.trim();
    if (value) {
      params.push(`%${value}%`);
      clauses.push(`p.origin ILIKE $${params.length}`);
    }
  }
  const tagIds = parseIntArray(query.tags);
  if (tagIds.length) {
    params.push(tagIds);
    clauses.push(
      `EXISTS (SELECT 1 FROM plant_tag_map pt WHERE pt.plant_id = p.id AND pt.tag_id = ANY($${params.length}::int[]))`
    );
  }
  return clauses;
}

async function fetchDict(table) {
  if (!META_TABLES.has(table)) {
    throw new Error("Unknown dictionary table");
  }
  const q = await pool.query(`SELECT id, name FROM ${table} ORDER BY name ASC`);
  return q.rows;
}

async function upsertPlantTags(plantId, tagIds, tagNames) {
  const ids = new Set();
  if (Array.isArray(tagIds)) {
    for (const raw of tagIds) {
      const n = Number(raw);
      if (Number.isFinite(n)) ids.add(n);
    }
  }
  if (Array.isArray(tagNames)) {
    for (const nameRaw of tagNames) {
      const name = String(nameRaw || "").trim();
      if (!name) continue;
      const inserted = await pool.query(
        "INSERT INTO plant_tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id",
        [name]
      );
      ids.add(inserted.rows[0].id);
    }
  }
  await pool.query("DELETE FROM plant_tag_map WHERE plant_id = $1", [plantId]);
  if (!ids.size) return;
  const values = [];
  let idx = 1;
  for (const tagId of ids) {
    values.push(`($1, $${idx + 1})`);
    idx += 1;
  }
  const params = [plantId, ...ids];
  await pool.query(
    `INSERT INTO plant_tag_map (plant_id, tag_id) VALUES ${values.join(", ")}`,
    params
  );
}

async function fetchPlantDetail({ id, slug }) {
  const where = id ? "p.id = $1" : "p.slug = $1";
  const value = id ?? slug;
  const q = await pool.query(
    `
    SELECT
      p.*,
      CASE WHEN dl.id IS NULL THEN NULL ELSE jsonb_build_object('id', dl.id, 'name', dl.name) END AS light,
      CASE WHEN dw.id IS NULL THEN NULL ELSE jsonb_build_object('id', dw.id, 'name', dw.name) END AS watering,
      CASE WHEN ds.id IS NULL THEN NULL ELSE jsonb_build_object('id', ds.id, 'name', ds.name) END AS soil,
      CASE WHEN dh.id IS NULL THEN NULL ELSE jsonb_build_object('id', dh.id, 'name', dh.name) END AS humidity,
      CASE WHEN dt.id IS NULL THEN NULL ELSE jsonb_build_object('id', dt.id, 'name', dt.name) END AS temperature,
      CASE WHEN dlc.id IS NULL THEN NULL ELSE jsonb_build_object('id', dlc.id, 'name', dlc.name) END AS location
    FROM plants p
    LEFT JOIN dict_light dl ON p.light_id = dl.id
    LEFT JOIN dict_watering dw ON p.watering_id = dw.id
    LEFT JOIN dict_soil ds ON p.soil_id = ds.id
    LEFT JOIN dict_humidity dh ON p.humidity_id = dh.id
    LEFT JOIN dict_temperature dt ON p.temperature_id = dt.id
    LEFT JOIN dict_locations dlc ON p.location_id = dlc.id
    WHERE ${where}
    LIMIT 1
    `,
    [value]
  );
  const row = q.rows[0];
  if (!row) return null;
  const { main_image_key, main_preview_key, ...safe } = row;
  return safe;
}

async function resolvePlantId(identifier) {
  if (/^\d+$/.test(identifier)) return Number(identifier);
  const q = await pool.query("SELECT id FROM plants WHERE slug = $1", [identifier]);
  return q.rows[0]?.id || null;
}

async function fetchArticle(plantId) {
  const q = await pool.query(
    "SELECT plant_id, content_rich, content_text, updated_by, updated_at FROM plant_articles WHERE plant_id = $1",
    [plantId]
  );
  if (q.rows.length) return q.rows[0];
  return {
    plant_id: plantId,
    content_rich: { type: "doc", content: [] },
    content_text: "",
    updated_by: null,
    updated_at: null,
  };
}

function getExtension(file) {
  if (!file?.mimetype) return null;
  if (file.mimetype === "image/jpeg") return "jpg";
  if (file.mimetype === "image/png") return "png";
  if (file.mimetype === "image/webp") return "webp";
  const match = file.originalname?.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : null;
}

function respondError(res, error, fallback) {
  if (error?.status && Number.isInteger(error.status)) {
    return res.status(error.status).json({ message: error.message });
  }
  return res.status(500).json({ message: fallback });
}

function validationError(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}
