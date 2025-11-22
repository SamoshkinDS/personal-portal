import { pool } from "./connect.js";

const tablesWithTrigger = [
  { name: "home_company", trigger: "home_company_set_updated_at" },
  { name: "home_company_files", trigger: "home_company_files_set_updated_at" },
  { name: "home_contacts", trigger: "home_contacts_set_updated_at" },
  { name: "home_cameras", trigger: "home_cameras_set_updated_at" },
  { name: "home_meters", trigger: "home_meters_set_updated_at" },
  { name: "home_meter_records", trigger: "home_meter_records_set_updated_at" },
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

export async function ensureHomeSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS home_company (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200),
      phone VARCHAR(60),
      emergency_phone VARCHAR(60),
      email VARCHAR(200),
      work_hours TEXT,
      account_number VARCHAR(120),
      office_address TEXT,
      comments TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS home_company_files (
      id SERIAL PRIMARY KEY,
      company_id INT NOT NULL REFERENCES home_company(id) ON DELETE CASCADE,
      file_name TEXT,
      mime_type TEXT,
      file_key TEXT,
      file_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS home_company_files_company_idx ON home_company_files(company_id, created_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS home_contacts (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      phone VARCHAR(120),
      comments TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS home_contacts_title_idx ON home_contacts(lower(title));
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS home_cameras (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      url TEXT,
      username VARCHAR(200),
      password VARCHAR(200),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS home_meters (
      id SERIAL PRIMARY KEY,
      code VARCHAR(32) UNIQUE,
      title VARCHAR(200) NOT NULL,
      meter_number VARCHAR(120),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS home_meter_records (
      id SERIAL PRIMARY KEY,
      meter_id INT NOT NULL REFERENCES home_meters(id) ON DELETE CASCADE,
      reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
      value NUMERIC(14,3) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS home_meter_records_meter_idx ON home_meter_records(meter_id, reading_date DESC, id DESC);
  `);

  await ensureUpdatedAtTriggers();

  const defaultMeters = [
    { code: "hvs1", title: "ХВС №1" },
    { code: "hvs2", title: "ХВС №2" },
    { code: "gvs1", title: "ГВС №1" },
    { code: "gvs2", title: "ГВС №2" },
  ];

  for (const meter of defaultMeters) {
    await pool.query(
      `
      INSERT INTO home_meters (code, title)
      VALUES ($1, $2)
      ON CONFLICT (code) DO NOTHING;
    `,
      [meter.code, meter.title]
    );
  }

  await pool.query(`
    INSERT INTO home_company (id, name)
    SELECT 1, 'Управляющая компания'
    WHERE NOT EXISTS (SELECT 1 FROM home_company);
  `);
}
