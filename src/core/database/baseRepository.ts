/**
 * Generic CRUD for entities stored as a JSON array under one AsyncStorage key.
 * Feature repos extend this class and implement their `I*Repository` interface.
 */
import { storageService } from '../storage/storageService';

export abstract class BaseLocalRepository<T extends { id: string }> {
  constructor(protected readonly storageKey: string) {}

  protected async readAll(): Promise<T[]> {
    return (await storageService.getItem<T[]>(this.storageKey)) ?? [];
  }

  protected async writeAll(items: T[]): Promise<void> {
    await storageService.setItem(this.storageKey, items);
  }

  async getAll(): Promise<T[]> {
    return this.readAll();
  }

  async getById(id: string): Promise<T | undefined> {
    const items = await this.readAll();
    return items.find(item => item.id === id);
  }

  async save(item: T): Promise<void> {
    const items = await this.readAll();
    const index = items.findIndex(i => i.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }
    await this.writeAll(items);
  }

  async delete(id: string): Promise<void> {
    const items = await this.readAll();
    await this.writeAll(items.filter(i => i.id !== id));
  }

  /** Replaces the full collection — used when merging cloud data into local storage. */
  async replaceAll(items: T[]): Promise<void> {
    await this.writeAll(items);
  }
}
