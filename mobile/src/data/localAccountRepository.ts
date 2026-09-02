import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  normalizeAddress,
  normalizeAddressCollection,
  removeAddressFromCollection,
  saveAddressInCollection,
  setOnlyDefaultAddress,
  type Address,
} from '@/domain/address';
import {
  isCustomerProfileComplete,
  normalizeCustomerProfile,
  type CustomerProfile,
} from '@/domain/profile';
import {
  STORAGE_READ_TIMEOUT_MS,
  withStartupTimeout,
} from '@/startup/bootstrap';
import { isDevelopmentBundle, isDevelopmentEnvironment } from '@/config/environment';
import {
  syncDefaultAddress,
  syncDeleteAddress,
  syncProfile,
  syncSaveAddress,
} from '@/data/remoteWrites';
import type { RecoveryChannel } from '@/domain/accessRecovery';
import type { QaProfileId } from '@/domain/qaTools';

const STORAGE_KEY = 'hupi.localAccount.v2';
export const ONBOARDING_STORAGE_KEY = 'hupi.onboarding.completed';
const LEGACY_PROFILE_KEY = 'hupi.customerProfile';
const LEGACY_ADDRESSES_KEY = 'hupi.addresses';

/**
 * Persistencia MVP exclusivamente local mediante AsyncStorage.
 * No realiza llamadas al API ni al ERP. `AccountRepository` define el contrato
 * que podrá implementar un adaptador remoto sin cambiar las pantallas.
 */
export interface AccountRepository {
  initialize(): Promise<LocalAccountSnapshot>;
  getSnapshot(): LocalAccountSnapshot;
  subscribe(listener: () => void): () => void;
  saveProfile(profile: CustomerProfile): CustomerProfile;
  saveProfileDraft(profile: CustomerProfile): CustomerProfile;
  saveAddress(address: Address): Address[];
  deleteAddress(addressId: string): Address[];
  setDefaultAddress(addressId: string): Address[];
  completeOnboarding(): LocalAccountSnapshot;
  resetOnboarding(): LocalAccountSnapshot;
  resetStartupForDevelopment(): LocalAccountSnapshot;
}

export type LocalSession = {
  loggedIn: boolean;
  phoneVerified: boolean;
  pendingPhone: string;
  authMode: 'login' | 'register' | null;
  verificationChannel: RecoveryChannel;
};

export type LocalAccountSnapshot = {
  ready: boolean;
  onboardingCompleted: boolean;
  profileCompleted: boolean;
  session: LocalSession;
  profile: CustomerProfile;
  addresses: Address[];
};

export const DEFAULT_CUSTOMER_PROFILE: CustomerProfile = {
  id: 'user-001',
  firstName: 'Valentina',
  lastName: 'Paredes',
  email: 'valentina@hupi.ec',
  phone: '+593 99 123 4567',
  city: 'Quito',
  sector: 'La Carolina',
  avatar: 'VP',
  profilePhotoUri: undefined,
};

export const DEFAULT_ADDRESSES: Address[] = [
  normalizeAddress({
    id: 'addr-home',
    label: 'Casa',
    province: 'Pichincha',
    city: 'Quito',
    sector: 'La Carolina',
    address: 'Av. República, edificio Torre Norte',
    formattedAddress: 'Av. República, edificio Torre Norte, La Carolina, Quito',
    houseNumber: 'Departamento 802',
    reference: 'Frente al parque, recepción 24h',
    contactPhone: '+593 99 123 4567',
    latitude: -0.1839,
    longitude: -78.4848,
    placeId: 'local-addr-home',
    isDefault: true,
    source: 'legacy',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }),
  normalizeAddress({
    id: 'addr-work',
    label: 'Trabajo',
    province: 'Pichincha',
    city: 'Quito',
    sector: 'Iñaquito',
    address: 'Av. Amazonas y Naciones Unidas',
    formattedAddress: 'Av. Amazonas y Naciones Unidas, Iñaquito, Quito',
    houseNumber: 'Piso 6',
    reference: 'Edificio corporativo junto a cafetería',
    contactPhone: '+593 98 222 3344',
    latitude: -0.1807,
    longitude: -78.4796,
    placeId: 'local-addr-work',
    isDefault: false,
    source: 'legacy',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }),
];

