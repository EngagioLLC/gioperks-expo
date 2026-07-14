import { GamesList } from '@/components/games/games-list';
import { useUserStreak } from '@/hooks/use-user-streak';
import { useUserWallet } from '@/hooks/use-user-wallet';

export default function GamesScreen() {
  const { streak } = useUserStreak();
  const { wallet } = useUserWallet();

  return <GamesList streak={streak} wallet={wallet} />;
}
