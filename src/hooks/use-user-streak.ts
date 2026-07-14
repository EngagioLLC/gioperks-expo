import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-provider';
import { fetchApi } from '@/lib/api';
import type { UserStreak } from '@/types/user-streak';

export function useUserStreak() {
  const { session } = useAuth();
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!session || !process.env.EXPO_PUBLIC_API_URL) {
      setStreak(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi('/api/v1/streaks/me');
      if (!res.ok) {
        throw new Error('Failed to load streak');
      }
      const data = (await res.json()) as UserStreak;
      setStreak(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load streak'));
      setStreak(null);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { streak, loading, error, refresh };
}
