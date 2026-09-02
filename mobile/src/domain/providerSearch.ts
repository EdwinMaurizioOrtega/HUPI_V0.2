export type Coordinate = {
  latitude: number;
  longitude: number;
};

export const DEFAULT_PROVIDER_SEARCH_RADIUS_KM = 8;

export const PROVIDER_FILTER_IDS = ['best-rated', 'closest', 'verified'] as const;
export type ProviderFilterId = (typeof PROVIDER_FILTER_IDS)[number];

export type LocatedProvider<T> = {
  provider: T;
  distanceKm: number;
};

type SearchableProvider = Coordinate & {
  isVerifiedByHupi: boolean;
  rating: number;
};

const EARTH_RADIUS_KM = 6_371;

function toRadians(value: number) {
  return value * (Math.PI / 180);
}

export function calculateHaversineDistanceKm(from: Coordinate, to: Coordinate) {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function formatDistanceKm(distanceKm: number, locale = 'es-EC') {
  return `${distanceKm.toLocaleString(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  })} km`;
}

export function deriveProviderSearchResults<T extends SearchableProvider>(
  providers: readonly T[],
  center: Coordinate,
  filter: ProviderFilterId,
  radiusKm = DEFAULT_PROVIDER_SEARCH_RADIUS_KM,
) {
  const located = providers
    .map((provider) => ({
      provider,
      distanceKm: calculateHaversineDistanceKm(center, provider),
    }))
    .filter((item) => item.distanceKm <= radiusKm);

  const filtered = filter === 'verified'
    ? located.filter((item) => item.provider.isVerifiedByHupi)
    : located;

  return [...filtered].sort((left, right) => {
    if (filter === 'closest') return left.distanceKm - right.distanceKm;
    if (filter === 'verified') {
      return right.provider.rating - left.provider.rating || left.distanceKm - right.distanceKm;
    }
    return right.provider.rating - left.provider.rating || left.distanceKm - right.distanceKm;
  });
}
