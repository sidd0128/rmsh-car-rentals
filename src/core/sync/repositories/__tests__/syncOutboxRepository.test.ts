import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIRESTORE_COLLECTION_NAMES } from '@core/firebase/constants/firestoreCollectionNames';
import { syncOutboxRepository } from '../syncOutboxRepository';

let mockNextId = 0;

jest.mock('@core/helpers/id', () => ({
  createId: () => `sync-outbox-entry-${++mockNextId}`,
}));

describe('syncOutboxRepository', () => {
  beforeEach(async () => {
    mockNextId = 0;
    await AsyncStorage.clear();
  });

  it('keeps only the newest pending mutation for the same entity', async () => {
    await syncOutboxRepository.enqueue({
      collectionName: FIRESTORE_COLLECTION_NAMES.CARS,
      operation: 'upsert',
      payload: { id: 'car-1', name: 'Old name' },
    });
    await syncOutboxRepository.enqueue({
      collectionName: FIRESTORE_COLLECTION_NAMES.CARS,
      operation: 'upsert',
      payload: { id: 'car-1', name: 'New name' },
    });

    const entries = await syncOutboxRepository.getAll();

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      collectionName: FIRESTORE_COLLECTION_NAMES.CARS,
      operation: 'upsert',
      payload: { id: 'car-1', name: 'New name' },
    });
  });

  it('does not coalesce different collections or entities', async () => {
    await syncOutboxRepository.enqueue({
      collectionName: FIRESTORE_COLLECTION_NAMES.CARS,
      operation: 'upsert',
      payload: { id: 'shared-id' },
    });
    await syncOutboxRepository.enqueue({
      collectionName: FIRESTORE_COLLECTION_NAMES.CUSTOMERS,
      operation: 'upsert',
      payload: { id: 'shared-id' },
    });
    await syncOutboxRepository.enqueue({
      collectionName: FIRESTORE_COLLECTION_NAMES.CARS,
      operation: 'upsert',
      payload: { id: 'car-2' },
    });

    await expect(syncOutboxRepository.getAll()).resolves.toHaveLength(3);
  });
});
