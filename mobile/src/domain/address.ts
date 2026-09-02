export const ADDRESS_LABEL_TYPES = ['home', 'work', 'other'] as const;
export type AddressLabelType = (typeof ADDRESS_LABEL_TYPES)[number];

export const ADDRESS_ICON_KEYS = [
  'home',
  'briefcase',
  'heart',
  'people',
  'school',
  'fitness',
  'medical',
  'location',
] as const;
export type AddressIconKey = (typeof ADDRESS_ICON_KEYS)[number];

export type AddressSource = 'manual' | 'current_location' | 'map' | 'legacy';

export const LOCATION_TYPES = [
  'house',
  'apartment_building',
  'residential_complex',
  'office_or_store',
] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const MEETING_POINT_TYPES = [
  'house_exterior_door',
  'garage_or_patio',
  'building_entrance',
  'building_lobby',
  'security_desk',
  'apartment_door',
  'residential_gate',
  'house_entrance',
  'specific_point',
  'office_reception',
  'office_or_store_door',
  'meet_outside',
  'meet_at_pin',
  'other',
] as const;
export type MeetingPointType = (typeof MEETING_POINT_TYPES)[number];

export const HANDOFF_TYPES = ['hand_to_customer', 'leave_at_location'] as const;
export type HandoffType = (typeof HANDOFF_TYPES)[number];

export const ARRIVAL_CONTACT_PREFERENCES = [
  'chat',
  'call',
  'chat_and_call',
  'instructions_only',
] as const;
export type ArrivalContactPreference = (typeof ARRIVAL_CONTACT_PREFERENCES)[number];

export const ENTRANCE_TYPES = ['main_door', 'side_door', 'parking_access', 'other_access'] as const;
export type EntranceType = (typeof ENTRANCE_TYPES)[number];

export type AddressBuildingDetails = {
  buildingName?: string;
  towerOrBlock?: string;
  floor?: string;
  apartmentOrSuite?: string;
  doorbellName?: string;
  accessCode?: string;
  hasElevator?: boolean;
  entranceType?: EntranceType;
  receiverName?: string;
  scheduleOrRestrictions?: string;
};

export type AddressDeliveryPreferences = {
  locationType: LocationType;
  meetingPointType: MeetingPointType;
  handoffType: HandoffType;
  arrivalContactPreference: ArrivalContactPreference;
  buildingDetails?: AddressBuildingDetails;
  instructions?: string;
};

export const MEETING_POINTS_BY_LOCATION: Record<LocationType, readonly MeetingPointType[]> = {
  house: ['house_exterior_door', 'garage_or_patio', 'meet_outside', 'other'],
  apartment_building: ['building_entrance', 'building_lobby', 'security_desk', 'apartment_door', 'meet_outside', 'other'],
  residential_complex: ['residential_gate', 'house_entrance', 'apartment_door', 'specific_point', 'other'],
  office_or_store: ['office_reception', 'building_entrance', 'office_or_store_door', 'meet_outside', 'other'],
};

export type AddressAutocompleteResult = {
  id: string;
  formattedAddress: string;
  latitude?: number;
  longitude?: number;
};

// Contrato deliberadamente sin implementación: permitirá conectar autocomplete
// cuando exista un proveedor aprobado, sin fabricar sugerencias locales.
export interface AddressAutocompleteProvider {
  search(query: string): Promise<AddressAutocompleteResult[]>;
}

export type Address = {
  id: string;
  labelType: AddressLabelType;
  customLabel: string;
  iconKey: AddressIconKey;
  formattedAddress: string;
  streetAddress: string;
  houseNumber: string;
  reference: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  source: AddressSource;
  createdAt: string;
  updatedAt: string;
  deliveryPreferences: AddressDeliveryPreferences;

  // Compatibilidad transitoria con las pantallas que consumían el shape MVP anterior.
  label: string;
  address: string;
  sector: string;
  contactPhone: string;
  placeId?: string;
};

type LegacyAddress = Partial<Address> & {
  label?: string;
  address?: string;
};

export function createDefaultDeliveryPreferences(locationType: LocationType = 'house'): AddressDeliveryPreferences {
  return {
    locationType,
    meetingPointType: MEETING_POINTS_BY_LOCATION[locationType][0],
    handoffType: 'hand_to_customer',
    arrivalContactPreference: 'chat',
    buildingDetails: {},
    instructions: '',
  };
}

