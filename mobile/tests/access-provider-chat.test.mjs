import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  isValidRecoveryEmail,
  maskPhone,
  normalizeRecoveryEmail,
} from '../src/domain/accessRecovery.ts';
import {
  calculateHaversineDistanceKm,
  deriveProviderSearchResults,
} from '../src/domain/providerSearch.ts';
import { en } from '../src/i18n/resources/en.ts';
import { es } from '../src/i18n/resources/es.ts';

const root = new URL('../', import.meta.url);
const read = (relativePath) => fs.readFileSync(new URL(relativePath, root), 'utf8');

test('recuperación recorta, normaliza y valida el correo ingresado manualmente', () => {
  assert.equal(maskPhone('+593 99 123 4567'), '••• ••• 4567');
  assert.equal(normalizeRecoveryEmail('  VALENTINA@HUPI.EC '), 'valentina@hupi.ec');
  assert.equal(isValidRecoveryEmail(' VALENTINA@HUPI.EC '), true);
  assert.equal(isValidRecoveryEmail('valentina @hupi.ec'), false);
  assert.equal(isValidRecoveryEmail('correo-incompleto'), false);
});

test('flujo de recuperación usa repositorio local, respuesta neutral y código mock existente', () => {
  const recovery = read('src/app/(auth)/access-recovery.tsx');
  const verification = read('src/app/(auth)/verify-sms.tsx');
  const repository = read('src/data/localAccountRepository.ts');
  const login = read('src/app/(auth)/login.tsx');
  assert.match(login, /router\.push\('\/access-recovery'\)/);
  assert.doesNotMatch(recovery, /profile\.phone|profile\.email|maskEmail|recoveryEmailMatches/);
  assert.match(recovery, /type RecoveryMethod = 'email' \| 'sms'/);
  assert.match(recovery, /accessibilityRole="radiogroup"/);
  assert.match(recovery, /accessibilityRole="radio"/);
  assert.match(recovery, /accessibilityState=\{\{ selected \}\}/);
  assert.match(recovery, /keyboardType="email-address"/);
  assert.match(recovery, /autoCapitalize="none"/);
  assert.match(recovery, /autoCorrect=\{false\}/);
  assert.match(recovery, /normalizeRecoveryEmail/);
  assert.match(recovery, /isValidRecoveryEmail/);
  assert.match(recovery, /PhoneCountryInput/);
  assert.match(recovery, /useState\('\+593'\)/);
  assert.match(recovery, /isPhoneNumberValid/);
  assert.match(recovery, /normalizePhoneNumber/);
  assert.match(recovery, /beginAccessRecovery\('sms', normalizedPhone\.normalizedPhone\)/);
  assert.match(recovery, /router\.push\('\/verify-sms\?recovery=1'\)/);
  assert.match(recovery, /loading=\{isSubmitting\}/);
  assert.match(recovery, /auth\.recovery\.neutralNotice/);
  assert.match(recovery, /auth\.recovery\.spamNotice/);
  assert.doesNotMatch(recovery, /valentina@hupi\.ec|99 123 4567/);
  assert.match(repository, /pendingPhone: channel === 'sms' \? pendingPhone\.trim\(\) : ''/);
  assert.match(verification, /verifyOtpCode\(/);
  assert.match(verification, /verificationChannel/);
  assert.match(verification, /auth\.sms\.recoverySmsSent/);
  assert.doesNotMatch(verification, /account\.profile\.email|maskEmail|destination: masked/);
});

test('Haversine calcula distancia real y una sola derivación aplica radio, orden y verificación', () => {
  const center = { latitude: -0.1839, longitude: -78.4848 };
  const providers = [
    { id: 'near', latitude: -0.1825, longitude: -78.483, rating: 4.7, isVerifiedByHupi: false },
    { id: 'best', latitude: -0.2055, longitude: -78.482, rating: 4.9, isVerifiedByHupi: true },
    { id: 'far', latitude: -1.2, longitude: -78.5, rating: 5, isVerifiedByHupi: true },
  ];
  assert.ok(calculateHaversineDistanceKm(center, providers[0]) < 1);
  assert.deepEqual(
    deriveProviderSearchResults(providers, center, 'closest', 8).map((item) => item.provider.id),
    ['near', 'best'],
  );
  assert.deepEqual(
    deriveProviderSearchResults(providers, center, 'verified', 8).map((item) => item.provider.id),
    ['best'],
  );
});

test('lista y mapa consumen la misma colección y el mapa nativo usa marcadores reales', () => {
  const providersScreen = read('src/app/client/providers.tsx');
  const providerMap = read('src/components/providers/ProviderMap.native.tsx');
  assert.match(providersScreen, /deriveProviderSearchResults/);
  assert.match(providersScreen, /results\.map/);
  assert.match(providersScreen, /providers=\{results\}/);
  assert.match(providerMap, /from 'react-native-maps'/);
  assert.match(providerMap, /fitToCoordinates/);
  assert.match(providerMap, /<Marker/);
  assert.match(providerMap, /onCoordinate/);
  assert.doesNotMatch(providersScreen, /Hupi Top|Disponibles hoy|hupiMvp|options-outline/);
});

test('selector conserva iconKey y tarjetas no muestran certificados', () => {
  const form = read('src/features/home/ServiceForm.tsx');
  const card = read('src/components/providers/ProviderCard.tsx');
  assert.match(form, /iconKey=\{address\.iconKey\}/);
  assert.match(form, /iconKey=\{state\.selectedAddress\?\.iconKey/);
  assert.match(form, /address\.isDefault/);
  assert.doesNotMatch(card, /provider\.diplomas|diplomaRow|school-outline/);
});

test('chat elimina contexto técnico, destaca seguridad y ocupa el alto flexible', () => {
  const chat = read('src/app/chat.tsx');
  const safety = read('src/components/chat/SafetyNoticeCard.tsx');
  assert.doesNotMatch(chat, /\$\{serviceLabel\} · \$\{serviceRequest\?\.status\}/);
  assert.doesNotMatch(chat, /conversation\.subtitle\}<\/Text>/);
  assert.match(chat, /container: \{ flex: 1, minHeight: 0/);
  assert.match(chat, /keyboard: \{ flex: 1, minHeight: 0/);
  assert.match(chat, /messageScroll: \{ flex: 1, minHeight: 0/);
  assert.match(chat, /messages: \{ flexGrow: 1/);
  assert.match(safety, /backgroundColor: colors\.primary/);
  assert.match(safety, /color: colors\.white/);
});

test('textos nuevos existen en español e inglés', () => {
  assert.equal(es.auth.recovery.title, 'Recupera tu acceso');
  assert.equal(en.auth.recovery.title, 'Recover your access');
  assert.equal(es.auth.recovery.emailField, 'Correo electrónico');
  assert.equal(es.auth.recovery.phoneMethod, 'Número de celular');
  assert.equal(en.auth.recovery.phoneMethod, 'Mobile number');
  assert.equal(es.auth.recovery.sendSms, 'Enviar código por SMS');
  assert.match(es.auth.recovery.neutralNotice, /Si el correo está registrado en Hupi/);
  assert.match(es.auth.recovery.phoneNeutralNotice, /Si el número está registrado en Hupi/);
  assert.match(es.auth.sms.recoverySmsSent, /Si el número está registrado en Hupi/);
  assert.match(es.auth.recovery.spamNotice, /spam o correo no deseado/);
  assert.equal(es.providerSearch.filters.verified, 'Verificados por Hupi');
  assert.equal(en.providerSearch.filters.verified, 'Verified by Hupi');
  assert.ok(es.providerSearch.empty.includes('No encontramos'));
  assert.ok(en.providerSearch.empty.includes('could not find'));
});
