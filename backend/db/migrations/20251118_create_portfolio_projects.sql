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
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_status ON portfolio_projects(status);
