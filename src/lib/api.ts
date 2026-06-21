import { supabase } from '@/lib/supabase';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export async function fetchApi(path: string, init: RequestInit = {}): Promise<Response> {
  if (!apiBaseUrl) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init.headers);
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${apiBaseUrl}${path}`, { ...init, headers });
}
