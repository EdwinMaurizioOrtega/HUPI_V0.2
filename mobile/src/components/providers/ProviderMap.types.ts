import type { BookableServiceId } from '@/constants/services';
import type { MockProvider } from '@/constants/mockProviders';
import type { Coordinate, LocatedProvider } from '@/domain/providerSearch';

export type ProviderMapProps = {
  center: Coordinate;
  providers: LocatedProvider<MockProvider>[];
  serviceId: BookableServiceId;
  onCoordinate: (providerId: string) => void;
  onViewProfile: (providerId: string) => void;
};
