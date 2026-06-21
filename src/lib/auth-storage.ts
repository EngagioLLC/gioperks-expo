import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { SupportedStorage } from '@supabase/supabase-js';

/**
 * Supabase auth storage for Expo.
 * Uses localStorage on web and AsyncStorage v2 on native (Expo Go compatible).
 */
export const authStorage: SupportedStorage = {
  getItem: (key) => {
    if (Platform.OS === 'web') {
      return Promise.resolve(
        typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null,
      );
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(key);
  },
};
