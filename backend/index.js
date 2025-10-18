import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/user.js";
import todosRoutes from "./routes/todos.js";
import postsRoutes from "./routes/posts.js";
import vpnRoutes from "./routes/vpn.js";
import notificationsRoutes from "./routes/notifications.js";
import { pool } from "./db/connect.js";
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
app.use("/api/posts", postsRoutes);
app.use("/api/vpn", vpnRoutes);
app.use("/api/notifications", notificationsRoutes);

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
      CREATE TABLE IF NOT EXISTS user_todos (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        text VARCHAR(500) NOT NULL,
        done BOOLEAN DEFAULT FALSE,
        parent_id INTEGER REFERENCES user_todos(id) ON DELETE CASCADE,
        position INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      ALTER TABLE user_todos
        ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES user_todos(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_todos_user_id ON user_todos(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_todos_parent ON user_todos(user_id, parent_id);
      CREATE INDEX IF NOT EXISTS idx_user_todos_position ON user_todos(user_id, parent_id, position);
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
        ('view_analytics','Доступ к разделу «Аналитика»'),
        ('view_ai','Доступ к разделу «AI»'),
        ('view_vpn','Доступ к разделу «VPN»'),
        ('admin_access','Доступ в админ-панель'),
        ('manage_users','Управление пользователями'),
        ('view_logs','Просмотр логов'),
        ('manage_content','Управление контентом'),
        ('vpn_create','Создание VPN-ключей')
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
    console.log("DB: users, user_profiles, user_todos, user_posts, content_items, admin_logs, push_subscriptions, permissions, user_permissions are ready");
  } catch (err) {
    console.error("DB init error", err);
  }
})();

// Test route
app.get("/", (req, res) => {
  res.send("✅ Backend is running!");
});

// Test /api
app.get("/api", (req, res) => {
  res.json({ message: "Backend is alive 🚀" });
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
  console.log(`🚀 Server started on http://localhost:${PORT}`);
});
