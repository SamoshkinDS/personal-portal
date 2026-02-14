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
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_platform ON courses(platform);
