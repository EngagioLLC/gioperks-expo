import { useRouter } from 'expo-router';

import { HomeDashboard } from '@/components/dashboard/home-dashboard';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUserReservations } from '@/hooks/use-user-reservations';
import { useUserStreak } from '@/hooks/use-user-streak';
import { useUserWallet } from '@/hooks/use-user-wallet';
import { getDisplayName } from '@/lib/user-display';

export default function SignedInHomeScreen() {
  const router = useRouter();
  const { user, profile } = useUserProfile();
  const { streak } = useUserStreak();
  const { wallet } = useUserWallet();
  const { reservations } = useUserReservations();

  const displayName = getDisplayName(
    user?.email,
    user?.user_metadata as Record<string, unknown> | undefined,
    profile?.display_name,
  );

  return (
    <HomeDashboard
      displayName={displayName}
      streak={streak}
      wallet={wallet}
      reservations={reservations}
      onGamePress={(gameId) => router.push(`/games/${gameId}`)}
      onSeeAllGames={() => router.push('/(tabs)/games')}
      onSeeAllRewards={() => router.push('/(tabs)/rewards')}
    />
  );
}
