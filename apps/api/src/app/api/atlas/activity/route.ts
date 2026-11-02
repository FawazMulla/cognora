import { NextResponse } from "next/server";
import { db } from "../../../../db";
import { studentTopicProfiles, subjects } from "../../../../db/schema";
import { eq, and } from "drizzle-orm";
import { getTopicById } from "../../../../lib/atlasCatalogue";
import { AcademicEventBus } from "../../../../lib/cic/cross-feature/event-bus";

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id") || "00000000-0000-0000-0000-000000000101";
    const body = await request.json();
    const { topicId, activityType, score, videoWatched, readingDone, pyqExplored } = body;

    if (!topicId) {
      return NextResponse.json({ error: "Missing topicId" }, { status: 400 });
    }

    const topicData = getTopicById(topicId);
    if (!topicData) {
      return NextResponse.json({ error: "Topic not recognized in syllabus" }, { status: 404 });
    }

    // Calculate mastery score
    let mastery = 0;
    if (videoWatched) mastery += 25;
    if (readingDone) mastery += 25;
    if (typeof score === 'number') mastery += Math.round((score / 100) * 30);
    if (pyqExplored) mastery += 20;
    mastery = Math.min(100, mastery);

    let status = "NOT_STARTED";
    if (mastery >= 80) status = "MASTERED";
    else if (mastery >= 50) status = "PRACTICED";
    else if (mastery > 0) status = "LEARNING";

    try {
      // Find or create subject reference in DB
      let existingSubj = await db.select().from(subjects).where(
        and(eq(subjects.userId, userId), eq(subjects.code, topicData.subject.code))
      ).limit(1);

      let subjectDbId: string | null = null;
      if (existingSubj[0]) {
        subjectDbId = existingSubj[0].id;
      }

      if (subjectDbId) {
        // Update or insert student topic profile
        const existingProfile = await db.select().from(studentTopicProfiles).where(
          and(
            eq(studentTopicProfiles.userId, userId),
            eq(studentTopicProfiles.subjectId, subjectDbId),
            eq(studentTopicProfiles.topic, topicData.topic.title)
          )
        ).limit(1);

        if (existingProfile[0]) {
          await db.update(studentTopicProfiles).set({
            confidence: mastery,
            weakFlag: mastery < 50 ? 'needs_revision' : 'none',
            lastRevisedAt: new Date(),
            updatedAt: new Date()
          }).where(eq(studentTopicProfiles.id, existingProfile[0].id));
        } else {
          await db.insert(studentTopicProfiles).values({
            userId,
            subjectId: subjectDbId,
            topic: topicData.topic.title,
            confidence: mastery,
            weakFlag: mastery < 50 ? 'needs_revision' : 'none',
            lastRevisedAt: new Date()
          });
        }
      }
    } catch (dbErr) {
      // Safe fallback if database pool is busy
      console.warn("Atlas DB persistence non-fatal notice:", dbErr);
    }

    // Trigger cross-feature academic event
    let generatedOpportunities: any[] = [];
    try {
      if (activityType === 'quiz' || typeof score === 'number') {
        const ev = await AcademicEventBus.emit({
          userId,
          eventType: 'quiz.completed',
          data: {
            topicId,
            topicTitle: topicData.topic.title,
            score: typeof score === 'number' ? score : mastery,
            subjectCode: topicData.subject.code,
          },
        });
        generatedOpportunities = ev.opportunitiesGenerated;
      } else if (videoWatched) {
        const ev = await AcademicEventBus.emit({
          userId,
          eventType: 'video.completed',
          data: {
            topicId,
            topicTitle: topicData.topic.title,
            subjectCode: topicData.subject.code,
          },
        });
        generatedOpportunities = ev.opportunitiesGenerated;
      }
    } catch (evErr) {
      console.warn("Event bus dispatch non-fatal notice:", evErr);
    }

    return NextResponse.json({
      success: true,
      topicId,
      mastery,
      status,
      calculatedAt: new Date().toISOString(),
      crossFeatureOpportunities: generatedOpportunities,
    }, { status: 200 });
  } catch (error) {
    console.error("Atlas activity POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
