/**
 * Hybrid Response Pipeline & AI Dynamic Router
 *
 * Dispatches between pre-mapped Quick Pick responses (with simulated real-time AI latency)
 * and live Oracle Cloud Infrastructure (OCI) GenAI backend calls.
 */

import { fetchApi } from './api';
import { QUICK_PICK_DATASET } from './quick-picks-data';
import type { QuickPickItem } from './quick-picks-data';

export interface HybridExecutionOptions {
  category?: 'practical' | 'qa' | 'pyq' | 'smart_module';
  endpoint?: string;
  payload?: Record<string, unknown>;
  onProgress?: (progress: number, stage: string) => void;
  onToken?: (token: string, accumulated: string) => void;
  simulateStreaming?: boolean;
  minDelayMs?: number;
  maxDelayMs?: number;
  forceLiveOci?: boolean;
}

export interface HybridResponseResult {
  source: 'quick_pick_cache' | 'oci_genai_live';
  data: Record<string, unknown>;
  latencyMs: number;
  matchedItem?: QuickPickItem;
}

/**
 * Normalizes query string for fuzzy and keyword matching.
 */
function normalizeQuery(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks whether an incoming user query matches any pre-mapped Quick Pick response.
 */
export function isQuickPickHardcoded(
  query: string,
  category?: 'practical' | 'qa' | 'pyq' | 'smart_module',
): QuickPickItem | null {
  if (!query || !query.trim()) return null;

  const normalized = normalizeQuery(query);
  const words = normalized.split(' ').filter((w) => w.length > 2);

  let bestMatch: QuickPickItem | null = null;
  let highestScore = 0;

  for (const item of QUICK_PICK_DATASET) {
    if (category && item.category !== category) {
      continue;
    }

    // 1. Direct ID match
    if (query === item.id) {
      return item;
    }

    // 2. Exact or substring match with title
    const normalizedTitle = normalizeQuery(item.title);
    if (normalized.includes(normalizedTitle) || normalizedTitle.includes(normalized)) {
      return item;
    }

    // 3. Keyword and tag overlap score
    let score = 0;
    for (const kw of item.keywords) {
      const normKw = normalizeQuery(kw);
      if (normalized.includes(normKw)) {
        score += 3;
      }
    }

    for (const tag of item.tags) {
      const normTag = normalizeQuery(tag);
      if (normalized.includes(normTag)) {
        score += 1.5;
      }
    }

    for (const word of words) {
      if (normalizedTitle.includes(word)) {
        score += 1;
      }
    }

    // If score is high enough to be confident
    if (score > highestScore && score >= 3) {
      highestScore = score;
      bestMatch = item;
    }
  }

  return bestMatch;
}

/**
 * Retrieves all Quick Pick recommendations for a given category.
 */
export function getQuickPickSuggestions(
  category?: 'practical' | 'qa' | 'pyq' | 'smart_module',
): QuickPickItem[] {
  if (!category) return QUICK_PICK_DATASET;
  return QUICK_PICK_DATASET.filter((item) => item.category === category);
}

/**
 * Direct invocation to the live OCI GenAI backend through the Next.js API gateway.
 */
export async function callOciAiBackend(
  endpoint: string,
  payload: Record<string, unknown>,
  timeoutMs: number = 30000,
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = (await fetchApi(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-preferred-provider': 'oci',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })) as Record<string, unknown>;
    return res;
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') {
      throw new Error(`OCI GenAI request timed out after ${timeoutMs / 1000} seconds.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Executes a simulated realistic AI generation streaming delay for pre-computed responses.
 */
async function simulateAiGeneration(
  content: string,
  options: HybridExecutionOptions,
): Promise<void> {
  const minDelay = options.minDelayMs ?? 800;
  const maxDelay = options.maxDelayMs ?? 2000;
  const targetDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

  const stages = [
    { pct: 15, msg: 'Connecting to OCI Cohere Command A model...' },
    { pct: 40, msg: 'Analyzing syllabus criteria and question invariants...' },
    { pct: 70, msg: 'Synthesizing formal definitions, equations, and diagrams...' },
    { pct: 90, msg: 'Calibrating university topper mark scheme...' },
    { pct: 100, msg: 'Complete!' },
  ];

  const stepTime = targetDelay / stages.length;

  for (let i = 0; i < stages.length; i++) {
    await new Promise((resolve) => setTimeout(resolve, stepTime));
    const stage = stages[i];
    if (stage && options.onProgress) {
      options.onProgress(stage.pct, stage.msg);
    }
  }

  // If streaming token callback is requested, progressively emit chunks
  if (options.simulateStreaming && options.onToken && content) {
    const chunkSize = Math.max(12, Math.floor(content.length / 30));
    let currentIdx = 0;
    while (currentIdx < content.length) {
      const nextIdx = Math.min(currentIdx + chunkSize, content.length);
      const chunk = content.slice(currentIdx, nextIdx);
      const accumulated = content.slice(0, nextIdx);
      options.onToken(chunk, accumulated);
      currentIdx = nextIdx;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
}

/**
 * Master Hybrid Pipeline Execution Handler.
 * Transparently decides whether to serve from the pre-mapped store (with realistic latency)
 * or fall back to the live OCI GenAI backend.
 */
export async function executeHybridQuery(
  query: string,
  options: HybridExecutionOptions = {},
): Promise<HybridResponseResult> {
  const startTime = Date.now();
  const matchedItem = !options.forceLiveOci ? isQuickPickHardcoded(query, options.category) : null;

  // ── BRANCH 1: Pre-mapped Quick Pick Response ──────────────────────────────
  if (matchedItem) {
    // Deliver realistic simulated generation experience
    const outputContent =
      options.category === 'practical' && matchedItem.practicalData
        ? matchedItem.practicalData.theory
        : matchedItem.answerMarkdown;

    await simulateAiGeneration(outputContent, options);

    return {
      source: 'quick_pick_cache',
      data:
        options.category === 'practical' && matchedItem.practicalData
          ? (matchedItem.practicalData as unknown as Record<string, unknown>)
          : {
              answer: matchedItem.answerMarkdown,
              wordCount: matchedItem.answerMarkdown.split(/\s+/).length,
              model: 'cohere.command-a-03-2025 (Cached Topper Standard)',
            },
      latencyMs: Date.now() - startTime,
      matchedItem,
    };
  }

  // ── BRANCH 2: Fallback to Live OCI GenAI Backend ──────────────────────────
  if (options.onProgress) {
    options.onProgress(10, 'Connecting to OCI GenAI live cloud cluster (us-chicago-1)...');
  }

  const endpoint =
    options.endpoint ||
    (options.category === 'practical' ? '/api/practicals/generate' : '/api/answers/generate');

  const payload =
    options.payload ||
    (options.category === 'practical'
      ? { aim: query.trim(), codeLanguage: 'python' }
      : { question: query.trim(), markValue: 10, format: 'Topper Standard' });

  // Update progress ticker while waiting for remote LLM inference
  const progressInterval = setInterval(() => {
    if (options.onProgress) {
      options.onProgress(
        Math.min(95, Math.floor(20 + ((Date.now() - startTime) / 1000) * 10)),
        'Streaming live inference from OCI Cohere Command A...',
      );
    }
  }, 500);

  try {
    const liveResult = await callOciAiBackend(endpoint, payload, 35000);
    clearInterval(progressInterval);

    if (options.onProgress) {
      options.onProgress(100, 'Complete!');
    }

    return {
      source: 'oci_genai_live',
      data: liveResult,
      latencyMs: Date.now() - startTime,
    };
  } catch (liveError: unknown) {
    clearInterval(progressInterval);
    console.warn('[hybrid-router] Live OCI call failed, checking fallback:', liveError);
    throw liveError;
  }
}
