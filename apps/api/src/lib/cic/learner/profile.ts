import { getDb } from '../../../db';
import { studentTopicProfiles, studySessions } from '../../../db/schema';
import { eq, and, sql } from 'drizzle-orm';

export interface LearnerTopicProgress {
  topicId: string;
  topicTitle: string;
  subjectCode: string;
  masteryLevel: number; // 0 to 100
  reviewDue: boolean;
  status: 'WEAK' | 'IMPROVING' | 'MASTERED';
  recommendedAction: string;
}

export class LearnerIntelligenceManager {
  /**
   * Records student academic activity on a topic and updates mastery trajectory
   */
  public static async recordInteraction(params: {
    userId: string;
    topicId: string;
    topicName: string;
    subjectId?: string;
    confidenceDelta: number; // e.g. +5 for reading, +15 for passing quiz, -10 for error
  }) {
    try {
      const db = getDb();
      if (!db) return;

      const existing = await db
        .select()
        .from(studentTopicProfiles)
        .where(
          and(
            eq(studentTopicProfiles.userId, params.userId),
            eq(studentTopicProfiles.topic, params.topicName)
          )
        )
        .limit(1);

      const record = existing[0];
      if (record) {
        const currentConf = record.confidence || 50;
        const newConf = Math.min(100, Math.max(0, currentConf + params.confidenceDelta));
        await db
          .update(studentTopicProfiles)
          .set({
            confidence: newConf,
            updatedAt: new Date(),
          })
          .where(eq(studentTopicProfiles.id, record.id));
      } else {
        await db.insert(studentTopicProfiles).values({
          userId: params.userId,
          subjectId: params.subjectId || null,
          topic: params.topicName,
          confidence: Math.min(100, Math.max(0, 50 + params.confidenceDelta)),
        });
      }
    } catch (err) {
      console.warn('[LearnerIntelligenceManager] Error recording topic interaction:', err);
    }
  }

  /**
   * Retrieves high-priority revision suggestions for the learner
   */
  public static async getRevisionPriorities(userId: string): Promise<LearnerTopicProgress[]> {
    try {
      const db = getDb();
      if (!db) return [];

      const profiles = await db
        .select()
        .from(studentTopicProfiles)
        .where(eq(studentTopicProfiles.userId, userId))
        .limit(20);

      return profiles.map((p) => {
        const conf = p.confidence || 50;
        let status: 'WEAK' | 'IMPROVING' | 'MASTERED' = 'IMPROVING';
        let action = 'Solve 5-mark conceptual PYQ';

        if (conf < 50) {
          status = 'WEAK';
          action = 'Review foundational lecture and attempt 2-mark definitions';
        } else if (conf >= 80) {
          status = 'MASTERED';
          action = 'Attempt 10-mark full university exam synthesis';
        }

        return {
          topicId: p.id,
          topicTitle: p.topic,
          subjectCode: 'SEMESTER-VII',
          masteryLevel: conf,
          reviewDue: conf < 65,
          status,
          recommendedAction: action,
        };
      });
    } catch (err) {
      console.warn('[LearnerIntelligenceManager] Error getting revision priorities:', err);
      return [];
    }
  }
}
