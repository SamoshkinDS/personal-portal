import process from "process";
import { pool } from "../db/connect.js";
import { ensureUniquePlantSlug } from "../utils/slugify.js";

const SAMPLE_PLANTS = [
  {
    common: "Фикус каучуконосный",
    latin: "Ficus elastica",
    english: "Rubber plant",
    family: "Тутовые",
    origin: "Юго-Восточная Азия",
    bloom: null,
    maxHeight: 180,
  },
  {
    common: "Монстера deliciosa",
    latin: "Monstera deliciosa",
    english: "Swiss cheese plant",
    family: "Ароидные",
    origin: "Центральная Америка",
    bloom: 7,
    maxHeight: 250,
  },
  {
    common: "Пеперомия арбузная",
    latin: "Peperomia argyreia",
    english: "Watermelon peperomia",
    family: "Перецветные",
    origin: "Бразилия",
    bloom: 6,
    maxHeight: 35,
  },
  {
    common: "Сансеверия цилиндрическая",
    latin: "Sansevieria cylindrica",
    english: "African spear",
    family: "Спаржевые",
    origin: "Африка",
    bloom: 8,
    maxHeight: 120,
  },
  {
    common: "Стрелиция королевская",
    latin: "Strelitzia reginae",
    english: "Bird of Paradise",
    family: "Стрелициевые",
    origin: "ЮАР",
    bloom: 2,
    maxHeight: 200,
  },
  {
    common: "Пахира водяная",
    latin: "Pachira aquatica",
    english: "Money tree",
    family: "Мальвовые",
    origin: "Южная Америка",
    bloom: null,
    maxHeight: 180,
  },
  {
    common: "Калатея орбифолия",
    latin: "Calathea orbifolia",
    english: "Prayer plant",
    family: "Марантовые",
    origin: "Бразилия",
    bloom: 9,
    maxHeight: 80,
  },
  {
    common: "Алоказия поли",
    latin: "Alocasia amazonica",
    english: "African mask plant",
    family: "Ароидные",
    origin: "Филиппины",
    bloom: 5,
    maxHeight: 70,
  },
  {
    common: "Хойя карноза",
    latin: "Hoya carnosa",
    english: "Wax plant",
    family: "Кутровые",
    origin: "Юго-Восточная Азия",
    bloom: 6,
    maxHeight: 250,
  },
  {
    common: "Замиокулькас замиелистный",
    latin: "Zamioculcas zamiifolia",
    english: "ZZ plant",
    family: "Ароидные",
    origin: "Танзания",
    bloom: null,
    maxHeight: 120,
  },
];

const TAG_PRESETS = ["суккулент", "цветущий", "тенелюбивый"];

async function main() {
  const force = process.argv.includes("--force");
  const count = await pool.query("SELECT COUNT(*)::int AS count FROM plants");
  if (count.rows[0].count > 0 && !force) {
    console.log("Plants already seeded. Use --force to add duplicates.");
    await pool.end();
    return;
  }

  const dicts = await loadDictionaries();
  const tagMap = await ensureTags(TAG_PRESETS);

  for (const sample of SAMPLE_PLANTS) {
    const slug = await ensureUniquePlantSlug({
      englishName: sample.english,
      latinName: sample.latin,
      commonName: sample.common,
    });
    const inserted = await pool.query(
      `INSERT INTO plants (
        slug, common_name, latin_name, english_name,
        family, origin,
        light_id, watering_id, soil_id, humidity_id, temperature_id,
        description, max_height_cm, blooming_month,
        toxicity_for_cats_level, toxicity_for_dogs_level, toxicity_for_humans_level,
        location_id, status
      ) VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,$11,
        $12,$13,$14,
        $15,$16,$17,
        $18,'created'
      )
      ON CONFLICT (slug) DO NOTHING
      RETURNING id`,
      [
        slug,
        sample.common,
        sample.latin,
        sample.english,
        sample.family,
        sample.origin,
        pickRandom(dicts.light),
        pickRandom(dicts.watering),
        pickRandom(dicts.soil),
        pickRandom(dicts.humidity),
        pickRandom(dicts.temperature),
        `Автосгенерированное растение для демо. Происхождение: ${sample.origin}.`,
        sample.maxHeight,
        sample.bloom,
        randomToxic(),
        randomToxic(),
        randomToxic(),
        pickRandom(dicts.locations),
      ]
    );
    if (!inserted.rows.length) continue;
    const plantId = inserted.rows[0].id;
    const tagValues = shuffle([...tagMap.values()]).slice(0, 2);
    for (const tagId of tagValues) {
      await pool.query(
        "INSERT INTO plant_tag_map (plant_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
        [plantId, tagId]
      );
    }
  }

  console.log("Seeded demo plants");
  await pool.end();
}

async function loadDictionaries() {
  const entries = {};
  for (const [key, table] of Object.entries({
    light: "dict_light",
    watering: "dict_watering",
    soil: "dict_soil",
    humidity: "dict_humidity",
    temperature: "dict_temperature",
    locations: "dict_locations",
  })) {
    const q = await pool.query(`SELECT id FROM ${table}`);
    entries[key] = q.rows.map((row) => row.id);
  }
  return entries;
}

async function ensureTags(names) {
  const map = new Map();
  for (const name of names) {
    const q = await pool.query(
      "INSERT INTO plant_tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id",
      [name]
    );
    map.set(name, q.rows[0].id);
  }
  return map;
}

function pickRandom(list) {
  if (!list?.length) return null;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx] || null;
}

function randomToxic() {
  return Math.random() < 0.3 ? Math.floor(Math.random() * 4) : null;
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

main().catch((err) => {
  console.error("Seed plants failed", err);
  process.exitCode = 1;
});