function inferLocationType(input: LegacyAddress): LocationType {
  const value = `${input.label ?? ''} ${input.houseNumber ?? ''} ${input.address ?? ''}`.toLocaleLowerCase();
  if (/departamento|edificio|piso|torre/.test(value)) return 'apartment_building';
  if (/oficina|local|trabajo/.test(value)) return 'office_or_store';
  if (/conjunto|urbanizaci[oó]n|residencial/.test(value)) return 'residential_complex';
  // Las direcciones históricas con tipo de lugar "other" conservan sus datos,
  // pero usan Casa como fallback neutro cuando el texto no permite inferir otro tipo.
  return 'house';
}

export function normalizeDeliveryPreferences(
  input: Partial<AddressDeliveryPreferences> | undefined,
  fallbackLocationType: LocationType = 'house',
): AddressDeliveryPreferences {
  const rawLocationType = input?.locationType as string | undefined;
  const locationType = LOCATION_TYPES.includes(rawLocationType as LocationType)
    ? rawLocationType as LocationType
    : fallbackLocationType;
  const availableMeetingPoints = MEETING_POINTS_BY_LOCATION[locationType];
  const rawMeetingPointType = input?.meetingPointType as string | undefined;
  const migratedMeetingPointType = rawMeetingPointType === 'block_entrance' || rawMeetingPointType === 'house_or_block_entrance'
    ? 'house_entrance'
    : rawMeetingPointType;
  const meetingPointType = availableMeetingPoints.includes(migratedMeetingPointType as MeetingPointType)
    ? migratedMeetingPointType as MeetingPointType
    : availableMeetingPoints[0];
  const migratedFromSafePlace = rawMeetingPointType === 'safe_place';

  return {
    locationType,
    meetingPointType,
    handoffType: !migratedFromSafePlace && HANDOFF_TYPES.includes(input?.handoffType as HandoffType)
      ? input?.handoffType as HandoffType
      : 'hand_to_customer',
    arrivalContactPreference: ARRIVAL_CONTACT_PREFERENCES.includes(input?.arrivalContactPreference as ArrivalContactPreference)
      ? input?.arrivalContactPreference as ArrivalContactPreference
      : 'chat',
    buildingDetails: {
      buildingName: input?.buildingDetails?.buildingName?.trim() || '',
      towerOrBlock: input?.buildingDetails?.towerOrBlock?.trim() || '',
      floor: input?.buildingDetails?.floor?.trim() || '',
      apartmentOrSuite: input?.buildingDetails?.apartmentOrSuite?.trim() || '',
      doorbellName: input?.buildingDetails?.doorbellName?.trim() || '',
      accessCode: input?.buildingDetails?.accessCode?.trim() || '',
      hasElevator: input?.buildingDetails?.hasElevator,
      entranceType: ENTRANCE_TYPES.includes(input?.buildingDetails?.entranceType as EntranceType)
        ? input?.buildingDetails?.entranceType
        : undefined,
      receiverName: input?.buildingDetails?.receiverName?.trim() || '',
      scheduleOrRestrictions: input?.buildingDetails?.scheduleOrRestrictions?.trim() || '',
    },
    instructions: input?.instructions?.trim() || '',
  };
}

export const DEFAULT_ADDRESS_COORDINATE = {
  latitude: -0.1807,
  longitude: -78.4678,
};

export function inferAddressLabelType(label?: string): AddressLabelType {
  const normalized = label?.trim().toLocaleLowerCase() ?? '';
  if (normalized === 'casa' || normalized === 'home') return 'home';
  if (normalized === 'trabajo' || normalized === 'work') return 'work';
  return 'other';
}

export function defaultIconForLabel(labelType: AddressLabelType): AddressIconKey {
  if (labelType === 'home') return 'home';
  if (labelType === 'work') return 'briefcase';
  return 'location';
}

export function getAddressTechnicalLabel(address: Pick<Address, 'labelType' | 'customLabel'>) {
  if (address.labelType === 'home') return 'Casa';
  if (address.labelType === 'work') return 'Trabajo';
  return address.customLabel.trim() || 'Otro';
}

export function createEmptyAddress(now = new Date().toISOString()): Address {
  return {
    id: '',
    labelType: 'home',
    customLabel: '',
    iconKey: 'home',
    formattedAddress: '',
    streetAddress: '',
    houseNumber: '',
    reference: '',
    city: '',
    province: '',
    country: 'Ecuador',
    postalCode: '',
    latitude: DEFAULT_ADDRESS_COORDINATE.latitude,
    longitude: DEFAULT_ADDRESS_COORDINATE.longitude,
    isDefault: false,
    source: 'manual',
    createdAt: now,
    updatedAt: now,
    deliveryPreferences: createDefaultDeliveryPreferences(),
    label: 'Casa',
    address: '',
    sector: '',
    contactPhone: '',
  };
}

