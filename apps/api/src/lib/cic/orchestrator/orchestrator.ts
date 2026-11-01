import { QueryUnderstandingParser, ParsedAcademicQuery, AnswerScheme } from '../retrieval/query-parser';
import { HybridRetrievalEngine, RetrievalResult } from '../retrieval/hybrid-engine';
import { DeterministicAnswerCache } from '../cache/deterministic-cache';
import { AcademicQualityVerifier, VerificationReport } from '../quality/verifier';
import { AcademicCitation } from '../knowledge/types';
import { callOciCohereChat } from '../../oci-client';
import { aiGateway } from '../../ai-gateway';

export interface OrchestrationRequest {
  query: string;
  subjectCode?: string | undefined;
  marks?: AnswerScheme | undefined;
  language?: ('english' | 'hinglish') | undefined;
  sourceScope?: ('OFFICIAL_SYLLABUS' | 'STUDENT_UPLOADS' | 'ALL_ACADEMIC_RESOURCES') | undefined;
  forceLive?: boolean | undefined;
  userId?: string | undefined;
}

export interface OrchestrationResponse {
  answer: string;
  query: string;
  intent: string;
  marks: AnswerScheme;
  language: 'english' | 'hinglish';
  subjectCode?: string | undefined;
  citations: AcademicCitation[];
  verification: VerificationReport;
  retrievedChunksCount: number;
  isGroundedInOfficialSyllabus: boolean;
  executionTimeMs: number;
  cached: boolean;
  modelUsed: string;
}

export class GroundedAiOrchestrator {
  /**
   * Main entry point for grounded academic intelligence.
   */
  public static async orchestrate(
    request: OrchestrationRequest
  ): Promise<OrchestrationResponse> {
    const startTime = Date.now();

    // 1. Query Understanding & Parsing
    const parsedQuery: ParsedAcademicQuery = QueryUnderstandingParser.parse(request.query);
    if (request.subjectCode) parsedQuery.subjectCode = request.subjectCode;
    if (request.marks) parsedQuery.marks = request.marks;
    if (request.language) parsedQuery.language = request.language;
    if (request.sourceScope) parsedQuery.sourceScope = request.sourceScope;

    // 2. Deterministic Cache Check (Immediate Zero-Latency)
    const cacheKey = DeterministicAnswerCache.generateKey({
      query: parsedQuery.rawQuery,
      marks: parsedQuery.marks,
      subjectCode: parsedQuery.subjectCode,
      intent: parsedQuery.intent,
      language: parsedQuery.language,
    });

    if (!request.forceLive) {
      const cached = DeterministicAnswerCache.get<OrchestrationResponse>(cacheKey);
      if (cached) {
        return {
          ...cached,
          cached: true,
          executionTimeMs: Date.now() - startTime,
        };
      }
    }

    // 3. Multi-source Hybrid Retrieval
    const retrieval: RetrievalResult = await HybridRetrievalEngine.retrieve(
      parsedQuery,
      request.userId,
      6
    );

    // 4. Construct Academic Prompt Grounded in Mumbai University Standards
    const prompt = this.buildPrompt(parsedQuery, retrieval);
    const systemPrompt = this.buildSystemPrompt(parsedQuery);

    let answer = '';
    let modelUsed = 'cohere.command-a-03-2025';

    try {
      // Primary: OCI Cohere Command A
      answer = await callOciCohereChat({
        message: prompt,
        systemPrompt,
        maxTokens: parsedQuery.marks === 15 ? 1800 : parsedQuery.marks === 10 ? 1200 : 700,
        temperature: 0.3, // Lower temperature for high factual precision
      });
    } catch (ociErr) {
      console.warn('[GroundedAiOrchestrator] OCI inference failed or unconfigured, falling back to AI Gateway:', ociErr);
      try {
        const fallbackRes = await aiGateway.invoke('answer_gen', {
          prompt,
          systemPrompt,
        });
        answer = typeof fallbackRes === 'string' ? fallbackRes : fallbackRes?.answer || JSON.stringify(fallbackRes);
        modelUsed = 'gemini-fallback';
      } catch (fbErr) {
        console.error('[GroundedAiOrchestrator] All AI providers failed:', fbErr);
        // Fallback to grounded synthesis from retrieved chunks
        answer = this.synthesizeDirectFromCitations(parsedQuery, retrieval);
        modelUsed = 'atlas-grounded-synthesis';
      }
    }

    // 5. Verification & Quality Guardrails
    const verification: VerificationReport = AcademicQualityVerifier.verify(
      answer,
      retrieval.citations,
      parsedQuery.marks,
      retrieval.groundedContextText
    );

    const response: OrchestrationResponse = {
      answer,
      query: parsedQuery.rawQuery,
      intent: parsedQuery.intent,
      marks: parsedQuery.marks,
      language: parsedQuery.language,
      subjectCode: parsedQuery.subjectCode,
      citations: verification.verifiedCitations,
      verification,
      retrievedChunksCount: retrieval.chunks.length,
      isGroundedInOfficialSyllabus: retrieval.isGroundedInOfficialSyllabus,
      executionTimeMs: Date.now() - startTime,
      cached: false,
      modelUsed,
    };

    // Store in deterministic cache
    DeterministicAnswerCache.set(cacheKey, response);

    return response;
  }

