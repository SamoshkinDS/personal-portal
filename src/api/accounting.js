// encoding: utf-8
import { apiAuthFetch } from "../utils/api.js";

async function request(path, { method = "GET", body, headers, skipJson } = {}) {
  const res = await apiAuthFetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let message = "Запрос не выполнен";
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (skipJson || res.status === 204) return null;
  return res.json();
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

export const accountingApi = {
  getDashboard: (month) => request(`/api/accounting/dashboard${buildQuery({ month })}`),
  getDashboardPreferences: () => request("/api/accounting/settings/dashboard"),
  updateDashboardPreferences: (payload) =>
    request("/api/accounting/settings/dashboard", { method: "PATCH", body: payload }),

  listPayments: (params = {}) => request(`/api/accounting/payments${buildQuery(params)}`),
  getPayment: (id) => request(`/api/accounting/payments/${id}`),
  createPayment: (payload) => request("/api/accounting/payments", { method: "POST", body: payload }),
  updatePayment: (id, payload) =>
    request(`/api/accounting/payments/${id}`, { method: "PATCH", body: payload }),
  deletePayment: (id) => request(`/api/accounting/payments/${id}`, { method: "DELETE" }),
  getPaymentHistory: (id) => request(`/api/accounting/payments/${id}/history`),

  listTransactions: (params = {}) =>
    request(`/api/accounting/transactions${buildQuery(params)}`),
  createTransaction: (payload) =>
    request("/api/accounting/transactions", { method: "POST", body: payload }),
  updateTransaction: (id, payload) =>
    request(`/api/accounting/transactions/${id}`, { method: "PATCH", body: payload }),
  deleteTransaction: (id) =>
    request(`/api/accounting/transactions/${id}`, { method: "DELETE" }),
  importTransactions: () =>
    request("/api/accounting/transactions/import", { method: "POST", body: {} }),

  listCategories: () => request("/api/accounting/categories"),
  createCategory: (payload) =>
    request("/api/accounting/categories", { method: "POST", body: payload }),
  updateCategory: (id, payload) =>
    request(`/api/accounting/categories/${id}`, { method: "PATCH", body: payload }),
  deleteCategory: (id) =>
    request(`/api/accounting/categories/${id}`, { method: "DELETE" }),

  listIncomes: () => request("/api/accounting/incomes"),
  createIncome: (payload) => request("/api/accounting/incomes", { method: "POST", body: payload }),
  updateIncome: (id, payload) =>
    request(`/api/accounting/incomes/${id}`, { method: "PATCH", body: payload }),
  deleteIncome: (id) => request(`/api/accounting/incomes/${id}`, { method: "DELETE" }),
  getIncomeForecast: (period = "month") =>
    request(`/api/accounting/incomes/forecast${buildQuery({ period })}`),

  listAccounts: () => request("/api/accounting/accounts"),
  createAccount: (payload) =>
    request("/api/accounting/accounts", { method: "POST", body: payload }),
  updateAccount: (id, payload) =>
    request(`/api/accounting/accounts/${id}`, { method: "PATCH", body: payload }),
  deleteAccount: (id) => request(`/api/accounting/accounts/${id}`, { method: "DELETE" }),

  listDebts: () => request("/api/accounting/debts"),
  getDebt: (id) => request(`/api/accounting/debts/${id}`),
  createDebt: (payload) => request("/api/accounting/debts", { method: "POST", body: payload }),
  updateDebt: (id, payload) =>
    request(`/api/accounting/debts/${id}`, { method: "PATCH", body: payload }),
  deleteDebt: (id) => request(`/api/accounting/debts/${id}`, { method: "DELETE" }),
  addDebtPayment: (id, payload, options = {}) =>
    request(`/api/accounting/debts/${id}/payments`, {
      method: "POST",
      body: { ...payload, dry_run: options.preview },
    }),
};


