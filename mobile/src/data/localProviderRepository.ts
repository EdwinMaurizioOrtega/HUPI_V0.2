import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_CUSTOMER_PROFILE, getLocalAccountSnapshot } from '@/data/localAccountRepository';
import {
  canSubmitProviderVerification,
  createEmptyProviderVerificationDraft,
  createProviderEnrollment,
  getMissingProviderSections,
  getProviderVerificationSections,
  type LocalProviderEnrollment,
  type ProviderEntityType,
  type ProviderVerificationDraft,
  type ProviderVerificationSectionKey,
} from '@/domain/providerVerification';
import {
  syncProviderEmailValidated,
  syncProviderEnrollment,
  syncProviderSection,
  syncProviderSubmit,
} from '@/data/remoteWrites';
import { fetchProviderEnrollment } from '@/data/hupiApi';
import { getQaProfile, getQaVerificationSection, type QaProfileId } from '@/domain/qaTools';
import { isDevelopmentBundle } from '@/config/environment';

const STORAGE_KEY = 'hupi.localProvider.v1';
const listeners = new Set<() => void>();
let initialized = false;
let initializationPromise: Promise<LocalProviderEnrollment> | null = null;
let persistenceQueue = Promise.resolve();

const approvedDraft: ProviderVerificationDraft = {
  ...createEmptyProviderVerificationDraft(),
  website: 'https://hupi.pet/andres-luna',
  identity: { nationalId: '1712345678', birthDate: '1992-05-18', nationality: 'Ecuatoriana', selfieUri: 'mock://selfie', idFrontUri: 'mock://cedula-frente', idBackUri: 'mock://cedula-reverso' },
  address: { address: 'Av. República', city: 'Quito', sector: 'La Carolina', houseNumber: '802', locationType: 'building', buildingName: 'Torre Norte', unitNumber: 'Departamento 802' },
  contact: { firstName: 'Andrés', lastName: 'Luna', role: 'Contacto operativo', phone: '+593 99 123 4567', email: 'andres@hupi.ec' },
  bank: { bank: 'Banco Pichincha', accountType: 'Ahorros', accountNumber: '2200456789', accountHolder: 'Andrés Luna', holderTaxId: '1712345678' },
  generalInformation: 'Proveedor de paseos con experiencia y cobertura en Quito.',
};

let snapshot: LocalProviderEnrollment = {
  ...createProviderEnrollment(DEFAULT_CUSTOMER_PROFILE.id, 'natural'),
  status: 'not_started',
};

function emit() { listeners.forEach((listener) => listener()); }
function persist() {
  const serialized = JSON.stringify(snapshot);
  persistenceQueue = persistenceQueue
    .catch(() => undefined)
    .then(() => AsyncStorage.setItem(STORAGE_KEY, serialized))
    .catch((error) => {
      if (__DEV__) console.warn('[local-provider] No se pudo persistir el proveedor.', error);
    });
}
function replace(next: LocalProviderEnrollment, shouldPersist = true) {
  snapshot = next;
  emit();
  if (shouldPersist) persist();
  return snapshot;
}

export function initializeLocalProviderRepository() {
  if (initializationPromise) return initializationPromise;
  initializationPromise = AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LocalProviderEnrollment;
        if (parsed?.accountId && parsed?.draft && (parsed.entityType === 'natural' || parsed.entityType === 'legal')) {
          snapshot = parsed;
        }
      } catch {
        // Keep the safe local approved provider demo.
      }
    }
    initialized = true;
    emit();
    return snapshot;
  }).catch(() => {
    initialized = true;
    return snapshot;
  });
  return initializationPromise;
}

/**
 * Trae el estado del enrolamiento desde el backend.
 *
 * Sin esto, iniciar sesión como proveedor en un dispositivo nuevo no daría
 * acceso al modo proveedor: el gating leería un AsyncStorage vacío.
 * El borrador sigue siendo local; el backend manda en estado y aprobación.
 */
export async function hydrateProviderFromBackend(): Promise<LocalProviderEnrollment> {
  const remote = await fetchProviderEnrollment();
  if (!remote) return snapshot;

  return replace({
    ...snapshot,
    entityType: remote.entityType,
    status: remote.status as LocalProviderEnrollment['status'],
    emailValidated: remote.emailValidated,
    lastPendingSection:
      (remote.lastPendingSection as ProviderVerificationSectionKey | null)
      ?? snapshot.lastPendingSection,
    submittedAt: remote.submittedAt ?? snapshot.submittedAt,
    updatedAt: new Date().toISOString(),
  });
}

export function getLocalProviderSnapshot() { return snapshot; }
export function subscribeLocalProvider(listener: () => void) {
  listeners.add(listener);
  if (!initialized) void initializeLocalProviderRepository();
  return () => listeners.delete(listener);
}

