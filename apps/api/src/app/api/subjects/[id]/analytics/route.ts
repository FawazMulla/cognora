import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { studentTopicProfiles, studySessions } from "../../../../../db/schema";
import { env } from "../../../../../lib/env";
import { eq, and } from "drizzle-orm";
import { verifyOwnership } from "../../../../../lib/security";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const subjectId = params.id;
    const isOwner = await verifyOwnership(userId, subjectId, "subjects");
    if (!isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Fetch topic profiles for the subject
    const topics = await db.select().from(studentTopicProfiles)
      .where(
        and(
          eq(studentTopicProfiles.userId, userId),
          eq(studentTopicProfiles.subjectId, subjectId)
        )
      );

    // Fetch recent study sessions to calculate time spent
    const sessions = await db.select().from(studySessions)
      .where(
        and(
          eq(studySessions.userId, userId),
          eq(studySessions.subjectId, subjectId)
        )
      );

    const totalStudyTimeMinutes = sessions.reduce((acc, s) => acc + Math.floor((s.durationSecs || 0) / 60), 0);

    return NextResponse.json({
      subjectId,
      topics,
      totalStudyTimeMinutes,
      sessionsCount: sessions.length
    });
  } catch (error) {
    console.error("GET subject analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
