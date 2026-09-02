import type { ProviderVerificationSectionKey } from '@/domain/providerVerification';

export type QaProfileId =
  | 'new_client'
  | 'active_client'
  | 'client_provider_pending'
  | 'client_provider_verified'
  | 'new_provider'
  | 'provider_incomplete'
  | 'provider_verified'
  | 'provider_verified_walk_pending';

export type QaProviderState = 'none' | 'in_progress' | 'approved';
export type QaWalkApprovalState = 'not_applicable' | 'not_configured' | 'blocked' | 'approved' | 'pending_approval';

export type QaProfileDefinition = {
  id: QaProfileId;
  providerState: QaProviderState;
  walkStatus: QaWalkApprovalState;
  currentStep: number;
  destination: '/welcome' | '/profile' | '/provider' | '/provider/verification';
};

export const QA_PROFILES: QaProfileDefinition[] = [
  { id: 'new_client', providerState: 'none', walkStatus: 'not_applicable', currentStep: 1, destination: '/welcome' },
  { id: 'active_client', providerState: 'none', walkStatus: 'not_applicable', currentStep: 1, destination: '/profile' },
  { id: 'client_provider_pending', providerState: 'in_progress', walkStatus: 'blocked', currentStep: 6, destination: '/profile' },
  { id: 'client_provider_verified', providerState: 'approved', walkStatus: 'approved', currentStep: 9, destination: '/profile' },
  { id: 'new_provider', providerState: 'in_progress', walkStatus: 'not_configured', currentStep: 5, destination: '/provider/verification' },
  { id: 'provider_incomplete', providerState: 'in_progress', walkStatus: 'blocked', currentStep: 6, destination: '/provider' },
  { id: 'provider_verified', providerState: 'approved', walkStatus: 'approved', currentStep: 9, destination: '/provider' },
  { id: 'provider_verified_walk_pending', providerState: 'approved', walkStatus: 'pending_approval', currentStep: 9, destination: '/provider' },
];

export const QA_VERIFICATION_STEPS = [
  { number: 1, section: 'personal', labelKey: 'qaTools.verificationSteps.step1' },
  { number: 2, section: 'account', labelKey: 'qaTools.verificationSteps.step2' },
  { number: 3, section: 'account', labelKey: 'qaTools.verificationSteps.step3' },
  { number: 4, section: 'account', labelKey: 'qaTools.verificationSteps.step4' },
  { number: 5, section: 'identity', labelKey: 'qaTools.verificationSteps.step5' },
  { number: 6, section: 'address', labelKey: 'qaTools.verificationSteps.step6' },
  { number: 7, section: 'contact', labelKey: 'qaTools.verificationSteps.step7' },
  { number: 8, section: 'bank', labelKey: 'qaTools.verificationSteps.step8' },
  { number: 9, section: null, labelKey: 'qaTools.verificationSteps.step9' },
] as const satisfies readonly { number: number; section: ProviderVerificationSectionKey | null; labelKey: string }[];

export function getQaProfile(profileId: QaProfileId) {
  return QA_PROFILES.find((profile) => profile.id === profileId) ?? QA_PROFILES[1];
}

export function getQaVerificationSection(step: number) {
  return QA_VERIFICATION_STEPS.find((item) => item.number === step)?.section ?? null;
}

export function getQaVerificationStepLabelKey(step: number) {
  return QA_VERIFICATION_STEPS.find((item) => item.number === step)?.labelKey
    ?? 'qaTools.verificationSteps.step1';
}

export function normalizeQaVerificationStep(step: number) {
  return Math.max(1, Math.min(9, Math.round(step || 1)));
}

export function canQaProfileEnterProviderMode(profileId: QaProfileId) {
  return getQaProfile(profileId).providerState !== 'none';
}
