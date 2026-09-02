import {
  normalizeAddress,
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

import { apiRequest } from './apiClient';
import { clearAuthToken, saveAuthToken } from './authTokenStorage';
import {
  DEFAULT_CUSTOMER_PROFILE,
  type AccountRepository,
  type LocalAccountSnapshot,
} from './localAccountRepository';

type RemoteAddress = {
  id: string;
  labelType: Address['labelType'];
  customLabel?: string | null;
  iconKey: string;
  formattedAddress: string;
  streetAddress: string;
  houseNumber?: string | null;
  reference?: string | null;
  city: string;
  province: string;
  country: string;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  source: Address['source'];
};

type RemoteSnapshot = {
  ready: boolean;
  onboardingCompleted: boolean;
  profileCompleted: boolean;
  session: {
    loggedIn: boolean;
    phoneVerified: boolean;
    pendingPhone: string;
    verificationChannel: 'sms' | 'email';
  };
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city?: string | null;
    sector?: string | null;
    avatar: string;
    profilePhotoUri?: string | null;
  };
  addresses: RemoteAddress[];
};

const EMPTY_SNAPSHOT: LocalAccountSnapshot = {
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
  profile: { ...DEFAULT_CUSTOMER_PROFILE, id: '', firstName: '', lastName: '', email: '' },
  addresses: [],
};

let snapshot: LocalAccountSnapshot = EMPTY_SNAPSHOT;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function setSnapshot(next: LocalAccountSnapshot) {
  snapshot = next;
  emit();
}

function toAddress(remote: RemoteAddress): Address {
  return normalizeAddress({
    id: remote.id,
    labelType: remote.labelType,
    customLabel: remote.customLabel ?? undefined,
    iconKey: remote.iconKey as Address['iconKey'],
    formattedAddress: remote.formattedAddress,
    streetAddress: remote.streetAddress,
    houseNumber: remote.houseNumber ?? undefined,
    reference: remote.reference ?? undefined,
    city: remote.city,
    province: remote.province,
    country: remote.country,
    postalCode: remote.postalCode ?? undefined,
    latitude: remote.latitude ?? undefined,
    longitude: remote.longitude ?? undefined,
    isDefault: remote.isDefault,
    source: remote.source,
  });
}

function fromRemote(remote: RemoteSnapshot): LocalAccountSnapshot {
  return {
    ready: true,
    onboardingCompleted: remote.onboardingCompleted,
    profileCompleted: remote.profileCompleted,
    session: {
      loggedIn: remote.session.loggedIn,
      phoneVerified: remote.session.phoneVerified,
      pendingPhone: remote.session.pendingPhone,
      authMode: null,
      verificationChannel: remote.session.verificationChannel,
    },
    profile: normalizeCustomerProfile({
      id: remote.profile.id,
      firstName: remote.profile.firstName,
      lastName: remote.profile.lastName,
      email: remote.profile.email,
      phone: remote.profile.phone,
      city: remote.profile.city ?? '',
      sector: remote.profile.sector ?? '',
      avatar: remote.profile.avatar,
      profilePhotoUri: remote.profile.profilePhotoUri ?? undefined,
    }),
    addresses: remote.addresses.map(toAddress),
  };
}

/** Las escrituras son optimistas: la UI no espera a la red y luego reconcilia. */
function sync(request: Promise<RemoteSnapshot>) {
  request
    .then((remote) => setSnapshot(fromRemote(remote)))
    .catch(() => {
      // Se conserva el estado optimista; la próxima lectura reconcilia.
    });
}

