import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env";
import { modelRouting, modelInvocationLogs } from "../db/schema";
import { eq } from "drizzle-orm";
import { redis } from "./redis";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export type TaskType = 
  | 'classification'
  | 'ocr'
  | 'chunking'
  | 'embedding'
  | 'knowledge_extraction'
  | 'summary_gen'
  | 'flashcard_gen'
  | 'quiz_gen'
  | 'answer_gen'
  | 'homework_gen';

export interface AIGateway {
  invoke(taskType: TaskType, input: any): Promise<any>;
}

export const aiGateway: AIGateway = {
  async invoke(taskType, input) {
    const startTime = Date.now();
    let fallbackUsed = false;
    let actualModel = "";
    
    try {
      // 1. Get routing config (cache in Redis with 60s TTL)
      const cacheKey = `routing:${taskType}`;
      let routeConfigStr = await redis.get(cacheKey);
      let routeConfig: any;

      if (routeConfigStr) {
        routeConfig = JSON.parse(routeConfigStr);
      } else {
        const routes = await db.select().from(modelRouting).where(eq(modelRouting.taskType, taskType)).limit(1);
        if (routes.length > 0) {
          routeConfig = routes[0];
          await redis.setex(cacheKey, 60, JSON.stringify(routeConfig));
        } else {
          // Default fallback if no DB routing
          routeConfig = { provider: "mock", modelName: "mock-model" };
        }
      }

      actualModel = routeConfig.modelName;

      // 2. Dispatch to provider (simulate call)
      let result = await simulateModelCall(routeConfig.provider, routeConfig.modelName, taskType, input);
      
      // Simulate fallback on specific condition (e.g. if provider is 'fail')
      if (routeConfig.provider === 'fail' && routeConfig.fallbackProvider) {
        fallbackUsed = true;
        actualModel = routeConfig.fallbackModel;
        result = await simulateModelCall(routeConfig.fallbackProvider, routeConfig.fallbackModel, taskType, input);
      }

      const latencyMs = Date.now() - startTime;
      
      // 3. Log invocation
      await db.insert(modelInvocationLogs).values({
        modelName: actualModel,
        taskType: taskType,
        latencyMs,
        inputTokens: Math.floor(Math.random() * 100),
        outputTokens: Math.floor(Math.random() * 100),
        estimatedCostUsd: 0.001,
        fallbackUsed,
      });

      return result;

    } catch (error) {
      console.error(`[ai-gateway] Invocation failed for ${taskType}:`, error);
      throw error;
    }
  }
};

async function simulateModelCall(provider: string, model: string, taskType: string, input: any) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));
  
  switch (taskType) {
    case 'classification':
      return { subject: 'Simulated Subject', unit: 'Unit 1', confidence: 0.95 };
    case 'ocr':
      return { text: 'Extracted raw text simulated from ' + provider, pages: 1 };
    case 'embedding':
      return { embedding: new Array(768).fill(0.01) };
    case 'knowledge_extraction':
      return { nodes: [] };
    case 'summary_gen':
      return { summary: "Simulated summary from " + provider };
    case 'flashcard_gen':
      return { flashcards: [] };
    case 'quiz_gen':
      return { questions: [] };
    case 'answer_gen':
      return { answer: "Simulated answer", wordCount: 150 };
    case 'homework_gen':
      return { answer: "Simulated homework", wordCount: 300 };
    default:
      return { result: 'stub result' };
  }
}
