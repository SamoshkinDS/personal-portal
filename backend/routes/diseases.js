import { createCareCatalogRouter, EMPTY_RICH_DOC } from "./careCatalogFactory.js";
import { pool } from "../db/connect.js";
import { requirePermission } from "../middleware/auth.js";

function buildDiseaseFilters(query, alias, params) {
  const filters = [];
  const typeValues = String(query?.type || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  if (typeValues.length) {
    params.push(typeValues);
    filters.push(`LOWER(${alias}.disease_type) = ANY($${params.length})`);
  }
  const reasonValues = String(query?.reason || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (reasonValues.length) {
    const clauses = reasonValues.map((value) => {
      params.push(`%${value}%`);
      return `LOWER(${alias}.reason) LIKE LOWER($${params.length})`;
    });
    filters.push(`(${clauses.join(" OR ")})`);
  }
  return filters;
}

function mapDiseaseListRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    photo_url: row.photo_url,
    disease_type: row.disease_type,
    reason: row.reason,
    updated_at: row.updated_at,
  };
}

function mapDiseaseDetailRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    photo_url: row.photo_url,
    disease_type: row.disease_type,
    reason: row.reason,
    symptoms: row.symptoms,
    treatment_text: row.treatment_text || EMPTY_RICH_DOC,
    treatment_text_plain: row.treatment_text_plain || "",
    prevention: row.prevention,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    medicines: Array.isArray(row.medicines) ? row.medicines : [],
  };
}

const diseasesRouter = createCareCatalogRouter({
  table: "diseases",
  path: "diseases",
  alias: "d",
  entityLabel: "Заболевание",
  historyTable: "diseases_history",
  historyEntityColumn: "disease_id",
  listSelect: `
    d.id, d.slug, d.name, d.description, d.photo_url,
    d.disease_type, d.reason, d.updated_at
  `,
  detailSelect: `
    d.id, d.slug, d.name, d.description, d.photo_url,
    d.reason, d.disease_type, d.symptoms,
    d.treatment_text, d.treatment_text_plain,
    d.prevention, d.created_by, d.created_at, d.updated_at,
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
        FROM disease_medicine dm
        JOIN medicines m ON m.id = dm.medicine_id
        WHERE dm.disease_id = d.id
      ),
      '[]'::json
    ) AS medicines
  `,
  searchColumns: ["d.name", "d.description", "d.reason", "d.disease_type", "d.symptoms"],
  buildFilters: buildDiseaseFilters,
  fields: {
    name: { required: true },
    description: {},
    photo_url: { type: "url" },
    reason: {},
    disease_type: {},
    symptoms: {},
    treatment_text: { type: "json", textField: "treatment_text_plain" },
    prevention: {},
  },
  historyFields: [
    "name",
    "description",
    "photo_url",
    "reason",
    "disease_type",
    "symptoms",
    "treatment_text",
    "treatment_text_plain",
    "prevention",
  ],
  mapListRow: mapDiseaseListRow,
  mapDetailRow: mapDiseaseDetailRow,
});

diseasesRouter.post("/:id/medicines", requirePermission("plants_admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid disease id" });
    }
    const ids = parseIntArray(req.body?.ids);
    if (!ids.length) {
      return res.status(400).json({ message: "ids array is required" });
    }
    await ensureMedicinesExist(ids);
    await linkMedicinesToDisease(id, ids, req.user?.id || null);
    const medicines = await fetchDiseaseMedicines(id);
    return res.json({ medicines });
  } catch (error) {
    console.error("POST /api/diseases/:id/medicines", error);
    if (error?.status && Number.isInteger(error.status)) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({ message: "Не удалось привязать лекарства" });
  }
});

diseasesRouter.delete("/:id/medicines/:medicineId", requirePermission("plants_admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const medicineId = Number(req.params.medicineId);
    if (!Number.isFinite(id) || !Number.isFinite(medicineId)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const deleted = await pool.query(
      "DELETE FROM disease_medicine WHERE disease_id = $1 AND medicine_id = $2 RETURNING medicine_id",
      [id, medicineId]
    );
    if (!deleted.rows.length) {
      return res.status(404).json({ message: "Связь не найдена" });
    }
    await logDiseaseMedicineHistory(id, req.user?.id || null, medicineId, "remove");
    const medicines = await fetchDiseaseMedicines(id);
    return res.json({ medicines });
  } catch (error) {
    console.error("DELETE /api/diseases/:id/medicines/:medicineId", error);
    return res.status(500).json({ message: "Не удалось удалить связь" });
  }
});

export default diseasesRouter;

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

async function linkMedicinesToDisease(diseaseId, ids, userId) {
  if (!ids?.length) return;
  const values = ids.map((_, idx) => `($1, $${idx + 2})`).join(", ");
  const params = [diseaseId, ...ids];
  const inserted = await pool.query(
    `INSERT INTO disease_medicine (disease_id, medicine_id)
     VALUES ${values}
     ON CONFLICT DO NOTHING
     RETURNING medicine_id`,
    params
  );
  for (const row of inserted.rows) {
    const medicineId = row.medicine_id;
    await logDiseaseMedicineHistory(diseaseId, userId, medicineId, "add");
  }
}

async function fetchDiseaseMedicines(diseaseId) {
  const q = await pool.query(
    `SELECT m.id, m.slug, m.name, m.medicine_type
     FROM disease_medicine dm
     JOIN medicines m ON m.id = dm.medicine_id
     WHERE dm.disease_id = $1
     ORDER BY LOWER(m.name)`,
    [diseaseId]
  );
  return q.rows;
}

async function logDiseaseMedicineHistory(diseaseId, userId, medicineId, action) {
  const field = "medicines";
  const newValue = action === "add" ? String(medicineId) : null;
  const oldValue = action === "remove" ? String(medicineId) : null;
  await pool.query(
    `INSERT INTO diseases_history (disease_id, user_id, field, old_value, new_value)
     VALUES ($1, $2, $3, $4, $5)`,
    [diseaseId, userId, field, oldValue, newValue]
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
