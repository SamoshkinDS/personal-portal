import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/user.js";
import todosRoutes from "./routes/todos.js";
import todoListsRoutes from "./routes/todoLists.js";
import postsRoutes from "./routes/posts.js";
import vpnRoutes from "./routes/vpn.js";
import vlessRoutes from "./routes/vless.js";
import xrayRoutes from "./routes/xray.js";
import notificationsRoutes from "./routes/notifications.js";
import actionsRoutes from "./routes/actions.js";
import n8nRoutes from "./routes/n8n.js";
import notesRoutes from "./routes/notes.js";
import accountingRoutes from "./routes/accounting.js";
import plantsRoutes from "./routes/plants.js";
import { pool } from "./db/connect.js";
import { ensurePlantsSchema } from "./db/plantsSchema.js";
import { syncVlessStats } from "./services/xray.js";
import {
  createUtilityPlaceholders,
  notifyExpiringSubscriptions,
  notifyLoanPayments,
  tickIncomesForToday,
} from "./services/accountingJobs.js";
import os from "os";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/todos", todosRoutes);
app.use("/api/todo-lists", todoListsRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/vpn", vpnRoutes);
app.use("/api/vless", vlessRoutes);
app.use("/api/xray", xrayRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/actions", actionsRoutes);
app.use("/api/n8n", n8nRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/accounting", accountingRoutes);
app.use("/api/plants", plantsRoutes);

const XRAY_CRON_ENABLED = String(process.env.XRAY_CRON_DISABLED || "false").toLowerCase() !== "true";
const ACCOUNTING_JOBS_ENABLED = String(process.env.ACCOUNTING_JOBS_DISABLED || "false").toLowerCase() !== "true";

if (XRAY_CRON_ENABLED) {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const results = await syncVlessStats();
      if (results.length > 0) {
        console.log(`[cron] Synced VLESS stats for ${results.length} user(s)`);
      }
    } catch (err) {
      console.warn("[cron] VLESS stats sync failed", err.message || err);
    }
  });
}

if (ACCOUNTING_JOBS_ENABLED) {
  cron.schedule("0 8 1 * *", async () => {
    try {
      await createUtilityPlaceholders();
      console.log("[cron] accounting: created utility placeholders");
    } catch (err) {
      console.warn("[cron] accounting utilities failed", err.message || err);
    }
  });
  cron.schedule("0 9 * * *", async () => {
    try {
      await notifyExpiringSubscriptions();
      await notifyLoanPayments();
    } catch (err) {
      console.warn("[cron] accounting reminders failed", err.message || err);
    }
  });
  cron.schedule("30 9 * * *", async () => {
    try {
      await tickIncomesForToday();
    } catch (err) {
      console.warn("[cron] accounting incomes failed", err.message || err);
    }
  });
}

