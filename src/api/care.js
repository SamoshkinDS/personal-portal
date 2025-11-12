import { apiAuthFetch } from "../utils/api.js";

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      if (!value.length) return;
      search.set(key, value.join(","));
      return;
    }
    search.set(key, value);
  });
  const queryString = search.toString();
  return queryString ? `?${queryString}` : "";
}

async function jsonOrThrow(res, fallback) {
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

function createCareApi(resource, label) {
  const base = `/api/${resource}`;
  const noun = label || resource;
  return {
    async list(params = {}) {
      const res = await apiAuthFetch(`${base}${buildQuery(params)}`);
      return jsonOrThrow(res, `Не удалось загрузить ${noun}`);
    },
    async detail(slug) {
      const safeSlug = encodeURIComponent(String(slug || "").trim());
      const res = await apiAuthFetch(`${base}/${safeSlug}`);
      return jsonOrThrow(res, `Не удалось загрузить ${noun}`);
    },
    async create(payload) {
      const res = await apiAuthFetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return jsonOrThrow(res, `Не удалось создать ${noun}`);
    },
    async update(id, payload) {
      const res = await apiAuthFetch(`${base}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return jsonOrThrow(res, `Не удалось обновить ${noun}`);
    },
    async remove(id) {
      const res = await apiAuthFetch(`${base}/${id}`, { method: "DELETE" });
      return jsonOrThrow(res, `Не удалось удалить ${noun}`);
    },
  };
}

export const pestsApi = createCareApi("pests", "вредителей");
export const diseasesApi = createCareApi("diseases", "заболевания");
export const medicinesApi = createCareApi("medicines", "лекарства");

export const problemsApi = {
  async list(params = {}) {
    const res = await apiAuthFetch(`/api/problems${buildQuery(params)}`);
    return jsonOrThrow(res, "Не удалось загрузить список проблем");
  },
};

pestsApi.addMedicines = async function addMedicines(id, ids = []) {
  const res = await apiAuthFetch(`/api/pests/${id}/medicines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  return jsonOrThrow(res, "Не удалось привязать лекарства");
};

pestsApi.removeMedicine = async function removeMedicine(id, medicineId) {
  const res = await apiAuthFetch(`/api/pests/${id}/medicines/${medicineId}`, { method: "DELETE" });
  return jsonOrThrow(res, "Не удалось удалить связь");
};

diseasesApi.addMedicines = async function addMedicines(id, ids = []) {
  const res = await apiAuthFetch(`/api/diseases/${id}/medicines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  return jsonOrThrow(res, "Не удалось привязать лекарства");
};

diseasesApi.removeMedicine = async function removeMedicine(id, medicineId) {
  const res = await apiAuthFetch(`/api/diseases/${id}/medicines/${medicineId}`, { method: "DELETE" });
  return jsonOrThrow(res, "Не удалось удалить связь");
};
