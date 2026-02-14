import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL");
});

// Lightweight SQL debug to trace param usage causing 42P18
const __origQuery = pool.query.bind(pool);
pool.query = async (text, params) => {
  const debug = process.env.DEBUG_SQL === "1";
  if (debug) {
    try {
      const sql = String(text || "");
      const trimmed = sql.replace(/\s+/g, " ").trim();
      const pcount = Array.isArray(params) ? params.length : 0;
      const markers = ["$1", "$2", "$3", "$4"].filter((m) => trimmed.includes(m));
      console.log(`[sql] ${trimmed.slice(0, 280)} :: params=${pcount} markers=${markers.join(',')}`);
    } catch {}
  }
  try {
    return await __origQuery(text, params);
  } catch (e) {
    if (debug) {
      try {
        const sql = String(text || "");
        const pcount = Array.isArray(params) ? params.length : 0;
        console.error("[sql-error]", e?.code || e?.message, {
          markers: ["$1", "$2", "$3", "$4"].filter((m) => sql.includes(m)),
          paramsCount: pcount,
        });
      } catch {}
    }
    throw e;
  }
};
