import { apiAuthFetch } from "../utils/api.js";

const DEFAULT_ERROR = "Не удалось выполнить запрос к Промтмастеру";

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, value);
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
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

export const promptmasterApi = {
  async listRequests(limit = 100) {
    const res = await apiAuthFetch(`/api/promptmaster/requests${buildQuery({ limit })}`);
    return jsonOrThrow(res, "Не удалось загрузить очередь запросов");
  },
  async createRequest(query) {
    const res = await apiAuthFetch("/api/promptmaster/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    return jsonOrThrow(res, "Не удалось отправить запрос");
  },
  async triggerWebhook(id, query) {
    const res = await apiAuthFetch("/api/promptmaster/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: id, query }),
    });
    return jsonOrThrow(res, "Не удалось повторно отправить запрос");
  },
  async listCategories(parentId) {
    const res = await apiAuthFetch(`/api/promptmaster/categories${buildQuery({ parentId })}`);
    return jsonOrThrow(res, "Не удалось загрузить категории");
  },
  async listAllCategories() {
    const res = await apiAuthFetch(`/api/promptmaster/categories${buildQuery({ all: true })}`);
    return jsonOrThrow(res, "Не удалось загрузить список папок");
  },
  async createCategory(payload) {
    const res = await apiAuthFetch("/api/promptmaster/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res, "Не удалось создать папку");
  },
  async getCategory(id) {
    const res = await apiAuthFetch(`/api/promptmaster/categories/${id}`);
    return jsonOrThrow(res, "Не удалось загрузить категорию");
  },
  async createArticle(payload) {
    const res = await apiAuthFetch("/api/promptmaster/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res, "Не удалось создать промт");
  },
  async getSettings() {
    const res = await apiAuthFetch("/api/promptmaster/settings");
    return jsonOrThrow(res, "Не удалось загрузить настройки");
  },
  async saveSettings(payload) {
    const res = await apiAuthFetch("/api/promptmaster/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res, "Не удалось сохранить настройки");
  },
  async getArticle(id) {
    const res = await apiAuthFetch(`/api/promptmaster/articles/${id}`);
    return jsonOrThrow(res, "Не удалось загрузить статью");
  },
};
