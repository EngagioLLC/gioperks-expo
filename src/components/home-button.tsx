import { GioGoBrand } from '@/constants/theme';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

type HomeButtonProps = {
  label: string;
  variant: 'login' | 'signup' | 'about';
  onPress?: () => void;
};

const GRADIENT_BY_VARIANT = {
  login: GioGoBrand.loginGradient,
  signup: GioGoBrand.signupGradient,
  about: GioGoBrand.aboutGradient,
} as const;

const FALLBACK_BY_VARIANT = {
  login: GioGoBrand.deepPurple,
  signup: GioGoBrand.gold,
  about: GioGoBrand.lightPurple,
} as const;

export function HomeButton({ label, variant, onPress }: HomeButtonProps) {
  const gradient = GRADIENT_BY_VARIANT[variant];
  const fallbackColor = FALLBACK_BY_VARIANT[variant];

  const buttonStyle =
    Platform.OS === 'web'
      ? { backgroundColor: fallbackColor }
      : ({
          backgroundColor: fallbackColor,
          experimental_backgroundImage: gradient,
        } as ViewStyle);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      accessibilityRole="button">
      <View style={[styles.button, buttonStyle]}>
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    maxWidth: 300,
  },
  pressed: {
    opacity: 0.88,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
