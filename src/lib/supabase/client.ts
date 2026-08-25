import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '@/types/database';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ymunwzjmemxifjxsiugz.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Storage adapter for native, web, and node test environments
const memoryStorage: Record<string, string> = {};

const customStorage = {
  getItem: async (key: string) => {
    try {
      if (typeof window === 'undefined' || !AsyncStorage) {
        return memoryStorage[key] || null;
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return memoryStorage[key] || null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (typeof window === 'undefined' || !AsyncStorage) {
        memoryStorage[key] = value;
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch {
      memoryStorage[key] = value;
    }
  },
  removeItem: async (key: string) => {
    try {
      if (typeof window === 'undefined' || !AsyncStorage) {
        delete memoryStorage[key];
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch {
      delete memoryStorage[key];
    }
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
