import process from "process";
import { pool } from "../db/connect.js";
import { ensureUniquePlantSlug, ensureUniqueSlugForTable } from "../utils/slugify.js";
import { ensureCareCatalogSchema } from "../db/careSchema.js";
import { ensurePlantsSchema } from "../db/plantsSchema.js";

const SAMPLE_PLANTS = [
  {
    common: "Р¤РёРєСѓСЃ РєР°СѓС‡СѓРєРѕРЅРѕСЃРЅС‹Р№",
    latin: "Ficus elastica",
    english: "Rubber plant",
    family: "РўСѓС‚РѕРІС‹Рµ",
    origin: "Р®РіРѕ-Р’РѕСЃС‚РѕС‡РЅР°СЏ РђР·РёСЏ",
    bloom: null,
    maxHeight: 180,
  },
  {
    common: "РњРѕРЅСЃС‚РµСЂР° deliciosa",
    latin: "Monstera deliciosa",
    english: "Swiss cheese plant",
    family: "РђСЂРѕРёРґРЅС‹Рµ",
    origin: "Р¦РµРЅС‚СЂР°Р»СЊРЅР°СЏ РђРјРµСЂРёРєР°",
    bloom: 7,
    maxHeight: 250,
  },
  {
    common: "РџРµРїРµСЂРѕРјРёСЏ Р°СЂР±СѓР·РЅР°СЏ",
    latin: "Peperomia argyreia",
    english: "Watermelon peperomia",
    family: "РџРµСЂРµС†РІРµС‚РЅС‹Рµ",
    origin: "Р‘СЂР°Р·РёР»РёСЏ",
    bloom: 6,
    maxHeight: 35,
  },
  {
    common: "РЎР°РЅСЃРµРІРµСЂРёСЏ С†РёР»РёРЅРґСЂРёС‡РµСЃРєР°СЏ",
    latin: "Sansevieria cylindrica",
    english: "African spear",
    family: "РЎРїР°СЂР¶РµРІС‹Рµ",
    origin: "РђС„СЂРёРєР°",
    bloom: 8,
    maxHeight: 120,
  },
  {
    common: "РЎС‚СЂРµР»РёС†РёСЏ РєРѕСЂРѕР»РµРІСЃРєР°СЏ",
    latin: "Strelitzia reginae",
    english: "Bird of Paradise",
    family: "РЎС‚СЂРµР»РёС†РёРµРІС‹Рµ",
    origin: "Р®РђР ",
    bloom: 2,
    maxHeight: 200,
  },
  {
    common: "РџР°С…РёСЂР° РІРѕРґСЏРЅР°СЏ",
    latin: "Pachira aquatica",
    english: "Money tree",
    family: "РњР°Р»СЊРІРѕРІС‹Рµ",
    origin: "Р®Р¶РЅР°СЏ РђРјРµСЂРёРєР°",
    bloom: null,
    maxHeight: 180,
  },
  {
    common: "РљР°Р»Р°С‚РµСЏ РѕСЂР±РёС„РѕР»РёСЏ",
    latin: "Calathea orbifolia",
    english: "Prayer plant",
    family: "РњР°СЂР°РЅС‚РѕРІС‹Рµ",
    origin: "Р‘СЂР°Р·РёР»РёСЏ",
    bloom: 9,
    maxHeight: 80,
  },
  {
    common: "РђР»РѕРєР°Р·РёСЏ РїРѕР»Рё",
    latin: "Alocasia amazonica",
    english: "African mask plant",
    family: "РђСЂРѕРёРґРЅС‹Рµ",
    origin: "Р¤РёР»РёРїРїРёРЅС‹",
    bloom: 5,
    maxHeight: 70,
  },
  {
    common: "РҐРѕР№СЏ РєР°СЂРЅРѕР·Р°",
    latin: "Hoya carnosa",
    english: "Wax plant",
    family: "РљСѓС‚СЂРѕРІС‹Рµ",
    origin: "Р®РіРѕ-Р’РѕСЃС‚РѕС‡РЅР°СЏ РђР·РёСЏ",
    bloom: 6,
    maxHeight: 250,
  },
  {
    common: "Р—Р°РјРёРѕРєСѓР»СЊРєР°СЃ Р·Р°РјРёРµР»РёСЃС‚РЅС‹Р№",
    latin: "Zamioculcas zamiifolia",
    english: "ZZ plant",
    family: "РђСЂРѕРёРґРЅС‹Рµ",
    origin: "РўР°РЅР·Р°РЅРёСЏ",
    bloom: null,
    maxHeight: 120,
  },
  {
    common: "Спатифиллум сенсация",
    latin: "Spathiphyllum floribundum",
    english: "Peace lily Sensation",
    family: "Ароидные",
    origin: "Латинская Америка",
    bloom: 5,
    maxHeight: 90,
    problems: {
      pests: ["Паутинный клещ", "Щитовка"],
      disease: "Корневая гниль",
    },
  },
  {
    common: "Калатея Макояна",
    latin: "Calathea makoyana",
    english: "Peacock plant",
    family: "Марантовые",
    origin: "Бразилия",
    bloom: null,
    maxHeight: 60,
    problems: {
      pests: ["Мучнистый червец", "Паутинный клещ"],
      disease: "Хлороз",
    },
  },
  {
    common: "Лавр комнатный",
    latin: "Laurus nobilis",
    english: "Bay laurel",
    family: "Лавровые",
    origin: "Средиземноморье",
    bloom: 4,
    maxHeight: 150,
    problems: {
      pests: ["Трипсы", "Щитовка"],
      disease: "Мучнистая роса",
    },
  },
];

