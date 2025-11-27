import { apiAuthFetch } from "../utils/api.js";

async function request(path, options = {}, fallback = "Не удалось выполнить запрос") {
  const res = await apiAuthFetch(path, {
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    // ignore
  }
  if (!res.ok || payload?.success === false) {
    const message = payload?.error || payload?.message || fallback;
    throw new Error(message);
  }
  return payload?.data ?? payload;
}

export const workspaceApi = {
  getSettings() {
    return request("/api/workspace/settings", {}, "Не удалось загрузить настройки Workspace");
  },
  saveSettings(payload) {
    return request(
      "/api/workspace/settings",
      { method: "PUT", body: payload || {} },
      "Не удалось сохранить настройки Workspace"
    );
  },
};
