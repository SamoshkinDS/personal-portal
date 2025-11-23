import express from "express";
import { pool } from "../db/connect.js";
import { authRequired, requirePermission } from "../middleware/auth.js";
import {
  BASE_CURRENCY,
  advanceIncomeDate,
  attachPaymentComputedFields,
  formatDate,
  getMonthRange,
  isValidUuid,
  startOfDay,
} from "../services/accountingUtils.js";

const router = express.Router();

const withView = [authRequired, requirePermission(["accounting:view"])];
const withEdit = [authRequired, requirePermission(["accounting:edit"])];
const withAdmin = [authRequired, requirePermission(["accounting:admin"])];

const PAYMENT_TYPES = new Set([
  "mortgage",
  "loan",
  "utilities",
  "parking_rent",
  "mobile",
  "subscription",
]);
const CATEGORY_TYPES = new Set(["expense", "income"]);
const ACCOUNT_TYPES = new Set(["card", "cash", "deposit", "other"]);
const BILLING_PERIODS = new Set(["monthly", "weekly", "yearly", "custom"]);
const TRANSACTION_SORTS = {
  date_desc: "t.transaction_date DESC, t.created_at DESC",
  date_asc: "t.transaction_date ASC, t.created_at ASC",
  amount_desc: "t.amount_account DESC NULLS LAST",
  amount_asc: "t.amount_account ASC NULLS LAST",
  created_desc: "t.created_at DESC",
};
const PAYMENT_BOOLEAN_FIELDS = new Set(["is_active", "is_annuity", "is_indefinite"]);
const SYSTEM_CATEGORY_SEEDS = [
  { name: "Коммунальные", type: "expense", color: "#f97316" },
  { name: "Ипотека", type: "expense", color: "#f97316" },
  { name: "Кредит", type: "expense", color: "#f97316" },
  { name: "Связь", type: "expense", color: "#0ea5e9" },
  { name: "Подписки", type: "expense", color: "#a855f7" },
  { name: "Зарплата", type: "income", color: "#10b981" },
  { name: "Разовый доход", type: "income", color: "#34d399" },
  { name: "Поддержка семьи", type: "income", color: "#60a5fa" },
  { name: "Возврат средств", type: "income", color: "#fbbf24" },
];

const DATE_REGEXP = /^\d{4}-\d{2}-\d{2}$/;
const UUID_ERROR = { message: "Invalid identifier" };
const MAX_PAGE_SIZE = 100;
const DEBT_DIRECTIONS = new Set(["borrowed", "lent"]);

const parseBool = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    return ["1", "true", "yes", "on"].includes(value.toLowerCase());
  }
  return false;
};

const toAmount = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.abs(num);
};

const round2 = (value) => Math.round(value * 100) / 100;

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(from, to) {
  const start = startOfDay(from).getTime();
  const end = startOfDay(to).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.round((end - start) / DAY_MS));
}

function pickAllowed(payload, allowed) {
  const result = {};
  for (const field of allowed) {
    if (field in payload) {
      result[field] = payload[field];
    }
  }
  return result;
}

async function ensureDashboardPreferences(userId) {
  const existing = await pool.query(
    `SELECT * FROM dashboard_preferences WHERE user_id = $1`,
    [userId]
  );
  if (existing.rows.length > 0) return existing.rows[0];
  const inserted = await pool.query(
    `INSERT INTO dashboard_preferences (user_id) VALUES ($1) RETURNING *`,
    [userId]
  );
  return inserted.rows[0];
}

async function getAccountById(userId, accountId) {
  if (!accountId || !isValidUuid(accountId)) return null;
  const q = await pool.query(`SELECT * FROM accounts WHERE id = $1 AND user_id = $2`, [
    accountId,
    userId,
  ]);
  return q.rows[0] || null;
}

