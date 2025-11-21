import { apiAuthFetch } from "../utils/api.js";

async function jsonOrThrow(res, fallback = "Не удалось выполнить запрос к S3") {
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
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, value);
  });
  const q = query.toString();
  return q ? `?${q}` : "";
}

export const s3Api = {
  async listBuckets() {
    const res = await apiAuthFetch("/api/s3/buckets");
    return jsonOrThrow(res, "Не удалось получить список бакетов");
  },
  async createBucket(name) {
    const res = await apiAuthFetch("/api/s3/buckets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    return jsonOrThrow(res, "Не удалось создать бакет");
  },
  async deleteBucket(name) {
    const res = await apiAuthFetch(`/api/s3/buckets/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
    return jsonOrThrow(res, "Не удалось удалить бакет");
  },
  async listObjects(bucket, prefix = "") {
    const res = await apiAuthFetch(
      `/api/s3/buckets/${encodeURIComponent(bucket)}${buildQuery({ prefix })}`
    );
    return jsonOrThrow(res, "Не удалось загрузить содержимое бакета");
  },
  async createFolder(bucket, path) {
    const res = await apiAuthFetch(`/api/s3/buckets/${encodeURIComponent(bucket)}/folders`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
    return jsonOrThrow(res, "Не удалось создать папку");
  },
  async uploadFile(bucket, file, path = "") {
    const form = new FormData();
    form.append("file", file);
    form.append("path", path);
    const res = await apiAuthFetch(`/api/s3/buckets/${encodeURIComponent(bucket)}/upload`, {
      method: "POST",
      body: form,
    });
    return jsonOrThrow(res, "Не удалось загрузить файл");
  },
  async deleteFile(bucket, key) {
    const res = await apiAuthFetch(`/api/s3/buckets/${encodeURIComponent(bucket)}/file`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    return jsonOrThrow(res, "Не удалось удалить файл");
  },
  async deleteFolder(bucket, prefix) {
    const res = await apiAuthFetch(`/api/s3/buckets/${encodeURIComponent(bucket)}/folder`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefix }),
    });
    return jsonOrThrow(res, "Не удалось удалить папку");
  },
  async makePublic(bucket) {
    const res = await apiAuthFetch(`/api/s3/buckets/${encodeURIComponent(bucket)}/public`, {
      method: "POST",
    });
    return jsonOrThrow(res, "Не удалось сделать бакет публичным");
  },
  async makePrivate(bucket) {
    const res = await apiAuthFetch(`/api/s3/buckets/${encodeURIComponent(bucket)}/public`, {
      method: "DELETE",
    });
    return jsonOrThrow(res, "Не удалось сделать бакет приватным");
  },
};
