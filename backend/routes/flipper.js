import express from "express";
import sanitizeHtml from "sanitize-html";
import { pool } from "../db/connect.js";
import { authRequired, requirePermission } from "../middleware/auth.js";

const router = express.Router();

const manageFlipperGuard = [authRequired, requirePermission(["manage_flipper"])];
const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(["h1", "h2", "h3", "pre", "code"]),
  allowedAttributes: {
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    "*": ["class", "style"],
  },
};

function buildPagination(query) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);
  return { limit, offset };
}

function sanitizeMarkdown(markdown) {
  const escaped = String(markdown || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return sanitizeHtml(escaped.replace(/\n/g, "<br>"), sanitizeOptions);
}

function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0430-\u044f\u0451\u0456\u0457\u0454\u0491\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "") || `flp-${Date.now()}`;
}

function parseTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => String(t || "").trim())
    .filter(Boolean)
    .slice(0, 20);
}

// -------- Categories --------
router.get("/categories", async (req, res) => {
  try {
    const { type, parent_id: parentId } = req.query;
    const clauses = [];
    const params = [];
    if (type) {
      params.push(type);
      clauses.push(`type = $${params.length}`);
    }
    if (parentId) {
      params.push(parentId);
      clauses.push(`parent_id = $${params.length}`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT id, slug, title, description, type, parent_id, position, is_active, created_at, updated_at
       FROM flipper_categories
       ${where}
       ORDER BY position ASC, title ASC`,
      params
    );
    return res.json(rows);
  } catch (e) {
    console.error("flipper categories list error", e);
    return res.status(500).json({ message: "Не удалось получить категории" });
  }
});

router.get("/categories/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, slug, title, description, type, parent_id, position, is_active, created_at, updated_at
       FROM flipper_categories WHERE id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Категория не найдена" });
    return res.json(rows[0]);
  } catch (e) {
    console.error("flipper category detail error", e);
    return res.status(500).json({ message: "Не удалось получить категорию" });
  }
});

router.post("/categories", manageFlipperGuard, async (req, res) => {
  try {
    const { slug, title, description, type, parent_id: parentId, position = 0 } = req.body || {};
    if (!slug || !title || !type) return res.status(400).json({ message: "slug, title и type обязательны" });
    const insert = `
      INSERT INTO flipper_categories (slug, title, description, type, parent_id, position)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, slug, title, description, type, parent_id, position, is_active, created_at, updated_at
    `;
    const params = [slug, title, description || null, type, parentId || null, position];
    const { rows } = await pool.query(insert, params);
    return res.status(201).json(rows[0]);
  } catch (e) {
    console.error("flipper category create error", e);
    if (e.code === "23505") return res.status(409).json({ message: "Категория со slug уже существует" });
    return res.status(500).json({ message: "Не удалось создать категорию" });
  }
});

router.get("/categories/slug/:slug", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, slug, title, description, type, parent_id, position, is_active, created_at, updated_at
       FROM flipper_categories WHERE slug = $1`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ message: "Категория не найдена" });
    return res.json(rows[0]);
  } catch (e) {
    console.error("flipper category by slug error", e);
    return res.status(500).json({ message: "Не удалось получить категорию" });
  }
});

router.patch("/categories/:id", manageFlipperGuard, async (req, res) => {
  try {
    const fields = ["slug", "title", "description", "type", "parent_id", "position", "is_active"];
    const sets = [];
    const params = [];
    fields.forEach((f) => {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, f)) {
        params.push(req.body[f]);
        sets.push(`${f} = $${params.length}`);
      }
    });
    if (!sets.length) return res.status(400).json({ message: "Нет полей для обновления" });
    params.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE flipper_categories SET ${sets.join(", ")}, updated_at = now() WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ message: "Категория не найдена" });
    return res.json(rows[0]);
  } catch (e) {
    console.error("flipper category update error", e);
    if (e.code === "23505") return res.status(409).json({ message: "Категория со slug уже существует" });
    return res.status(500).json({ message: "Не удалось обновить категорию" });
  }
});

router.delete("/categories/:id", manageFlipperGuard, async (req, res) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM flipper_categories WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: "Категория не найдена" });
    return res.json({ success: true });
  } catch (e) {
    console.error("flipper category delete error", e);
    return res.status(500).json({ message: "Не удалось удалить категорию" });
  }
});

