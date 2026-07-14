import { supabase } from '@/lib/supabase';
import type { ArcadeAward } from '@/types/points-wallet';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

if (__DEV__ && apiBaseUrl) {
  console.log('[api] Using backend:', apiBaseUrl);
}

export async function fetchApi(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<Response> {
  if (!apiBaseUrl) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured');
  }

  let token = accessToken;
  if (!token) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    token = session?.access_token;
  }

  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${apiBaseUrl}${path}`, { ...init, headers });
}

/** Sync profile and append a row to analytics.user_login_history. */
export async function recordLogin(accessToken?: string): Promise<void> {
  if (!apiBaseUrl) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured');
  }

  const res = await fetchApi('/api/v1/auth/login', { method: 'POST' }, accessToken);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Login sync failed (${res.status}): ${detail || res.statusText}`);
  }
}

/** Award arcade GioPoints (clamped to daily arcade + total caps on the server). */
export async function awardArcadePoints(
  amount: number,
  opts?: {
    reference_type?: string;
    reference_id?: string;
    description?: string;
  },
): Promise<ArcadeAward> {
  if (!apiBaseUrl) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured');
  }

  const res = await fetchApi('/api/v1/points/arcade/award', {
    method: 'POST',
    body: JSON.stringify({
      amount,
      reference_type: opts?.reference_type,
      reference_id: opts?.reference_id,
      description: opts?.description,
    }),
  });
  if (res.status === 409) {
    const detail = await res.text();
    throw new Error(detail || 'Daily GioPoints cap reached');
  }
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Arcade award failed (${res.status}): ${detail || res.statusText}`);
  }
  return (await res.json()) as ArcadeAward;
}
