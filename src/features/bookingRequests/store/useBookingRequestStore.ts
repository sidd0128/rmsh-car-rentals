import { create } from 'zustand';
import { FIRESTORE_COLLECTION_NAMES } from '@core/firebase/constants/firestoreCollectionNames';
import { firestoreDocumentSyncService } from '@core/firebase/services/firestoreDocumentSyncService';
import { bookingRequestApprovalService } from '@core/services/bookingRequestApprovalService';
import type { BookingRequest } from '@core/types/domain';

interface BookingRequestState {
  bookingRequests: BookingRequest[];
  loading: boolean;
  hydrate: () => Promise<void>;
  setBookingRequests: (bookingRequests: BookingRequest[]) => void;
  approveRequest: (
    requestId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  declineRequest: (
    requestId: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

const getCloudBookingRequests = (): Promise<BookingRequest[]> => {
  return firestoreDocumentSyncService.fetchAllDocuments<BookingRequest>(
    FIRESTORE_COLLECTION_NAMES.BOOKING_REQUESTS,
  );
};

export const useBookingRequestStore = create<BookingRequestState>(set => ({
  bookingRequests: [],
  loading: false,

  hydrate: async () => {
    set({ loading: true });
    try {
      const bookingRequests = await getCloudBookingRequests();
      set({ bookingRequests, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  setBookingRequests: bookingRequests => set({ bookingRequests }),

  approveRequest: async requestId => {
    set({ loading: true });
    try {
      await bookingRequestApprovalService.approveRequest(requestId);
      const bookingRequests = await getCloudBookingRequests();
      set({ bookingRequests, loading: false });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Could not approve request.',
      };
    }
  },

  declineRequest: async requestId => {
    set({ loading: true });
    try {
      await bookingRequestApprovalService.declineRequest(requestId);
      const bookingRequests = await getCloudBookingRequests();
      set({ bookingRequests, loading: false });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Could not decline request.',
      };
    }
  },
}));
