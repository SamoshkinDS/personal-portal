import { pool } from "../db/connect.js";
import bcrypt from "bcrypt";
import { signJwt } from "../lib/jwt.js";

export const register = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: "username and password are required" });
    }

    const loginTrimmed = String(username || "").trim();
    const passwordStr = String(password || "");
    if (loginTrimmed.length < 3 || loginTrimmed.length > 50 || !/^[A-Za-z0-9]+$/.test(loginTrimmed)) {
      return res.status(400).json({ message: "Логин должен содержать минимум 3 латинских символа или цифры" });
    }
    if (passwordStr.length < 8 || passwordStr.length > 120 || !/^[A-Za-z0-9]+$/.test(passwordStr)) {
      return res.status(400).json({ message: "Пароль должен быть не короче 8 символов, только латиница и цифры" });
    }

    const existsUser = await pool.query("SELECT id FROM users WHERE username = $1", [loginTrimmed]);
    if (existsUser.rows.length > 0) {
      return res.status(409).json({ message: "Логин уже занят" });
    }

    const existingRequest = await pool.query("SELECT status FROM registration_requests WHERE login = $1", [loginTrimmed]);
    if (existingRequest.rows.length > 0) {
      const status = existingRequest.rows[0].status;
      if (status === "pending") return res.status(409).json({ message: "Заявка уже отправлена и ожидает подтверждения" });
      if (status === "approved") return res.status(409).json({ message: "Пользователь уже одобрен" });
    }

    const hash = await bcrypt.hash(passwordStr, 10);
    await pool.query(
      `INSERT INTO registration_requests (login, password_hash, status)
       VALUES ($1, $2, 'pending')
       ON CONFLICT (login) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'pending', updated_at = NOW()`,
      [loginTrimmed, hash]
    );

    return res.status(201).json({ message: "Заявка отправлена. После подтверждения вы сможете войти." });
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
    const loginTrimmed = String(username || "").trim();
    const passwordStr = String(password || "");
    if (!loginTrimmed || loginTrimmed.length > 50 || passwordStr.length > 120) {
      return res.status(400).json({ message: "Неверные логин или пароль" });
    }
    const q = await pool.query(
      "SELECT id, username, password_hash, role, is_blocked, vpn_can_create FROM users WHERE username = $1",
      [loginTrimmed]
    );
    if (q.rows.length === 0) {
      // check registration request statuses
      const reqQ = await pool.query("SELECT status FROM registration_requests WHERE login = $1", [loginTrimmed]);
      if (reqQ.rows.length) {
        const status = reqQ.rows[0].status;
        if (status === "pending") return res.status(403).json({ message: "Ваша заявка ещё не подтверждена." });
        if (status === "rejected") return res.status(403).json({ message: "Заявка отклонена." });
      }
      return res.status(401).json({ message: "Неверные логин или пароль" });
    }
    const user = q.rows[0];
    if (user.is_blocked) {
      return res.status(403).json({ message: "Пользователь заблокирован" });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Неверные логин или пароль" });
    }
    await pool.query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);
    const payload = { sub: user.id, username: user.username };
    const token = signJwt(payload);
    // Load permissions
    const permsQ = await pool.query("SELECT perm_key FROM user_permissions WHERE user_id = $1", [user.id]);
    const permissions = permsQ.rows.map(r => r.perm_key);
    return res.json({ token, user: { id: user.id, username: user.username, role: user.role, vpnCanCreate: user.vpn_can_create, permissions } });
  } catch (error) {
    console.error("login error", error);
    return res.status(500).json({ message: "Login failed", error: String(error) });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body || {};
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }
    const q = await pool.query("SELECT id, password_hash FROM users WHERE id = $1", [userId]);
    if (q.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const passwordStr = String(newPassword || "");
    if (passwordStr.length < 8 || passwordStr.length > 120 || !/^[A-Za-z0-9]+$/.test(passwordStr)) {
      return res.status(400).json({ message: "Пароль должен быть не короче 8 символов, только латиница и цифры" });
    }
    const currentOk = await bcrypt.compare(String(currentPassword || ""), q.rows[0].password_hash);
    if (!currentOk) {
      return res.status(401).json({ message: "Текущий пароль не совпадает" });
    }
    const hash = await bcrypt.hash(passwordStr, 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, userId]);
    return res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("resetPassword error", error);
    return res.status(500).json({ message: "Password reset failed", error: String(error) });
  }
};

export const me = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "No token provided" });
    const userQ = await pool.query(
      "SELECT id, username, created_at, role, is_blocked, vpn_can_create FROM users WHERE id = $1",
      [userId]
    );
    if (userQ.rows.length === 0) return res.status(404).json({ message: "User not found" });
    const u = userQ.rows[0];
    if (u.is_blocked) return res.status(403).json({ message: "User is blocked" });
    const permsQ = await pool.query("SELECT perm_key FROM user_permissions WHERE user_id = $1", [u.id]);
    const permissions = permsQ.rows.map(r => r.perm_key);
    return res.json({ user: { id: u.id, username: u.username, created_at: u.created_at, role: u.role, vpnCanCreate: u.vpn_can_create, permissions } });
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
    const rq = await pool.query("SELECT 1 FROM registration_requests WHERE login = $1 AND status IN ('pending','approved')", [username]);
    return res.json({ exists: q.rows.length > 0 || rq.rows.length > 0 });
  } catch (error) {
    console.error("checkUsername error", error);
    return res.status(500).json({ message: "Check failed", error: String(error) });
  }
};
