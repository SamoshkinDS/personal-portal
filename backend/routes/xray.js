import express from "express";
import { authRequired, requirePermission } from "../middleware/auth.js";
import { execFile as _execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "path";
import { fileURLToPath } from "url";

const execFile = promisify(_execFile);

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SYNC_SCRIPT = path.resolve(__dirname, "../../scripts/sync_xray_users.sh");
const XRAY_SYNC_SCRIPT = process.env.XRAY_SYNC_SCRIPT || DEFAULT_SYNC_SCRIPT;

// Only admins may trigger system sync
router.use(authRequired, requirePermission(["admin_access"]));

// POST /api/xray/sync
router.post("/sync", async (req, res) => {
  try {
    const { stdout, stderr } = await execFile("sudo", ["bash", XRAY_SYNC_SCRIPT], {
      timeout: 30000,
      maxBuffer: 2 * 1024 * 1024,
    });
    res.json({ ok: true, stdout, stderr });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message, stdout: err.stdout || "", stderr: err.stderr || "" });
  }
});

export default router;
