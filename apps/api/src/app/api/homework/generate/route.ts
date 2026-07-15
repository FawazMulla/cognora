import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { homeworkStyleProfiles } from "../../../../db/schema";
import { env } from "../../../../lib/env";
import { eq, and } from "drizzle-orm";
import { homeworkGeneratorNode } from "../../../../lib/agents/homework-agent";
import { z } from "zod";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

const HomeworkGenerateSchema = z.object({
  question: z.string().min(1, "Question is required"),
  instructions: z.string().optional(),
  wordLimit: z.number().int().positive().optional(),
  subjectId: z.string().uuid("Invalid subject ID")
});

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    
    const parseResult = HomeworkGenerateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Validation failed", details: parseResult.error.issues }, { status: 400 });
    }

    const { question, instructions, wordLimit, subjectId } = parseResult.data;

    // 1. Fetch style profile if any
    let styleProfile: any = undefined;
    const profiles = await db.select().from(homeworkStyleProfiles)
      .where(and(
        eq(homeworkStyleProfiles.userId, userId),
        eq(homeworkStyleProfiles.subjectId, subjectId)
      )).limit(1);

    if (profiles.length) {
      styleProfile = profiles[0];
    }

    // 2. Generate homework
    const limit = wordLimit || 300; // default
    const result = await homeworkGeneratorNode(
      question,
      instructions || "",
      limit,
      styleProfile
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("POST homework generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
