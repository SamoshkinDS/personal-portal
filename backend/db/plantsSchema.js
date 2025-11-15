import { pool } from "./connect.js";

const DEFAULT_LIGHT = [
  "Яркий рассеянный",
  "Рассеянный",
  "Полутень",
  "Тень",
  "Прямой свет (утро)",
];

const DEFAULT_WATERING = [
  "Частый (2-3 раза в неделю)",
  "Умеренный (раз в неделю)",
  "Редкий (раз в 2-3 недели)",
  "Опрыскивание",
];

const DEFAULT_SOIL = [
  "Воздушный субстрат",
  "Кактусовый грунт",
  "Универсальный",
  "Сфагнум",
];

const DEFAULT_HUMIDITY = [
  "Низкая (до 40%)",
  "Средняя (40-60%)",
  "Высокая (60%+)",
];

const DEFAULT_TEMPERATURE = [
  "Холодный (15°C и ниже)",
  "Умеренный (18-24°C)",
  "Тёплый (25°C+)",
  "С прохладной зимовкой",
];

const DEFAULT_LOCATIONS = [
  "Гостиная / подоконник",
  "Кухня / столешница",
  "Спальня / тумба",
  "Ванная / полка",
  "Балкон / стеллаж",
];

const DEFAULT_TAGS = ["суккулент", "цветущий", "тенелюбивый"];
const DEFAULT_CATEGORIES = ["Комнатные", "Цветущие", "Суккуленты", "Деревья", "Ампельные"];

async function seedDictionary(tableName, values) {
  for (const name of values) {
    await pool.query(
      `INSERT INTO ${tableName} (name)
       SELECT $1
       WHERE NOT EXISTS (SELECT 1 FROM ${tableName} WHERE lower(name) = lower($1))`,
      [name]
    );
  }
}

export async function ensurePlantsSchema() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm";`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS dict_light (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dict_watering (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dict_soil (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dict_humidity (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dict_temperature (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dict_locations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dict_categories (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS plant_tags (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS plants (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      common_name TEXT NOT NULL,
      latin_name TEXT,
      english_name TEXT,
      family TEXT,
      origin TEXT,
      light_id INT REFERENCES dict_light(id),
      watering_id INT REFERENCES dict_watering(id),
      soil_id INT REFERENCES dict_soil(id),
      humidity_id INT REFERENCES dict_humidity(id),
      temperature_id INT REFERENCES dict_temperature(id),
      description TEXT,
      max_height_cm INT,
      leaf_color TEXT,
      flower_color TEXT,
      blooming_month INT CHECK (blooming_month BETWEEN 1 AND 12),
      toxicity_for_cats_level INT,
      toxicity_for_dogs_level INT,
      toxicity_for_humans_level INT,
      acquisition_date DATE,
      location_id INT REFERENCES dict_locations(id),
      category_id INT REFERENCES dict_categories(id),
      is_published BOOLEAN DEFAULT false,
      main_image_url TEXT,
      main_preview_url TEXT,
      main_image_key TEXT,
      main_preview_key TEXT,
      status TEXT DEFAULT 'created' CHECK (status IN ('created','in_progress','done')),
      created_by INT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS plant_images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plant_id INT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      preview_url TEXT,
      image_key TEXT,
      preview_key TEXT,
      "order" INT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query(`ALTER TABLE plant_images ADD COLUMN IF NOT EXISTS "order" INT;`);
  await pool.query(`
    ALTER TABLE plants
    ADD COLUMN IF NOT EXISTS category_id INT REFERENCES dict_categories(id);
  `);
  await pool.query(`
    ALTER TABLE plants
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS plant_articles (
      plant_id INT PRIMARY KEY REFERENCES plants(id) ON DELETE CASCADE,
      content_rich JSONB DEFAULT '{}'::jsonb,
      content_text TEXT,
      updated_by INT,
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS plants_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS plants_history (
      id SERIAL PRIMARY KEY,
      plant_id INT REFERENCES plants(id) ON DELETE CASCADE,
      user_id INT,
      field TEXT,
      old_value TEXT,
      new_value TEXT,
      changed_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'plants_history_plant_id_fkey'
          AND table_name = 'plants_history'
      ) THEN
        ALTER TABLE plants_history
        DROP CONSTRAINT plants_history_plant_id_fkey;
      END IF;
    END$$;
  `);
  await pool.query(`
    ALTER TABLE plants_history
    ADD CONSTRAINT plants_history_plant_id_fkey
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS plant_tag_map (
      plant_id INT REFERENCES plants(id) ON DELETE CASCADE,
      tag_id INT REFERENCES plant_tags(id) ON DELETE CASCADE,
      PRIMARY KEY (plant_id, tag_id)
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS plant_pest (
      plant_id INT REFERENCES plants(id) ON DELETE CASCADE,
      pest_id INT REFERENCES pests(id) ON DELETE CASCADE,
      created_by INT,
      created_at TIMESTAMPTZ DEFAULT now(),
      PRIMARY KEY (plant_id, pest_id)
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS plant_disease (
      plant_id INT REFERENCES plants(id) ON DELETE CASCADE,
      disease_id INT REFERENCES diseases(id) ON DELETE CASCADE,
      created_by INT,
      created_at TIMESTAMPTZ DEFAULT now(),
      PRIMARY KEY (plant_id, disease_id)
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_plant_pest_pest_id ON plant_pest(pest_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_plant_disease_disease_id ON plant_disease(disease_id);`);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_plants'
      ) THEN
        CREATE TRIGGER set_timestamp_plants
        BEFORE UPDATE ON plants
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_plant_articles'
      ) THEN
        CREATE TRIGGER set_timestamp_plant_articles
        BEFORE UPDATE ON plant_articles
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END$$;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_plants_common_name_trgm ON plants USING GIN (common_name gin_trgm_ops);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_plants_latin_name_trgm ON plants USING GIN (latin_name gin_trgm_ops);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_plants_english_name_trgm ON plants USING GIN (english_name gin_trgm_ops);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_plants_family_trgm ON plants USING GIN (family gin_trgm_ops);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_plants_origin_trgm ON plants USING GIN (origin gin_trgm_ops);
  `);

  await seedDictionary("dict_light", DEFAULT_LIGHT);
  await seedDictionary("dict_watering", DEFAULT_WATERING);
  await seedDictionary("dict_soil", DEFAULT_SOIL);
  await seedDictionary("dict_humidity", DEFAULT_HUMIDITY);
  await seedDictionary("dict_temperature", DEFAULT_TEMPERATURE);
  await seedDictionary("dict_locations", DEFAULT_LOCATIONS);
  await seedDictionary("plant_tags", DEFAULT_TAGS);
  await seedDictionary("dict_categories", DEFAULT_CATEGORIES);
}
