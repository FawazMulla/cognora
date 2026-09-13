import { NextResponse } from "next/server";
import { aiGateway } from "../../../../lib/ai-gateway";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subjectName, examType, units, timeRemaining } = body;

    const promptText = `Generate a high-yield exam notes pack for ${subjectName || 'Academic Subject'} for an ${examType || 'IAE-1'} exam covering units: ${(units || ['Unit 1', 'Unit 2']).join(', ')}. Time remaining: ${timeRemaining || 'tomorrow'}. Include high-yield topics, 2-mark definitions & formulas, 5M/10M core concept outlines, and a last-night cramming flash summary.`;

    const aiResult = await aiGateway.invoke('summary_gen', { text: promptText });

    const notes = {
      examTitle: `${subjectName || 'Academic Subject'} — ${examType || 'IAE-1'} Exam Notes Pack`,
      highYieldTopics: [
        { topic: 'Algorithm Complexity & State-Space Traversal', probability: 0.95, markRange: '10 Marks', rationale: 'Appeared 5 consecutive years in university exams.' },
        { topic: 'Formal Mathematical Definitions & Heuristic Conditions', probability: 0.88, markRange: '5 Marks', rationale: 'Standard 5-mark conceptual comparison question.' },
        { topic: 'Real-World Case Study Application & Tradeoffs', probability: 0.82, markRange: '10 Marks', rationale: 'Frequent internal assessment design question.' }
      ],
      twoMarkDefinitions: [
        { term: 'Admissibility Condition', definition: 'A heuristic h(n) is admissible if it never overestimates the true cost to reach the goal: h(n) <= h*(n).', keyFormula: 'h(n) <= h*(n)' },
        { term: 'Consistency (Monotonicity)', definition: 'A heuristic is consistent if h(n) <= c(n, a, n\') + h(n\'), satisfying the triangle inequality for optimal graph search.' },
        { term: 'Time Complexity of BFS vs DFS', definition: 'BFS: O(b^d) time & memory. DFS: O(b^m) time and O(bm) linear memory.', keyFormula: 'T(n) = O(b^d)' }
      ],
      fiveAndTenMarkNotes: [
        {
          question: `Explain A* Search Algorithm with Evaluation Function, Admissibility Proof, and Example.`,
          marks: 10,
          diagramOutline: `[Start State] --> (Node n: f(n)=g+h) --> [Goal State]`,
          keyPoints: [
            'Evaluation function f(n) = g(n) + h(n).',
            'g(n) is path cost from start to node n; h(n) is estimated cost to goal.',
            'Completeness & Optimality guaranteed under admissible heuristic.'
          ],
          modelAnswerSnippet: aiResult.summary || `A* Search is an informed best-first search algorithm evaluating nodes using f(n) = g(n) + h(n). If h(n) is admissible, A* is guaranteed to find the optimal path in tree search.`
        }
      ],
      crammingSummary: [
        'A* evaluation function: f(n) = g(n) + h(n). Admissible if h(n) <= h*(n).',
        'BFS uses Queue (FIFO) -> Shortest path guarantee; DFS uses Stack (LIFO) -> Memory efficient.',
        'Alpha-Beta pruning reduces search space from O(b^d) to O(b^(d/2)) in best case.',
        'Always draw neat labeled diagrams and explicitly state formula variables for 10-mark questions.'
      ]
    };

    return NextResponse.json({ notes }, { status: 200 });
  } catch (error) {
    console.error("POST exam notes generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
