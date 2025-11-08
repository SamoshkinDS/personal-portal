import { pool } from "../db/connect.js";
import { sendPushToUser } from "../utils/push.js";
import { attachPaymentComputedFields, formatDate, shiftIncomeNextDate, startOfDay } from "./accountingUtils.js";

const PLACEHOLDER_DESCRIPTION = "Коммунальные — введите сумму";
const SYSTEM_CATEGORY_NAME = "Коммунальные";

const systemCategoryCache = new Map(); // key: `${userId}:${name}`

async function getSystemCategoryId(userId, name) {
  const key = `${userId}:${name.toLowerCase()}`;
  if (systemCategoryCache.has(key)) return systemCategoryCache.get(key);
  const q = await pool.query(
    `SELECT id FROM categories WHERE user_id = $1 AND lower(name) = lower($2) LIMIT 1`,
    [userId, name]
  );
  const id = q.rows[0]?.id || null;
  systemCategoryCache.set(key, id);
  return id;
}

export async function createUtilityPlaceholders() {
  const today = new Date();
  const targetDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const targetIso = formatDate(targetDate);
  const paymentsQ = await pool.query(
    `SELECT id, user_id, title FROM payments WHERE type = 'utilities' AND is_active = TRUE`
  );
  for (const payment of paymentsQ.rows) {
    const exists = await pool.query(
      `SELECT 1
       FROM transactions
       WHERE user_id = $1 AND payment_id = $2
         AND date_trunc('month', transaction_date) = date_trunc('month', $3::date)
       LIMIT 1`,
      [payment.user_id, payment.id, targetIso]
    );
    if (exists.rows.length > 0) continue;
    const categoryId = await getSystemCategoryId(payment.user_id, SYSTEM_CATEGORY_NAME);
    await pool.query(
      `INSERT INTO transactions (user_id, transaction_date, description, category_id, payment_id, is_income)
       VALUES ($1, $2, $3, $4, $5, FALSE)`,
      [payment.user_id, targetIso, PLACEHOLDER_DESCRIPTION, categoryId, payment.id]
    );
    await sendPushToUser(
      payment.user_id,
      "Коммунальные платежи",
      `${payment.title}: введите сумму за текущий месяц`,
      "/accounting/transactions"
    );
  }
}

export async function notifyExpiringSubscriptions(daysThreshold = 3) {
  const today = new Date();
  const q = await pool.query(
    `SELECT id, user_id, title, renewal_date
     FROM payments
     WHERE type = 'subscription' AND is_active = TRUE AND renewal_date IS NOT NULL`
  );
  for (const sub of q.rows) {
    const due = sub.renewal_date;
    if (!due) continue;
    const diffDays = Math.ceil(
      (startOfDay(due) - startOfDay(today)) / (1000 * 60 * 60 * 24)
    );
    if (Number.isFinite(diffDays) && diffDays >= 0 && diffDays <= daysThreshold) {
      await sendPushToUser(
        sub.user_id,
        "Подписка скоро спишется",
        `${sub.title}: осталось ${diffDays} дн.`,
        "/accounting/payments"
      );
    }
  }
}

export async function notifyLoanPayments(daysThreshold = 3) {
  const today = new Date();
  const q = await pool.query(
    `SELECT *
     FROM payments
     WHERE type IN ('mortgage','loan') AND is_active = TRUE`
  );
  for (const payment of q.rows) {
    const withComputed = attachPaymentComputedFields(payment, today);
    const days = withComputed.days_left;
    if (days === null || days < 0 || days > daysThreshold) continue;
    const amountText = withComputed.annuity_payment
      ? `Платёж ~${withComputed.annuity_payment} ${payment.account_currency || ""}`.trim()
      : "Пора внести платёж";
    await sendPushToUser(
      payment.user_id,
      `Платёж ${payment.title}`,
      `${amountText}. До списания ${days} дн.`,
      "/accounting/payments"
    );
  }
}

export async function tickIncomesForToday() {
  const todayIso = formatDate(new Date());
  const q = await pool.query(
    `SELECT id, user_id, source_name, amount, currency, periodicity, n_days, next_date
     FROM incomes
     WHERE is_active = TRUE AND next_date = $1`,
    [todayIso]
  );
  for (const income of q.rows) {
    const next = shiftIncomeNextDate(income.next_date, income.periodicity, income.n_days);
    if (next) {
      await pool.query(`UPDATE incomes SET next_date = $1 WHERE id = $2`, [next, income.id]);
    }
    await sendPushToUser(
      income.user_id,
      "Ожидается доход",
      `${income.source_name}: ${income.amount} ${income.currency}`,
      "/accounting/incomes"
    );
  }
}