const SAMPLE_PESTS = [
  {
    name: "Паутинный клещ",
    description: "Мелкие паучки, окутывающие побеги тонкой паутиной и высасывающие соки.",
    danger_level: "medium",
    symptoms: "Тонкая паутина и светлые точки на листьях",
    active_period: "Весна-лето",
  },
  {
    name: "Трипсы",
    description: "Миниатюрные насекомые, оставляющие серебристые штрихи и точки.",
    danger_level: "high",
    symptoms: "Серебристые полосы и коричневые штрихи на пластинах",
    active_period: "Круглый год при тёплом воздухе",
  },
  {
    name: "Щитовка",
    description: "Насекомые в плотной «скорлупе», покрывающие стебли и листья.",
    danger_level: "medium",
    symptoms: "Липкий налёт и коричневые бляшки на листьях",
    active_period: "Зима и межсезонье",
  },
  {
    name: "Мучнистый червец",
    description: "Белые пушистые комочки в пазухах и на корнях.",
    danger_level: "medium",
    symptoms: "Белый налёт, деформация новых побегов",
    active_period: "Осень-зима при сухом воздухе",
  },
];

const SAMPLE_DISEASES = [
  {
    name: "Корневая гниль",
    disease_type: "грибковое",
    reason: "Перелив и застой влаги",
    symptoms: "Вялые листья, запах сырости от субстрата",
    description: "Гниение корневой системы из-за переувлажнения и плохого дренажа.",
    prevention: "Пролив по графику, лёгкий грунт и обязательный дренаж.",
  },
  {
    name: "Мучнистая роса",
    disease_type: "грибковое",
    reason: "Холодный влажный воздух",
    symptoms: "Белый мучнистый налёт на листьях",
    description: "Грибок быстро распространяется по пластине и тормозит рост растения.",
    prevention: "Проветривание, умеренный полив, профилактические фунгициды.",
  },
  {
    name: "Хлороз",
    disease_type: "неинфекционное",
    reason: "Дефицит железа и жёсткая вода",
    symptoms: "Жёлтые листья с зелёными прожилками",
    description: "Нарушение фотосинтеза из-за нехватки микроэлементов.",
    prevention: "Использование мягкой воды и подкормок с хелатами железа.",
  },
];

