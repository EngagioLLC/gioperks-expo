import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardIcon } from '@/components/dashboard-icon';
import { BottomTabInset, GioGoBrand, Spacing } from '@/constants/theme';

export function ScanView() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + Spacing.three, paddingBottom: BottomTabInset + Spacing.five },
        ]}>
        <Text style={styles.title}>Scan</Text>
        <Text style={styles.subtitle}>Scan a QR code at a participating location to earn GioPoints or redeem rewards.</Text>

        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          <DashboardIcon name="search" size={48} color="#444" />
        </View>

        <Pressable style={styles.scanButton} accessibilityRole="button">
          <Text style={styles.scanButtonText}>Open Camera</Text>
        </Pressable>
      </View>
    </View>
  );
}

const CORNER = {
  position: 'absolute' as const,
  width: 28,
  height: 28,
  borderColor: GioGoBrand.accent,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GioGoBrand.black,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    alignSelf: 'flex-start',
  },
  subtitle: {
    color: '#B0B4BA',
    fontSize: 15,
    lineHeight: 22,
    alignSelf: 'flex-start',
  },
  scanFrame: {
    width: 260,
    height: 260,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.four,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  corner: CORNER,
  topLeft: {
    top: 16,
    left: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 16,
    right: 16,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  scanButton: {
    backgroundColor: GioGoBrand.accent,
    paddingHorizontal: Spacing.five,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
});