export function normalizeAddress(input: LegacyAddress, now = new Date().toISOString()): Address {
  const labelType = ADDRESS_LABEL_TYPES.includes(input.labelType as AddressLabelType)
    ? input.labelType as AddressLabelType
    : inferAddressLabelType(input.label);
  const customLabel = labelType === 'other'
    ? (input.customLabel ?? (inferAddressLabelType(input.label) === 'other' ? input.label : '') ?? '').trim()
    : '';
  const formattedAddress = (input.formattedAddress || input.address || input.streetAddress || '').trim();
  const streetAddress = (input.streetAddress || input.address || input.formattedAddress || '').trim();
  const iconKey = ADDRESS_ICON_KEYS.includes(input.iconKey as AddressIconKey)
    ? input.iconKey as AddressIconKey
    : defaultIconForLabel(labelType);
  const deliveryPreferences = normalizeDeliveryPreferences(input.deliveryPreferences, inferLocationType(input));

  const normalized: Address = {
    id: input.id?.trim() || '',
    labelType,
    customLabel,
    iconKey,
    formattedAddress,
    streetAddress,
    houseNumber: input.houseNumber?.trim() || '',
    reference: input.reference?.trim() || '',
    city: input.city?.trim() || '',
    province: input.province?.trim() || '',
    country: input.country?.trim() || 'Ecuador',
    postalCode: input.postalCode?.trim() || '',
    latitude: typeof input.latitude === 'number' ? input.latitude : undefined,
    longitude: typeof input.longitude === 'number' ? input.longitude : undefined,
    isDefault: Boolean(input.isDefault),
    source: input.source ?? 'legacy',
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
    deliveryPreferences,
    label: '',
    address: streetAddress,
    sector: input.sector?.trim() || '',
    contactPhone: input.contactPhone?.trim() || '',
    placeId: input.placeId,
  };

  normalized.label = getAddressTechnicalLabel(normalized);
  return normalized;
}

export function validateAddress(address: Address) {
  return {
    label: address.labelType !== 'other' || Boolean(address.customLabel.trim()),
    streetAddress: Boolean((address.streetAddress || address.formattedAddress).trim()),
    houseNumber: Boolean(address.houseNumber.trim()),
    city: Boolean(address.city.trim()),
    province: Boolean(address.province.trim()),
    country: Boolean(address.country.trim()),
    coordinates: typeof address.latitude === 'number' && typeof address.longitude === 'number',
  };
}

export function isAddressValid(address: Address) {
  return Object.values(validateAddress(address)).every(Boolean);
}

export function saveAddressInCollection(addresses: Address[], address: Address, now = new Date().toISOString()) {
  const existing = addresses.find((item) => item.id === address.id);
  const normalized = normalizeAddress({
    ...address,
    id: address.id || `addr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: existing?.createdAt || address.createdAt || now,
    updatedAt: now,
    isDefault: address.isDefault || addresses.length === 0,
    source: address.source || 'manual',
  }, now);
  const next = existing
    ? addresses.map((item) => item.id === normalized.id ? normalized : item)
    : [...addresses, normalized];

  return normalized.isDefault
    ? next.map((item) => ({ ...item, isDefault: item.id === normalized.id }))
    : next;
}

export function setOnlyDefaultAddress(addresses: Address[], addressId: string, now = new Date().toISOString()) {
  return addresses.map((item) => ({
    ...item,
    isDefault: item.id === addressId,
    updatedAt: item.id === addressId ? now : item.updatedAt,
  }));
}

export function normalizeAddressCollection(inputs: Array<Partial<Address>>) {
  const normalized = inputs.map((item) => normalizeAddress(item));
  if (normalized.length === 0) return normalized;
  const firstDefault = normalized.find((item) => item.isDefault)?.id ?? normalized[0].id;
  return normalized.map((item) => ({ ...item, isDefault: item.id === firstDefault }));
}

export function removeAddressFromCollection(addresses: Address[], addressId: string) {
  const next = addresses.filter((item) => item.id !== addressId);
  if (next.length > 0 && !next.some((item) => item.isDefault)) {
    next[0] = { ...next[0], isDefault: true, updatedAt: new Date().toISOString() };
  }
  return next;
}
