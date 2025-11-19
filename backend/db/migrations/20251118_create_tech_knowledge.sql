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
CREATE INDEX IF NOT EXISTS idx_tech_knowledge_category ON tech_knowledge(category);
