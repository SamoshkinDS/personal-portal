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

const { ensureTestsSchema } = await import("../db/testsSchema.js");

try {
  await ensureTestsSchema();
  console.log("✅ tests & questions tables are ready");
} catch (err) {
  console.error("❌ Failed to ensure tests schema", err);
  process.exit(1);
}
