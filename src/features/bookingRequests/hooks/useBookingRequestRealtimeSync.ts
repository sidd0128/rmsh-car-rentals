import { useEffect } from 'react';
import { isFirebaseConfigured } from '@core/firebase/config/firebaseAppConfig';
import { handleError } from '@error/errorHandler';
import { useFirebaseAuthStore } from '@features/auth/store/useFirebaseAuthStore';
import { bookingRequestCloudService } from '../services/bookingRequestCloudService';
import { useBookingRequestStore } from '../store/useBookingRequestStore';

export const useBookingRequestRealtimeSync = () => {
  const authStatus = useFirebaseAuthStore(s => s.status);

  useEffect(() => {
    if (!isFirebaseConfigured() || authStatus !== 'authenticated') {
      return undefined;
    }

    const unsubscribe = bookingRequestCloudService.subscribe(
      bookingRequests => {
        useBookingRequestStore.getState().setBookingRequests(bookingRequests);
      },
      error => {
        handleError(error, 'useBookingRequestRealtimeSync');
      },
    );

    return unsubscribe ?? undefined;
  }, [authStatus]);
};
