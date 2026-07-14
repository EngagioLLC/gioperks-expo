import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { signInWithOAuthProvider, type OAuthProvider } from '@/lib/auth-oauth';
import { recordLogin } from '@/lib/api';
import {
  clearSessionActivity,
  isSessionInactive,
  touchSessionActivity,
} from '@/lib/session-activity';
import { supabase } from '@/lib/supabase';

/** Keep the inactivity clock alive while the app stays in the foreground. */
const ACTIVITY_HEARTBEAT_MS = 5 * 60 * 1000;

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<Session | null>;
  signUp: (email: string, password: string) => Promise<{ session: Session | null }>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function syncBackendLogin(accessToken: string) {
  try {
    await recordLogin(accessToken);
  } catch (err) {
    console.warn('[auth] Backend login sync failed:', err);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatRef.current = setInterval(() => {
      void touchSessionActivity();
    }, ACTIVITY_HEARTBEAT_MS);
  }, [stopHeartbeat]);

  /** Returns false when the session was cleared for inactivity. */
  const enforceInactivityOrTouch = useCallback(async (): Promise<boolean> => {
    if (await isSessionInactive()) {
      stopHeartbeat();
      await clearSessionActivity();
      await supabase.auth.signOut();
      return false;
    }
    await touchSessionActivity();
    return true;
  }, [stopHeartbeat]);

  useEffect(() => {
    let cancelled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      void (async () => {
        if (nextSession && event === 'INITIAL_SESSION') {
          const ok = await enforceInactivityOrTouch();
          if (!ok) {
            if (!cancelled) {
              setSession(null);
              setIsLoading(false);
            }
            return;
          }

          // Cold start / restore: sync login so streaks & points advance without re-auth.
          await syncBackendLogin(nextSession.access_token);
          if (!cancelled) startHeartbeat();
        }

        if (nextSession && event === 'SIGNED_IN') {
          // Fresh credentials always reset the inactivity window.
          await touchSessionActivity();
          if (!cancelled) startHeartbeat();
        }

        if (event === 'SIGNED_OUT') {
          stopHeartbeat();
          await clearSessionActivity();
        }

        if (!cancelled) {
          setSession(nextSession);
          setIsLoading(false);
        }
      })();
    });

    const onAppStateChange = (nextState: AppStateStatus) => {
      const wasBackgrounded =
        appStateRef.current === 'inactive' || appStateRef.current === 'background';
      appStateRef.current = nextState;

      if (wasBackgrounded && nextState === 'active') {
        void (async () => {
          const {
            data: { session: current },
          } = await supabase.auth.getSession();
          if (!current || cancelled) return;

          const ok = await enforceInactivityOrTouch();
          if (!ok) {
            if (!cancelled) setSession(null);
            return;
          }
          startHeartbeat();
        })();
        return;
      }

      if (nextState === 'inactive' || nextState === 'background') {
        stopHeartbeat();
        void touchSessionActivity();
      }
    };

    const appStateSub = AppState.addEventListener('change', onAppStateChange);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      appStateSub.remove();
      stopHeartbeat();
    };
  }, [enforceInactivityOrTouch, startHeartbeat, stopHeartbeat]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await touchSessionActivity();
    return data.session;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.session) {
      await touchSessionActivity();
    }
    return { session: data.session };
  }, []);

  const signInWithOAuth = useCallback(async (provider: OAuthProvider) => {
    await signInWithOAuthProvider(provider);
    await touchSessionActivity();
  }, []);

  const signOut = useCallback(async () => {
    stopHeartbeat();
    await clearSessionActivity();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, [stopHeartbeat]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      signIn,
      signUp,
      signInWithOAuth,
      signOut,
    }),
    [session, isLoading, signIn, signUp, signInWithOAuth, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
