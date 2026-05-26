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

  async addAccident(payload: CreateAccidentPayload): Promise<AccidentRecord> {
    const now = todayISO();
    const record: AccidentRecord = {
      ...payload,
      id: createId(),
      createdAt: now,
      updatedAt: now,
    };
    await this.save(record);
    return record;
  }
}

export const asyncStorageAccidentRepository = new AsyncStorageAccidentRepository();
