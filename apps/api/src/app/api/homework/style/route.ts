import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { homeworkStyleProfiles } from "@/db/schema";
import { env } from "@/lib/env";
import { extractStyleProfile } from "@/lib/agents/homework-agent";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { sampleText, subjectId } = body;

    if (!sampleText || !subjectId) {
      return NextResponse.json({ error: "sampleText and subjectId required" }, { status: 400 });
    }

    const style = await extractStyleProfile(sampleText);

    // Upsert
    const inserted = await db.insert(homeworkStyleProfiles).values({
      userId,
      subjectId,
      avgSentenceLength: style.avgSentenceLength,
      formalityLevel: style.formalityLevel,
      vocabularyRange: style.vocabularyRange,
      paragraphStructure: style.paragraphStructure,
    }).onConflictDoUpdate({
      target: [homeworkStyleProfiles.userId, homeworkStyleProfiles.subjectId],
      set: {
        avgSentenceLength: style.avgSentenceLength,
        formalityLevel: style.formalityLevel,
        vocabularyRange: style.vocabularyRange,
        paragraphStructure: style.paragraphStructure,
        updatedAt: new Date()
      }
    }).returning();

    return NextResponse.json({ styleProfile: inserted[0] }, { status: 200 });
  } catch (error) {
    console.error("POST homework style error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
