import { create } from 'zustand';
import { repositories } from '@core/database/repositoryRegistry';
import {
  deriveRentalPaymentStatus,
  paymentsForRental,
} from '@core/helpers/rentalPayments';
import type { PaymentRecord } from '@core/types/domain';
import { useRentalStore } from '@features/rentals/store/useRentalStore';

interface PaymentState {
  payments: PaymentRecord[];
  hydrate: () => Promise<void>;
  markPaymentReceived: (paymentId: string) => Promise<void>;
}

const syncRentalPaymentStatus = async (rentalId: string): Promise<void> => {
  const allPayments = await repositories.payments.getPayments();
  const rentalPayments = paymentsForRental(rentalId, allPayments);
  const rental = await repositories.rentals.getRentalById(rentalId);
  if (!rental) {
    return;
  }
  const paymentStatus = deriveRentalPaymentStatus(rentalPayments);
  if (paymentStatus !== rental.paymentStatus) {
    await repositories.rentals.updateRental({ ...rental, paymentStatus });
  }
};

const refreshStores = async () => {
  const payments = await repositories.payments.getPayments();
  usePaymentStore.setState({ payments });
  await useRentalStore.getState().hydrate();
};

export const usePaymentStore = create<PaymentState>((set, get) => ({
  payments: [],

  hydrate: async () => {
    const payments = await repositories.payments.getPayments();
    set({ payments });
  },

  markPaymentReceived: async paymentId => {
    const payment = get().payments.find(p => p.id === paymentId);
    if (!payment || payment.status === 'DONE') {
      return;
    }
    const updated: PaymentRecord = {
      ...payment,
      status: 'DONE',
      paidAt: new Date().toISOString(),
    };
    await repositories.payments.updatePayment(updated);
    await syncRentalPaymentStatus(payment.rentalId);
    await refreshStores();
  },

}));
