import { NextResponse } from "next/server";
import { getTopicById } from "../../../../lib/atlasCatalogue";
import { RemediationEngine } from "../../../../lib/cic/cross-feature/remediation-engine";

export const dynamic = "force-dynamic";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = request.headers.get("x-user-id") || "00000000-0000-0000-0000-000000000101";

    if (!id) {
      return NextResponse.json({ error: "Missing topic id parameter" }, { status: 400 });
    }

    const result = getTopicById(id);
    if (!result) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Cross-feature struggle evaluation
    const diagnosis = await RemediationEngine.diagnoseStruggle(userId, id);

    return NextResponse.json({
      success: true,
      subject: {
        id: result.subject.id,
        code: result.subject.code,
        name: result.subject.name,
      },
      module: {
        id: result.module.id,
        moduleNumber: result.module.moduleNumber,
        title: result.module.title,
        coMapping: result.module.coMapping
      },
      topic: result.topic,
      crossFeatureIntelligence: {
        remediation: diagnosis,
        prerequisites: result.topic.prerequisites,
        conceptVisualizer: result.topic.visualizerType,
        alternativeExplanation: result.topic.hinglishSummary,
      }
    }, { status: 200, headers: CACHE_HEADERS });
  } catch (error) {
    console.error("Atlas topic GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