// Ensure DB tables and columns exist
(async () => {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await pool.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS role VARCHAR(32) DEFAULT 'NON_ADMIN',
        ADD COLUMN IF NOT EXISTS vpn_can_create BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(120),
        email VARCHAR(120),
        phone VARCHAR(40),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_todo_lists (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(120) NOT NULL,
        position INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      ALTER TABLE user_todo_lists
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_todo_lists_user ON user_todo_lists(user_id, position);
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_todos (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        list_id INTEGER REFERENCES user_todo_lists(id) ON DELETE CASCADE,
        text VARCHAR(500) NOT NULL,
        done BOOLEAN DEFAULT FALSE,
        position INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        due_at TIMESTAMP
      );
    `);
    await pool.query(`
      ALTER TABLE user_todos
        ADD COLUMN IF NOT EXISTS list_id INTEGER REFERENCES user_todo_lists(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS due_at TIMESTAMP,
        DROP COLUMN IF EXISTS parent_id;
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_todos_user_id ON user_todos(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_todos_list ON user_todos(user_id, list_id, position);
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_user_posts_user_id ON user_posts(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_posts_created_at ON user_posts(created_at DESC);
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        key VARCHAR(64) PRIMARY KEY,
        description TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS user_permissions (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        perm_key VARCHAR(64) NOT NULL REFERENCES permissions(key) ON DELETE CASCADE,
        PRIMARY KEY (user_id, perm_key)
      );
    `);
    await pool.query(`
      INSERT INTO permissions (key, description) VALUES
        ('view_analytics','Р”РѕСЃС‚СѓРї Рє СЂР°Р·РґРµР»Сѓ В«РђРЅР°Р»РёС‚РёРєР°В»'),
        ('view_ai','Р”РѕСЃС‚СѓРї Рє СЂР°Р·РґРµР»Сѓ В«AIВ»'),
        ('view_vpn','Р”РѕСЃС‚СѓРї Рє СЂР°Р·РґРµР»Сѓ В«VPNВ»'),
        ('admin_access','Р”РѕСЃС‚СѓРї РІ Р°РґРјРёРЅ-РїР°РЅРµР»СЊ'),
        ('manage_users','РЈРїСЂР°РІР»РµРЅРёРµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏРјРё'),
        ('view_logs','РџСЂРѕСЃРјРѕС‚СЂ Р»РѕРіРѕРІ'),
        ('manage_content','РЈРїСЂР°РІР»РµРЅРёРµ РєРѕРЅС‚РµРЅС‚РѕРј'),
        ('vpn_create','РЎРѕР·РґР°РЅРёРµ VPN-РєР»СЋС‡РµР№'),
        ('plants_admin','Управление разделом «Растения»'),
        ('accounting:view','Р‘СѓС…РіР°Р»С‚РµСЂРёСЏ: РїСЂРѕСЃРјРѕС‚СЂ'),
        ('accounting:edit','Р‘СѓС…РіР°Р»С‚РµСЂРёСЏ: СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ'),
        ('accounting:admin','Р‘СѓС…РіР°Р»С‚РµСЂРёСЏ: РЅР°СЃС‚СЂРѕР№РєРё')
      ON CONFLICT (key) DO NOTHING;
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS content_items (
        id SERIAL PRIMARY KEY,
        type VARCHAR(16) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        content TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW(),
        message TEXT NOT NULL
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vless_keys (
        id SERIAL PRIMARY KEY,
        uuid UUID NOT NULL,
        name TEXT NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        stats_json JSONB DEFAULT '{}'::jsonb
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_vless_keys_uuid ON vless_keys(uuid);
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vless_stats (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        uplink BIGINT DEFAULT 0,
        downlink BIGINT DEFAULT 0,
        total BIGINT GENERATED ALWAYS AS (uplink + downlink) STORED,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_vless_stats_email_created_at
        ON vless_stats(email, created_at DESC);
    `);
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE payment_type AS ENUM ('mortgage','loan','utilities','parking_rent','mobile','subscription');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('expense','income')),
        color_hex TEXT,
        is_system BOOLEAN NOT NULL DEFAULT FALSE,
        mcc_mask TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS categories_user_name_uk ON categories(user_id, name);
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type payment_type NOT NULL,
        title TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        notes TEXT,
        billing_period TEXT,
        billing_day INT,
        start_date DATE,
        end_date DATE,
        service_url TEXT,
        provider TEXT,
        principal_total NUMERIC(14,2),
        interest_rate_apy NUMERIC(6,3),
        term_months INT,
        day_of_month INT,
        is_annuity BOOLEAN,
        account_currency TEXT,
        is_indefinite BOOLEAN DEFAULT FALSE,
        last_amount NUMERIC(14,2),
        renewal_date DATE,
        amount NUMERIC(14,2),
        currency TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS payments_user_type_idx ON payments(user_id, type);
      CREATE INDEX IF NOT EXISTS payments_renewal_idx ON payments(renewal_date);
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        transaction_date DATE NOT NULL,
        description TEXT,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
        amount_operation NUMERIC(14,2),
        currency_operation TEXT,
        amount_account NUMERIC(14,2),
        currency_account TEXT,
        authorization_code TEXT,
        mcc TEXT,
        is_income BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS transactions_user_date_idx ON transactions(user_id, transaction_date DESC);
      CREATE INDEX IF NOT EXISTS transactions_user_category_idx ON transactions(user_id, category_id);
      CREATE INDEX IF NOT EXISTS transactions_user_payment_idx ON transactions(user_id, payment_id);
      CREATE INDEX IF NOT EXISTS transactions_search_idx ON transactions USING GIN (to_tsvector('simple', coalesce(description,'')));
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS incomes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        source_name TEXT NOT NULL,
        amount NUMERIC(14,2) NOT NULL,
        currency TEXT NOT NULL,
        periodicity TEXT NOT NULL CHECK (periodicity IN ('monthly','quarterly','custom_ndays')),
        n_days INT,
        next_date DATE NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        income_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS incomes_user_next_idx ON incomes(user_id, next_date);
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dashboard_preferences (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        show_kpis BOOLEAN DEFAULT TRUE,
        show_pie_categories BOOLEAN DEFAULT TRUE,
        show_upcoming_payments BOOLEAN DEFAULT TRUE,
        show_subscriptions BOOLEAN DEFAULT TRUE,
        show_income_forecast BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('card','cash','deposit','other')),
        currency TEXT NOT NULL DEFAULT 'RUB',
        initial_balance NUMERIC(14,2) DEFAULT 0,
        current_balance NUMERIC(14,2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS accounts_user_idx ON accounts(user_id, created_at DESC);
    `);
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'categories_set_updated_at') THEN
          CREATE TRIGGER categories_set_updated_at
          BEFORE UPDATE ON categories
          FOR EACH ROW
          EXECUTE FUNCTION set_updated_at();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'payments_set_updated_at') THEN
          CREATE TRIGGER payments_set_updated_at
          BEFORE UPDATE ON payments
          FOR EACH ROW
          EXECUTE FUNCTION set_updated_at();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'transactions_set_updated_at') THEN
          CREATE TRIGGER transactions_set_updated_at
          BEFORE UPDATE ON transactions
          FOR EACH ROW
          EXECUTE FUNCTION set_updated_at();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'incomes_set_updated_at') THEN
          CREATE TRIGGER incomes_set_updated_at
          BEFORE UPDATE ON incomes
          FOR EACH ROW
          EXECUTE FUNCTION set_updated_at();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'dashboard_preferences_set_updated_at') THEN
          CREATE TRIGGER dashboard_preferences_set_updated_at
          BEFORE UPDATE ON dashboard_preferences
          FOR EACH ROW
          EXECUTE FUNCTION set_updated_at();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'accounts_set_updated_at') THEN
          CREATE TRIGGER accounts_set_updated_at
          BEFORE UPDATE ON accounts
          FOR EACH ROW
          EXECUTE FUNCTION set_updated_at();
        END IF;
      END $$;
    `);
    await pool.query(`
      ALTER TABLE transactions
        ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
    `);
    const systemCategories = [
      { name: 'Коммунальные', type: 'expense', color: '#f97316' },
      { name: 'Ипотека', type: 'expense', color: '#f97316' },
      { name: 'Кредит', type: 'expense', color: '#f97316' },
      { name: 'Связь', type: 'expense', color: '#0ea5e9' },
      { name: 'Подписки', type: 'expense', color: '#a855f7' },
      { name: 'Зарплата', type: 'income', color: '#10b981' },
      { name: 'Разовый доход', type: 'income', color: '#34d399' },
      { name: 'Поддержка семьи', type: 'income', color: '#60a5fa' },
      { name: 'Возврат средств', type: 'income', color: '#fbbf24' },
    ];
    for (const cat of systemCategories) {
      await pool.query(
        `
        INSERT INTO categories (id, user_id, name, type, color_hex, is_system)
        SELECT gen_random_uuid(), u.id, $1, $2, $3, TRUE
        FROM users u
        WHERE NOT EXISTS (
          SELECT 1
          FROM categories c
          WHERE c.user_id = u.id AND lower(c.name) = lower($1)
        );
        `,
        [cat.name, cat.type, cat.color]
      );
    }
    await pool.query(`
      INSERT INTO dashboard_preferences (user_id)
      SELECT id FROM users
      ON CONFLICT (user_id) DO NOTHING;
    `);
    await ensurePlantsSchema();
    console.log("DB ready: users, user_profiles, user_todos, user_posts, content_items, notes, admin_logs, push_subscriptions, permissions, user_permissions, vless_keys, vless_stats, categories, payments, transactions, incomes, dashboard_preferences, plants");
  } catch (err) {
    console.error("DB init error", err);
  }
})();

// Test route
app.get("/", (req, res) => {
  res.send("вњ… Backend is running!");
});

// Test /api
app.get("/api", (req, res) => {
  res.json({ message: "Backend is alive рџљЂ" });
});

// Simple system stats endpoint
app.get("/api/system-stats", (req, res) => {
  try {
    const cpus = os.cpus()?.length || 1;
    const [load1] = os.loadavg();
    const cpu = Math.max(0, Math.min(100, Math.round(((load1 || 0) / cpus) * 1000) / 10));
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsedPct = totalMem ? Math.round(((totalMem - freeMem) / totalMem) * 1000) / 10 : 0;
    const uptimeSec = os.uptime();
    const days = Math.floor(uptimeSec / 86400);
    const hours = Math.floor((uptimeSec % 86400) / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    const uptime = `${days}d ${hours}h ${minutes}m`;
    res.json({ cpu, disk: memUsedPct, bandwidth: { in: 0, out: 0 }, uptime });
  } catch (e) {
    res.status(500).json({ message: "Failed to get stats" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`рџљЂ Server started on http://localhost:${PORT}`);
});
