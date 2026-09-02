import { useSyncExternalStore } from 'react';

import {
  getLocalAccountSnapshot,
  subscribeLocalAccount,
} from '@/data/localAccountRepository';

export function useLocalAccount() {
  return useSyncExternalStore(
    subscribeLocalAccount,
    getLocalAccountSnapshot,
    getLocalAccountSnapshot,
  );
}

