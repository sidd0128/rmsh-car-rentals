/**
 * Central registry for repository implementations.
 * Swap AsyncStorage* → Api* repositories here when backend is ready.
 */
import type { IAccidentRepository } from '@features/accidents/repository/IAccidentRepository';
import { asyncStorageAccidentRepository } from '@features/accidents/repository/asyncStorageAccidentRepository';
import type { ICarRepository } from '@features/cars/repository/ICarRepository';
import { asyncStorageCarRepository } from '@features/cars/repository/asyncStorageCarRepository';
import type { ICustomerRepository } from '@features/customers/repository/ICustomerRepository';
import { asyncStorageCustomerRepository } from '@features/customers/repository/asyncStorageCustomerRepository';
import type { IFineRepository } from '@features/fines/repository/IFineRepository';
import { asyncStorageFineRepository } from '@features/fines/repository/asyncStorageFineRepository';
import type { IPaymentRepository } from '@features/payments/repository/IPaymentRepository';
import { asyncStoragePaymentRepository } from '@features/payments/repository/asyncStoragePaymentRepository';
import type { IRentalRepository } from '@features/rentals/repository/IRentalRepository';
import { asyncStorageRentalRepository } from '@features/rentals/repository/asyncStorageRentalRepository';

export const repositories = {
  cars: asyncStorageCarRepository as ICarRepository,
  customers: asyncStorageCustomerRepository as ICustomerRepository,
  rentals: asyncStorageRentalRepository as IRentalRepository,
  fines: asyncStorageFineRepository as IFineRepository,
  accidents: asyncStorageAccidentRepository as IAccidentRepository,
  payments: asyncStoragePaymentRepository as IPaymentRepository,
};
