import { useEffect, useState } from 'react';

import {
  initializeMockProviderPricing,
  subscribeMockProviderPricing,
} from '@/constants/mockProviders';

export function useMockProviderPricing() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeMockProviderPricing(() => setVersion((version) => version + 1));
    void initializeMockProviderPricing();
    return unsubscribe;
  }, []);

  return version;
}
