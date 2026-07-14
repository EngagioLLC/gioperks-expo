import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/** Sign out after this long without app activity. */
export const SESSION_INACTIVITY_MS = 2 * 60 * 60 * 1000;

const STORAGE_KEY = 'giogo.session.lastActiveAt';

async function readLastActiveAt(): Promise<number | null> {
  let raw: string | null;
  if (Platform.OS === 'web') {
    raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  } else {
    raw = await AsyncStorage.getItem(STORAGE_KEY);
  }
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

async function writeLastActiveAt(timestamp: number): Promise<void> {
  const value = String(timestamp);
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, value);
    }
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, value);
}

export async function touchSessionActivity(at: number = Date.now()): Promise<void> {
  await writeLastActiveAt(at);
}

export async function clearSessionActivity(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    return;
  }
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/** True when a prior activity stamp exists and is older than the inactivity window. */
export async function isSessionInactive(now: number = Date.now()): Promise<boolean> {
  const lastActiveAt = await readLastActiveAt();
  if (lastActiveAt == null) return false;
  return now - lastActiveAt > SESSION_INACTIVITY_MS;
}
