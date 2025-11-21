import express from "express";
import { authRequired } from "../middleware/auth.js";
import { pool } from "../db/connect.js";
import { Agent } from "undici";
import { requirePermission } from "../middleware/auth.js";

const router = express.Router();

// Config
const OUTLINE_API_URL = process.env.OUTLINE_API_URL || ""; // e.g. https://server:9090/XXXXXXXX
const OUTLINE_CACHE_TTL_MS = Number(process.env.OUTLINE_CACHE_TTL_MS || 10000);
const OUTLINE_INSECURE = String(process.env.OUTLINE_API_INSECURE || "false").toLowerCase() === "true";

if (!OUTLINE_API_URL) {
  // eslint-disable-next-line no-console
  console.warn("[vpn] OUTLINE_API_URL is not set. /api/vpn endpoints will fail.");
}

// Simple in-memory cache
const cache = {
  keys: { data: null, at: 0 },
};

const vpnPermissionGuard = requirePermission(["view_vpn"]);

function withinTtl(ts) {
  return Date.now() - ts < OUTLINE_CACHE_TTL_MS;
}

const insecureDispatcher = new Agent({ connect: { rejectUnauthorized: false } });

async function outlineFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${OUTLINE_API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...(OUTLINE_INSECURE ? { dispatcher: insecureDispatcher } : {}),
  });
  return res;
}

async function ensureVpnAccess(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const userQ = await pool.query("SELECT role, vpn_can_create, is_blocked FROM users WHERE id = $1", [userId]);
    if (!userQ.rows.length) return res.status(404).json({ message: "User not found" });
    const { role, vpn_can_create: vpnCanCreate, is_blocked: isBlocked } = userQ.rows[0];
    if (isBlocked) return res.status(403).json({ message: "User is blocked" });
    if (role === "ALL" || role === "VPN" || vpnCanCreate) {
      return next();
    }
    return vpnPermissionGuard(req, res, next);
  } catch (error) {
    console.error("[vpn] access check failed", error);
    return res.status(500).json({ message: "Failed to verify permissions" });
  }
}

// All VPN routes require auth and explicit permission/flag
router.use(authRequired, ensureVpnAccess);

// List access keys
router.get("/outline/keys", async (req, res) => {
  try {
    if (cache.keys.data && withinTtl(cache.keys.at)) {
      return res.json({ keys: cache.keys.data });
    }
    const r = await outlineFetch("/access-keys");
    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ message: "Outline upstream error", status: r.status, text });
    }
    const data = await r.json();
    const keys = data?.accessKeys || [];
    cache.keys = { data: keys, at: Date.now() };
    return res.json({ keys });
  } catch (e) {
    console.error("GET /api/vpn/outline/keys", e);
    return res.status(500).json({ message: "Failed to fetch keys" });
  }
});

// Create access key
router.post("/outline/keys", async (req, res) => {
  try {
    const { name } = req.body || {};
    // Fine-grained permission: allow creation only if user.vpn_can_create or role ALL
    try {
      const q = await pool.query("SELECT role, vpn_can_create FROM users WHERE id = $1", [req.user.id]);
      const row = q.rows[0];
      const role = row?.role || "NON_ADMIN";
      let can = !!row?.vpn_can_create || role === "ALL";
      if (!can) {
        const pq = await pool.query("SELECT 1 FROM user_permissions WHERE user_id = $1 AND perm_key = 'vpn_create'", [req.user.id]);
        can = pq.rows.length > 0;
      }
      if (!can) return res.status(403).json({ message: "Creation not allowed" });
    } catch (e) {
      // if error reading, be conservative
      return res.status(500).json({ message: "Permission check failed" });
    }
    const r = await outlineFetch("/access-keys", { method: "POST" });
    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ message: "Outline upstream error", status: r.status, text });
    }
    const created = await r.json();
    // Optional: set name
    if (name && created?.id) {
      await outlineFetch(`/access-keys/${created.id}/name`, {
        method: "PUT",
        body: JSON.stringify({ name: String(name) }),
      });
      // refresh created after name set is not necessary; clients can reload list
    }
    cache.keys = { data: null, at: 0 }; // bust cache
    return res.status(201).json({ key: created });
  } catch (e) {
    console.error("POST /api/vpn/outline/keys", e);
    return res.status(500).json({ message: "Failed to create key" });
  }
});

