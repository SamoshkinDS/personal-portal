import process from "process";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

let pool;
let ensureCareerSchema;

const SKILLS = [
  { name: "React", category: "Frontend", level: 4 },
  { name: "Node.js", category: "Backend", level: 4 },
  { name: "PostgreSQL", category: "Backend", level: 3 },
  { name: "Docker", category: "DevOps", level: 3 },
  { name: "Go", category: "Backend", level: 2 },
  { name: "UX", category: "Frontend", level: 3 },
];

const COURSES = [
  {
    title: "Advanced React Patterns",
    platform: "Udemy",
    status: "completed",
    startDate: "2024-02-01",
    completionDate: "2024-03-15",
    rating: 5,
    skillLocks: ["React"],
  },
  {
    title: "PostgreSQL Deep Dive",
    platform: "Coursera",
    status: "completed",
    startDate: "2023-09-01",
    completionDate: "2023-11-01",
    rating: 4,
    skillLocks: ["PostgreSQL"],
  },
  {
    title: "Docker for Pros",
    platform: "Pluralsight",
    status: "in_progress",
    startDate: "2024-07-01",
    progressPercent: 55,
    skillLocks: ["Docker"],
  },
];

const PORTFOLIO = [
  {
    title: "Growth Platform",
    company: "FinTech Labs",
    role: "Lead Engineer",
    startDate: "2022-02-01",
    endDate: "2023-06-30",
    status: "completed",
    achievements: ["Собрал data pipeline", "Снизил latency на 34%"],
    metrics: { revenue: "$1.2M", efficiency: "30%" },
    skills: ["Node.js", "PostgreSQL"],
  },
  {
    title: "Automation Hub",
    company: "InfraCo",
    role: "Solutions Architect",
    startDate: "2023-07-01",
    status: "active",
    statusColor: "blue",
    achievements: ["Развернул CI/CD на Docker"],
    metrics: { teams: "6", uptime: "99.9%" },
    skills: ["Docker", "React"],
  },
];

const INTERVIEWS = [
  {
    company: "DataCorp",
    position: "Senior Engineer",
    interviewDate: "2024-06-10T14:00:00Z",
    status: "passed",
    interviewType: "Technical",
    salaryOffer: 120000,
    recruiterName: "Olga",
    recruiterContact: "@olgarecruit",
  },
  {
    company: "CloudRoute",
    position: "DevOps Specialist",
    interviewDate: "2024-07-20T09:00:00Z",
    status: "offer_received",
    interviewType: "HR",
    feedback: "готов к следующему этапу",
    recruiterName: "Max",
    recruiterContact: "max@cloudroute.ai",
  },
];

const KNOWLEDGE = [
  {
    technology: "GraphQL",
    currentVersion: "2023.0",
    category: "Frontend",
    bestPractices: "Use typed resolvers...",
    usefulLinks: [{ title: "Spec", url: "https://graphql.org" }],
    notes: "Documented API layer",
  },
  {
    technology: "Kubernetes",
    currentVersion: "1.27",
    category: "DevOps",
    bestPractices: "Use namespaces...",
    usefulLinks: [{ title: "K8s Docs", url: "https://kubernetes.io/docs" }],
    notes: "Clusters for projects",
  },
];

async function seedSkills() {
  const names = SKILLS.map((skill) => skill.name);
  await pool.query("DELETE FROM skills WHERE name = ANY($1)", [names]);
  const skillMap = new Map();
  for (const skill of SKILLS) {
    const { rows } = await pool.query(
      `INSERT INTO skills (name, category, level, description)
       VALUES ($1,$2,$3,$4)
       RETURNING id`,
      [skill.name, skill.category, skill.level, skill.description || null]
    );
    skillMap.set(skill.name, rows[0].id);
  }
  return skillMap;
}

async function seedCourses(skillMap) {
  await pool.query("DELETE FROM courses");
  await pool.query("DELETE FROM course_skills");
  for (const course of COURSES) {
    const { rows } = await pool.query(
      `INSERT INTO courses
        (title, platform, status, start_date, completion_date, rating, progress_percent, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [
        course.title,
        course.platform,
        course.status,
        course.startDate,
        course.completionDate || null,
        course.rating || null,
        course.progressPercent || 0,
        course.notes || null,
      ]
    );
    const courseId = rows[0].id;
    for (const skillName of course.skillLocks || []) {
      const skillId = skillMap.get(skillName);
      if (skillId) {
        await pool.query("INSERT INTO course_skills (course_id, skill_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [courseId, skillId]);
      }
    }
  }
}

async function seedPortfolio(skillMap) {
  await pool.query("DELETE FROM project_skills");
  for (const project of PORTFOLIO) {
    const { rows } = await pool.query(
      `INSERT INTO portfolio_projects
        (title, company, role, start_date, end_date, status, achievements, metrics, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id`,
      [
        project.title,
        project.company,
        project.role,
        project.startDate,
        project.endDate || null,
        project.status,
        project.achievements ? JSON.stringify(project.achievements) : null,
        project.metrics ? JSON.stringify(project.metrics) : null,
        project.notes || null,
      ]
    );
    const projectId = rows[0].id;
    for (const skillName of project.skills || []) {
      const skillId = skillMap.get(skillName);
      if (skillId) {
        await pool.query("INSERT INTO project_skills (project_id, skill_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [projectId, skillId]);
      }
    }
  }
}

async function seedInterviews() {
  await pool.query("DELETE FROM interviews");
  for (const entry of INTERVIEWS) {
    await pool.query(
      `INSERT INTO interviews
        (company, position, interview_date, status, interview_type, recruiter_name, recruiter_contact, salary_offer, feedback, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        entry.company,
        entry.position,
        entry.interviewDate,
        entry.status,
        entry.interviewType,
        entry.recruiterName,
        entry.recruiterContact,
        entry.salaryOffer || null,
        entry.feedback || null,
        entry.notes || null,
      ]
    );
  }
}

async function seedKnowledge() {
  await pool.query("DELETE FROM tech_knowledge");
  for (const entry of KNOWLEDGE) {
    await pool.query(
      `INSERT INTO tech_knowledge (technology, current_version, category, best_practices, useful_links, notes)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        entry.technology,
        entry.currentVersion,
        entry.category,
        entry.bestPractices,
        entry.usefulLinks ? JSON.stringify(entry.usefulLinks) : null,
        entry.notes,
      ]
    );
  }
}

async function main() {
  try {
    const [schemaModule, connectModule] = await Promise.all([
      import("../db/careerSchema.js"),
      import("../db/connect.js"),
    ]);
    ensureCareerSchema = schemaModule.ensureCareerSchema;
    pool = connectModule.pool;
    await ensureCareerSchema();
    const skillMap = await seedSkills();
    await seedCourses(skillMap);
    await seedPortfolio(skillMap);
    await seedInterviews();
    await seedKnowledge();
    console.log("Career seed completed");
  } catch (error) {
    console.error("Career seed failed", error);
    process.exitCode = 1;
  } finally {
    if (pool) await pool.end();
  }
}

main();
