import { createCareCatalogRouter, EMPTY_RICH_DOC } from "./careCatalogFactory.js";
import { pool } from "../db/connect.js";
import { requirePermission } from "../middleware/auth.js";

const DANGER_LEVELS = ["low", "medium", "high"];

function buildPestsFilters(query, alias, params) {
  const filters = [];
  const dangerParam = String(query?.danger || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter((v) => DANGER_LEVELS.includes(v));
  if (dangerParam.length) {
    params.push(dangerParam);
    filters.push(`${alias}.danger_level = ANY($${params.length})`);
  }
  const activeValues = String(query?.active || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (activeValues.length) {
    const clauses = activeValues.map((value) => {
      params.push(`%${value}%`);
      return `LOWER(${alias}.active_period) LIKE LOWER($${params.length})`;
    });
    filters.push(`(${clauses.join(" OR ")})`);
  }
  return filters;
}

function mapPestListRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    photo_url: row.photo_url,
    danger_level: row.danger_level,
    symptoms: row.symptoms,
    active_period: row.active_period,
    updated_at: row.updated_at,
  };
}

function mapPestDetailRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    photo_url: row.photo_url,
    danger_level: row.danger_level,
    symptoms: row.symptoms,
    active_period: row.active_period,
    fight_text: row.fight_text || EMPTY_RICH_DOC,
    fight_text_plain: row.fight_text_plain || "",
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    medicines: Array.isArray(row.medicines) ? row.medicines : [],
  };
}

const pestsRouter = createCareCatalogRouter({
  table: "pests",
  path: "pests",
  alias: "p",
  entityLabel: "Вредитель",
  historyTable: "pests_history",
  historyEntityColumn: "pest_id",
  listSelect: `
    p.id, p.slug, p.name, p.description, p.photo_url,
    p.danger_level, p.symptoms, p.active_period, p.updated_at
  `,
  detailSelect: `
    p.id, p.slug, p.name, p.description, p.photo_url,
    p.danger_level, p.symptoms, p.active_period,
    p.fight_text, p.fight_text_plain,
    p.created_by, p.created_at, p.updated_at,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', m.id,
            'slug', m.slug,
            'name', m.name,
            'medicine_type', m.medicine_type
          )
          ORDER BY LOWER(m.name)
        )
        FROM pest_medicine pm
        JOIN medicines m ON m.id = pm.medicine_id
        WHERE pm.pest_id = p.id
      ),
      '[]'::json
    ) AS medicines
  `,
  searchColumns: [
    "p.name",
    "p.description",
    "p.symptoms",
    "p.active_period",
  ],
  buildFilters: buildPestsFilters,
  fields: {
    name: { required: true },
    description: {},
    photo_url: { type: "url" },
    danger_level: { type: "enum", values: DANGER_LEVELS },
    symptoms: {},
    active_period: {},
    fight_text: { type: "json", textField: "fight_text_plain" },
  },
  historyFields: [
    "name",
    "description",
    "photo_url",
    "danger_level",
    "symptoms",
    "active_period",
    "fight_text",
    "fight_text_plain",
  ],
  mapListRow: mapPestListRow,
  mapDetailRow: mapPestDetailRow,
});

pestsRouter.post("/:id/medicines", requirePermission("plants_admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid pest id" });
    }
    const ids = parseIntArray(req.body?.ids);
    if (!ids.length) {
      return res.status(400).json({ message: "ids array is required" });
    }
    await ensureMedicinesExist(ids);
    await linkMedicinesToPest(id, ids, req.user?.id || null);
    const medicines = await fetchPestMedicines(id);
    return res.json({ medicines });
  } catch (error) {
    console.error("POST /api/pests/:id/medicines", error);
    if (error?.status && Number.isInteger(error.status)) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({ message: "Не удалось привязать лекарства" });
  }
});

pestsRouter.delete("/:id/medicines/:medicineId", requirePermission("plants_admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const medicineId = Number(req.params.medicineId);
    if (!Number.isFinite(id) || !Number.isFinite(medicineId)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const deleted = await pool.query(
      "DELETE FROM pest_medicine WHERE pest_id = $1 AND medicine_id = $2 RETURNING medicine_id",
      [id, medicineId]
    );
    if (!deleted.rows.length) {
      return res.status(404).json({ message: "Связь не найдена" });
    }
    await logPestMedicineHistory(id, req.user?.id || null, medicineId, "remove");
    const medicines = await fetchPestMedicines(id);
    return res.json({ medicines });
  } catch (error) {
    console.error("DELETE /api/pests/:id/medicines/:medicineId", error);
    return res.status(500).json({ message: "Не удалось удалить связь" });
  }
});

export default pestsRouter;

async function ensureMedicinesExist(ids) {
  if (!ids?.length) return;
  const existing = await pool.query("SELECT id FROM medicines WHERE id = ANY($1)", [ids]);
  const found = new Set(existing.rows.map((row) => row.id));
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length) {
    const err = new Error(`Некоторые лекарства не найдены: ${missing.join(", ")}`);
    err.status = 404;
    throw err;
  }
}

async function linkMedicinesToPest(pestId, ids, userId) {
  if (!ids?.length) return;
  const values = ids.map((_, idx) => `($1, $${idx + 2})`).join(", ");
  const params = [pestId, ...ids];
  const inserted = await pool.query(
    `INSERT INTO pest_medicine (pest_id, medicine_id)
     VALUES ${values}
     ON CONFLICT DO NOTHING
     RETURNING medicine_id`,
    params
  );
  for (const row of inserted.rows) {
    const medicineId = row.medicine_id;
    await logPestMedicineHistory(pestId, userId, medicineId, "add");
  }
}

async function fetchPestMedicines(pestId) {
  const q = await pool.query(
    `SELECT m.id, m.slug, m.name, m.medicine_type
     FROM pest_medicine pm
     JOIN medicines m ON m.id = pm.medicine_id
     WHERE pm.pest_id = $1
     ORDER BY LOWER(m.name)`,
    [pestId]
  );
  return q.rows;
}

async function logPestMedicineHistory(pestId, userId, medicineId, action) {
  const field = "medicines";
  const newValue = action === "add" ? String(medicineId) : null;
  const oldValue = action === "remove" ? String(medicineId) : null;
  await pool.query(
    `INSERT INTO pests_history (pest_id, user_id, field, old_value, new_value)
     VALUES ($1, $2, $3, $4, $5)`,
    [pestId, userId, field, oldValue, newValue]
  );
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
