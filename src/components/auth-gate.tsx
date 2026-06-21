import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/contexts/auth-provider';

export function AuthGate() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const rootSegment = segments[0];
    const inProtectedApp = rootSegment === '(tabs)' || rootSegment === 'games';
    const onAuthCallback = rootSegment === 'auth';
    const onLanding = rootSegment === undefined || rootSegment === 'index';

    if (!session && inProtectedApp) {
      router.replace('/');
      return;
    }

    if (session && (rootSegment === 'login' || rootSegment === 'signup')) {
      router.replace('/(tabs)/home');
      return;
    }

    if (session && onLanding && !onAuthCallback) {
      router.replace('/(tabs)/home');
    }
  }, [session, isLoading, segments, router]);

  return null;
}
