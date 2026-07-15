import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { knowledgeGraphNodes, pyqQuestions, flashcards } from "../../../../../db/schema";
import { env } from "../../../../../lib/env";
import { eq, and } from "drizzle-orm";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const subjectId = params.id;

    const nodes = await db.select().from(knowledgeGraphNodes).where(
      and(eq(knowledgeGraphNodes.userId, userId), eq(knowledgeGraphNodes.subjectId, subjectId))
    ).limit(50);

    const pyqs = await db.select().from(pyqQuestions).where(
      and(eq(pyqQuestions.userId, userId), eq(pyqQuestions.subjectId, subjectId))
    ).limit(30);

    const cards = await db.select().from(flashcards).where(
      and(eq(flashcards.userId, userId), eq(flashcards.subjectId, subjectId))
    ).limit(20);

    // If no nodes in DB, return mock knowledge graph
    if (nodes.length === 0) {
      const mockNodes = [
        { id: 'n1', label: 'A* Search', type: 'Algorithm', x: 300, y: 200, mastery: 'strong' },
        { id: 'n2', label: 'Heuristic Function', type: 'Concept', x: 150, y: 100, mastery: 'improving' },
        { id: 'n3', label: 'Admissibility', type: 'Property', x: 150, y: 300, mastery: 'weak' },
        { id: 'n4', label: 'BFS', type: 'Algorithm', x: 450, y: 100, mastery: 'strong' },
        { id: 'n5', label: 'DFS', type: 'Algorithm', x: 450, y: 300, mastery: 'strong' },
        { id: 'n6', label: 'Alpha-Beta Pruning', type: 'Algorithm', x: 600, y: 200, mastery: 'weak' },
        { id: 'n7', label: 'Expert Systems', type: 'System', x: 300, y: 380, mastery: 'improving' },
        { id: 'n8', label: 'Knowledge Base', type: 'Component', x: 150, y: 450, mastery: 'improving' }
      ];
      const mockEdges = [
        { source: 'n1', target: 'n2', label: 'uses' },
        { source: 'n1', target: 'n3', label: 'requires' },
        { source: 'n2', target: 'n3', label: 'defines' },
        { source: 'n4', target: 'n1', label: 'extends' },
        { source: 'n5', target: 'n6', label: 'used by' },
        { source: 'n7', target: 'n8', label: 'contains' },
        { source: 'n7', target: 'n2', label: 'applies' }
      ];
      return NextResponse.json({ nodes: mockNodes, edges: mockEdges, pyqs: pyqs.slice(0, 5), cards: cards.slice(0, 5) });
    }

    const graphNodes = nodes.map((n: any) => ({
      id: n.id,
      label: n.label,
      type: n.nodeType,
      mastery: 'none',
      x: Math.random() * 600,
      y: Math.random() * 400
    }));

    return NextResponse.json({ nodes: graphNodes, edges: [], pyqs: pyqs.slice(0, 5), cards: cards.slice(0, 5) });
  } catch (error) {
    console.error("GET knowledge-graph error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
