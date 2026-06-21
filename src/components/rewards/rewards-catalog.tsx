import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardIcon } from '@/components/dashboard-icon';
import { DASHBOARD_MOCK, REWARDS_MOCK, type MockReward } from '@/constants/app-mock';
import { BottomTabInset, GioGoBrand, Spacing } from '@/constants/theme';

type RewardFilter = 'all' | 'discounts' | 'products' | 'experiences';

const FILTERS: { id: RewardFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'discounts', label: 'Discounts' },
  { id: 'products', label: 'Products' },
  { id: 'experiences', label: 'Experiences' },
];

function filterRewards(filter: RewardFilter): MockReward[] {
  if (filter === 'all') {
    return [...REWARDS_MOCK];
  }
  return REWARDS_MOCK.filter((reward) => reward.category === filter);
}

export function RewardsCatalog() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<RewardFilter>('all');
  const rewards = filterRewards(activeFilter);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.three, paddingBottom: BottomTabInset + Spacing.five },
        ]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Rewards</Text>

        <View style={styles.pointsCard}>
          <View>
            <Text style={styles.pointsLabel}>Your Points</Text>
            <Text style={styles.pointsValue}>{DASHBOARD_MOCK.points.toLocaleString()}</Text>
          </View>
          <DashboardIcon name="gift" size={36} color={GioGoBrand.accent} />
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

        <View style={styles.listCard}>
          {rewards.map((reward, index) => (
            <View key={reward.id}>
              <View style={styles.listRow}>
                <View style={[styles.thumb, { backgroundColor: reward.color }]}>
                  <DashboardIcon name="gift" size={24} />
                </View>
                <View style={styles.listBody}>
                  <Text style={styles.listTitle}>{reward.title}</Text>
                  <Text style={styles.listSubtitle}>{reward.merchant}</Text>
                  <Text style={styles.pointsCost}>{reward.pointsCost.toLocaleString()} pts</Text>
                </View>
                <Pressable style={styles.redeemButton} accessibilityRole="button">
                  <Text style={styles.redeemText}>Redeem</Text>
                </Pressable>
              </View>
              {index < rewards.length - 1 ? <View style={styles.listDivider} /> : null}
            </View>
          ))}
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
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  pointsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsLabel: {
    color: '#B0B4BA',
    fontSize: 14,
  },
  pointsValue: {
    color: GioGoBrand.accent,
    fontSize: 32,
    fontWeight: '700',
    marginTop: 4,
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
    marginLeft: Spacing.three,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listBody: {
    flex: 1,
    gap: 2,
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
  pointsCost: {
    color: GioGoBrand.gold,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  redeemButton: {
    backgroundColor: GioGoBrand.accent,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: 10,
  },
  redeemText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
