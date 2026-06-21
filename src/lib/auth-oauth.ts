import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const AUTH_CALLBACK_PATH = 'auth/callback';

/**
 * OAuth redirect URI for the current runtime. Must be computed at sign-in time
 * (not module load) so web uses the browser origin (e.g. Tailscale IP:8081).
 *
 * If Supabase rejects redirectTo, it falls back to Site URL (often localhost:3000).
 * Add the logged URI in dev to Supabase → Auth → URL configuration → Redirect URLs.
 */
export function getAuthRedirectUri(): string {
  const override = process.env.EXPO_PUBLIC_AUTH_REDIRECT_ORIGIN?.replace(/\/$/, '');
  if (override) {
    return `${override}/${AUTH_CALLBACK_PATH}`;
  }

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') {
      return '';
    }
    return `${window.location.origin}/${AUTH_CALLBACK_PATH}`;
  }

  return makeRedirectUri({
    scheme: 'gioperksexpo',
    path: AUTH_CALLBACK_PATH,
  });
}

export type OAuthProvider = 'google' | 'twitch';

export async function createSessionFromUrl(url: string): Promise<void> {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new Error(errorCode);
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  const code = params.code;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw error;
    }
    return;
  }

  if (!accessToken || !refreshToken) {
    throw new Error('No session returned from provider');
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) {
    throw error;
  }
}

export async function signInWithOAuthProvider(provider: OAuthProvider): Promise<void> {
  const redirectUri = getAuthRedirectUri();

  if (!redirectUri) {
    throw new Error(
      'Could not determine OAuth redirect URL. On web, open the app in a browser first. ' +
        'Set EXPO_PUBLIC_AUTH_REDIRECT_ORIGIN for a fixed dev host (e.g. Tailscale MagicDNS).',
    );
  }

  if (__DEV__) {
    console.info(
      `[auth] OAuth redirectTo=${redirectUri} — add this exact URL (or a matching wildcard) ` +
        'in Supabase Dashboard → Authentication → URL configuration → Redirect URLs.',
    );
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw error;
  }
  if (!data.url) {
    throw new Error('OAuth sign-in URL was not returned');
  }

  // Full-page redirect on web avoids popup/origin issues when testing from remote devices.
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') {
      throw new Error('OAuth sign-in is only available in the browser');
    }
    window.location.assign(data.url);
    return;
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Sign in was cancelled');
  }
  if (result.type !== 'success') {
    throw new Error('Sign in failed');
  }

  await createSessionFromUrl(result.url);
}
