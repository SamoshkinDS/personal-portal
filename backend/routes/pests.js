import { createCareCatalogRouter, EMPTY_RICH_DOC } from "./careCatalogFactory.js";

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
    p.created_by, p.created_at, p.updated_at
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

export default pestsRouter;
