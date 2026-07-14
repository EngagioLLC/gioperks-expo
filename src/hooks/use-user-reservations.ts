import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-provider';
import { fetchApi } from '@/lib/api';
import type { RewardReservation, RewardReservationList } from '@/types/reward-reservation';

export function useUserReservations() {
  const { session } = useAuth();
  const [reservations, setReservations] = useState<RewardReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!session || !process.env.EXPO_PUBLIC_API_URL) {
      setReservations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi('/api/v1/redemptions/reservations');
      if (!res.ok) {
        throw new Error('Failed to load reservations');
      }
      const data = (await res.json()) as RewardReservationList;
      setReservations(data.items);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load reservations'));
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { reservations, loading, error, refresh };
}
