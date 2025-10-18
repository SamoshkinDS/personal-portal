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

// Auth-aware fetch that attaches Bearer token from localStorage if present
export function apiAuthFetch(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(apiUrl(path), { ...options, headers });
}
