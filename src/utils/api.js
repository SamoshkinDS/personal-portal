// encoding: utf-8
// Centralized API base and helper for fetch

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function apiUrl(path) {
  if (!path) return API_BASE_URL;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
}

export function apiFetch(path, options = {}) {
  return fetch(apiUrl(path), options);
}
