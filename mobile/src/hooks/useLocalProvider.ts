import { useSyncExternalStore } from 'react';

import { getLocalProviderSnapshot, subscribeLocalProvider } from '@/data/localProviderRepository';

export function useLocalProvider() {
  return useSyncExternalStore(subscribeLocalProvider, getLocalProviderSnapshot, getLocalProviderSnapshot);
}
