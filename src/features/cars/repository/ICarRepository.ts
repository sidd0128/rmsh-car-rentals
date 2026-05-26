import type { Car, CreateCarPayload } from '@core/types/domain';

export interface ICarRepository {
  getCars(): Promise<Car[]>;
  getCarById(id: string): Promise<Car | undefined>;
  addCar(payload: CreateCarPayload): Promise<Car>;
  updateCar(car: Car): Promise<void>;
}
