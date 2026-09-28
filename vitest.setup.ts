import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

config({
  path: path.join(rootDir, ".env"),
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL was not loaded from the root .env");
}
