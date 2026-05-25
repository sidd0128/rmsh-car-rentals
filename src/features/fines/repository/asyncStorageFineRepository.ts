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

  getFineById(id: string): Promise<Fine | undefined> {
    return this.getById(id);
  }

  async getFinesByCustomerId(customerId: string): Promise<Fine[]> {
    return (await this.getAll()).filter(f => f.customerId === customerId);
  }

  async getFinesByCarId(carId: string): Promise<Fine[]> {
    return (await this.getAll()).filter(f => f.carId === carId);
  }

  async addFine(payload: CreateFinePayload): Promise<Fine> {
    const fine: Fine = { ...payload, id: createId(), createdAt: todayISO() };
    await this.save(fine);
    return fine;
  }

  async updateFine(fine: Fine): Promise<void> {
    await this.save(fine);
  }

  deleteFine(id: string): Promise<void> {
    return this.delete(id);
  }
}

export const asyncStorageFineRepository = new AsyncStorageFineRepository();