function mapAccountRow(row) {
  const initial = Number(row.initial_balance) || 0;
  const delta = Number(row.delta || 0);
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    currency: row.currency || BASE_CURRENCY,
    initial_balance: round2(initial),
    actual_balance: round2(initial + delta),
    notes: row.notes,
    transactions_count: Number(row.transactions_count) || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function listAccountsWithBalance(userId, accountId = null) {
  const params = [userId];
  let filter = "";
  if (accountId) {
    params.push(accountId);
    filter = "AND a.id = $2";
  }
  const q = await pool.query(
    `
    SELECT
      a.*,
      COALESCE(SUM(
        CASE
          WHEN t.amount_account IS NULL THEN 0
          WHEN t.is_income THEN t.amount_account
          ELSE -t.amount_account
        END
      ), 0) AS delta,
      COUNT(t.id) AS transactions_count
    FROM accounts a
    LEFT JOIN transactions t ON t.account_id = a.id AND t.user_id = a.user_id
    WHERE a.user_id = $1 ${filter}
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `,
    params
  );
  return q.rows.map(mapAccountRow);
}

async function getAccountBalance(userId, accountId) {
  const rows = await listAccountsWithBalance(userId, accountId);
  return rows[0]?.actual_balance ?? null;
}

async function getDebtById(userId, debtId) {
  if (!debtId || !isValidUuid(debtId)) return null;
  const q = await pool.query(
    `SELECT * FROM accounting_debts WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [debtId, userId]
  );
  return q.rows[0] || null;
}

async function listDebtPayments(userId, debtId) {
  const q = await pool.query(
    `SELECT * FROM accounting_debt_payments WHERE user_id = $1 AND debt_id = $2 ORDER BY payment_date ASC, created_at ASC`,
    [userId, debtId]
  );
  return q.rows;
}

function computeDebtState(debt, payments = [], asOfDate = new Date()) {
  const rate = Number(debt?.interest_rate_apy) || 0;
  const sorted = [...payments].sort((a, b) => {
    const aDate = new Date(a.payment_date || a.created_at || 0);
    const bDate = new Date(b.payment_date || b.created_at || 0);
    return aDate - bDate;
  });
  let outstandingPrincipal = Number(debt?.principal_amount) || 0;
  let totalInterestAccrued = 0;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  let cursor = debt?.start_date ? startOfDay(debt.start_date) : startOfDay(new Date());
  const asOf = startOfDay(asOfDate);

  for (const payment of sorted) {
    const payDate = startOfDay(payment.payment_date || payment.created_at || asOf);
    const days = daysBetween(cursor, payDate);
    if (rate > 0 && outstandingPrincipal > 0 && days > 0) {
      totalInterestAccrued += outstandingPrincipal * (rate / 100) * (days / 365);
    }
    const principalPaid = Number(payment.principal_paid) || 0;
    const interestPaid = Number(payment.interest_paid) || 0;
    totalPrincipalPaid += principalPaid;
    totalInterestPaid += interestPaid;
    outstandingPrincipal = Math.max(0, outstandingPrincipal - principalPaid);
    cursor = payDate;
  }

  const tailDays = daysBetween(cursor, asOf);
  if (rate > 0 && outstandingPrincipal > 0 && tailDays > 0) {
    totalInterestAccrued += outstandingPrincipal * (rate / 100) * (tailDays / 365);
  }

  const accruedRounded = round2(totalInterestAccrued);
  const interestDue = Math.max(0, round2(accruedRounded - (Number(totalInterestPaid) || 0)));

  return {
    outstanding_principal: round2(outstandingPrincipal),
    accrued_interest: accruedRounded,
    interest_due: interestDue,
    total_paid: round2(totalPrincipalPaid + totalInterestPaid),
    total_interest_paid: round2(totalInterestPaid),
    last_payment_date: sorted.length ? sorted[sorted.length - 1].payment_date : null,
  };
}

function extendDebtWithSummary(debt, payments = [], asOfDate = new Date()) {
  const summary = computeDebtState(debt, payments, asOfDate);
  return {
    ...debt,
    outstanding_principal: summary.outstanding_principal,
    interest_due: summary.interest_due,
    accrued_interest: summary.accrued_interest,
    total_due: round2(summary.outstanding_principal + summary.interest_due),
    total_paid: summary.total_paid,
    total_interest_paid: summary.total_interest_paid,
    last_payment_date: summary.last_payment_date ? formatDate(summary.last_payment_date) : null,
  };
}

async function getCategory(userId, categoryId) {
  if (!categoryId || !isValidUuid(categoryId)) return null;
  const q = await pool.query(
    `SELECT * FROM categories WHERE id = $1 AND user_id = $2`,
    [categoryId, userId]
  );
  return q.rows[0] || null;
}

async function getPayment(userId, paymentId) {
  if (!paymentId || !isValidUuid(paymentId)) return null;
  const q = await pool.query(
    `SELECT * FROM payments WHERE id = $1 AND user_id = $2`,
    [paymentId, userId]
  );
  return q.rows[0] || null;
}

async function deriveIsIncome(userId, categoryId, fallback = false) {
  if (!categoryId) return fallback;
  const category = await getCategory(userId, categoryId);
  if (!category) throw new Error("CATEGORY_NOT_FOUND");
  return category.type === "income";
}

async function ensureSystemCategoriesForUser(userId) {
  for (const seed of SYSTEM_CATEGORY_SEEDS) {
    await pool.query(
      `INSERT INTO categories (id, user_id, name, type, color_hex, is_system)
       SELECT gen_random_uuid(), $1, $2, $3, $4, TRUE
       WHERE NOT EXISTS (
         SELECT 1 FROM categories WHERE user_id = $1 AND lower(name) = lower($2)
       )`,
      [userId, seed.name, seed.type, seed.color]
    );
  }
}

function buildTransactionResponse(row) {
  return {
    id: row.id,
    transaction_date: row.transaction_date,
    description: row.description,
    category_id: row.category_id,
    category_name: row.category_name,
    category_type: row.category_type,
    payment_id: row.payment_id,
    payment_title: row.payment_title,
    account_id: row.account_id,
    account_name: row.account_name,
    account_type: row.account_type,
    amount_operation: row.amount_operation,
    currency_operation: row.currency_operation,
    amount_account: row.amount_account,
    currency_account: row.currency_account,
    authorization_code: row.authorization_code,
    mcc: row.mcc,
    is_income: row.is_income,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function buildIncomeForecast(userId, period = "month") {
  const q = await pool.query(
    `SELECT id, source_name, amount, currency, periodicity, n_days, next_date
     FROM incomes
     WHERE user_id = $1 AND is_active = TRUE AND (currency = $2 OR currency IS NULL)`,
    [userId, BASE_CURRENCY]
  );
  const today = startOfDay(new Date());
  const horizon = startOfDay(new Date());
  if (period === "year") {
    horizon.setFullYear(horizon.getFullYear() + 1);
  } else {
    horizon.setMonth(horizon.getMonth() + 1);
  }
  const buckets = new Map();
  for (const income of q.rows) {
    if (!income.next_date || !DATE_REGEXP.test(income.next_date)) continue;
    let cursor = startOfDay(income.next_date);
    while (cursor < today) {
      const next = advanceIncomeDate(cursor, income.periodicity, income.n_days);
      if (!next) break;
      cursor = next;
    }
    while (cursor && cursor <= horizon) {
      const bucketKey =
        period === "year"
          ? `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`
          : formatDate(cursor);
      const prev = buckets.get(bucketKey) || 0;
      buckets.set(bucketKey, prev + Number(income.amount || 0));
      const next = advanceIncomeDate(cursor, income.periodicity, income.n_days);
      if (!next) break;
      cursor = next;
    }
  }
  const items = Array.from(buckets.entries())
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .map(([date, amount]) => ({
      date,
      amount: Math.round(amount * 100) / 100,
    }));
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  return {
    total: Math.round(total * 100) / 100,
    items,
  };
}

async function buildDashboard(userId, monthParam) {
  await ensureSystemCategoriesForUser(userId);
  const { start, end } = getMonthRange(monthParam);
  const totalsQ = await pool.query(
    `SELECT
        SUM(CASE WHEN is_income THEN amount_account ELSE 0 END) AS incomes,
        SUM(CASE WHEN NOT is_income THEN amount_account ELSE 0 END) AS expenses
     FROM transactions
     WHERE user_id = $1
       AND transaction_date >= $2::date
       AND transaction_date < $3::date
       AND (currency_account IS NULL OR currency_account = $4)`,
    [userId, start, end, BASE_CURRENCY]
  );
  const pieQ = await pool.query(
    `SELECT c.id, c.name, c.color_hex, SUM(t.amount_account) AS amount
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = $1
       AND t.is_income = FALSE
       AND t.transaction_date >= $2::date
       AND t.transaction_date < $3::date
       AND (t.currency_account IS NULL OR t.currency_account = $4)
     GROUP BY c.id, c.name, c.color_hex
     ORDER BY amount DESC
     LIMIT 8`,
    [userId, start, end, BASE_CURRENCY]
  );
  const paymentsQ = await pool.query(
    `SELECT * FROM payments WHERE user_id = $1 AND is_active = TRUE`,
    [userId]
  );
  const payments = paymentsQ.rows.map((row) => attachPaymentComputedFields(row));
  const upcoming = payments
    .filter((p) => p.days_left !== null && p.days_left >= 0 && p.days_left <= 7)
    .sort((a, b) => (a.days_left ?? 999) - (b.days_left ?? 999))
    .slice(0, 5);
  const subscriptions = payments
    .filter((p) => p.type === "subscription")
    .map((p) => ({
      id: p.id,
      title: p.title,
      renewal_date: p.renewal_date || p.next_due_date,
      amount: p.amount,
      currency: p.currency,
      days_left: p.days_left,
      is_critical: p.days_left !== null && p.days_left < 3,
      service_url: p.service_url,
    }))
    .sort((a, b) => (a.days_left ?? 999) - (b.days_left ?? 999));
  const preferences = await ensureDashboardPreferences(userId);
  const accounts = await listAccountsWithBalance(userId);
  const accountsSummary = {
    total_balance: round2(accounts.reduce((sum, acc) => sum + (acc.actual_balance || 0), 0)),
    items: accounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      type: acc.type,
      currency: acc.currency,
      actual_balance: acc.actual_balance,
    })),
  };
  const forecast = await buildIncomeForecast(userId, "month");
  const totals = totalsQ.rows[0] || { incomes: 0, expenses: 0 };
  return {
    month: start?.slice(0, 7),
    preferences,
    kpis: {
      incomes: Number(totals.incomes) || 0,
      expenses: Number(totals.expenses) || 0,
      balance: (Number(totals.incomes) || 0) - (Number(totals.expenses) || 0),
    },
    pie_by_category: pieQ.rows,
    upcoming_payments: upcoming,
    subscriptions,
    income_forecast: forecast,
    accounts_summary: accountsSummary,
  };
}

function buildPagedResponse(rows, page, limit, total) {
  return {
    items: rows,
    pagination: {
      page,
      limit,
      total,
      has_more: page * limit < total,
    },
  };
}

// Categories
router.get("/debts", ...withView, async (req, res) => {
  try {
    const debtsQ = await pool.query(
      `SELECT * FROM accounting_debts WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    const paymentsQ = await pool.query(
      `SELECT debt_id, payment_date, principal_paid, interest_paid FROM accounting_debt_payments WHERE user_id = $1`,
      [req.user.id]
    );
    const paymentsByDebt = new Map();
    for (const payment of paymentsQ.rows) {
      const arr = paymentsByDebt.get(payment.debt_id) || [];
      arr.push(payment);
      paymentsByDebt.set(payment.debt_id, arr);
    }
    const items = debtsQ.rows.map((debt) =>
      extendDebtWithSummary(debt, paymentsByDebt.get(debt.id) || [], new Date())
    );
    res.json({ items });
  } catch (error) {
    console.error("[accounting] debts list error", error);
    res.status(500).json({ message: "Failed to fetch debts" });
  }
});

