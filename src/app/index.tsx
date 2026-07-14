import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Tagline from '@/assets/Tagline.webp';
import brandAssets from '@/assets/brand-assets.json';
import { BrandLogo } from '@/components/brand-logo';
import { HomeButton } from '@/components/home-button';
import { GioGoBrand, Spacing } from '@/constants/theme';

const TAGLINE_ASPECT = brandAssets.taglineAspect;
const TAGLINE_MAX_WIDTH = 340;
const TAGLINE_HORIZONTAL_PADDING = 40;

export default function LandingScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const taglineWidth = Math.min(windowWidth - TAGLINE_HORIZONTAL_PADDING, TAGLINE_MAX_WIDTH);
  const taglineHeight = Math.round(taglineWidth / TAGLINE_ASPECT);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.brandSection}>
          <View style={styles.brandCluster}>
            <BrandLogo variant="stacked" />
            <View style={styles.taglineSlot}>
              <Image
                source={Tagline}
                style={{ width: taglineWidth, height: taglineHeight, backgroundColor: 'transparent' }}
                contentFit="contain"
                accessibilityLabel="Play, earn GioPoints, redeem rewards"
                accessibilityIgnoresInvertColors
              />
            </View>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <View style={styles.authActions}>
            <HomeButton label="Login" variant="login" onPress={() => router.push('/login')} />
            <HomeButton
              label="Create Account"
              variant="signup"
              emphasis="secondary"
              onPress={() => router.push('/signup')}
            />
          </View>
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
  },
  brandCluster: {
    alignItems: 'center',
    marginTop: Spacing.five,
  },
  taglineSlot: {
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  actionsSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.four,
  },
  authActions: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.five,
    marginTop: Spacing.four,
  },
});
