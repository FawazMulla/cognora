import { supabase } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '';

// In-flight deduplication map for concurrent identical GET requests
const inFlightRequests = new Map<string, Promise<any>>();

export interface FetchApiOptions extends RequestInit {
  timeoutMs?: number;
  deduplicate?: boolean;
}

export async function fetchApi(endpoint: string, options: FetchApiOptions = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const shouldDedupe = method === 'GET' && options.deduplicate !== false;
  const dedupeKey = `${endpoint}`;

  if (shouldDedupe && inFlightRequests.has(dedupeKey)) {
    return inFlightRequests.get(dedupeKey);
  }

  const executionPromise = (async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers = new Headers(options.headers);
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }

    const byokKey = localStorage.getItem('byok_gemini_key');
    if (byokKey) {
      headers.set('x-api-key', byokKey);
    }

    const cohereKey = localStorage.getItem('byok_cohere_key');
    if (cohereKey) {
      headers.set('x-cohere-key', cohereKey);
    }

    const preferredProvider = localStorage.getItem('byok_provider') || 'gemini';
    headers.set('x-preferred-provider', preferredProvider);

    // Timeout signal
    const timeoutMs = options.timeoutMs ?? 20000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const signal = options.signal || controller.signal;

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        signal,
      });

      if (!response.ok) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
          const errorJson = await response.json();
          if (errorJson && (errorJson.error || errorJson.message)) {
            errorMessage = errorJson.error || errorJson.message;
          }
        } catch {
          // response was not JSON, fallback to status text
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs / 1000}s for ${endpoint}`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      if (shouldDedupe) {
        inFlightRequests.delete(dedupeKey);
      }
    }
  })();

  if (shouldDedupe) {
    inFlightRequests.set(dedupeKey, executionPromise);
  }

  return executionPromise;
}