export function beginProviderEnrollment(entityType: ProviderEntityType) {
  const account = getLocalAccountSnapshot();
  const draft = createEmptyProviderVerificationDraft();
  const defaultAddress = account.addresses.find((address) => address.isDefault) ?? account.addresses[0];
  if (defaultAddress) {
    draft.address = {
      address: defaultAddress.address,
      city: defaultAddress.city,
      sector: defaultAddress.sector,
      houseNumber: defaultAddress.houseNumber,
      locationType: /edificio|departamento|oficina/i.test(`${defaultAddress.address} ${defaultAddress.houseNumber}`) ? 'building' : 'house',
      buildingName: '',
      unitNumber: defaultAddress.houseNumber,
    };
  }
  if (entityType === 'legal') {
    draft.legalRepresentative = {
      ...draft.legalRepresentative,
      firstName: account.profile.firstName,
      lastName: account.profile.lastName,
      phone: account.profile.phone,
      email: account.profile.email,
    };
  }
  syncProviderEnrollment(entityType);
  return replace(createProviderEnrollment(account.profile.id, entityType, draft));
}

export function activateApprovedLocalProviderDemo() {
  const account = getLocalAccountSnapshot();
  return replace({
    ...createProviderEnrollment(account.profile.id, 'natural', approvedDraft),
    emailValidated: true,
    status: 'approved',
    lastPendingSection: 'general',
  });
}

function createIncompleteQaDraft(): ProviderVerificationDraft {
  return {
    ...createEmptyProviderVerificationDraft(),
    website: approvedDraft.website,
    identity: { ...approvedDraft.identity },
    address: {
      ...createEmptyProviderVerificationDraft().address,
      address: 'Av. República',
      city: 'Quito',
      sector: 'La Carolina',
    },
  };
}

export function applyLocalProviderQaProfile(profileId: QaProfileId) {
  if (!isDevelopmentBundle()) return snapshot;

  const account = getLocalAccountSnapshot();
  const profile = getQaProfile(profileId);
  if (profile.providerState === 'none') {
    return replace({
      ...createProviderEnrollment(account.profile.id, 'natural'),
      status: 'not_started',
    });
  }

  if (profile.providerState === 'approved') {
    return replace({
      ...createProviderEnrollment(account.profile.id, 'natural', approvedDraft),
      emailValidated: true,
      status: 'approved',
      lastPendingSection: 'general',
    });
  }

  const draft = profileId === 'new_provider'
    ? createEmptyProviderVerificationDraft()
    : createIncompleteQaDraft();
  return replace({
    ...createProviderEnrollment(account.profile.id, 'natural', draft),
    emailValidated: true,
    status: 'in_progress',
    lastPendingSection: getQaVerificationSection(profile.currentStep) ?? 'general',
  });
}

export function setLocalProviderQaStep(step: number) {
  if (!isDevelopmentBundle()) return snapshot;
  const section = getQaVerificationSection(step) ?? 'general';
  if (snapshot.status === 'not_started') {
    const account = getLocalAccountSnapshot();
    return replace({
      ...createProviderEnrollment(account.profile.id, 'natural'),
      emailValidated: true,
      status: 'in_progress',
      lastPendingSection: section,
    });
  }
  return replace({ ...snapshot, lastPendingSection: section, updatedAt: new Date().toISOString() });
}

export function updateLocalProviderEnrollment(next: Partial<LocalProviderEnrollment>) {
  return replace({ ...snapshot, ...next, updatedAt: new Date().toISOString() });
}

export function updateLocalProviderDraft(next: Partial<ProviderVerificationDraft>, pendingSection?: ProviderVerificationSectionKey) {
  const result = replace({
    ...snapshot,
    status: snapshot.status === 'not_started' ? 'in_progress' : snapshot.status,
    draft: { ...snapshot.draft, ...next },
    lastPendingSection: pendingSection ?? snapshot.lastPendingSection,
    updatedAt: new Date().toISOString(),
  });

  if (pendingSection) {
    const account = getLocalAccountSnapshot();
    const sections = getProviderVerificationSections(
      snapshot,
      account.profile,
      account.session.phoneVerified,
    );
    const complete = sections.find((item) => item.key === pendingSection)?.complete ?? false;
    syncProviderSection(pendingSection, complete);
  }

  return result;
}

export function validateLocalProviderEmail() {
  syncProviderEmailValidated();
  return replace({ ...snapshot, emailValidated: true, updatedAt: new Date().toISOString() });
}

export function submitLocalProviderVerification() {
  const account = getLocalAccountSnapshot();
  if (!canSubmitProviderVerification(snapshot, account.profile, account.session.phoneVerified)) {
    const firstMissing = getMissingProviderSections(snapshot, account.profile, account.session.phoneVerified)[0];
    if (firstMissing) replace({ ...snapshot, lastPendingSection: firstMissing });
    return null;
  }
  syncProviderSubmit();
  return replace({
    ...snapshot,
    status: 'under_review',
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
