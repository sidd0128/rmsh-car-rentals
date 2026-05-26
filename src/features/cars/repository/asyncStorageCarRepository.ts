import { BaseLocalRepository } from '@core/database/baseRepository';
import { createId } from '@core/helpers/id';
import { todayISO } from '@core/helpers/date';
import { STORAGE_KEYS } from '@core/storage/storageKeys';
import type { Car, CreateCarPayload } from '@core/types/domain';
import type { ICarRepository } from './ICarRepository';

class AsyncStorageCarRepository
  extends BaseLocalRepository<Car>
  implements ICarRepository
{
  constructor() {
    super(STORAGE_KEYS.CARS);
  }

  getCars(): Promise<Car[]> {
    return this.getAll();
  }

  getCarById(id: string): Promise<Car | undefined> {
    return this.getById(id);
  }

  async addCar(payload: CreateCarPayload): Promise<Car> {
    const now = todayISO();
    const car: Car = {
      ...payload,
      id: createId(),
      totalEarnings: 0,
      futureBookings: [],
      createdAt: now,
      updatedAt: now,
    };
    await this.save(car);
    return car;
  }

  async updateCar(car: Car): Promise<void> {
    await this.save({ ...car, updatedAt: todayISO() });
  }
}

export const asyncStorageCarRepository = new AsyncStorageCarRepository();
