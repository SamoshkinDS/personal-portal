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
import { pool } from "./db/connect.js";
import { syncVlessStats } from "./services/xray.js";
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

const XRAY_CRON_ENABLED = String(process.env.XRAY_CRON_DISABLED || "false").toLowerCase() !== "true";

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

// Ensure DB tables and columns exist
(async () => {
  try {
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
        ('vpn_create','РЎРѕР·РґР°РЅРёРµ VPN-РєР»СЋС‡РµР№')
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
    console.log("DB: users, user_profiles, user_todos, user_posts, content_items, notes, admin_logs, push_subscriptions, permissions, user_permissions, vless_keys, vless_stats are ready");
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
