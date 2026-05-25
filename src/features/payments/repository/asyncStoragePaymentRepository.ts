import { BaseLocalRepository } from '@core/database/baseRepository';
import { createId } from '@core/helpers/id';
import { todayISO } from '@core/helpers/date';
import { STORAGE_KEYS } from '@core/storage/storageKeys';
import type { PaymentRecord } from '@core/types/domain';
import type { IPaymentRepository } from './IPaymentRepository';

class AsyncStoragePaymentRepository
  extends BaseLocalRepository<PaymentRecord>
  implements IPaymentRepository
{
  constructor() {
    super(STORAGE_KEYS.PAYMENTS);
  }

  getPayments(): Promise<PaymentRecord[]> {
    return this.getAll();
  }

  getPaymentById(id: string): Promise<PaymentRecord | undefined> {
    return this.getById(id);
  }

  async getPaymentsByCustomerId(customerId: string): Promise<PaymentRecord[]> {
    return (await this.getAll()).filter(p => p.customerId === customerId);
  }

  async getPaymentsByRentalId(rentalId: string): Promise<PaymentRecord[]> {
    return (await this.getAll()).filter(p => p.rentalId === rentalId);
  }

  async addPayment(
    payment: Omit<PaymentRecord, 'id' | 'createdAt'>,
  ): Promise<PaymentRecord> {
    const record: PaymentRecord = {
      ...payment,
      id: createId(),
      createdAt: todayISO(),
    };
    await this.save(record);
    return record;
  }

  async updatePayment(payment: PaymentRecord): Promise<void> {
    await this.save(payment);
  }

  deletePayment(id: string): Promise<void> {
    return this.delete(id);
  }
}

export const asyncStoragePaymentRepository = new AsyncStoragePaymentRepository();