// Delete key
router.delete("/outline/keys/:id", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ message: "id is required" });
    const r = await outlineFetch(`/access-keys/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ message: "Outline upstream error", status: r.status, text });
    }
    cache.keys = { data: null, at: 0 }; // bust cache
    return res.json({ message: "Deleted" });
  } catch (e) {
    console.error("DELETE /api/vpn/outline/keys/:id", e);
    return res.status(500).json({ message: "Failed to delete key" });
  }
});

// Rename key
router.put("/outline/keys/:id/name", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    const { name } = req.body || {};
    if (!id) return res.status(400).json({ message: "id is required" });
    if (!name) return res.status(400).json({ message: "name is required" });
    const r = await outlineFetch(`/access-keys/${encodeURIComponent(id)}/name`, {
      method: "PUT",
      body: JSON.stringify({ name: String(name) })
    });
    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ message: "Outline upstream error", status: r.status, text });
    }
    cache.keys = { data: null, at: 0 }; // bust cache
    return res.json({ message: "Renamed" });
  } catch (e) {
    console.error("PUT /api/vpn/outline/keys/:id/name", e);
    return res.status(500).json({ message: "Failed to rename key" });
  }
});

// Metrics: bytes transferred per key
router.get("/outline/metrics", async (req, res) => {
  try {
    const r = await outlineFetch("/metrics/transfer");
    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ message: "Outline upstream error", status: r.status, text });
    }
    const data = await r.json();
    return res.json(data);
  } catch (e) {
    console.error("GET /api/vpn/outline/metrics", e);
    return res.status(500).json({ message: "Failed to fetch metrics" });
  }
});

// Server info (includes global accessKeyDataLimit)
router.get("/outline/server", async (req, res) => {
  try {
    const r = await outlineFetch("/server");
    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ message: "Outline upstream error", status: r.status, text });
    }
    const data = await r.json();
    return res.json(data);
  } catch (e) {
    console.error("GET /api/vpn/outline/server", e);
    return res.status(500).json({ message: "Failed to fetch server info" });
  }
});

// Set per-key data limit
router.put("/outline/keys/:id/data-limit", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    const { bytes } = req.body || {};
    if (!id) return res.status(400).json({ message: "id is required" });
    if (!(Number.isFinite(bytes) || (typeof bytes === 'string' && bytes.trim() !== '')))
      return res.status(400).json({ message: "bytes is required" });
    const value = Number(bytes);
    if (!Number.isFinite(value) || value < 0) return res.status(400).json({ message: "invalid bytes" });
    const r = await outlineFetch(`/access-keys/${encodeURIComponent(id)}/data-limit`, {
      method: "PUT",
      body: JSON.stringify({ bytes: value })
    });
    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ message: "Outline upstream error", status: r.status, text });
    }
    return res.json({ message: "Limit set" });
  } catch (e) {
    console.error("PUT /api/vpn/outline/keys/:id/data-limit", e);
    return res.status(500).json({ message: "Failed to set limit" });
  }
});

// Remove per-key data limit
router.delete("/outline/keys/:id/data-limit", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ message: "id is required" });
    const r = await outlineFetch(`/access-keys/${encodeURIComponent(id)}/data-limit`, { method: "DELETE" });
    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ message: "Outline upstream error", status: r.status, text });
    }
    return res.json({ message: "Limit removed" });
  } catch (e) {
    console.error("DELETE /api/vpn/outline/keys/:id/data-limit", e);
    return res.status(500).json({ message: "Failed to remove limit" });
  }
});

// Set global default per-key data limit
router.put("/outline/server/access-key-data-limit", async (req, res) => {
  try {
    const { bytes } = req.body || {};
    const value = Number(bytes);
    if (!Number.isFinite(value) || value < 0) return res.status(400).json({ message: "invalid bytes" });
    const r = await outlineFetch(`/server/access-key-data-limit`, {
      method: "PUT",
      body: JSON.stringify({ bytes: value })
    });
    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ message: "Outline upstream error", status: r.status, text });
    }
    return res.json({ message: "Global limit set" });
  } catch (e) {
    console.error("PUT /api/vpn/outline/server/access-key-data-limit", e);
    return res.status(500).json({ message: "Failed to set global limit" });
  }
});

// Remove global default per-key data limit
router.delete("/outline/server/access-key-data-limit", async (req, res) => {
  try {
    const r = await outlineFetch(`/server/access-key-data-limit`, { method: "DELETE" });
    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ message: "Outline upstream error", status: r.status, text });
    }
    return res.json({ message: "Global limit removed" });
  } catch (e) {
    console.error("DELETE /api/vpn/outline/server/access-key-data-limit", e);
    return res.status(500).json({ message: "Failed to remove global limit" });
  }
});

export default router;
