import dotenv from "dotenv";
import { fileURLToPath } from "url";

const envPath = fileURLToPath(new URL("../.env", import.meta.url));
console.log("Loading env from", envPath);
const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
  console.error("Failed to load env", envResult.error);
  process.exit(1);
}

console.log("DB creds", {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  passwordType: typeof process.env.DB_PASSWORD,
  passwordLength: process.env.DB_PASSWORD?.length,
});

const { ensureCheatSchema } = await import("../db/cheatSchema.js");

try {
  await ensureCheatSchema();
  console.log("✅ cheat_articles table is ready");
} catch (err) {
  console.error("❌ Failed to ensure cheat schema", err);
  process.exit(1);
}
