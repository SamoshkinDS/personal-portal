import { createCareCatalogRouter, EMPTY_RICH_DOC } from "./careCatalogFactory.js";

function buildMedicineFilters(query, alias, params) {
  const filters = [];
  const typeValues = String(query?.type || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  if (typeValues.length) {
    params.push(typeValues);
    filters.push(`LOWER(${alias}.medicine_type) = ANY($${params.length})`);
  }
  const formValues = String(query?.form || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  if (formValues.length) {
    params.push(formValues);
    filters.push(`LOWER(${alias}.form) = ANY($${params.length})`);
  }
  return filters;
}

function mapMedicineListRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    photo_url: row.photo_url,
    medicine_type: row.medicine_type,
    form: row.form,
    updated_at: row.updated_at,
  };
}

function mapMedicineDetailRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    photo_url: row.photo_url,
    medicine_type: row.medicine_type,
    form: row.form,
    concentration: row.concentration,
    expiration_date: row.expiration_date,
    instruction: row.instruction || EMPTY_RICH_DOC,
    instruction_text: row.instruction_text || "",
    shop_links: row.shop_links || "",
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    pests: Array.isArray(row.pests) ? row.pests : [],
    diseases: Array.isArray(row.diseases) ? row.diseases : [],
  };
}

const medicinesRouter = createCareCatalogRouter({
  table: "medicines",
  path: "medicines",
  alias: "m",
  entityLabel: "Лекарство",
  historyTable: "medicines_history",
  historyEntityColumn: "medicine_id",
  listSelect: `
    m.id, m.slug, m.name, m.description, m.photo_url,
    m.medicine_type, m.form, m.updated_at
  `,
  detailSelect: `
    m.id, m.slug, m.name, m.description, m.photo_url,
    m.medicine_type, m.form, m.concentration,
    m.expiration_date, m.instruction, m.instruction_text,
    m.shop_links, m.created_by, m.created_at, m.updated_at,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', p.id,
            'slug', p.slug,
            'name', p.name,
            'danger_level', p.danger_level
          )
          ORDER BY LOWER(p.name)
        )
        FROM pest_medicine pm
        JOIN pests p ON p.id = pm.pest_id
        WHERE pm.medicine_id = m.id
      ),
      '[]'::json
    ) AS pests,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', d.id,
            'slug', d.slug,
            'name', d.name,
            'disease_type', d.disease_type
          )
          ORDER BY LOWER(d.name)
        )
        FROM disease_medicine dm
        JOIN diseases d ON d.id = dm.disease_id
        WHERE dm.medicine_id = m.id
      ),
      '[]'::json
    ) AS diseases
  `,
  searchColumns: ["m.name", "m.description", "m.medicine_type", "m.form"],
  buildFilters: buildMedicineFilters,
  fields: {
    name: { required: true },
    description: {},
    photo_url: { type: "url" },
    medicine_type: {},
    form: {},
    concentration: {},
    expiration_date: { type: "date" },
    instruction: { type: "json", textField: "instruction_text" },
    shop_links: { allowEmpty: true, trim: false },
  },
  historyFields: [
    "name",
    "description",
    "photo_url",
    "medicine_type",
    "form",
    "concentration",
    "expiration_date",
    "instruction",
    "instruction_text",
    "shop_links",
  ],
  mapListRow: mapMedicineListRow,
  mapDetailRow: mapMedicineDetailRow,
});

export default medicinesRouter;
