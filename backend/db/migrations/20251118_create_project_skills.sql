CREATE TABLE IF NOT EXISTS project_skills (
  project_id INT NOT NULL REFERENCES portfolio_projects(id) ON DELETE CASCADE,
  skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, skill_id)
);
