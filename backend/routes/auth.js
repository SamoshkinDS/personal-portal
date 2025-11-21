import express from "express";
import { testConnection } from "../controllers/authController.js";
import { register, login, resetPassword, me, checkUsername } from "../controllers/authHandlers.js";
import { authRequired } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

const loginLimiter = rateLimit({ windowMs: 60_000, limit: 5, message: "Слишком много попыток входа. Подождите минуту." });
const registerLimiter = rateLimit({ windowMs: 60_000, limit: 3, message: "Попробуйте отправить заявку чуть позже." });
const existsLimiter = rateLimit({ windowMs: 60_000, limit: 10, message: "Слишком много проверок. Подождите минуту." });

// Health/test
router.get("/test", testConnection);

// Auth endpoints
router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/reset-password", authRequired, loginLimiter, resetPassword);
router.get("/me", authRequired, me);
router.get("/exists", existsLimiter, checkUsername);

export default router;
