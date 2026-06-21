import { DarkTheme } from '@react-navigation/native';
import { ThemeProvider } from '@react-navigation/core';
import { Stack } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthGate } from '@/components/auth-gate';
import { AuthProvider } from '@/contexts/auth-provider';
import { GioGoBrand } from '@/constants/theme';

const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: GioGoBrand.black,
    card: GioGoBrand.black,
  },
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={AppTheme}>
        <AnimatedSplashOverlay />
        <AuthGate />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: GioGoBrand.black },
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="auth/callback" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="games/[id]" />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
