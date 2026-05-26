/**
 * Merges local AsyncStorage entities with remote Firestore copies.
 * Newer `updatedAt` wins; falls back to `createdAt` when `updatedAt` is missing.
 */

export interface TimestampedEntity {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

const entityTimestamp = (entity: TimestampedEntity): number => {
  const iso = entity.updatedAt ?? entity.createdAt;
  return new Date(iso).getTime();
};

export const mergeEntityListsByTimestamp = <T extends TimestampedEntity>(
  localItems: T[],
  remoteItems: T[],
): T[] => {
  const merged = new Map<string, T>();

  for (const item of localItems) {
    merged.set(item.id, item);
  }

  for (const remote of remoteItems) {
    const existing = merged.get(remote.id);
    if (!existing || entityTimestamp(remote) >= entityTimestamp(existing)) {
      merged.set(remote.id, remote);
    }
  }

  return Array.from(merged.values());
};
