import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DashboardIcon } from '@/components/dashboard-icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DASHBOARD_MOCK } from '@/constants/app-mock';
import { BottomTabInset, GioGoBrand, Spacing } from '@/constants/theme';
import type { PointsWallet } from '@/types/points-wallet';
import type { RewardReservation } from '@/types/reward-reservation';
import type { UserStreak } from '@/types/user-streak';

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

type HomeDashboardProps = {
  displayName: string;
  streak?: UserStreak | null;
  wallet?: PointsWallet | null;
  reservations?: RewardReservation[];
  onGamePress?: (gameId: string) => void;
  onSeeAllGames?: () => void;
  onSeeAllRewards?: () => void;
};

function formatExpiry(expiresAt: string): string {
  const expires = new Date(expiresAt);
  if (Number.isNaN(expires.getTime())) {
    return 'Expires soon';
  }
  return `Expires ${expires.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

export function HomeDashboard({
  displayName,
  streak,
  wallet,
  reservations = [],
  onGamePress,
  onSeeAllGames,
  onSeeAllRewards,
}: HomeDashboardProps) {
  const insets = useSafeAreaInsets();
  const { featuredGames } = DASHBOARD_MOCK;
  const points = wallet?.available_balance ?? 0;
  const pointsHint =
    wallet && wallet.reserved_balance > 0
      ? `${wallet.reserved_balance.toLocaleString()} GioPoints reserved`
      : 'Keep playing!';
  const streakDays = streak?.current_streak ?? 0;
  const weekDays = streak?.week_days ?? WEEK_DAYS;
  const weekActive = streak?.week_active ?? [false, false, false, false, false, false, false];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.three, paddingBottom: BottomTabInset + Spacing.five },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{displayName}!</Text>
          </View>
          <Pressable style={styles.bellButton} accessibilityRole="button" accessibilityLabel="Notifications">
            <DashboardIcon name="bell" size={22} />
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Your GioPoints</Text>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
            <DashboardIcon name="star" size={22} color={GioGoBrand.gold} />
          </View>
          <Text style={styles.cardHint}>{pointsHint}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.streakHeader}>
            <DashboardIcon name="flame" size={28} color="#FF6B35" />
            <View style={styles.streakHeaderText}>
              <Text style={styles.streakTitle}>{streakDays} Day Streak</Text>
              <Text style={styles.cardHint}>Keep it going!</Text>
            </View>
          </View>
          <View style={styles.streakDays}>
            {weekDays.map((day, index) => {
              const completed = weekActive[index] ?? false;
              return (
                <View key={`${day}-${index}`} style={styles.streakDayCol}>
                  <View style={[styles.streakCircle, completed && styles.streakCircleDone]}>
                    {completed ? (
                      <DashboardIcon name="check" size={14} />
                    ) : null}
                  </View>
                  <Text style={styles.streakDayLabel}>{day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Games</Text>
          <Pressable accessibilityRole="button" onPress={onSeeAllGames}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        <View style={styles.listCard}>
          {featuredGames.map((game, index) => (
            <View key={game.id}>
              <Pressable
                style={styles.listRow}
                onPress={() => onGamePress?.(game.id)}
                accessibilityRole="button">
                <View style={[styles.thumb, { backgroundColor: game.color }]}>
                  <Text style={styles.thumbText}>{game.title.charAt(0)}</Text>
                </View>
                <View style={styles.listBody}>
                  <Text style={styles.listTitle}>{game.title}</Text>
                  <Text style={styles.listSubtitle}>{game.genre}</Text>
                </View>
                <DashboardIcon name="chevron" size={18} color="rgba(215,196,213,0.55)" />
              </Pressable>
              {index < featuredGames.length - 1 ? <View style={styles.listDivider} /> : null}
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Redemptions</Text>
          <Pressable accessibilityRole="button" onPress={onSeeAllRewards}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        <View style={styles.listCard}>
          {reservations.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No active redemptions yet</Text>
            </View>
          ) : (
            reservations.map((reservation, index) => (
              <View key={reservation.reservation_id}>
                <View style={styles.listRow}>
                  <View style={[styles.thumb, styles.reservationThumb]}>
                    <DashboardIcon name="gift" size={24} color={GioGoBrand.accent} />
                  </View>
                  <View style={styles.listBody}>
                    <Text style={styles.listTitle}>Code {reservation.reservation_code}</Text>
                    <Text style={styles.listSubtitle}>
                      {reservation.points_reserved.toLocaleString()} GioPoints reserved
                    </Text>
                    <Text style={styles.reservationMeta}>{formatExpiry(reservation.expires_at)}</Text>
                  </View>
                  <DashboardIcon name="chevron" size={18} color="#666" />
                </View>
                {index < reservations.length - 1 ? <View style={styles.listDivider} /> : null}
              </View>
            ))
          )}
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
    alignItems: 'flex-start',
    marginBottom: Spacing.one,
  },
  greeting: {
    color: '#B0B4BA',
    fontSize: 16,
  },
  name: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 2,
  },
  bellButton: {
    padding: Spacing.two,
    marginTop: Spacing.one,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 4,
  },
  cardLabel: {
    color: '#B0B4BA',
    fontSize: 13,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  pointsValue: {
    color: GioGoBrand.accent,
    fontSize: 26,
    fontWeight: '700',
  },
  cardHint: {
    color: '#888',
    fontSize: 13,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  streakHeaderText: {
    gap: 2,
  },
  streakTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  streakDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakDayCol: {
    alignItems: 'center',
    gap: 6,
  },
  streakCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCircleDone: {
    backgroundColor: GioGoBrand.green,
  },
  streakDayLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  seeAll: {
    color: GioGoBrand.accent,
    fontSize: 15,
    fontWeight: '600',
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
  reservationThumb: {
    backgroundColor: '#2a1a3a',
  },
  reservationMeta: {
    color: GioGoBrand.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyRow: {
    padding: Spacing.four,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
  },
});
