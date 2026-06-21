import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardIcon } from '@/components/dashboard-icon';
import { HomeButton } from '@/components/home-button';
import { GAMES_MOCK } from '@/constants/app-mock';
import { BottomTabInset, GioGoBrand, Spacing } from '@/constants/theme';

type GameFilter = 'all' | 'popular' | 'new' | 'categories';

const FILTERS: { id: GameFilter; label: string }[] = [
  { id: 'all', label: 'All Games' },
  { id: 'popular', label: 'Popular' },
  { id: 'new', label: 'New' },
  { id: 'categories', label: 'Categories' },
];

export function GamesList() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<GameFilter>('all');

  const handleGamePress = (gameId: string) => {
    router.push(`/games/${gameId}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.three, paddingBottom: BottomTabInset + Spacing.five },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Games</Text>
          <Pressable style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Search games">
            <DashboardIcon name="search" size={22} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}>
          {FILTERS.map((filter) => {
            const active = activeFilter === filter.id;
            return (
              <Pressable
                key={filter.id}
                onPress={() => setActiveFilter(filter.id)}
                style={[styles.filterPill, active && styles.filterPillActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Popular Games</Text>

        <View style={styles.listCard}>
          {GAMES_MOCK.map((game, index) => (
            <View key={game.id}>
              <Pressable
                style={styles.listRow}
                onPress={() => handleGamePress(game.id)}
                accessibilityRole="button">
                <View style={[styles.thumb, { backgroundColor: game.color }]}>
                  <Text style={styles.thumbText}>{game.title.charAt(0)}</Text>
                </View>
                <View style={styles.listBody}>
                  <Text style={styles.listTitle}>{game.title}</Text>
                  <Text style={styles.listSubtitle}>{game.genre}</Text>
                </View>
                <View style={styles.rewardCol}>
                  <Text style={styles.rewardPoints}>+{game.points}</Text>
                  <DashboardIcon name="star" size={16} color={GioGoBrand.gold} />
                </View>
              </Pressable>
              {index < GAMES_MOCK.length - 1 ? <View style={styles.listDivider} /> : null}
            </View>
          ))}
        </View>

        <View style={styles.ctaWrap}>
          <HomeButton label="View All Games" variant="login" onPress={() => {}} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GioGoBrand.black,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  iconButton: {
    padding: Spacing.two,
  },
  filterRow: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  filterPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  filterPillActive: {
    backgroundColor: GioGoBrand.accent,
    borderColor: GioGoBrand.accent,
  },
  filterText: {
    color: '#B0B4BA',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  listCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  listDivider: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginLeft: Spacing.three + 56 + Spacing.three,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  listBody: {
    flex: 1,
    gap: 4,
  },
  listTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  listSubtitle: {
    color: '#888',
    fontSize: 14,
  },
  rewardCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardPoints: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  ctaWrap: {
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
