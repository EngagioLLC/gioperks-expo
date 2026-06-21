import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { HomeButton } from '@/components/home-button';
import { GioGoBrand, Spacing } from '@/constants/theme';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.brandSection}>
          <BrandLogo variant="stacked" />
        </View>

        <View style={styles.actionsSection}>
          <HomeButton label="Login" variant="login" onPress={() => router.push('/login')} />
          <HomeButton
            label="Create Account"
            variant="signup"
            onPress={() => router.push('/signup')}
          />
          <HomeButton label="About Us" variant="about" />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GioGoBrand.black,
  },
  safeArea: {
    flex: 1,
  },
  brandSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  actionsSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.four,
  },
});
