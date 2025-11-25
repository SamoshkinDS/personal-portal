import { apiAuthFetch } from "../utils/api.js";

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

function toFormData(payload = {}) {
  const fd = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    fd.append(key, value);
  });
  return fd;
}

const jsonOptions = (payload) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

export const wishApi = {
  async list() {
    const response = await apiAuthFetch("/api/wish");
    return handleResponse(response, "Не удалось загрузить список желаний");
  },

  async create(payload) {
    const body = payload instanceof FormData ? payload : toFormData(payload);
    const response = await apiAuthFetch("/api/wish", { method: "POST", body });
    return handleResponse(response, "Не удалось создать карточку");
  },

  async update(id, payload) {
    const body = payload instanceof FormData ? payload : toFormData(payload);
    const response = await apiAuthFetch(`/api/wish/${id}`, { method: "PUT", body });
    return handleResponse(response, "Не удалось обновить карточку");
  },

  async remove(id) {
    const response = await apiAuthFetch(`/api/wish/${id}`, { method: "DELETE" });
    return handleResponse(response, "Не удалось удалить карточку");
  },

  async archive(id, reason) {
    const response = await apiAuthFetch(`/api/wish/${id}/archive`, { method: "POST", ...jsonOptions({ reason }) });
    return handleResponse(response, "Не удалось архивировать карточку");
  },

  async unarchive(id) {
    const response = await apiAuthFetch(`/api/wish/${id}/unarchive`, { method: "POST" });
    return handleResponse(response, "Не удалось вернуть карточку");
  },
};