// -------- Firmwares --------
router.get("/firmwares", async (req, res) => {
  try {
    const { active } = req.query;
    const clauses = [];
    const params = [];
    if (typeof active !== "undefined") {
      params.push(String(active) === "true");
      clauses.push(`is_active = $${params.length}`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT id, slug, name, short_description, description_raw, description_rendered, homepage_url, repo_url, is_custom, is_active, created_at, updated_at
       FROM flipper_firmwares
       ${where}
       ORDER BY name ASC`,
      params
    );
    return res.json(rows);
  } catch (e) {
    console.error("flipper firmwares list error", e);
    return res.status(500).json({ message: "Не удалось получить прошивки" });
  }
});

router.get("/firmwares/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, slug, name, short_description, description_raw, description_rendered, homepage_url, repo_url, is_custom, is_active, created_at, updated_at
       FROM flipper_firmwares WHERE id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Прошивка не найдена" });
    return res.json(rows[0]);
  } catch (e) {
    console.error("flipper firmware detail error", e);
    return res.status(500).json({ message: "Не удалось получить прошивку" });
  }
});

router.get("/firmwares/slug/:slug", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, slug, name, short_description, description_raw, description_rendered, homepage_url, repo_url, is_custom, is_active, created_at, updated_at
       FROM flipper_firmwares WHERE slug = $1`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ message: "Прошивка не найдена" });
    return res.json(rows[0]);
  } catch (e) {
    console.error("flipper firmware by slug error", e);
    return res.status(500).json({ message: "Не удалось получить прошивку" });
  }
});

router.post("/firmwares", manageFlipperGuard, async (req, res) => {
  try {
    const {
      slug,
      name,
      short_description: shortDescription,
      description_raw: descriptionRaw,
      description_rendered: descriptionRendered,
      homepage_url: homepageUrl,
      repo_url: repoUrl,
      is_custom: isCustom = true,
      is_active: isActive = true,
    } = req.body || {};
    if (!slug || !name) return res.status(400).json({ message: "slug и name обязательны" });
    const { rows } = await pool.query(
      `INSERT INTO flipper_firmwares
        (slug, name, short_description, description_raw, description_rendered, homepage_url, repo_url, is_custom, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [slug, name, shortDescription || null, descriptionRaw || null, descriptionRendered || null, homepageUrl || null, repoUrl || null, isCustom, isActive]
    );
    return res.status(201).json(rows[0]);
  } catch (e) {
    console.error("flipper firmware create error", e);
    if (e.code === "23505") return res.status(409).json({ message: "Прошивка со slug уже существует" });
    return res.status(500).json({ message: "Не удалось создать прошивку" });
  }
});

router.patch("/firmwares/:id", manageFlipperGuard, async (req, res) => {
  try {
    const fields = [
      "slug",
      "name",
      "short_description",
      "description_raw",
      "description_rendered",
      "homepage_url",
      "repo_url",
      "is_custom",
      "is_active",
    ];
    const sets = [];
    const params = [];
    fields.forEach((f) => {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, f)) {
        params.push(req.body[f]);
        sets.push(`${f} = $${params.length}`);
      }
    });
    if (!sets.length) return res.status(400).json({ message: "Нет полей для обновления" });
    params.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE flipper_firmwares SET ${sets.join(", ")}, updated_at = now() WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ message: "Прошивка не найдена" });
    return res.json(rows[0]);
  } catch (e) {
    console.error("flipper firmware update error", e);
    if (e.code === "23505") return res.status(409).json({ message: "Прошивка со slug уже существует" });
    return res.status(500).json({ message: "Не удалось обновить прошивку" });
  }
});

router.delete("/firmwares/:id", manageFlipperGuard, async (req, res) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM flipper_firmwares WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: "Прошивка не найдена" });
    return res.json({ success: true });
  } catch (e) {
    console.error("flipper firmware delete error", e);
    return res.status(500).json({ message: "Не удалось удалить прошивку" });
  }
});

// -------- Articles --------
router.get("/articles", async (req, res) => {
  try {
    const { limit, offset } = buildPagination(req.query);
    const { category_id: categoryId, firmware_id: firmwareId, type, status, search } = req.query;
    const clauses = [];
    const params = [];
    if (categoryId) {
      params.push(categoryId);
      clauses.push(`category_id = $${params.length}`);
    }
    if (firmwareId) {
      params.push(firmwareId);
      clauses.push(`firmware_id = $${params.length}`);
    }
    if (type) {
      params.push(type);
      clauses.push(`type = $${params.length}`);
    }
    if (status) {
      params.push(status);
      clauses.push(`status = $${params.length}`);
    } else {
      // публичные запросы показывают только опубликованное
      if (!req.user) {
        clauses.push(`status = 'published'`);
      }
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      clauses.push(`(lower(title) LIKE $${params.length} OR lower(summary) LIKE $${params.length})`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT id, title, slug, category_id, firmware_id, type, summary, content_raw, content_rendered, tags, complexity_level, estimated_duration_min, status, published_at, created_at, updated_at
       FROM flipper_articles
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return res.json(rows);
  } catch (e) {
    console.error("flipper articles list error", e);
    return res.status(500).json({ message: "Не удалось получить статьи" });
  }
});

router.get("/articles/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, slug, category_id, firmware_id, type, summary, content_raw, content_rendered, tags, complexity_level, estimated_duration_min, status, published_at, created_at, updated_at
       FROM flipper_articles WHERE id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Статья не найдена" });
    const article = rows[0];
    if (!req.user && article.status !== "published") return res.status(403).json({ message: "Статья недоступна" });
    return res.json(article);
  } catch (e) {
    console.error("flipper article detail error", e);
    return res.status(500).json({ message: "Не удалось получить статью" });
  }
});

router.get("/articles/slug/:slug", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, slug, category_id, firmware_id, type, summary, content_raw, content_rendered, tags, complexity_level, estimated_duration_min, status, published_at, created_at, updated_at
       FROM flipper_articles WHERE slug = $1`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ message: "Статья не найдена" });
    const article = rows[0];
    if (!req.user && article.status !== "published") return res.status(403).json({ message: "Статья недоступна" });
    return res.json(article);
  } catch (e) {
    console.error("flipper article by slug error", e);
    return res.status(500).json({ message: "Не удалось получить статью" });
  }
});

