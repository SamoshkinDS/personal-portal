import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/user.js";
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
        ADD COLUMN IF NOT EXISTS vpn_can_create BOOLEAN DEFAULT FALSE;
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
    console.log("DB: users, user_profiles, content_items, admin_logs are ready");
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
