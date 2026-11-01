import { ATLAS_SUBJECTS } from '../../atlasCatalogue';

export type QueryIntent =
  | 'ANSWER_GENERATION'
  | 'CONCEPT_EXPLANATION'
  | 'REVISION_NOTES'
  | 'MCQ_PRACTICE'
  | 'FORMULA_DERIVATION'
  | 'COMPARISON'
  | 'GENERAL_SEARCH';

export type AnswerScheme = 2 | 5 | 10 | 15;

export interface ParsedAcademicQuery {
  rawQuery: string;
  normalizedQuery: string;
  intent: QueryIntent;
  subjectCode?: string | undefined;
  subjectName?: string | undefined;
  topicId?: string | undefined;
  topicTitle?: string | undefined;
  marks: AnswerScheme;
  language: 'english' | 'hinglish';
  requiresCitations: boolean;
  sourceScope: 'OFFICIAL_SYLLABUS' | 'STUDENT_UPLOADS' | 'ALL_ACADEMIC_RESOURCES';
}

export class QueryUnderstandingParser {
  /**
   * Dissects student prompt to extract intent, mark scheme, subject context, and language.
   */
  public static parse(query: string): ParsedAcademicQuery {
    const rawQuery = query.trim();
    const qLower = rawQuery.toLowerCase();

    // 1. Detect Language
    let language: 'english' | 'hinglish' = 'english';
    if (
      qLower.includes('hinglish') ||
      /\b(batao|kya hai|samjhao|kaise|hota|karo|bataiye|explain karo)\b/i.test(qLower)
    ) {
      language = 'hinglish';
    }

    // 2. Detect Marks Scheme
    let marks: AnswerScheme = 10;
    if (/\b(2|two)\s*(m|marks?)\b/i.test(qLower)) marks = 2;
    else if (/\b(5|five)\s*(m|marks?)\b/i.test(qLower)) marks = 5;
    else if (/\b(15|fifteen)\s*(m|marks?)\b/i.test(qLower)) marks = 15;
    else if (/\b(10|ten)\s*(m|marks?)\b/i.test(qLower)) marks = 10;

    // 3. Detect Intent
    let intent: QueryIntent = 'ANSWER_GENERATION';
    if (/\b(mcq|quiz|practice questions|test me)\b/i.test(qLower)) {
      intent = 'MCQ_PRACTICE';
    } else if (/\b(revision|summary|quick notes|cheat sheet)\b/i.test(qLower)) {
      intent = 'REVISION_NOTES';
    } else if (/\b(derive|derivation|formula|equation|mathematical)\b/i.test(qLower)) {
      intent = 'FORMULA_DERIVATION';
    } else if (/\b(compare|differentiate|vs|versus|difference between)\b/i.test(qLower)) {
      intent = 'COMPARISON';
    } else if (/\b(what is|explain|define|concept of)\b/i.test(qLower) && !/\b(marks?)\b/i.test(qLower)) {
      intent = 'CONCEPT_EXPLANATION';
    }

    // 4. Detect Subject & Topic against Mumbai University Atlas
    let subjectCode: string | undefined;
    let subjectName: string | undefined;
    let topicId: string | undefined;
    let topicTitle: string | undefined;

    for (const sub of ATLAS_SUBJECTS) {
      if (
        qLower.includes(sub.code.toLowerCase()) ||
        qLower.includes(sub.name.toLowerCase()) ||
        qLower.includes(sub.shortName.toLowerCase())
      ) {
        subjectCode = sub.code;
        subjectName = sub.name;
      }

      for (const mod of sub.modules) {
        for (const top of mod.topics) {
          if (
            qLower.includes(top.title.toLowerCase()) ||
            qLower.includes(top.shortTitle.toLowerCase())
          ) {
            subjectCode = sub.code;
            subjectName = sub.name;
            topicId = top.id;
            topicTitle = top.title;
            break;
          }
        }
        if (topicId) break;
      }
      if (subjectCode && topicId) break;
    }

    // 5. Source Scope
    let sourceScope: 'OFFICIAL_SYLLABUS' | 'STUDENT_UPLOADS' | 'ALL_ACADEMIC_RESOURCES' = 'ALL_ACADEMIC_RESOURCES';
    if (qLower.includes('my notes') || qLower.includes('uploaded')) {
      sourceScope = 'STUDENT_UPLOADS';
    } else if (qLower.includes('syllabus only') || qLower.includes('official')) {
      sourceScope = 'OFFICIAL_SYLLABUS';
    }

    const normalizedQuery = qLower
      .replace(/for \d+\s*marks?/g, '')
      .replace(/in hinglish/g, '')
      .replace(/explain/g, '')
      .trim();

    return {
      rawQuery,
      normalizedQuery,
      intent,
      subjectCode,
      subjectName,
      topicId,
      topicTitle,
      marks,
      language,
      requiresCitations: true,
      sourceScope
    };
  }
}
