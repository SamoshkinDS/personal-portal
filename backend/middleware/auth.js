import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

export function authRequired(req, res, next) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.sub, username: decoded.username };
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(roles = []) {
  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      // role lookup could be cached; simple query for now
      const { pool } = await import("../db/connect.js");
      const q = await pool.query("SELECT role, is_blocked FROM users WHERE id = $1", [req.user.id]);
      if (q.rows.length === 0) return res.status(404).json({ message: "User not found" });
      const { role, is_blocked } = q.rows[0];
      if (is_blocked) return res.status(403).json({ message: "User is blocked" });
      if (roles.length && !roles.includes(role)) return res.status(403).json({ message: "Forbidden" });
      req.user.role = role;
      next();
    } catch (e) {
      console.error("requireRole error", e);
      return res.status(500).json({ message: "Auth check failed" });
    }
  };
}

