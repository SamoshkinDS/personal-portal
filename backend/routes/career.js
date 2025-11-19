import express from "express";
import multer from "multer";
import { pool } from "../db/connect.js";
import { authRequired } from "../middleware/auth.js";
import {
  validationRules,
  listSkills,
  createSkill,
  getSkillById,
  updateSkill,
  deleteSkill,
  listCourses,
  createCourse,
  getCourseById,
  updateCourse,
  updateCourseCertificate,
  deleteCourse,
  listPortfolioProjects,
  createPortfolioProject,
  getPortfolioProjectById,
  updatePortfolioProject,
  deletePortfolioProject,
  getPortfolioTimeline,
  listInterviews,
  createInterview,
  getInterviewById,
  updateInterview,
  deleteInterview,
  getInterviewStats,
  exportInterviews,
  listKnowledge,
  createKnowledge,
  getKnowledgeById,
  updateKnowledge,
  deleteKnowledge,
  getKnowledgeTemplates,
  getCareerDashboard,
  getCareerActivity,
  getCareerAnalytics,
} from "../services/careerService.js";
import { uploadFile, buildUrl } from "../services/storageService.js";
import { createResumePdf } from "../services/pdfService.js";

const DASHBOARD_CACHE_TTL = 5 * 60 * 1000;
let dashboardCache = { expires: 0, data: null };
const ANALYTICS_CACHE_TTL = 5 * 60 * 1000;
let analyticsCache = { expires: 0, data: null };

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  },
});

const router = express.Router();

router.use(authRequired);

const respond = (res, status, payload) => {
  return res.status(status).json({
    success: payload.success,
    data: payload.data ?? null,
    error: payload.error ?? null,
  });
};

const hasPayloadValue = (payload, keys) => {
  if (!payload || typeof payload !== "object") return false;
  return keys.some((key) => Object.prototype.hasOwnProperty.call(payload, key));
};

router.get("/skills", async (req, res) => {
  try {
    const items = await listSkills();
    return respond(res, 200, { success: true, data: { items } });
  } catch (err) {
    console.error("GET /api/career/skills", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить навыки" });
  }
});

router.post("/skills", async (req, res) => {
  try {
    const { name, category, level, description, iconUrl } = req.body || {};
    if (!name || !String(name).trim()) {
      return respond(res, 400, { success: false, error: "Имя навыка не может быть пустым" });
    }
    const normalizedLevel = level !== undefined && level !== null ? Number(level) : null;
    if (normalizedLevel !== null && (!Number.isInteger(normalizedLevel) || normalizedLevel < 1 || normalizedLevel > 5)) {
      return respond(res, 400, { success: false, error: "Уровень навыка должен быть от 1 до 5" });
    }
    const skill = await createSkill({
      name: String(name).trim(),
      category: category ?? null,
      level: normalizedLevel,
      description: description ?? null,
      iconUrl: iconUrl ?? null,
    });
    return respond(res, 201, { success: true, data: { skill } });
  } catch (err) {
    console.error("POST /api/career/skills", err);
    return respond(res, 500, { success: false, error: "Не удалось создать навык" });
  }
});

router.get("/skills/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор навыка" });
    }
    const skill = await getSkillById(id);
    if (!skill) {
      return respond(res, 404, { success: false, error: "Навык не найден" });
    }
    return respond(res, 200, { success: true, data: { skill } });
  } catch (err) {
    console.error("GET /api/career/skills/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить навык" });
  }
});

router.put("/skills/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор навыка" });
    }
    const { name, category, level, description, iconUrl } = req.body || {};
    const normalizedLevel = level !== undefined && level !== null ? Number(level) : undefined;
    if (
      normalizedLevel !== undefined &&
      (!Number.isInteger(normalizedLevel) || normalizedLevel < 1 || normalizedLevel > 5)
    ) {
      return respond(res, 400, { success: false, error: "Уровень навыка должен быть от 1 до 5" });
    }
    const skillKeys = ["name", "category", "level", "description", "iconUrl"];
    if (!hasPayloadValue(req.body, skillKeys)) {
      return respond(res, 400, { success: false, error: "Нет данных для обновления навыка" });
    }
    const updated = await updateSkill(id, {
      name: name !== undefined ? (name && String(name).trim()) : undefined,
      category,
      level: normalizedLevel,
      description,
      iconUrl,
    });
    if (!updated) {
      return respond(res, 404, { success: false, error: "Навык не найден" });
    }
    return respond(res, 200, { success: true, data: { skill: updated } });
  } catch (err) {
    console.error("PUT /api/career/skills/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось обновить навык" });
  }
});

