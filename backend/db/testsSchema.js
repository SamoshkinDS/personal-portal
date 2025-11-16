import { pool } from "./connect.js";

export async function ensureTestsSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tests (
      id SERIAL PRIMARY KEY,
      topic_id INT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      related_article_id INT REFERENCES articles(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'pending_generation',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS test_questions (
      id SERIAL PRIMARY KEY,
      test_id INT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      answer TEXT,
      explanation TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_tests_topic ON tests(topic_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_test_questions_test ON test_questions(test_id);`);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tests_set_updated_at') THEN
        CREATE TRIGGER tests_set_updated_at
        BEFORE UPDATE ON tests
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'test_questions_set_updated_at') THEN
        CREATE TRIGGER test_questions_set_updated_at
        BEFORE UPDATE ON test_questions
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END$$;
  `);
}
