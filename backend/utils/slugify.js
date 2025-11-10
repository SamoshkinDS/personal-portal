import { pool } from "../db/connect.js";

const CYRILLIC_MAP = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "j",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ы: "y",
  э: "e",
  ю: "yu",
  я: "ya",
  ь: "",
  ъ: "",
};

function transliterate(input = "") {
  const lower = input.toLowerCase();
  let result = "";
  for (const char of lower) {
    if (CYRILLIC_MAP[char]) {
      result += CYRILLIC_MAP[char];
    } else {
      result += char;
    }
  }
  return result;
}

export function slugifyText(input) {
  if (!input) return "";
  const normalized = transliterate(input)
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return normalized;
}

export async function ensureUniquePlantSlug({ englishName, latinName, commonName, fallback, existingId }) {
  const baseSource = englishName || latinName || commonName || fallback || "plant";
  let base = slugifyText(baseSource);
  if (!base) {
    base = `plant-${Date.now()}`;
  }
  let slug = base;
  let attempt = 1;
  while (true) {
    const params = [slug];
    let query = "SELECT id FROM plants WHERE slug = $1";
    if (existingId) {
      params.push(existingId);
      query += " AND id <> $2";
    }
    const q = await pool.query(query, params);
    if (q.rows.length === 0) {
      return slug;
    }
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

export async function ensureUniqueSlugForTable(tableName, sourceValue, { fallbackPrefix, existingId } = {}) {
  const baseSource = sourceValue || fallbackPrefix || tableName || "item";
  let base = slugifyText(baseSource);
  if (!base) {
    base = slugifyText(fallbackPrefix || "item") || `item-${Date.now()}`;
  }
  let slug = base;
  let attempt = 1;
  while (true) {
    const params = [slug];
    let query = `SELECT id FROM ${tableName} WHERE slug = $1`;
    if (existingId) {
      params.push(existingId);
      query += " AND id <> $2";
    }
    const existing = await pool.query(query, params);
    if (existing.rows.length === 0) {
      return slug;
    }
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}
