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
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_company ON interviews(company);
