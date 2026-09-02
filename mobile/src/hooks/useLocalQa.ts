import { useSyncExternalStore } from 'react';

import { getLocalQaSnapshot, subscribeLocalQa } from '@/data/localQaRepository';

export function useLocalQa() {
  return useSyncExternalStore(subscribeLocalQa, getLocalQaSnapshot, getLocalQaSnapshot);
}
