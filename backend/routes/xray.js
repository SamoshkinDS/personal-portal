import express from "express";
import { authRequired, requirePermission } from "../middleware/auth.js";
import { exec as _exec } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(_exec);

const router = express.Router();

// Only admins may trigger system sync
router.use(authRequired, requirePermission(["admin_access"]));

// POST /api/xray/sync
router.post("/sync", async (req, res) => {
  const script = process.env.XRAY_SYNC_SCRIPT || "/opt/xray/sync_xray_users.sh";
  try {
    const { stdout, stderr } = await exec(`sudo ${script}`, {
      timeout: 30000,
      maxBuffer: 2 * 1024 * 1024,
    });
    res.json({ ok: true, stdout, stderr });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message, stdout: err.stdout || "", stderr: err.stderr || "" });
  }
});

export default router;

