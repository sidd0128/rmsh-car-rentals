import { create } from 'zustand';
import { bookingRequestApprovalService } from '@core/services/bookingRequestApprovalService';
import { offlineFirstSyncOrchestratorService } from '@core/sync/services/offlineFirstSyncOrchestratorService';
import type { BookingRequest } from '@core/types/domain';
import { asyncStorageBookingRequestRepository } from '../repository/asyncStorageBookingRequestRepository';

interface BookingRequestState {
  bookingRequests: BookingRequest[];
  loading: boolean;
  hydrate: () => Promise<void>;
  approveRequest: (requestId: string) => Promise<{ success: boolean; error?: string }>;
  declineRequest: (requestId: string) => Promise<{ success: boolean; error?: string }>;
}

const refreshFromCloud = async (): Promise<void> => {
  await offlineFirstSyncOrchestratorService.pullRemoteIntoLocal();
};

export const useBookingRequestStore = create<BookingRequestState>(set => ({
  bookingRequests: [],
  loading: false,

  hydrate: async () => {
    const bookingRequests = await asyncStorageBookingRequestRepository.getBookingRequests();
    set({ bookingRequests });
  },

  approveRequest: async requestId => {
    set({ loading: true });
    try {
      await bookingRequestApprovalService.approveRequest(requestId);
      await refreshFromCloud();
      const bookingRequests = await asyncStorageBookingRequestRepository.getBookingRequests();
      set({ bookingRequests, loading: false });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Could not approve request.',
      };
    }
  },

  declineRequest: async requestId => {
    set({ loading: true });
    try {
      await bookingRequestApprovalService.declineRequest(requestId);
      await refreshFromCloud();
      const bookingRequests = await asyncStorageBookingRequestRepository.getBookingRequests();
      set({ bookingRequests, loading: false });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Could not decline request.',
      };
    }
  },
}));
