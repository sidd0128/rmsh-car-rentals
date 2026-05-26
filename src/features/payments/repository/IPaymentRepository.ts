import type { PaymentRecord } from '@core/types/domain';

export interface IPaymentRepository {
  getPayments(): Promise<PaymentRecord[]>;
  addPayment(
    payment: Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<PaymentRecord>;
  updatePayment(payment: PaymentRecord): Promise<void>;
  deletePayment(id: string): Promise<void>;
}
