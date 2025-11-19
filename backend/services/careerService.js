import { pool } from "../db/connect.js";

const COURSE_STATUSES = ["planned", "in_progress", "completed", "abandoned"];
const INTERVIEW_STATUSES = ["scheduled", "passed", "rejected", "offer_received", "offer_declined"];
const PORTFOLIO_STATUSES = ["active", "completed", "archived"];
const SUCCESS_INTERVIEW_STATUSES = ["passed", "offer_received"];
const COURSE_STATUS_KEY_MAP = {
  planned: "planned",
  in_progress: "inProgress",
  completed: "completed",
  abandoned: "abandoned",
};
const CAREER_ACTIVITY_LIMIT = 5;

function sanitizeArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => Number.isFinite(Number(item))).map((item) => Number(item));
}

function mapSkillRow(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    level: row.level,
    description: row.description,
    iconUrl: row.icon_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCourseRow(row) {
  return {
    id: row.id,
    title: row.title,
    platform: row.platform,
    status: row.status,
    startDate: row.start_date,
    completionDate: row.completion_date,
    certificateUrl: row.certificate_url,
    certificateFile: row.certificate_file,
    rating: row.rating,
    progressPercent: Number(row.progress_percent) || 0,
    notes: row.notes,
    url: row.url,
    skillIds: Array.isArray(row.skill_ids) ? row.skill_ids.filter(Number.isFinite) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPortfolioRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    company: row.company,
    role: row.role,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    url: row.url,
    achievements: Array.isArray(row.achievements) ? row.achievements : [],
    metrics: row.metrics || {},
    skillIds: Array.isArray(row.skill_ids) ? row.skill_ids.filter(Number.isFinite) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInterviewRow(row) {
  return {
    id: row.id,
    company: row.company,
    position: row.position,
    interviewDate: row.interview_date,
    status: row.status,
    interviewType: row.interview_type,
    recruiterName: row.recruiter_name,
    recruiterContact: row.recruiter_contact,
    salaryOffer: row.salary_offer,
    feedback: row.feedback,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapKnowledgeRow(row) {
  return {
    id: row.id,
    technology: row.technology,
    currentVersion: row.current_version,
    category: row.category,
    bestPractices: row.best_practices,
    usefulLinks: row.useful_links || [],
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function syncCourseSkills(courseId, skillIds) {
  await pool.query("DELETE FROM course_skills WHERE course_id = $1;", [courseId]);
  const candidates = sanitizeArray(skillIds);
  if (!candidates.length) return;
  const { rows } = await pool.query("SELECT id FROM skills WHERE id = ANY($1);", [candidates]);
  const valid = new Set(rows.map((r) => r.id));
  for (const skillId of candidates) {
    if (!valid.has(skillId)) continue;
    await pool.query(
      `
      INSERT INTO course_skills (course_id, skill_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING;
    `,
      [courseId, skillId]
    );
  }
}

async function syncProjectSkills(projectId, skillIds) {
  await pool.query("DELETE FROM project_skills WHERE project_id = $1;", [projectId]);
  const candidates = sanitizeArray(skillIds);
  if (!candidates.length) return;
  const { rows } = await pool.query("SELECT id FROM skills WHERE id = ANY($1);", [candidates]);
  const valid = new Set(rows.map((r) => r.id));
  for (const skillId of candidates) {
    if (!valid.has(skillId)) continue;
    await pool.query(
      `
      INSERT INTO project_skills (project_id, skill_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING;
    `,
      [projectId, skillId]
    );
  }
}

async function loadCourseById(courseId) {
  const result = await pool.query(
    `
    SELECT c.*, COALESCE(ARRAY_REMOVE(ARRAY_AGG(cs.skill_id), NULL), '{}'::int[]) AS skill_ids
    FROM courses c
    LEFT JOIN course_skills cs ON cs.course_id = c.id
    WHERE c.id = $1
    GROUP BY c.id
  `,
    [courseId]
  );
  if (!result.rows.length) return null;
  return mapCourseRow(result.rows[0]);
}

async function loadPortfolioById(projectId) {
  const result = await pool.query(
    `
    SELECT p.*, COALESCE(ARRAY_REMOVE(ARRAY_AGG(ps.skill_id), NULL), '{}'::int[]) AS skill_ids
    FROM portfolio_projects p
    LEFT JOIN project_skills ps ON ps.project_id = p.id
    WHERE p.id = $1
    GROUP BY p.id
  `,
    [projectId]
  );
  if (!result.rows.length) return null;
  return mapPortfolioRow(result.rows[0]);
}

export async function listSkills() {
  const { rows } = await pool.query("SELECT * FROM skills ORDER BY name ASC;");
  return rows.map(mapSkillRow);
}

export async function getSkillById(id) {
  const { rows } = await pool.query("SELECT * FROM skills WHERE id = $1 LIMIT 1;", [id]);
  if (!rows.length) return null;
  return mapSkillRow(rows[0]);
}

export async function createSkill(payload) {
  const { name, category, level, description, iconUrl } = payload;
  const { rows } = await pool.query(
    `
    INSERT INTO skills (name, category, level, description, icon_url)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `,
    [name, category || null, level || null, description || null, iconUrl || null]
  );
  return mapSkillRow(rows[0]);
}

export async function updateSkill(id, payload) {
  const updates = [];
  const params = [];
  if (payload.name !== undefined) {
    params.push(payload.name);
    updates.push(`name = $${params.length}`);
  }
  if (payload.category !== undefined) {
    params.push(payload.category);
    updates.push(`category = $${params.length}`);
  }
  if (payload.level !== undefined) {
    params.push(payload.level);
    updates.push(`level = $${params.length}`);
  }
  if (payload.description !== undefined) {
    params.push(payload.description);
    updates.push(`description = $${params.length}`);
  }
  if (payload.iconUrl !== undefined) {
    params.push(payload.iconUrl);
    updates.push(`icon_url = $${params.length}`);
  }
  if (!updates.length) return null;
  params.push(id);
  const { rows } = await pool.query(
    `
    UPDATE skills
    SET ${updates.join(", ")}, updated_at = now()
    WHERE id = $${params.length}
    RETURNING *;
  `,
    params
  );
  if (!rows.length) return null;
  return mapSkillRow(rows[0]);
}

export async function deleteSkill(id) {
  const { rowCount } = await pool.query("DELETE FROM skills WHERE id = $1;", [id]);
  return rowCount > 0;
}

export async function listCourses() {
  const { rows } = await pool.query(`
    SELECT c.*, COALESCE(ARRAY_REMOVE(ARRAY_AGG(cs.skill_id), NULL), '{}'::int[]) AS skill_ids
    FROM courses c
    LEFT JOIN course_skills cs ON cs.course_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC;
  `);
  return rows.map(mapCourseRow);
}

export async function createCourse(payload) {
  const {
    title,
    platform,
    status,
    startDate,
    completionDate,
    certificateUrl,
    certificateFile,
    rating,
    notes,
    url,
    skillIds,
    progressPercent,
  } = payload;
  const { rows } = await pool.query(
    `
    INSERT INTO courses
      (title, platform, status, start_date, completion_date, certificate_url, certificate_file, rating, notes, url, progress_percent)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *;
  `,
    [
      title,
      platform || null,
      status,
      startDate || null,
      completionDate || null,
      certificateUrl || null,
      certificateFile || null,
      rating || null,
      notes || null,
      url || null,
      progressPercent === undefined || progressPercent === null ? 0 : Number(progressPercent),
    ]
  );
  const course = mapCourseRow(rows[0]);
  await syncCourseSkills(course.id, skillIds);
  return await loadCourseById(course.id);
}

export async function getCourseById(id) {
  return await loadCourseById(id);
}

export async function updateCourse(id, payload) {
  const updates = [];
  const params = [];
  const mapping = {
    title: "title",
    platform: "platform",
    status: "status",
    startDate: "start_date",
    completionDate: "completion_date",
    certificateUrl: "certificate_url",
    certificateFile: "certificate_file",
    rating: "rating",
    notes: "notes",
    url: "url",
    progressPercent: "progress_percent",
  };
  for (const [key, column] of Object.entries(mapping)) {
    if (payload[key] !== undefined) {
      params.push(payload[key]);
      updates.push(`${column} = $${params.length}`);
    }
  }
  if (updates.length) {
    params.push(id);
    await pool.query(
      `
      UPDATE courses
      SET ${updates.join(", ")}, updated_at = now()
      WHERE id = $${params.length};
    `,
      params
    );
  }
  if (payload.skillIds !== undefined) {
    await syncCourseSkills(id, payload.skillIds);
  }
  return await loadCourseById(id);
}

export async function updateCourseCertificate(id, payload) {
  const updates = [];
  const params = [];
  if (payload.certificateUrl !== undefined) {
    params.push(payload.certificateUrl);
    updates.push(`certificate_url = $${params.length}`);
  }
  if (payload.certificateFile !== undefined) {
    params.push(payload.certificateFile);
    updates.push(`certificate_file = $${params.length}`);
  }
  if (payload.completionDate !== undefined) {
    params.push(payload.completionDate);
    updates.push(`completion_date = $${params.length}`);
  }
  if (!updates.length) return null;
  params.push(id);
  const { rows } = await pool.query(
    `
    UPDATE courses
    SET ${updates.join(", ")}, updated_at = now()
    WHERE id = $${params.length}
    RETURNING *;
  `,
    params
  );
  if (!rows.length) return null;
  return await loadCourseById(id);
}

export async function deleteCourse(id) {
  const { rowCount } = await pool.query("DELETE FROM courses WHERE id = $1;", [id]);
  return rowCount > 0;
}

export async function listPortfolioProjects() {
  const { rows } = await pool.query(`
    SELECT p.*, COALESCE(ARRAY_REMOVE(ARRAY_AGG(ps.skill_id), NULL), '{}'::int[]) AS skill_ids
    FROM portfolio_projects p
    LEFT JOIN project_skills ps ON ps.project_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC;
  `);
  return rows.map(mapPortfolioRow);
}

export async function getPortfolioTimeline() {
  const { rows } = await pool.query(`
    SELECT id, title, company, role, start_date, end_date, status
    FROM portfolio_projects
    ORDER BY start_date ASC NULLS LAST;
  `);
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    company: row.company,
    role: row.role,
    start: row.start_date ? row.start_date.toISOString().slice(0, 10) : null,
    end: row.end_date ? row.end_date.toISOString().slice(0, 10) : null,
    status: row.status,
  }));
}

export async function createPortfolioProject(payload) {
  const {
    title,
    description,
    company,
    role,
    startDate,
    endDate,
    status,
    url,
    achievements,
    metrics,
    skillIds,
  } = payload;
  const achievementsJson = achievements ? JSON.stringify(achievements) : null;
  const metricsJson = metrics ? JSON.stringify(metrics) : null;
  const { rows } = await pool.query(
    `
    INSERT INTO portfolio_projects
      (title, description, company, role, start_date, end_date, status, url, achievements, metrics)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;
  `,
    [
      title || null,
      description || null,
      company || null,
      role || null,
      startDate || null,
      endDate || null,
      status,
      url || null,
      achievementsJson,
      metricsJson,
    ]
  );
  const project = mapPortfolioRow(rows[0]);
  await syncProjectSkills(project.id, skillIds);
  return await loadPortfolioById(project.id);
}

export async function getPortfolioProjectById(id) {
  return await loadPortfolioById(id);
}

export async function updatePortfolioProject(id, payload) {
  const updates = [];
  const params = [];
  const mapping = {
    title: "title",
    description: "description",
    company: "company",
    role: "role",
    startDate: "start_date",
    endDate: "end_date",
    status: "status",
    url: "url",
    achievements: "achievements",
    metrics: "metrics",
  };
  for (const [key, column] of Object.entries(mapping)) {
    if (payload[key] === undefined) continue;
    params.push(payload[key]);
    updates.push(`${column} = $${params.length}`);
  }
  if (updates.length) {
    params.push(id);
    await pool.query(
      `
      UPDATE portfolio_projects
      SET ${updates.join(", ")}, updated_at = now()
      WHERE id = $${params.length};
    `,
      params
    );
  }
  if (payload.skillIds !== undefined) {
    await syncProjectSkills(id, payload.skillIds);
  }
  return await loadPortfolioById(id);
}

export async function deletePortfolioProject(id) {
  const { rowCount } = await pool.query("DELETE FROM portfolio_projects WHERE id = $1;", [id]);
  return rowCount > 0;
}

export async function listInterviews(filters = {}) {
  const conditions = [];
  const params = [];

  if (filters.statuses?.length) {
    params.push(filters.statuses);
    conditions.push(`status = ANY($${params.length})`);
  }
  if (filters.company) {
    params.push(`%${String(filters.company).trim().toLowerCase()}%`);
    conditions.push(`lower(company) LIKE $${params.length}`);
  }
  if (filters.types?.length) {
    params.push(filters.types);
    conditions.push(`interview_type = ANY($${params.length})`);
  }
  if (filters.dateFrom) {
    params.push(filters.dateFrom);
    conditions.push(`interview_date >= $${params.length}`);
  }
  if (filters.dateTo) {
    params.push(filters.dateTo);
    conditions.push(`interview_date <= $${params.length}`);
  }
  if (filters.mode === "upcoming") {
    params.push(new Date());
    conditions.push(`interview_date >= $${params.length}`);
  } else if (filters.mode === "past") {
    params.push(new Date());
    conditions.push(`interview_date <= $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const allowedSortFields = new Set(["interview_date", "company"]);
  const sortField = allowedSortFields.has(filters.sortField) ? filters.sortField : "interview_date";
  const direction = filters.sortOrder === "asc" ? "ASC" : "DESC";
  const limitParam = params.length + 1;
  params.push(filters.limit || 200);

  const { rows } = await pool.query(
    `
    SELECT *
    FROM interviews
    ${whereClause}
    ORDER BY ${sortField} ${direction}, id DESC
    LIMIT $${limitParam}
  `,
    params
  );
  return rows.map(mapInterviewRow);
}

export async function createInterview(payload) {
  const {
    company,
    position,
    interviewDate,
    status,
    interviewType,
    recruiterName,
    recruiterContact,
    salaryOffer,
    feedback,
    notes,
  } = payload;
  const { rows } = await pool.query(
    `
    INSERT INTO interviews
      (company, position, interview_date, status, interview_type, recruiter_name, recruiter_contact, salary_offer, feedback, notes)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;
  `,
    [
      company || null,
      position || null,
      interviewDate || null,
      status,
      interviewType || null,
      recruiterName || null,
      recruiterContact || null,
      salaryOffer || null,
      feedback || null,
      notes || null,
    ]
  );
  return mapInterviewRow(rows[0]);
}

export async function getInterviewById(id) {
  const { rows } = await pool.query("SELECT * FROM interviews WHERE id = $1 LIMIT 1;", [id]);
  if (!rows.length) return null;
  return mapInterviewRow(rows[0]);
}

export async function updateInterview(id, payload) {
  const updates = [];
  const params = [];
  const mapping = {
    company: "company",
    position: "position",
    interviewDate: "interview_date",
    status: "status",
    interviewType: "interview_type",
    recruiterName: "recruiter_name",
    recruiterContact: "recruiter_contact",
    salaryOffer: "salary_offer",
    feedback: "feedback",
    notes: "notes",
  };
  for (const [key, column] of Object.entries(mapping)) {
    if (payload[key] !== undefined) {
      params.push(payload[key]);
      updates.push(`${column} = $${params.length}`);
    }
  }
  if (!updates.length) return null;
  params.push(id);
  const { rows } = await pool.query(
    `
    UPDATE interviews
    SET ${updates.join(", ")}, updated_at = now()
    WHERE id = $${params.length}
    RETURNING *;
  `,
    params
  );
  if (!rows.length) return null;
  return mapInterviewRow(rows[0]);
}

export async function deleteInterview(id) {
  const { rowCount } = await pool.query("DELETE FROM interviews WHERE id = $1;", [id]);
  return rowCount > 0;
}

export async function getInterviewStats() {
  const [statusRows, avgSalaryRow, companiesRows, monthlyRows] = await Promise.all([
    pool.query(`
      SELECT status, COUNT(*)::int AS count
      FROM interviews
      GROUP BY status
    `),
    pool.query(`
      SELECT ROUND(AVG(salary_offer)::numeric, 2) AS avg_salary
      FROM interviews
      WHERE salary_offer IS NOT NULL
    `),
    pool.query(`
      SELECT company, COUNT(*)::int AS count
      FROM interviews
      WHERE company IS NOT NULL
      GROUP BY company
      ORDER BY count DESC
      LIMIT 5
    `),
    pool.query(`
      SELECT to_char(date_trunc('month', interview_date), 'YYYY-MM') AS month, COUNT(*)::int AS count
      FROM interviews
      WHERE interview_date IS NOT NULL
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `),
  ]);

  const stats = {
    statuses: statusRows.rows.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {}),
    avgSalary: Number(avgSalaryRow.rows[0]?.avg_salary || 0),
    topCompanies: companiesRows.rows.map((row) => ({ company: row.company, count: row.count })),
    monthly: monthlyRows.rows.map((row) => ({ month: row.month, count: row.count })),
  };

  return stats;
}

export async function exportInterviews(filters = {}) {
  const interviews = await listInterviews({ ...filters, sortField: "interview_date", sortOrder: "asc" });

  const headers = [
    "ID",
    "Company",
    "Position",
    "Interview Date",
    "Type",
    "Status",
    "Recruiter Name",
    "Recruiter Contact",
    "Salary Offer",
    "Feedback",
    "Notes",
  ];
  const rows = interviews.map((interview) => [
    interview.id,
    interview.company || "",
    interview.position || "",
    interview.interviewDate ? interview.interviewDate.toISOString() : "",
    interview.interviewType || "",
    interview.status || "",
    interview.recruiterName || "",
    interview.recruiterContact || "",
    interview.salaryOffer != null ? interview.salaryOffer : "",
    interview.feedback || "",
    interview.notes || "",
  ]);
  const csvLines = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))];
  return csvLines.join("\n");
}

export async function getCareerAnalytics() {
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const [
    skillsCountRes,
    avgLevelRes,
    completedCoursesRes,
    projectsYearRes,
    offersRes,
    avgSalaryRes,
    heatmapRows,
    timelineRows,
    coursesMonthlyRes,
    platformsRes,
    interviewStatusRows,
    salaryYearRows,
    topCompaniesRows,
    portfolioProjects,
  ] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM skills;"),
    pool.query("SELECT ROUND(AVG(level)::numeric, 2) AS avg_level FROM skills;"),
    pool.query("SELECT COUNT(*)::int AS count FROM courses WHERE status = 'completed';"),
    pool.query("SELECT COUNT(*)::int AS count FROM portfolio_projects WHERE start_date >= $1;", [oneYearAgo]),
    pool.query("SELECT COUNT(*)::int AS count FROM interviews WHERE status = 'offer_received';"),
    pool.query("SELECT ROUND(AVG(salary_offer)::numeric, 2) AS avg_salary FROM interviews WHERE salary_offer IS NOT NULL;"),
    pool.query(`
      SELECT COALESCE(NULLIF(category, ''), 'Без категории') AS category, level, COUNT(*)::int AS count
      FROM skills
      GROUP BY COALESCE(NULLIF(category, ''), 'Без категории'), level
      ORDER BY category, level;
    `),
    pool.query(`
      SELECT to_char(date_trunc('month', updated_at), 'YYYY-MM') AS month, ROUND(AVG(level)::numeric, 2) AS avg_level
      FROM skills
      GROUP BY month
      ORDER BY month ASC;
    `),
    pool.query(`
      SELECT to_char(date_trunc('month', completion_date), 'YYYY-MM') AS month, COUNT(*)::int AS count
      FROM courses
      WHERE status = 'completed' AND completion_date IS NOT NULL
      GROUP BY month
      ORDER BY month ASC
      LIMIT 12;
    `),
    pool.query(`
      SELECT platform, COUNT(*)::int AS count
      FROM courses
      WHERE platform IS NOT NULL
      GROUP BY platform
      ORDER BY count DESC;
    `),
    pool.query(`
      SELECT status, COUNT(*)::int AS count
      FROM interviews
      GROUP BY status;
    `),
    pool.query(`
      SELECT EXTRACT(YEAR FROM interview_date)::int AS year, ROUND(AVG(salary_offer)::numeric, 2) AS avg_salary
      FROM interviews
      WHERE salary_offer IS NOT NULL
      GROUP BY year
      ORDER BY year ASC;
    `),
    pool.query(`
      SELECT company, COUNT(*)::int AS count
      FROM interviews
      WHERE company IS NOT NULL
      GROUP BY company
      ORDER BY count DESC
      LIMIT 5;
    `),
    pool.query(`
      SELECT p.*, COALESCE(ARRAY_REMOVE(ARRAY_AGG(ps.skill_id), NULL), '{}'::int[]) AS skill_ids
      FROM portfolio_projects p
      LEFT JOIN project_skills ps ON ps.project_id = p.id
      GROUP BY p.id
    `),
  ]);

  const skillsHeatmap = {};
  heatmapRows.rows.forEach((row) => {
    const category = row.category;
    if (!skillsHeatmap[category]) skillsHeatmap[category] = {};
    skillsHeatmap[category][row.level] = row.count;
  });

  const skillsGrowth = heatmapRows.rows
    .reduce((map, row) => {
      if (!map[row.category]) map[row.category] = 0;
      map[row.category] += row.level * row.count;
      return map;
    }, {});

  const timeline = timelineRows.rows.map((row) => ({
    month: row.month,
    avg_level: Number(row.avg_level) || 0,
  }));

  const coursesPlatforms = platformsRes.rows.map((row) => ({
    platform: row.platform,
    count: row.count,
  }));

  const portfolioBubble = portfolioProjects.rows.map((project) => {
    const start = project.start_date ? new Date(project.start_date) : now;
    const end = project.end_date ? new Date(project.end_date) : now;
    const duration = Math.max(Math.round((end - start) / (1000 * 60 * 60 * 24)), 1);
    const achievementsCount = Array.isArray(project.achievements) ? project.achievements.length : 0;
    return {
      id: project.id,
      title: project.title,
      duration,
      achievements: achievementsCount,
      skillCount: Array.isArray(project.skill_ids) ? project.skill_ids.length : 0,
      status: project.status,
    };
  });

  const activityCalendar = portfolioProjects.rows.flatMap((project) => {
    const start = project.start_date ? new Date(project.start_date) : now;
    const end = project.end_date ? new Date(project.end_date) : now;
    const days = [];
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      days.push(dt.toISOString().slice(0, 10));
    }
    return days;
  });
  const activityCounts = activityCalendar.reduce((acc, day) => {
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  return {
    metrics: {
      skills_count: Number(skillsCountRes.rows[0]?.count || 0),
      avg_skill_level: Number(avgLevelRes.rows[0]?.avg_level || 0),
      courses_completed: Number(completedCoursesRes.rows[0]?.count || 0),
      projects_year: Number(projectsYearRes.rows[0]?.count || 0),
      offers_received: Number(offersRes.rows[0]?.count || 0),
      avg_salary: Number(avgSalaryRes.rows[0]?.avg_salary || 0),
    },
    skills: {
      heatmap: skillsHeatmap,
      growth: Object.entries(skillsHeatmap).map(([category, levels]) => ({
        category,
        growth: Object.entries(levels)
          .reduce((sum, [level, count]) => sum + Number(level) * count, 0)
          - Object.entries(levels).reduce((count) => count, 0),
      })),
      timeline,
    },
    courses: {
      monthly_completed: coursesMonthlyRes.rows.map((row) => ({ month: row.month, count: row.count })),
      platforms: coursesPlatforms,
    },
    portfolio: {
      activity_calendar: Object.entries(activityCounts).map(([day, count]) => ({ day, count })),
      skills_project_map: portfolioProjects.rows.map((project) => ({
        id: project.id,
        title: project.title,
        skillCount: Array.isArray(project.skill_ids) ? project.skill_ids.length : 0,
      })),
      bubble_data: portfolioBubble,
    },
    interviews: {
      funnel: interviewStatusRows.rows,
      salary_by_years: salaryYearRows.rows.map((row) => ({ year: row.year, avg_salary: Number(row.avg_salary) || 0 })),
      top_companies: topCompaniesRows.rows,
    },
  };
}

export async function listKnowledge(filters = {}) {
  const conditions = [];
  const params = [];
  if (filters.search) {
    params.push(`%${String(filters.search).trim().toLowerCase()}%`);
    conditions.push(`lower(technology) LIKE $${params.length}`);
  }
  if (filters.category) {
    params.push(filters.category);
    conditions.push(`category = $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await pool.query(
    `
    SELECT *
    FROM tech_knowledge
    ${whereClause}
    ORDER BY technology ASC NULLS LAST
  `,
    params
  );
  return rows.map(mapKnowledgeRow);
}

export async function createKnowledge(payload) {
  const {
    technology,
    currentVersion,
    category,
    bestPractices,
    usefulLinks,
    notes,
  } = payload;
  const { rows } = await pool.query(
    `
    INSERT INTO tech_knowledge
      (technology, current_version, category, best_practices, useful_links, notes)
    VALUES
      ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `,
    [
      technology || null,
      currentVersion || null,
      category || null,
      bestPractices || null,
      Array.isArray(usefulLinks) ? usefulLinks : [],
      notes || null,
    ]
  );
  return mapKnowledgeRow(rows[0]);
}

export async function getKnowledgeById(id) {
  const { rows } = await pool.query("SELECT * FROM tech_knowledge WHERE id = $1 LIMIT 1;", [id]);
  if (!rows.length) return null;
  return mapKnowledgeRow(rows[0]);
}

export async function updateKnowledge(id, payload) {
  const updates = [];
  const params = [];
  const mapping = {
    technology: "technology",
    currentVersion: "current_version",
    category: "category",
    bestPractices: "best_practices",
    usefulLinks: "useful_links",
    notes: "notes",
  };
  for (const [key, column] of Object.entries(mapping)) {
    if (payload[key] === undefined) continue;
    params.push(payload[key]);
    updates.push(`${column} = $${params.length}`);
  }
  if (!updates.length) return null;
  params.push(id);
  const { rows } = await pool.query(
    `
    UPDATE tech_knowledge
    SET ${updates.join(", ")}, updated_at = now()
    WHERE id = $${params.length}
    RETURNING *;
  `,
    params
  );
  if (!rows.length) return null;
  return mapKnowledgeRow(rows[0]);
}

export async function deleteKnowledge(id) {
  const { rowCount } = await pool.query("DELETE FROM tech_knowledge WHERE id = $1;", [id]);
  return rowCount > 0;
}

export async function getKnowledgeTemplates() {
  return [
    "React",
    "Node.js",
    "PostgreSQL",
    "Docker",
    "Kubernetes",
    "BPMN/Camunda",
    "TypeScript",
    "GraphQL",
    "Redis",
    "AWS",
  ].map((name) => ({ technology: name }));
}

export async function getCareerDashboard() {
  const [
    skillsCountRes,
    coursesCompletedRes,
    projectsCountRes,
    interviewsCountRes,
    interviewsSuccessRes,
    radarRes,
    courseStatusRes,
  ] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM skills;"),
    pool.query("SELECT COUNT(*)::int AS count FROM courses WHERE status = 'completed';"),
    pool.query("SELECT COUNT(*)::int AS count FROM portfolio_projects;"),
    pool.query("SELECT COUNT(*)::int AS count FROM interviews;"),
    pool.query("SELECT COUNT(*)::int AS count FROM interviews WHERE status = 'passed';"),
    pool.query(`
      SELECT COALESCE(NULLIF(category, ''), 'Без категории') AS category, COUNT(*)::int AS value
      FROM skills
      GROUP BY COALESCE(NULLIF(category, ''), 'Без категории')
      ORDER BY value DESC
    `),
    pool.query(`
      SELECT status, COUNT(*)::int AS count
      FROM courses
      GROUP BY status
    `),
  ]);

  const metrics = {
    skills_count: Number(skillsCountRes.rows[0]?.count || 0),
    courses_completed: Number(coursesCompletedRes.rows[0]?.count || 0),
    portfolio_count: Number(projectsCountRes.rows[0]?.count || 0),
    interviews_count: Number(interviewsCountRes.rows[0]?.count || 0),
    interviews_success: Number(interviewsSuccessRes.rows[0]?.count || 0),
  };

  const radar = radarRes.rows.map((row) => ({
    category: row.category,
    value: row.value,
  }));

  const coursesStatus = {
    planned: 0,
    in_progress: 0,
    completed: 0,
    abandoned: 0,
  };
  for (const row of courseStatusRes.rows) {
    if (coursesStatus.hasOwnProperty(row.status)) {
      coursesStatus[row.status] = Number(row.count) || 0;
    }
  }

  const recentActivity = await getCareerActivity(5);

  return {
    metrics,
    skills_radar: radar,
    courses_status: coursesStatus,
    recent_activity: recentActivity.map((entry) => ({
      type: entry.type,
      id: entry.id,
      title: entry.title,
      updated_at: entry.updatedAt,
    })),
  };
}

export async function getCareerActivity(limit = CAREER_ACTIVITY_LIMIT) {
  const { rows } = await pool.query(
    `
    SELECT entity, title, summary, tag, updated_at
    FROM (
      SELECT id, 'skill' AS entity, name AS title,
        COALESCE('Уровень ' || level::text, 'Новый навык') AS summary,
        COALESCE(category, 'Категория не указана') AS tag,
        updated_at
      FROM skills
      UNION ALL
      SELECT id, 'course', title,
        CONCAT('Статус: ', status),
        NULL,
        updated_at
      FROM courses
      UNION ALL
      SELECT id, 'project', title,
        CONCAT('Статус: ', status),
        company,
        updated_at
      FROM portfolio_projects
      UNION ALL
      SELECT id, 'interview', CONCAT(COALESCE(company, 'Компания не указана'), ' — ', COALESCE(position, 'Позиция')),
        CONCAT('Статус: ', status),
        COALESCE(company, 'Компания'),
        updated_at
      FROM interviews
      UNION ALL
      SELECT id, 'knowledge', technology,
        CONCAT('Категория: ', COALESCE(category, 'не указана')),
        current_version,
        updated_at
      FROM tech_knowledge
    ) AS combined
    ORDER BY updated_at DESC NULLS LAST
    LIMIT $1
  `,
    [limit]
  );

  return rows.map((row) => ({
    entity: row.entity,
    title: row.title,
    summary: row.summary,
    tag: row.tag,
    updatedAt: row.updated_at,
  }));
}

export const validationRules = {
  isValidCourseStatus(value) {
    return COURSE_STATUSES.includes(value);
  },
  isValidInterviewStatus(value) {
    return INTERVIEW_STATUSES.includes(value);
  },
  isValidPortfolioStatus(value) {
    return PORTFOLIO_STATUSES.includes(value);
  },
};
