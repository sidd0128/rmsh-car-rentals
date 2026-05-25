import type { PaymentRecord } from '@core/types/domain';

export interface IPaymentRepository {
  getPayments(): Promise<PaymentRecord[]>;
  getPaymentById(id: string): Promise<PaymentRecord | undefined>;
  getPaymentsByCustomerId(customerId: string): Promise<PaymentRecord[]>;
  getPaymentsByRentalId(rentalId: string): Promise<PaymentRecord[]>;
  addPayment(payment: Omit<PaymentRecord, 'id' | 'createdAt'>): Promise<PaymentRecord>;
  updatePayment(payment: PaymentRecord): Promise<void>;
  deletePayment(id: string): Promise<void>;
}
