import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  DOG_AGE_OPTIONS,
  approveProviderPlanVersion,
  createProviderPlanDraftVersion,
  getProviderCompletionChecklist,
  getPublicProviderWalkProfile,
  isPublicProviderWalkPlan,
  isValidCertification,
  isValidProviderPlan,
  MAX_PROVIDER_DESCRIPTION_LENGTH,
  normalizeProviderDescription,
} from '../src/domain/providerWalkProfile.ts';
import {
  getHupiStandardWalkCancellationPolicy,
  getSpecialWalkConditions,
  HUPI_STANDARD_WALK_CANCELLATION_POLICY,
} from '../src/domain/providerCancellationPolicy.ts';
import { en } from '../src/i18n/resources/en.ts';
import { es } from '../src/i18n/resources/es.ts';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const completeProfile = {
  description: 'Paseos seguros y activos.',
  acceptedDogSizes: ['medium'],
  acceptedDogAges: ['adult'],
  maximumDogsPerWalk: 2,
  modalities: ['individual', 'group'],
  walkTypes: ['active'],
  specialHandling: [],
  requirements: ['vaccines_current'],
  certifications: [{ id: 'cert-1', name: 'Primeros auxilios', institution: 'Instituto ABC', year: 2025, status: 'approved' }],
  plans: [{ id: 'plan-1', version: 1, name: 'Plan de 12 paseos', description: 'Rutina mensual', type: 'recurring', durationMinutes: 60, walkCount: 12, frequencyPerWeek: 3, frequencyType: 'recommended', validityDays: 30, petsIncluded: 1, modality: 'individual', price: 120, includes: ['Reporte'], specificConditions: [], isAvailable: true, status: 'approved' }],
  terms: { id: 'terms-1', version: 1, effectiveDate: '2026-08-05', status: 'approved', fields: { freeRescheduleHours: 48, lateRescheduleWindowHours: 24, lateReschedulePenaltyPercent: 50, minimumCancellationHours: 24, lateCancellationPenaltyPercent: 100, maximumWaitingMinutes: 10, maximumDelayMinutes: 15, rainTreatment: 'reschedule', maximumContactAttempts: 2, planValidityDays: 30, walkRecoveryConditions: 'Sujeto a disponibilidad.', specificServiceConditions: 'Equipo seguro.', operationalContactInstructions: 'Usar el chat Hupi.' } },
  status: 'approved',
};

const translateFrom = (resource) => (key) => key.split('.').reduce((value, segment) => value?.[segment], resource) ?? key;

test('descripción y edades aplican las reglas públicas', () => {
  assert.equal(MAX_PROVIDER_DESCRIPTION_LENGTH, 150);
  assert.equal(normalizeProviderDescription(`  ${'a'.repeat(170)}  `).length, 150);
  assert.deepEqual(DOG_AGE_OPTIONS, ['puppy', 'adult']);
  assert.ok(!DOG_AGE_OPTIONS.includes('senior'));
});

test('certificaciones y planes validan sus campos específicos', () => {
  assert.equal(isValidCertification(completeProfile.certifications[0]), true);
  assert.equal(isValidCertification({ ...completeProfile.certifications[0], year: new Date().getFullYear() + 1 }), false);
  assert.equal(isValidProviderPlan(completeProfile.plans[0]), true);
  assert.equal(isValidProviderPlan({ ...completeProfile.plans[0], petsIncluded: 0 }), false);
});

test('publicación exige la ficha aprobada, pero no políticas ni términos configurados por el proveedor', () => {
  assert.equal(getProviderCompletionChecklist(completeProfile, 12.5, 'Quito').isComplete, true);
  const publicProfile = getPublicProviderWalkProfile(completeProfile, 12.5, 'Quito');
  assert.ok(publicProfile);
  assert.equal('terms' in publicProfile, false);
  assert.equal(getPublicProviderWalkProfile({ ...completeProfile, status: 'pending_approval' }, 12.5, 'Quito'), undefined);
  assert.ok(getPublicProviderWalkProfile({ ...completeProfile, terms: { ...completeProfile.terms, status: 'draft' } }, 12.5, 'Quito'));
  assert.ok(getPublicProviderWalkProfile({ ...completeProfile, cancellationPolicy: 'moderate_72_48h' }, 12.5, 'Quito'));
});

test('la política de cancelación es una única definición estándar de Hupi', () => {
  const spanish = getHupiStandardWalkCancellationPolicy(translateFrom(es));
  const english = getHupiStandardWalkCancellationPolicy(translateFrom(en));
  assert.equal(spanish.id, HUPI_STANDARD_WALK_CANCELLATION_POLICY.id);
  assert.equal(spanish.title, 'Política de cancelación');
  assert.equal(spanish.subtitle, 'Resumen informativo');
  assert.match(spanish.customerSummary, /72 horas o más/);
  assert.match(spanish.customerSummary, /24 horas y menos de 72 horas/);
  assert.match(spanish.customerSummary, /50 %/);
  assert.match(spanish.customerSummary, /100 %/);
  assert.equal(english.refundLabel, 'Refund');
  assert.equal(english.balanceLabel, 'Hupi Balance');
});

