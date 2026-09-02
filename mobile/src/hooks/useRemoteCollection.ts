import { useSyncExternalStore } from 'react';

import type { RemoteCollection } from '@/data/remoteCollection';

/**
 * Lee una colección remota con el mismo contrato que los hooks locales:
 * la pantalla recibe un array síncrono y se re-renderiza al llegar los datos.
 */
export function useRemoteCollection<T extends { id: string }>(
  collection: RemoteCollection<T>,
): { items: T[]; ready: boolean; refresh: () => Promise<T[]> } {
  const items = useSyncExternalStore(
    collection.subscribe,
    collection.getAll,
    collection.getAll,
  );
  const ready = useSyncExternalStore(
    collection.subscribe,
    collection.isReady,
    collection.isReady,
  );

  return { items, ready, refresh: collection.refresh };
}
