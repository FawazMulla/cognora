import { db } from '../../../db';
import { studentTopicProfiles } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getTopicById, Topic } from '../../atlasCatalogue';

export interface StruggleDiagnosis {
  isStruggling: boolean;
  topicId: string;
  topicTitle: string;
  confidence: number;
  struggleReason: string;
  remedySummary: string;
  prerequisites: string[];
  recommendedVisualizer: string | null;
  recommendedVisualizerUrl: string | null;
  alternativeExplanationHinglish: string;
  recommendedVideo: {
    title: string;
    url: string;
    youtubeId: string;
    channel: string;
  } | null;
}

export class RemediationEngine {
  /**
   * Evaluates student evidence across quizzes, answers, and profiles to detect repeated struggle
   */
  public static async diagnoseStruggle(
    userId: string,
    topicId: string,
    currentScore?: number
  ): Promise<StruggleDiagnosis> {
    const topicData = getTopicById(topicId);
    const title = topicData?.topic.title || topicId;

    let confidence = currentScore !== undefined ? currentScore : 50;
    let errorCount = 0;

    try {
      const records = await db
        .select()
        .from(studentTopicProfiles)
        .where(
          and(
            eq(studentTopicProfiles.userId, userId),
            eq(studentTopicProfiles.topic, title)
          )
        )
        .limit(1);

      if (records[0]) {
        confidence = records[0].confidence ?? confidence;
        errorCount =
          (records[0].definitionErrors ?? 0) +
          (records[0].diagramErrors ?? 0) +
          (records[0].numericalErrors ?? 0);
      }
    } catch (e) {
      // In-memory / graceful fallback
    }

    const isStruggling = confidence < 60 || (currentScore !== undefined && currentScore < 60) || errorCount >= 2;

    const topic = topicData?.topic;
    const prerequisites = topic?.prerequisites || ['Basic Probability & Set Theory'];
    const visualizer = topic?.visualizerType && topic.visualizerType !== 'none' ? topic.visualizerType : null;
    const visualizerUrl = visualizer ? `/atlas?topic=${topicId}&tab=visualizer` : null;

    const alternativeExplanation =
      topic?.hinglishSummary ||
      `Simplification: "${topic?.shortTitle || title}" ko aasan shabdon mein samajhne ke liye pehle basic principles aur step-by-step intuition dekhna zaroori hai. Visualizer ka use karke live simulation dekho.`;

    const firstVideo = topic?.videos && topic.videos[0] ? topic.videos[0] : null;

    const remedySummary = isStruggling
      ? `Repeated difficulty detected in "${topic?.shortTitle || title}". Recommended: Review prerequisites (${prerequisites.join(', ')}), run the ${visualizer || 'concept'} visualizer, and review the Hinglish summary.`
      : `Concept understanding is on track (${confidence}%). Ready for university PYQs.`;

    return {
      isStruggling,
      topicId,
      topicTitle: title,
      confidence,
      struggleReason: isStruggling
        ? `Quiz/Answer score (${confidence}%) below 60% with difficulty retaining core concepts.`
        : 'On track',
      remedySummary,
      prerequisites,
      recommendedVisualizer: visualizer,
      recommendedVisualizerUrl: visualizerUrl,
      alternativeExplanationHinglish: alternativeExplanation,
      recommendedVideo: firstVideo
        ? {
            title: firstVideo.title,
            url: firstVideo.url,
            youtubeId: firstVideo.youtubeId,
            channel: firstVideo.channel,
          }
        : null,
    };
  }
}