let snapshot: LocalAccountSnapshot = {
  ready: false,
  onboardingCompleted: false,
  profileCompleted: false,
  session: {
    loggedIn: false,
    phoneVerified: false,
    pendingPhone: '',
    authMode: null,
    verificationChannel: 'sms',
  },
  profile: { ...DEFAULT_CUSTOMER_PROFILE },
  addresses: DEFAULT_ADDRESSES.map((address) => ({ ...address })),
};
let initializationPromise: Promise<LocalAccountSnapshot> | null = null;
let persistenceQueue = Promise.resolve();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persist() {
  const onboardingCompleted = snapshot.onboardingCompleted;
  const persisted = {
    profileCompleted: snapshot.profileCompleted,
    session: snapshot.session,
    profile: snapshot.profile,
    addresses: snapshot.addresses,
  };
  persistenceQueue = persistenceQueue
    .catch(() => undefined)
    .then(() => Promise.all([
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted)),
      AsyncStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        onboardingCompleted ? 'true' : 'false',
      ),
    ]).then(() => undefined))
    .catch((error) => {
      if (__DEV__) console.warn('[local-account] No se pudo persistir el estado local.', error);
    });
}

function replaceSnapshot(next: LocalAccountSnapshot, shouldPersist = true) {
  snapshot = next;
  emit();
  if (shouldPersist) persist();
  return snapshot;
}

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function initializeLocalAccountRepository() {
  if (initializationPromise) return initializationPromise;

  const storedValues = Promise.all([
    AsyncStorage.getItem(STORAGE_KEY),
    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY),
    AsyncStorage.getItem(LEGACY_PROFILE_KEY),
    AsyncStorage.getItem(LEGACY_ADDRESSES_KEY),
  ]);

  initializationPromise = withStartupTimeout(
    storedValues,
    STORAGE_READ_TIMEOUT_MS,
    'Local account hydration timed out.',
  ).then(([storedAccount, storedOnboarding, legacyProfile, legacyAddresses]) => {
    const account = parseJson<Partial<LocalAccountSnapshot>>(storedAccount);
    const oldProfile = parseJson<CustomerProfile>(legacyProfile);
    const oldAddresses = parseJson<Address[]>(legacyAddresses);
    const profile = normalizeCustomerProfile({
      ...DEFAULT_CUSTOMER_PROFILE,
      ...(oldProfile ?? account?.profile ?? {}),
    });
    const addressesInput = oldAddresses ?? account?.addresses ?? DEFAULT_ADDRESSES;
    const addresses = normalizeAddressCollection(addressesInput);
    const session = {
      loggedIn: Boolean(account?.session?.loggedIn),
      phoneVerified: Boolean(account?.session?.phoneVerified),
      pendingPhone: String(account?.session?.pendingPhone ?? ''),
      authMode: account?.session?.authMode === 'register'
        ? 'register' as const
        : account?.session?.authMode === 'login'
          ? 'login' as const
          : null,
      verificationChannel: account?.session?.verificationChannel === 'email'
        ? 'email' as const
        : 'sms' as const,
    };
    const onboardingCompleted = storedOnboarding === 'true'
      ? true
      : storedOnboarding === 'false'
        ? false
        // One-time compatibility with the field previously stored inside v2.
        : Boolean(account?.onboardingCompleted);

    return replaceSnapshot({
      ready: true,
      onboardingCompleted,
      profileCompleted: typeof account?.profileCompleted === 'boolean'
        ? account.profileCompleted
        : isCustomerProfileComplete(profile),
      session,
      profile,
      addresses,
    }, true);
  }).catch((error) => {
    if (__DEV__) console.warn('[local-account] No se pudo restaurar el estado local.', error);
    return replaceSnapshot({ ...snapshot, ready: true }, false);
  });

  return initializationPromise;
}