router.delete("/skills/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор навыка" });
    }
    const deleted = await deleteSkill(id);
    if (!deleted) {
      return respond(res, 404, { success: false, error: "Навык не найден" });
    }
    return respond(res, 200, { success: true, data: { message: "Навык удалён" } });
  } catch (err) {
    console.error("DELETE /api/career/skills/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось удалить навык" });
  }
});

router.get("/courses", async (req, res) => {
  try {
    const items = await listCourses();
    return respond(res, 200, { success: true, data: { items } });
  } catch (err) {
    console.error("GET /api/career/courses", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить курсы" });
  }
});

router.post("/courses", async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.title || !String(payload.title).trim()) {
      return respond(res, 400, { success: false, error: "Название курса обязательно" });
    }
    if (payload.status && !validationRules.isValidCourseStatus(payload.status)) {
      return respond(res, 400, { success: false, error: "Неверный статус курса" });
    }
    const course = await createCourse({
      ...payload,
      title: String(payload.title).trim(),
      status: payload.status || "planned",
    });
    return respond(res, 201, { success: true, data: { course } });
  } catch (err) {
    console.error("POST /api/career/courses", err);
    return respond(res, 500, { success: false, error: "Не удалось создать курс" });
  }
});

router.get("/courses/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор курса" });
    }
    const course = await getCourseById(id);
    if (!course) {
      return respond(res, 404, { success: false, error: "Курс не найден" });
    }
    return respond(res, 200, { success: true, data: { course } });
  } catch (err) {
    console.error("GET /api/career/courses/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить курс" });
  }
});

router.put("/courses/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор курса" });
    }
    if (req.body?.status && !validationRules.isValidCourseStatus(req.body.status)) {
      return respond(res, 400, { success: false, error: "Неверный статус курса" });
    }
    const courseKeys = [
      "title",
      "platform",
      "status",
      "startDate",
      "completionDate",
      "certificateUrl",
      "certificateFile",
      "rating",
      "notes",
      "url",
      "skillIds",
    ];
    if (!hasPayloadValue(req.body, courseKeys)) {
      return respond(res, 400, { success: false, error: "Нет данных для обновления курса" });
    }
    const course = await updateCourse(id, req.body || {});
    if (!course) {
      return respond(res, 404, { success: false, error: "Курс не найден" });
    }
    return respond(res, 200, { success: true, data: { course } });
  } catch (err) {
    console.error("PUT /api/career/courses/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось обновить курс" });
  }
});

router.post("/courses/:id/certificate", upload.single("file"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор курса" });
    }
    if (req.file) {
      const originalName = req.file.originalname.replace(/\s+/g, "_");
      const timestamp = Date.now();
      const key = `career/certificates/${id}/${timestamp}-${originalName}`;
      const url = await uploadFile(req.file.buffer, key, req.file.mimetype);
      const updated = await updateCourseCertificate(id, { certificateUrl: url, certificateFile: key });
      if (!updated) {
        return respond(res, 404, { success: false, error: "Курс не найден" });
      }
      return respond(res, 200, { success: true, data: { course: updated, url } });
    }
    const payload = req.body || {};
    if (!payload.certificateUrl && !payload.certificateFile && payload.completionDate === undefined) {
      return respond(res, 400, { success: false, error: "Требуется хотя бы одно поле сертификата" });
    }
    const updated = await updateCourseCertificate(id, payload);
    if (!updated) {
      return respond(res, 404, { success: false, error: "Курс не найден" });
    }
    return respond(res, 200, { success: true, data: { course: updated } });
  } catch (err) {
    if (err instanceof multer.MulterError || err.message === "Invalid file type") {
      return respond(res, 400, { success: false, error: "Неподдерживаемый файл" });
    }
    console.error("POST /api/career/courses/:id/certificate", err);
    return respond(res, 500, { success: false, error: "Не удалось обновить сертификат" });
  }
});

router.delete("/courses/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор курса" });
    }
    const deleted = await deleteCourse(id);
    if (!deleted) {
      return respond(res, 404, { success: false, error: "Курс не найден" });
    }
    return respond(res, 200, { success: true, data: { message: "Курс удалён" } });
  } catch (err) {
    console.error("DELETE /api/career/courses/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось удалить курс" });
  }
});

