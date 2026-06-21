import { Pressable, StyleSheet, Text, View } from 'react-native';

type OAuthButtonProps = {
  label: string;
  provider: 'google' | 'twitch';
  onPress?: () => void;
  disabled?: boolean;
};

const providerStyles: Record<
  OAuthButtonProps['provider'],
  { backgroundColor: string; borderColor: string }
> = {
  google: {
    backgroundColor: '#ffffff',
    borderColor: '#e0e0e0',
  },
  twitch: {
    backgroundColor: '#9146FF',
    borderColor: '#9146FF',
  },
};

export function OAuthButton({ label, provider, onPress, disabled }: OAuthButtonProps) {
  const colors = providerStyles[provider];
  const textColor = provider === 'google' ? '#1a1a1a' : '#ffffff';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pressable,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      accessibilityRole="button">
      <View style={[styles.button, { backgroundColor: colors.backgroundColor, borderColor: colors.borderColor }]}>
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
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
  disabled: {
    opacity: 0.5,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
