import type { BookableServiceId, ServiceId } from './services';

export const mvpFeatures = {
  walks: true,
  marketplace: true,
  nanny: false,
  boarding: false,
  daycare: false,
  grooming: false,
  training: false,
} as const;

export type MvpFeatureKey = keyof typeof mvpFeatures;

const serviceFeatureMap: Record<ServiceId, MvpFeatureKey> = {
  walk: 'walks',
  sitter: 'nanny',
  boarding: 'boarding',
  daycare: 'daycare',
  grooming: 'grooming',
  training: 'training',
  marketplace: 'marketplace',
};

export function getServiceFeatureKey(serviceId: ServiceId): MvpFeatureKey {
  return serviceFeatureMap[serviceId];
}

export function isServiceEnabled(serviceId?: ServiceId) {
  return serviceId ? mvpFeatures[getServiceFeatureKey(serviceId)] : false;
}

export function isBookableServiceEnabled(serviceId?: BookableServiceId) {
  return serviceId ? isServiceEnabled(serviceId) : false;
}

export function filterEnabledServices<T extends { id: ServiceId }>(items: readonly T[]) {
  return items.filter((item) => isServiceEnabled(item.id));
}

