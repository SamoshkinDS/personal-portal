import { apiAuthFetch } from "../utils/api.js";

const DEFAULT_ERROR = "Не удалось выполнить запрос к растениям";

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

export const plantsApi = {
  async list(params = {}) {
    const res = await apiAuthFetch(`/api/plants${buildQuery(params)}`);
    return jsonOrThrow(res, "Не удалось загрузить каталог растений");
  },
  async remove(id) {
    const res = await apiAuthFetch(`/api/plants/${id}`, { method: "DELETE" });
    return jsonOrThrow(res, "Не удалось удалить растение");
  },
  async meta() {
    const res = await apiAuthFetch("/api/plants/meta");
    return jsonOrThrow(res, "Не удалось загрузить справочники");
  },
  async detail(identifier) {
    const slug = String(identifier || "").trim();
    const res = await apiAuthFetch(`/api/plants/${encodeURIComponent(slug)}`);
    return jsonOrThrow(res, "Не удалось загрузить карточку растения");
  },
  async create(payload) {
    const res = await apiAuthFetch("/api/plants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res, "Не удалось создать растение");
  },
  async update(id, payload) {
    const res = await apiAuthFetch(`/api/plants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res, "Не удалось обновить растение");
  },
  async uploadMainImage(id, file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiAuthFetch(`/api/plants/${id}/image/main`, {
      method: "POST",
      body: formData,
    });
    return jsonOrThrow(res, "Не удалось загрузить главное фото");
  },
  async uploadGallery(id, files) {
    const list = Array.isArray(files) ? files : Array.from(files || []);
    const formData = new FormData();
    list.forEach((file) => formData.append("files", file));
    const res = await apiAuthFetch(`/api/plants/${id}/image/gallery`, {
      method: "POST",
      body: formData,
    });
    return jsonOrThrow(res, "Не удалось загрузить фото галереи");
  },
  async deleteGalleryImage(id, imageId) {
    const res = await apiAuthFetch(
      `/api/plants/${id}/image/gallery/${encodeURIComponent(imageId)}`,
      {
        method: "DELETE",
      }
    );
    return jsonOrThrow(res, "Не удалось удалить фото");
  },
  async reorderGallery(id, order) {
    const res = await apiAuthFetch(`/api/plants/${id}/image/gallery/order`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    return jsonOrThrow(res, "Не удалось изменить порядок галереи");
  },
  async saveArticle(id, article) {
    const res = await apiAuthFetch(`/api/plants/${id}/article`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(article),
    });
    return jsonOrThrow(res, "Не удалось сохранить статью");
  },
  async triggerArticleGeneration(id) {
    const res = await apiAuthFetch(`/api/plants/${id}/article/generate`, {
      method: "POST",
    });
    return jsonOrThrow(res, "Не удалось отправить запрос в n8n");
  },
  async clone(id) {
    const res = await apiAuthFetch(`/api/plants/${id}/clone`, { method: "POST" });
    return jsonOrThrow(res, "Не удалось создать копию растения");
  },
  async listTags() {
    const res = await apiAuthFetch("/api/plants/tags");
    return jsonOrThrow(res, "Не удалось загрузить теги");
  },
  async createTag(name) {
    const res = await apiAuthFetch("/api/plants/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    return jsonOrThrow(res, "Не удалось создать тег");
  },
  async deleteTag(id) {
    const res = await apiAuthFetch(`/api/plants/tags/${id}`, {
      method: "DELETE",
    });
    return jsonOrThrow(res, "Не удалось удалить тег");
  },
  async listDict(dict) {
    const res = await apiAuthFetch(`/api/plants/dicts/${encodeURIComponent(dict)}`);
    return jsonOrThrow(res, "Не удалось загрузить справочник");
  },
  async createDict(dict, name) {
    const res = await apiAuthFetch(`/api/plants/dicts/${encodeURIComponent(dict)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    return jsonOrThrow(res, "Не удалось создать значение");
  },
  async deleteDict(dict, id) {
    const res = await apiAuthFetch(`/api/plants/dicts/${encodeURIComponent(dict)}/${id}`, {
      method: "DELETE",
    });
    return jsonOrThrow(res, "Не удалось удалить значение");
  },
  async getSettings() {
    const res = await apiAuthFetch("/api/plants/settings");
    return jsonOrThrow(res, "Не удалось загрузить настройки растений");
  },
  async saveSettings(payload) {
    const res = await apiAuthFetch("/api/plants/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res, "Не удалось сохранить настройки растений");
  },
};
