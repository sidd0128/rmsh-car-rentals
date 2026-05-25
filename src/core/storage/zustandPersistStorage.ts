import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

/** Zustand persist adapter — stores raw JSON strings (separate from domain repositories) */
export const zustandPersistStorage: StateStorage = {
  getItem: async (name: string) => AsyncStorage.getItem(name),
  setItem: async (name: string, value: string) => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name: string) => {
    await AsyncStorage.removeItem(name);
  },
};
