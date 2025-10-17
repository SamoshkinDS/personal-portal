import { pool } from "../db/connect.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const register = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: "username and password are required" });
    }

    const exists = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const hash = await bcrypt.hash(password, 10);
    const insert = await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at, role, is_blocked, vpn_can_create",
      [username, hash]
    );
    const user = insert.rows[0];
    return res.status(201).json({ message: "Registered successfully", user });
  } catch (error) {
    console.error("register error", error);
    return res.status(500).json({ message: "Registration failed", error: String(error) });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: "username and password are required" });
    }
    const q = await pool.query(
      "SELECT id, username, password_hash, role, is_blocked, vpn_can_create FROM users WHERE username = $1",
      [username]
    );
    if (q.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const user = q.rows[0];
    if (user.is_blocked) {
      return res.status(403).json({ message: "User is blocked" });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const payload = { sub: user.id, username: user.username };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.json({ token, user: { id: user.id, username: user.username, role: user.role, vpnCanCreate: user.vpn_can_create } });
  } catch (error) {
    console.error("login error", error);
    return res.status(500).json({ message: "Login failed", error: String(error) });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { username, newPassword } = req.body || {};
    if (!username || !newPassword) {
      return res.status(400).json({ message: "username and newPassword are required" });
    }
    const q = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (q.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE username = $2",
      [hash, username]
    );
    return res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("resetPassword error", error);
    return res.status(500).json({ message: "Password reset failed", error: String(error) });
  }
};

export const me = async (req, res) => {
  try {
    const auth = req.headers["authorization"] || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "No token provided" });
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const userQ = await pool.query(
      "SELECT id, username, created_at, role, is_blocked, vpn_can_create FROM users WHERE id = $1",
      [decoded.sub]
    );
    if (userQ.rows.length === 0) return res.status(404).json({ message: "User not found" });
    const u = userQ.rows[0];
    if (u.is_blocked) return res.status(403).json({ message: "User is blocked" });
    return res.json({ user: { id: u.id, username: u.username, created_at: u.created_at, role: u.role, vpnCanCreate: u.vpn_can_create } });
  } catch (error) {
    console.error("me error", error);
    return res.status(500).json({ message: "Failed to fetch user", error: String(error) });
  }
};

export const checkUsername = async (req, res) => {
  try {
    const { username } = req.query || {};
    if (!username) return res.status(400).json({ message: "username is required" });
    const q = await pool.query("SELECT 1 FROM users WHERE username = $1", [username]);
    return res.json({ exists: q.rows.length > 0 });
  } catch (error) {
    console.error("checkUsername error", error);
    return res.status(500).json({ message: "Check failed", error: String(error) });
  }
};
