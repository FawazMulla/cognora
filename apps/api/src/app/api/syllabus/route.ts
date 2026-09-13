import { NextResponse } from "next/server";
import { aiGateway } from "../../../lib/ai-gateway";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

    // Return structured units for subject
    const defaultUnits = [
      {
        id: 'u-1',
        unitNumber: 1,
        title: 'Unit 1: Fundamentals & System Blueprint',
        weightagePercentage: 20,
        learningOutcomes: 'Master architectural paradigms and system execution bounds.',
        topics: [
          { id: 't-1-1', title: 'Foundational Definitions & Terminology', completed: true },
          { id: 't-1-2', title: 'System Architecture & Data Flow Models', completed: true },
          { id: 't-1-3', title: 'State-Space Representation', completed: false }
        ]
      },
      {
        id: 'u-2',
        unitNumber: 2,
        title: 'Unit 2: Core Algorithms & Traversal Techniques',
        weightagePercentage: 25,
        learningOutcomes: 'Evaluate algorithm complexity and optimality proofs.',
        topics: [
          { id: 't-2-1', title: 'Uninformed Search: BFS & DFS Analysis', completed: true },
          { id: 't-2-2', title: 'Informed Search: A* & Heuristic Optimality', completed: false },
          { id: 't-2-3', title: 'Alpha-Beta Pruning & Minimax Decision Trees', completed: false }
        ]
      },
      {
        id: 'u-3',
        unitNumber: 3,
        title: 'Unit 3: Formal Logic & Knowledge Representation',
        weightagePercentage: 25,
        learningOutcomes: 'Formulate first-order logic systems and knowledge graphs.',
        topics: [
          { id: 't-3-1', title: 'First-Order Predicate Logic (FOL)', completed: false },
          { id: 't-3-2', title: 'Unification & Resolution Proof Strategies', completed: false }
        ]
      },
      {
        id: 'u-4',
        unitNumber: 4,
        title: 'Unit 4: Advanced Topics & Exam Applications',
        weightagePercentage: 30,
        learningOutcomes: 'Analyze real-world university PYQ patterns.',
        topics: [
          { id: 't-4-1', title: 'Probabilistic Reasoning & Bayesian Inference', completed: false },
          { id: 't-4-2', title: 'Machine Learning Classification Pipelines', completed: false }
        ]
      }
    ];

    return NextResponse.json({ subjectId, units: defaultUnits }, { status: 200 });
  } catch (error) {
    console.error("GET syllabus error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rawText } = body;

    if (!rawText) {
      return NextResponse.json({ error: "rawText is required for auto-extraction" }, { status: 400 });
    }

    // Call AI Gateway for extraction
    const aiResult = await aiGateway.invoke('knowledge_extraction', { text: rawText });

    const units = [
      {
        id: `u-ext-${Date.now()}-1`,
        unitNumber: 1,
        title: 'Extracted Unit 1: Foundations & Core Concepts',
        weightagePercentage: 30,
        learningOutcomes: 'Master core principles extracted from syllabus document.',
        topics: (aiResult.nodes || [
          { label: 'Fundamental Definitions' },
          { label: 'System Architecture' }
        ]).map((node: any, idx: number) => ({
          id: `ext-tp-${idx}`,
          title: node.label || `Topic ${idx + 1}`,
          completed: false
        }))
      }
    ];

    return NextResponse.json({ units }, { status: 200 });
  } catch (error) {
    console.error("POST syllabus extraction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
