import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { queryClient } from '../lib/query-client';

/**
 * Root layout — wraps the entire app with:
 *  - TanStack QueryClientProvider for server-state management
 *  - Expo Router Stack as the base navigator
 */
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
