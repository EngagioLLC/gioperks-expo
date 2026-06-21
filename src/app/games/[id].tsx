import { useLocalSearchParams } from 'expo-router';

import { FruitBlastGame } from '@/components/games/fruit-blast-game';

export default function PlayGameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FruitBlastGame gameId={id ?? '1'} />;
}
