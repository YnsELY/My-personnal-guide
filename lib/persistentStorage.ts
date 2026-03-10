import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const getWebStorage = () => {
  if (Platform.OS !== 'web') return null;
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const persistentStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      const storage = getWebStorage();
      if (!storage) return null;
      try {
        return storage.getItem(key);
      } catch {
        return null;
      }
    }

    if (typeof SecureStore.getItemAsync !== 'function') return null;
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      const storage = getWebStorage();
      if (!storage) return;
      try {
        storage.setItem(key, value);
      } catch {
        // no-op
      }
      return;
    }

    if (typeof SecureStore.setItemAsync !== 'function') return;
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // no-op
    }
  },

  async deleteItemAsync(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      const storage = getWebStorage();
      if (!storage) return;
      try {
        storage.removeItem(key);
      } catch {
        // no-op
      }
      return;
    }

    if (typeof SecureStore.deleteItemAsync !== 'function') return;
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // no-op
    }
  },
};
