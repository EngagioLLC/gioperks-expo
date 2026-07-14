import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardIcon } from '@/components/dashboard-icon';
import { HomeButton } from '@/components/home-button';
import { useAuth } from '@/contexts/auth-provider';
import { useUserProfile } from '@/hooks/use-user-profile';
import { DASHBOARD_MOCK } from '@/constants/app-mock';
import { BottomTabInset, GioGoBrand, Spacing } from '@/constants/theme';
import { getAvatarUrl, getFullDisplayName, getInitials } from '@/lib/user-display';

const MENU_ITEMS = [
  { id: 'history', label: 'Game History', icon: 'history' as const },
  { id: 'rewards', label: 'My Rewards', icon: 'gift' as const },
  { id: 'achievements', label: 'Achievements', icon: 'trophy' as const },
  { id: 'referrals', label: 'Referrals', icon: 'users' as const },
  { id: 'settings', label: 'Settings', icon: 'settings' as const },
  { id: 'help', label: 'Help & Support', icon: 'help' as const },
];

export function ProfileView() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile, loading } = useUserProfile();

  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const displayName = getFullDisplayName(user?.email, metadata, profile);
  const avatarUrl = getAvatarUrl(profile, metadata);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
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
          <Text style={styles.title}>Profile</Text>
          <Pressable style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Settings">
            <DashboardIcon name="settings" size={22} />
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          {loading ? (
            <ActivityIndicator color={GioGoBrand.accent} style={styles.avatarLoader} />
          ) : avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
            </View>
          )}
          <Text style={styles.name}>{displayName}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{DASHBOARD_MOCK.points.toLocaleString()}</Text>
            <Text style={styles.statLabel}>GioPoints Balance</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{DASHBOARD_MOCK.badgesEarned}</Text>
            <Text style={styles.statLabel}>Badges Earned</Text>
          </View>
        </View>

        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <View key={item.id}>
              <Pressable style={styles.menuRow} accessibilityRole="button">
                <DashboardIcon name={item.icon} size={20} color={GioGoBrand.accent} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <DashboardIcon name="chevron" size={18} color="#666" />
              </Pressable>
              {index < MENU_ITEMS.length - 1 ? <View style={styles.menuDivider} /> : null}
            </View>
          ))}
        </View>

        <View style={styles.signOutWrap}>
          <HomeButton label="Sign out" variant="signup" onPress={handleSignOut} />
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
  profileCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: GioGoBrand.accent,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: GioGoBrand.accent,
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  avatarLoader: {
    width: 88,
    height: 88,
  },
  name: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: GioGoBrand.accent,
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
  },
  menuCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  menuLabel: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginLeft: Spacing.three + 20 + Spacing.three,
  },
  signOutWrap: {
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
