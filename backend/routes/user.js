import express from "express";
import { authRequired } from "../middleware/auth.js";
import { pool } from "../db/connect.js";

const router = express.Router();

router.use(authRequired);

router.get("/profile", async (req, res) => {
  try {
    const id = req.user.id;
    const q = await pool.query(
      "SELECT user_id, name, email, phone FROM user_profiles WHERE user_id = $1",
      [id]
    );
    if (q.rows.length === 0) return res.json({ profile: { name: "", email: "", phone: "" } });
    return res.json({ profile: q.rows[0] });
  } catch (e) {
    console.error("GET /user/profile", e);
    return res.status(500).json({ message: "Failed to load profile" });
  }
});

router.put("/profile", async (req, res) => {
  try {
    const id = req.user.id;
    const { name = "", email = "", phone = "" } = req.body || {};
    await pool.query(
      `INSERT INTO user_profiles (user_id, name, email, phone)
         VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id)
         DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, updated_at = NOW()`,
      [id, name, email, phone]
    );
    return res.json({ message: "Saved" });
  } catch (e) {
    console.error("PUT /user/profile", e);
    return res.status(500).json({ message: "Failed to save profile" });
  }
});

export default router;

