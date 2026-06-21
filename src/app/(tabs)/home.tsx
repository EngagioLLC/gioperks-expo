import { useRouter } from 'expo-router';

import { HomeDashboard } from '@/components/dashboard/home-dashboard';
import { useUserProfile } from '@/hooks/use-user-profile';
import { getDisplayName } from '@/lib/user-display';

export default function SignedInHomeScreen() {
  const router = useRouter();
  const { user, profile } = useUserProfile();

  const displayName = getDisplayName(
    user?.email,
    user?.user_metadata as Record<string, unknown> | undefined,
    profile?.display_name,
  );

  return (
    <HomeDashboard
      displayName={displayName}
      onGamePress={(gameId) => router.push(`/games/${gameId}`)}
      onSeeAllGames={() => router.push('/(tabs)/games')}
    />
  );
}
