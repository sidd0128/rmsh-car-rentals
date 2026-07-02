import { BaseLocalRepository } from '@core/database/baseRepository';
import { createId } from '@core/helpers/id';
import { todayISO } from '@core/helpers/date';
import { STORAGE_KEYS } from '@core/storage/storageKeys';
import type { CreateCustomerPayload, Customer } from '@core/types/domain';
import type { ICustomerRepository } from './ICustomerRepository';

class AsyncStorageCustomerRepository
  extends BaseLocalRepository<Customer>
  implements ICustomerRepository
{
  constructor() {
    super(STORAGE_KEYS.CUSTOMERS);
  }

  getCustomers(): Promise<Customer[]> {
    return this.getAll();
  }

  getCustomerById(id: string): Promise<Customer | undefined> {
    return this.getById(id);
  }

  async addCustomer(payload: CreateCustomerPayload): Promise<Customer> {
    const now = todayISO();
    const customer: Customer = {
      ...payload,
      id: createId(),
      totalSpent: 0,
      totalRentals: 0,
      fineHistory: [],
      accidentHistory: [],
      isBlacklisted: payload.isBlacklisted ?? false,
      createdAt: now,
      updatedAt: now,
    };
    await this.save(customer);
    return customer;
  }

  async updateCustomer(customer: Customer): Promise<void> {
    await this.save({ ...customer, updatedAt: todayISO() });
  }

  deleteCustomer(id: string): Promise<void> {
    return this.delete(id);
  }
}

export const asyncStorageCustomerRepository =
  new AsyncStorageCustomerRepository();
