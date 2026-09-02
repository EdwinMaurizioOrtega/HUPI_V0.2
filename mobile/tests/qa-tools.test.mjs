import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  canQaProfileEnterProviderMode,
  getQaProfile,
  getQaVerificationSection,
  QA_PROFILES,
  QA_VERIFICATION_STEPS,
} from '../src/domain/qaTools.ts';
import { QA_WALK_ID, transitionQaWalk } from '../src/domain/qaWalk.ts';

const root = new URL('../', import.meta.url);
const read = (relativePath) => fs.readFileSync(new URL(relativePath, root), 'utf8');

test('las herramientas QA están protegidas por el bundle __DEV__ y no reemplazan Modo prueba', () => {
  const environment = read('src/config/environment.ts');
  const settings = read('src/app/client/settings.tsx');
  const profiles = read('src/app/client/qa-profiles.tsx');
  const verification = read('src/app/client/qa-provider-verification.tsx');
  const walk = read('src/app/client/qa-walk.tsx');

  assert.match(environment, /isDevelopmentBundle[\s\S]*typeof __DEV__ !== 'undefined' && __DEV__/);
  assert.match(settings, /developmentOptionsVisible = isDevelopmentBundle\(\)/);
  assert.match(settings, /settings\.testMode/);
  for (const screen of [profiles, verification, walk]) {
    assert.match(screen, /if \(!isDevelopmentBundle\(\)\) return <Redirect href="\/home"/);
  }
});

test('existen los ocho perfiles QA con estado de proveedor, Paseos y destino', () => {
  assert.equal(QA_PROFILES.length, 8);
  assert.deepEqual(QA_PROFILES.map((profile) => profile.id), [
    'new_client',
    'active_client',
    'client_provider_pending',
    'client_provider_verified',
    'new_provider',
    'provider_incomplete',
    'provider_verified',
    'provider_verified_walk_pending',
  ]);
  for (const profile of QA_PROFILES) {
    assert.ok(profile.providerState);
    assert.ok(profile.walkStatus);
    assert.ok(profile.destination);
  }
  assert.equal(getQaProfile('provider_verified_walk_pending').walkStatus, 'pending_approval');
});

test('el selector aplica y persiste el perfil, y Ajustes muestra el perfil activo', () => {
  const repository = read('src/data/localQaRepository.ts');
  const selector = read('src/app/client/qa-profiles.tsx');
  const settings = read('src/app/client/settings.tsx');

  assert.match(repository, /hupi\.qaProfile\.v1/);
  assert.match(repository, /AsyncStorage\.setItem\(STORAGE_KEY/);
  assert.match(repository, /applyLocalAccountQaProfile\(profile\.id\)/);
  assert.match(repository, /applyLocalProviderQaProfile\(profile\.id\)/);
  assert.match(selector, /QA_PROFILES\.map/);
  assert.match(selector, /applyQaProfile\(profile\.id\)/);
  assert.match(settings, /settings\.activeQaProfile/);
  assert.match(settings, /qa\.activeProfileId/);
});

test('las herramientas permiten reiniciar y abrir los nueve pasos o continuar el pendiente', () => {
  const tools = read('src/app/client/qa-provider-verification.tsx');
  const verification = read('src/app/provider/verification.tsx');
  const settings = read('src/app/client/settings.tsx');

  assert.equal(QA_VERIFICATION_STEPS.length, 9);
  assert.equal(getQaVerificationSection(5), 'identity');
  assert.equal(getQaVerificationSection(9), null);
  assert.match(tools, /resetQaProviderVerification\(\)/);
  assert.match(tools, /openStep\(qa\.currentStep\)/);
  assert.match(tools, /QA_VERIFICATION_STEPS\.map/);
  assert.match(verification, /qaStep/);
  assert.match(verification, /getQaVerificationSection\(qaStepNumber\)/);
  assert.match(settings, /resetWelcomeFlow/);
});

test('existe un solo QA-WALK-001 y cliente/proveedor consultan el mismo repositorio', () => {
  const bookings = read('src/constants/mockBookings.ts');
  const clientDetail = read('src/app/client/booking-detail.tsx');
  const providerDetail = read('src/app/provider/walk-booking-detail.tsx');

  assert.equal(QA_WALK_ID, 'QA-WALK-001');
  assert.equal((bookings.match(/id: QA_WALK_ID/g) ?? []).length, 1);
  assert.match(bookings, /getQaWalkForClient[\s\S]*getMockBookingById\(QA_WALK_ID\)/);
  assert.match(bookings, /getQaWalkForProvider[\s\S]*getMockBookingById\(QA_WALK_ID\)/);
  assert.match(clientDetail, /getMockBookingById\(bookingId\)/);
  assert.match(providerDetail, /getMockBookingById\(bookingId\)/);
});

test('las transiciones QA definen inicio, completan y regresan a agendado', () => {
  const started = transitionQaWalk({ status: 'scheduled' }, 'in_progress', '2026-08-23T10:00:00.000Z');
  assert.equal(started.status, 'in_progress');
  assert.equal(started.startedAt, '2026-08-23T10:00:00.000Z');

  const completed = transitionQaWalk(started, 'completed', '2026-08-23T10:45:00.000Z');
  assert.equal(completed.status, 'completed');
  assert.equal(completed.startedAt, started.startedAt);
  assert.equal(completed.completedAt, '2026-08-23T10:45:00.000Z');

  assert.deepEqual(transitionQaWalk(completed, 'scheduled'), { status: 'scheduled' });
  const bookings = read('src/constants/mockBookings.ts');
  assert.match(bookings, /setMockQaWalkStatus/);
  assert.match(bookings, /startMockProviderWalk\(QA_WALK_ID/);
  assert.match(bookings, /completeMockProviderWalk\(QA_WALK_ID/);
  assert.match(bookings, /cancelMockProviderWalk\(QA_WALK_ID/);
});

test('cliente + proveedor verificado puede entrar a Modo Proveedor y ver Paseos aprobado', () => {
  const profile = read('src/app/(tabs)/profile.tsx');
  const walks = read('src/app/provider/walks.tsx');

  assert.equal(canQaProfileEnterProviderMode('client_provider_verified'), true);
  assert.equal(getQaProfile('client_provider_verified').walkStatus, 'approved');
  assert.match(profile, /hasProviderMode \? '\/provider'/);
  assert.match(walks, /qa\.walkStatus/);
});
