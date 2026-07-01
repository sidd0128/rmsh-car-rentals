import { useEffect, useRef } from 'react';
import { isFirebaseConfigured } from '@core/firebase/config/firebaseAppConfig';
import { useTranslation } from '@core/i18n';
import { handleError } from '@error/errorHandler';
import { useFirebaseAuthStore } from '@features/auth/store/useFirebaseAuthStore';
import { useToastStore } from '@zustand/useToastStore';
import { bookingRequestCloudService } from '../services/bookingRequestCloudService';
import { useBookingRequestStore } from '../store/useBookingRequestStore';

export const useBookingRequestRealtimeSync = () => {
  const { t } = useTranslation();
  const authStatus = useFirebaseAuthStore(s => s.status);
  const showToast = useToastStore(s => s.showToast);
  const knownRequestIdsRef = useRef<Set<string>>(new Set());
  const hasReceivedInitialSnapshotRef = useRef(false);

  useEffect(() => {
    if (!isFirebaseConfigured() || authStatus !== 'authenticated') {
      knownRequestIdsRef.current = new Set();
      hasReceivedInitialSnapshotRef.current = false;
      return undefined;
    }

    const unsubscribe = bookingRequestCloudService.subscribe(
      bookingRequests => {
        const nextIds = new Set(bookingRequests.map(request => request.id));

        if (hasReceivedInitialSnapshotRef.current) {
          const newRequests = bookingRequests.filter(
            request => !knownRequestIdsRef.current.has(request.id),
          );
          const [firstNewRequest] = newRequests;

          if (firstNewRequest) {
            showToast(
              newRequests.length === 1
                ? t('bookingRequests.newRequestNotification', {
                    customer: firstNewRequest.customerName,
                    car: firstNewRequest.carName,
                  })
                : t('bookingRequests.newRequestsNotification', {
                    count: newRequests.length,
                  }),
              { type: 'info', duration: 6000 },
            );
          }
        } else {
          hasReceivedInitialSnapshotRef.current = true;
        }

        knownRequestIdsRef.current = nextIds;
        useBookingRequestStore.getState().setBookingRequests(bookingRequests);
      },
      error => {
        handleError(error, 'useBookingRequestRealtimeSync');
      },
    );

    return unsubscribe ?? undefined;
  }, [authStatus, showToast, t]);
};
