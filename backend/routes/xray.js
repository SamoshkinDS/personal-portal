import express from "express";
import { authRequired, requirePermission } from "../middleware/auth.js";
import { execFile as _execFile, spawn as _spawn } from "node:child_process";
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
    const env = { ...process.env, XRAY_SYNC_NONINTERACTIVE: "1" };
    const isRoot = typeof process.getuid === "function" && process.getuid() === 0;
    const program = isRoot ? "bash" : "sudo";
    const args = isRoot ? [XRAY_SYNC_SCRIPT] : ["-n", "bash", XRAY_SYNC_SCRIPT];

    // Запускаем асинхронно, чтобы успеть ответить до рестарта Xray (иначе VPN рвёт соединение)
    const child = _spawn(program, args, {
      env,
      detached: true,
      stdio: "ignore",
    });
    child.unref();
    res.json({ ok: true, started: true, pid: child.pid });
  } catch (err) {
    const stderr = String(err.stderr || "");
    const passwordError = stderr.includes("a password is required") || stderr.includes("terminal is required");
    const timedOut = err.killed === true && err.signal === "SIGTERM";
    const errorMessage = passwordError
      ? "Недостаточно прав: настройте sudo без запроса пароля для XRAY_SYNC_SCRIPT."
      : timedOut
      ? "Тайм-аут выполнения скрипта (30 сек). Проверьте логи xray и права."
      : err.message;
    res.status(500).json({ ok: false, error: errorMessage, stdout: err.stdout || "", stderr });
  }
});

export default router;
