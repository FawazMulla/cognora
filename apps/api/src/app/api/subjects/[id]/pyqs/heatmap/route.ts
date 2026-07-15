import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { pyqQuestions } from "../../../../../../db/schema";
import { env } from "../../../../../../lib/env";
import { eq } from "drizzle-orm";
import { verifyOwnership } from "../../../../../../lib/security";

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

    // 1. Fetch all PYQs for this subject
    const pyqs = await db.select().from(pyqQuestions).where(eq(pyqQuestions.subjectId, subjectId));

    if (pyqs.length === 0) {
      // Return simulated mock heatmap data if no questions have been loaded yet
      const fallbackHeatmap = [
        { topic: "Search Algorithms", count: 4, totalMarks: 35, percentage: 38.0, priority: "High" },
        { topic: "Neural Networks", count: 3, totalMarks: 25, percentage: 27.0, priority: "High" },
        { topic: "Expert Systems", count: 2, totalMarks: 15, percentage: 16.0, priority: "Medium" },
        { topic: "Fuzzy Logic", count: 2, totalMarks: 10, percentage: 11.0, priority: "Medium" },
        { topic: "Natural Language Processing", count: 1, totalMarks: 7, percentage: 8.0, priority: "Low" }
      ];
      return NextResponse.json({ heatmap: fallbackHeatmap });
    }

    // 2. Perform grouping
    const groupings: Record<string, { count: number; totalMarks: number; repeatSum: number }> = {};
    let grandTotalMarks = 0;

    for (const q of pyqs) {
      const topicName = q.unitHeader || "General Revision";
      if (!groupings[topicName]) {
        groupings[topicName] = { count: 0, totalMarks: 0, repeatSum: 0 };
      }
      groupings[topicName].count += 1;
      groupings[topicName].totalMarks += q.markValue || 5;
      groupings[topicName].repeatSum += q.repeatCount || 1;
      grandTotalMarks += q.markValue || 5;
    }

    const heatmap = Object.entries(groupings).map(([topic, data]) => {
      const percentage = grandTotalMarks > 0 ? parseFloat(((data.totalMarks / grandTotalMarks) * 100).toFixed(1)) : 0;
      let priority = "Low";
      if (data.repeatSum >= 3 || percentage > 25) priority = "High";
      else if (data.repeatSum >= 2 || percentage > 12) priority = "Medium";

      return {
        topic,
        count: data.count,
        totalMarks: data.totalMarks,
        percentage,
        priority
      };
    });

    // Sort by weight/totalMarks descending
    heatmap.sort((a, b) => b.totalMarks - a.totalMarks);

    return NextResponse.json({ heatmap });
  } catch (error) {
    console.error("GET PYQ heatmap error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
