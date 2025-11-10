import express from "express";
import { pool } from "../db/connect.js";
import { authRequired, requirePermission } from "../middleware/auth.js";
import { ensureUniqueSlugForTable } from "../utils/slugify.js";

const DEFAULT_LIMIT = Number(process.env.CARE_PAGE_LIMIT) || 24;
const MAX_LIMIT = Number(process.env.CARE_PAGE_MAX_LIMIT) || 60;
const EMPTY_RICH_DOC = { type: "doc", content: [] };

export function createCareCatalogRouter(config) {
  if (!config?.table) {
    throw new Error("createCareCatalogRouter: table is required");
  }
  if (!config.historyTable || !config.historyEntityColumn) {
    throw new Error("createCareCatalogRouter: historyTable and historyEntityColumn are required");
  }
  const router = express.Router();
  const alias = config.alias || "c";
  const entityLabel = config.entityLabel || "Сущность";

  router.use(authRequired);

  router.get("/", async (req, res) => {
    try {
      const { limit, offset } = parsePagination(req.query);
      const params = [];
      const whereClauses = [];
      const searchTerm = String(req.query?.query || "").trim();
      if (searchTerm && Array.isArray(config.searchColumns) && config.searchColumns.length) {
        const searchClauses = config.searchColumns.map((column) => {
          params.push(`%${searchTerm}%`);
          return `${column} ILIKE $${params.length}`;
        });
        if (searchClauses.length) {
          whereClauses.push(`(${searchClauses.join(" OR ")})`);
        }
      }
      if (typeof config.buildFilters === "function") {
        const extraClauses = config.buildFilters(req.query || {}, alias, params);
        if (Array.isArray(extraClauses) && extraClauses.length) {
          whereClauses.push(...extraClauses);
        }
      }
      const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";
      const orderBy = config.orderBy || `LOWER(${alias}.name) ASC`;
      const listSql = `
        SELECT ${config.listSelect || `${alias}.*`}
        FROM ${config.table} ${alias}
        ${whereSql}
        ORDER BY ${orderBy}
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
      `;
      const listParams = params.slice();
      listParams.push(limit);
      listParams.push(offset);
      const [itemsQ, countQ] = await Promise.all([
        pool.query(listSql, listParams),
        pool.query(`SELECT COUNT(*)::int AS count FROM ${config.table} ${alias} ${whereSql}`, params),
      ]);
      const mapList = typeof config.mapListRow === "function" ? config.mapListRow : passthrough;
      res.json({
        items: itemsQ.rows.map(mapList),
        total: countQ.rows[0]?.count || 0,
        limit,
        offset,
      });
    } catch (error) {
      console.error(`GET /api/${config.path || config.table}`, error);
      return res.status(500).json({ message: `Не удалось загрузить ${entityLabel.toLowerCase()}` });
    }
  });

  router.get("/:slug", async (req, res) => {
    try {
      const slug = String(req.params.slug || "").trim();
      if (!slug) return res.status(400).json({ message: "Slug is required" });
      const detailSql = `
        SELECT ${config.detailSelect || `${alias}.*`}
        FROM ${config.table} ${alias}
        WHERE ${alias}.slug = $1
        LIMIT 1
      `;
      const q = await pool.query(detailSql, [slug]);
      if (!q.rows.length) return res.status(404).json({ message: `${entityLabel} не найден` });
      const mapDetail = typeof config.mapDetailRow === "function" ? config.mapDetailRow : passthrough;
      return res.json({ item: mapDetail(q.rows[0]) });
    } catch (error) {
      console.error(`GET /api/${config.path || config.table}/:slug`, error);
      return res.status(500).json({ message: `Не удалось загрузить ${entityLabel.toLowerCase()}` });
    }
  });

  router.post("/", requirePermission("plants_admin"), async (req, res) => {
    try {
      const payload = buildMutationPayload(req.body, config, { isCreate: true });
      const name = payload.name;
      const slug = await ensureUniqueSlugForTable(config.table, name, {
        fallbackPrefix: config.slugPrefix || config.table,
      });
      const entries = Object.entries(payload);
      const columns = ["slug", ...entries.map(([column]) => column), "created_by"];
      const values = [slug, ...entries.map(([, value]) => value), req.user?.id || null];
      const placeholders = columns.map((_, idx) => `$${idx + 1}`);
      const insertSql = `
        INSERT INTO ${config.table} (${columns.join(", ")})
        VALUES (${placeholders.join(", ")})
        RETURNING ${config.returningColumns || "*"}
      `;
      const inserted = await pool.query(insertSql, values);
      const mapDetail = typeof config.mapDetailRow === "function" ? config.mapDetailRow : passthrough;
      return res.status(201).json({ item: mapDetail(inserted.rows[0]) });
    } catch (error) {
      console.error(`POST /api/${config.path || config.table}`, error);
      return respondError(res, error, `Не удалось создать ${entityLabel.toLowerCase()}`);
    }
  });

  router.patch("/:id", requirePermission("plants_admin"), async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
      const existingQ = await pool.query(`SELECT * FROM ${config.table} WHERE id = $1 LIMIT 1`, [id]);
      if (!existingQ.rows.length) return res.status(404).json({ message: `${entityLabel} не найден` });
      const existing = existingQ.rows[0];
      const payload = buildMutationPayload(req.body, config, { isCreate: false });
      let slugUpdate = null;
      if (payload.name && payload.name !== existing.name) {
        slugUpdate = await ensureUniqueSlugForTable(config.table, payload.name, {
          fallbackPrefix: config.slugPrefix || config.table,
          existingId: id,
        });
      }
      const assignments = [];
      const values = [];
      let idx = 1;
      if (slugUpdate) {
        assignments.push(`slug = $${idx}`);
        values.push(slugUpdate);
        idx += 1;
      }
      Object.entries(payload).forEach(([column, value]) => {
        assignments.push(`${column} = $${idx}`);
        values.push(value);
        idx += 1;
      });
      if (!assignments.length) {
        const mapDetail = typeof config.mapDetailRow === "function" ? config.mapDetailRow : passthrough;
        return res.json({ item: mapDetail(existing) });
      }
      values.push(id);
      const updateSql = `
        UPDATE ${config.table}
        SET ${assignments.join(", ")}, updated_at = NOW()
        WHERE id = $${idx}
        RETURNING ${config.returningColumns || "*"}
      `;
      const updated = await pool.query(updateSql, values);
      const updatedRow = updated.rows[0];
      await recordHistoryEntries(config, id, req.user?.id || null, existing, updatedRow);
      const mapDetail = typeof config.mapDetailRow === "function" ? config.mapDetailRow : passthrough;
      return res.json({ item: mapDetail(updatedRow) });
    } catch (error) {
      console.error(`PATCH /api/${config.path || config.table}/:id`, error);
      return respondError(res, error, `Не удалось обновить ${entityLabel.toLowerCase()}`);
    }
  });

  router.delete("/:id", requirePermission("plants_admin"), async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
      const deleted = await pool.query(`DELETE FROM ${config.table} WHERE id = $1 RETURNING id`, [id]);
      if (!deleted.rows.length) return res.status(404).json({ message: `${entityLabel} не найден` });
      return res.json({ message: "Удалено" });
    } catch (error) {
      console.error(`DELETE /api/${config.path || config.table}/:id`, error);
      return res.status(500).json({ message: `Не удалось удалить ${entityLabel.toLowerCase()}` });
    }
  });

  return router;
}