test('situaciones especiales están separadas, no son seleccionables y filtran texto interno para cliente', () => {
  const customerConditions = getSpecialWalkConditions(translateFrom(es));
  assert.equal(customerConditions.length, 7);
  assert.ok(customerConditions.every((condition) => condition.isSelectable === false));
  assert.match(customerConditions.at(-1).description, /40 minutos adicionales/);
  assert.ok(customerConditions.every((condition) => !/perfil interno|incumplimiento|métrica|compensación|sanción/.test(condition.description)));
});

test('solo planes aprobados, activos, vigentes y válidos son públicos', () => {
  const approved = completeProfile.plans[0];
  assert.equal(isPublicProviderWalkPlan(approved, new Date('2026-08-05T12:00:00Z')), true);
  for (const status of ['draft', 'pending_approval', 'changes_requested', 'rejected', 'suspended', 'archived', 'superseded']) {
    assert.equal(isPublicProviderWalkPlan({ ...approved, status }, new Date('2026-08-05T12:00:00Z')), false);
  }
  assert.equal(isPublicProviderWalkPlan({ ...approved, isAvailable: false }), false);
  assert.equal(isPublicProviderWalkPlan({ ...approved, availableFrom: '2026-08-06' }, new Date('2026-08-05T12:00:00Z')), false);
  assert.equal(isPublicProviderWalkPlan({ ...approved, availableUntil: '2026-08-04' }, new Date('2026-08-05T12:00:00Z')), false);
  assert.equal(isPublicProviderWalkPlan({ ...approved, availableUntil: 'fecha-inválida' }, new Date('2026-08-05T12:00:00Z')), false);
  assert.equal(isPublicProviderWalkPlan({ ...approved, price: 0 }), false);
});

test('editar un plan aprobado crea versión y solo lo reemplaza al aprobar', () => {
  const approved = completeProfile.plans[0];
  const draftVersion = createProviderPlanDraftVersion(approved, new Date('2026-08-05T12:00:00Z'));
  assert.equal(approved.status, 'approved');
  assert.equal(draftVersion.status, 'draft');
  assert.equal(draftVersion.replacesPlanId, approved.id);
  assert.equal(draftVersion.version, 2);

  const approvedVersions = approveProviderPlanVersion([approved, draftVersion], draftVersion.id, new Date('2026-08-06T12:00:00Z'));
  assert.equal(approvedVersions.find((plan) => plan.id === approved.id)?.status, 'superseded');
  assert.equal(approvedVersions.find((plan) => plan.id === draftVersion.id)?.status, 'approved');
});

test('perfil público elimina secciones redundantes y muestra la estructura final', async () => {
  const source = await read('src/app/client/provider-detail.tsx');
  assert.doesNotMatch(source, /walkSpecialty|common\.experience2|generated\.common\.detailsFor|provider\.diplomas|serviceDetails\.map/);
  for (const section of ['public.about', 'public.howWalks', 'public.requirements', 'public.certifications', 'public.plans', 'public.reviews']) {
    assert.match(source, new RegExp(section.replace('.', '\\.')));
  }
  assert.match(source, /<PolicySummaryCard \/>/);
  assert.match(source, /<WalkSpecialConditionsAccordion \/>/);
  assert.doesNotMatch(source, /public\.terms|ProviderTermsAcceptanceBlock|ProviderTermsModal/);
});

test('editor modular cubre el servicio sin políticas ni términos configurables', async () => {
  const source = await read('src/components/provider/ProviderWalkProfileEditor.tsx');
  assert.match(source, /maxLength=\{MAX_PROVIDER_DESCRIPTION_LENGTH\}/);
  assert.match(source, /characterCounter/);
  assert.match(source, /maximumDogsPerWalk/);
  assert.match(source, /isValidCertification/);
  assert.match(source, /frequencyPerWeek/);
  assert.match(source, /getProviderCompletionChecklist/);
  assert.match(source, /submitMockProviderProfileForReview/);
  assert.match(source, /accessibilityState=\{\{ expanded: active \}\}/);
  assert.match(source, /current === section\.key \? null : section\.key/);
  assert.match(source, /createProviderPlanDraftVersion/);
  assert.match(source, /managementTitle/);
  assert.match(source, /emptyTitle/);
  assert.match(source, /submitMockProviderPlanForReview/);
  assert.doesNotMatch(source, /ProviderTermsModal|TermsEditor|CancellationPolicyEditor|getProviderCancellationPolicies/);
  assert.doesNotMatch(source, /cancellationPolicy: policy\.id|CancellationPolicyEditor/);
  assert.match(source, /<WalkSpecialConditionsAccordion \/>/);
  const numericFields = source.match(/const numericFields = \[([^\]]+)\]/)?.[1] ?? '';
  assert.doesNotMatch(numericFields, /minimumCancellationHours|lateCancellationPenaltyPercent/);
});

