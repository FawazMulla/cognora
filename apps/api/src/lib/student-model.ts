import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { studentTopicProfiles, studentModels, studySessions, flashcards } from "../db/schema";
import { env } from "./env";
import { eq, and, desc } from "drizzle-orm";
import { getForgettingCurve } from "./sm2";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

/**
 * Flags a topic as weak/improving/strong based on quiz accuracy.
 */
export async function updateTopicStatus(userId: string, subjectId: string, topic: string, recentAccuracy: number, isOptimizerFailure = false) {
  const [profile] = await db.select().from(studentTopicProfiles).where(
    and(eq(studentTopicProfiles.userId, userId), eq(studentTopicProfiles.subjectId, subjectId), eq(studentTopicProfiles.topic, topic))
  );

  let newStatus = profile?.weakFlag || 'none';
  let weakReason = profile?.weakReason;

  if (recentAccuracy < 0.60 || isOptimizerFailure) {
    newStatus = 'weak';
    weakReason = isOptimizerFailure ? 'Consistently missing core concepts in answers' : 'Recent quiz accuracy below 60%';
  } else if (newStatus === 'weak' && recentAccuracy > 0.75) {
    newStatus = 'improving';
    weakReason = null;
  } else if (newStatus === 'improving' && recentAccuracy > 0.85) {
    newStatus = 'strong';
    weakReason = null;
  }

  if (profile) {
    await db.update(studentTopicProfiles).set({
      weakFlag: newStatus,
      weakReason: weakReason || null,
      confidence: Math.min(100, Math.round(recentAccuracy * 100)),
      lastRevisedAt: new Date(),
      updatedAt: new Date()
    }).where(eq(studentTopicProfiles.id, profile.id));
  } else {
    await db.insert(studentTopicProfiles).values({
      userId, subjectId, topic,
      weakFlag: newStatus,
      weakReason: weakReason || null,
      confidence: Math.min(100, Math.round(recentAccuracy * 100)),
      lastRevisedAt: new Date()
    });
  }

  // Recompute academic health after every topic update
  await recomputeAcademicHealth(userId);
}

/**
 * Compute academic health score (0-100) from multiple signals.
 * Formula: weighted average of topic confidence, session consistency, and card retention.
 */
export async function recomputeAcademicHealth(userId: string): Promise<number> {
  const topics = await db.select().from(studentTopicProfiles).where(eq(studentTopicProfiles.userId, userId));
  const sessions = await db.select().from(studySessions).where(eq(studySessions.userId, userId)).orderBy(desc(studySessions.startedAt)).limit(7);
  const allCards = await db.select().from(flashcards).where(eq(flashcards.userId, userId));

  // Signal 1: Average topic confidence (0-100)
  const avgConfidence = topics.length > 0 
    ? topics.reduce((sum, t) => sum + (t.confidence || 50), 0) / topics.length 
    : 50;

  // Signal 2: Weak topic penalty (-5 each, max -30)
  const weakCount = topics.filter(t => t.weakFlag === 'weak').length;
  const weakPenalty = Math.min(30, weakCount * 5);

  // Signal 3: Session streak bonus (max +15)
  const sessionBonus = Math.min(15, sessions.length * 2.5);

  // Signal 4: Flashcard retention score
  const masteredCards = allCards.filter(c => (c.intervalDays || 1) >= 14).length;
  const retentionScore = allCards.length > 0 ? (masteredCards / allCards.length) * 20 : 0;

  const healthScore = Math.max(0, Math.min(100, avgConfidence - weakPenalty + sessionBonus + retentionScore));

  await db.update(studentModels).set({
    academicHealthScore: parseFloat(healthScore.toFixed(1)),
    updatedAt: new Date()
  }).where(eq(studentModels.userId, userId));

  return healthScore;
}

/**
 * Predict expected exam score (0-100) and grade using multi-factor formula.
 */
export async function predictExamScore(userId: string, subjectId: string): Promise<{
  predictedScore: number;
  grade: string;
  confidence: number;
  factorBreakdown: Record<string, number>;
}> {
  const topics = await db.select().from(studentTopicProfiles).where(
    and(eq(studentTopicProfiles.userId, userId), eq(studentTopicProfiles.subjectId, subjectId))
  );
  const sessions = await db.select().from(studySessions).where(
    and(eq(studySessions.userId, userId), eq(studySessions.subjectId, subjectId))
  ).orderBy(desc(studySessions.startedAt)).limit(10);
  const cards = await db.select().from(flashcards).where(
    and(eq(flashcards.userId, userId), eq(flashcards.subjectId, subjectId))
  );

  // Factor 1: Topic mastery (35% weight)
  const strongCount = topics.filter(t => t.weakFlag === 'strong').length;
  const improvingCount = topics.filter(t => t.weakFlag === 'improving').length;
  const weakCount = topics.filter(t => t.weakFlag === 'weak').length;
  const totalTopics = topics.length || 1;
  const topicScore = ((strongCount * 1.0 + improvingCount * 0.7 + weakCount * 0.2) / totalTopics) * 100;

  // Factor 2: Average quiz score from sessions (30% weight)
  const sessionScores = sessions.filter(s => s.quizScore !== null).map(s => (s.quizScore || 0) * 100);
  const avgQuizScore = sessionScores.length > 0 ? sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length : 50;

  // Factor 3: Flashcard retention (20% weight)
  const avgInterval = cards.length > 0 ? cards.reduce((sum, c) => sum + (c.intervalDays || 1), 0) / cards.length : 1;
  const retentionScore = Math.min(100, (avgInterval / 30) * 100);

  // Factor 4: Study consistency (15% weight)
  const consistencyScore = Math.min(100, sessions.length * 10);

  const predictedScore = Math.round(
    topicScore * 0.35 +
    avgQuizScore * 0.30 +
    retentionScore * 0.20 +
    consistencyScore * 0.15
  );

  const grade = predictedScore >= 75 ? 'O' : predictedScore >= 65 ? 'A+' : predictedScore >= 55 ? 'A' : predictedScore >= 45 ? 'B' : 'C';
  const predictionConfidence = Math.min(95, 40 + topics.length * 3 + sessions.length * 5);

  return {
    predictedScore: Math.max(0, Math.min(100, predictedScore)),
    grade,
    confidence: predictionConfidence,
    factorBreakdown: {
      topicMastery: Math.round(topicScore * 0.35),
      quizPerformance: Math.round(avgQuizScore * 0.30),
      cardRetention: Math.round(retentionScore * 0.20),
      studyConsistency: Math.round(consistencyScore * 0.15)
    }
  };
}

