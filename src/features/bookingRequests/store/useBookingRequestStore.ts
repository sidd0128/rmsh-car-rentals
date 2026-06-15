import { create } from 'zustand';
import { bookingRequestApprovalService } from '@core/services/bookingRequestApprovalService';
import type { BookingRequest } from '@core/types/domain';
import { bookingRequestCloudService } from '../services/bookingRequestCloudService';

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

type SetBookingRequestState = (
  state: Partial<Pick<BookingRequestState, 'bookingRequests' | 'loading'>>,
) => void;

const refreshBookingRequests = async (
  set: SetBookingRequestState,
): Promise<void> => {
  const bookingRequests = await bookingRequestCloudService.getAll();
  set({ bookingRequests, loading: false });
};

const runBookingRequestAction = async (
  set: SetBookingRequestState,
  action: () => Promise<unknown>,
  fallbackError: string,
): Promise<{ success: boolean; error?: string }> => {
  set({ loading: true });
  try {
    await action();
    await refreshBookingRequests(set);
    return { success: true };
  } catch (error) {
    set({ loading: false });
    return {
      success: false,
      error: error instanceof Error ? error.message : fallbackError,
    };
  }
};

export const useBookingRequestStore = create<BookingRequestState>(set => ({
  bookingRequests: [],
  loading: false,

  hydrate: async () => {
    set({ loading: true });
    try {
      await refreshBookingRequests(set);
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  setBookingRequests: bookingRequests => set({ bookingRequests }),

  approveRequest: async requestId => {
    return runBookingRequestAction(
      set,
      () => bookingRequestApprovalService.approveRequest(requestId),
      'Could not approve request.',
    );
  },

  declineRequest: async requestId => {
    return runBookingRequestAction(
      set,
      () => bookingRequestApprovalService.declineRequest(requestId),
      'Could not decline request.',
    );
  },
}));
