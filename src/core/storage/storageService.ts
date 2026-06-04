import { AsyncStorageAdapter } from './asyncStorageAdapter';
import type { IStorageAdapter } from './IStorageAdapter';

/**
 * Single entry point for persistence.
 * Swap adapter implementation (e.g. MMKV) without touching repositories.
 */
class StorageService {
  constructor(private readonly adapter: IStorageAdapter = new AsyncStorageAdapter()) {}

  getItem<T>(key: string): Promise<T | null> {
    return this.adapter.getItem<T>(key);
  }

  setItem<T>(key: string, value: T): Promise<void> {
    return this.adapter.setItem(key, value);
  }

  removeItem(key: string): Promise<void> {
    return this.adapter.removeItem(key);
  }

  clear(): Promise<void> {
    return this.adapter.clear();
  }
}

export const storageService = new StorageService();
