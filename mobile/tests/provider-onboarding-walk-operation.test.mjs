import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  createEmptyProviderVerificationDraft,
  createProviderEnrollment,
  getMissingProviderSections,
  getProviderContact,
  getProviderVerificationProgress,
  legalVerificationSections,
  naturalVerificationSections,
} from '../src/domain/providerVerification.ts';
import {
  calculateProviderWalkMetrics,
  formatWalkElapsedTime,
  getProviderDelayMinutes,
  getWalkElapsedSeconds,
} from '../src/domain/walkOperation.ts';

const root = new URL('../', import.meta.url);
const read = (relativePath) => fs.readFileSync(new URL(relativePath, root), 'utf8');
const account = {
  id: 'account-1', firstName: 'Ana', lastName: 'Pérez', phone: '+593999999999', email: 'ana@hupi.ec', city: 'Quito', sector: 'Centro', avatar: 'AP',
};

function completeNaturalEnrollment() {
  const draft = createEmptyProviderVerificationDraft();
  draft.identity = { nationalId: '1712345678', birthDate: '1990-01-01', nationality: 'Ecuatoriana', selfieUri: 'camera://selfie', idFrontUri: 'camera://front', idBackUri: 'camera://back' };
  draft.address = { address: 'Av. República', city: 'Quito', sector: 'La Carolina', houseNumber: '12', locationType: 'building', buildingName: 'Torre Hupi', unitNumber: '4B' };
  draft.contact = { firstName: 'Lucía', lastName: 'Pérez', role: 'Hermana', phone: '+593988888888', email: 'lucia@hupi.ec' };
  draft.bank = { bank: 'Banco Hupi', accountType: 'Ahorros', accountNumber: '123456', accountHolder: 'Ana Pérez', holderTaxId: '1712345678' };
  draft.generalInformation = 'Paseadora con experiencia.';
  return { ...createProviderEnrollment(account.id, 'natural', draft), emailValidated: true };
}

test('entrada proveedor usa la misma autenticación y cliente existente no crea otra cuenta', () => {
  const login = read('src/app/(auth)/login.tsx');
  const hub = read('src/app/(auth)/provider-access.tsx');
  const onboarding = read('src/app/(auth)/provider-onboarding.tsx');
  const profile = read('src/app/(tabs)/profile.tsx');
  assert.match(login, /offerServicesQuestion/);
  assert.match(login, /provider-access/);
  assert.match(hub, /login\?provider=1/);
  assert.match(hub, /provider-onboarding/);
  assert.match(onboarding, /existing === '1'/);
  assert.match(onboarding, /account\.profile\.firstName/);
  assert.match(onboarding, /saveLocalCustomerProfile/);
  assert.match(profile, /provider-onboarding\?existing=1/);
});

test('alta permite persona natural o jurídica y crear cuenta base antes de documentos', () => {
  const onboarding = read('src/app/(auth)/provider-onboarding.tsx');
  assert.match(onboarding, /chooseType\('natural'\)/);
  assert.match(onboarding, /chooseType\('legal'\)/);
  assert.match(onboarding, /firstName/);
  assert.match(onboarding, /lastName/);
  assert.match(onboarding, /PhoneInput/);
  assert.match(onboarding, /keyboardType="email-address"/);
  assert.match(onboarding, /secureTextEntry/);
  assert.match(onboarding, /beginPhoneVerification/);
  assert.match(onboarding, /validateLocalProviderEmail/);
});

test('progreso natural se deriva de bloques obligatorios y reutiliza Cuenta Hupi', () => {
  const enrollment = completeNaturalEnrollment();
  assert.deepEqual(naturalVerificationSections, ['account', 'personal', 'identity', 'address', 'contact', 'bank', 'general']);
  assert.equal(getProviderVerificationProgress(enrollment, account, true), 100);
  assert.deepEqual(getMissingProviderSections(enrollment, account, true), []);
  const incomplete = { ...enrollment, draft: { ...enrollment.draft, bank: { ...enrollment.draft.bank, accountNumber: '' } } };
  assert.equal(getProviderVerificationProgress(incomplete, account, true), 86);
  assert.deepEqual(getMissingProviderSections(incomplete, account, true), ['bank']);
});

test('natural incluye dirección condicional, contacto y banco sin certificados', () => {
  const verification = read('src/app/provider/verification.tsx');
  assert.match(verification, /locationType === 'building'/);
  assert.match(verification, /buildingName/);
  assert.match(verification, /unitNumber/);
  assert.match(verification, /section === 'contact'/);
  assert.match(verification, /section === 'bank'/);
  assert.match(verification, /websiteOptional/);
  assert.match(verification, /noBankCertificate/);
  const domain = read('src/domain/providerVerification.ts');
  assert.doesNotMatch(domain, /bankCertificateUri|existenceCertificateUri|additionalCertificateUri/);
});