router.get("/portfolio", async (req, res) => {
  try {
    const items = await listPortfolioProjects();
    return respond(res, 200, { success: true, data: { items } });
  } catch (err) {
    console.error("GET /api/career/portfolio", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить портфолио" });
  }
});

router.post("/portfolio", async (req, res) => {
  try {
    const payload = req.body || {};
    const status = payload.status ? String(payload.status) : "active";
    if (!validationRules.isValidPortfolioStatus(status)) {
      return respond(res, 400, { success: false, error: "Неверный статус проекта" });
    }
    const project = await createPortfolioProject({ ...payload, status });
    return respond(res, 201, { success: true, data: { project } });
  } catch (err) {
    console.error("POST /api/career/portfolio", err);
    return respond(res, 500, {
      success: false,
      error: err?.message || "Не удалось создать проект",
    });
  }
});

router.get("/portfolio/timeline", async (req, res) => {
  try {
    const data = await getPortfolioTimeline();
    return respond(res, 200, { success: true, data });
  } catch (err) {
    console.error("GET /api/career/portfolio/timeline", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить таймлайн" });
  }
});


router.get("/portfolio/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор проекта" });
    }
    const project = await getPortfolioProjectById(id);
    if (!project) {
      return respond(res, 404, { success: false, error: "Проект не найден" });
    }
    return respond(res, 200, { success: true, data: { project } });
  } catch (err) {
    console.error("GET /api/career/portfolio/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить проект" });
  }
});

router.put("/portfolio/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор проекта" });
    }
    if (req.body?.status && !validationRules.isValidPortfolioStatus(req.body.status)) {
      return respond(res, 400, { success: false, error: "Неверный статус проекта" });
    }
    const projectKeys = [
      "title",
      "description",
      "company",
      "role",
      "startDate",
      "endDate",
      "status",
      "url",
      "achievements",
      "metrics",
      "skillIds",
    ];
    if (!hasPayloadValue(req.body, projectKeys)) {
      return respond(res, 400, { success: false, error: "Нет данных для обновления проекта" });
    }
    const project = await updatePortfolioProject(id, req.body || {});
    if (!project) {
      return respond(res, 404, { success: false, error: "Проект не найден" });
    }
    return respond(res, 200, { success: true, data: { project } });
  } catch (err) {
    console.error("PUT /api/career/portfolio/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось обновить проект" });
  }
});

router.delete("/portfolio/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор проекта" });
    }
    const deleted = await deletePortfolioProject(id);
    if (!deleted) {
      return respond(res, 404, { success: false, error: "Проект не найден" });
    }
    return respond(res, 200, { success: true, data: { message: "Проект удалён" } });
  } catch (err) {
    console.error("DELETE /api/career/portfolio/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось удалить проект" });
  }
});

router.post("/portfolio/export", authRequired, async (req, res) => {
  try {
    const { project_ids, profile } = req.body || {};
    if (!Array.isArray(project_ids) || !project_ids.length) {
      return respond(res, 400, { success: false, error: "Не выбраны проекты" });
    }
    const uniqueIds = Array.from(new Set(project_ids.map((id) => Number(id)).filter((id) => Number.isFinite(id))));
    const projects = [];
    const skillIds = new Set();
    for (const projectId of uniqueIds) {
      const project = await getPortfolioProjectById(projectId);
      if (!project) continue;
      projects.push(project);
      (project.skillIds || []).forEach((id) => skillIds.add(id));
    }
    if (!projects.length) {
      return respond(res, 400, { success: false, error: "Нет доступных проектов" });
    }
    let skillsByCategory = {};
    if (skillIds.size) {
      const { rows } = await pool.query(
        "SELECT id, name, category FROM skills WHERE id = ANY($1);",
        [Array.from(skillIds)]
      );
      rows.forEach((skill) => {
        const category = skill.category || "Другое";
        if (!skillsByCategory[category]) skillsByCategory[category] = [];
        skillsByCategory[category].push(skill.name);
      });
    }
    const pdfBuffer = await createResumePdf({
      profile: profile || {},
      projects,
      skillsByCategory,
    });
    res.header("Content-Type", "application/pdf");
    res.header("Content-Disposition", 'attachment; filename="career_resume.pdf"');
    return res.send(pdfBuffer);
  } catch (err) {
    console.error("POST /api/career/portfolio/export", err);
    return respond(res, 500, { success: false, error: "Не удалось сгенерировать PDF" });
  }
});

