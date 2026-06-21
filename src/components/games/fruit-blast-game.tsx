import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardIcon } from '@/components/dashboard-icon';
import { FRUIT_BLAST_MOCK, GAMES_MOCK } from '@/constants/app-mock';
import { GioGoBrand, Spacing } from '@/constants/theme';

type FruitBlastGameProps = {
  gameId: string;
};

export function FruitBlastGame({ gameId }: FruitBlastGameProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const game = GAMES_MOCK.find((entry) => entry.id === gameId) ?? GAMES_MOCK[0]!;
  const { score, moves, points, level, levelProgress, starsEarned, grid } = FRUIT_BLAST_MOCK;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <DashboardIcon name="back" size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>{game.title}</Text>
        <Pressable style={styles.headerButton} accessibilityRole="button" accessibilityLabel="Pause game">
          <DashboardIcon name="pause" size={20} />
        </Pressable>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Score</Text>
          <Text style={styles.statValue}>{score.toLocaleString()}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Moves</Text>
          <Text style={styles.statValue}>{moves}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Points</Text>
          <View style={styles.pointsRow}>
            <Text style={styles.statValue}>+{points}</Text>
            <DashboardIcon name="star" size={16} color={GioGoBrand.gold} />
          </View>
        </View>
      </View>

      <View style={styles.gridWrap}>
        {grid.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.gridRow}>
            {row.map((fruit, colIndex) => (
              <View key={`cell-${rowIndex}-${colIndex}`} style={styles.gridCell}>
                <Text style={styles.fruit}>{fruit}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.levelHeader}>
          <Text style={styles.levelText}>Level {level}</Text>
          <View style={styles.starsRow}>
            {[0, 1, 2].map((index) => (
              <DashboardIcon
                key={index}
                name="star"
                size={18}
                color={index < starsEarned ? GioGoBrand.gold : '#444'}
              />
            ))}
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${levelProgress * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
    paddingHorizontal: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#1a2332',
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2a3544',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.two,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
  },
  gridCell: {
    width: 48,
    height: 48,
    backgroundColor: '#1a2332',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a3544',
  },
  fruit: {
    fontSize: 26,
  },
  footer: {
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#2a3544',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: GioGoBrand.accent,
    borderRadius: 4,
  },
});
