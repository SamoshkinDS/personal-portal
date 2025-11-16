import { apiAuthFetch } from "../utils/api.js";

const DEFAULT_ERROR = "Failed to load interview prep data";

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, value);
  });
  const queryString = search.toString();
  return queryString ? `?${queryString}` : "";
}

async function jsonOrThrow(res, fallback = DEFAULT_ERROR) {
  if (res.ok) {
    if (res.status === 204) return null;
    return res.json();
  }
  let message = fallback;
  try {
    const data = await res.json();
    if (data?.message) message = data.message;
  } catch {
    // ignore
  }
  const error = new Error(message);
  error.status = res.status;
  throw error;
}

export const interviewApi = {
  async listQuestions(params = {}) {
    const res = await apiAuthFetch(`/api/interview/questions${buildQuery(params)}`);
    return jsonOrThrow(res, "Failed to load questions");
  },
  async createQuestion(payload) {
    const res = await apiAuthFetch("/api/interview/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res, "Failed to create question");
  },
  async updateQuestion(id, payload) {
    const res = await apiAuthFetch(`/api/interview/questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res, "Failed to update question");
  },
  async deleteQuestion(id) {
    const res = await apiAuthFetch(`/api/interview/questions/${id}`, {
      method: "DELETE",
    });
    return jsonOrThrow(res, "Failed to delete question");
  },
  async importQuestions(data) {
    const res = await apiAuthFetch("/api/interview/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return jsonOrThrow(res, "Failed to import questions");
  },
  async listArticles(params = {}) {
    const res = await apiAuthFetch(`/api/interview/articles${buildQuery(params)}`);
    return jsonOrThrow(res, "Failed to load articles");
  },
};
