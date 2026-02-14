import { apiAuthFetch } from "../utils/api.js";

async function handleResponse(response, fallback) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // ignore parse errors
  }
  if (!response.ok) {
    const message = payload?.error || payload?.message || fallback;
    throw new Error(message);
  }
  if (!payload) {
    throw new Error(fallback);
  }
  if (!payload.success) {
    throw new Error(payload.error || fallback);
  }
  return payload.data || {};
}

function buildHeaders(json = true) {
  return json ? { "Content-Type": "application/json" } : undefined;
}

function formatQueryParams(params = {}) {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    qp.set(key, value);
  });
  return qp.toString();
}

export const careerApi = {
  async getDashboard() {
    const response = await apiAuthFetch("/api/career/dashboard");
    return handleResponse(response, "Не удалось загрузить сводку карьеры");
  },

  async getDashboardActivity() {
    const response = await apiAuthFetch("/api/career/dashboard/activity");
    return handleResponse(response, "Не удалось загрузить активность");
  },

  async listSkills() {
    const response = await apiAuthFetch("/api/career/skills");
    const data = await handleResponse(response, "Не удалось загрузить навыки");
    return data?.items || [];
  },

  async createSkill(payload) {
    const response = await apiAuthFetch("/api/career/skills", {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await handleResponse(response, "Не удалось создать навык");
    return data.skill;
  },

  async updateSkill(id, payload) {
    const response = await apiAuthFetch(`/api/career/skills/${id}`, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await handleResponse(response, "Не удалось обновить навык");
    return data.skill;
  },

  async deleteSkill(id) {
    const response = await apiAuthFetch(`/api/career/skills/${id}`, { method: "DELETE" });
    await handleResponse(response, "Не удалось удалить навык");
    return true;
  },

  async listCourses() {
    const response = await apiAuthFetch("/api/career/courses");
    const data = await handleResponse(response, "Не удалось загрузить курсы");
    return data?.courses || data?.items || [];
  },

  async createCourse(payload) {
    const response = await apiAuthFetch("/api/career/courses", {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await handleResponse(response, "Не удалось создать курс");
    return data?.course;
  },

  async updateCourse(id, payload) {
    const response = await apiAuthFetch(`/api/career/courses/${id}`, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await handleResponse(response, "Не удалось обновить курс");
    return data?.course;
  },

  async deleteCourse(id) {
    const response = await apiAuthFetch(`/api/career/courses/${id}`, { method: "DELETE" });
    await handleResponse(response, "Не удалось удалить курс");
    return true;
  },

  async uploadCourseCertificate(id, payload) {
    const response = await apiAuthFetch(`/api/career/courses/${id}/certificate`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await handleResponse(response, "Не удалось сохранить сертификат");
    return data?.course;
  },

  async uploadCourseCertificateFile(id, file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiAuthFetch(`/api/career/courses/${id}/certificate`, {
      method: "POST",
      body: formData,
    });
    return handleResponse(response, "Не удалось загрузить файл");
  },

  async listPortfolioProjects() {
    const response = await apiAuthFetch("/api/career/portfolio");
    const data = await handleResponse(response, "Не удалось загрузить проекты");
    return data?.items || [];
  },

  async getPortfolioProject(id) {
    const response = await apiAuthFetch(`/api/career/portfolio/${id}`);
    const data = await handleResponse(response, "Не удалось загрузить проект");
    return data?.project;
  },

  async createPortfolioProject(payload) {
    const response = await apiAuthFetch("/api/career/portfolio", {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await handleResponse(response, "Не удалось создать проект");
    return data?.project;
  },

  async updatePortfolioProject(id, payload) {
    const response = await apiAuthFetch(`/api/career/portfolio/${id}`, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await handleResponse(response, "Не удалось обновить проект");
    return data?.project;
  },

  async deletePortfolioProject(id) {
    const response = await apiAuthFetch(`/api/career/portfolio/${id}`, { method: "DELETE" });
    await handleResponse(response, "Не удалось удалить проект");
    return true;
  },

  async getPortfolioTimeline() {
    const response = await apiAuthFetch("/api/career/portfolio/timeline");
    return handleResponse(response, "Не удалось загрузить таймлайн");
  },

  async listInterviews(filters = {}) {
    const params = formatQueryParams({
      statuses: filters.statuses?.join(","),
      company: filters.company,
      types: filters.types?.join(","),
      date_from: filters.dateFrom,
      date_to: filters.dateTo,
      mode: filters.mode,
      sort_field: filters.sortField,
      sort_order: filters.sortOrder,
      limit: filters.limit,
    });
    const response = await apiAuthFetch(`/api/career/interviews${params ? `?${params}` : ""}`);
    const data = await handleResponse(response, "Не удалось загрузить собеседования");
    return data?.items || [];
  },

  async createInterview(payload) {
    const response = await apiAuthFetch("/api/career/interviews", {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await handleResponse(response, "Не удалось создать собеседование");
    return data?.interview;
  },

  async updateInterview(id, payload) {
    const response = await apiAuthFetch(`/api/career/interviews/${id}`, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await handleResponse(response, "Не удалось обновить собеседование");
    return data?.interview;
  },

  async deleteInterview(id) {
    const response = await apiAuthFetch(`/api/career/interviews/${id}`, { method: "DELETE" });
    await handleResponse(response, "Не удалось удалить собеседование");
    return true;
  },

  async getInterviewStats() {
    const response = await apiAuthFetch("/api/career/interviews/stats");
    return handleResponse(response, "Не удалось загрузить статистику");
  },

  async exportInterviews(filters = {}) {
    const params = formatQueryParams({
      statuses: filters.statuses?.join(","),
      company: filters.company,
      types: filters.types?.join(","),
      date_from: filters.dateFrom,
      date_to: filters.dateTo,
      mode: filters.mode,
    });
    const response = await apiAuthFetch(`/api/career/interviews/export${params ? `?${params}` : ""}`);
    if (!response.ok) throw new Error("Не удалось экспортировать CSV");
    return response.text();
  },

  async listKnowledge(filters = {}) {
    const params = formatQueryParams({
      search: filters.search,
      category: filters.category,
    });
    const response = await apiAuthFetch(`/api/career/knowledge${params ? `?${params}` : ""}`);
    const data = await handleResponse(response, "Не удалось загрузить знания");
    return data?.items || [];
  },

  async getKnowledgeById(id) {
    const response = await apiAuthFetch(`/api/career/knowledge/${id}`);
    const data = await handleResponse(response, "Не удалось загрузить технологию");
    return data?.knowledge || null;
  },

  async createKnowledge(payload) {
    const response = await apiAuthFetch("/api/career/knowledge", {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await handleResponse(response, "Не удалось создать технологию");
    return data?.knowledge;
  },

  async updateKnowledge(id, payload) {
    const response = await apiAuthFetch(`/api/career/knowledge/${id}`, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await handleResponse(response, "Не удалось обновить технологию");
    return data?.knowledge;
  },

  async deleteKnowledge(id) {
    const response = await apiAuthFetch(`/api/career/knowledge/${id}`, { method: "DELETE" });
    await handleResponse(response, "Не удалось удалить технологию");
    return true;
  },

  async getKnowledgeTemplates() {
    const response = await apiAuthFetch("/api/career/knowledge/templates");
    const data = await handleResponse(response, "Не удалось загрузить шаблоны");
    return data?.items || [];
  },

  async exportPortfolioResume(payload) {
    const response = await apiAuthFetch("/api/career/portfolio/export", {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.error || "Не удалось экспортировать резюме");
    }
    return response.arrayBuffer();
  },

  async getPortfolioTimeline() {
    const response = await apiAuthFetch("/api/career/portfolio/timeline");
    return handleResponse(response, "Не удалось загрузить таймлайн");
  },

  async getCareerAnalytics() {
    const response = await apiAuthFetch("/api/career/analytics");
    return handleResponse(response, "Не удалось загрузить аналитику");
  },
};