/**
 * Get forgetting curve data for all flashcards (for visualization).
 */
export async function getForgettingCurveData(userId: string, subjectId?: string): Promise<{
  overallRetention: number;
  cardCurves: { cardId: string; front: string; stability: number; curve: { day: number; retrievability: number }[] }[];
}> {
  const conditions: any[] = [eq(flashcards.userId, userId)];
  if (subjectId) conditions.push(eq(flashcards.subjectId, subjectId));

  const cards = await db.select().from(flashcards).where(and(...conditions)).limit(20);

  const cardCurves = cards.map(c => ({
    cardId: c.id,
    front: c.front.slice(0, 60),
    stability: c.easeFactor || 2.5,
    curve: getForgettingCurve(c.easeFactor || 2.5, 21)
  }));

  const overallRetention = cardCurves.length > 0
    ? cardCurves.reduce((sum, c) => sum + (c.curve[1]?.retrievability || 0.9), 0) / cardCurves.length * 100
    : 90;

  return { overallRetention: Math.round(overallRetention), cardCurves };
}

/**
 * Generate a multi-day personalized revision plan.
 */
export async function generateRevisionPlan(userId: string, subjectId: string, examDate?: string): Promise<{
  plan: { day: number; date: string; tasks: { type: string; topic: string; duration: number; priority: string }[] }[];
  totalDays: number;
  estimatedReadiness: number;
}> {
  const topics = await db.select().from(studentTopicProfiles).where(
    and(eq(studentTopicProfiles.userId, userId), eq(studentTopicProfiles.subjectId, subjectId))
  );

  const weakTopics = topics.filter(t => t.weakFlag === 'weak').map(t => t.topic);
  const improvingTopics = topics.filter(t => t.weakFlag === 'improving').map(t => t.topic);
  const strongTopics = topics.filter(t => t.weakFlag === 'strong').map(t => t.topic);

  const today = new Date();
  const examDay = examDate ? new Date(examDate) : new Date(today.getTime() + 7 * 86400000);
  const totalDays = Math.max(1, Math.round((examDay.getTime() - today.getTime()) / 86400000));
  const planDays = Math.min(totalDays, 7);

  const plan = Array.from({ length: planDays }, (_, i) => {
    const date = new Date(today.getTime() + i * 86400000);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const isLastDay = i === planDays - 1;
    const tasks: { type: string; topic: string; duration: number; priority: string }[] = [];

    // Day-specific strategy
    if (isLastDay) {
      tasks.push({ type: 'mock_test', topic: 'Full syllabus revision', duration: 90, priority: 'critical' });
      tasks.push({ type: 'flashcard_review', topic: 'All due cards — rapid fire', duration: 20, priority: 'high' });
    } else if (i < Math.ceil(planDays * 0.4) && weakTopics.length > 0) {
      // First 40% of days — attack weak topics
      const weakIdx = i % weakTopics.length;
      tasks.push({ type: 'deep_study', topic: weakTopics[weakIdx] || 'Core concepts', duration: 45, priority: 'critical' });
      tasks.push({ type: 'viva_practice', topic: weakTopics[weakIdx] || 'Core concepts', duration: 20, priority: 'high' });
      tasks.push({ type: 'flashcard_review', topic: 'Due cards', duration: 15, priority: 'medium' });
    } else if (i < Math.ceil(planDays * 0.7)) {
      // Middle phase — PYQ practice
      tasks.push({ type: 'pyq_practice', topic: 'High probability questions', duration: 50, priority: 'high' });
      tasks.push({ type: 'answer_generation', topic: improvingTopics[i % Math.max(1, improvingTopics.length)] || 'Key topics', duration: 30, priority: 'medium' });
      tasks.push({ type: 'flashcard_review', topic: 'Spaced repetition queue', duration: 15, priority: 'medium' });
    } else {
      // Final phase — consolidation
      tasks.push({ type: 'consolidation', topic: 'Strong topic reinforcement', duration: 40, priority: 'medium' });
      tasks.push({ type: 'pyq_practice', topic: 'Remaining predicted questions', duration: 35, priority: 'high' });
      tasks.push({ type: 'flashcard_review', topic: 'All subject cards', duration: 15, priority: 'low' });
    }

    return { day: i + 1, date: dateStr, tasks };
  });

  const readiness = Math.min(95, 30 + (strongTopics.length / Math.max(1, topics.length)) * 50 + planDays * 3);

  return { plan, totalDays, estimatedReadiness: Math.round(readiness) };
}

export async function getStudentModelSnapshot(userId: string) {
  const [model] = await db.select().from(studentModels).where(eq(studentModels.userId, userId));
  const topics = await db.select().from(studentTopicProfiles).where(eq(studentTopicProfiles.userId, userId));
  return { model, topics, timestamp: new Date() };
}
