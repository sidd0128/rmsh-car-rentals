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

  async addPayment(
    payment: Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<PaymentRecord> {
    const now = todayISO();
    const record: PaymentRecord = {
      ...payment,
      id: createId(),
      createdAt: now,
      updatedAt: now,
    };
    await this.save(record);
    return record;
  }

  async updatePayment(payment: PaymentRecord): Promise<void> {
    await this.save({ ...payment, updatedAt: todayISO() });
  }

  deletePayment(id: string): Promise<void> {
    return this.delete(id);
  }
}

export const asyncStoragePaymentRepository = new AsyncStoragePaymentRepository();
