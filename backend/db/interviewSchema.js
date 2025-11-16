import { pool } from "./connect.js";

export async function ensureInterviewSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS interview_questions (
      id SERIAL PRIMARY KEY,
      topic_id INT REFERENCES topics(id) ON DELETE RESTRICT,
      question TEXT NOT NULL,
      answer TEXT,
      explanation TEXT,
      related_article_id INT REFERENCES articles(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_interview_questions_topic ON interview_questions(topic_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_interview_questions_updated_at ON interview_questions(updated_at);`);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'interview_questions_set_updated_at') THEN
        CREATE TRIGGER interview_questions_set_updated_at
        BEFORE UPDATE ON interview_questions
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END$$;
  `);
}
