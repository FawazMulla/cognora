import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { knowledgeGraphNodes } from "../../db/schema";
import { env } from "../env";
import { eq, and, ilike } from "drizzle-orm";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export interface KnowledgeGraphInput {
  userId: string;
  subjectId?: string | undefined;
  queryLabel?: string | undefined;
}

export interface KGNode {
  id: string;
  label: string;
  nodeType: string;
  relatedConcepts: string[];
}

/**
 * Tool: knowledge_graph
 * Queries stored concept nodes for semantic enrichment of AI responses.
 * Returns related concepts and their relationships.
 */
export async function knowledgeGraphTool(input: KnowledgeGraphInput): Promise<{ nodes: KGNode[]; conceptChain: string }> {
  try {
    const conditions: any[] = [eq(knowledgeGraphNodes.userId, input.userId)];
    if (input.subjectId) conditions.push(eq(knowledgeGraphNodes.subjectId, input.subjectId));
    if (input.queryLabel) conditions.push(ilike(knowledgeGraphNodes.label, `%${input.queryLabel}%`));

    const nodes = await db.select().from(knowledgeGraphNodes)
      .where(and(...conditions))
      .limit(20);

    if (nodes.length === 0) {
      return {
        nodes: [],
        conceptChain: "[No knowledge graph nodes found — reasoning from general subject knowledge.]"
      };
    }

    const kgNodes: KGNode[] = nodes.map((n: any) => ({
      id: n.id,
      label: n.label,
      nodeType: n.nodeType,
      relatedConcepts: []
    }));

    const conceptChain = `Related Concepts from your notes: ${kgNodes.map(n => `${n.label} (${n.nodeType})`).join(' → ')}`;

    return { nodes: kgNodes, conceptChain };
  } catch (err) {
    console.error('[knowledge-graph-tool] Error:', err);
    return { nodes: [], conceptChain: '' };
  }
}
