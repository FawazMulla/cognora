import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { studentModels, studentTopicProfiles, studySessions, flashcards, subjects } from "../../../../db/schema";
import { env } from "../../../../lib/env";
import { eq, desc, and } from "drizzle-orm";
import { predictExamScore, getForgettingCurveData, recomputeAcademicHealth } from "../../../../lib/student-model";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const subjectId = url.searchParams.get('subjectId') || undefined;

    const [modelRaw] = await db.select().from(studentModels).where(eq(studentModels.userId, userId));
    const model = modelRaw as any;

    const conditions: any[] = [eq(studentTopicProfiles.userId, userId)];
    if (subjectId) conditions.push(eq(studentTopicProfiles.subjectId, subjectId));
    const topics = await db.select().from(studentTopicProfiles).where(and(...conditions));

    const recentSessions = await db.select().from(studySessions)
      .where(eq(studySessions.userId, userId))
      .orderBy(desc(studySessions.startedAt))
      .limit(30);

    const subjectList = await db.select().from(subjects).where(eq(subjects.userId, userId));

    const allCards = await db.select().from(flashcards).where(eq(flashcards.userId, userId));

    // Compute derived metrics
    const weakTopics = topics.filter((t: any) => t.weakFlag === 'weak');
    const improvingTopics = topics.filter((t: any) => t.weakFlag === 'improving');
    const strongTopics = topics.filter((t: any) => t.weakFlag === 'strong');

    const totalStudySeconds = recentSessions.reduce((sum, s) => sum + (s.durationSecs || 0), 0);
    const avgQuizScore = recentSessions.filter(s => s.quizScore !== null).reduce((sum, s, _, arr) => sum + (s.quizScore || 0) / arr.length, 0);

    // Study streak (consecutive days)
    let streak = 0;
    const sessionDates = [...new Set(recentSessions.map(s => new Date(s.startedAt).toDateString()))].sort().reverse();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (sessionDates[0] === today || sessionDates[0] === yesterday) {
      for (let i = 0; i < sessionDates.length; i++) {
        const expectedDate = new Date(Date.now() - i * 86400000).toDateString();
        if (sessionDates[i] === expectedDate) streak++;
        else break;
      }
    }

    // 52-week contribution heatmap data
    const heatmapData: { date: string; count: number }[] = [];
    for (let i = 364; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      const dateStr = date.toISOString().split('T')[0] ?? '';
      const count = recentSessions.filter(s => new Date(s.startedAt).toISOString().split('T')[0] === dateStr).length;
      heatmapData.push({ date: dateStr, count });
    }

    // Per-subject predictions
    const subjectPredictions: any[] = [];
    for (const subj of subjectList.slice(0, 3)) {
      try {
        const pred = await predictExamScore(userId, subj.id);
        subjectPredictions.push({ subjectId: subj.id, subjectName: subj.name, ...pred });
      } catch (e) {
        subjectPredictions.push({ subjectId: subj.id, subjectName: subj.name, predictedScore: 65, grade: 'A', confidence: 40, factorBreakdown: {} });
      }
    }

    // Forgetting curve data
    const forgettingCurve = await getForgettingCurveData(userId, subjectId);

    // Cognitive radar scores (5 dimensions, 0-100)
    const radarData = {
      memory: Math.min(100, Math.round(forgettingCurve.overallRetention)),
      speed: Math.min(100, Math.round(50 + (model?.learningPace === 'fast' ? 30 : model?.learningPace === 'slow' ? -10 : 0))),
      accuracy: Math.min(100, Math.round(avgQuizScore * 100)),
      consistency: Math.min(100, streak * 7),
      coverage: Math.min(100, Math.round((strongTopics.length + improvingTopics.length * 0.6) / Math.max(1, topics.length) * 100))
    };

    // Recompute health
    const healthScore = await recomputeAcademicHealth(userId);

    return NextResponse.json({
      model: model || { preferredStyle: 'text', learningPace: 'standard', academicHealthScore: 50 },
      radarData,
      topics: {
        all: topics,
        weak: weakTopics,
        improving: improvingTopics,
        strong: strongTopics
      },
      stats: {
        streak,
        totalStudyHours: parseFloat((totalStudySeconds / 3600).toFixed(1)),
        avgQuizScore: parseFloat((avgQuizScore * 100).toFixed(1)),
        totalCards: allCards.length,
        masteredCards: allCards.filter(c => (c.intervalDays || 1) >= 14).length,
        healthScore
      },
      heatmapData,
      forgettingCurve,
      subjectPredictions
    });
  } catch (error) {
    console.error("GET full-profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