test('jurídica cubre empresa, documentos, representante y contacto reutilizable', () => {
  const verification = read('src/app/provider/verification.tsx');
  const draft = createEmptyProviderVerificationDraft();
  draft.legalRepresentative = { ...draft.legalRepresentative, firstName: 'María', lastName: 'Mora', phone: '0999999999', email: 'maria@empresa.ec' };
  const enrollment = { ...createProviderEnrollment(account.id, 'legal', draft), draft: { ...draft, contactIsLegalRepresentative: true } };
  assert.deepEqual(legalVerificationSections, ['account', 'company', 'company_documents', 'legal_representative', 'address', 'contact', 'bank']);
  assert.equal(getProviderContact(enrollment).firstName, 'María');
  assert.match(verification, /rucDocumentUri/);
  assert.match(verification, /incorporationDocumentUri/);
  assert.match(verification, /legalRepresentativeAppointmentUri/);
  assert.match(verification, /sameAsRepresentative/);
  assert.match(verification, /CameraField cameraType=\{ImagePicker\.CameraType\.front\} label=\{t\('providerVerification\.fields\.selfie'\)\}/);
  assert.match(verification, /noExtraCertificates/);
});

test('verificación general está separada de aprobación y configuración de Paseos', () => {
  const verification = read('src/app/provider/verification.tsx');
  const walks = read('src/app/provider/walks.tsx');
  assert.doesNotMatch(verification, /saveMockProviderServicePrice|ProviderWalkProfileEditor|providerPricing/);
  assert.match(walks, /saveMockProviderServicePrice/);
  assert.match(walks, /serviceApprovalHint/);
});

test('Paseos muestra tarifa arriba y ficha pública fuera de Mis planes', () => {
  const walks = read('src/app/provider/walks.tsx');
  const editor = read('src/components/provider/ProviderWalkProfileEditor.tsx');
  assert.match(walks, /topRateCard/);
  assert.match(walks, /yourRate/);
  for (const section of ['appointments', 'requests', 'plans', 'publicProfile', 'availability', 'finance']) assert.match(walks, new RegExp(`setActiveSection\\('${section}'\\)`));
  assert.match(walks, /walk-booking-detail\?bookingId=/);
  assert.match(editor, /mode === 'plans' \? section\.key === 'plans' : section\.key !== 'plans'/);
  assert.match(editor, /<Modal animationType="slide"/);
});

test('operación registra transiciones, timestamps, eventos y pago cero al cancelar', () => {
  const bookings = read('src/constants/mockBookings.ts');
  const detail = read('src/app/provider/walk-booking-detail.tsx');
  for (const event of ['walk_started', 'walk_completed', 'provider_cancelled_walk']) assert.match(bookings, new RegExp(event));
  assert.match(bookings, /status: 'En curso'/);
  assert.match(bookings, /startedAt,/);
  assert.match(bookings, /completedAt,/);
  assert.match(bookings, /actualDurationMinutes/);
  assert.match(bookings, /cancelledBy: 'provider'/);
  assert.match(bookings, /providerPayout: 0/);
  assert.match(detail, /canStartProviderWalk\(booking\)/);
  assert.match(detail, /booking\.status === 'En curso'/);
  assert.match(detail, /HupiConfirmationModal/);
});

test('temporizador usa timestamp y métricas usan cancelaciones y puntualidad reales', () => {
  const startedAt = '2026-08-22T10:00:00.000Z';
  assert.equal(getWalkElapsedSeconds(startedAt, new Date('2026-08-22T10:23:14.000Z').getTime()), 1394);
  assert.equal(formatWalkElapsedTime(1394), '00:23:14');
  assert.equal(getProviderDelayMinutes({ scheduledStartAt: startedAt, startedAt: '2026-08-22T10:06:00.000Z' }), 6);
  const metrics = calculateProviderWalkMetrics([
    { status: 'Completada', scheduledStartAt: startedAt, startedAt: '2026-08-22T10:06:00.000Z', providerPayout: 9 },
    { status: 'Cancelada', scheduledStartAt: startedAt, cancelledBy: 'provider', providerPayout: 0 },
  ]);
  assert.equal(metrics.providerCancellationRate, 0.5);
  assert.equal(metrics.providerPunctualityRate, 1);
  assert.equal(metrics.income, 9);
});

test('cliente refleja paseo en curso, completado y cancelado por proveedor sin acciones operativas', () => {
  const client = read('src/app/client/booking-detail.tsx');
  assert.match(client, /formatWalkElapsedTime\(getWalkElapsedSeconds\(booking\.startedAt, now\)\)/);
  assert.match(client, /clientInProgress/);
  assert.match(client, /clientCompleted/);
  assert.match(client, /booking\.cancelledBy === 'provider'/);
  assert.match(client, /clientNoCancellationCharge/);
  assert.doesNotMatch(client, /startMockProviderWalk|completeMockProviderWalk|cancelMockProviderWalk/);
});
