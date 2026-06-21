import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DashboardIcon } from '@/components/dashboard-icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DASHBOARD_MOCK } from '@/constants/app-mock';
import { BottomTabInset, GioGoBrand, Spacing } from '@/constants/theme';

type HomeDashboardProps = {
  displayName: string;
  onGamePress?: (gameId: string) => void;
  onSeeAllGames?: () => void;
};

export function HomeDashboard({ displayName, onGamePress, onSeeAllGames }: HomeDashboardProps) {
  const insets = useSafeAreaInsets();
  const { points, level, streakDays, streakCompletedDays, weekDays, featuredGames, nearbyOffers } =
    DASHBOARD_MOCK;

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
          <View style={styles.pointsLevelRow}>
            <View style={styles.pointsLevelCol}>
              <Text style={styles.cardLabel}>Your Points</Text>
              <View style={styles.pointsRow}>
                <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
                <DashboardIcon name="star" size={22} color={GioGoBrand.gold} />
              </View>
              <Text style={styles.cardHint}>Keep playing!</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.pointsLevelCol}>
              <Text style={styles.cardLabel}>Level</Text>
              <View style={styles.pointsRow}>
                <Text style={styles.levelValue}>{level}</Text>
                <DashboardIcon name="crown" size={22} color={GioGoBrand.gold} />
              </View>
            </View>
          </View>
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
              const completed = index < streakCompletedDays;
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
                <View style={styles.rewardCol}>
                  <Text style={styles.rewardPoints}>+{game.points}</Text>
                  <DashboardIcon name="star" size={16} color={GioGoBrand.gold} />
                </View>
              </Pressable>
              {index < featuredGames.length - 1 ? <View style={styles.listDivider} /> : null}
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Offers</Text>
          <Pressable accessibilityRole="button" onPress={onSeeAllGames}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        <View style={styles.listCard}>
          {nearbyOffers.map((offer) => (
            <Pressable key={offer.id} style={styles.listRow} accessibilityRole="button">
              <View style={[styles.thumb, { backgroundColor: offer.color }]}>
                <DashboardIcon name="coffee" size={24} />
              </View>
              <View style={styles.listBody}>
                <Text style={styles.listTitle}>{offer.title}</Text>
                <Text style={styles.listSubtitle}>{offer.merchant}</Text>
              </View>
              <DashboardIcon name="chevron" size={18} color="#666" />
            </Pressable>
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
  },
  pointsLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsLevelCol: {
    flex: 1,
    gap: 4,
  },
  divider: {
    width: 1,
    height: 56,
    backgroundColor: '#2a2a2a',
    marginHorizontal: Spacing.three,
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
  levelValue: {
    color: '#ffffff',
    fontSize: 22,
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
});
