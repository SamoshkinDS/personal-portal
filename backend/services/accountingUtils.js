import { annuityPayment, annuityBalance, monthsBetween, daysLeft } from "../lib/finance.js";

export const BASE_CURRENCY = (process.env.ACCOUNTING_BASE_CURRENCY || "RUB").toUpperCase();

export function isValidUuid(value) {
  return typeof value === "string" && /^[0-9a-fA-F-]{36}$/.test(value);
}

export function startOfDay(input = new Date()) {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function clampDay(day) {
  const n = Number(day);
  if (!Number.isFinite(n)) return 1;
  return Math.min(Math.max(1, Math.round(n)), 28);
}

export function computeNextDueDate(payment, reference = new Date()) {
  const today = startOfDay(reference);
  const type = payment?.type;
  if (!type) return null;
  if (type === "subscription" && payment.renewal_date) {
    return startOfDay(payment.renewal_date);
  }
  const day = (() => {
    if (type === "utilities") return 1;
    if (type === "mortgage" || type === "loan") {
      return clampDay(payment.day_of_month ?? payment.billing_day ?? 1);
    }
    return clampDay(payment.billing_day ?? 1);
  })();
  let candidate = new Date(today.getFullYear(), today.getMonth(), day);
  if (candidate < today) {
    candidate = new Date(today.getFullYear(), today.getMonth() + 1, day);
  }
  return candidate;
}

function roundMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

export function attachPaymentComputedFields(payment, reference = new Date()) {
  const nextDue = computeNextDueDate(payment, reference);
  const nextDueIso = nextDue ? formatDate(nextDue) : payment.renewal_date ? formatDate(payment.renewal_date) : null;
  const days = nextDueIso ? daysLeft(nextDueIso, reference) : null;
  let annuity = null;
  let balance = null;
  if (payment?.type === "mortgage" || payment?.type === "loan") {
    const P = Number(payment.principal_total) || 0;
    const rate = Number(payment.interest_rate_apy) || 0;
    const term = Number(payment.term_months) || 0;
    const monthsPaid = payment.start_date ? monthsBetween(payment.start_date, reference) : 0;
    annuity = roundMoney(annuityPayment(P, rate, term));
    balance = roundMoney(annuityBalance(P, rate, term, monthsPaid));
  }
  return {
    ...payment,
    next_due_date: nextDueIso,
    days_left: days,
    annuity_payment: annuity,
    outstanding_balance: balance,
  };
}

export function shiftIncomeNextDate(currentDate, periodicity, nDays = null) {
  if (!currentDate) return null;
  const date = startOfDay(currentDate);
  if (periodicity === "monthly") {
    date.setMonth(date.getMonth() + 1);
  } else if (periodicity === "quarterly") {
    date.setMonth(date.getMonth() + 3);
  } else {
    const days = Number(nDays) || 0;
    date.setDate(date.getDate() + Math.max(1, days));
  }
  return formatDate(date);
}

export function getMonthRange(monthParam) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map((v) => Number(v));
    if (!Number.isNaN(y) && !Number.isNaN(m)) {
      year = y;
      month = m - 1;
    }
  }
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  return { start: formatDate(start), end: formatDate(end) };
}

export function advanceIncomeDate(currentDate, periodicity, nDays = null) {
  const next = shiftIncomeNextDate(currentDate, periodicity, nDays);
  return next ? startOfDay(next) : null;
}
