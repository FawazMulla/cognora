import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { studentTopicProfiles, studentModels } from "@/db/schema";
import { env } from "@/lib/env";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

/**
 * 15.2 Implement weak topic detection logic
 * Flags a topic as "weak" when quiz accuracy < 60% OR optimizer score is low.
 * Downgrades to "improving" when accuracy > 75%.
 */
export async function updateTopicStatus(userId: string, subjectId: string, topic: string, recentAccuracy: number, isOptimizerFailure = false) {
  const [profile] = await db
    .select()
    .from(studentTopicProfiles)
    .where(
      and(
        eq(studentTopicProfiles.userId, userId),
        eq(studentTopicProfiles.subjectId, subjectId),
        eq(studentTopicProfiles.topic, topic)
      )
    );

  let newStatus = profile?.status || 'neutral';
  let weakReason = profile?.weakReason;

  if (recentAccuracy < 0.60 || isOptimizerFailure) {
    newStatus = 'weak';
    weakReason = isOptimizerFailure ? 'Consistently missing core concepts in answers' : 'Recent quiz accuracy below 60%';
  } else if (newStatus === 'weak' && recentAccuracy > 0.75) {
    newStatus = 'improving';
    weakReason = null;
  } else if (newStatus === 'improving' && recentAccuracy > 0.85) {
    newStatus = 'strong';
  }

  if (profile) {
    await db.update(studentTopicProfiles)
      .set({
        status: newStatus,
        weakReason,
        lastAssessedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(studentTopicProfiles.id, profile.id));
  } else {
    await db.insert(studentTopicProfiles).values({
      userId,
      subjectId,
      topic,
      status: newStatus,
      weakReason,
      lastAssessedAt: new Date()
    });
  }
}

export async function getStudentModelSnapshot(userId: string) {
  const [model] = await db.select().from(studentModels).where(eq(studentModels.userId, userId));
  const topics = await db.select().from(studentTopicProfiles).where(eq(studentTopicProfiles.userId, userId));
  
  return {
    model,
    topics,
    timestamp: new Date()
  };
}
