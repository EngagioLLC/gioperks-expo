import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-provider';
import { fetchApi } from '@/lib/api';
import type { UserProfile } from '@/types/user-profile';

export function useUserProfile() {
  const { user, session } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!session || !process.env.EXPO_PUBLIC_API_URL) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi('/api/v1/auth/me');
      if (!res.ok) {
        throw new Error('Failed to load profile');
      }
      const data = (await res.json()) as UserProfile;
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load profile'));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { profile, loading, error, user, refresh };
}
