import { v4 as uuidv4 } from "uuid";
import process from "process";
import { pool } from "../db/connect.js";

async function main() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const [key, value] = arg.split("=");
      return [key.replace(/^--/, ""), value ?? true];
    })
  );
  const username = args.username;
  const userIdArg = args["user-id"];
  if (!username && !userIdArg) {
    console.error("Usage: node scripts/seedAccounting.js --username=demo");
    process.exit(1);
  }

  let userId = userIdArg ? Number(userIdArg) : null;
  if (!userId) {
    const userQ = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
    if (userQ.rows.length === 0) {
      console.error(`User ${username} not found`);
      process.exit(1);
    }
    userId = userQ.rows[0].id;
  }

  const categorySeeds = [
    { name: "Продукты", type: "expense", color_hex: "#f97316" },
    { name: "Хобби", type: "expense", color_hex: "#22d3ee" },
    { name: "Фриланс", type: "income", color_hex: "#22c55e" },
  ];
  for (const seed of categorySeeds) {
    await pool.query(
      `INSERT INTO categories (id, user_id, name, type, color_hex, is_system)
       SELECT gen_random_uuid(), $1, $2, $3, $4, FALSE
       WHERE NOT EXISTS (
         SELECT 1 FROM categories WHERE user_id = $1 AND lower(name) = lower($2)
       )`,
      [userId, seed.name, seed.type, seed.color_hex]
    );
  }

  const payments = [
    {
      title: "Ипотека ЖК Север",
      type: "mortgage",
      principal_total: 5600000,
      interest_rate_apy: 8.4,
      term_months: 180,
      start_date: "2023-01-05",
      day_of_month: 5,
      account_currency: "RUB",
    },
    {
      title: "Подписка Spotify",
      type: "subscription",
      amount: 549,
      currency: "RUB",
      renewal_date: "2025-11-15",
      billing_period: "monthly",
    },
    {
      title: "Коммунальные платежи",
      type: "utilities",
      provider: "УК Север",
      billing_period: "monthly",
    },
    {
      title: "Мобильная связь",
      type: "mobile",
      amount: 950,
      currency: "RUB",
      billing_period: "monthly",
      billing_day: 12,
    },
  ];

  for (const payment of payments) {
    const params = [
      uuidv4(),
      userId,
      payment.type,
      payment.title,
      payment.is_active ?? true,
      payment.notes || null,
      payment.billing_period || null,
      payment.billing_day || null,
      payment.start_date || null,
      payment.end_date || null,
      payment.service_url || null,
      payment.provider || null,
      payment.principal_total || null,
      payment.interest_rate_apy || null,
      payment.term_months || null,
      payment.day_of_month || null,
      payment.is_annuity ?? true,
      payment.account_currency || "RUB",
      payment.is_indefinite || false,
      payment.last_amount || null,
      payment.renewal_date || null,
      payment.amount || null,
      payment.currency || "RUB",
    ];
    await pool.query(
      `INSERT INTO payments (
        id, user_id, type, title, is_active, notes,
        billing_period, billing_day, start_date, end_date,
        service_url, provider, principal_total, interest_rate_apy,
        term_months, day_of_month, is_annuity, account_currency,
        is_indefinite, last_amount, renewal_date, amount, currency
      )
      SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23
      WHERE NOT EXISTS (
        SELECT 1 FROM payments WHERE user_id=$2 AND title=$4
      )`,
      params
    );
  }

  const categoriesQ = await pool.query("SELECT id, name FROM categories WHERE user_id = $1", [userId]);
  const categoriesMap = Object.fromEntries(
    categoriesQ.rows.map((row) => [row.name.toLowerCase(), row.id])
  );
  const paymentsQ = await pool.query("SELECT id, title FROM payments WHERE user_id = $1", [userId]);
  const paymentsMap = Object.fromEntries(
    paymentsQ.rows.map((row) => [row.title.toLowerCase(), row.id])
  );

  const incomes = [
    {
      source_name: "Зарплата",
      amount: 210000,
      currency: "RUB",
      periodicity: "monthly",
      next_date: "2025-11-25",
    },
    {
      source_name: "Фриланс / Upwork",
      amount: 48000,
      currency: "RUB",
      periodicity: "custom_ndays",
      n_days: 20,
      next_date: "2025-11-20",
    },
  ];

  for (const income of incomes) {
    await pool.query(
      `INSERT INTO incomes (id, user_id, source_name, amount, currency, periodicity, n_days, next_date, is_active)
       SELECT gen_random_uuid(), $1,$2,$3,$4,$5,$6,$7,TRUE
       WHERE NOT EXISTS (
         SELECT 1 FROM incomes WHERE user_id = $1 AND source_name = $2
       )`,
      [userId, income.source_name, income.amount, income.currency, income.periodicity, income.n_days || null, income.next_date]
    );
  }

  const sampleTransactions = [
    {
      date: "2025-11-01",
      description: "Продукты — Азбука вкуса",
      category: "Продукты",
      amount: 4200,
      is_income: false,
    },
    {
      date: "2025-10-28",
      description: "Фриланс перевод средств",
      category: "Фриланс",
      amount: 32000,
      is_income: true,
    },
    {
      date: "2025-10-25",
      description: "Ипотека ЖК Север",
      category: "Ипотека",
      payment: "Ипотека ЖК СЕВЕР",
      amount: 48000,
      is_income: false,
    },
    {
      date: "2025-10-15",
      description: "Коммунальные платежи октябрь",
      category: "Коммунальные",
      payment: "Коммунальные платежи",
      amount: 6100,
      is_income: false,
    },
  ];

  for (const tx of sampleTransactions) {
    await pool.query(
      `INSERT INTO transactions (
        id, user_id, transaction_date, description, category_id, payment_id,
        amount_account, currency_account, is_income
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'RUB', $7
      )`,
      [
        userId,
        tx.date,
        tx.description,
        tx.category ? categoriesMap[tx.category.toLowerCase()] || null : null,
        tx.payment ? paymentsMap[tx.payment.toLowerCase()] || null : null,
        Math.abs(tx.amount),
        tx.is_income,
      ]
    );
  }

  console.log("Accounting seed completed for user", userId);
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed", err);
  process.exit(1);
});
