import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Session, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  profile: any;
  hasProfile: boolean | null;
  refreshProfile: () => Promise<void>;
  loginAsDemo: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  profile: null,
  hasProfile: null,
  refreshProfile: async () => {},
  loginAsDemo: () => {},
  signOut: async () => {},
});

const DEFAULT_SAMPLE_SUBJECTS = [
  { name: 'AI and DS – II', code: 'AIDS-701' },
  { name: 'Internet of Everything', code: 'IOE-702' },
  { name: 'Secure Application Development', code: 'SAD-703' }
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  const loginAsDemo = () => {
    const mockUser: any = {
      id: 'demo-user-101',
      email: 'student@archademia.edu',
      user_metadata: { name: 'Demo Scholar' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString()
    };
    const mockSession: any = {
      access_token: 'demo-access-token',
      token_type: 'bearer',
      user: mockUser,
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };
    const defaultProfile = {
      university: 'University of Mumbai',
      branch: 'Information Technology',
      semester: 7,
      subjects: DEFAULT_SAMPLE_SUBJECTS
    };

    localStorage.setItem('demo_mode', 'true');
    localStorage.setItem('user_profile', JSON.stringify(defaultProfile));
    setSession(mockSession);
    setUser(mockUser);
    setProfile(defaultProfile);
    setHasProfile(true);
    setLoading(false);
  };

  const signOut = async () => {
    localStorage.removeItem('demo_mode');
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    setSession(null);
    setUser(null);
    setProfile(null);
    setHasProfile(false);
  };

  const refreshProfile = async (currentSession = session) => {
    const isDemo = localStorage.getItem('demo_mode') === 'true';
    const localProfileStr = localStorage.getItem('user_profile');
    let localProfile: any = null;
    if (localProfileStr) {
      try {
        localProfile = JSON.parse(localProfileStr);
      } catch (e) {
        // ignore
      }
    }

    if (!localProfile) {
      localProfile = {
        university: 'University of Mumbai',
        branch: 'Information Technology',
        semester: 7,
        subjects: DEFAULT_SAMPLE_SUBJECTS
      };
    }

    if (isDemo) {
      setProfile(localProfile);
      setHasProfile(true);
      return;
    }

    const activeSession = currentSession || session;

    if (!activeSession?.access_token) {
      if (localProfile) {
        setProfile(localProfile);
        setHasProfile(true);
      } else {
        setProfile(null);
        setHasProfile(false);
      }
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${activeSession.access_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setHasProfile(true);
        localStorage.setItem('user_profile', JSON.stringify(data.profile));
      } else {
        setProfile(localProfile);
        setHasProfile(true);
      }
    } catch (err) {
      console.warn('Backend profile fetch warning, using local profile fallback:', err);
      setProfile(localProfile);
      setHasProfile(true);
    }
  };

  useEffect(() => {
    const isDemo = localStorage.getItem('demo_mode') === 'true';
    if (isDemo) {
      loginAsDemo();
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        refreshProfile(session).then(() => setLoading(false));
      } else {
        setHasProfile(false);
        setLoading(false);
      }
    }).catch(() => {
      setHasProfile(false);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (localStorage.getItem('demo_mode') === 'true') return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        refreshProfile(session).then(() => setLoading(false));
      } else {
        setHasProfile(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading, profile, hasProfile, refreshProfile, loginAsDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

