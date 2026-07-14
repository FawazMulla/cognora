import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { homeworkStyleProfiles } from "@/db/schema";
import { env } from "@/lib/env";
import { eq, and } from "drizzle-orm";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export async function DELETE(
  request: Request,
  { params }: { params: { subjectId: string } }
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const subjectId = params.subjectId;

    await db.delete(homeworkStyleProfiles)
      .where(and(
        eq(homeworkStyleProfiles.userId, userId),
        eq(homeworkStyleProfiles.subjectId, subjectId)
      ));

    return NextResponse.json({ message: "Style profile reset" }, { status: 200 });
  } catch (error) {
    console.error("DELETE homework style error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
