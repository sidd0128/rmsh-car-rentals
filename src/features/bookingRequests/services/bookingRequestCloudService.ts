import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import type {
  DocumentData,
  QueryDocumentSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { FIRESTORE_COLLECTION_NAMES } from '@core/firebase/constants/firestoreCollectionNames';
import { getFirestoreDatabaseOrNull } from '@core/firebase/services/firestoreDatabaseService';
import { firestoreDocumentSyncService } from '@core/firebase/services/firestoreDocumentSyncService';
import type { BookingRequest } from '@core/types/domain';

const mapBookingRequestDocuments = (
  docs: QueryDocumentSnapshot<DocumentData>[],
): BookingRequest[] =>
  docs.map(documentSnapshot => ({
    id: documentSnapshot.id,
    ...(documentSnapshot.data() as Omit<BookingRequest, 'id'>),
  })) as BookingRequest[];

export const bookingRequestCloudService = {
  getAll(): Promise<BookingRequest[]> {
    return firestoreDocumentSyncService.fetchAllDocuments<BookingRequest>(
      FIRESTORE_COLLECTION_NAMES.BOOKING_REQUESTS,
    );
  },

  subscribe(
    onSynced: (bookingRequests: BookingRequest[]) => void,
    onError?: (error: unknown) => void,
  ): Unsubscribe | null {
    const db = getFirestoreDatabaseOrNull();
    if (!db) {
      return null;
    }

    return onSnapshot(
      query(
        collection(db, FIRESTORE_COLLECTION_NAMES.BOOKING_REQUESTS),
        where('status', '==', 'PENDING'),
        orderBy('updatedAt', 'desc'),
      ),
      snapshot => {
        onSynced(mapBookingRequestDocuments(snapshot.docs));
      },
      error => {
        onError?.(error);
      },
    );
  },
};
