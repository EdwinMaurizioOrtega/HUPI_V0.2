import AsyncStorage from '@react-native-async-storage/async-storage';

import { isDevelopmentBundle } from '@/config/environment';
import { applyLocalAccountQaProfile } from '@/data/localAccountRepository';
import { applyLocalProviderQaProfile, setLocalProviderQaStep } from '@/data/localProviderRepository';
import {
  getQaProfile,
  normalizeQaVerificationStep,
  type QaProfileId,
  type QaWalkApprovalState,
} from '@/domain/qaTools';

const STORAGE_KEY = 'hupi.qaProfile.v1';

export type LocalQaSnapshot = {
  ready: boolean;
  activeProfileId: QaProfileId;
  currentStep: number;
  walkStatus: QaWalkApprovalState;
};

let snapshot: LocalQaSnapshot = {
  ready: false,
  activeProfileId: 'active_client',
  currentStep: 1,
  walkStatus: 'not_applicable',
};
let initializationPromise: Promise<LocalQaSnapshot> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function replace(next: LocalQaSnapshot, persist = true) {
  snapshot = next;
  emit();
  if (persist && isDevelopmentBundle()) {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((error) => {
      if (__DEV__) console.warn('[qa-profile] No se pudo persistir el perfil QA.', error);
    });
  }
  return snapshot;
}

export function initializeLocalQaRepository() {
  if (initializationPromise) return initializationPromise;
  if (!isDevelopmentBundle()) {
    snapshot = { ...snapshot, ready: true };
    return Promise.resolve(snapshot);
  }

  initializationPromise = AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<LocalQaSnapshot>;
      const profile = getQaProfile(parsed.activeProfileId ?? 'active_client');
      snapshot = {
        ready: true,
        activeProfileId: profile.id,
        currentStep: normalizeQaVerificationStep(parsed.currentStep ?? profile.currentStep),
        walkStatus: profile.walkStatus,
      };
    } else {
      snapshot = { ...snapshot, ready: true };
    }
    emit();
    return snapshot;
  }).catch((error) => {
    if (__DEV__) console.warn('[qa-profile] No se pudo restaurar el perfil QA.', error);
    snapshot = { ...snapshot, ready: true };
    emit();
    return snapshot;
  });
  return initializationPromise;
}

export function getLocalQaSnapshot() {
  return snapshot;
}

export function subscribeLocalQa(listener: () => void) {
  listeners.add(listener);
  void initializeLocalQaRepository();
  return () => listeners.delete(listener);
}

export function applyQaProfile(profileId: QaProfileId) {
  if (!isDevelopmentBundle()) return snapshot;
  const profile = getQaProfile(profileId);
  applyLocalAccountQaProfile(profile.id);
  applyLocalProviderQaProfile(profile.id);
  return replace({
    ready: true,
    activeProfileId: profile.id,
    currentStep: profile.currentStep,
    walkStatus: profile.walkStatus,
  });
}

export function setQaVerificationStep(step: number) {
  if (!isDevelopmentBundle()) return snapshot;
  const currentStep = normalizeQaVerificationStep(step);
  setLocalProviderQaStep(currentStep);
  return replace({ ...snapshot, ready: true, currentStep });
}

export function resetQaProviderVerification() {
  return applyQaProfile('new_provider');
}