router.post("/articles", manageFlipperGuard, async (req, res) => {
  try {
    const {
      title,
      slug,
      category_id: categoryId,
      firmware_id: firmwareId,
      type,
      summary,
      content_raw: contentRaw,
      content_rendered: contentRendered,
      tags,
      complexity_level: complexityLevel,
      estimated_duration_min: estimatedDurationMin,
      status = "draft",
      published_at: publishedAt,
    } = req.body || {};
    if (!title || !slug || !type) return res.status(400).json({ message: "title, slug и type обязательны" });
    const safeTags = parseTags(tags);
    const { rows } = await pool.query(
      `INSERT INTO flipper_articles
        (title, slug, category_id, firmware_id, type, summary, content_raw, content_rendered, tags, complexity_level, estimated_duration_min, status, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        title,
        slug,
        categoryId || null,
        firmwareId || null,
        type,
        summary || null,
        contentRaw || null,
        contentRendered || null,
        JSON.stringify(safeTags),
        complexityLevel || null,
        estimatedDurationMin || null,
        status || "draft",
        publishedAt || null,
      ]
    );
    return res.status(201).json(rows[0]);
  } catch (e) {
    console.error("flipper article create error", e);
    if (e.code === "23505") return res.status(409).json({ message: "Статья со slug уже существует" });
    return res.status(500).json({ message: "Не удалось создать статью" });
  }
});

router.patch("/articles/:id", manageFlipperGuard, async (req, res) => {
  try {
    const fields = [
      "title",
      "slug",
      "category_id",
      "firmware_id",
      "type",
      "summary",
      "content_raw",
      "content_rendered",
      "tags",
      "complexity_level",
      "estimated_duration_min",
      "status",
      "published_at",
    ];
    const sets = [];
    const params = [];
    fields.forEach((f) => {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, f)) {
        const v = f === "tags" ? JSON.stringify(parseTags(req.body[f])) : req.body[f];
        params.push(v);
        sets.push(`${f} = $${params.length}`);
      }
    });
    if (!sets.length) return res.status(400).json({ message: "Нет полей для обновления" });
    params.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE flipper_articles SET ${sets.join(", ")}, updated_at = now() WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ message: "Статья не найдена" });
    return res.json(rows[0]);
  } catch (e) {
    console.error("flipper article update error", e);
    if (e.code === "23505") return res.status(409).json({ message: "Статья со slug уже существует" });
    return res.status(500).json({ message: "Не удалось обновить статью" });
  }
});

router.patch("/articles/:id/status", manageFlipperGuard, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ message: "Новый статус обязателен" });
    const { rows } = await pool.query(
      `UPDATE flipper_articles SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Статья не найдена" });
    return res.json(rows[0]);
  } catch (e) {
    console.error("flipper article status update error", e);
    return res.status(500).json({ message: "Не удалось обновить статус статьи" });
  }
});

router.delete("/articles/:id", manageFlipperGuard, async (req, res) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM flipper_articles WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: "Статья не найдена" });
    return res.json({ success: true });
  } catch (e) {
    console.error("flipper article delete error", e);
    return res.status(500).json({ message: "Не удалось удалить статью" });
  }
});

