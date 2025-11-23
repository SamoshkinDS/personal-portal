import { apiAuthFetch } from "../utils/api.js";

const prefix = "/api/flipper";

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, value);
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

// Categories
export async function listCategories(params = {}) {
  const res = await apiAuthFetch(`${prefix}/categories${buildQuery(params)}`);
  return res.json();
}

export async function getCategoryBySlug(slug) {
  const res = await apiAuthFetch(`${prefix}/categories/slug/${slug}`);
  return res.json();
}

export async function createCategory(payload) {
  const res = await apiAuthFetch(`${prefix}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateCategory(id, payload) {
  const res = await apiAuthFetch(`${prefix}/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteCategory(id) {
  const res = await apiAuthFetch(`${prefix}/categories/${id}`, { method: "DELETE" });
  return res.json();
}

// Firmwares
export async function listFirmwares(params = {}) {
  const res = await apiAuthFetch(`${prefix}/firmwares${buildQuery(params)}`);
  return res.json();
}

export async function getFirmwareBySlug(slug) {
  const res = await apiAuthFetch(`${prefix}/firmwares/slug/${slug}`);
  return res.json();
}

export async function createFirmware(payload) {
  const res = await apiAuthFetch(`${prefix}/firmwares`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateFirmware(id, payload) {
  const res = await apiAuthFetch(`${prefix}/firmwares/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteFirmware(id) {
  const res = await apiAuthFetch(`${prefix}/firmwares/${id}`, { method: "DELETE" });
  return res.json();
}

// Articles
export async function listArticles(params = {}) {
  const res = await apiAuthFetch(`${prefix}/articles${buildQuery(params)}`);
  return res.json();
}

export async function getArticleBySlug(slug) {
  const res = await apiAuthFetch(`${prefix}/articles/slug/${slug}`);
  return res.json();
}

export async function createArticle(payload) {
  const res = await apiAuthFetch(`${prefix}/articles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateArticle(id, payload) {
  const res = await apiAuthFetch(`${prefix}/articles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateArticleStatus(id, status) {
  const res = await apiAuthFetch(`${prefix}/articles/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return res.json();
}

export async function deleteArticle(id) {
  const res = await apiAuthFetch(`${prefix}/articles/${id}`, { method: "DELETE" });
  return res.json();
}

// Modules
export async function listModules(params = {}) {
  const res = await apiAuthFetch(`${prefix}/modules${buildQuery(params)}`);
  return res.json();
}

export async function getModuleBySlug(slug) {
  const res = await apiAuthFetch(`${prefix}/modules/slug/${slug}`);
  return res.json();
}

export async function createModule(payload) {
  const res = await apiAuthFetch(`${prefix}/modules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateModule(id, payload) {
  const res = await apiAuthFetch(`${prefix}/modules/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteModule(id) {
  const res = await apiAuthFetch(`${prefix}/modules/${id}`, { method: "DELETE" });
  return res.json();
}

// Queue
export async function listQueue(params = {}) {
  const res = await apiAuthFetch(`${prefix}/queue${buildQuery(params)}`);
  return res.json();
}

export async function createQueueTask(payload) {
  const res = await apiAuthFetch(`${prefix}/queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateQueueTask(id, payload) {
  const res = await apiAuthFetch(`${prefix}/queue/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteQueueTask(id) {
  const res = await apiAuthFetch(`${prefix}/queue/${id}`, { method: "DELETE" });
  return res.json();
}
