import { version } from 'expo/package.json';
import { StyleSheet } from 'react-native';

import { BrandLogo } from '@/components/brand-logo';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

export function WebBadge() {
  return (
    <ThemedView style={styles.container}>
      <BrandLogo variant="wordmark" style={styles.logo} />
      <ThemedText type="code" themeColor="textSecondary" style={styles.versionText}>
        GioGo v{version}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    maxWidth: 200,
  },
  versionText: {
    textAlign: 'center',
  },
});
