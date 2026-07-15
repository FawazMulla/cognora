const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Manually parse simple .env file
const envPath = path.join(__dirname, '../../.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    // Remove quotes if present
    if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

async function main() {
  console.log("Connecting to database using direct JS postgres...");
  if (!env.DATABASE_URL) {
    console.error("DATABASE_URL not found in .env at", envPath);
    process.exit(1);
  }
  const sql = postgres(env.DATABASE_URL, { max: 1 });
  try {
    console.log("Running migration query...");
    await sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS raw_text TEXT;`;
    console.log("Success: Column 'raw_text' added to 'resources' table.");
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  } finally {
    await sql.end();
    console.log("Database connection closed.");
  }
}

main();
