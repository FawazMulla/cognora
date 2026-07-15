import { vectorRetrievalTool } from "../tools/vector-retrieval.tool";
import { aiGateway, InvokeOptions } from "../ai-gateway";

export interface RagContext {
  userId: string;
  subjectId: string;
  query: string;
  goalMode: string;
}

export async function runRagPipeline(context: RagContext) {
  // 1. load_student_model via high-context option — now handled inside buildHighContext
  
  // 2. vector_search using the tool directly for granular control
  const minSimilarity = context.goalMode === "Exam" ? 0.70 : 0.50;
  const ragResult = await vectorRetrievalTool({
    userId: context.userId,
    subjectId: context.subjectId,
    query: context.query,
    topK: 5
  });

  const chunks = ragResult.chunks.filter(c => c.similarity >= minSimilarity);

  // 3. branch(chunks found / not found)
  if (chunks.length === 0) {
    if (context.goalMode === "Exam") {
      return { answer: "Please upload relevant material for your exam.", citations: [] };
    } else {
      const invokeOptions: InvokeOptions = {
        userId: context.userId,
        subjectId: context.subjectId,
        useHighContext: true,
        useTools: true,
      };
      const generated = await aiGateway.invoke("answer_gen", { text: context.query }, invokeOptions);
      return {
        answer: "I couldn't find this in your notes, but generally speaking: " + generated.answer,
        citations: []
      };
    }
  }

  // 4. build_grounded_prompt using retrieved chunks
  const groundedContext = chunks.map((c, i) => `[Source ${i+1}]: ${c.content}`).join("\n\n");

  // 5. invoke_answer_generator with high-context enabled
  const invokeOptions: InvokeOptions = {
    userId: context.userId,
    subjectId: context.subjectId,
    useHighContext: true,
    useTools: true,
    extraContext: `GROUNDED CONTEXT FROM YOUR NOTES:\n${groundedContext}`
  };

  const generated = await aiGateway.invoke("answer_gen", { text: context.query }, invokeOptions);

  // 6. quality_verify (stubbed check)
  if (generated.wordCount > 1000) {
    console.warn("Quality verify failed: answer too long");
  }

  // 7. return_with_citations
  const citations = chunks.map((c, i) => ({ docId: c.resourceId, chunkIndex: c.chunkIndex, sourceIndex: i + 1 }));
  return { answer: generated.answer, citations };
}
