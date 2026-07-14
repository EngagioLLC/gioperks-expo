import { GioGoBrand } from '@/constants/theme';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

type HomeButtonProps = {
  label: string;
  variant: 'login' | 'signup' | 'about';
  /** `primary` = main CTA; `secondary` = subdued outline/text style */
  emphasis?: 'primary' | 'secondary';
  onPress?: () => void;
};

const GRADIENT_BY_VARIANT = {
  about: GioGoBrand.aboutGradient,
} as const;

export function HomeButton({
  label,
  variant,
  emphasis = 'primary',
  onPress,
}: HomeButtonProps) {
  const isSecondary = emphasis === 'secondary';

  let buttonStyle: ViewStyle;
  let labelColor: string;
  let labelStyle = styles.label;

  if (variant === 'about') {
    buttonStyle =
      Platform.OS === 'web'
        ? { backgroundColor: GioGoBrand.lightPurple }
        : {
            backgroundColor: GioGoBrand.lightPurple,
            experimental_backgroundImage: GRADIENT_BY_VARIANT.about,
          };
    labelColor = '#ffffff';
    labelStyle = styles.labelAbout;
  } else if (isSecondary) {
    buttonStyle = {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: 'rgba(215, 196, 213, 0.4)',
    };
    labelColor = GioGoBrand.silver;
    labelStyle = styles.labelSecondary;
  } else if (variant === 'login') {
    buttonStyle = { backgroundColor: GioGoBrand.lightPurple };
    labelColor = GioGoBrand.gold;
    labelStyle = styles.labelLogin;
  } else {
    buttonStyle = { backgroundColor: GioGoBrand.silver };
    labelColor = GioGoBrand.deepPurple;
    labelStyle = styles.labelPrimary;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        variant === 'about' && styles.pressableAbout,
        variant === 'login' && emphasis === 'primary' && styles.pressableLogin,
        isSecondary && styles.pressableSecondary,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button">
      <View
        style={[
          styles.button,
          variant === 'about' && styles.buttonAbout,
          !isSecondary && variant === 'login' && styles.buttonLogin,
          isSecondary && styles.buttonSecondary,
          buttonStyle,
        ]}>
        <Text style={[labelStyle, { color: labelColor }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    maxWidth: 300,
  },
  pressableAbout: {
    maxWidth: 310,
  },
  pressableLogin: {
    maxWidth: 320,
  },
  pressableSecondary: {
    maxWidth: 252,
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
  buttonAbout: {
    paddingVertical: 18,
    paddingHorizontal: 34,
    borderRadius: 13,
  },
  buttonLogin: {
    paddingVertical: 22,
    paddingHorizontal: 36,
    borderRadius: 14,
  },
  buttonSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 9,
    borderWidth: 1,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  labelPrimary: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.35,
  },
  labelAbout: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.35,
  },
  labelLogin: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  labelSecondary: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
});
