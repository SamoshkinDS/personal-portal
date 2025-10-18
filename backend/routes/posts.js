import express from "express";
import { authRequired } from "../middleware/auth.js";
import { pool } from "../db/connect.js";

const router = express.Router();

router.use(authRequired);

// GET /api/posts - list current user's posts (newest first)
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const q = await pool.query(
      "SELECT id, text, created_at FROM user_posts WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return res.json({ posts: q.rows });
  } catch (e) {
    console.error("GET /posts", e);
    return res.status(500).json({ message: "Failed to load posts" });
  }
});

// POST /api/posts - create a new post
router.post("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const { text = "" } = req.body || {};
    const trimmed = String(text).trim();
    if (!trimmed) return res.status(400).json({ message: "text is required" });
    const ins = await pool.query(
      "INSERT INTO user_posts (user_id, text) VALUES ($1, $2) RETURNING id, text, created_at",
      [userId, trimmed]
    );
    return res.status(201).json({ post: ins.rows[0] });
  } catch (e) {
    console.error("POST /posts", e);
    return res.status(500).json({ message: "Failed to create post" });
  }
});

// DELETE /api/posts/:id - delete a post
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
    await pool.query("DELETE FROM user_posts WHERE user_id = $1 AND id = $2", [userId, id]);
    return res.json({ message: "Deleted" });
  } catch (e) {
    console.error("DELETE /posts/:id", e);
    return res.status(500).json({ message: "Failed to delete post" });
  }
});

export default router;

