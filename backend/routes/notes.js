import express from "express";
import sanitizeHtml from "sanitize-html";
import { authRequired, requirePermission } from "../middleware/auth.js";
import { pool } from "../db/connect.js";

const router = express.Router();

const sanitizeOptions = {
  allowedTags: [
    "p",
    "br",
    "span",
    "strong",
    "em",
    "u",
    "s",
    "a",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "h1",
    "h2",
    "h3",
    "h4",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "img",
    "div",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    td: ["colspan", "rowspan", "style"],
    th: ["colspan", "rowspan", "style"],
    "*": ["style"],
  },
  allowedStyles: {
    "*": {
      color: [/^#[0-9a-f]{3,6}$/i, /^rgb(a)?\([\d\s.,%]+\)$/i],
      "background-color": [/^#[0-9a-f]{3,6}$/i, /^rgb(a)?\([\d\s.,%]+\)$/i],
      "font-size": [/^\d+(px|em|rem|%)$/i],
      "text-align": [/^(left|right|center|justify)$/i],
      "text-decoration": [/^(none|underline|line-through)$/i],
    },
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
};

router.use(authRequired);

router.get("/", async (_req, res) => {
  try {
    const q = await pool.query(
      "SELECT id, title, description, created_at, updated_at FROM notes ORDER BY updated_at DESC"
    );
    return res.json({ notes: q.rows });
  } catch (error) {
    console.error("GET /api/notes error", error);
    return res.status(500).json({ message: "Failed to load notes" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
    const q = await pool.query(
      "SELECT id, title, description, content, created_at, updated_at FROM notes WHERE id = $1",
      [id]
    );
    if (q.rows.length === 0) return res.status(404).json({ message: "Note not found" });
    return res.json({ note: q.rows[0] });
  } catch (error) {
    console.error("GET /api/notes/:id error", error);
    return res.status(500).json({ message: "Failed to load note" });
  }
});

router.post("/", requirePermission("admin_access"), async (req, res) => {
  try {
    const { title, description = "", content = "" } = req.body || {};
    const trimmedTitle = String(title || "").trim();
    if (!trimmedTitle) return res.status(400).json({ message: "title is required" });
    const shortDescription = String(description || "").slice(0, 200);
    const safeContent = sanitizeHtml(String(content || ""), sanitizeOptions);
    const inserted = await pool.query(
      "INSERT INTO notes (title, description, content) VALUES ($1, $2, $3) RETURNING id, title, description, content, created_at, updated_at",
      [trimmedTitle, shortDescription, safeContent]
    );
    return res.status(201).json({ note: inserted.rows[0] });
  } catch (error) {
    console.error("POST /api/notes error", error);
    return res.status(500).json({ message: "Failed to create note" });
  }
});

router.put("/:id", requirePermission("admin_access"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
    const { title, description = "", content = "" } = req.body || {};
    const trimmedTitle = String(title || "").trim();
    if (!trimmedTitle) return res.status(400).json({ message: "title is required" });
    const shortDescription = String(description || "").slice(0, 200);
    const safeContent = sanitizeHtml(String(content || ""), sanitizeOptions);
    const updated = await pool.query(
      `UPDATE notes
       SET title = $1,
           description = $2,
           content = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, title, description, content, created_at, updated_at`,
      [trimmedTitle, shortDescription, safeContent, id]
    );
    if (updated.rows.length === 0) return res.status(404).json({ message: "Note not found" });
    return res.json({ note: updated.rows[0] });
  } catch (error) {
    console.error("PUT /api/notes/:id error", error);
    return res.status(500).json({ message: "Failed to update note" });
  }
});

router.delete("/:id", requirePermission("admin_access"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
    const deleted = await pool.query("DELETE FROM notes WHERE id = $1 RETURNING id", [id]);
    if (deleted.rows.length === 0) return res.status(404).json({ message: "Note not found" });
    return res.json({ message: "Note deleted" });
  } catch (error) {
    console.error("DELETE /api/notes/:id error", error);
    return res.status(500).json({ message: "Failed to delete note" });
  }
});

export default router;
