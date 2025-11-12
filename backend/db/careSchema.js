import { pool } from "./connect.js";

const EMPTY_RICH_DOC = `'{\"type\":\"doc\",\"content\":[]}'::jsonb`;

export async function ensureCareCatalogSchema() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm";`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pests (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      photo_url TEXT,
      danger_level TEXT,
      symptoms TEXT,
      active_period TEXT,
      fight_text JSONB DEFAULT ${EMPTY_RICH_DOC},
      fight_text_plain TEXT DEFAULT '',
      created_by INT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query(`
    ALTER TABLE pests
      ADD COLUMN IF NOT EXISTS fight_text JSONB DEFAULT ${EMPTY_RICH_DOC},
      ADD COLUMN IF NOT EXISTS fight_text_plain TEXT DEFAULT '';
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pest_symptom_images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pest_id INT REFERENCES pests(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      preview_url TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_pest_symptom_images_pest_id ON pest_symptom_images(pest_id);`
  );
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pests_history (
      id SERIAL PRIMARY KEY,
      pest_id INT REFERENCES pests(id) ON DELETE CASCADE,
      user_id INT,
      field TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS diseases (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      photo_url TEXT,
      reason TEXT,
      disease_type TEXT,
      symptoms TEXT,
      treatment_text JSONB DEFAULT ${EMPTY_RICH_DOC},
      treatment_text_plain TEXT DEFAULT '',
      prevention TEXT,
      created_by INT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query(`
    ALTER TABLE diseases
      ADD COLUMN IF NOT EXISTS treatment_text JSONB DEFAULT ${EMPTY_RICH_DOC},
      ADD COLUMN IF NOT EXISTS treatment_text_plain TEXT DEFAULT '';
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS disease_symptom_images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      disease_id INT REFERENCES diseases(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      preview_url TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_disease_symptom_images_disease_id ON disease_symptom_images(disease_id);`
  );
  await pool.query(`
    CREATE TABLE IF NOT EXISTS diseases_history (
      id SERIAL PRIMARY KEY,
      disease_id INT REFERENCES diseases(id) ON DELETE CASCADE,
      user_id INT,
      field TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pest_medicine (
      pest_id INT REFERENCES pests(id) ON DELETE CASCADE,
      medicine_id INT REFERENCES medicines(id) ON DELETE CASCADE,
      PRIMARY KEY (pest_id, medicine_id)
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS disease_medicine (
      disease_id INT REFERENCES diseases(id) ON DELETE CASCADE,
      medicine_id INT REFERENCES medicines(id) ON DELETE CASCADE,
      PRIMARY KEY (disease_id, medicine_id)
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_pest_medicine_medicine_id ON pest_medicine(medicine_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_disease_medicine_medicine_id ON disease_medicine(medicine_id);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS medicines (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      photo_url TEXT,
      medicine_type TEXT,
      form TEXT,
      concentration TEXT,
      expiration_date DATE,
      instruction JSONB DEFAULT ${EMPTY_RICH_DOC},
      instruction_text TEXT DEFAULT '',
      shop_links TEXT DEFAULT '',
      created_by INT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query(`
    ALTER TABLE medicines
      ADD COLUMN IF NOT EXISTS instruction JSONB DEFAULT ${EMPTY_RICH_DOC},
      ADD COLUMN IF NOT EXISTS instruction_text TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS shop_links TEXT DEFAULT '';
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS medicines_history (
      id SERIAL PRIMARY KEY,
      medicine_id INT REFERENCES medicines(id) ON DELETE CASCADE,
      user_id INT,
      field TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_pests_name_trgm ON pests USING GIN (name gin_trgm_ops);
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_pests_slug ON pests(slug);`);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_diseases_name_trgm ON diseases USING GIN (name gin_trgm_ops);
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_diseases_slug ON diseases(slug);`);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_medicines_name_trgm ON medicines USING GIN (name gin_trgm_ops);
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_medicines_slug ON medicines(slug);`);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_pests') THEN
        CREATE TRIGGER set_timestamp_pests
        BEFORE UPDATE ON pests
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_diseases') THEN
        CREATE TRIGGER set_timestamp_diseases
        BEFORE UPDATE ON diseases
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_medicines') THEN
        CREATE TRIGGER set_timestamp_medicines
        BEFORE UPDATE ON medicines
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END $$;
  `);
}
