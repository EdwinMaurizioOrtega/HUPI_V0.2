export const DOG_SIZE_OPTIONS = ['small', 'medium', 'large', 'giant'] as const;
export type DogSize = (typeof DOG_SIZE_OPTIONS)[number];

export const DOG_AGE_OPTIONS = ['puppy', 'adult'] as const;
export type DogAge = (typeof DOG_AGE_OPTIONS)[number];

export const WALK_MODALITY_OPTIONS = ['individual', 'group'] as const;
export type WalkModality = (typeof WALK_MODALITY_OPTIONS)[number];

export const WALK_TYPE_OPTIONS = ['calm', 'active', 'urban', 'park'] as const;
export type WalkType = (typeof WALK_TYPE_OPTIONS)[number];

export const SPECIAL_HANDLING_OPTIONS = [
  'nervous_dogs',
  'reactive_dogs',
  'reduced_mobility',
  'medication',
  'prior_evaluation',
  'no_aggressive_dogs',
] as const;
export type SpecialHandling = (typeof SPECIAL_HANDLING_OPTIONS)[number];

export const SERVICE_REQUIREMENT_OPTIONS = [
  'vaccines_current',
  'secure_harness_or_collar',
  'identification_tag',
  'report_medical_conditions',
  'report_behavior_issues',
  'prior_evaluation',
  'vaccination_record',
  'no_females_in_heat',
] as const;
export type ServiceRequirement = (typeof SERVICE_REQUIREMENT_OPTIONS)[number];

export type ApprovalStatus =
  | 'draft'
  | 'pending_approval'
  | 'changes_requested'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'archived'
  | 'superseded';

export type ProviderCertification = {
  id: string;
  name: string;
  institution: string;
  year: number | null;
  status: ApprovalStatus;
};

export type ProviderWalkPlan = {
  id: string;
  version?: number;
  versionRootId?: string;
  replacesPlanId?: string;
  name: string;
  description: string;
  type: 'individual' | 'recurring';
  durationMinutes: number;
  walkCount: number;
  frequencyPerWeek?: number;
  frequencyType: 'required' | 'recommended' | 'customer_configurable';
  validityDays?: number;
  petsIncluded: number;
  modality: WalkModality;
  price: number;
  includes: string[];
  specificConditions: string[];
  isAvailable: boolean;
  availableFrom?: string;
  availableUntil?: string;
  status: ApprovalStatus;
  updatedAt?: string;
  reviewNotes?: string;
};

export type ProviderTermsFields = {
  freeRescheduleHours: number;
  lateRescheduleWindowHours: number;
  lateReschedulePenaltyPercent: number;
  minimumCancellationHours: number;
  lateCancellationPenaltyPercent: number;
  maximumWaitingMinutes: number;
  maximumDelayMinutes: number;
  rainTreatment: 'reschedule' | 'hupi_balance' | 'continue_with_authorization';
  maximumContactAttempts: number;
  planValidityDays: number;
  walkRecoveryConditions: string;
  specificServiceConditions: string;
  operationalContactInstructions: string;
};

export type ProviderTermsVersion = {
  id: string;
  version: number;
  effectiveDate: string;
  status: ApprovalStatus;
  fields: ProviderTermsFields;
};

export type ProviderWalkProfile = {
  description: string;
  acceptedDogSizes: DogSize[];
  acceptedDogAges: DogAge[];
  maximumDogsPerWalk: number;
  modalities: WalkModality[];
  walkTypes: WalkType[];
  specialHandling: SpecialHandling[];
  requirements: ServiceRequirement[];
  certifications: ProviderCertification[];
  plans: ProviderWalkPlan[];
  terms: ProviderTermsVersion;
  status: ApprovalStatus;
};

export type ProviderTermsAcceptance = {
  id: string;
  termsId: string;
  termsVersion: number;
  effectiveDate: string;
  providerId: string;
  providerName: string;
  clientId: string;
  serviceOrPlanId: string;
  acceptedAt: string;
};

export const HUPI_STANDARD_WALK_TERMS = {
  id: 'hupi-standard-walk-terms-v1',
  version: 1,
  effectiveDate: '2026-08-05',
} as const;

export const MAX_PROVIDER_DESCRIPTION_LENGTH = 150;
export const MAX_DOGS_PER_WALK = 8;

export function normalizeProviderDescription(value: string) {
  return value.trim().replace(/\s+/g, ' ').slice(0, MAX_PROVIDER_DESCRIPTION_LENGTH);
}

export function isValidCertification(certificate: ProviderCertification, currentYear = new Date().getFullYear()) {
  return Boolean(
    certificate.name.trim()
    && certificate.institution.trim()
    && certificate.year
    && certificate.year >= 1900
    && certificate.year <= currentYear,
  );
}

export function isValidProviderPlan(plan: ProviderWalkPlan) {
  const recurringFieldsAreCoherent = plan.type !== 'recurring' || Boolean(
    Number.isInteger(plan.frequencyPerWeek)
    && (plan.frequencyPerWeek ?? 0) > 0
    && Number.isInteger(plan.validityDays)
    && (plan.validityDays ?? 0) > 0,
  );

  return Boolean(
    plan.name.trim()
    && plan.description.trim()
    && Number.isInteger(plan.durationMinutes)
    && plan.durationMinutes > 0
    && Number.isInteger(plan.walkCount)
    && plan.walkCount > 0
    && Number.isInteger(plan.petsIncluded)
    && plan.petsIncluded > 0
    && WALK_MODALITY_OPTIONS.includes(plan.modality)
    && Number.isFinite(plan.price)
    && plan.price > 0
    && plan.includes.length > 0
    && recurringFieldsAreCoherent,
  );
}

