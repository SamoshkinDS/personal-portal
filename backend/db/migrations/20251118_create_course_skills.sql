CREATE TABLE IF NOT EXISTS course_skills (
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, skill_id)
);
