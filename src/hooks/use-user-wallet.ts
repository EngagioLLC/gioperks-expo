import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-provider';
import { fetchApi } from '@/lib/api';
import type { LoginStreakClaim, PointsWallet } from '@/types/points-wallet';

async function claimLoginStreakReward(): Promise<LoginStreakClaim | null> {
  const res = await fetchApi('/api/v1/points/login-streak/claim', { method: 'POST' });
  if (res.status === 409) {
    return null;
  }
  if (!res.ok) {
    throw new Error('Failed to claim login streak reward');
  }
  return (await res.json()) as LoginStreakClaim;
}

async function fetchWallet(): Promise<PointsWallet> {
  const res = await fetchApi('/api/v1/points/wallet');
  if (!res.ok) {
    throw new Error('Failed to load wallet');
  }
  return (await res.json()) as PointsWallet;
}

export function useUserWallet() {
  const { session } = useAuth();
  const [wallet, setWallet] = useState<PointsWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!session || !process.env.EXPO_PUBLIC_API_URL) {
      setWallet(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      try {
        await claimLoginStreakReward();
      } catch (claimErr) {
        console.warn('[wallet] Login streak claim skipped:', claimErr);
      }

      const data = await fetchWallet();
      setWallet(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load wallet'));
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { wallet, loading, error, refresh };
}
