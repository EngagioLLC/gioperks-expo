import { Image } from 'expo-image';
import { StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';

import GioGoChest from '@/assets/GioGo_chest.webp';
import GioGoLogo from '@/assets/GioGo_logo.webp';
import GioGoWordmark from '@/assets/GioGo_wordmark.webp';

const CHEST_ASPECT = 567 / 673;
const WORDMARK_ASPECT = 852 / 591;
const FULL_LOGO_ASPECT = 1448 / 1086;

const BRAND_HORIZONTAL_PADDING = 40;
const BRAND_MAX_WIDTH = 300;
const CHEST_SCALE = 0.88;
const CHEST_OFFSET_X = 0;
const CHEST_MARGIN_BOTTOM = -20;
const WORDMARK_OFFSET_X = 0;
const WORDMARK_OFFSET_Y = -52;
const WORDMARK_FRAME_RATIO = 0.8 * 0.85 * 1.15 * 1.1 * 1.1;

type BrandLogoProps = {
  /** `stacked` = chest over wordmark; `full` = combined logo; `icon` | `wordmark` = single asset */
  variant?: 'stacked' | 'full' | 'icon' | 'wordmark';
  style?: StyleProp<ViewStyle>;
};

function BrandImage({
  source,
  width,
  height,
}: {
  source: number;
  width: number;
  height: number;
}) {
  return (
    <Image
      source={source}
      style={{ width, height, backgroundColor: 'transparent' }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

function TreasureChestGraphic({ width }: { width: number }) {
  const height = width / CHEST_ASPECT;
  return <BrandImage source={GioGoChest} width={width} height={height} />;
}

function WordmarkGraphic({
  width,
  offsetX = 0,
  offsetY = 0,
}: {
  width: number;
  offsetX?: number;
  offsetY?: number;
}) {
  const height = width / WORDMARK_ASPECT;

  return (
    <View style={{ width, height, flexShrink: 0, marginLeft: offsetX, marginTop: offsetY }}>
      <BrandImage source={GioGoWordmark} width={width} height={height} />
    </View>
  );
}

export function BrandLogo({ variant = 'stacked', style }: BrandLogoProps) {
  const { width: windowWidth } = useWindowDimensions();

  const brandWidth = Math.min(windowWidth - BRAND_HORIZONTAL_PADDING, BRAND_MAX_WIDTH);
  const chestWidth = Math.round(brandWidth * CHEST_SCALE);
  const wordmarkWidth = Math.round(brandWidth * WORDMARK_FRAME_RATIO);

  if (variant === 'wordmark') {
    return (
      <View style={[styles.wordmarkOnly, style]}>
        <WordmarkGraphic width={wordmarkWidth} />
      </View>
    );
  }

  if (variant === 'icon') {
    return (
      <View style={[styles.chestOnly, { marginLeft: CHEST_OFFSET_X }, style]}>
        <TreasureChestGraphic width={chestWidth} />
      </View>
    );
  }

  if (variant === 'full') {
    const fullWidth = Math.min(windowWidth - BRAND_HORIZONTAL_PADDING, 360);
    const fullHeight = fullWidth / FULL_LOGO_ASPECT;
    return (
      <View style={[styles.fullLogo, { width: fullWidth, height: fullHeight }, style]}>
        <BrandImage source={GioGoLogo} width={fullWidth} height={fullHeight} />
      </View>
    );
  }

  return (
    <View style={[styles.stacked, style]}>
      <View style={[styles.stackedInner, { width: chestWidth }]}>
        <View
          style={[
            styles.chestSlot,
            { marginLeft: CHEST_OFFSET_X, marginBottom: CHEST_MARGIN_BOTTOM },
          ]}>
          <TreasureChestGraphic width={chestWidth} />
        </View>
        <WordmarkGraphic
          width={wordmarkWidth}
          offsetX={WORDMARK_OFFSET_X}
          offsetY={WORDMARK_OFFSET_Y}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stacked: {
    alignSelf: 'center',
    flexShrink: 0,
  },
  stackedInner: {
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
  },
  chestSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fullLogo: {
    alignSelf: 'center',
    flexShrink: 0,
  },
  chestOnly: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  wordmarkOnly: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
