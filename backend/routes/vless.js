import express from "express";
import { v4 as uuidv4 } from "uuid";
import { authRequired, requireRole, requirePermission } from "../middleware/auth.js";
import { pool } from "../db/connect.js";
import {
  getStatsByUUID,
  getXrayUserTraffic,
  getVlessHistory,
  syncVlessStats,
  getDefaultVlessEmail,
} from "../services/xray.js";

const router = express.Router();

const VLESS_DOMAIN = process.env.VLESS_DOMAIN || "";
const VLESS_PORT = process.env.VLESS_PORT || "";
const VLESS_TEMPLATE = process.env.VLESS_TEMPLATE || "";

function buildConfigUrl(uuid) {
  if (VLESS_TEMPLATE) {
    return VLESS_TEMPLATE
      .replaceAll("${UUID}", uuid)
      .replaceAll("${VLESS_DOMAIN}", VLESS_DOMAIN)
      .replaceAll("${VLESS_PORT}", String(VLESS_PORT));
  }
  if (!VLESS_DOMAIN) return `vless://${uuid}`;
  const portPart = VLESS_PORT ? `:${VLESS_PORT}` : "";
  return `vless://${uuid}@${VLESS_DOMAIN}${portPart}`;
}

async function hydrateKey(row) {
  const stats = row.stats_json || {};
  let updatedStats = stats;
  try {
    const fetched = await getStatsByUUID(row.uuid);
    if (fetched && typeof fetched === "object" && !Array.isArray(fetched)) {
      updatedStats = fetched;
      if (JSON.stringify(fetched) !== JSON.stringify(stats)) {
        await pool.query("UPDATE vless_keys SET stats_json = $1 WHERE id = $2", [fetched, row.id]);
      }
    }
  } catch (err) {
    console.error(`[vless] Failed to load stats for ${row.uuid}`, err);
  }
  return {
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    comment: row.comment,
    created_at: row.created_at,
    stats_json: updatedStats,
    config_url: buildConfigUrl(row.uuid),
  };
}

router.use(authRequired, requireRole(["ALL", "VPN", "NON_ADMIN"]));

router.get("/keys", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, uuid::text AS uuid, name, comment, created_at, stats_json FROM vless_keys ORDER BY created_at DESC, id DESC"
    );
    const keys = await Promise.all(rows.map((row) => hydrateKey(row)));
    res.json({ keys });
  } catch (err) {
    console.error("GET /api/vless/keys", err);
    res.status(500).json({ message: "Failed to load keys" });
  }
});

router.post("/keys", async (req, res) => {
  try {
    const { name, comment } = req.body || {};
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "name is required" });
    }
    const newUuid = uuidv4();
    const insertQuery = `
      INSERT INTO vless_keys (uuid, name, comment)
      VALUES ($1, $2, $3)
      RETURNING id, uuid::text AS uuid, name, comment, created_at, stats_json
    `;
    const { rows } = await pool.query(insertQuery, [newUuid, name.trim(), comment ? String(comment).trim() : null]);
    const key = await hydrateKey(rows[0]);
    res.status(201).json({ key });
  } catch (err) {
    console.error("POST /api/vless/keys", err);
    res.status(500).json({ message: "Failed to create key" });
  }
});

router.patch("/keys/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const { name, comment } = req.body || {};
    const updates = [];
    const values = [id];

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "name must be a non-empty string" });
      }
      updates.push(`name = $${values.length + 1}`);
      values.push(name.trim());
    }

    if (comment !== undefined) {
      const normalized = comment === null ? null : String(comment).trim();
      updates.push(`comment = $${values.length + 1}`);
      values.push(normalized && normalized.length > 0 ? normalized : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const updateQuery = `
      UPDATE vless_keys
      SET ${updates.join(", ")}
      WHERE id = $1
      RETURNING id, uuid::text AS uuid, name, comment, created_at, stats_json
    `;
    const { rows } = await pool.query(updateQuery, values);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Key not found" });
    }
    const key = await hydrateKey(rows[0]);
    res.json({ key });
  } catch (err) {
    console.error("PATCH /api/vless/keys/:id", err);
    res.status(500).json({ message: "Failed to update key" });
  }
});

router.delete("/keys/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const { rowCount } = await pool.query("DELETE FROM vless_keys WHERE id = $1", [id]);
    if (rowCount === 0) {
      return res.status(404).json({ message: "Key not found" });
    }
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /api/vless/keys/:id", err);
    res.status(500).json({ message: "Failed to delete key" });
  }
});

router.get("/stats/:email", requirePermission(["admin_access"]), async (req, res) => {
  try {
    const emailParam = String(req.params.email || "").trim();
    const resolvedEmail =
      emailParam && emailParam.toLowerCase() !== "default" ? emailParam : getDefaultVlessEmail();
    if (!resolvedEmail) {
      return res.status(400).json({ message: "email is required" });
    }
    const stats = await getXrayUserTraffic(resolvedEmail);
    res.json({ stats });
  } catch (err) {
    if (err?.status === 503) {
      return res.status(503).json({ error: "Xray API unreachable" });
    }
    console.error("GET /api/vless/stats/:email", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
});

router.post("/sync", requirePermission(["admin_access"]), async (req, res) => {
  try {
    const emails = Array.isArray(req.body?.emails) ? req.body.emails : undefined;
    const results = await syncVlessStats({ emails });
    res.json({ synced: results });
  } catch (err) {
    if (err?.status === 503) {
      return res.status(503).json({ error: "Xray API unreachable" });
    }
    console.error("POST /api/vless/sync", err);
    res.status(500).json({ message: "Failed to sync stats" });
  }
});

router.get("/stats/history/:email", requirePermission(["admin_access"]), async (req, res) => {
  try {
    const emailParam = String(req.params.email || "").trim();
    const resolvedEmail =
      emailParam && emailParam.toLowerCase() !== "default" ? emailParam : getDefaultVlessEmail();
    if (!resolvedEmail) {
      return res.status(400).json({ message: "email is required" });
    }
    const range = req.query?.range === "30" ? 30 : 7;
    const history = await getVlessHistory(resolvedEmail, range);
    res.json(history);
  } catch (err) {
    console.error("GET /api/vless/stats/history/:email", err);
    res.status(500).json({ message: "Failed to load stats history" });
  }
});

export default router;
