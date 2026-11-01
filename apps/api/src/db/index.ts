/**
 * Drizzle ORM database instance.
 *
 * Singleton connection pool to avoid exhausting Supabase connection limits.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../lib/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

// Create a singleton connection pool using Postgres.js.
// max: 3 — limits simultaneous connections to safely stay within Supabase limits.
// idle_timeout: 10 — closes idle connections quickly.
export const client =
  globalForDb.conn ??
  postgres(env.DATABASE_URL, {
    max: 3,
    idle_timeout: 10,
    connect_timeout: 10,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = client;
}

/**
 * The Drizzle ORM database instance.
 * Import this across API routes and workers for singleton type-safe queries.
 */
export const db = drizzle(client, { schema });

export function getDb() {
  return db;
}

export type Database = typeof db;
