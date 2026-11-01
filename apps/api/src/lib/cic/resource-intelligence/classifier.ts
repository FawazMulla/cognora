import { ATLAS_SUBJECTS, Subject, Module, Topic } from '../../atlasCatalogue';
import type { AcademicClassification } from './types';

export class AcademicClassifier {
  /**
   * Evaluates document text against the 5 authoritative Mumbai University subjects.
   */
  public static classifyDocument(documentText: string): AcademicClassification {
    const textLower = documentText.toLowerCase();

    let bestSubject: Subject = ATLAS_SUBJECTS[0] as Subject;
    let bestModule: Module = (ATLAS_SUBJECTS[0] as Subject).modules[0] as Module;
    let bestTopic: Topic | undefined = bestModule.topics[0];
    let highestScore = 0;
    let matchedKeywords: string[] = [];

    // Evaluate each subject
    for (const subject of ATLAS_SUBJECTS) {
      // Check subject code & name presence
      let subjectScore = 0;
      if (textLower.includes(subject.code.toLowerCase())) subjectScore += 40;
      if (textLower.includes(subject.name.toLowerCase())) subjectScore += 30;

      for (const mod of subject.modules) {
        let moduleScore = subjectScore;
        const modTitleTokens = mod.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        modTitleTokens.forEach(token => {
          if (textLower.includes(token)) moduleScore += 10;
        });

        for (const topic of mod.topics) {
          let topicScore = moduleScore;
          const topicKeywords = [
            topic.title.toLowerCase(),
            topic.shortTitle.toLowerCase(),
            ...topic.keyPoints.flatMap(kp => kp.toLowerCase().split(/\W+/).filter(w => w.length > 4))
          ];

          const foundKeywords: string[] = [];
          topicKeywords.forEach(kw => {
            if (textLower.includes(kw) && !foundKeywords.includes(kw)) {
              topicScore += 8;
              foundKeywords.push(kw);
            }
          });

          if (topicScore > highestScore) {
            highestScore = topicScore;
            bestSubject = subject;
            bestModule = mod;
            bestTopic = topic;
            matchedKeywords = foundKeywords.slice(0, 8);
          }
        }
      }
    }

    // Normalize confidence (0.0 to 1.0)
    const confidence = Math.min(0.98, Math.max(0.35, highestScore / 120));
    const requiresUserConfirmation = confidence < 0.65;

    return {
      subjectId: bestSubject.id,
      subjectCode: bestSubject.code,
      subjectName: bestSubject.name,
      moduleNumber: bestModule.moduleNumber,
      moduleTitle: bestModule.title,
      topicId: bestTopic?.id,
      topicTitle: bestTopic?.title,
      confidence: parseFloat(confidence.toFixed(2)),
      requiresUserConfirmation,
      courseOutcomes: [bestModule.coMapping],
      matchedKeywords
    };
  }
}

