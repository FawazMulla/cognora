import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { useAuthStore } from '../../store/auth.store';

/**
 * Protected app layout.
 * Redirects unauthenticated users to the login screen.
 * FR-001: All app routes require a valid session.
 */
export default function AppLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#6366f1' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    />
  );
}
