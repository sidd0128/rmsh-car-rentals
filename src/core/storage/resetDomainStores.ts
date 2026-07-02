import { useAccidentStore } from '@features/accidents/store/useAccidentStore';
import { useBookingRequestStore } from '@features/bookingRequests/store/useBookingRequestStore';
import { useCarFilterStore } from '@features/cars/store/useCarFilterStore';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { useFineStore } from '@features/fines/store/useFineStore';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { useCloudSyncStore } from '@core/store/useCloudSyncStore';
import { useDeletionAuditLogStore } from '@features/security/store/useDeletionAuditLogStore';

/** Clears in-memory domain state after AsyncStorage has been wiped. */
export const resetDomainStores = (): void => {
  useCarStore.setState({ cars: [] });
  useCustomerStore.setState({ customers: [], searchQuery: '' });
  useRentalStore.setState({ rentals: [] });
  usePaymentStore.setState({ payments: [] });
  useFineStore.setState({ fines: [] });
  useAccidentStore.setState({ accidents: [] });
  useBookingRequestStore.setState({ bookingRequests: [], loading: false });
  useDeletionAuditLogStore.setState({ logs: [] });
  useCarFilterStore.setState({ filter: 'ALL', searchQuery: '' });
  useCloudSyncStore.setState({
    lastSyncedAt: null,
    lastMessage: null,
    hasPendingSync: false,
    isSyncing: false,
  });
};