router.get("/debts/:id", ...withView, async (req, res) => {
  try {
    if (!isValidUuid(req.params.id)) return res.status(400).json(UUID_ERROR);
    const debt = await getDebtById(req.user.id, req.params.id);
    if (!debt) return res.status(404).json({ message: "Debt not found" });
    const payments = await listDebtPayments(req.user.id, debt.id);
    const debtWithSummary = extendDebtWithSummary(debt, payments, new Date());
    const paymentsForResponse = [...payments].sort(
      (a, b) => new Date(b.payment_date || b.created_at) - new Date(a.payment_date || a.created_at)
    );
    res.json({ debt: debtWithSummary, payments: paymentsForResponse });
  } catch (error) {
    console.error("[accounting] debt view error", error);
    res.status(500).json({ message: "Failed to fetch debt" });
  }
});

router.post("/debts", ...withEdit, async (req, res) => {
  try {
    const payload = pickAllowed(req.body || {}, [
      "title",
      "direction",
      "counterparty",
      "bank_name",
      "description",
      "principal_amount",
      "currency",
      "interest_rate_apy",
      "start_date",
      "due_date",
      "is_closed",
    ]);
    const title = (payload.title || "").trim();
    if (!title) return res.status(400).json({ message: "Title is required" });
    if (!DEBT_DIRECTIONS.has(payload.direction)) {
      return res.status(400).json({ message: "Invalid direction" });
    }
    const counterparty = (payload.counterparty || "").trim();
    if (!counterparty) return res.status(400).json({ message: "Counterparty is required" });
    const principal = toAmount(payload.principal_amount);
    if (!principal) return res.status(400).json({ message: "principal_amount is required" });
    let interestRate = null;
    if (payload.interest_rate_apy !== undefined && payload.interest_rate_apy !== null && payload.interest_rate_apy !== "") {
      interestRate = Number(payload.interest_rate_apy);
      if (!Number.isFinite(interestRate)) {
        return res.status(400).json({ message: "interest_rate_apy must be numeric" });
      }
    }
    const startDate = payload.start_date || formatDate(new Date());
    if (!DATE_REGEXP.test(startDate)) {
      return res.status(400).json({ message: "start_date must be YYYY-MM-DD" });
    }
    if (payload.due_date && !DATE_REGEXP.test(payload.due_date)) {
      return res.status(400).json({ message: "due_date must be YYYY-MM-DD" });
    }
    const insert = await pool.query(
      `INSERT INTO accounting_debts (
         user_id, title, direction, counterparty, bank_name, description,
         principal_amount, currency, interest_rate_apy, start_date, due_date, is_closed
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
       )
       RETURNING *`,
      [
        req.user.id,
        title,
        payload.direction,
        counterparty,
        payload.bank_name || null,
        payload.description || null,
        principal,
        (payload.currency || BASE_CURRENCY).toUpperCase(),
        interestRate,
        startDate,
        payload.due_date || null,
        parseBool(payload.is_closed),
      ]
    );
    const debt = extendDebtWithSummary(insert.rows[0], [], new Date());
    res.status(201).json({ debt });
  } catch (error) {
    console.error("[accounting] create debt error", error);
    res.status(500).json({ message: "Failed to create debt" });
  }
});

