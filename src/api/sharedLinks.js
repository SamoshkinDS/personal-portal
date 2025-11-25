import { apiAuthFetch, apiFetch } from "../utils/api.js";

async function handleResponse(response, fallback) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // ignore
  }
  if (!response.ok) {
    const message = payload?.error || payload?.message || fallback;
    throw new Error(message);
  }
  if (payload && payload.success === false) {
    throw new Error(payload.error || fallback);
  }
  return payload?.data ?? payload;
}

const jsonOptions = (payload) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

export const sharedLinksApi = {
  async list() {
    const res = await apiAuthFetch("/api/shared");
    return handleResponse(res, "Не удалось загрузить ссылки");
  },

  async create(payload) {
    const res = await apiAuthFetch("/api/shared", { method: "POST", ...jsonOptions(payload) });
    return handleResponse(res, "Не удалось создать ссылку");
  },

  async get(id) {
    const res = await apiAuthFetch(`/api/shared/${id}`);
    return handleResponse(res, "Не удалось загрузить ссылку");
  },

  async update(id, payload) {
    const res = await apiAuthFetch(`/api/shared/${id}`, { method: "PUT", ...jsonOptions(payload) });
    return handleResponse(res, "Не удалось обновить ссылку");
  },

  async revoke(id) {
    const res = await apiAuthFetch(`/api/shared/${id}/revoke`, { method: "POST" });
    return handleResponse(res, "Не удалось отозвать ссылку");
  },

  async fetchPublic(token) {
    const res = await apiFetch(`/shared/${token}`);
    return handleResponse(res, "Доступ недоступен");
  },
};
