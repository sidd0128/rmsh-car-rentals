import { BaseLocalRepository } from '@core/database/baseRepository';
import { createId } from '@core/helpers/id';
import { todayISO } from '@core/helpers/date';
import { STORAGE_KEYS } from '@core/storage/storageKeys';
import type { CreateFinePayload, Fine } from '@core/types/domain';
import type { IFineRepository } from './IFineRepository';

class AsyncStorageFineRepository extends BaseLocalRepository<Fine> implements IFineRepository {
  constructor() {
    super(STORAGE_KEYS.FINES);
  }

  getFines(): Promise<Fine[]> {
    return this.getAll();
  }

  async addFine(payload: CreateFinePayload): Promise<Fine> {
    const now = todayISO();
    const fine: Fine = { ...payload, id: createId(), createdAt: now, updatedAt: now };
    await this.save(fine);
    return fine;
  }

  async updateFine(fine: Fine): Promise<void> {
    await this.save({ ...fine, updatedAt: todayISO() });
  }

  deleteFine(id: string): Promise<void> {
    return this.delete(id);
  }
}

export const asyncStorageFineRepository = new AsyncStorageFineRepository();