const TAG_PRESETS = ["СЃСѓРєРєСѓР»РµРЅС‚", "С†РІРµС‚СѓС‰РёР№", "С‚РµРЅРµР»СЋР±РёРІС‹Р№"];

async function main() {
  await ensureCareCatalogSchema();
  await ensurePlantsSchema();
  const force = process.argv.includes("--force");
  const count = await pool.query("SELECT COUNT(*)::int AS count FROM plants");
  if (count.rows[0].count > 0 && !force) {
    console.log("Plants already seeded. Use --force to add duplicates.");
    await pool.end();
    return;
  }

  const dicts = await loadDictionaries();
  const tagMap = await ensureTags(TAG_PRESETS);
  const careRefs = await ensureCareSamples();

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
        `РђРІС‚РѕСЃРіРµРЅРµСЂРёСЂРѕРІР°РЅРЅРѕРµ СЂР°СЃС‚РµРЅРёРµ РґР»СЏ РґРµРјРѕ. РџСЂРѕРёСЃС…РѕР¶РґРµРЅРёРµ: ${sample.origin}.`,
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
    if (sample.problems) {
      await linkProblemsToPlant(plantId, sample.problems, careRefs);
    }
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

async function ensureCareSamples() {
  const pests = new Map();
  for (const entry of SAMPLE_PESTS) {
    const slug = await ensureUniqueSlugForTable("pests", entry.name, { fallbackPrefix: "pest" });
    const q = await pool.query(
      `INSERT INTO pests (slug, name, description, danger_level, symptoms, active_period)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (slug) DO UPDATE SET
         description = EXCLUDED.description,
         danger_level = EXCLUDED.danger_level,
         symptoms = EXCLUDED.symptoms,
         active_period = EXCLUDED.active_period
       RETURNING id`,
      [slug, entry.name, entry.description, entry.danger_level, entry.symptoms, entry.active_period]
    );
    pests.set(entry.name, q.rows[0].id);
  }
  const diseases = new Map();
  for (const entry of SAMPLE_DISEASES) {
    const slug = await ensureUniqueSlugForTable("diseases", entry.name, { fallbackPrefix: "disease" });
    const q = await pool.query(
      `INSERT INTO diseases (slug, name, description, disease_type, reason, symptoms, prevention)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (slug) DO UPDATE SET
         description = EXCLUDED.description,
         disease_type = EXCLUDED.disease_type,
         reason = EXCLUDED.reason,
         symptoms = EXCLUDED.symptoms,
         prevention = EXCLUDED.prevention
       RETURNING id`,
      [slug, entry.name, entry.description, entry.disease_type, entry.reason, entry.symptoms, entry.prevention]
    );
    diseases.set(entry.name, q.rows[0].id);
  }
  return { pests, diseases };
}

async function linkProblemsToPlant(plantId, problems, references) {
  if (!problems) return;
  if (Array.isArray(problems.pests) && problems.pests.length) {
    const pestIds = problems.pests
      .map((name) => references.pests.get(name))
      .filter(Boolean);
    if (pestIds.length) {
      const values = pestIds.map((_, idx) => `($1, $${idx + 2}, NULL)`).join(", ");
      await pool.query(
        `INSERT INTO plant_pest (plant_id, pest_id, created_by) VALUES ${values} ON CONFLICT DO NOTHING`,
        [plantId, ...pestIds]
      );
    }
  }
  const diseaseList = Array.isArray(problems.diseases)
    ? problems.diseases
    : problems.disease
    ? [problems.disease]
    : [];
  if (diseaseList.length) {
    const diseaseIds = diseaseList.map((name) => references.diseases.get(name)).filter(Boolean);
    if (diseaseIds.length) {
      const values = diseaseIds.map((_, idx) => `($1, $${idx + 2}, NULL)`).join(", ");
      await pool.query(
        `INSERT INTO plant_disease (plant_id, disease_id, created_by) VALUES ${values} ON CONFLICT DO NOTHING`,
        [plantId, ...diseaseIds]
      );
    }
  }
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