function parsePlanBoundary(value: string | undefined, endOfDay = false) {
  if (!value) return undefined;
  const time = Date.parse(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
  return Number.isFinite(time) ? time : undefined;
}

export function isPublicProviderWalkPlan(plan: ProviderWalkPlan, currentDate = new Date()) {
  const currentTime = currentDate.getTime();
  const availableFrom = parsePlanBoundary(plan.availableFrom);
  const availableUntil = parsePlanBoundary(plan.availableUntil, true);

  return plan.status === 'approved'
    && plan.isAvailable
    && isValidProviderPlan(plan)
    && (!plan.availableFrom || availableFrom !== undefined)
    && (!plan.availableUntil || availableUntil !== undefined)
    && (availableFrom === undefined || availableFrom <= currentTime)
    && (availableUntil === undefined || availableUntil >= currentTime);
}

export function createProviderPlanDraftVersion(plan: ProviderWalkPlan, now = new Date()) {
  const timestamp = now.toISOString();
  const versionRootId = plan.versionRootId ?? plan.id;
  const version = Math.max(1, plan.version ?? 1) + 1;

  return {
    ...plan,
    id: `${versionRootId}-v${version}-${now.getTime()}`,
    version,
    versionRootId,
    replacesPlanId: plan.id,
    status: 'draft',
    updatedAt: timestamp,
    reviewNotes: undefined,
  } satisfies ProviderWalkPlan;
}

export function approveProviderPlanVersion(plans: ProviderWalkPlan[], planId: string, now = new Date()) {
  const target = plans.find((plan) => plan.id === planId);
  if (!target) return plans;
  const timestamp = now.toISOString();

  return plans.map((plan) => {
    if (plan.id === target.id) return { ...plan, status: 'approved' as const, updatedAt: timestamp };
    if (plan.id === target.replacesPlanId && plan.status === 'approved') {
      return { ...plan, status: 'superseded' as const, updatedAt: timestamp };
    }
    return plan;
  });
}

export function areProviderTermsFieldsComplete(fields: ProviderTermsFields) {
  return Boolean(
    fields.freeRescheduleHours > 0
    && fields.lateRescheduleWindowHours >= 0
    && fields.lateReschedulePenaltyPercent >= 0
    && fields.minimumCancellationHours > 0
    && fields.lateCancellationPenaltyPercent >= 0
    && fields.maximumWaitingMinutes > 0
    && fields.maximumDelayMinutes > 0
    && fields.maximumContactAttempts > 0
    && fields.planValidityDays > 0
    && fields.walkRecoveryConditions.trim()
    && fields.specificServiceConditions.trim()
    && fields.operationalContactInstructions.trim(),
  );
}

export function isProviderTermsApprovedAndCurrent(
  terms: ProviderTermsVersion,
  currentDate = new Date(),
) {
  const effectiveTime = Date.parse(`${terms.effectiveDate}T00:00:00`);

  return terms.status === 'approved'
    && Number.isFinite(effectiveTime)
    && effectiveTime <= currentDate.getTime();
}

export function getProviderCompletionChecklist(profile: ProviderWalkProfile, hourlyRate?: number, zone?: string) {
  const items = {
    description: Boolean(normalizeProviderDescription(profile.description)),
    walkConfiguration: profile.acceptedDogSizes.length > 0
      && profile.acceptedDogAges.length > 0
      && Number.isInteger(profile.maximumDogsPerWalk)
      && profile.maximumDogsPerWalk >= 1
      && profile.maximumDogsPerWalk <= MAX_DOGS_PER_WALK
      && profile.modalities.length > 0,
    requirements: profile.requirements.length > 0,
    hourlyRate: typeof hourlyRate === 'number' && Number.isFinite(hourlyRate) && hourlyRate > 0,
    coverageZone: Boolean(zone?.trim()),
    activePlan: profile.plans.some((plan) => (
      plan.status === 'draft'
      || plan.status === 'pending_approval'
      || plan.status === 'changes_requested'
      || plan.status === 'approved'
    ) && isValidProviderPlan(plan)),
  };

  return { items, isComplete: Object.values(items).every(Boolean) };
}

export function getProviderPublicationChecklist(profile: ProviderWalkProfile, hourlyRate?: number, zone?: string) {
  const completion = getProviderCompletionChecklist(profile, hourlyRate, zone);
  const hasApprovedPlan = profile.plans.some((plan) => isPublicProviderWalkPlan(plan));
  const items = {
    description: completion.items.description,
    walkConfiguration: completion.items.walkConfiguration,
    requirements: completion.items.requirements,
    hourlyRate: completion.items.hourlyRate,
    coverageZone: completion.items.coverageZone,
    activePlan: hasApprovedPlan,
    approved: profile.status === 'approved',
  };

  return { items, isPublishable: Object.values(items).every(Boolean) };
}

export function getPublicProviderWalkProfile(profile: ProviderWalkProfile, hourlyRate?: number, zone?: string) {
  const publication = getProviderPublicationChecklist(profile, hourlyRate, zone);
  if (!publication.isPublishable) return undefined;
  const { terms: _legacyProviderTerms, ...publicProfile } = profile;

  return {
    ...publicProfile,
    certifications: profile.certifications.filter((certificate) => certificate.status === 'approved' && isValidCertification(certificate)),
    plans: profile.plans.filter((plan) => isPublicProviderWalkPlan(plan)),
  };
}

export function cloneProviderWalkProfile(profile: ProviderWalkProfile): ProviderWalkProfile {
  return JSON.parse(JSON.stringify(profile)) as ProviderWalkProfile;
}
