import { createCareCatalogRouter, EMPTY_RICH_DOC } from "./careCatalogFactory.js";

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
    d.prevention, d.created_by, d.created_at, d.updated_at
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

export default diseasesRouter;
