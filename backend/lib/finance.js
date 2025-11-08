export function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function annuityPayment(principal, apy, termMonths) {
  const P = toNumber(principal);
  const rate = toNumber(apy);
  const n = Math.max(1, Math.round(toNumber(termMonths, 0)));
  if (n <= 0 || P <= 0) return 0;
  const r = rate / 12 / 100;
  if (!Number.isFinite(r) || r === 0) {
    return P / n;
  }
  const payment = P * r / (1 - Math.pow(1 + r, -n));
  return Number.isFinite(payment) ? payment : 0;
}

export function annuityBalance(principal, apy, termMonths, paidMonths) {
  const P = toNumber(principal);
  const rate = toNumber(apy);
  const n = Math.max(1, Math.round(toNumber(termMonths, 0)));
  const k = Math.max(0, Math.round(toNumber(paidMonths, 0)));
  if (n <= 0 || P <= 0) return 0;
  if (k >= n) return 0;
  const r = rate / 12 / 100;
  if (!Number.isFinite(r) || r === 0) {
    return Math.max(P - (P / n) * k, 0);
  }
  const A = annuityPayment(P, rate, n);
  const balance = P * Math.pow(1 + r, k) - A * ((Math.pow(1 + r, k) - 1) / r);
  return Number.isFinite(balance) ? Math.max(balance, 0) : 0;
}

export function monthsBetween(startDate, targetDate = new Date()) {
  if (!startDate) return 0;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return 0;
  const target = new Date(targetDate);
  const years = target.getFullYear() - start.getFullYear();
  const months = target.getMonth() - start.getMonth();
  const total = years * 12 + months;
  return total < 0 ? 0 : total;
}

export function daysLeft(dateStr, reference = new Date()) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const from = new Date(reference);
  target.setHours(0, 0, 0, 0);
  from.setHours(0, 0, 0, 0);
  return Math.ceil((target - from) / (1000 * 60 * 60 * 24));
}
