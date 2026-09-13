import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

    const defaultQuestions = [
      {
        id: 'qb-1',
        questionText: 'Explain the working of A* Search algorithm with an evaluation function and admissibility conditions.',
        unit: 'Unit 1',
        marks: 10,
        tags: ['IAE', 'PYQ', 'Theory'],
        frequencyCount: 5
      },
      {
        id: 'qb-2',
        questionText: 'Differentiate between BFS and DFS in terms of queue/stack usage, completeness, and optimality.',
        unit: 'Unit 1',
        marks: 5,
        tags: ['IAE', 'Theory'],
        frequencyCount: 4
      },
      {
        id: 'qb-3',
        questionText: 'Define Admissibility and Consistency for search heuristics with mathematical inequality expressions.',
        unit: 'Unit 2',
        marks: 2,
        tags: ['Theory', 'Numerical'],
        frequencyCount: 3
      },
      {
        id: 'qb-4',
        questionText: 'Demonstrate Alpha-Beta pruning on a 3-level minimax tree diagram, calculating alpha/beta cutoff values.',
        unit: 'Unit 2',
        marks: 10,
        tags: ['IAE', 'PYQ', 'Diagram'],
        frequencyCount: 4
      },
      {
        id: 'qb-5',
        questionText: 'Formulate First-Order Predicate Logic (FOL) for the statement: "Every student who studies hard passes exams."',
        unit: 'Unit 3',
        marks: 5,
        tags: ['PYQ', 'Numerical'],
        frequencyCount: 2
      }
    ];

    return NextResponse.json({ subjectId, questions: defaultQuestions }, { status: 200 });
  } catch (error) {
    console.error("GET question bank error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { questionText, unit, marks, tags } = body;

    if (!questionText) {
      return NextResponse.json({ error: "questionText is required" }, { status: 400 });
    }

    const newQuestion = {
      id: `qb-${Date.now()}`,
      questionText,
      unit: unit || 'Unit 1',
      marks: marks || 5,
      tags: tags || ['Theory'],
      frequencyCount: 1
    };

    return NextResponse.json({ question: newQuestion }, { status: 201 });
  } catch (error) {
    console.error("POST question bank error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
