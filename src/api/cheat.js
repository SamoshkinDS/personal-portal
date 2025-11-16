import { apiAuthFetch } from "../utils/api.js";

const DEFAULT_ERROR = "Не удалось загрузить шпаргалки";

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

export const cheatApi = {
  async list(params = {}) {
    const res = await apiAuthFetch(`/api/cheats${buildQuery(params)}`);
    return jsonOrThrow(res, "Не удалось загрузить шпаргалки");
  },
  async get(id) {
    const res = await apiAuthFetch(`/api/cheats/${id}`);
    return jsonOrThrow(res, "Не удалось загрузить статью");
  },
  async create(payload) {
    const res = await apiAuthFetch("/api/cheats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res, "Не удалось создать статью");
  },
  async update(id, payload) {
    const res = await apiAuthFetch(`/api/cheats/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res, "Не удалось сохранить статью");
  },
  async delete(id) {
    const res = await apiAuthFetch(`/api/cheats/${id}`, { method: "DELETE" });
    return jsonOrThrow(res, "Не удалось удалить статью");
  },
  async import(data) {
    const res = await apiAuthFetch("/api/cheats/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return jsonOrThrow(res, "Не удалось импортировать шпаргалки");
  },
};
