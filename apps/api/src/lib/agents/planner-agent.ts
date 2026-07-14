import { aiGateway } from "../ai-gateway";

export interface PlannerContext {
  userId: string;
  exams: any[];
  weakTopics: any[];
  availableStudyMinutes: number;
}

export async function generateDailyPlanNode(context: PlannerContext) {
  // Construct context string
  const examStr = context.exams.map(e => `${e.name} on ${e.examDate}`).join(', ');
  const weakStr = context.weakTopics.map(t => `${t.subjectId}: ${t.topic}`).join(', ');

  const prompt = `Generate a daily study plan for a student with ${context.availableStudyMinutes} minutes available today.
  Upcoming exams: ${examStr || 'None'}
  Weak topics to prioritize: ${weakStr || 'None'}`;

  // Call the planner model via Gateway
  const plan = await aiGateway.invoke("plan_gen", { text: prompt });

  return {
    dailyPlan: plan.plan || "Mock study plan: 1. Review flashcards (20m). 2. Study weak topics (60m). 3. PYQs (40m)."
  };
}
