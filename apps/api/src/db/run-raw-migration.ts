import postgres from "postgres";
import { env } from "../lib/env";

async function main() {
  console.log("Connecting to database...");
  const sql = postgres(env.DATABASE_URL, { max: 1 });
  try {
    console.log("Running migration query...");
    await sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS raw_text TEXT;`;
    console.log("Success: Column 'raw_text' added to 'resources' table.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await sql.end();
  }
}

main();
