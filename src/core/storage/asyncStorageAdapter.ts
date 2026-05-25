import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IStorageAdapter } from './IStorageAdapter';

export class AsyncStorageAdapter implements IStorageAdapter {
  async getItem<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  async multiGet<T>(keys: string[]): Promise<Record<string, T | null>> {
    const result: Record<string, T | null> = {};
    await Promise.all(
      keys.map(async key => {
        result[key] = await this.getItem<T>(key);
      }),
    );
    return result;
  }

  async clear(): Promise<void> {
    await AsyncStorage.clear();
  }
}