router.patch("/debts/:id", ...withEdit, async (req, res) => {
  try {
    if (!isValidUuid(req.params.id)) return res.status(400).json(UUID_ERROR);
    const existing = await getDebtById(req.user.id, req.params.id);
    if (!existing) return res.status(404).json({ message: "Debt not found" });
    const payload = pickAllowed(req.body || {}, [
      "title",
      "direction",
      "counterparty",
      "bank_name",
      "description",
      "principal_amount",
      "currency",
      "interest_rate_apy",
      "start_date",
      "due_date",
      "is_closed",
    ]);
    if (payload.start_date && !DATE_REGEXP.test(payload.start_date)) {
      return res.status(400).json({ message: "start_date must be YYYY-MM-DD" });
    }
    if (payload.due_date && !DATE_REGEXP.test(payload.due_date)) {
      return res.status(400).json({ message: "due_date must be YYYY-MM-DD" });
    }
    const updates = [];
    const values = [];
    let idx = 1;
    for (const [key, value] of Object.entries(payload)) {
      if (key === "title") {
        const trimmed = String(value || "").trim();
        if (!trimmed) return res.status(400).json({ message: "Title cannot be empty" });
        updates.push(`title = $${idx++}`);
        values.push(trimmed);
        continue;
      }
      if (key === "direction") {
        if (!DEBT_DIRECTIONS.has(value)) return res.status(400).json({ message: "Invalid direction" });
        updates.push(`direction = $${idx++}`);
        values.push(value);
        continue;
      }
      if (key === "counterparty") {
        const trimmed = String(value || "").trim();
        if (!trimmed) return res.status(400).json({ message: "Counterparty cannot be empty" });
        updates.push(`counterparty = $${idx++}`);
        values.push(trimmed);
        continue;
      }
      if (key === "principal_amount") {
        const principal = toAmount(value);
        if (!principal) return res.status(400).json({ message: "principal_amount must be > 0" });
        updates.push(`principal_amount = $${idx++}`);
        values.push(principal);
        continue;
      }
      if (key === "currency" && value) {
        updates.push(`currency = $${idx++}`);
        values.push(String(value).toUpperCase());
        continue;
      }
      if (key === "interest_rate_apy") {
        let rate = null;
        if (value !== undefined && value !== null && value !== "") {
          rate = Number(value);
          if (!Number.isFinite(rate)) {
            return res.status(400).json({ message: "interest_rate_apy must be numeric" });
          }
        }
        updates.push(`interest_rate_apy = $${idx++}`);
        values.push(rate);
        continue;
      }
      if (key === "is_closed") {
        updates.push(`is_closed = $${idx++}`);
        values.push(parseBool(value));
        continue;
      }
      updates.push(`${key} = $${idx++}`);
      values.push(value ?? null);
    }
    if (updates.length === 0) return res.status(400).json({ message: "No fields to update" });
    values.push(req.user.id);
    values.push(req.params.id);
    const updated = await pool.query(
      `UPDATE accounting_debts
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE user_id = $${idx++} AND id = $${idx}
       RETURNING *`,
      values
    );
    if (updated.rows.length === 0) return res.status(404).json({ message: "Debt not found" });
    const payments = await listDebtPayments(req.user.id, req.params.id);
    const debt = extendDebtWithSummary(updated.rows[0], payments, new Date());
    res.json({ debt });
  } catch (error) {
    console.error("[accounting] update debt error", error);
    res.status(500).json({ message: "Failed to update debt" });
  }
});

router.delete("/debts/:id", ...withEdit, async (req, res) => {
  try {
    if (!isValidUuid(req.params.id)) return res.status(400).json(UUID_ERROR);
    const deleted = await pool.query(
      `DELETE FROM accounting_debts WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (deleted.rowCount === 0) return res.status(404).json({ message: "Debt not found" });
    res.json({ message: "Debt deleted" });
  } catch (error) {
    console.error("[accounting] delete debt error", error);
    res.status(500).json({ message: "Failed to delete debt" });
  }
});

router.post("/debts/:id/payments", ...withEdit, async (req, res) => {
  try {
    if (!isValidUuid(req.params.id)) return res.status(400).json(UUID_ERROR);
    const debt = await getDebtById(req.user.id, req.params.id);
    if (!debt) return res.status(404).json({ message: "Debt not found" });
    const paymentDate = req.body?.payment_date || formatDate(new Date());
    if (!DATE_REGEXP.test(paymentDate)) {
      return res.status(400).json({ message: "payment_date must be YYYY-MM-DD" });
    }
    const principalRaw = toAmount(req.body?.principal_amount);
    if (!principalRaw) return res.status(400).json({ message: "principal_amount is required" });
    const comment = req.body?.comment || null;
    const dryRun = parseBool(req.body?.dry_run);
    const payments = await listDebtPayments(req.user.id, debt.id);
    const baseState = computeDebtState(debt, payments, paymentDate);
    const principalPaid = Math.min(principalRaw, baseState.outstanding_principal);
    const interestComponent =
      Number(debt.interest_rate_apy) > 0 ? baseState.interest_due : 0;
    const amountTotal = round2(principalPaid + interestComponent);
    const simulatedPayment = {
      payment_date: paymentDate,
      principal_paid: principalPaid,
      interest_paid: interestComponent,
      amount_total: amountTotal,
      comment,
      debt_id: debt.id,
      user_id: req.user.id,
    };

    if (dryRun) {
      const previewState = computeDebtState(debt, [...payments, simulatedPayment], paymentDate);
      return res.json({
        preview: simulatedPayment,
        summary: {
          ...previewState,
          total_due: round2(previewState.outstanding_principal + previewState.interest_due),
        },
      });
    }

    const insert = await pool.query(
      `INSERT INTO accounting_debt_payments (debt_id, user_id, payment_date, principal_paid, interest_paid, amount_total, comment)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [debt.id, req.user.id, paymentDate, principalPaid, interestComponent, amountTotal, comment]
    );
    const updatedPayments = [...payments, insert.rows[0]];
    const stateAfter = computeDebtState(debt, updatedPayments, paymentDate);
    const shouldClose = stateAfter.outstanding_principal <= 0.01 && stateAfter.interest_due <= 0.01;
    if (shouldClose !== debt.is_closed) {
      await pool.query(
        `UPDATE accounting_debts SET is_closed = $1, updated_at = NOW() WHERE id = $2`,
        [shouldClose, debt.id]
      );
    }
    res.status(201).json({
      payment: insert.rows[0],
      summary: {
        ...stateAfter,
        total_due: round2(stateAfter.outstanding_principal + stateAfter.interest_due),
      },
    });
  } catch (error) {
    console.error("[accounting] add debt payment error", error);
    res.status(500).json({ message: "Failed to add payment" });
  }
});

