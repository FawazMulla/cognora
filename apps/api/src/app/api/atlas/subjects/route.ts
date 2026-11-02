import { NextResponse } from "next/server";
import { ATLAS_SUBJECTS, getSubjectByCode } from "../../../../lib/atlasCatalogue";

export const dynamic = "force-dynamic";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (code) {
      const subject = getSubjectByCode(code);
      if (!subject) {
        return NextResponse.json({ error: "Subject not found in Visual Learning Atlas" }, { status: 404 });
      }
      return NextResponse.json({ subject }, { status: 200, headers: CACHE_HEADERS });
    }

    // Return all subjects summary
    const summaries = ATLAS_SUBJECTS.map(s => ({
      id: s.id,
      code: s.code,
      name: s.name,
      shortName: s.shortName,
      semester: s.semester,
      university: s.university,
      totalLectureHours: s.totalLectureHours,
      modulesCount: s.modules.length,
      topicsCount: s.modules.reduce((acc, m) => acc + m.topics.length, 0),
      syllabusPdfUrl: s.syllabusPdfUrl,
      description: s.description,
      modules: s.modules.map(m => ({
        id: m.id,
        moduleNumber: m.moduleNumber,
        title: m.title,
        lectureHours: m.lectureHours,
        coMapping: m.coMapping,
        topicsCount: m.topics.length
      }))
    }));

    return NextResponse.json({
      success: true,
      subjects: summaries,
      totalCatalogVideos: 58,
      source: "University of Mumbai Choice Based Credit System (CBCS)"
    }, { status: 200, headers: CACHE_HEADERS });
  } catch (error) {
    console.error("Atlas subjects GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
