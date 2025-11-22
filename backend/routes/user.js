import express from "express";
import { authRequired } from "../middleware/auth.js";
import { pool } from "../db/connect.js";

const router = express.Router();

router.use(authRequired);

const NAV_TREE = [
  { id: "home", children: [] },
  { id: "apartment", children: [] },
  { id: "car", children: [] },
  {
    id: "analytics",
    children: ["analytics-home", "analytics-queue", "analytics-interview", "analytics-cheats", "analytics-tests", "analytics-settings"],
  },
  {
    id: "career",
    children: [
      "career-dashboard",
      "career-skills",
      "career-courses",
      "career-portfolio",
      "career-timeline",
      "career-analytics",
      "career-interviews",
      "career-knowledge",
      "career-export",
    ],
  },
  {
    id: "ai",
    children: ["ai-overview", "ai-n8n", "ai-promptmaster"],
  },
  {
    id: "accounting",
    children: [
      "accounting-dashboard",
      "accounting-accounts",
      "accounting-payments",
      "accounting-transactions",
      "accounting-incomes",
      "accounting-categories",
      "accounting-settings",
    ],
  },
  {
    id: "vpn",
    children: ["vpn-home", "vpn-outline", "vpn-outline-guide", "vpn-vless", "vpn-vless-guide", "vpn-routes"],
  },
  {
    id: "plants",
    children: [
      "plants-list",
      "plants-tools",
      "plants-problems",
      "plants-pests",
      "plants-diseases",
      "plants-medicines",
      "plants-settings",
    ],
  },
  {
    id: "admin",
    children: ["admin-home", "admin-users", "admin-content", "admin-logs", "admin-s3"],
  },
  { id: "docs", children: [] },
  { id: "posts", children: [] },
  { id: "settings", children: [] },
];

const NAV_CHILDREN = NAV_TREE.reduce((acc, item) => {
  acc[item.id] = new Set(item.children || []);
  return acc;
}, {});

function defaultNavLayout() {
  return NAV_TREE.map((item) => ({
    id: item.id,
    hidden: false,
    children: (item.children || []).map((childId) => ({ id: childId, hidden: false })),
  }));
}

function sanitizeNavLayout(rawLayout = []) {
  const normalized = Array.isArray(rawLayout) ? rawLayout : [];
  const result = [];
  const seenTop = new Set();
  const defaultsMap = new Map(defaultNavLayout().map((item) => [item.id, item]));

  for (const item of normalized) {
    const id = item?.id;
    if (!id || !NAV_CHILDREN[id] || seenTop.has(id)) continue;
    const allowedChildren = NAV_CHILDREN[id];
    const seenChild = new Set();
    const children = [];

    if (Array.isArray(item.children)) {
      for (const child of item.children) {
        const childId = child?.id;
        if (!childId || !allowedChildren.has(childId) || seenChild.has(childId)) continue;
        children.push({ id: childId, hidden: Boolean(child.hidden) });
        seenChild.add(childId);
      }
    }

    for (const childId of allowedChildren) {
      if (!seenChild.has(childId)) {
        children.push({ id: childId, hidden: false });
      }
    }

    result.push({ id, hidden: Boolean(item.hidden), children });
    seenTop.add(id);
    defaultsMap.delete(id);
  }

  for (const item of defaultsMap.values()) {
    result.push(item);
  }

  return result;
}

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

router.get("/nav-preferences", async (req, res) => {
  try {
    const userId = req.user.id;
    const existing = await pool.query("SELECT layout FROM navigation_preferences WHERE user_id = $1", [userId]);
    const savedLayout = existing.rows[0]?.layout || [];
    const layout = sanitizeNavLayout(savedLayout);

    if (!existing.rows[0]) {
      await pool.query(
        `INSERT INTO navigation_preferences (user_id, layout) VALUES ($1, $2::jsonb)`,
        [userId, JSON.stringify(layout)]
      );
    } else if (JSON.stringify(layout) !== JSON.stringify(savedLayout)) {
      await pool.query(
        `UPDATE navigation_preferences SET layout = $2::jsonb WHERE user_id = $1`,
        [userId, JSON.stringify(layout)]
      );
    }

    return res.json({ items: layout });
  } catch (e) {
    console.error("GET /user/nav-preferences", e);
    return res.status(500).json({ message: "Не удалось загрузить настройки навигации" });
  }
});

router.put("/nav-preferences", async (req, res) => {
  try {
    const userId = req.user.id;
    const incoming = req.body?.items || [];
    const layout = sanitizeNavLayout(incoming);

    await pool.query(
      `
        INSERT INTO navigation_preferences (user_id, layout)
        VALUES ($1, $2::jsonb)
        ON CONFLICT (user_id) DO UPDATE
        SET layout = EXCLUDED.layout, updated_at = NOW()
      `,
      [userId, JSON.stringify(layout)]
    );

    return res.json({ items: layout, message: "Навигация сохранена" });
  } catch (e) {
    console.error("PUT /user/nav-preferences", e);
    return res.status(500).json({ message: "Не удалось сохранить навигацию" });
  }
});

export default router;
