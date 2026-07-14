/**
 * GioGo brand palette (extracted from assets/Rich_Logo.png).
 * Silver #D7C4D5 | Deep purple #37018E | Light purple #8F14FC | Gold #F9BD28 | Black #000000
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#1a1a1a',
    backgroundSelected: '#2a2a2a',
    textSecondary: '#D7C4D5',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#1a1a1a',
    backgroundSelected: '#2a2a2a',
    textSecondary: '#D7C4D5',
  },
} as const;

export const GioGoBrand = {
  black: '#000000',
  silver: '#D7C4D5',
  deepPurple: '#37018E',
  lightPurple: '#8F14FC',
  gold: '#F9BD28',
  /** Primary brand purple (alias for deepPurple) */
  purple: '#37018E',
  /** Secondary accent (alias for lightPurple; replaces legacy green) */
  green: '#8F14FC',
  accent: '#8F14FC',
  backgroundAccent: '#12032A',
  loginGradient: 'linear-gradient(90deg, #37018E, #F9BD28)',
  signupGradient: 'linear-gradient(90deg, #F9BD28, #8F14FC)',
  aboutGradient: 'linear-gradient(90deg, #37018E, #8F14FC, #F9BD28)',
} as const;

/** @deprecated Use GioGoBrand */
export const EngageoBrand = GioGoBrand;

export const TabBarColors = {
  active: GioGoBrand.lightPurple,
  inactive: '#A894B8',
  inactiveBackground: 'rgba(143, 20, 252, 0.12)',
  activeBackground: 'rgba(143, 20, 252, 0.22)',
  barBackground: '#0d0d0d',
  barBorder: '#2a2a2a',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