  private static buildSystemPrompt(query: ParsedAcademicQuery): string {
    const langDirective =
      query.language === 'hinglish'
        ? 'Explain technical concepts clearly in bilingual Hinglish (natural conversational Hindi mixed with English technical terms), perfect for Indian engineering students, while keeping all mathematical formulas, diagrams, and definitions accurate.'
        : 'Deliver an authoritative, academic response in formal English adhering strictly to university examination standards.';

    return `You are the Cognora Academic Intelligence Core, a senior engineering professor and exam evaluator for Mumbai University (Sem VII).
${langDirective}

GUIDELINES:
1. Base your answer strictly on the provided verified courseware and syllabus context whenever available.
2. Structure your answer explicitly for a ${query.marks}-Mark university examination question:
   - 2 Marks: Precise definition, primary formula, or direct distinction in 40-70 words.
   - 5 Marks: Definition, clear bulleted points, architecture or mathematical relation, 150-250 words.
   - 10 Marks: Standard Topper Blueprint (1. Core Definition/Principle, 2. Architectural Blueprint / Diagram Description, 3. Mathematical Formulation with clean LaTeX $$...$$, 4. Step-by-Step Mechanism / Breakdown, 5. Real-World Engineering Example or Trade-Off Analysis), 400-600 words.
   - 15 Marks: Exhaustive University Master Answer with deep derivations, edge-cases, comparative table, and architecture.
3. Use clean LaTeX formatting for math: enclose inline formulas in single dollar signs $...$ and block equations in double dollar signs $$...$$.
4. Provide structured headings and bullet points. Never hallucinate fake references.`;
  }

  private static buildPrompt(query: ParsedAcademicQuery, retrieval: RetrievalResult): string {
    return `QUESTION / PROMPT:
"${query.rawQuery}"

TARGET SPECIFICATIONS:
- Subject: ${query.subjectName || query.subjectCode || 'Engineering Curriculum'}
- Weightage Scheme: ${query.marks} Marks Standard
- Format Style: University Topper Blueprint
- Language Mode: ${query.language === 'hinglish' ? 'Hinglish Clarification' : 'Formal English'}

VERIFIED ACADEMIC EVIDENCE & SYLLABUS CONTEXT:
${retrieval.groundedContextText || 'No external textbook text indexed. Adhere strictly to the standard Mumbai University syllabus core theorems.'}

Please generate the complete, high-scoring university examination answer following the specified mark structure now.`;
  }

  private static synthesizeDirectFromCitations(
    query: ParsedAcademicQuery,
    retrieval: RetrievalResult
  ): string {
    const primaryChunk = retrieval.chunks[0];
    if (!primaryChunk) {
      return `### Overview for ${query.rawQuery} (${query.marks} Marks)\n\nThis academic concept is covered under the Mumbai University curriculum. Primary reference documents are currently being indexed. Please verify with your professor or refer to the official syllabus document in the Atlas.`;
    }

    return `### Academic Reference: ${query.rawQuery} (${query.marks} Marks Standard)\n\n**Source:** ${primaryChunk.sourceTitle}${primaryChunk.pageNumber ? ` (Page ${primaryChunk.pageNumber})` : ''}\n\n${primaryChunk.content}\n\n*Note: Synthesized directly from verified syllabus repository.*`;
  }
}
