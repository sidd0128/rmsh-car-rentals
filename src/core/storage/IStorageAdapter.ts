export interface IStorageAdapter {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  multiGet<T>(keys: string[]): Promise<Record<string, T | null>>;
  clear(): Promise<void>;
}