router.get("/portfolio/timeline", async (req, res) => {
  try {
    const data = await getPortfolioTimeline();
    return respond(res, 200, { success: true, data });
  } catch (err) {
    console.error("GET /api/career/portfolio/timeline", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить таймлайн" });
  }
});

router.get("/interviews", async (req, res) => {
  try {
    const filters = {
      statuses: req.query.statuses ? String(req.query.statuses).split(",") : undefined,
      company: req.query.company,
      types: req.query.types ? String(req.query.types).split(",") : undefined,
      dateFrom: req.query.date_from,
      dateTo: req.query.date_to,
      mode: req.query.mode, // upcoming/past/all
      sortField: req.query.sort_field,
      sortOrder: req.query.sort_order,
      limit: Math.min(Math.max(Number(req.query.limit) || 200, 1), 1000),
    };
    const items = await listInterviews(filters);
    return respond(res, 200, { success: true, data: { items } });
  } catch (err) {
    console.error("GET /api/career/interviews", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить интервью" });
  }
});

router.post("/interviews", async (req, res) => {
  try {
    const payload = req.body || {};
    if (payload.status && !validationRules.isValidInterviewStatus(payload.status)) {
      return respond(res, 400, { success: false, error: "Неверный статус интервью" });
    }
    if (!payload.company && !payload.position) {
      return respond(res, 400, { success: false, error: "Требуется хотя бы компания или позиция" });
    }
    const interview = await createInterview({
      ...payload,
      status: payload.status || "scheduled",
    });
    return respond(res, 201, { success: true, data: { interview } });
  } catch (err) {
    console.error("POST /api/career/interviews", err);
    return respond(res, 500, { success: false, error: "Не удалось создать интервью" });
  }
});

router.get("/interviews/stats", async (req, res) => {
  try {
    const stats = await getInterviewStats();
    return respond(res, 200, { success: true, data: stats });
  } catch (err) {
    console.error("GET /api/career/interviews/stats", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить статистику" });
  }
});

router.get("/interviews/export", async (req, res) => {
  try {
    const filters = {
      statuses: req.query.statuses ? String(req.query.statuses).split(",") : undefined,
      company: req.query.company,
      types: req.query.types ? String(req.query.types).split(",") : undefined,
      dateFrom: req.query.date_from,
      dateTo: req.query.date_to,
      mode: req.query.mode,
    };
    const csv = await exportInterviews(filters);
    res.header("Content-Type", "text/csv; charset=utf-8");
    res.header("Content-Disposition", 'attachment; filename="interviews.csv"');
    return res.send(csv);
  } catch (err) {
    console.error("GET /api/career/interviews/export", err);
    return respond(res, 500, { success: false, error: "Не удалось экспортировать интервью" });
  }
});

router.get("/interviews/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор интервью" });
    }
    const interview = await getInterviewById(id);
    if (!interview) {
      return respond(res, 404, { success: false, error: "Интервью не найдено" });
    }
    return respond(res, 200, { success: true, data: { interview } });
  } catch (err) {
    console.error("GET /api/career/interviews/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить интервью" });
  }
});

router.put("/interviews/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор интервью" });
    }
    if (req.body?.status && !validationRules.isValidInterviewStatus(req.body.status)) {
      return respond(res, 400, { success: false, error: "Неверный статус интервью" });
    }
    const interviewKeys = [
      "company",
      "position",
      "interviewDate",
      "status",
      "interviewType",
      "recruiterName",
      "recruiterContact",
      "salaryOffer",
      "feedback",
      "notes",
    ];
    if (!hasPayloadValue(req.body, interviewKeys)) {
      return respond(res, 400, { success: false, error: "Нет данных для обновления интервью" });
    }
    const interview = await updateInterview(id, req.body || {});
    if (!interview) {
      return respond(res, 404, { success: false, error: "Интервью не найдено" });
    }
    return respond(res, 200, { success: true, data: { interview } });
  } catch (err) {
    console.error("PUT /api/career/interviews/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось обновить интервью" });
  }
});

router.delete("/interviews/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор интервью" });
    }
    const deleted = await deleteInterview(id);
    if (!deleted) {
      return respond(res, 404, { success: false, error: "Интервью не найдено" });
    }
    return respond(res, 200, { success: true, data: { message: "Интервью удалено" } });
  } catch (err) {
    console.error("DELETE /api/career/interviews/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось удалить интервью" });
  }
});

router.get("/interviews/stats", async (req, res) => {
  try {
    const stats = await getInterviewStats();
    return respond(res, 200, { success: true, data: stats });
  } catch (err) {
    console.error("GET /api/career/interviews/stats", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить статистику" });
  }
});

router.get("/interviews/export", async (req, res) => {
  try {
    const filters = {
      statuses: req.query.statuses ? String(req.query.statuses).split(",") : undefined,
      company: req.query.company,
      types: req.query.types ? String(req.query.types).split(",") : undefined,
      dateFrom: req.query.date_from,
      dateTo: req.query.date_to,
      mode: req.query.mode,
    };
    const csv = await exportInterviews(filters);
    res.header("Content-Type", "text/csv; charset=utf-8");
    res.header("Content-Disposition", 'attachment; filename="interviews.csv"');
    return res.send(csv);
  } catch (err) {
    console.error("GET /api/career/interviews/export", err);
    return respond(res, 500, { success: false, error: "Не удалось экспортировать интервью" });
  }
});

router.get("/knowledge", async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      category: req.query.category,
    };
    const items = await listKnowledge(filters);
    return respond(res, 200, { success: true, data: { items } });
  } catch (err) {
    console.error("GET /api/career/knowledge", err);
    return respond(res, 500, { success: false, error: "Failed to load knowledge" });
  }
});

