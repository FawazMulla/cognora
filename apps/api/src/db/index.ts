/**
 * Drizzle ORM database instance.
 *
 * Uses the Supabase connection string (Transaction Pooler or Direct Connection).
 * For serverless deployments (Vercel/Railway), use the Supabase Transaction Pooler
 * URL (port 6543) to avoid exhausting direct connection limits.
 * For long-running processes (BullMQ workers), the direct connection (port 5432)
 * or Session Pooler is preferred.
 *
 * Set DATABASE_URL in your .env to the appropriate Supabase Postgres URL.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../lib/env";
import * as schema from "./schema";

// Create a connection pool using Postgres.js.
// max: 10 — limits simultaneous connections to avoid exhausting Supabase pooler.
// idle_timeout: 20 — closes idle connections after 20 seconds.
const client = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

/**
 * The Drizzle ORM database instance.
 * Import this in API routes and workers to run type-safe queries.
 */
export const db = drizzle(client, { schema });

export type Database = typeof db;
