import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthDivider } from '@/components/auth-divider';
import { HomeButton } from '@/components/home-button';
import { OAuthButton } from '@/components/oauth-button';
import { useAuth } from '@/contexts/auth-provider';
import { GioGoBrand, Spacing } from '@/constants/theme';
import { fetchApi } from '@/lib/api';

type AuthMode = 'signIn' | 'signUp';

type AuthScreenProps = {
  mode: AuthMode;
};

export function AuthScreen({ mode }: AuthScreenProps) {
  const router = useRouter();
  const { signIn, signUp, signInWithOAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<'google' | 'twitch' | null>(null);

  const busy = submitting || oauthProvider !== null;
  const isSignUp = mode === 'signUp';

  const finishSuccess = async () => {
    if (process.env.EXPO_PUBLIC_API_URL) {
      try {
        await fetchApi('/api/v1/auth/me');
      } catch {
        // Profile sync can retry from the home tab.
      }
    }
    router.replace('/(tabs)/home');
  };

  const handleOAuth = async (provider: 'google' | 'twitch') => {
    setError(null);
    setMessage(null);
    setOauthProvider(provider);
    try {
      await signInWithOAuth(provider);
      await finishSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth sign in failed');
    } finally {
      setOauthProvider(null);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Enter your email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        const { session } = await signUp(trimmedEmail, password);
        if (session) {
          await finishSuccess();
        } else {
          setMessage('Account created. Check your email to confirm, then sign in.');
        }
      } else {
        await signIn(trimmedEmail, password);
        await finishSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Pressable onPress={() => router.back()} accessibilityRole="button">
              <Text style={styles.back}>← Back</Text>
            </Pressable>

            <Text style={styles.title}>{isSignUp ? 'Create account' : 'Sign in'}</Text>
            <Text style={styles.subtitle}>
              {isSignUp
                ? 'Join with Google, Twitch, or email'
                : 'Sign in with Google, Twitch, or email'}
            </Text>

            <View style={styles.oauthGroup}>
              <OAuthButton
                label="Continue with Google"
                provider="google"
                disabled={busy}
                onPress={() => handleOAuth('google')}
              />
              <OAuthButton
                label="Continue with Twitch"
                provider="twitch"
                disabled={busy}
                onPress={() => handleOAuth('twitch')}
              />
            </View>

            {oauthProvider ? (
              <ActivityIndicator color={GioGoBrand.purple} style={styles.oauthLoader} />
            ) : null}

            <AuthDivider />

            <Text style={styles.sectionLabel}>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="#666"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              editable={!busy}
            />
            <Text style={styles.sectionLabel}>Password</Text>
            <TextInput
              secureTextEntry
              autoComplete={isSignUp ? 'new-password' : 'password'}
              placeholder={isSignUp ? 'At least 8 characters' : 'Your password'}
              placeholderTextColor="#666"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              editable={!busy}
            />
            {isSignUp ? (
              <>
                <Text style={styles.sectionLabel}>Confirm password</Text>
                <TextInput
                  secureTextEntry
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  placeholderTextColor="#666"
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!busy}
                />
              </>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {message ? <Text style={styles.message}>{message}</Text> : null}

            {submitting ? (
              <ActivityIndicator color={GioGoBrand.accent} />
            ) : (
              <HomeButton
                label={isSignUp ? 'Create account' : 'Sign in with email'}
                variant={isSignUp ? 'signup' : 'login'}
                onPress={handleSubmit}
              />
            )}

            <Pressable
              onPress={() => router.replace(isSignUp ? '/login' : '/signup')}
              style={styles.toggle}
              disabled={busy}>
              <Text style={styles.toggleText}>
                {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Create one'}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GioGoBrand.black,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  form: {
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  back: {
    color: GioGoBrand.accent,
    fontSize: 16,
    marginBottom: Spacing.two,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#B0B4BA',
    fontSize: 15,
  },
  oauthGroup: {
    gap: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  oauthLoader: {
    marginTop: -Spacing.one,
  },
  sectionLabel: {
    color: '#B0B4BA',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: -Spacing.one,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: Spacing.four,
    paddingVertical: 14,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  error: {
    color: '#ff8a80',
    fontSize: 14,
  },
  message: {
    color: GioGoBrand.accent,
    fontSize: 14,
  },
  toggle: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  toggleText: {
    color: '#B0B4BA',
    fontSize: 15,
    textAlign: 'center',
  },
});
