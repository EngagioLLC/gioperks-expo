import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import GioWordmark from '@/assets/Gio_wordmark.webp';
import brandAssets from '@/assets/brand-assets.json';
import { DashboardIcon } from '@/components/dashboard-icon';
import { DAILY_EARNING_CAP, GAMES_MOCK } from '@/constants/app-mock';
import { BottomTabInset, GioGoBrand, Spacing } from '@/constants/theme';
import type { PointsWallet } from '@/types/points-wallet';
import type { UserStreak } from '@/types/user-streak';

const ARCADE_GIO_HEIGHT = 40;
const GIO_WORDMARK_WIDTH = ARCADE_GIO_HEIGHT * brandAssets.gioWordmarkAspect;
const CADE_FONT_SIZE = Math.round(ARCADE_GIO_HEIGHT * 1.15);
const CADE_PURPLE_GRADIENT = 'linear-gradient(135deg, #E8CCFF 0%, #C88BFF 18%, #8F14FC 55%, #37018E 100%)';
const STATUS_BORDER_GRADIENT =
  'linear-gradient(135deg, #F9BD28 0%, #E8CCFF 28%, #8F14FC 62%, #37018E 100%)';
const STATUS_SHEEN_GRADIENT =
  'linear-gradient(115deg, rgba(249,189,40,0.18) 0%, rgba(143,20,252,0.12) 42%, rgba(55,1,142,0.05) 100%)';
const PLAY_BORDER_GRADIENT =
  'linear-gradient(135deg, #F9BD28 0%, #E8CCFF 35%, #8F14FC 70%, #37018E 100%)';

type GamesListProps = {
  streak?: UserStreak | null;
  wallet?: PointsWallet | null;
};

function GamePlayButton() {
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulse.value * 0.85,
    transform: [{ scale: 0.92 + pulse.value * 0.12 }],
  }));

  return (
    <View style={styles.playWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.playGlow, glowStyle]} pointerEvents="none" />
      <View style={styles.playOuter}>
        <View style={styles.playInner}>
          <DashboardIcon name="gamepad" size={20} color={GioGoBrand.gold} />
        </View>
      </View>
    </View>
  );
}

