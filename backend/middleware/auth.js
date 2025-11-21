import { verifyJwt } from "../lib/jwt.js";

export function authRequired(req, res, next) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    const decoded = verifyJwt(token);
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

export function requirePermission(perms = [], mode = 'any') {
  const required = Array.isArray(perms) ? perms : [perms];
  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const { pool } = await import("../db/connect.js");
      const uq = await pool.query("SELECT role, is_blocked FROM users WHERE id = $1", [req.user.id]);
      if (uq.rows.length === 0) return res.status(404).json({ message: "User not found" });
      const { role, is_blocked } = uq.rows[0];
      if (is_blocked) return res.status(403).json({ message: "User is blocked" });
      // Superuser role grants all
      if (role === 'ALL' || required.length === 0) {
        req.user.role = role;
        return next();
      }
      const pq = await pool.query(
        "SELECT perm_key FROM user_permissions WHERE user_id = $1",
        [req.user.id]
      );
      const have = new Set(pq.rows.map(r => r.perm_key));
      const ok = mode === 'all'
        ? required.every(p => have.has(p))
        : required.some(p => have.has(p));
      if (!ok) return res.status(403).json({ message: "Forbidden" });
      req.user.role = role;
      req.user.permissions = Array.from(have);
      next();
    } catch (e) {
      console.error("requirePermission error", e);
      return res.status(500).json({ message: "Auth check failed" });
    }
  };
}
