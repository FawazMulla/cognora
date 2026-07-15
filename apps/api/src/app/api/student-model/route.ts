import { NextResponse } from "next/server";
import { getStudentModelSnapshot } from "../../../lib/student-model";

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const snapshot = await getStudentModelSnapshot(userId);
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("GET student-model error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