// -------- Modules --------
router.get("/modules", async (req, res) => {
  try {
    const { limit, offset } = buildPagination(req.query);
    const { firmware_id: firmwareId, category_id: categoryId, active, search } = req.query;
    const clauses = [];
    const params = [];
    if (firmwareId) {
      params.push(firmwareId);
      clauses.push(`firmware_id = $${params.length}`);
    }
    if (categoryId) {
      params.push(categoryId);
      clauses.push(`category_id = $${params.length}`);
    }
    if (typeof active !== "undefined") {
      params.push(String(active) === "true");
      clauses.push(`is_active = $${params.length}`);
    } else if (!req.user) {
      clauses.push(`is_active = TRUE`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      clauses.push(`(lower(name) LIKE $${params.length} OR lower(short_description) LIKE $${params.length})`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT id, slug, name, short_description, description_raw, description_rendered, firmware_id, supported_firmwares, category_id, source_url, is_active, created_at, updated_at
       FROM flipper_modules
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return res.json(rows);
  } catch (e) {
    console.error("flipper modules list error", e);
    return res.status(500).json({ message: "Не удалось получить модули" });
  }
});

router.get("/modules/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, slug, name, short_description, description_raw, description_rendered, firmware_id, supported_firmwares, category_id, source_url, is_active, created_at, updated_at
       FROM flipper_modules WHERE id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Модуль не найден" });
    const module = rows[0];
    if (!req.user && !module.is_active) return res.status(403).json({ message: "Модуль недоступен" });
    return res.json(module);
  } catch (e) {
    console.error("flipper module detail error", e);
    return res.status(500).json({ message: "Не удалось получить модуль" });
  }
});

router.get("/modules/slug/:slug", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, slug, name, short_description, description_raw, description_rendered, firmware_id, supported_firmwares, category_id, source_url, is_active, created_at, updated_at
       FROM flipper_modules WHERE slug = $1`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ message: "Модуль не найден" });
    const module = rows[0];
    if (!req.user && !module.is_active) return res.status(403).json({ message: "Модуль недоступен" });
    return res.json(module);
  } catch (e) {
    console.error("flipper module by slug error", e);
    return res.status(500).json({ message: "Не удалось получить модуль" });
  }
});

router.post("/modules", manageFlipperGuard, async (req, res) => {
  try {
    const {
      slug,
      name,
      short_description: shortDescription,
      description_raw: descriptionRaw,
      description_rendered: descriptionRendered,
      firmware_id: firmwareId,
      supported_firmwares: supportedFirmwares,
      category_id: categoryId,
      source_url: sourceUrl,
      is_active: isActive = true,
    } = req.body || {};
    if (!slug || !name) return res.status(400).json({ message: "slug и name обязательны" });
    const { rows } = await pool.query(
      `INSERT INTO flipper_modules
        (slug, name, short_description, description_raw, description_rendered, firmware_id, supported_firmwares, category_id, source_url, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        slug,
        name,
        shortDescription || null,
        descriptionRaw || null,
        descriptionRendered || null,
        firmwareId || null,
        supportedFirmwares ? JSON.stringify(supportedFirmwares) : "[]",
        categoryId || null,
        sourceUrl || null,
        isActive,
      ]
    );
    return res.status(201).json(rows[0]);
  } catch (e) {
    console.error("flipper module create error", e);
    if (e.code === "23505") return res.status(409).json({ message: "Модуль со slug уже существует" });
    return res.status(500).json({ message: "Не удалось создать модуль" });
  }
});

