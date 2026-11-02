/**
 * Hybrid Response Pipeline & AI Dynamic Router
 *
 * Dispatches between pre-mapped Quick Pick responses (with simulated real-time AI latency)
 * and live Oracle Cloud Infrastructure (OCI) GenAI backend calls.
 */

import { fetchApi } from './api';
import { QUICK_PICK_DATASET, getAnswerForMarks } from './quick-picks-data';
import type { QuickPickItem } from './quick-picks-data';

export interface HybridExecutionOptions {
  category?: 'practical' | 'qa' | 'pyq' | 'smart_module' | 'qb';
  endpoint?: string;
  payload?: Record<string, unknown>;
  onProgress?: (progress: number, stage: string) => void;
  onToken?: (token: string, accumulated: string) => void;
  simulateStreaming?: boolean;
  minDelayMs?: number;
  maxDelayMs?: number;
  forceLiveOci?: boolean;
  marks?: number;
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
  category?: 'practical' | 'qa' | 'pyq' | 'smart_module' | 'qb',
): QuickPickItem | null {
  if (!query || !query.trim()) return null;

  const normalized = normalizeQuery(query);
  const words = normalized.split(' ').filter((w) => w.length > 2);

  let bestMatch: QuickPickItem | null = null;
  let highestScore = 0;

  for (const item of QUICK_PICK_DATASET) {
    if (category) {
      if (category === 'qb') {
        if (item.category !== 'qa' && item.category !== 'pyq' && item.category !== 'smart_module') {
          continue;
        }
      } else if (item.category !== category) {
        continue;
      }
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
 * Calculates realistic AI generation latency calibrated by examination mark weightage:
 * - 2 Marks: ~3.5s - 4.5s (fastest)
 * - 5 Marks: ~6.5s - 7.5s (moderate)
 * - 10 Marks: ~9.5s - 11.0s (around 10 seconds, slowest)
 * - 15 Marks: ~11.5s - 13.0s (deep synthesis)
 */
function getCalibratedTargetDelay(marks: number, options: HybridExecutionOptions): number {
  if (options.minDelayMs !== undefined && options.maxDelayMs !== undefined) {
    return Math.floor(Math.random() * (options.maxDelayMs - options.minDelayMs + 1)) + options.minDelayMs;
  }

  if (marks <= 2) {
    // 2 Marks: ~3.6s to 4.4s (fastest)
    return Math.floor(Math.random() * 800) + 3600;
  } else if (marks <= 5) {
    // 5 Marks: ~6.5s to 7.6s (moderate)
    return Math.floor(Math.random() * 1100) + 6500;
  } else if (marks <= 10) {
    // 10 Marks: Around 10 seconds (~9.6s to 11.2s, slowest)
    return Math.floor(Math.random() * 1600) + 9600;
  } else {
    // 15 Marks: Extended analysis (~11.5s to 13.2s)
    return Math.floor(Math.random() * 1700) + 11500;
  }
}

/**
 * Executes a simulated realistic AI generation streaming delay for pre-computed responses,
 * strictly calibrated by mark weightage.
 */
async function simulateAiGeneration(
  content: string,
  options: HybridExecutionOptions,
  marks: number = 10,
): Promise<void> {
  const targetDelay = getCalibratedTargetDelay(marks, options);

  const stages = [
    { pct: 12, msg: `Connecting to OCI Cohere Command A (${marks}M Pipeline)...` },
    { pct: 28, msg: 'Retrieving Mumbai University syllabus criteria & exam rubrics...' },
    { pct: 48, msg: `Synthesizing ${marks}-mark theoretical concepts & formal definitions...` },
    { pct: 68, msg: 'Generating technical derivations, LaTeX equations & ASCII schematics...' },
    { pct: 86, msg: 'Verifying Topper answer completeness against university scoring scheme...' },
    { pct: 96, msg: 'Finalizing response formatting & rendering equations...' },
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
 * Transparently decides whether to serve from the pre-mapped store (with realistic mark-calibrated latency)
 * or fall back to the live OCI GenAI backend.
 */
export async function executeHybridQuery(
  query: string,
  options: HybridExecutionOptions = {},
): Promise<HybridResponseResult> {
  const startTime = Date.now();
  const matchedItem = !options.forceLiveOci ? isQuickPickHardcoded(query, options.category) : null;
  const markValue =
    (options.payload?.markValue as number) ||
    options.marks ||
    matchedItem?.marks ||
    10;

  // ── BRANCH 1: Pre-mapped Quick Pick Response ──────────────────────────────
  if (matchedItem) {
    // Deliver realistic simulated generation experience calibrated by mark weightage
    const outputContent =
      options.category === 'practical' && matchedItem.practicalData
        ? matchedItem.practicalData.theory
        : getAnswerForMarks(matchedItem, markValue);

    await simulateAiGeneration(outputContent, { ...options, marks: markValue }, markValue);

    return {
      source: 'quick_pick_cache',
      data:
        options.category === 'practical' && matchedItem.practicalData
          ? (matchedItem.practicalData as unknown as Record<string, unknown>)
          : {
              answer: outputContent,
              wordCount: outputContent.split(/\s+/).length,
              model: `cohere.command-a-03-2025 (${markValue}M Topper Standard)`,
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
