import { collection, onSnapshot } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { FIRESTORE_COLLECTION_NAMES } from '@core/firebase/constants/firestoreCollectionNames';
import { getFirestoreDatabaseOrNull } from '@core/firebase/services/firestoreDatabaseService';
import type { BookingRequest } from '@core/types/domain';

export const bookingRequestRealtimeSyncService = {
  subscribe(
    onSynced: (bookingRequests: BookingRequest[]) => void,
    onError?: (error: unknown) => void,
  ): Unsubscribe | null {
    const db = getFirestoreDatabaseOrNull();
    if (!db) {
      return null;
    }

    return onSnapshot(
      collection(db, FIRESTORE_COLLECTION_NAMES.BOOKING_REQUESTS),
      snapshot => {
        const bookingRequests = snapshot.docs.map(documentSnapshot => ({
          id: documentSnapshot.id,
          ...(documentSnapshot.data() as Omit<BookingRequest, 'id'>),
        })) as BookingRequest[];

        onSynced(bookingRequests);
      },
      error => {
        onError?.(error);
      },
    );
  },
};