function parsePagination(query) {
  const limitParam = Number(query?.limit);
  const offsetParam = Number(query?.offset);
  const limit = Math.min(
    MAX_LIMIT,
    Number.isFinite(limitParam) && limitParam > 0 ? limitParam : DEFAULT_LIMIT
  );
  const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;
  return { limit, offset };
}

function buildMutationPayload(body, config, { isCreate }) {
  const source = body && typeof body === "object" ? body : {};
  const fields = config.fields || {};
  const result = {};
  const hasOwn = Object.prototype.hasOwnProperty;
  for (const [field, options] of Object.entries(fields)) {
    const fieldOptions = options || {};
    const provided = hasOwn.call(source, field);
    if (!provided) {
      if (fieldOptions.required && isCreate) {
        throw validationError(`${field} is required`);
      }
      continue;
    }
    if (fieldOptions.type === "json") {
      const value = source[field];
      if (!value || typeof value !== "object") {
        throw validationError(`${field} must be an object`);
      }
      result[field] = value;
      if (fieldOptions.textField) {
        result[fieldOptions.textField] = String(source?.[fieldOptions.textField] || "");
      }
      continue;
    }
    const normalized = sanitizeScalar(source[field], fieldOptions, field);
    if (fieldOptions.required && (!normalized || normalized.length === 0)) {
      throw validationError(`${field} is required`);
    }
    result[field] = normalized;
  }
  return result;
}

function sanitizeScalar(value, options = {}, fieldName) {
  if (value === null || value === undefined) return null;
  if (options.type === "enum") {
    const normalized = String(value).trim().toLowerCase();
    if (!normalized) return null;
    if (!options.values?.includes(normalized)) {
      throw validationError(`${fieldName} has invalid value`);
    }
    return normalized;
  }
  if (options.type === "url") {
    return normalizeUrl(value);
  }
  if (options.type === "date") {
    return normalizeDate(value, fieldName);
  }
  const trimValue = options.trim ?? true;
  let text = String(value);
  if (trimValue) {
    text = text.trim();
  }
  if (!text) {
    if (options.allowEmpty) return "";
    return null;
  }
  if (options.lowercase) {
    text = text.toLowerCase();
  }
  return text;
}

function normalizeUrl(value) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.toString();
  } catch {
    throw validationError("Invalid URL");
  }
}

function normalizeDate(value, fieldName) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw validationError(`${fieldName} must be a valid date`);
  }
  return date.toISOString().slice(0, 10);
}

async function recordHistoryEntries(config, entityId, userId, before, after) {
  const tracked = config.historyFields || Object.keys(config.fields || {});
  const changes = [];
  for (const field of tracked) {
    if (!Object.prototype.hasOwnProperty.call(before, field) && !Object.prototype.hasOwnProperty.call(after, field)) {
      continue;
    }
    if (valuesEqual(before[field], after[field])) continue;
    changes.push({
      field,
      oldValue: before[field],
      newValue: after[field],
    });
  }
  if (!changes.length) return;
  const values = [];
  const placeholders = changes.map((change, idx) => {
    const offset = idx * 5;
    values.push(
      entityId,
      userId,
      change.field,
      historyValue(change.oldValue),
      historyValue(change.newValue)
    );
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
  });
  const sql = `
    INSERT INTO ${config.historyTable} (${config.historyEntityColumn}, user_id, field, old_value, new_value)
    VALUES ${placeholders.join(", ")}
  `;
  await pool.query(sql, values);
}

function historyValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function valuesEqual(a, b) {
  if (a === b) return true;
  if (a === null || a === undefined) return b === null || b === undefined;
  if (b === null || b === undefined) return false;
  if (typeof a === "object" || typeof b === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return String(a) === String(b);
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

function passthrough(value) {
  return value;
}

export { EMPTY_RICH_DOC };