router.get("/categories", ...withView, async (req, res) => {
  try {
    await ensureSystemCategoriesForUser(req.user.id);
    const rows = await pool.query(
      `SELECT * FROM categories WHERE user_id = $1 ORDER BY is_system DESC, name ASC`,
      [req.user.id]
    );
    res.json({ items: rows.rows });
  } catch (error) {
    console.error("[accounting] categories list error", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

router.post("/categories", ...withEdit, async (req, res) => {
  try {
    const payload = pickAllowed(req.body || {}, ["name", "type", "color_hex", "mcc_mask"]);
    const name = (payload.name || "").trim();
    if (!name) return res.status(400).json({ message: "Name is required" });
    if (!CATEGORY_TYPES.has(payload.type)) {
      return res.status(400).json({ message: "Invalid category type" });
    }
    const insert = await pool.query(
      `INSERT INTO categories (user_id, name, type, color_hex, mcc_mask)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, name, payload.type, payload.color_hex || null, payload.mcc_mask || null]
    );
    res.status(201).json({ category: insert.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Category with this name already exists" });
    }
    console.error("[accounting] create category error", error);
    res.status(500).json({ message: "Failed to create category" });
  }
});

router.patch("/categories/:id", ...withEdit, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) return res.status(400).json(UUID_ERROR);
    const category = await getCategory(req.user.id, id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    if (category.is_system && req.body?.name !== undefined) {
      return res.status(400).json({ message: "Системные категории нельзя переименовывать" });
    }
    const updates = pickAllowed(req.body || {}, ["name", "color_hex", "mcc_mask"]);
    if (updates.name !== undefined) {
      const trimmed = String(updates.name || "").trim();
      if (!trimmed) return res.status(400).json({ message: "Name cannot be empty" });
      updates.name = trimmed;
    }
    const fields = [];
    const values = [];
    if (payload.account_id !== undefined) {
      if (payload.account_id === null || payload.account_id === "") {
        payload.account_id = null;
      } else {
        if (!isValidUuid(payload.account_id)) {
          return res.status(400).json({ message: "Invalid account" });
        }
        const account = await getAccountById(req.user.id, payload.account_id);
        if (!account) return res.status(400).json({ message: "Account not found" });
      }
    }
    let idx = 1;
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${idx++}`);
      values.push(key === "name" ? String(value || "").trim() : value ?? null);
    }
    if (fields.length === 0) return res.json({ category });
    values.push(req.user.id);
    values.push(id);
    const updated = await pool.query(
      `UPDATE categories SET ${fields.join(", ")}, updated_at = NOW()
       WHERE user_id = $${idx++} AND id = $${idx}
       RETURNING *`,
      values
    );
    res.json({ category: updated.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Category with this name already exists" });
    }
    console.error("[accounting] update category error", error);
    res.status(500).json({ message: "Failed to update category" });
  }
});

router.delete("/categories/:id", ...withEdit, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) return res.status(400).json(UUID_ERROR);
    const category = await getCategory(req.user.id, id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    if (category.is_system) {
      return res.status(400).json({ message: "Нельзя удалить системную категорию" });
    }
    await pool.query(`DELETE FROM categories WHERE id = $1 AND user_id = $2`, [id, req.user.id]);
    res.json({ message: "Category deleted" });
  } catch (error) {
    console.error("[accounting] delete category error", error);
    res.status(500).json({ message: "Failed to delete category" });
  }
});

// Payments
router.get("/payments", ...withView, async (req, res) => {
  try {
    const filters = ["user_id = $1"];
    const values = [req.user.id];
    if (req.query.type && PAYMENT_TYPES.has(req.query.type)) {
      values.push(req.query.type);
      filters.push(`type = $${values.length}`);
    }
    if (req.query.active !== undefined) {
      values.push(parseBool(req.query.active));
      filters.push(`is_active = $${values.length}`);
    }
    const rows = await pool.query(
      `SELECT * FROM payments WHERE ${filters.join(" AND ")} ORDER BY created_at DESC`,
      values
    );
    const items = rows.rows.map((row) => attachPaymentComputedFields(row));
    res.json({ items });
  } catch (error) {
    console.error("[accounting] payments list error", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
});

router.get("/payments/:id", ...withView, async (req, res) => {
  try {
    const payment = await getPayment(req.user.id, req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json({ payment: attachPaymentComputedFields(payment) });
  } catch (error) {
    console.error("[accounting] payment view error", error);
    res.status(500).json({ message: "Failed to fetch payment" });
  }
});

function normalizePaymentPayload(body = {}) {
  const allowed = [
    "title",
    "type",
    "is_active",
    "notes",
    "billing_period",
    "billing_day",
    "start_date",
    "end_date",
    "service_url",
    "provider",
    "principal_total",
    "interest_rate_apy",
    "term_months",
    "day_of_month",
    "is_annuity",
    "account_currency",
    "is_indefinite",
    "last_amount",
    "renewal_date",
    "amount",
    "currency",
  ];
  return pickAllowed(body, allowed);
}

router.post("/payments", ...withEdit, async (req, res) => {
  try {
    const payload = normalizePaymentPayload(req.body);
    const title = (payload.title || "").trim();
    if (!title) return res.status(400).json({ message: "Title is required" });
    if (!PAYMENT_TYPES.has(payload.type)) {
      return res.status(400).json({ message: "Invalid payment type" });
    }
    if (payload.billing_period && !BILLING_PERIODS.has(payload.billing_period)) {
      return res.status(400).json({ message: "Invalid billing period" });
    }
    const columns = ["user_id", "title", "type"];
    const params = [req.user.id, title, payload.type];
    const placeholders = ["$1", "$2", "$3"];
    let idx = 4;
    for (const [key, value] of Object.entries(payload)) {
      if (["title", "type"].includes(key)) continue;
      columns.push(key);
      let normalized = value;
      if (PAYMENT_BOOLEAN_FIELDS.has(key)) {
        normalized = parseBool(value);
      } else if (key.endsWith("currency") && value) {
        normalized = String(value).toUpperCase();
      }
      params.push(normalized);
      placeholders.push(`$${idx++}`);
    }
    const insert = await pool.query(
      `INSERT INTO payments (${columns.join(", ")})
       VALUES (${placeholders.join(", ")})
       RETURNING *`,
      params
    );
    res.status(201).json({ payment: attachPaymentComputedFields(insert.rows[0]) });
  } catch (error) {
    console.error("[accounting] create payment error", error);
    res.status(500).json({ message: "Failed to create payment" });
  }
});

router.patch("/payments/:id", ...withEdit, async (req, res) => {
  try {
    const payment = await getPayment(req.user.id, req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    const payload = normalizePaymentPayload(req.body);
    if (payload.type && !PAYMENT_TYPES.has(payload.type)) {
      return res.status(400).json({ message: "Invalid payment type" });
    }
    if (payload.billing_period && !BILLING_PERIODS.has(payload.billing_period)) {
      return res.status(400).json({ message: "Invalid billing period" });
    }
    const updates = [];
    const values = [];
    let idx = 1;
    for (const [key, value] of Object.entries(payload)) {
      let normalized = value;
      if (PAYMENT_BOOLEAN_FIELDS.has(key)) {
        normalized = parseBool(value);
      } else if (key.endsWith("currency") && value) {
        normalized = String(value).toUpperCase();
      }
      updates.push(`${key} = $${idx++}`);
      values.push(normalized);
    }
    if (req.body.title !== undefined) {
      updates.push(`title = $${idx++}`);
      values.push(String(req.body.title || "").trim());
    }
    if (updates.length === 0) {
      return res.json({ payment: attachPaymentComputedFields(payment) });
    }
    values.push(req.user.id);
    values.push(req.params.id);
    const updated = await pool.query(
      `UPDATE payments
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE user_id = $${idx++} AND id = $${idx}
       RETURNING *`,
      values
    );
    res.json({ payment: attachPaymentComputedFields(updated.rows[0]) });
  } catch (error) {
    console.error("[accounting] update payment error", error);
    res.status(500).json({ message: "Failed to update payment" });
  }
});

router.delete("/payments/:id", ...withEdit, async (req, res) => {
  try {
    const payment = await getPayment(req.user.id, req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    await pool.query(`DELETE FROM payments WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
    res.json({ message: "Payment deleted" });
  } catch (error) {
    console.error("[accounting] delete payment error", error);
    res.status(500).json({ message: "Failed to delete payment" });
  }
});

router.get("/payments/:id/history", ...withView, async (req, res) => {
  try {
    const payment = await getPayment(req.user.id, req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    const q = await pool.query(
      `SELECT t.*, c.name AS category_name
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 AND t.payment_id = $2
       ORDER BY t.transaction_date DESC, t.created_at DESC
       LIMIT 200`,
      [req.user.id, req.params.id]
    );
    res.json({ items: q.rows });
  } catch (error) {
    console.error("[accounting] payment history error", error);
    res.status(500).json({ message: "Failed to fetch payment history" });
  }
});

// Transactions
router.get("/transactions", ...withView, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.limit) || 25));
    const offset = (page - 1) * limit;
    const conditions = ["t.user_id = $1"];
    const values = [userId];
    if (req.query.from && DATE_REGEXP.test(req.query.from)) {
      values.push(req.query.from);
      conditions.push(`t.transaction_date >= $${values.length}`);
    }
    if (req.query.to && DATE_REGEXP.test(req.query.to)) {
      values.push(req.query.to);
      conditions.push(`t.transaction_date <= $${values.length}`);
    }
    if (req.query.category_id && isValidUuid(req.query.category_id)) {
      values.push(req.query.category_id);
      conditions.push(`t.category_id = $${values.length}`);
    }
    if (req.query.account_id && isValidUuid(req.query.account_id)) {
      values.push(req.query.account_id);
      conditions.push(`t.account_id = $${values.length}`);
    }
    if (req.query.mcc) {
      values.push(req.query.mcc);
      conditions.push(`t.mcc = $${values.length}`);
    }
    if (req.query.q) {
      values.push(`%${req.query.q.trim()}%`);
      conditions.push(`t.description ILIKE $${values.length}`);
    }
    const sortKey = TRANSACTION_SORTS[req.query.sort] || TRANSACTION_SORTS.date_desc;
    const countQ = await pool.query(
      `SELECT COUNT(*) AS total FROM transactions t WHERE ${conditions.join(" AND ")}`,
      values
    );
    values.push(limit);
    values.push(offset);
    const rowsQ = await pool.query(
      `SELECT t.*, c.name AS category_name, c.type AS category_type, p.title AS payment_title,
              a.name AS account_name, a.type AS account_type
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN payments p ON p.id = t.payment_id
       LEFT JOIN accounts a ON a.id = t.account_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY ${sortKey}
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );
    res.json(buildPagedResponse(rowsQ.rows.map(buildTransactionResponse), page, limit, Number(countQ.rows[0]?.total || 0)));
  } catch (error) {
    console.error("[accounting] list transactions error", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

router.post("/transactions", ...withEdit, async (req, res) => {
  try {
    const payload = pickAllowed(req.body || {}, [
      "transaction_date",
      "description",
      "category_id",
      "payment_id",
      "amount_operation",
      "currency_operation",
      "amount_account",
      "currency_account",
      "authorization_code",
      "mcc",
      "is_income",
      "account_id",
    ]);
    if (!payload.transaction_date || !DATE_REGEXP.test(payload.transaction_date)) {
      return res.status(400).json({ message: "transaction_date is required (YYYY-MM-DD)" });
    }
    if (payload.category_id && !isValidUuid(payload.category_id)) {
      return res.status(400).json({ message: "Invalid category" });
    }
    if (payload.payment_id && !isValidUuid(payload.payment_id)) {
      return res.status(400).json({ message: "Invalid payment" });
    }
    if (payload.payment_id) {
      const payment = await getPayment(req.user.id, payload.payment_id);
      if (!payment) return res.status(400).json({ message: "Payment not found" });
    }
    let account = null;
    if (payload.account_id) {
      if (!isValidUuid(payload.account_id)) {
        return res.status(400).json({ message: "Invalid account" });
      }
      account = await getAccountById(req.user.id, payload.account_id);
      if (!account) return res.status(400).json({ message: "Account not found" });
    }
    const isIncome = await deriveIsIncome(
      req.user.id,
      payload.category_id,
      parseBool(payload.is_income)
    );
    const amountOperation = toAmount(payload.amount_operation);
    const amountAccount = toAmount(payload.amount_account);
    const currencyAccount = (payload.currency_account || account?.currency || BASE_CURRENCY).toUpperCase();
    const currencyOperation = (payload.currency_operation || currencyAccount).toUpperCase();
    const insert = await pool.query(
      `INSERT INTO transactions (
        user_id, transaction_date, description, category_id, payment_id, account_id,
        amount_operation, currency_operation, amount_account, currency_account,
        authorization_code, mcc, is_income
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
      ) RETURNING *`,
      [
        req.user.id,
        payload.transaction_date,
        payload.description || null,
        payload.category_id || null,
        payload.payment_id || null,
        account ? account.id : null,
        amountOperation,
        currencyOperation,
        amountAccount,
        currencyAccount,
        payload.authorization_code || null,
        payload.mcc || null,
        isIncome,
      ]
    );
    res.status(201).json({ transaction: insert.rows[0] });
  } catch (error) {
    if (error.message === "CATEGORY_NOT_FOUND") {
      return res.status(400).json({ message: "Category not found" });
    }
    console.error("[accounting] create transaction error", error);
    res.status(500).json({ message: "Failed to create transaction" });
  }
});

router.patch("/transactions/:id", ...withEdit, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) return res.status(400).json(UUID_ERROR);
    const payload = pickAllowed(req.body || {}, [
      "transaction_date",
      "category_id",
      "amount_account",
      "currency_account",
      "account_id",
    ]);
    if (payload.transaction_date && !DATE_REGEXP.test(payload.transaction_date)) {
      return res.status(400).json({ message: "Invalid date" });
    }
    if (payload.category_id && !isValidUuid(payload.category_id)) {
      return res.status(400).json({ message: "Invalid category" });
    }
    const updates = [];
    const values = [];
    let idx = 1;
    for (const [key, value] of Object.entries(payload)) {
      let normalized = value;
      if (key === "currency_account" && value) {
        normalized = String(value).toUpperCase();
      } else if (key === "amount_account") {
        normalized = toAmount(value);
      }
      updates.push(`${key} = $${idx++}`);
      values.push(normalized);
    }
    let isIncomeOverride = null;
    if (payload.category_id) {
      isIncomeOverride = await deriveIsIncome(req.user.id, payload.category_id, null);
      updates.push(`is_income = $${idx++}`);
      values.push(isIncomeOverride);
    }
    if (updates.length === 0) return res.status(400).json({ message: "No fields to update" });
    values.push(req.user.id);
    values.push(id);
    const updated = await pool.query(
      `UPDATE transactions
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE user_id = $${idx++} AND id = $${idx}
       RETURNING *`,
      values
    );
    if (updated.rows.length === 0) return res.status(404).json({ message: "Transaction not found" });
    res.json({ transaction: updated.rows[0] });
  } catch (error) {
    if (error.message === "CATEGORY_NOT_FOUND") {
      return res.status(400).json({ message: "Category not found" });
    }
    console.error("[accounting] update transaction error", error);
    res.status(500).json({ message: "Failed to update transaction" });
  }
});

router.delete("/transactions/:id", ...withEdit, async (req, res) => {
  try {
    if (!isValidUuid(req.params.id)) return res.status(400).json(UUID_ERROR);
    const deleted = await pool.query(
      `DELETE FROM transactions WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (deleted.rowCount === 0) return res.status(404).json({ message: "Transaction not found" });
    res.json({ message: "Transaction deleted" });
  } catch (error) {
    console.error("[accounting] delete transaction error", error);
    res.status(500).json({ message: "Failed to delete transaction" });
  }
});

router.post("/transactions/import", ...withEdit, async (_req, res) => {
  res.json({ status: "stub", message: "Импорт пока не реализован" });
});

// Accounts
router.get("/accounts", ...withView, async (req, res) => {
  try {
    const items = await listAccountsWithBalance(req.user.id);
    res.json({ items });
  } catch (error) {
    console.error("[accounting] list accounts error", error);
    res.status(500).json({ message: "Failed to fetch accounts" });
  }
});

router.post("/accounts", ...withEdit, async (req, res) => {
  try {
    const { name, type, currency, balance, notes } = req.body || {};
    const trimmed = (name || "").trim();
    if (!trimmed) return res.status(400).json({ message: "Name is required" });
    if (!ACCOUNT_TYPES.has(type)) {
      return res.status(400).json({ message: "Invalid account type" });
    }
    const normalizedCurrency = (currency || BASE_CURRENCY).toUpperCase();
    const initial = toAmount(balance) ?? 0;
    const insert = await pool.query(
      `INSERT INTO accounts (user_id, name, type, currency, initial_balance, current_balance, notes)
       VALUES ($1,$2,$3,$4,$5,$5,$6)
       RETURNING id`,
      [req.user.id, trimmed, type, normalizedCurrency, initial, notes || null]
    );
    const [account] = await listAccountsWithBalance(req.user.id, insert.rows[0].id);
    res.status(201).json({ account });
  } catch (error) {
    console.error("[accounting] create account error", error);
    res.status(500).json({ message: "Failed to create account" });
  }
});

router.patch("/accounts/:id", ...withEdit, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) return res.status(400).json(UUID_ERROR);
    const existing = await getAccountById(req.user.id, id);
    if (!existing) return res.status(404).json({ message: "Account not found" });

    const payload = pickAllowed(req.body || {}, ["name", "type", "currency", "notes"]);
    const updates = [];
    const values = [];
    let idx = 1;
    if (payload.name !== undefined) {
      const trimmed = String(payload.name || "").trim();
      if (!trimmed) return res.status(400).json({ message: "Name cannot be empty" });
      updates.push(`name = $${idx++}`);
      values.push(trimmed);
    }
    if (payload.type !== undefined) {
      if (!ACCOUNT_TYPES.has(payload.type)) {
        return res.status(400).json({ message: "Invalid account type" });
      }
      updates.push(`type = $${idx++}`);
      values.push(payload.type);
    }
    if (payload.currency !== undefined) {
      updates.push(`currency = $${idx++}`);
      values.push(String(payload.currency).toUpperCase());
    }
    if (payload.notes !== undefined) {
      updates.push(`notes = $${idx++}`);
      values.push(payload.notes || null);
    }
    if (updates.length > 0) {
      values.push(req.user.id, id);
      await pool.query(
        `UPDATE accounts SET ${updates.join(", ")}, updated_at = NOW()
         WHERE user_id = $${idx++} AND id = $${idx}`,
        values
      );
    }

    const targetBalanceRaw = req.body?.balance;
    if (targetBalanceRaw !== undefined && targetBalanceRaw !== null && targetBalanceRaw !== "") {
      const targetBalance = Number(targetBalanceRaw);
      if (!Number.isFinite(targetBalance)) {
        return res.status(400).json({ message: "balance must be numeric" });
      }
      const actual = await getAccountBalance(req.user.id, id);
      if (actual === null) {
        return res.status(404).json({ message: "Account not found" });
      }
      const diff = round2(targetBalance - actual);
      if (Math.abs(diff) >= 0.01) {
        const isIncome = diff > 0;
        const absDiff = Math.abs(diff);
        const today = formatDate(new Date());
        const accountRow = await getAccountById(req.user.id, id);
        const currencyValue = (accountRow?.currency || BASE_CURRENCY).toUpperCase();
        const accountName = accountRow?.name || "счет";
        await pool.query(
          `INSERT INTO transactions (
             user_id, transaction_date, description, account_id,
             amount_operation, currency_operation, amount_account, currency_account,
             is_income
           )
           VALUES ($1,$2,$3,$4,$5,$6,$5,$6,$7)`,
          [
            req.user.id,
            today,
            `Обновление баланса счета (${accountName})`,
            id,
            absDiff,
            currencyValue,
            isIncome,
          ]
        );
      }
    }

    const [account] = await listAccountsWithBalance(req.user.id, id);
    res.json({ account });
  } catch (error) {
    console.error("[accounting] update account error", error);
    res.status(500).json({ message: "Failed to update account" });
  }
});

router.delete("/accounts/:id", ...withEdit, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) return res.status(400).json(UUID_ERROR);
    const deleted = await pool.query(
      `DELETE FROM accounts WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    if (deleted.rowCount === 0) return res.status(404).json({ message: "Account not found" });
    res.json({ message: "Account deleted" });
  } catch (error) {
    console.error("[accounting] delete account error", error);
    res.status(500).json({ message: "Failed to delete account" });
  }
});

// Incomes
router.get("/incomes", ...withView, async (req, res) => {
  try {
    const q = await pool.query(
      `SELECT i.*, NULL::uuid AS income_category_id, NULL::text AS category_name
       FROM incomes i
       WHERE i.user_id = $1
       ORDER BY i.next_date ASC`,
      [req.user.id]
    );
    res.json({ items: q.rows });
  } catch (error) {
    console.error("[accounting] list incomes error", error);
    res.status(500).json({ message: "Failed to fetch incomes" });
  }
});

router.post("/incomes", ...withEdit, async (req, res) => {
  try {
    const payload = pickAllowed(req.body || {}, [
      "source_name",
      "amount",
      "currency",
      "periodicity",
      "n_days",
      "next_date",
      "is_active",
    ]);
    const source = (payload.source_name || "").trim();
    if (!source) return res.status(400).json({ message: "source_name is required" });
    const amount = toAmount(payload.amount);
    if (!amount) return res.status(400).json({ message: "amount is required" });
    if (!payload.currency) return res.status(400).json({ message: "currency is required" });
    if (!["monthly", "quarterly", "custom_ndays"].includes(payload.periodicity)) {
      return res.status(400).json({ message: "Invalid periodicity" });
    }
    if (payload.periodicity === "custom_ndays" && !Number(payload.n_days)) {
      return res.status(400).json({ message: "n_days is required for custom cadence" });
    }
    if (!payload.next_date || !DATE_REGEXP.test(payload.next_date)) {
      return res.status(400).json({ message: "Invalid next_date" });
    }
    const insert = await pool.query(
      `INSERT INTO incomes (user_id, source_name, amount, currency, periodicity, n_days, next_date, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        req.user.id,
        source,
        amount,
        payload.currency.toUpperCase(),
        payload.periodicity,
        payload.n_days || null,
        payload.next_date,
        payload.is_active !== undefined ? parseBool(payload.is_active) : true,
      ]
    );
    res.status(201).json({ income: insert.rows[0] });
  } catch (error) {
    console.error("[accounting] create income error", error);
    res.status(500).json({ message: "Failed to create income" });
  }
});

router.patch("/incomes/:id", ...withEdit, async (req, res) => {
  try {
    if (!isValidUuid(req.params.id)) return res.status(400).json(UUID_ERROR);
    const payload = pickAllowed(req.body || {}, [
      "source_name",
      "amount",
      "currency",
      "periodicity",
      "n_days",
      "next_date",
      "is_active",
    ]);
    if (payload.next_date && !DATE_REGEXP.test(payload.next_date)) {
      return res.status(400).json({ message: "Invalid next_date" });
    }
    if (payload.periodicity && !["monthly", "quarterly", "custom_ndays"].includes(payload.periodicity)) {
      return res.status(400).json({ message: "Invalid periodicity" });
    }
    if (payload.periodicity === "custom_ndays" && payload.n_days === undefined) {
      return res.status(400).json({ message: "n_days is required for custom cadence" });
    }
    if (payload.n_days !== undefined && !Number(payload.n_days)) {
      return res.status(400).json({ message: "n_days must be numeric" });
    }
    const updates = [];
    const values = [];
    let idx = 1;
    for (const [key, value] of Object.entries(payload)) {
      if (key === "source_name") {
        updates.push(`source_name = $${idx++}`);
        values.push(String(value || "").trim());
        continue;
      }
      if (key === "currency" && value) {
        updates.push(`currency = $${idx++}`);
        values.push(String(value).toUpperCase());
        continue;
      }
      let normalized = value;
      if (key === "amount") {
        const normalizedAmount = toAmount(value);
        if (normalizedAmount === null) {
          return res.status(400).json({ message: "amount must be numeric" });
        }
        normalized = normalizedAmount;
      }
      updates.push(`${key} = $${idx++}`);
      values.push(normalized);
    }
    if (updates.length === 0) return res.status(400).json({ message: "No fields to update" });
    values.push(req.user.id);
    values.push(req.params.id);
    const updated = await pool.query(
      `UPDATE incomes
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE user_id = $${idx++} AND id = $${idx}
       RETURNING *`,
      values
    );
    if (updated.rows.length === 0) return res.status(404).json({ message: "Income not found" });
    res.json({ income: updated.rows[0] });
  } catch (error) {
    console.error("[accounting] update income error", error);
    res.status(500).json({ message: "Failed to update income" });
  }
});

router.delete("/incomes/:id", ...withEdit, async (req, res) => {
  try {
    if (!isValidUuid(req.params.id)) return res.status(400).json(UUID_ERROR);
    const deleted = await pool.query(
      `DELETE FROM incomes WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (deleted.rowCount === 0) return res.status(404).json({ message: "Income not found" });
    res.json({ message: "Income deleted" });
  } catch (error) {
    console.error("[accounting] delete income error", error);
    res.status(500).json({ message: "Failed to delete income" });
  }
});

router.get("/incomes/forecast", ...withView, async (req, res) => {
  try {
    const period = req.query.period === "year" ? "year" : "month";
    const forecast = await buildIncomeForecast(req.user.id, period);
    res.json({ period, ...forecast });
  } catch (error) {
    console.error("[accounting] forecast error", error);
    res.status(500).json({ message: "Failed to build forecast" });
  }
});

// Dashboard & settings
router.get("/dashboard", ...withView, async (req, res) => {
  try {
    const data = await buildDashboard(req.user.id, req.query.month);
    res.json(data);
  } catch (error) {
    console.error("[accounting] dashboard error", error);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
});

router.get("/settings/dashboard", ...withView, async (req, res) => {
  try {
    const prefs = await ensureDashboardPreferences(req.user.id);
    res.json({ preferences: prefs });
  } catch (error) {
    console.error("[accounting] get dashboard prefs error", error);
    res.status(500).json({ message: "Failed to load preferences" });
  }
});

router.patch("/settings/dashboard", ...withAdmin, async (req, res) => {
  try {
    await ensureDashboardPreferences(req.user.id);
    const payload = pickAllowed(req.body || {}, [
      "show_kpis",
      "show_pie_categories",
      "show_upcoming_payments",
      "show_subscriptions",
      "show_income_forecast",
    ]);
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: "No fields provided" });
    }
    const updates = [];
    const values = [];
    let idx = 1;
    for (const [key, value] of Object.entries(payload)) {
      updates.push(`${key} = $${idx++}`);
      values.push(parseBool(value));
    }
    values.push(req.user.id);
    const updated = await pool.query(
      `UPDATE dashboard_preferences
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE user_id = $${idx}
       RETURNING *`,
      values
    );
    res.json({ preferences: updated.rows[0] });
  } catch (error) {
    console.error("[accounting] update dashboard prefs error", error);
    res.status(500).json({ message: "Failed to update preferences" });
  }
});

export default router;
