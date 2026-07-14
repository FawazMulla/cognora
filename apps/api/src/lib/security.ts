import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env";
import { eq, sql } from "drizzle-orm";
import * as schema from "../db/schema";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client, { schema });

/**
 * Helper to check ownership of a resource before accessing or mutating it.
 * @param userId The ID of the authenticated user
 * @param resourceId The ID of the resource
 * @param tableName The table name as exported in schema.ts
 * @returns boolean true if the user owns the resource, false otherwise.
 */
export async function verifyOwnership(userId: string, resourceId: string, tableName: keyof typeof schema): Promise<boolean> {
  const table = schema[tableName] as any;
  if (!table) throw new Error(`Table ${tableName} not found in schema`);
  
  // Assuming all tables have 'id' and 'userId' columns
  if (!table.id || !table.userId) {
    throw new Error(`Table ${tableName} does not have required id/userId columns for ownership verification`);
  }

  const result = await db.select({ id: table.id }).from(table)
    .where(sql`${table.id} = ${resourceId} AND ${table.userId} = ${userId}`)
    .limit(1);

  return result.length > 0;
}