router.patch("/modules/:id", manageFlipperGuard, async (req, res) => {
  try {
    const fields = [
      "slug",
      "name",
      "short_description",
      "description_raw",
      "description_rendered",
      "firmware_id",
      "supported_firmwares",
      "category_id",
      "source_url",
      "is_active",
    ];
    const sets = [];
    const params = [];
    fields.forEach((f) => {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, f)) {
        const v = f === "supported_firmwares" ? JSON.stringify(req.body[f] || []) : req.body[f];
        params.push(v);
        sets.push(`${f} = $${params.length}`);
      }
    });
    if (!sets.length) return res.status(400).json({ message: "Нет полей для обновления" });
    params.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE flipper_modules SET ${sets.join(", ")}, updated_at = now() WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ message: "Модуль не найден" });
    return res.json(rows[0]);
  } catch (e) {
    console.error("flipper module update error", e);
    if (e.code === "23505") return res.status(409).json({ message: "Модуль со slug уже существует" });
    return res.status(500).json({ message: "Не удалось обновить модуль" });
  }
});

router.delete("/modules/:id", manageFlipperGuard, async (req, res) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM flipper_modules WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: "Модуль не найден" });
    return res.json({ success: true });
  } catch (e) {
    console.error("flipper module delete error", e);
    return res.status(500).json({ message: "Не удалось удалить модуль" });
  }
});

// -------- Queue --------
router.get("/queue", manageFlipperGuard, async (req, res) => {
  try {
    const { limit, offset } = buildPagination(req.query);
    const { status, article_id: articleId, operation } = req.query;
    const clauses = [];
    const params = [];
    if (status) {
      params.push(status);
      clauses.push(`status = $${params.length}`);
    }
    if (articleId) {
      params.push(articleId);
      clauses.push(`article_id = $${params.length}`);
    }
    if (operation) {
      params.push(operation);
      clauses.push(`operation = $${params.length}`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT id, article_id, operation, payload, source, status, error_message, locked_at, processed_at, created_at, updated_at
       FROM flipper_article_queue
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return res.json({ items: rows });
  } catch (e) {
    console.error("flipper queue list error", e);
    return res.status(500).json({ message: "Не удалось получить очередь" });
  }
});

router.post("/queue", manageFlipperGuard, async (req, res) => {
  try {
    const { article_id: articleId, operation, payload, source, status = "pending" } = req.body || {};
    if (!operation) return res.status(400).json({ message: "operation обязателен" });
    const { rows } = await pool.query(
      `INSERT INTO flipper_article_queue (article_id, operation, payload, source, status, created_by_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [articleId || null, operation, payload ? JSON.stringify(payload) : "{}", source || null, status, req.user?.id || null]
    );
    return res.status(201).json(rows[0]);
  } catch (e) {
    console.error("flipper queue create error", e);
    return res.status(500).json({ message: "Не удалось создать задачу" });
  }
});

router.patch("/queue/:id", manageFlipperGuard, async (req, res) => {
  try {
    const fields = ["article_id", "operation", "payload", "source", "status", "error_message", "locked_at", "processed_at"];
    const sets = [];
    const params = [];
    fields.forEach((f) => {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, f)) {
        const v = ["payload"].includes(f) ? JSON.stringify(req.body[f] || {}) : req.body[f];
        params.push(v);
        sets.push(`${f} = $${params.length}`);
      }
    });
    if (!sets.length) return res.status(400).json({ message: "Нет полей для обновления" });
    params.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE flipper_article_queue SET ${sets.join(", ")}, updated_at = now() WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ message: "Задача не найдена" });
    return res.json(rows[0]);
  } catch (e) {
    console.error("flipper queue update error", e);
    return res.status(500).json({ message: "Не удалось обновить задачу" });
  }
});

router.delete("/queue/:id", manageFlipperGuard, async (req, res) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM flipper_article_queue WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: "Задача не найдена" });
    return res.json({ success: true });
  } catch (e) {
    console.error("flipper queue delete error", e);
    return res.status(500).json({ message: "Не удалось удалить задачу" });
  }
});

// -------- Utils --------
router.post("/utils/slug", manageFlipperGuard, (req, res) => {
  const { title } = req.body || {};
  if (!title) return res.status(400).json({ message: "title обязателен" });
  return res.json({ slug: slugify(title) });
});

router.post("/utils/preview", manageFlipperGuard, (req, res) => {
  const { markdown } = req.body || {};
  const html = sanitizeMarkdown(markdown || "");
  return res.json({ html });
});

export default router;
