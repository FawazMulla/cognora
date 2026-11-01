import { getDb } from '../../../db';
import { resourceChunks, resources } from '../../../db/schema';
import { eq, ilike, and, or, sql } from 'drizzle-orm';
import { ATLAS_SUBJECTS } from '../../atlasCatalogue';
import { AcademicCitation, AcademicSourceType } from '../knowledge/types';
import { ParsedAcademicQuery } from './query-parser';

export interface RetrievedChunk {
  chunkId: string;
  resourceId?: string | undefined;
  sourceTitle: string;
  sourceType: AcademicSourceType;
  pageNumber?: number | undefined;
  content: string;
  score: number;
  subjectCode?: string | undefined;
  metadata?: any | undefined;
}

export interface RetrievalResult {
  query: string;
  chunks: RetrievedChunk[];
  citations: AcademicCitation[];
  groundedContextText: string;
  confidence: number;
  isGroundedInOfficialSyllabus: boolean;
}

export class HybridRetrievalEngine {
  /**
   * Executes multi-stage hybrid retrieval combining:
   * 1. Official Mumbai University Atlas Catalog Search (Syllabus & Units)
   * 2. Database Chunk Lexical Search (SQL ILIKE & word occurrences)
   * 3. Reciprocal Rank Fusion (RRF) for robust multi-source ranking
   */
  public static async retrieve(
    parsedQuery: ParsedAcademicQuery,
    userId?: string,
    limit: number = 6
  ): Promise<RetrievalResult> {
    const rawTokens = parsedQuery.rawQuery
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const atlasMatches: RetrievedChunk[] = [];
    const dbMatches: RetrievedChunk[] = [];

    // Stage 1: Official Atlas Syllabus Extraction
    if (parsedQuery.sourceScope !== 'STUDENT_UPLOADS') {
      const targetSubjects = parsedQuery.subjectCode
        ? ATLAS_SUBJECTS.filter((s) => s.code.toLowerCase() === parsedQuery.subjectCode?.toLowerCase())
        : ATLAS_SUBJECTS;

      for (const sub of targetSubjects) {
        for (const mod of sub.modules) {
          // Check module match
          const modText = `${mod.title} ${mod.topics.map((t) => t.title + ' ' + t.description).join(' ')}`.toLowerCase();
          let modScore = 0;
          for (const token of rawTokens) {
            if (modText.includes(token)) modScore += 1;
          }

          for (const topic of mod.topics) {
            const topicText = `${topic.title} ${topic.shortTitle} ${topic.description} ${topic.keyPoints?.join(' ') || ''}`.toLowerCase();
            let score = modScore * 0.5;
            for (const token of rawTokens) {
              if (topicText.includes(token)) score += 2;
            }

            if (parsedQuery.topicId && topic.id === parsedQuery.topicId) {
              score += 10;
            }

            if (score > 1) {
              atlasMatches.push({
                chunkId: `atlas-${sub.code}-${mod.id}-${topic.id}`,
                sourceTitle: `${sub.name} (${sub.code}) - Official Syllabus`,
                sourceType: 'OFFICIAL_SYLLABUS',
                pageNumber: 1, // Official Syllabus definition
                content: `[Module ${mod.id}: ${mod.title}]\nTopic: ${topic.title}\nDescription: ${topic.description}\nPrerequisites: ${topic.prerequisites?.join(', ') || 'None'}\nEstimated Duration: ${topic.estimatedDuration}\nKey Objectives: ${topic.keyPoints?.join('; ') || 'Core University Syllabus Standard'}`,
                score,
                subjectCode: sub.code,
              });
            }
          }
        }
      }
    }

    // Stage 2: Database Chunks (Indexed Student Uploads, Notes, PYQs)
    if (parsedQuery.sourceScope !== 'OFFICIAL_SYLLABUS') {
      try {
        const db = getDb();
        if (db) {
          // Construct search condition using highest-signal keywords
          const significantTokens = rawTokens.slice(0, 4);
          if (significantTokens.length > 0) {
            const conditions = significantTokens.map((t) => ilike(resourceChunks.content, `%${t}%`));
            
            const results = await db
              .select({
                chunkId: resourceChunks.id,
                resourceId: resourceChunks.resourceId,
                pageNumber: resourceChunks.pageNumber,
                content: resourceChunks.content,
                filename: resources.filename,
                intelligenceData: resources.intelligenceData,
              })
              .from(resourceChunks)
              .leftJoin(resources, eq(resourceChunks.resourceId, resources.id))
              .where(or(...conditions))
              .limit(limit * 2);

            for (const row of results) {
              let score = 0;
              const contentLower = row.content.toLowerCase();
              for (const tok of rawTokens) {
                if (contentLower.includes(tok)) score += 1;
              }

              const intel = (row.intelligenceData as any) || {};
              const sourceType: AcademicSourceType = intel.sourceType || 'STUDENT_UPLOAD';

              dbMatches.push({
                chunkId: row.chunkId,
                resourceId: row.resourceId || undefined,
                sourceTitle: row.filename || 'Academic Resource',
                sourceType,
                pageNumber: row.pageNumber || undefined,
                content: row.content,
                score,
                subjectCode: intel.subjectCode,
              });
            }
          }
        }
      } catch (err) {
        console.warn('[HybridRetrievalEngine] DB search failed or uninitialized, falling back to Atlas:', err);
      }
    }

    // Stage 3: Reciprocal Rank Fusion (RRF)
    // RRF Score = 1 / (60 + rank_atlas) + 1 / (60 + rank_db)
    const kRRF = 60;
    const combinedMap = new Map<string, { chunk: RetrievedChunk; rrfScore: number }>();

    atlasMatches
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .forEach((chunk, rank) => {
        const rrf = 1.0 / (kRRF + (rank + 1));
        combinedMap.set(chunk.chunkId, { chunk, rrfScore: rrf });
      });

    dbMatches
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .forEach((chunk, rank) => {
        const existing = combinedMap.get(chunk.chunkId);
        const rrf = 1.0 / (kRRF + (rank + 1));
        if (existing) {
          existing.rrfScore += rrf;
        } else {
          combinedMap.set(chunk.chunkId, { chunk, rrfScore: rrf });
        }
      });

    const rankedChunks = Array.from(combinedMap.values())
      .sort((a, b) => b.rrfScore - a.rrfScore)
      .slice(0, limit)
      .map((item) => ({
        ...item.chunk,
        score: Number(item.rrfScore.toFixed(4)),
      }));

    // Generate citations
    const citations: AcademicCitation[] = rankedChunks.map((chunk) => ({
      sourceId: chunk.chunkId,
      sourceTitle: chunk.sourceTitle,
      sourceType: chunk.sourceType,
      pageNumber: chunk.pageNumber,
      sectionHeading: chunk.subjectCode ? `${chunk.subjectCode} Syllabus Specification` : undefined,
      extractedSnippet: chunk.content.slice(0, 180) + (chunk.content.length > 180 ? '...' : ''),
      verificationStatus: chunk.sourceType === 'OFFICIAL_SYLLABUS' ? 'OFFICIAL_SYLLABUS' : 'VERIFIED',
    }));

    // Assemble grounded context text
    const groundedContextText = rankedChunks
      .map((c, i) => `--- SOURCE [${i + 1}]: ${c.sourceTitle}${c.pageNumber ? ` (Page ${c.pageNumber})` : ''} ---\n${c.content}`)
      .join('\n\n');

    const isGroundedInOfficialSyllabus = rankedChunks.some((c) => c.sourceType === 'OFFICIAL_SYLLABUS');
    const confidence = rankedChunks.length > 0 ? Math.min(1.0, 0.5 + rankedChunks.length * 0.1) : 0.2;

    return {
      query: parsedQuery.rawQuery,
      chunks: rankedChunks,
      citations,
      groundedContextText,
      confidence,
      isGroundedInOfficialSyllabus,
    };
  }
}
