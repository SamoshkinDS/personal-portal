import express from "express";
import { testConnection } from "../controllers/authController.js";
import { register, login, resetPassword, me, checkUsername } from "../controllers/authHandlers.js";

const router = express.Router();

// Health/test
router.get("/test", testConnection);

// Auth endpoints
router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", resetPassword);
router.get("/me", me);
router.get("/exists", checkUsername);

export default router;