router.post("/knowledge", async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.technology || !String(payload.technology).trim()) {
      return respond(res, 400, { success: false, error: "Technology is required" });
    }
    const knowledge = await createKnowledge({
      ...payload,
      technology: String(payload.technology).trim(),
    });
    return respond(res, 201, { success: true, data: { knowledge } });
  } catch (err) {
    console.error("POST /api/career/knowledge", err);
    return respond(res, 500, { success: false, error: "Failed to create knowledge" });
  }
});

router.get("/knowledge/templates", async (req, res) => {
  try {
    const templates = await getKnowledgeTemplates();
    return respond(res, 200, { success: true, data: { items: templates } });
  } catch (err) {
    console.error("GET /api/career/knowledge/templates", err);
    return respond(res, 500, { success: false, error: "Failed to load templates" });
  }
});

router.get("/knowledge/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Invalid knowledge id" });
    }
    const knowledge = await getKnowledgeById(id);
    if (!knowledge) {
      return respond(res, 404, { success: false, error: "Knowledge not found" });
    }
    return respond(res, 200, { success: true, data: { knowledge } });
  } catch (err) {
    console.error("GET /api/career/knowledge/:id", err);
    return respond(res, 500, { success: false, error: "Failed to load knowledge" });
  }
});

router.put("/knowledge/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Invalid knowledge id" });
    }
    if (req.body?.technology && !String(req.body.technology).trim()) {
      return respond(res, 400, { success: false, error: "Technology cannot be empty" });
    }
    const knowledgeKeys = [
      "technology",
      "currentVersion",
      "category",
      "bestPractices",
      "usefulLinks",
      "notes",
    ];
    if (!hasPayloadValue(req.body, knowledgeKeys)) {
      return respond(res, 400, { success: false, error: "No fields to update" });
    }
    const knowledge = await updateKnowledge(id, req.body || {});
    if (!knowledge) {
      return respond(res, 404, { success: false, error: "Knowledge not found" });
    }
    return respond(res, 200, { success: true, data: { knowledge } });
  } catch (err) {
    console.error("PUT /api/career/knowledge/:id", err);
    return respond(res, 500, { success: false, error: "Failed to update knowledge" });
  }
});

router.delete("/knowledge/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Invalid knowledge id" });
    }
    const deleted = await deleteKnowledge(id);
    if (!deleted) {
      return respond(res, 404, { success: false, error: "Knowledge not found" });
    }
    return respond(res, 200, { success: true, data: { message: "Knowledge deleted" } });
  } catch (err) {
    console.error("DELETE /api/career/knowledge/:id", err);
    return respond(res, 500, { success: false, error: "Failed to delete knowledge" });
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    const now = Date.now();
    if (dashboardCache.data && dashboardCache.expires > now) {
      return respond(res, 200, { success: true, data: dashboardCache.data });
    }
    const data = await getCareerDashboard();
    dashboardCache = {
      data,
      expires: now + DASHBOARD_CACHE_TTL,
    };
    return respond(res, 200, { success: true, data });
  } catch (err) {
    console.error("GET /api/career/dashboard", err);
    return respond(res, 500, { success: false, error: "dashboard_fetch_failed" });
  }
});

router.get("/analytics", async (req, res) => {
  try {
    const now = Date.now();
    if (analyticsCache.data && analyticsCache.expires > now) {
      return respond(res, 200, { success: true, data: analyticsCache.data });
    }
    const data = await getCareerAnalytics();
    analyticsCache = { data, expires: now + ANALYTICS_CACHE_TTL };
    return respond(res, 200, { success: true, data });
  } catch (err) {
    console.error("GET /api/career/analytics", err);
    return respond(res, 500, { success: false, error: "analytics_fetch_failed" });
  }
});

router.get("/dashboard/activity", async (req, res) => {
  try {
    const activities = await getCareerActivity();
    return respond(res, 200, { success: true, data: { activities } });
  } catch (err) {
    console.error("GET /api/career/dashboard/activity", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить активность" });
  }
});

export default router;
