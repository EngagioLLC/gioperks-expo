import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';

import { BrandLogo } from '@/components/brand-logo';

const DURATION = 400;

export function AnimatedSplashOverlay() {
  return null;
}

const logoKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 0.85 }],
    opacity: 0,
  },
  100: {
    transform: [{ scale: 1 }],
    opacity: 1,
    easing: Easing.out(Easing.cubic),
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View style={styles.logoWrap} entering={logoKeyframe.duration(DURATION)}>
        <BrandLogo variant="stacked" style={styles.logo} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoWrap: {
    width: '100%',
    maxWidth: 340,
    flex: 1,
    maxHeight: '70%',
  },
  logo: {
    width: '100%',
    flex: 1,
  },
});
