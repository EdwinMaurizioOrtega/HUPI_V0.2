import AsyncStorage from '@react-native-async-storage/async-storage';

import { isRemoteBackendEnabled } from '@/config/environment';
import { mockProviders } from '@/constants/mockProviders';
import { fetchWalkProfile } from '@/data/hupiApi';
import {
  syncCreateWalkPlan,
  syncSubmitWalkPlan,
  syncSubmitWalkProfile,
  syncUpdateWalkPlan,
  syncWalkProfile,
} from '@/data/remoteWrites';
import {
  approveProviderPlanVersion,
  cloneProviderWalkProfile,
  getProviderCompletionChecklist,
  HUPI_STANDARD_WALK_TERMS,
  isValidProviderPlan,
  normalizeProviderDescription,
  type ProviderTermsAcceptance,
  type ProviderWalkPlan,
  type ProviderWalkProfile,
} from '@/domain/providerWalkProfile';

const DRAFTS_KEY = 'hupi.mockProviderWalkProfileDrafts.v1';
const ACCEPTANCES_KEY = 'hupi.mockProviderTermsAcceptances.v1';

/** El backend rechaza planes incompletos; solo se envían los que ya validan. */
function syncPlans(previous: ProviderWalkPlan[], next: ProviderWalkPlan[]) {
  next.forEach((plan) => {
    if (!isValidProviderPlan(plan)) return;

    const before = previous.find((item) => item.id === plan.id);
    if (before && JSON.stringify(before) === JSON.stringify(plan)) return;

    const body = {
      code: plan.id,
      name: plan.name,
      description: plan.description,
      planType: plan.type,
      durationMinutes: plan.durationMinutes,
      walkCount: plan.walkCount,
      petsIncluded: plan.petsIncluded,
      modality: plan.modality,
      price: plan.price,
      includes: plan.includes,
    };

    if (before) syncUpdateWalkPlan(plan.id, body);
    else syncCreateWalkPlan(body);

    if (plan.status === 'pending_approval' && before?.status !== 'pending_approval') {
      syncSubmitWalkPlan(plan.id);
    }
  });
}

let drafts: Record<string, ProviderWalkProfile> = {};
let acceptances: ProviderTermsAcceptance[] = [];
let initialized = false;
let initialization: Promise<void> | null = null;
const listeners = new Set<() => void>();

function normalizeStoredProfile(profile: ProviderWalkProfile) {
  const cloned = cloneProviderWalkProfile(profile) as ProviderWalkProfile & { cancellationPolicy?: unknown };
  const { cancellationPolicy: _legacyCancellationPolicy, ...profileWithoutLegacyPolicy } = cloned;
  const normalized = profileWithoutLegacyPolicy as ProviderWalkProfile;
  normalized.plans = normalized.plans.map((plan) => ({
    ...plan,
    modality: plan.modality === 'group' ? 'group' : 'individual',
    version: Math.max(1, plan.version ?? 1),
    updatedAt: plan.updatedAt ?? new Date().toISOString(),
  }));
  return normalized;
}

function emit() {
  listeners.forEach((listener) => listener());
}

function createDraft(providerId: string) {
  const published = mockProviders.find((provider) => provider.id === providerId)?.walkProfile ?? mockProviders[0].walkProfile;
  const draft = cloneProviderWalkProfile(published);
  draft.status = 'draft';
  return draft;
}

export function initializeMockProviderProfiles() {
  if (initialized) return Promise.resolve();
  if (initialization) return initialization;

  initialization = Promise.all([
    AsyncStorage.getItem(DRAFTS_KEY),
    AsyncStorage.getItem(ACCEPTANCES_KEY),
  ]).then(([storedDrafts, storedAcceptances]) => {
    if (storedDrafts) {
      const parsed = JSON.parse(storedDrafts) as Record<string, ProviderWalkProfile>;
      drafts = Object.fromEntries(Object.entries(parsed).map(([providerId, profile]) => [providerId, normalizeStoredProfile(profile)]));
    }
    if (storedAcceptances) acceptances = JSON.parse(storedAcceptances) as ProviderTermsAcceptance[];
  }).catch((error) => {
    if (__DEV__) console.warn('[mock-provider-profile] No se pudo cargar el estado local.', error);
  }).finally(() => {
    initialized = true;
    initialization = null;
    emit();
  });

  return initialization;
}

/**
 * La ficha publicada la decide el backend. El borrador local solo aporta lo
 * que el servidor todavía no guarda (certificaciones, manejo especial).
 */
export async function hydrateWalkProfileFromBackend(providerId: string) {
  if (!isRemoteBackendEnabled()) return;

  try {
    const remote = await fetchWalkProfile();
    if (!remote) return;

    await initializeMockProviderProfiles();
    const draft = getMockProviderProfileDraft(providerId);

    drafts = {
      ...drafts,
      [providerId]: normalizeStoredProfile({
        ...draft,
        description: remote.description,
        acceptedDogSizes: remote.acceptedDogSizes as ProviderWalkProfile['acceptedDogSizes'],
        acceptedDogAges: remote.acceptedDogAges as ProviderWalkProfile['acceptedDogAges'],
        maximumDogsPerWalk: remote.maximumDogsPerWalk,
        modalities: remote.modalities as ProviderWalkProfile['modalities'],
        walkTypes: remote.walkTypes as ProviderWalkProfile['walkTypes'],
        requirements: remote.requirements as ProviderWalkProfile['requirements'],
        status: remote.status as ProviderWalkProfile['status'],
      }),
    };
    emit();
  } catch {
    // Sin backend disponible se mantiene el borrador local.
  }
}

