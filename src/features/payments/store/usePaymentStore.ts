import { create } from 'zustand';
import { repositories } from '@core/database/repositoryRegistry';
import type { PaymentRecord } from '@core/types/domain';

interface PaymentState {
  payments: PaymentRecord[];
  isLoading: boolean;
  hydrate: () => Promise<void>;
  updatePaymentStatus: (
    paymentId: string,
    status: PaymentRecord['status'],
  ) => Promise<void>;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  payments: [],
  isLoading: false,

  hydrate: async () => {
    set({ isLoading: true });
    const payments = await repositories.payments.getPayments();
    set({ payments, isLoading: false });
  },

  updatePaymentStatus: async (paymentId, status) => {
    const payment = get().payments.find(p => p.id === paymentId);
    if (!payment) {
      return;
    }
    const updated: PaymentRecord = {
      ...payment,
      status,
      paidAt: status === 'DONE' ? new Date().toISOString() : undefined,
    };
    await repositories.payments.updatePayment(updated);

    const rental = await repositories.rentals.getRentalById(payment.rentalId);
    if (rental) {
      await repositories.rentals.updateRental({
        ...rental,
        paymentStatus: status,
      });
    }

    set({ payments: get().payments.map(p => (p.id === paymentId ? updated : p)) });
  },
}));
