/**
 * Database migration runner.
 *
 * Applies all pending Drizzle migrations from the `drizzle/migrations` directory.
 *
 * Usage:
 *   node -r tsx apps/api/src/db/migrate.ts
 *   pnpm --filter @workspace/api db:migrate
 *
 * This script connects directly to the database (not through the pooler) to
 * ensure migrations run in a single session, then disconnects cleanly.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "path";
import { env } from "../lib/env";

async function runMigrations() {
  console.log("⏳ Running database migrations…");

  // Use a single-connection client for migrations (no pooling).
  const client = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  const migrationsFolder = path.resolve(__dirname, "../../drizzle/migrations");

  try {
    await migrate(db, { migrationsFolder });
    console.log("✅ Migrations applied successfully.");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
    console.log("🔌 Database connection closed.");
  }
}

runMigrations();
