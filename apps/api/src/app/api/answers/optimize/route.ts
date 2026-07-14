import { NextResponse } from "next/server";
import { answerOptimizerNode } from "@/lib/agents/answer-agent";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { studentTopicProfiles } from "@/db/schema";
import { env } from "@/lib/env";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { studentAnswer, question, subjectId, topic } = body;

    if (!studentAnswer || !question) {
      return NextResponse.json({ error: "studentAnswer and question are required" }, { status: 400 });
    }

    // Run Optimizer
    const result = await answerOptimizerNode(studentAnswer, question);

    // Record missing concepts as weak signals if subjectId and topic provided
    if (subjectId && topic && result.missingConcepts.length > 0) {
      // Stub: in reality we'd append missing concepts to the profile or update a weakFlag
      console.log(`Recording weak concepts for user ${userId}, topic ${topic}:`, result.missingConcepts);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("POST answer optimize error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
