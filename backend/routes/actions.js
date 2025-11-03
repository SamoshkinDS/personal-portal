import express from "express";
import { authRequired, requirePermission } from "../middleware/auth.js";
import { exec as _exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const exec = promisify(_exec);

const router = express.Router();

router.use(authRequired, requirePermission(["admin_access"]));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "..");
const projectRoot = path.resolve(backendDir, "..");
const scriptsDir = path.resolve(projectRoot, "scripts");

const scriptMap = {
  "git-pull": process.env.PORTAL_SCRIPT_GIT_PULL || path.join(scriptsDir, "git_pull.sh"),
  "backend-update": process.env.PORTAL_SCRIPT_BACKEND || path.join(scriptsDir, "update_backend.sh"),
  "frontend-build": process.env.PORTAL_SCRIPT_FRONTEND || path.join(scriptsDir, "update_frontend.sh"),
  "deploy-full": process.env.PORTAL_SCRIPT_DEPLOY || path.join(projectRoot, "deploy.sh"),
};

const RUN_TIMEOUT_MS = Number(process.env.PORTAL_SCRIPT_TIMEOUT_MS || 120000);
const MAX_BUFFER = Number(process.env.PORTAL_SCRIPT_BUFFER || 6 * 1024 * 1024);

router.post("/:action/run", async (req, res) => {
  const { action } = req.params;
  const scriptPath = scriptMap[action];
  if (!scriptPath) {
    return res.status(404).json({ ok: false, error: "Unknown action" });
  }

  if (!fs.existsSync(scriptPath)) {
    return res.status(404).json({ ok: false, error: `Script not found: ${scriptPath}` });
  }

  try {
    const { stdout, stderr } = await exec(`bash "${scriptPath}"`, {
      cwd: projectRoot,
      timeout: RUN_TIMEOUT_MS,
      maxBuffer: MAX_BUFFER,
    });

    try {
      const { pool } = await import("../db/connect.js");
      await pool.query("INSERT INTO admin_logs (message) VALUES ($1)", [
        `[actions] ${req.user?.username || "unknown"} executed ${action}`,
      ]);
    } catch (logErr) {
      console.warn("[actions] failed to log admin action:", logErr.message || logErr);
    }

    return res.json({
      ok: true,
      message: `Action ${action} completed`,
      stdout,
      stderr,
    });
  } catch (err) {
    const stdout = err.stdout || "";
    const stderr = err.stderr || "";
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to run script",
      stdout,
      stderr,
    });
  }
});

export default router;
