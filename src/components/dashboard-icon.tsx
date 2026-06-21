import type { ComponentProps } from 'react';
import { Platform, Text } from 'react-native';
import { SymbolView } from 'expo-symbols';

type DashboardIconName =
  | 'bell'
  | 'star'
  | 'crown'
  | 'flame'
  | 'check'
  | 'coffee'
  | 'chevron'
  | 'search'
  | 'gift'
  | 'settings'
  | 'pause'
  | 'back'
  | 'history'
  | 'trophy'
  | 'users'
  | 'help'
  | 'gamepad';

const SF_SYMBOLS = {
  bell: 'bell',
  star: 'star.fill',
  crown: 'crown.fill',
  flame: 'flame.fill',
  check: 'checkmark',
  coffee: 'cup.and.saucer.fill',
  chevron: 'chevron.right',
  search: 'magnifyingglass',
  gift: 'gift.fill',
  settings: 'gearshape.fill',
  pause: 'pause.fill',
  back: 'chevron.left',
  history: 'clock.fill',
  trophy: 'trophy.fill',
  users: 'person.2.fill',
  help: 'questionmark.circle.fill',
  gamepad: 'gamecontroller.fill',
} as const;

const WEB_GLYPHS: Record<DashboardIconName, string> = {
  bell: '🔔',
  star: '★',
  crown: '♛',
  flame: '🔥',
  check: '✓',
  coffee: '☕',
  chevron: '›',
  search: '🔍',
  gift: '🎁',
  settings: '⚙',
  pause: '⏸',
  back: '‹',
  history: '🕐',
  trophy: '🏆',
  users: '👥',
  help: '❓',
  gamepad: '🎮',
};

type DashboardIconProps = {
  name: DashboardIconName;
  size?: number;
  color?: string;
};

export function DashboardIcon({ name, size = 22, color = '#ffffff' }: DashboardIconProps) {
  const glyph = WEB_GLYPHS[name];

  if (Platform.OS === 'web') {
    return (
      <Text
        style={{
          fontSize: size,
          lineHeight: size + 2,
          color,
          textAlign: 'center',
          minWidth: size,
        }}>
        {glyph}
      </Text>
    );
  }

  return (
    <SymbolView
      name={SF_SYMBOLS[name] as ComponentProps<typeof SymbolView>['name']}
      size={size}
      tintColor={color}
      fallback={
        <Text style={{ fontSize: size, color, textAlign: 'center' }}>{glyph}</Text>
      }
    />
  );
}
