import { pool } from "../db/connect.js";

export const testConnection = async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "✅ Database connected successfully!",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database connection failed", error });
  }
};
