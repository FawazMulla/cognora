import { create } from 'zustand';

/**
 * Zustand store for authentication state.
 *
 * Holds: authenticated user info, session token, and auth status flag.
 * Tokens are persisted to expo-secure-store via lib/secure-storage.ts —
 * this store reflects the in-memory runtime state only.
 *
 * FR-001: Session management — token storage and auth-guard integration.
 */

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthState {
  /** Currently authenticated user, or null if unauthenticated. */
  user: AuthUser | null;
  /** In-memory session access token (source of truth: SecureStore). */
  sessionToken: string | null;
  /** Convenience flag — true when user and sessionToken are both set. */
  isAuthenticated: boolean;
  /** Set auth state after a successful login or token refresh. */
  setSession: (user: AuthUser, sessionToken: string) => void;
  /** Clear auth state on logout. */
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  sessionToken: null,
  isAuthenticated: false,

  setSession: (user, sessionToken) =>
    set({ user, sessionToken, isAuthenticated: true }),

  clearSession: () =>
    set({ user: null, sessionToken: null, isAuthenticated: false }),
}));
