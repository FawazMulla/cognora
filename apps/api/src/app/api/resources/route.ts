import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resources } from "../../../db/schema";
import { env } from "../../../lib/env";
import { eq, and } from "drizzle-orm";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subject_id");

    let condition = eq(resources.userId, userId);
    if (subjectId) {
      condition = and(condition, eq(resources.subjectId, subjectId)) as any;
    }

    const resourceList = await db.select().from(resources).where(condition).orderBy(resources.createdAt);

    return NextResponse.json({ resources: resourceList }, { status: 200 });

  } catch (error) {
    console.error("Resources GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