export const httpAccountRepository: AccountRepository = {
  async initialize() {
    try {
      const remote = await apiRequest<RemoteSnapshot>('/account');
      setSnapshot(fromRemote(remote));
    } catch {
      setSnapshot({ ...EMPTY_SNAPSHOT, ready: true });
    }
    return snapshot;
  },

  getSnapshot() {
    return snapshot;
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  saveProfile(profile: CustomerProfile) {
    const normalized = normalizeCustomerProfile(profile);
    setSnapshot({
      ...snapshot,
      profile: normalized,
      profileCompleted: isCustomerProfileComplete(normalized),
    });

    sync(
      apiRequest<RemoteSnapshot>('/account/profile', {
        method: 'PUT',
        body: {
          firstName: normalized.firstName,
          lastName: normalized.lastName,
          email: normalized.email,
          phone: normalized.phone,
          city: normalized.city,
          sector: normalized.sector,
          profilePhotoUri: normalized.profilePhotoUri,
          isDraft: false,
        },
      }),
    );

    return normalized;
  },

  saveProfileDraft(profile: CustomerProfile) {
    setSnapshot({ ...snapshot, profile });

    sync(
      apiRequest<RemoteSnapshot>('/account/profile', {
        method: 'PUT',
        body: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phone: profile.phone,
          city: profile.city,
          sector: profile.sector,
          profilePhotoUri: profile.profilePhotoUri,
          isDraft: true,
        },
      }),
    );

    return profile;
  },

  saveAddress(address: Address) {
    const addresses = saveAddressInCollection(snapshot.addresses, address);
    setSnapshot({ ...snapshot, addresses });

    const isKnown = snapshot.addresses.some((item) => item.id === address.id);
    const body = {
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
    };

    sync(
      isKnown
        ? apiRequest<RemoteSnapshot>(`/addresses/${address.id}`, { method: 'PUT', body })
        : apiRequest<RemoteSnapshot>('/addresses', { method: 'POST', body }),
    );

    return addresses;
  },

  deleteAddress(addressId: string) {
    const addresses = removeAddressFromCollection(snapshot.addresses, addressId);
    setSnapshot({ ...snapshot, addresses });

    sync(apiRequest<RemoteSnapshot>(`/addresses/${addressId}`, { method: 'DELETE' }));
    return addresses;
  },

  setDefaultAddress(addressId: string) {
    const addresses = setOnlyDefaultAddress(snapshot.addresses, addressId);
    setSnapshot({ ...snapshot, addresses });

    sync(apiRequest<RemoteSnapshot>(`/addresses/${addressId}/default`, { method: 'POST' }));
    return addresses;
  },

  completeOnboarding() {
    setSnapshot({ ...snapshot, onboardingCompleted: true });
    sync(apiRequest<RemoteSnapshot>('/account/onboarding/complete', { method: 'POST' }));
    return snapshot;
  },

  resetOnboarding() {
    setSnapshot({ ...snapshot, onboardingCompleted: false });
    return snapshot;
  },

  resetStartupForDevelopment() {
    void clearAuthToken();
    setSnapshot({ ...EMPTY_SNAPSHOT, ready: true });
    return snapshot;
  },
};

// --- Autenticación --------------------------------------------------------

export type PendingVerification = {
  pendingPhone: string;
  maskedPhone: string;
  verificationChannel: 'sms' | 'email';
  authMode: 'login' | 'register';
};

export async function requestRemoteRegistration(
  phone: string,
  consent: boolean,
): Promise<PendingVerification> {
  return apiRequest<PendingVerification>('/auth/register', {
    method: 'POST',
    authenticated: false,
    body: { phone, consent },
  });
}

export async function requestRemoteLogin(phone: string): Promise<PendingVerification> {
  return apiRequest<PendingVerification>('/auth/login', {
    method: 'POST',
    authenticated: false,
    body: { phone },
  });
}

export async function resendRemoteOtp(phone: string): Promise<PendingVerification> {
  return apiRequest<PendingVerification>('/auth/resend-otp', {
    method: 'POST',
    authenticated: false,
    body: { phone },
  });
}

export async function confirmRemotePhoneVerification(
  phone: string,
  code: string,
): Promise<LocalAccountSnapshot> {
  const result = await apiRequest<{ token: string; snapshot: RemoteSnapshot }>(
    '/auth/verify-otp',
    { method: 'POST', authenticated: false, body: { phone, code } },
  );

  await saveAuthToken(result.token);
  setSnapshot(fromRemote(result.snapshot));
  return snapshot;
}

/** Cuenta autenticada, para rehidratar tras reabrir la app. */
export async function fetchRemoteAccountSnapshot(): Promise<LocalAccountSnapshot> {
  return fromRemote(await apiRequest<RemoteSnapshot>('/account'));
}

export async function requestRemoteAccessRecovery(
  channel: 'sms' | 'email',
  target: string,
): Promise<{ message: string; maskedTarget: string }> {
  return apiRequest('/auth/recovery', {
    method: 'POST',
    authenticated: false,
    body: channel === 'email' ? { channel, email: target } : { channel, phone: target },
  });
}

export async function endRemoteSession(): Promise<void> {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } finally {
    await clearAuthToken();
    setSnapshot({ ...EMPTY_SNAPSHOT, ready: true });
  }
}
