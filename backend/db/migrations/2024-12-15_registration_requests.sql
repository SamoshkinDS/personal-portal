CREATE TABLE IF NOT EXISTS registration_requests (
  id SERIAL PRIMARY KEY,
  login TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON registration_requests(status);

ALTER TABLE registration_requests
  ADD CONSTRAINT chk_registration_requests_status CHECK (status IN ('pending', 'approved', 'rejected'));
