import { searchVectors } from "../vector-search";
import { aiGateway } from "../ai-gateway";

export interface RagContext {
  userId: string;
  subjectId: string;
  query: string;
  goalMode: string;
}

export async function runRagPipeline(context: RagContext) {
  // 1. load_student_model (mocking this as a simple context injection for now)
  const studentModel = { preferredAnswerLength: "medium", learningPace: "standard" };
  
  // 2. vector_search
  const minSimilarity = context.goalMode === "Exam" ? 0.70 : 0.50;
  const chunks = await searchVectors(context.userId, context.subjectId, context.query, 5, minSimilarity);

  // 3. branch(chunks found / not found)
  if (chunks.length === 0) {
    if (context.goalMode === "Exam") {
      return { answer: "Please upload relevant material for your exam.", citations: [] };
    } else {
      return { 
        answer: "I couldn't find this in your notes, but generally speaking: " + 
                (await aiGateway.invoke("answer_gen", { text: context.query })).answer, 
        citations: [] 
      };
    }
  }

  // 4. build_grounded_prompt
  const groundedContext = chunks.map(c => `[Doc ${c.id}, Pg ${c.pageNumber || 'N/A'}]: ${c.content}`).join("\n\n");
  const prompt = `Use the following context to answer the user's question:\n${groundedContext}\n\nQuestion: ${context.query}`;

  // 5. invoke_answer_generator
  const generated = await aiGateway.invoke("answer_gen", { text: prompt });

  // 6. quality_verify (stubbed check)
  if (generated.wordCount > 1000) {
    // mock rejection
    console.warn("Quality verify failed: answer too long");
  }

  // 7. return_with_citations
  const citations = chunks.map(c => ({ docId: c.id, page: c.pageNumber }));
  return { answer: generated.answer, citations };
}
