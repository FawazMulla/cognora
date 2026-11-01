import { AcademicCitation, AcademicEvidence } from '../knowledge/types';
import { AnswerScheme } from '../retrieval/query-parser';

export interface VerificationReport {
  isFullyGrounded: boolean;
  factualGroundednessScore: number;
  citationIntegrityScore: number;
  markSchemeComplianceScore: number;
  disclosedLimitations: string[];
  verifiedCitations: AcademicCitation[];
  wordCount: number;
  status: 'OPTIMAL' | 'ACCEPTABLE' | 'NEEDS_DISCLOSURE';
}

export class AcademicQualityVerifier {
  /**
   * Verifies an answer against retrieved citations and the target marks scheme.
   */
  public static verify(
    generatedAnswer: string,
    citations: AcademicCitation[],
    marks: AnswerScheme,
    evidenceContext: string
  ): VerificationReport {
    const wordCount = generatedAnswer.trim().split(/\s+/).filter(Boolean).length;
    const disclosedLimitations: string[] = [];

    // 1. Mark Scheme Compliance Scoring
    let minWords = 40;
    let maxWords = 90;
    if (marks === 2) {
      minWords = 35;
      maxWords = 100;
    } else if (marks === 5) {
      minWords = 130;
      maxWords = 300;
    } else if (marks === 10) {
      minWords = 320;
      maxWords = 750;
    } else if (marks === 15) {
      minWords = 600;
      maxWords = 1200;
    }

    let markSchemeComplianceScore = 1.0;
    if (wordCount < minWords) {
      markSchemeComplianceScore = Math.max(0.4, Number((wordCount / minWords).toFixed(2)));
      disclosedLimitations.push(`Answer length (${wordCount} words) is below recommended depth for ${marks} Marks standard.`);
    } else if (wordCount > maxWords * 1.5) {
      markSchemeComplianceScore = 0.85; // slightly over-verbose
    }

    // 2. Citation Integrity Scoring
    // Check if citations have valid identifiers and authentic pages
    let verifiedCount = 0;
    const verifiedCitations = citations.map((c) => {
      let isAuthentic = false;
      if (c.sourceType === 'OFFICIAL_SYLLABUS') {
        isAuthentic = true;
      } else if (c.pageNumber && c.pageNumber > 0 && c.extractedSnippet.length > 20) {
        isAuthentic = true;
      } else if (c.extractedSnippet.length > 30) {
        isAuthentic = true;
      }

      if (isAuthentic) verifiedCount++;
      return {
        ...c,
        verificationStatus: isAuthentic ? c.verificationStatus : ('UNVERIFIED' as const),
      };
    });

    const citationIntegrityScore = citations.length > 0
      ? Number((verifiedCount / citations.length).toFixed(2))
      : 0.5;

    // 3. Factual Groundedness
    // Check if key phrases in generated answer correspond to evidence context
    let groundedScore = 0.8;
    if (!evidenceContext || evidenceContext.trim().length === 0) {
      groundedScore = 0.35;
      disclosedLimitations.push('No primary university courseware chunks retrieved; synthesis based purely on academic AI baseline.');
    } else {
      // Sample key terms from answer
      const answerTerms = generatedAnswer
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 5);

      const uniqueTerms = Array.from(new Set(answerTerms)).slice(0, 30);
      const evidenceLower = evidenceContext.toLowerCase();
      let matchedTerms = 0;
      for (const t of uniqueTerms) {
        if (evidenceLower.includes(t)) matchedTerms++;
      }

      if (uniqueTerms.length > 0) {
        const overlapRatio = matchedTerms / uniqueTerms.length;
        groundedScore = Number(Math.min(1.0, 0.5 + overlapRatio * 0.6).toFixed(2));
      }
    }

    if (citations.length === 0) {
      disclosedLimitations.push('No direct textbook or syllabus page could be referenced for this specific variation.');
    }

    const isFullyGrounded = groundedScore >= 0.75 && citationIntegrityScore >= 0.8;
    const status = isFullyGrounded
      ? 'OPTIMAL'
      : disclosedLimitations.length > 0
      ? 'NEEDS_DISCLOSURE'
      : 'ACCEPTABLE';

    return {
      isFullyGrounded,
      factualGroundednessScore: groundedScore,
      citationIntegrityScore,
      markSchemeComplianceScore,
      disclosedLimitations,
      verifiedCitations,
      wordCount,
      status,
    };
  }
}

