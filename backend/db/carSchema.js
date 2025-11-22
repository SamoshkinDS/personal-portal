import { pool } from "./connect.js";

const tablesWithTrigger = [
  { name: "car_info", trigger: "car_info_set_updated_at" },
  { name: "car_insurance", trigger: "car_insurance_set_updated_at" },
  { name: "car_alarm", trigger: "car_alarm_set_updated_at" },
  { name: "car_service_plan", trigger: "car_service_plan_set_updated_at" },
  { name: "car_service_records", trigger: "car_service_records_set_updated_at" },
  { name: "car_mileage", trigger: "car_mileage_set_updated_at" },
];

async function ensureUpdatedAtTriggers() {
  for (const table of tablesWithTrigger) {
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = '${table.trigger}') THEN
          CREATE TRIGGER ${table.trigger}
          BEFORE UPDATE ON ${table.name}
          FOR EACH ROW
          EXECUTE FUNCTION set_updated_at();
        END IF;
      END$$;
    `);
  }
}

export async function ensureCarSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS car_info (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      image_url TEXT,
      image_key TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS car_insurance (
      id SERIAL PRIMARY KEY,
      type VARCHAR(16) NOT NULL CHECK (type IN ('osago', 'kasko')),
      company VARCHAR(200),
      policy_number VARCHAR(120),
      start_date DATE,
      end_date DATE,
      phone VARCHAR(60),
      pdf_key TEXT,
      pdf_url TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS car_alarm (
      id SERIAL PRIMARY KEY,
      vendor VARCHAR(200),
      pin_code VARCHAR(120),
      contract_number VARCHAR(120),
      support_phones TEXT[] DEFAULT '{}'::text[],
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS car_service_plan (
      id SERIAL PRIMARY KEY,
      title VARCHAR(300) NOT NULL,
      interval_km INT,
      interval_months INT,
      comments TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS car_service_records (
      id SERIAL PRIMARY KEY,
      service_date DATE,
      mileage INT,
      description TEXT,
      cost NUMERIC(12,2),
      comments TEXT,
      plan_id INT REFERENCES car_service_plan(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS car_mileage (
      id SERIAL PRIMARY KEY,
      mileage_date DATE NOT NULL DEFAULT CURRENT_DATE,
      value_km INT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS car_insurance_type_idx ON car_insurance(type);
    CREATE INDEX IF NOT EXISTS car_mileage_date_idx ON car_mileage(mileage_date DESC);
    CREATE INDEX IF NOT EXISTS car_service_records_date_idx ON car_service_records(service_date DESC);
    CREATE INDEX IF NOT EXISTS car_service_records_plan_idx ON car_service_records(plan_id);
  `);

  await ensureUpdatedAtTriggers();

  await pool.query(`
    INSERT INTO car_info (id, name)
    SELECT 1, 'Changan UNI V'
    WHERE NOT EXISTS (SELECT 1 FROM car_info);
  `);
}
