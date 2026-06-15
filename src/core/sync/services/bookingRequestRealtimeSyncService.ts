import { collection, onSnapshot } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { FIRESTORE_COLLECTION_NAMES } from '@core/firebase/constants/firestoreCollectionNames';
import { getFirestoreDatabaseOrNull } from '@core/firebase/services/firestoreDatabaseService';
import { asyncStorageBookingRequestRepository } from '@features/bookingRequests/repository/asyncStorageBookingRequestRepository';
import type { BookingRequest } from '@core/types/domain';
import { mergeEntityListsByTimestamp } from './entityTimestampMergeService';

export const bookingRequestRealtimeSyncService = {
  subscribe(
    onSynced: () => void,
    onError?: (error: unknown) => void,
  ): Unsubscribe | null {
    const db = getFirestoreDatabaseOrNull();
    if (!db) {
      return null;
    }

    return onSnapshot(
      collection(db, FIRESTORE_COLLECTION_NAMES.BOOKING_REQUESTS),
      snapshot => {
        const syncSnapshot = async () => {
          const remoteBookingRequests = snapshot.docs.map(documentSnapshot => ({
            id: documentSnapshot.id,
            ...(documentSnapshot.data() as Omit<BookingRequest, 'id'>),
          })) as BookingRequest[];

          const localBookingRequests =
            await asyncStorageBookingRequestRepository.getBookingRequests();

          await asyncStorageBookingRequestRepository.replaceAll(
            mergeEntityListsByTimestamp(
              localBookingRequests,
              remoteBookingRequests,
            ),
          );

          onSynced();
        };

        syncSnapshot().catch(error => {
          onError?.(error);
        });
      },
      error => {
        onError?.(error);
      },
    );
  },
};
