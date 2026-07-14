import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env";
import { resourceChunks } from "../db/schema";
import { sql } from "drizzle-orm";
import { aiGateway } from "./ai-gateway";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export interface VectorSearchResult {
  id: string;
  content: string;
  pageNumber: number | null;
  similarity: number;
}

export async function searchVectors(
  userId: string,
  subjectId: string,
  query: string,
  k: number = 5,
  minSimilarity: number = 0.50
): Promise<VectorSearchResult[]> {
  // 1. Get embedding for the query
  const { embedding: queryEmbedding } = await aiGateway.invoke("embedding", { text: query });

  // 2. Format embedding to Postgres vector string '[0.1, 0.2, ...]'
  const embeddingString = `[${queryEmbedding.join(",")}]`;

  // 3. Execute pgvector cosine similarity search
  // Drizzle doesn't perfectly support cosine similarity distance ordering directly yet, 
  // so we use raw SQL to find nearest neighbors.
  // pgvector uses `<=>` for cosine distance. Similarity = 1 - distance.
  const results = await db.execute(sql`
    SELECT 
      id, 
      content, 
      page_number as "pageNumber", 
      1 - (embedding <=> ${embeddingString}::vector) as similarity
    FROM resource_chunks
    WHERE user_id = ${userId}
      AND subject_id = ${subjectId}
      AND 1 - (embedding <=> ${embeddingString}::vector) >= ${minSimilarity}
    ORDER BY embedding <=> ${embeddingString}::vector
    LIMIT ${k}
  `);

  return results.map((row: any) => ({
    id: row.id,
    content: row.content,
    pageNumber: row.pageNumber,
    similarity: row.similarity,
  }));
}
