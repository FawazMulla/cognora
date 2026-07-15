import { NextResponse } from "next/server";
import { predictExamScore } from "../../../../lib/student-model";

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const subjectId = url.searchParams.get('subjectId');
    if (!subjectId) return NextResponse.json({ error: "subjectId required" }, { status: 400 });

    const result = await predictExamScore(userId, subjectId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET predict-score error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { subjectId } = body;
    if (!subjectId) return NextResponse.json({ error: "subjectId required" }, { status: 400 });

    const result = await predictExamScore(userId, subjectId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST predict-score error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