export function subscribeLocalAccount(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLocalAccountSnapshot() {
  return snapshot;
}

/**
 * El perfil y las direcciones del backend sustituyen a los locales. Sin esto
 * cualquier cuenta seguiría viendo el perfil de demostración que quedó
 * guardado en el dispositivo.
 */
export async function hydrateAccountFromBackend(remote: {
  profileCompleted: boolean;
  profile: CustomerProfile;
  addresses: Address[];
}) {
  // La restauración desde disco puede seguir en curso y pisaría estos datos.
  await initializeLocalAccountRepository().catch(() => undefined);

  return replaceSnapshot({
    ...snapshot,
    profileCompleted: remote.profileCompleted,
    profile: normalizeCustomerProfile(remote.profile),
    addresses: normalizeAddressCollection(remote.addresses),
  });
}

export function beginPhoneVerification(phone: string, authMode: 'login' | 'register') {
  const newAccount = authMode === 'register';
  const nextProfile = newAccount
    ? normalizeCustomerProfile({
      ...DEFAULT_CUSTOMER_PROFILE,
      firstName: '',
      lastName: '',
      email: '',
      phone,
      city: '',
      sector: '',
      avatar: '',
      profilePhotoUri: undefined,
    })
    : normalizeCustomerProfile({ ...snapshot.profile, phone: phone || snapshot.profile.phone });

  return replaceSnapshot({
    ...snapshot,
    profileCompleted: newAccount ? false : snapshot.profileCompleted,
    session: {
      loggedIn: true,
      phoneVerified: false,
      pendingPhone: phone.trim(),
      authMode,
      verificationChannel: 'sms',
    },
    profile: nextProfile,
  });
}

export function beginAccessRecovery(channel: RecoveryChannel, pendingPhone = '') {
  return replaceSnapshot({
    ...snapshot,
    session: {
      loggedIn: true,
      phoneVerified: false,
      pendingPhone: channel === 'sms' ? pendingPhone.trim() : '',
      authMode: 'login',
      verificationChannel: channel,
    },
  });
}

export function completePhoneVerification() {
  const phone = snapshot.session.pendingPhone || snapshot.profile.phone;
  return replaceSnapshot({
    ...snapshot,
    session: {
      ...snapshot.session,
      loggedIn: true,
      phoneVerified: true,
      pendingPhone: '',
      authMode: null,
      verificationChannel: 'sms',
    },
    profile: normalizeCustomerProfile({ ...snapshot.profile, phone }),
  });
}

export function setLocalLoggedIn(loggedIn: boolean) {
  if (!loggedIn) {
    // Sin esto la siguiente sesión rehidrataría la cuenta recién cerrada.
    void import('./authTokenStorage').then((module) => module.clearAuthToken());
  }

  return replaceSnapshot({
    ...snapshot,
    session: {
      loggedIn,
      phoneVerified: loggedIn ? snapshot.session.phoneVerified : false,
      pendingPhone: loggedIn ? snapshot.session.pendingPhone : '',
      authMode: loggedIn ? snapshot.session.authMode : null,
      verificationChannel: loggedIn ? snapshot.session.verificationChannel : 'sms',
    },
  });
}

export function completeLocalOnboarding() {
  return replaceSnapshot({ ...snapshot, onboardingCompleted: true });
}

export function completeLocalOnboardingForCurrentSession() {
  return replaceSnapshot({ ...snapshot, onboardingCompleted: true }, false);
}

export function resetLocalOnboarding() {
  return replaceSnapshot({ ...snapshot, onboardingCompleted: false });
}

/**
 * Applies a QA-only startup view without writing over the persisted account.
 * Profile data, pets and addresses remain available to the normal repositories.
 */
export function prepareLocalStartupForQaSession() {
  if (!isDevelopmentEnvironment()) return snapshot;

  return replaceSnapshot({
    ...snapshot,
    onboardingCompleted: false,
    profileCompleted: false,
    session: {
      loggedIn: false,
      phoneVerified: false,
      pendingPhone: '',
      authMode: null,
      verificationChannel: 'sms',
    },
  }, false);
}

/**
 * Development-only reset for startup QA. It is used by the manual QA action
 * only. Automatic QA bootstrap uses the non-persisting session preparation.
 * Language and appearance remain intact because they live in separate stores.
 */
export function resetLocalStartupForDevelopment() {
  if (!isDevelopmentEnvironment()) return snapshot;

  return replaceSnapshot({
    ...snapshot,
    onboardingCompleted: false,
    profileCompleted: false,
    session: {
      loggedIn: false,
      phoneVerified: false,
      pendingPhone: '',
      authMode: null,
      verificationChannel: 'sms',
    },
    profile: normalizeCustomerProfile({
      ...DEFAULT_CUSTOMER_PROFILE,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      city: '',
      sector: '',
      avatar: '',
      profilePhotoUri: undefined,
    }),
  });
}

export function applyLocalAccountQaProfile(profileId: QaProfileId) {
  if (!isDevelopmentBundle()) return snapshot;

  const isNewClient = profileId === 'new_client';
  const profile = isNewClient
    ? normalizeCustomerProfile({
      ...DEFAULT_CUSTOMER_PROFILE,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      city: '',
      sector: '',
      avatar: '',
      profilePhotoUri: undefined,
    })
    : normalizeCustomerProfile(DEFAULT_CUSTOMER_PROFILE);

  return replaceSnapshot({
    ...snapshot,
    onboardingCompleted: !isNewClient,
    profileCompleted: !isNewClient,
    session: {
      loggedIn: !isNewClient,
      phoneVerified: !isNewClient,
      pendingPhone: '',
      authMode: null,
      verificationChannel: 'sms',
    },
    profile,
  });
}

export function saveLocalCustomerProfile(profile: CustomerProfile) {
  const normalizedProfile = normalizeCustomerProfile(profile);
  syncProfile({
    firstName: normalizedProfile.firstName,
    lastName: normalizedProfile.lastName,
    email: normalizedProfile.email,
    phone: normalizedProfile.phone,
    city: normalizedProfile.city,
    sector: normalizedProfile.sector,
    profilePhotoUri: normalizedProfile.profilePhotoUri,
    isDraft: false,
  });
  return replaceSnapshot({
    ...snapshot,
    profile: normalizedProfile,
    profileCompleted: isCustomerProfileComplete(normalizedProfile),
  }).profile;
}

export function saveLocalProfileDraft(profile: CustomerProfile) {
  return replaceSnapshot({ ...snapshot, profile }).profile;
}

export function saveLocalAddress(address: Address) {
  const isKnown = snapshot.addresses.some((item) => item.id === address.id);
  const addresses = saveAddressInCollection(snapshot.addresses, address);
  replaceSnapshot({ ...snapshot, addresses });

  syncSaveAddress(
    {
      id: address.id,
      labelType: address.labelType,
      customLabel: address.customLabel,
      iconKey: address.iconKey,
      formattedAddress: address.formattedAddress,
      streetAddress: address.streetAddress,
      houseNumber: address.houseNumber,
      reference: address.reference,
      city: address.city,
      province: address.province,
      country: address.country,
      postalCode: address.postalCode,
      latitude: address.latitude,
      longitude: address.longitude,
      isDefault: address.isDefault,
      source: address.source,
    },
    isKnown,
  );

  return addresses.map((item) => ({ ...item }));
}

export function deleteLocalAddress(addressId: string) {
  const addresses = removeAddressFromCollection(snapshot.addresses, addressId);
  replaceSnapshot({ ...snapshot, addresses });
  syncDeleteAddress(addressId);
  return addresses.map((item) => ({ ...item }));
}

export function setDefaultLocalAddress(addressId: string) {
  const addresses = setOnlyDefaultAddress(snapshot.addresses, addressId);
  replaceSnapshot({ ...snapshot, addresses });
  syncDefaultAddress(addressId);
  return addresses.map((item) => ({ ...item }));
}

export const localAccountRepository: AccountRepository = {
  initialize: initializeLocalAccountRepository,
  getSnapshot: getLocalAccountSnapshot,
  subscribe: subscribeLocalAccount,
  saveProfile: saveLocalCustomerProfile,
  saveProfileDraft: saveLocalProfileDraft,
  saveAddress: saveLocalAddress,
  deleteAddress: deleteLocalAddress,
  setDefaultAddress: setDefaultLocalAddress,
  completeOnboarding: completeLocalOnboarding,
  resetOnboarding: resetLocalOnboarding,
  resetStartupForDevelopment: resetLocalStartupForDevelopment,
};
