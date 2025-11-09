import express from "express";
import { authRequired, requirePermission } from "../middleware/auth.js";
import { exec as _exec, spawn } from "node:child_process";
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
const backendUpdateLogPath =
  process.env.PORTAL_BACKEND_UPDATE_LOG || "/var/log/personal-portal/backend-update.log";

async function recordAdminAction(username, action) {
  try {
    const { pool } = await import("../db/connect.js");
    await pool.query("INSERT INTO admin_logs (message) VALUES ($1)", [
      `[actions] ${username || "unknown"} executed ${action}`,
    ]);
  } catch (logErr) {
    console.warn("[actions] failed to log admin action:", logErr.message || logErr);
  }
}

function runBackendUpdateInBackground(scriptPath) {
  const logDir = path.dirname(backendUpdateLogPath);
  fs.mkdirSync(logDir, { recursive: true });
  const header = `\n[${new Date().toISOString()}] Backend update triggered\n`;
  fs.appendFileSync(backendUpdateLogPath, header);

  const stdoutFd = fs.openSync(backendUpdateLogPath, "a");
  const stderrFd = fs.openSync(backendUpdateLogPath, "a");

  const closeStreams = () => {
    try {
      fs.closeSync(stdoutFd);
    } catch {}
    try {
      fs.closeSync(stderrFd);
    } catch {}
  };

  let subprocess;
  try {
    subprocess = spawn("bash", [scriptPath], {
      cwd: projectRoot,
      detached: true,
      stdio: ["ignore", stdoutFd, stderrFd],
    });
  } catch (spawnErr) {
    closeStreams();
    throw spawnErr;
  }

  subprocess.on("error", (err) => {
    closeStreams();
    console.error("[actions] backend update spawn failed:", err.message || err);
  });

  subprocess.on("close", closeStreams);
  subprocess.unref();
}

router.post("/:action/run", async (req, res) => {
  const { action } = req.params;
  const scriptPath = scriptMap[action];
  if (!scriptPath) {
    return res.status(404).json({ ok: false, error: "Unknown action" });
  }

  if (!fs.existsSync(scriptPath)) {
    return res.status(404).json({ ok: false, error: `Script not found: ${scriptPath}` });
  }

  if (action === "backend-update") {
    try {
      runBackendUpdateInBackground(scriptPath);
      await recordAdminAction(req.user?.username, action);
      return res.json({ ok: true, message: "Backend update started" });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err.message || "Failed to start backend update",
      });
    }
  }

  try {
    const { stdout, stderr } = await exec(`bash "${scriptPath}"`, {
      cwd: projectRoot,
      timeout: RUN_TIMEOUT_MS,
      maxBuffer: MAX_BUFFER,
    });

    await recordAdminAction(req.user?.username, action);

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
