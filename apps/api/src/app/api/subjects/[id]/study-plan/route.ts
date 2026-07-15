import { NextResponse } from "next/server";
import { generateRevisionPlan } from "../../../../../lib/student-model";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const result = await generateRevisionPlan(userId, params.id, body.examDate);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST study-plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
