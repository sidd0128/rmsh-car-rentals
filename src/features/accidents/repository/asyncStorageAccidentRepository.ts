import { BaseLocalRepository } from '@core/database/baseRepository';
import { createId } from '@core/helpers/id';
import { todayISO } from '@core/helpers/date';
import { STORAGE_KEYS } from '@core/storage/storageKeys';
import type { AccidentRecord, CreateAccidentPayload } from '@core/types/domain';
import type { IAccidentRepository } from './IAccidentRepository';

class AsyncStorageAccidentRepository
  extends BaseLocalRepository<AccidentRecord>
  implements IAccidentRepository
{
  constructor() {
    super(STORAGE_KEYS.ACCIDENTS);
  }

  getAccidents(): Promise<AccidentRecord[]> {
    return this.getAll();
  }

  getAccidentById(id: string): Promise<AccidentRecord | undefined> {
    return this.getById(id);
  }

  async getAccidentsByCustomerId(customerId: string): Promise<AccidentRecord[]> {
    return (await this.getAll()).filter(a => a.customerId === customerId);
  }

  async getAccidentsByCarId(carId: string): Promise<AccidentRecord[]> {
    return (await this.getAll()).filter(a => a.carId === carId);
  }

  async addAccident(payload: CreateAccidentPayload): Promise<AccidentRecord> {
    const record: AccidentRecord = { ...payload, id: createId(), createdAt: todayISO() };
    await this.save(record);
    return record;
  }

  async updateAccident(record: AccidentRecord): Promise<void> {
    await this.save(record);
  }

  deleteAccident(id: string): Promise<void> {
    return this.delete(id);
  }
}

export const asyncStorageAccidentRepository = new AsyncStorageAccidentRepository();
