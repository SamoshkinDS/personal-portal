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

function jsonOptions(payload) {
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

function toFormData(payload = {}) {
  const fd = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => fd.append(key, item));
    } else {
      fd.append(key, value);
    }
  });
  return fd;
}

export const homeApi = {
  async getCompany() {
    const response = await apiAuthFetch("/api/home/company");
    return handleResponse(response, "Не удалось загрузить управляющую компанию");
  },

  async saveCompany(payload) {
    const fd = payload instanceof FormData ? payload : toFormData(payload);
    const response = await apiAuthFetch("/api/home/company", { method: "POST", body: fd });
    return handleResponse(response, "Не удалось сохранить управляющую компанию");
  },

  async listContacts() {
    const response = await apiAuthFetch("/api/home/contacts");
    return handleResponse(response, "Не удалось загрузить контакты");
  },

  async createContact(payload) {
    const response = await apiAuthFetch("/api/home/contacts", { method: "POST", ...jsonOptions(payload) });
    return handleResponse(response, "Не удалось добавить контакт");
  },

  async updateContact(id, payload) {
    const response = await apiAuthFetch(`/api/home/contacts/${id}`, { method: "PUT", ...jsonOptions(payload) });
    return handleResponse(response, "Не удалось обновить контакт");
  },

  async deleteContact(id) {
    const response = await apiAuthFetch(`/api/home/contacts/${id}`, { method: "DELETE" });
    return handleResponse(response, "Не удалось удалить контакт");
  },

  async listCameras() {
    const response = await apiAuthFetch("/api/home/cameras");
    return handleResponse(response, "Не удалось загрузить камеры");
  },

  async createCamera(payload) {
    const response = await apiAuthFetch("/api/home/cameras", { method: "POST", ...jsonOptions(payload) });
    return handleResponse(response, "Не удалось добавить камеру");
  },

  async updateCamera(id, payload) {
    const response = await apiAuthFetch(`/api/home/cameras/${id}`, { method: "PUT", ...jsonOptions(payload) });
    return handleResponse(response, "Не удалось обновить камеру");
  },

  async deleteCamera(id) {
    const response = await apiAuthFetch(`/api/home/cameras/${id}`, { method: "DELETE" });
    return handleResponse(response, "Не удалось удалить камеру");
  },

  async listMeters() {
    const response = await apiAuthFetch("/api/home/meters");
    return handleResponse(response, "Не удалось загрузить счётчики");
  },

  async createMeter(payload) {
    const response = await apiAuthFetch("/api/home/meters", { method: "POST", ...jsonOptions(payload) });
    return handleResponse(response, "Не удалось добавить счётчик");
  },

  async updateMeter(id, payload) {
    const response = await apiAuthFetch(`/api/home/meters/${id}`, { method: "PUT", ...jsonOptions(payload) });
    return handleResponse(response, "Не удалось обновить счётчик");
  },

  async deleteMeter(id) {
    const response = await apiAuthFetch(`/api/home/meters/${id}`, { method: "DELETE" });
    return handleResponse(response, "Не удалось удалить счётчик");
  },

  async listMeterRecords(meterId) {
    const response = await apiAuthFetch(`/api/home/meter-records/${meterId}`);
    return handleResponse(response, "Не удалось загрузить историю показаний");
  },

  async createMeterRecord(meterId, payload) {
    const response = await apiAuthFetch(`/api/home/meter-records/${meterId}`, { method: "POST", ...jsonOptions(payload) });
    return handleResponse(response, "Не удалось добавить показание");
  },

  async deleteMeterRecord(recordId) {
    const response = await apiAuthFetch(`/api/home/meter-records/${recordId}`, { method: "DELETE" });
    return handleResponse(response, "Не удалось удалить показание");
  },
};
