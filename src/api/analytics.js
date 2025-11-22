import { apiAuthFetch } from "../utils/api.js";

const DEFAULT_ERROR = "Не удалось выполнить запрос";

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (typeof value === "boolean") {
      search.set(key, value ? "true" : "false");
      return;
    }
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
    message = data?.message || fallback;
  } catch {
    // ignore
  }
  const error = new Error(message);
  error.status = res.status;
  throw error;
}

export const analyticsApi = {
  async getTopics(params = {}) {
    const res = await apiAuthFetch(`/api/analytics/topics${buildQuery(params)}`);
    return jsonOrThrow(res, "Не удалось загрузить темы");
  },
  async createTopic(payload) {
    const res = await apiAuthFetch("/api/analytics/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res, "Не удалось создать тему");
  },
  async getTopic(idOrSlug) {
    const res = await apiAuthFetch(`/api/analytics/topics/${encodeURIComponent(idOrSlug)}`);
    return jsonOrThrow(res, "Не удалось загрузить тему");
  },
  async updateTopic(id, payload) {
    const res = await apiAuthFetch(`/api/analytics/topics/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res, "Не удалось обновить тему");
  },
  async deleteTopic(id, { force = false } = {}) {
    const qs = force ? "?force=true" : "";
    const res = await apiAuthFetch(`/api/analytics/topics/${id}${qs}`, { method: "DELETE" });
    return jsonOrThrow(res, "Не удалось удалить тему");
  },
  async getArticle(id) {
    const res = await apiAuthFetch(`/api/analytics/articles/${id}`);
    return jsonOrThrow(res, "Не удалось загрузить статью");
  },
  async updateArticle(id, payload) {
    const res = await apiAuthFetch(`/api/analytics/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res, "Не удалось обновить статью");
  },
  async listQueue(params = {}) {
    const res = await apiAuthFetch(`/api/articles-queue${buildQuery(params)}`);
    return jsonOrThrow(res, "Не удалось получить очередь");
  },
  async deleteQueue(id) {
    const res = await apiAuthFetch(`/api/articles-queue/${id}`, { method: "DELETE" });
    return jsonOrThrow(res, "Не удалось удалить запись из очереди");
  },
  async createQueue(payload) {
    const res = await apiAuthFetch("/api/articles-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res, "Не удалось создать запись");
  },
  async updateQueue(id, payload) {
    const res = await apiAuthFetch(`/api/articles-queue/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res, "Не удалось обновить запись");
  },
  async publishFromQueue(id, topicId) {
    const res = await apiAuthFetch(`/api/articles-queue/${id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId }),
    });
    return jsonOrThrow(res, "Не удалось опубликовать статью");
  },
  async deleteArticle(id) {
    const res = await apiAuthFetch(`/api/analytics/articles/${id}`, { method: "DELETE" });
    return jsonOrThrow(res, "Не удалось удалить статью");
  },
};
