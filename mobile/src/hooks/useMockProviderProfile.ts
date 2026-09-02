import { useEffect, useState } from 'react';

import { initializeMockProviderProfiles, subscribeMockProviderProfiles } from '@/data/mockProviderProfileRepository';

export function useMockProviderProfile() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = subscribeMockProviderProfiles(() => mounted && setVersion((value) => value + 1));
    void initializeMockProviderProfiles().then(() => mounted && setVersion((value) => value + 1));
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return version;
}
