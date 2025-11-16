import { apiAuthFetch } from "../utils/api.js";

async function jsonOrThrow(res, fallback = "Не удалось загрузить настройки") {
  if (res.ok) {
    if (res.status === 204) return null;
    return res.json();
  }
  let message = fallback;
  try {
    const data = await res.json();
    if (data?.message) message = data.message;
  } catch {
    // ignore
  }
  const error = new Error(message);
  error.status = res.status;
  throw error;
}

export const integrationSettingsApi = {
  async get() {
    const res = await apiAuthFetch("/api/integration/settings");
    return jsonOrThrow(res, "Не удалось загрузить настройки интеграций");
  },
  async update(payload) {
    const res = await apiAuthFetch("/api/integration/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res, "Не удалось сохранить настройки интеграций");
  },
};
