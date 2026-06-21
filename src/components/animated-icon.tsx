import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { BrandLogo } from '@/components/brand-logo';
import { GioGoBrand } from '@/constants/theme';

const DURATION = 600;

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: { opacity: 1 },
    70: { opacity: 0, easing: Easing.out(Easing.cubic) },
    100: { opacity: 0 },
  });

  return (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splash}
    />
  );
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
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GioGoBrand.black,
    zIndex: 1000,
  },
});
