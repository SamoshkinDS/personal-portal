// encoding: utf-8
// Centralized API base and helper for fetch

export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  'http://localhost:4000';

export function apiUrl(path) {
  if (!path) return API_BASE_URL;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
}

export function apiFetch(path, options = {}) {
  return fetch(apiUrl(path), options);
}

