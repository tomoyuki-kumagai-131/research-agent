import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, "../../../.env");
const result = config({ path: envPath });

if (result.error) {
  console.warn(
    `[env] .env not loaded from ${envPath} (${result.error.message}). Using process env only.`,
  );
} else {
  console.log(`[env] loaded ${envPath}`);
}
