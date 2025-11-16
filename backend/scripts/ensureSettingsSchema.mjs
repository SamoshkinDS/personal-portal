import dotenv from "dotenv";
import { fileURLToPath } from "url";

const envPath = fileURLToPath(new URL("../.env", import.meta.url));
console.log("Loading env for settings schema from", envPath);
const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
  console.error("Failed to load env", envResult.error);
  process.exit(1);
}

const { ensureSettingsSchema } = await import("../db/settingsSchema.js");

try {
  await ensureSettingsSchema();
  console.log("✅ settings table is ready");
} catch (err) {
  console.error("❌ Failed to ensure settings schema", err);
  process.exit(1);
}
