import { apiAuthFetch } from "../utils/api.js";

const DEFAULT_ERROR = "Не удалось выполнить запрос по инвентарю";

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

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, value);
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function buildFormData(payload = {}) {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === "extra_fields" && typeof value === "object") {
      form.append("extra_fields", JSON.stringify(value));
      return;
    }
    if (key === "photo") {
      if (value instanceof File || value instanceof Blob) {
        form.append("photo", value);
      }
      return;
    }
    form.append(key, value);
  });
  return form;
}

export const plantToolsApi = {
  async listCategories({ includeInactive = false } = {}) {
    const qs = includeInactive ? buildQuery({ all: 1 }) : "";
    const res = await apiAuthFetch(`/api/plants/tools/categories${qs}`);
    return jsonOrThrow(res, "Не удалось загрузить категории инвентаря");
  },
  async updateCategory(id, payload) {
    const res = await apiAuthFetch(`/api/plants/tools/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res, "Не удалось сохранить категорию");
  },
  async getCategory(slug) {
    const res = await apiAuthFetch(`/api/plants/tools/${encodeURIComponent(slug)}`);
    return jsonOrThrow(res, "Не удалось загрузить раздел");
  },
  async createItem(payload) {
    const res = await apiAuthFetch("/api/plants/tools/items", {
      method: "POST",
      body: buildFormData(payload),
    });
    return jsonOrThrow(res, "Не удалось создать элемент");
  },
  async updateItem(id, payload) {
    const res = await apiAuthFetch(`/api/plants/tools/items/${id}`, {
      method: "PATCH",
      body: buildFormData(payload),
    });
    return jsonOrThrow(res, "Не удалось сохранить элемент");
  },
  async deleteItem(id) {
    const res = await apiAuthFetch(`/api/plants/tools/items/${id}`, { method: "DELETE" });
    return jsonOrThrow(res, "Не удалось удалить элемент");
  },
};
