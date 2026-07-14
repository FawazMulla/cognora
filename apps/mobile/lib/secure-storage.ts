import * as SecureStore from 'expo-secure-store';

/**
 * Wrapper around expo-secure-store for persisting sensitive data.
 * Used for: session tokens, refresh tokens, and other auth secrets.
 *
 * FR-001: Session tokens must be stored securely on-device.
 */

const KEYS = {
  ACCESS_TOKEN: 'auth.access_token',
  REFRESH_TOKEN: 'auth.refresh_token',
  USER_ID: 'auth.user_id',
} as const;

/** Persist the session access token. */
export async function saveAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
}

/** Retrieve the session access token. Returns null if not set. */
export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
}

/** Persist the refresh token. */
export async function saveRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
}

/** Retrieve the refresh token. Returns null if not set. */
export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
}

/** Persist the authenticated user ID. */
export async function saveUserId(userId: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.USER_ID, userId);
}

/** Retrieve the authenticated user ID. Returns null if not set. */
export async function getUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.USER_ID);
}

/**
 * Clear all stored auth credentials.
 * Called on logout.
 */
export async function clearAuthData(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(KEYS.USER_ID),
  ]);
}