function ArcadeStatusBox({
  points,
  streakDays,
  todayEarned,
  earningCap,
}: {
  points: number;
  streakDays: number;
  todayEarned: number;
  earningCap: number;
}) {
  const glow = useSharedValue(0.45);
  const capRatio = earningCap > 0 ? Math.min(1, Math.max(0, todayEarned / earningCap)) : 0;

  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [glow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <Animated.View entering={FadeInDown.duration(520).springify().damping(16)} style={styles.statusWrap}>
      <Animated.View style={[styles.statusGlow, glowStyle]} pointerEvents="none" />
      <View style={styles.statusOuter}>
        <View style={styles.statusInner}>
          <View style={styles.statusMetric}>
            <View style={styles.statusIconBadge}>
              <DashboardIcon name="star" size={16} color={GioGoBrand.gold} />
            </View>
            <Text style={styles.statusValue}>{points.toLocaleString()}</Text>
            <Text style={styles.statusLabel}>GioPoints</Text>
          </View>

          <View style={styles.statusDivider} />

          <View style={styles.statusMetric}>
            <View style={[styles.statusIconBadge, styles.statusIconBadgeFlame]}>
              <DashboardIcon name="flame" size={16} color="#FF6B35" />
            </View>
            <Text style={styles.statusValue}>{streakDays}</Text>
            <Text style={styles.statusLabel}>Day Streak</Text>
          </View>

          <View style={styles.statusDivider} />

          <View style={styles.statusMetric}>
            <View style={[styles.statusIconBadge, styles.statusIconBadgeCap]}>
              <DashboardIcon name="trophy" size={16} color={GioGoBrand.lightPurple} />
            </View>
            <Text style={styles.statusValue}>
              {todayEarned.toLocaleString()}
              <Text style={styles.statusValueMuted}>/{earningCap.toLocaleString()}</Text>
            </Text>
            <Text style={styles.statusLabel}>Today's Cap</Text>
            <View style={styles.capTrack}>
              <View style={[styles.capFill, { flex: capRatio }]} />
              <View style={{ flex: Math.max(0.0001, 1 - capRatio) }} />
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export function GamesList({ streak, wallet }: GamesListProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const points = wallet?.available_balance ?? 0;
  const streakDays = streak?.current_streak ?? 0;
  const todayEarned = wallet?.today_earned ?? 0;
  const earningCap = wallet?.daily_total_cap ?? DAILY_EARNING_CAP;

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
          <Image
            source={GioWordmark}
            style={styles.gioWordmark}
            contentFit="contain"
            accessibilityIgnoresInvertColors
            accessibilityLabel="Gio"
          />
          <Text style={styles.cadeTitle} accessibilityRole="header">
            Cade
          </Text>
        </View>

        <ArcadeStatusBox
          points={points}
          streakDays={streakDays}
          todayEarned={todayEarned}
          earningCap={earningCap}
        />

        <View style={styles.gamesList}>
          {GAMES_MOCK.map((game) => (
            <Pressable
              key={game.id}
              style={styles.gameCard}
              onPress={() => handleGamePress(game.id)}
              accessibilityRole="button"
              accessibilityLabel={`Play ${game.title}`}>
              <View style={[styles.thumb, { backgroundColor: game.color }]}>
                <Text style={styles.thumbText}>{game.title.charAt(0)}</Text>
              </View>
              <View style={styles.listBody}>
                <Text style={styles.listTitle}>{game.title}</Text>
                <Text style={styles.listSubtitle}>{game.genre}</Text>
              </View>
              <GamePlayButton />
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  gioWordmark: {
    width: GIO_WORDMARK_WIDTH,
    height: ARCADE_GIO_HEIGHT,
    backgroundColor: 'transparent',
    marginRight: 2,
  },
  cadeTitle: {
    fontSize: CADE_FONT_SIZE,
    lineHeight: ARCADE_GIO_HEIGHT,
    height: ARCADE_GIO_HEIGHT,
    fontWeight: '700',
    letterSpacing: -1.2,
    includeFontPadding: false,
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage: CADE_PURPLE_GRADIENT,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
        } as TextStyle)
      : ({
          color: GioGoBrand.lightPurple,
          experimental_backgroundImage: CADE_PURPLE_GRADIENT,
        } as TextStyle)),
  },
  statusWrap: {
    position: 'relative',
    marginBottom: Spacing.two,
  },
  statusGlow: {
    position: 'absolute',
    top: 6,
    left: 10,
    right: 10,
    bottom: -4,
    borderRadius: 22,
    backgroundColor: GioGoBrand.lightPurple,
  },
  statusOuter: {
    borderRadius: 18,
    padding: 1.5,
    ...(Platform.OS === 'web'
      ? ({ backgroundImage: STATUS_BORDER_GRADIENT } as TextStyle)
      : ({ experimental_backgroundImage: STATUS_BORDER_GRADIENT } as TextStyle)),
    shadowColor: GioGoBrand.lightPurple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  statusInner: {
    borderRadius: 16.5,
    backgroundColor: GioGoBrand.backgroundAccent,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    ...(Platform.OS === 'web'
      ? ({ backgroundImage: STATUS_SHEEN_GRADIENT } as TextStyle)
      : ({ experimental_backgroundImage: STATUS_SHEEN_GRADIENT } as TextStyle)),
  },
  statusMetric: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  statusIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(249, 189, 40, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(249, 189, 40, 0.35)',
  },
  statusIconBadgeFlame: {
    backgroundColor: 'rgba(255, 107, 53, 0.16)',
    borderColor: 'rgba(255, 107, 53, 0.35)',
  },
  statusIconBadgeCap: {
    backgroundColor: 'rgba(143, 20, 252, 0.18)',
    borderColor: 'rgba(143, 20, 252, 0.4)',
  },
  statusValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  statusValueMuted: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    fontWeight: '600',
  },
  statusLabel: {
    color: GioGoBrand.silver,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  statusDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 4,
    backgroundColor: 'rgba(215, 196, 213, 0.18)',
  },
  capTrack: {
    flexDirection: 'row',
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: 2,
  },
  capFill: {
    backgroundColor: GioGoBrand.gold,
    borderRadius: 2,
    minWidth: 0,
  },
  gamesList: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
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
  playWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GioGoBrand.lightPurple,
  },
  playOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ backgroundImage: PLAY_BORDER_GRADIENT } as TextStyle)
      : ({ experimental_backgroundImage: PLAY_BORDER_GRADIENT } as TextStyle)),
    shadowColor: GioGoBrand.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 8,
  },
  playInner: {
    flex: 1,
    alignSelf: 'stretch',
    borderRadius: 20.5,
    backgroundColor: '#160628',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
