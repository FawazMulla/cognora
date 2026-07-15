import { aiGateway, InvokeOptions } from "../ai-gateway";
import { studentContextTool } from "../tools/student-context.tool";

export interface PlannerContext {
  userId: string;
  exams: any[];
  weakTopics: any[];
  availableStudyMinutes: number;
}

export async function generateDailyPlanNode(context: PlannerContext) {
  // Fetch live student context for personalization
  let studentProfile = '';
  try {
    const studentCtx = await studentContextTool({ userId: context.userId });
    if (studentCtx.systemPromptInjection) {
      studentProfile = studentCtx.systemPromptInjection;
    }
  } catch (e) { /* ignore — fallback to basic prompt */ }

  // Construct context string
  const examStr = context.exams.map(e => `${e.name} on ${e.examDate}`).join(', ');
  const weakStr = context.weakTopics.map(t => `${t.subjectId}: ${t.topic}`).join(', ');

  const prompt = `Generate a personalized daily study plan for a student with ${context.availableStudyMinutes} minutes available today.
  Upcoming exams: ${examStr || 'None'}
  Weak topics to prioritize: ${weakStr || 'None'}`;

  // Use high-context + tools for a deeply personalized plan
  const invokeOptions: InvokeOptions = {
    userId: context.userId,
    useHighContext: true,
    useTools: true,
    extraContext: studentProfile ?? undefined,
  };

  const plan = await aiGateway.invoke("study_plan_gen", { text: prompt }, invokeOptions);

  return {
    dailyPlan: plan.plan || "Mock study plan: 1. Review flashcards (20m). 2. Study weak topics (60m). 3. PYQs (40m)."
  };
}
