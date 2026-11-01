export interface NavigationState {
  pagePath: string;
  pageTitle: string;
  subjectId?: string;
  subjectName?: string;
  moduleId?: string;
  moduleName?: string;
  topicId?: string;
  topicTitle?: string;
  scrollPosition?: number;
  metadata?: any;
}

const LOCAL_STORAGE_KEY = 'cognora_last_nav_state';

/**
 * Tracks current navigation position and syncs with backend
 */
export async function trackNavigation(state: NavigationState): Promise<void> {
  try {
    // 1. Immediately store in localStorage for offline / fast access
    const payload = {
      ...state,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));

    // 2. Sync to backend API
    fetch('http://localhost:3001/api/navigation/last-state', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'dev-user-local',
      },
      body: JSON.stringify(state),
    }).catch(() => {
      // Non-blocking failover
    });
  } catch (e) {
    console.error('Error tracking navigation:', e);
  }
}

/**
 * Retrieves last navigation state from backend with fallback to localStorage
 */
export async function getLastNavigationState(): Promise<NavigationState | null> {
  try {
    const res = await fetch('http://localhost:3001/api/navigation/last-state', {
      headers: {
        'x-user-id': 'dev-user-local',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.lastState) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.lastState));
        return data.lastState;
      }
    }
  } catch (e) {
    // Fall back to local storage
  }

  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {}

  return null;
}

