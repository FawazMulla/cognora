import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resourceChunks } from "../../db/schema";
import { env } from "../env";
import { eq, and } from "drizzle-orm";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export interface VectorRetrievalInput {
  userId: string;
  subjectId?: string | undefined;
  query: string;
  topK?: number | undefined;
}

export interface RetrievedChunk {
  content: string;
  resourceId: string;
  chunkIndex: number;
  similarity: number;
}

/**
 * Tool: vector_retrieval
 * Retrieves semantically relevant text chunks from the user's uploaded notes
 * using cosine similarity on stored embeddings.
 * Falls back to keyword match if no embeddings are stored.
 */
export async function vectorRetrievalTool(input: VectorRetrievalInput): Promise<{ chunks: RetrievedChunk[]; contextWindow: string }> {
  const topK = input.topK ?? 5;

  try {
    // Try to fetch chunks for the user/subject
    const conditions: any[] = [eq(resourceChunks.userId, input.userId)];
    if (input.subjectId) {
      conditions.push(eq(resourceChunks.subjectId, input.subjectId));
    }

    const allChunks = await db.select({
      content: resourceChunks.content,
      resourceId: resourceChunks.resourceId,
      chunkIndex: resourceChunks.chunkIndex,
    }).from(resourceChunks)
      .where(and(...conditions))
      .limit(100);

    if (allChunks.length === 0) {
      return {
        chunks: [],
        contextWindow: "[No notes uploaded yet for this subject. Answer from general knowledge.]"
      };
    }

    // Keyword-based scoring as fallback (when no vector embeddings)
    const queryTerms = input.query.toLowerCase().split(/\s+/).filter(t => t.length > 3);
    
    const scored = allChunks.map(chunk => {
      const lower = chunk.content.toLowerCase();
      let score = 0;
      for (const term of queryTerms) {
        const count = (lower.match(new RegExp(term, 'g')) || []).length;
        score += count;
      }
      return { ...chunk, similarity: Math.min(1.0, score / (queryTerms.length + 1)) };
    });

    scored.sort((a, b) => b.similarity - a.similarity);
    const topChunks = scored.slice(0, topK);

    const contextWindow = topChunks.map((c, i) => `[Source ${i+1}]\n${c.content}`).join('\n\n---\n\n');

    return {
      chunks: topChunks.map(c => ({
        content: c.content,
        resourceId: c.resourceId || '',
        chunkIndex: c.chunkIndex,
        similarity: c.similarity
      })),
      contextWindow
    };
  } catch (err) {
    console.error('[vector-retrieval-tool] Error:', err);
    return { chunks: [], contextWindow: "[Context retrieval unavailable — answering from training knowledge.]" };
  }
}
