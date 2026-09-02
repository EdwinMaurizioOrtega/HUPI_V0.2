import { useSyncExternalStore } from 'react';

import { getCachedQuote, primeQuote, subscribeQuotes } from '@/data/remoteQuotes';

/**
 * Repinta la pantalla cuando llega la cotización del backend.
 *
 * `calculateMockPayment` la lee de la caché de forma síncrona; sin esta
 * suscripción seguiría mostrando el cálculo local hasta el próximo repintado.
 */
export function useRemoteQuote(providerValue: number) {
  primeQuote(providerValue);
  return useSyncExternalStore(
    subscribeQuotes,
    () => getCachedQuote(providerValue),
    () => null,
  );
}