test('repositorio descarta la política heredada y conserva borradores antiguos', async () => {
  const repository = await read('src/data/mockProviderProfileRepository.ts');
  assert.match(repository, /cancellationPolicy\?: unknown/);
  assert.match(repository, /cancellationPolicy: _legacyCancellationPolicy/);
  assert.match(repository, /profileWithoutLegacyPolicy/);
  assert.match(repository, /AsyncStorage\.setItem\(DRAFTS_KEY, JSON\.stringify\(drafts\)\)/);
});

test('ficha pública muestra la tarjeta estándar y condiciones especiales sin información interna', async () => {
  const [profile, policyCard, specialConditions] = await Promise.all([
    read('src/app/client/provider-detail.tsx'),
    read('src/components/booking/PolicySummaryCard.tsx'),
    read('src/components/provider/WalkSpecialConditionsAccordion.tsx'),
  ]);
  assert.match(profile, /PolicySummaryCard/);
  assert.match(profile, /WalkSpecialConditionsAccordion/);
  assert.match(policyCard, /getHupiStandardWalkCancellationPolicy/);
  assert.match(policyCard, /document-text-outline/);
  assert.match(policyCard, /policy\.refundLabel/);
  assert.match(policyCard, /policy\.balanceLabel/);
  assert.match(specialConditions, /getSpecialWalkConditions\(translate\)/);
  assert.match(specialConditions, /setExpanded\(\(current\) => !current\)/);
  assert.match(specialConditions, /accessibilityState=\{\{ expanded \}\}/);
  assert.doesNotMatch(profile, /providerExplanation|perfil interno|compensación|sanción/);
});

test('solicitudes y perfil se mueven a sus módulos sin perder acceso', async () => {
  const [dashboard, walks] = await Promise.all([read('src/app/provider/index.tsx'), read('src/app/provider/walks.tsx')]);
  assert.doesNotMatch(dashboard, /serviceRequests\.map|coordinationRequests\.map|ProviderWalkProfileEditor/);
  assert.match(dashboard, /provider\/verification/);
  assert.match(dashboard, /provider\/walks/);
  assert.match(walks, /serviceRequests\.map/);
  assert.match(walks, /coordinationRequests\.map/);
  assert.match(walks, /<ProviderWalkProfileEditor/);
});

test('borrador y versión publicada permanecen separados', async () => {
  const repository = await read('src/data/mockProviderProfileRepository.ts');
  assert.match(repository, /createDraft\(providerId/);
  assert.match(repository, /status: 'pending_approval'/);
  assert.doesNotMatch(repository, /provider\.walkProfile\s*=/);
});

test('los términos estándar se aceptan solo en checkout y la política no se repite allí', async () => {
  const [profile, chat, checkout, repository, domain] = await Promise.all([
    read('src/app/client/provider-detail.tsx'),
    read('src/app/chat.tsx'),
    read('src/app/client/service-checkout.tsx'),
    read('src/data/mockProviderProfileRepository.ts'),
    read('src/domain/providerWalkProfile.ts'),
  ]);
  assert.doesNotMatch(profile, /acceptsProviderTerms|ProviderTermsAcceptanceBlock|ProviderTermsModal/);
  assert.match(chat, /disabled=\{!acceptsTerms\}/);
  assert.match(checkout, /canConfirm = acceptsServiceTerms && acceptsPrivacyPolicy/);
  assert.match(checkout, /placement="checkout"/);
  assert.match(checkout, /HUPI_STANDARD_WALK_TERMS/);
  assert.doesNotMatch(checkout, /PolicySummaryCard/);
  assert.match(domain, /termsVersion/);
  assert.match(domain, /HUPI_STANDARD_WALK_TERMS/);
  assert.match(repository, /acceptedAt/);
  assert.match(repository, /ACCEPTANCES_KEY/);
});

test('traducciones nuevas existen en español e inglés sin edad senior', async () => {
  const [es, en] = await Promise.all([read('src/i18n/resources/es.ts'), read('src/i18n/resources/en.ts')]);
  for (const resource of [es, en]) {
    assert.match(resource, /providerProfile:/);
    assert.match(resource, /termsDocument:/);
    assert.match(resource, /pending_approval/);
    assert.match(resource, /suspended/);
    assert.match(resource, /superseded/);
    assert.match(resource, /managementTitle/);
    assert.match(resource, /createVersion/);
    assert.match(resource, /emptyTitle/);
    assert.match(resource, /cancellation:/);
    assert.match(resource, /informativeSummary/);
    assert.match(resource, /standardCustomerSummary/);
    assert.match(resource, /hupiBalance/);
    assert.match(resource, /standardTerms:/);
    assert.match(resource, /standardCheckbox/);
    assert.match(resource, /provider_no_show/);
  }
  assert.doesNotMatch(es, /ages:[\s\S]{0,180}senior/);
  assert.doesNotMatch(en, /ages:[\s\S]{0,180}senior/);
});
