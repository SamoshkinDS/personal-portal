import { pool } from "./connect.js";

const careerTables = [
  { name: "skills", trigger: "skills_set_updated_at" },
  { name: "courses", trigger: "courses_set_updated_at" },
  { name: "portfolio_projects", trigger: "portfolio_projects_set_updated_at" },
  { name: "interviews", trigger: "interviews_set_updated_at" },
  { name: "tech_knowledge", trigger: "tech_knowledge_set_updated_at" },
];

async function ensureTriggers() {
  for (const table of careerTables) {
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

export async function ensureCareerSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS skills (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      level INT CHECK (level BETWEEN 1 AND 5),
      description TEXT,
      icon_url TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      platform VARCHAR(200),
      status VARCHAR(32) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','completed','abandoned')),
      start_date DATE,
      completion_date DATE,
      certificate_url TEXT,
      certificate_file TEXT,
      rating INT CHECK (rating BETWEEN 1 AND 5),
      notes TEXT,
      url TEXT,
      progress_percent INT CHECK (progress_percent BETWEEN 0 AND 100) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS course_skills (
      course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      PRIMARY KEY (course_id, skill_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS portfolio_projects (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500),
      description TEXT,
      company VARCHAR(200),
      role VARCHAR(200),
      start_date DATE,
      end_date DATE,
      status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','archived')),
      url TEXT,
      achievements JSONB DEFAULT '[]'::jsonb,
      metrics JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_skills (
      project_id INT NOT NULL REFERENCES portfolio_projects(id) ON DELETE CASCADE,
      skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      PRIMARY KEY (project_id, skill_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS interviews (
      id SERIAL PRIMARY KEY,
      company VARCHAR(300),
      position VARCHAR(300),
      interview_date TIMESTAMPTZ,
      status VARCHAR(32) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','passed','rejected','offer_received','offer_declined')),
      interview_type VARCHAR(100),
      recruiter_name VARCHAR(200),
      recruiter_contact VARCHAR(200),
      salary_offer DECIMAL(12,2),
      feedback TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tech_knowledge (
      id SERIAL PRIMARY KEY,
      technology VARCHAR(200),
      current_version VARCHAR(50),
      category VARCHAR(100),
      best_practices TEXT,
      useful_links JSONB DEFAULT '[]'::jsonb,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);\n`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_skills_level ON skills(level);\n`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);\n`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_courses_platform ON courses(platform);\n`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_portfolio_projects_status ON portfolio_projects(status);\n`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);\n`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_interviews_company ON interviews(company);\n`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_tech_knowledge_category ON tech_knowledge(category);\n`);

  await ensureTriggers();
}
