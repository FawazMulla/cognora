import { QueryClient } from '@tanstack/react-query';

/**
 * Shared QueryClient instance for the entire app.
 *
 * Configuration:
 *  - staleTime: 5 minutes — data is considered fresh for 5 min after fetch
 *  - retry: 2 — failed requests are retried twice before throwing
 *  - gcTime (formerly cacheTime): 10 minutes
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 0,
    },
  },
});
