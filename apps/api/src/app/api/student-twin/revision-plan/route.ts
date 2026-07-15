import { NextResponse } from "next/server";
import { generateRevisionPlan } from "../../../../lib/student-model";

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { subjectId, examDate } = body;
    if (!subjectId) return NextResponse.json({ error: "subjectId required" }, { status: 400 });

    const result = await generateRevisionPlan(userId, subjectId, examDate);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST revision-plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