export function subscribeMockProviderProfiles(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getMockProviderProfileDraft(providerId: string) {
  return normalizeStoredProfile(drafts[providerId] ?? createDraft(providerId));
}

export function saveMockProviderProfileDraft(providerId: string, input: ProviderWalkProfile) {
  const previousPlans = drafts[providerId]?.plans ?? [];
  const normalized = normalizeStoredProfile(input);
  normalized.description = normalizeProviderDescription(input.description);
  normalized.acceptedDogAges = input.acceptedDogAges.filter((age) => age === 'puppy' || age === 'adult');
  normalized.plans = input.plans.map((plan) => ({
    ...plan,
    durationMinutes: Number.isFinite(plan.durationMinutes) ? plan.durationMinutes : 0,
    walkCount: Number.isFinite(plan.walkCount) ? plan.walkCount : 0,
    frequencyPerWeek: Number.isFinite(plan.frequencyPerWeek) ? plan.frequencyPerWeek : undefined,
    validityDays: Number.isFinite(plan.validityDays) ? plan.validityDays : undefined,
    petsIncluded: Number.isFinite(plan.petsIncluded) ? plan.petsIncluded : 0,
    price: Number.isFinite(plan.price) ? plan.price : 0,
    updatedAt: plan.updatedAt ?? new Date().toISOString(),
  }));
  normalized.status = input.status === 'pending_approval' ? 'pending_approval' : 'draft';
  drafts = { ...drafts, [providerId]: normalized };
  emit();

  syncWalkProfile({
    description: normalized.description,
    acceptedDogSizes: normalized.acceptedDogSizes,
    acceptedDogAges: normalized.acceptedDogAges,
    maximumDogsPerWalk: normalized.maximumDogsPerWalk,
    modalities: normalized.modalities,
    walkTypes: normalized.walkTypes,
    requirements: normalized.requirements,
  });
  syncPlans(previousPlans, normalized.plans);
  void AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts)).catch((error) => {
    if (__DEV__) console.warn('[mock-provider-profile] No se pudo guardar el borrador.', error);
  });
  return cloneProviderWalkProfile(normalized);
}

export function submitMockProviderPlanForReview(
  providerId: string,
  input: ProviderWalkProfile,
  planId: string,
) {
  const plan = input.plans.find((item) => item.id === planId);
  if (!plan || !isValidProviderPlan(plan) || (plan.status !== 'draft' && plan.status !== 'changes_requested')) {
    return undefined;
  }

  const submittedAt = new Date().toISOString();
  const next = cloneProviderWalkProfile(input);
  next.plans = next.plans.map((item) => item.id === planId
    ? { ...item, status: 'pending_approval' as const, updatedAt: submittedAt }
    : item);
  return saveMockProviderProfileDraft(providerId, next);
}

export function approveMockProviderPlanVersion(providerId: string, planId: string) {
  const draft = getMockProviderProfileDraft(providerId);
  draft.plans = approveProviderPlanVersion(draft.plans, planId);
  return saveMockProviderProfileDraft(providerId, draft);
}

export function touchProviderPlan(plan: ProviderWalkPlan) {
  return { ...plan, updatedAt: new Date().toISOString() } satisfies ProviderWalkPlan;
}

export function submitMockProviderProfileForReview(providerId: string, hourlyRate?: number, zone?: string) {
  const draft = getMockProviderProfileDraft(providerId);
  const completion = getProviderCompletionChecklist(draft, hourlyRate, zone);
  if (!completion.isComplete) return undefined;

  draft.status = 'pending_approval';
  draft.plans = draft.plans.map((plan) => (
    plan.status === 'draft' || plan.status === 'changes_requested'
      ? { ...plan, status: 'pending_approval' }
      : plan
  ));
  const saved = saveMockProviderProfileDraft(providerId, draft);
  syncSubmitWalkProfile();
  return saved;
}

export function recordMockProviderTermsAcceptance(input: Omit<ProviderTermsAcceptance, 'id' | 'acceptedAt'>) {
  if (input.termsId !== HUPI_STANDARD_WALK_TERMS.id) return undefined;
  const acceptedAt = new Date().toISOString();
  const acceptance: ProviderTermsAcceptance = {
    ...input,
    id: `terms-acceptance-${Date.now()}`,
    acceptedAt,
  };
  acceptances = [...acceptances, acceptance];
  void AsyncStorage.setItem(ACCEPTANCES_KEY, JSON.stringify(acceptances)).catch((error) => {
    if (__DEV__) console.warn('[mock-provider-profile] No se pudo guardar la aceptación.', error);
  });
  return { ...acceptance };
}

export function getMockProviderTermsAcceptances() {
  return acceptances.map((acceptance) => ({ ...acceptance }));
}
