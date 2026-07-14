import { Stack } from 'expo-router';
import React from 'react';

/**
 * Auth stack layout.
 * Houses login, register, and onboarding screens.
 * Unauthenticated users are directed here by the root guard.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
