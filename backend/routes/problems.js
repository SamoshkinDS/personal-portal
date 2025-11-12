import express from "express";
import { pool } from "../db/connect.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired);

router.get("/", async (req, res) => {
  try {
    const typeParam = String(req.query?.type || "all").toLowerCase();
    const type = ["all", "pest", "disease", "medicine"].includes(typeParam) ? typeParam : "all";
    const search = String(req.query?.query || "").trim();
    const onlyLinked = parseBoolean(req.query?.onlyLinked);
    const { limit, offset } = parsePagination(req.query);

    const { items, total } = await fetchProblems({ type, search, onlyLinked, limit, offset });
    const stats = await fetchProblemStats();

    res.json({ items, total, stats });
  } catch (error) {
    console.error("GET /api/problems", error);
    res.status(500).json({ message: "Не удалось загрузить проблемы" });
  }
});

export default router;

function parsePagination(query) {
  const limitParam = Number(query?.limit);
  const offsetParam = Number(query?.offset);
  const limit = Math.min(60, Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 24);
  const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;
  return { limit, offset };
}

function parseBoolean(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(normalized);
}

async function fetchProblems({ type, search, onlyLinked, limit, offset }) {
  const params = [];
  let paramIdx = 1;
  const unions = [];

  if (type === "all" || type === "pest") {
    const conditions = [];
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`p.name ILIKE $${paramIdx}`);
      paramIdx += 1;
    }
    if (onlyLinked) {
      conditions.push("EXISTS (SELECT 1 FROM plant_pest pp WHERE pp.pest_id = p.id)");
    }
    const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    unions.push(`
      SELECT
        'pest'::text AS type,
        p.id,
        p.slug,
        p.name AS entity_name,
        p.danger_level,
        NULL::text AS disease_type,
        NULL::text AS medicine_type,
        LOWER(p.name) AS sort_key,
        (SELECT COUNT(*) FROM plant_pest pp WHERE pp.pest_id = p.id) AS plants_count,
        (SELECT COUNT(*) FROM pest_medicine pm WHERE pm.pest_id = p.id) AS medicines_count,
        0::int AS pests_count,
        0::int AS diseases_count
      FROM pests p
      ${whereSql}
    `);
  }

  if (type === "all" || type === "disease") {
    const conditions = [];
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`d.name ILIKE $${paramIdx}`);
      paramIdx += 1;
    }
    if (onlyLinked) {
      conditions.push("EXISTS (SELECT 1 FROM plant_disease pd WHERE pd.disease_id = d.id)");
    }
    const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    unions.push(`
      SELECT
        'disease'::text AS type,
        d.id,
        d.slug,
        d.name AS entity_name,
        NULL::text AS danger_level,
        d.disease_type,
        NULL::text AS medicine_type,
        LOWER(d.name) AS sort_key,
        (SELECT COUNT(*) FROM plant_disease pd WHERE pd.disease_id = d.id) AS plants_count,
        (SELECT COUNT(*) FROM disease_medicine dm WHERE dm.disease_id = d.id) AS medicines_count,
        0::int AS pests_count,
        0::int AS diseases_count
      FROM diseases d
      ${whereSql}
    `);
  }

  if (type === "all" || type === "medicine") {
    const conditions = [];
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`m.name ILIKE $${paramIdx}`);
      paramIdx += 1;
    }
    if (onlyLinked) {
      conditions.push(`
        (
          EXISTS (SELECT 1 FROM pest_medicine pm WHERE pm.medicine_id = m.id)
          OR EXISTS (SELECT 1 FROM disease_medicine dm WHERE dm.medicine_id = m.id)
        )
      `);
    }
    const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    unions.push(`
      SELECT
        'medicine'::text AS type,
        m.id,
        m.slug,
        m.name AS entity_name,
        NULL::text AS danger_level,
        NULL::text AS disease_type,
        m.medicine_type,
        LOWER(m.name) AS sort_key,
        (
          SELECT COUNT(DISTINCT plant_id)
          FROM (
            SELECT pp.plant_id
            FROM pest_medicine pm
            JOIN plant_pest pp ON pp.pest_id = pm.pest_id
            WHERE pm.medicine_id = m.id
            UNION
            SELECT pd.plant_id
            FROM disease_medicine dm
            JOIN plant_disease pd ON pd.disease_id = dm.disease_id
            WHERE dm.medicine_id = m.id
          ) related_plants
        ) AS plants_count,
        0::int AS medicines_count,
        (SELECT COUNT(*) FROM pest_medicine pm WHERE pm.medicine_id = m.id) AS pests_count,
        (SELECT COUNT(*) FROM disease_medicine dm WHERE dm.medicine_id = m.id) AS diseases_count
      FROM medicines m
      ${whereSql}
    `);
  }

  if (!unions.length) {
    return { items: [], total: 0 };
  }

  const unionSql = unions.map((sql) => `(${sql})`).join(" UNION ALL ");
  const baseParams = params.slice();
  const listSql = `
    ${unionSql}
    ORDER BY sort_key ASC
    LIMIT $${paramIdx}
    OFFSET $${paramIdx + 1}
  `;
  const listParams = baseParams.concat([limit, offset]);
  const [itemsQ, countQ] = await Promise.all([
    pool.query(listSql, listParams),
    pool.query(`SELECT COUNT(*)::int AS count FROM (${unionSql}) AS combined`, baseParams),
  ]);

  const items = itemsQ.rows.map((row) => ({
    type: row.type,
    id: row.id,
    slug: row.slug,
    name: row.entity_name,
    danger_level: row.danger_level,
    disease_type: row.disease_type,
    medicine_type: row.medicine_type,
    stats: {
      plants: Number(row.plants_count) || 0,
      medicines: Number(row.medicines_count) || 0,
      pests: Number(row.pests_count) || 0,
      diseases: Number(row.diseases_count) || 0,
    },
  }));

  return {
    items,
    total: countQ.rows[0]?.count || 0,
  };
}

async function fetchProblemStats() {
  const [pests, diseases, medicines] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM pests"),
    pool.query("SELECT COUNT(*)::int AS count FROM diseases"),
    pool.query("SELECT COUNT(*)::int AS count FROM medicines"),
  ]);
  return {
    pests: pests.rows[0]?.count || 0,
    diseases: diseases.rows[0]?.count || 0,
    medicines: medicines.rows[0]?.count || 0,
  };
}

