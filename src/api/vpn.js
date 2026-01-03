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

export const vpnApi = {
  async getSavedLink() {
    const response = await apiAuthFetch("/api/vpn/saved-link");
    return handleResponse(response, "Не удалось загрузить сохранённую ссылку");
  },

  async saveSavedLink(link) {
    const response = await apiAuthFetch("/api/vpn/saved-link", {
      method: "PUT",
      ...jsonOptions({ link }),
    });
    return handleResponse(response, "Не удалось сохранить ссылку");
  },
};
