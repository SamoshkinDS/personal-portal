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

function buildJsonOptions(payload) {
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

export const carApi = {
  async getOverview() {
    const response = await apiAuthFetch("/api/car");
    return handleResponse(response, "Не удалось загрузить автомобиль");
  },

  async updateCarInfo(payload) {
    const isFormData = payload instanceof FormData;
    const options = {
      method: "POST",
      ...(isFormData ? { body: payload } : buildJsonOptions(payload)),
    };
    const response = await apiAuthFetch("/api/car/update", options);
    return handleResponse(response, "Не удалось обновить автомобиль");
  },

  async listInsurance() {
    const response = await apiAuthFetch("/api/car/insurance");
    return handleResponse(response, "Не удалось загрузить страховки");
  },

  async createInsurance(payload) {
    const fd = payload instanceof FormData ? payload : toFormData(payload);
    const response = await apiAuthFetch("/api/car/insurance", { method: "POST", body: fd });
    return handleResponse(response, "Не удалось сохранить страховку");
  },

  async updateInsurance(id, payload) {
    const fd = payload instanceof FormData ? payload : toFormData(payload);
    const response = await apiAuthFetch(`/api/car/insurance/${id}`, { method: "PUT", body: fd });
    return handleResponse(response, "Не удалось обновить страховку");
  },

  async deleteInsurance(id) {
    const response = await apiAuthFetch(`/api/car/insurance/${id}`, { method: "DELETE" });
    return handleResponse(response, "Не удалось удалить страховку");
  },

  async getAlarm() {
    const response = await apiAuthFetch("/api/car/alarm");
    return handleResponse(response, "Не удалось загрузить сигнализацию");
  },

  async saveAlarm(payload) {
    const response = await apiAuthFetch("/api/car/alarm", {
      method: "POST",
      ...buildJsonOptions(payload),
    });
    return handleResponse(response, "Не удалось сохранить сигнализацию");
  },

  async listServicePlan() {
    const response = await apiAuthFetch("/api/car/service-plan");
    return handleResponse(response, "Не удалось загрузить план ТО");
  },

  async createServicePlan(payload) {
    const response = await apiAuthFetch("/api/car/service-plan", {
      method: "POST",
      ...buildJsonOptions(payload),
    });
    return handleResponse(response, "Не удалось создать операцию ТО");
  },

  async updateServicePlan(id, payload) {
    const response = await apiAuthFetch(`/api/car/service-plan/${id}`, {
      method: "PUT",
      ...buildJsonOptions(payload),
    });
    return handleResponse(response, "Не удалось обновить операцию ТО");
  },

  async deleteServicePlan(id) {
    const response = await apiAuthFetch(`/api/car/service-plan/${id}`, { method: "DELETE" });
    return handleResponse(response, "Не удалось удалить операцию ТО");
  },

  async listServiceRecords() {
    const response = await apiAuthFetch("/api/car/service-records");
    return handleResponse(response, "Не удалось загрузить историю ТО");
  },

  async createServiceRecord(payload) {
    const response = await apiAuthFetch("/api/car/service-records", {
      method: "POST",
      ...buildJsonOptions(payload),
    });
    return handleResponse(response, "Не удалось сохранить запись ТО");
  },

  async updateServiceRecord(id, payload) {
    const response = await apiAuthFetch(`/api/car/service-records/${id}`, {
      method: "PUT",
      ...buildJsonOptions(payload),
    });
    return handleResponse(response, "Не удалось обновить запись ТО");
  },

  async deleteServiceRecord(id) {
    const response = await apiAuthFetch(`/api/car/service-records/${id}`, { method: "DELETE" });
    return handleResponse(response, "Не удалось удалить запись ТО");
  },

  async listMileage() {
    const response = await apiAuthFetch("/api/car/mileage");
    return handleResponse(response, "Не удалось загрузить пробег");
  },

  async createMileage(payload) {
    const response = await apiAuthFetch("/api/car/mileage", {
      method: "POST",
      ...buildJsonOptions(payload),
    });
    return handleResponse(response, "Не удалось добавить пробег");
  },

  async deleteMileage(id) {
    const response = await apiAuthFetch(`/api/car/mileage/${id}`, { method: "DELETE" });
    return handleResponse(response, "Не удалось удалить пробег");
  },
};
