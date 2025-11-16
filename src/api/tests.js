import { apiAuthFetch } from "../utils/api.js";

const DEFAULT_ERROR = "Не удалось загрузить тесты";

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

export const testsApi = {
  async list(params = {}) {
    const res = await apiAuthFetch(`/api/tests${buildQuery(params)}`);
    return jsonOrThrow(res, "Не удалось загрузить тесты");
  },
  async get(id) {
    const res = await apiAuthFetch(`/api/tests/${id}`);
    return jsonOrThrow(res, "Не удалось загрузить тест");
  },
  async create(payload) {
    const res = await apiAuthFetch("/api/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res, "Не удалось создать тест");
  },
  async respond(payload) {
    const res = await apiAuthFetch("/api/tests/response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res, "Не удалось отправить данные теста");
  },
};
