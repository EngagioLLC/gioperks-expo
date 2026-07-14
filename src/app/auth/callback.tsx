import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { createSessionFromUrl } from '@/lib/auth-oauth';
import { recordLogin } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { GioGoBrand } from '@/constants/theme';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) {
        router.replace('/login');
        return;
      }

      try {
        await createSessionFromUrl(url);
        const {
          data: { session },
        } = await supabase.auth.getSession();
        try {
          await recordLogin(session?.access_token);
        } catch {
          // Profile sync can retry from the home tab.
        }
        router.replace('/(tabs)/home');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not complete sign in');
      }
    };

    const initialUrl =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.href
        : null;
    (initialUrl ? Promise.resolve(initialUrl) : Linking.getInitialURL()).then(handleUrl);

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => subscription.remove();
  }, [router]);

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Text style={styles.error}>{error}</Text>
          <Text style={styles.link} onPress={() => router.replace('/login')}>
            Back to sign in
          </Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={GioGoBrand.accent} />
          <Text style={styles.text}>Completing sign in…</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GioGoBrand.black,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  text: {
    color: '#B0B4BA',
    fontSize: 16,
  },
  error: {
    color: '#ff8a80',
    textAlign: 'center',
    fontSize: 15,
  },
  link: {
    color: GioGoBrand.accent,
    fontSize: 16,
  },
});
