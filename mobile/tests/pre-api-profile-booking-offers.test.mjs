import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { calculateBookingCancellation } from '../src/domain/bookingCancellationPolicy.ts';
import { isImageDocument } from '../src/domain/document.ts';
import { filterPetHistoryByDate } from '../src/domain/petHistory.ts';
import { HUPI_PASSWORD_MIN_LENGTH, validatePasswordChange } from '../src/domain/passwordPolicy.ts';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('la política de cancelación usa la hora real y los límites exactos', () => {
  const now = new Date('2026-08-07T12:00:00.000Z');
  const fromHours = (hours) => new Date(now.getTime() + hours * 3_600_000);

  assert.equal(calculateBookingCancellation(fromHours(72), 100, now).penaltyPercent, 0);
  assert.equal(calculateBookingCancellation(fromHours(71 + 59 / 60), 100, now).penaltyPercent, 50);
  assert.equal(calculateBookingCancellation(fromHours(24), 100, now).penaltyPercent, 50);
  const late = calculateBookingCancellation(fromHours(23 + 59 / 60), 100, now);
  assert.equal(late.penaltyPercent, 100);
  assert.equal(late.refundAmount, 0);
});

test('el cambio de contraseña exige todos los campos, longitud y confirmación', () => {
  assert.equal(HUPI_PASSWORD_MIN_LENGTH, 8);
  assert.equal(validatePasswordChange({ currentPassword: '', newPassword: '', confirmPassword: '' }), 'required');
  assert.equal(validatePasswordChange({ currentPassword: 'Actual123', newPassword: 'corta', confirmPassword: 'corta' }), 'too_short');
  assert.equal(validatePasswordChange({ currentPassword: 'Actual123', newPassword: 'Nueva123', confirmPassword: 'Otra1234' }), 'mismatch');
  assert.equal(validatePasswordChange({ currentPassword: 'Actual123', newPassword: 'Nueva123', confirmPassword: 'Nueva123' }), null);
});

test('editar perfil elimina ciudad y sector e incorpora modal y confirmación de contraseña', async () => {
  const source = await read('src/app/client/edit-profile.tsx');
  assert.doesNotMatch(source, /update\('city'|update\('sector'/);
  assert.match(source, /passwordModalVisible/);
  assert.match(source, /currentPassword/);
  assert.match(source, /confirmPassword/);
  assert.match(source, /secureTextEntry/);
  assert.match(source, /profile\.password\.updated/);
});

test('mascota separa veterinario y contacto, abre imágenes y filtra historial', async () => {
  const [data, form, detail] = await Promise.all([
    read('src/constants/mockData.ts'),
    read('src/app/client/pet-form.tsx'),
    read('src/app/client/pet-detail.tsx'),
  ]);
  assert.match(data, /veterinarianName: string/);
  assert.match(data, /clinicName: string/);
  assert.match(form, /petProfile\.veterinarianName/);
  assert.match(form, /petProfile\.clinicName/);
  assert.match(detail, /petProfile\.emergencyName/);
  assert.match(detail, /petProfile\.emergencyPhone/);
  assert.doesNotMatch(detail, /pet\.emergencyContact\.name\s*\?\s*`/);
  assert.match(detail, /vaccineViewerVisible/);
  assert.match(detail, /<Image[^>]*resizeMode="contain"/);
  assert.match(detail, /NativeDatePickerField/);
  assert.match(detail, /filterPetHistoryByDate/);
  assert.match(detail, /booking-detail\?bookingId=/);
});

test('el detector de carnet mantiene documentos y reconoce imágenes', () => {
  assert.equal(isImageDocument('carnet.pdf', 'application/pdf'), false);
  assert.equal(isImageDocument('carnet.JPG'), true);
  assert.equal(isImageDocument('documento', 'image/png'), true);
});

test('el filtro de paseos incluye los límites y puede quedar vacío', () => {
  const history = [
    { id: 'a', dateIso: '2026-06-28' },
    { id: 'b', dateIso: '2026-07-04' },
  ];
  assert.deepEqual(filterPetHistoryByDate(history, new Date(2026, 5, 28), new Date(2026, 5, 28)).map((item) => item.id), ['a']);
  assert.deepEqual(filterPetHistoryByDate(history, new Date(2026, 7, 1), new Date(2026, 7, 2)), []);
  assert.equal(filterPetHistoryByDate(history).length, 2);
});

test('facturación inicia contraída y Perfil ya no ofrece probar sonido', async () => {
  const [billing, profile] = await Promise.all([
    read('src/app/client/billing.tsx'),
    read('src/app/(tabs)/profile.tsx'),
  ]);
  assert.match(billing, /\[formOpen, setFormOpen\] = useState\(false\)/);
  assert.match(billing, /\{formOpen \? <>/);
  assert.match(billing, /billing\.add/);
  assert.match(billing, /billing\.edit/);
  assert.doesNotMatch(profile, /Probar sonido|testHupiSound|playHupiBrandSound|volume-medium-outline/);
});

test('ofertas usan tokens oscuros y el proveedor solo elige opciones aprobadas', async () => {
  const [chat, composer, data] = await Promise.all([
    read('src/app/chat.tsx'),
    read('src/components/chat/OfferComposerModal.tsx'),
    read('src/constants/mockData.ts'),
  ]);
  assert.match(chat, /backgroundColor: tokens\.surfaceRaised/);
  assert.match(chat, /borderColor: tokens\.border/);
  assert.match(chat, /color: tokens\.text/);
  assert.match(chat, /color: tokens\.primary/);
  assert.match(composer, /getMockProviderPlans/);
  assert.match(composer, /offerFlow\.individualServices/);
  assert.match(composer, /offerFlow\.plans/);
  assert.match(composer, /offerFlow\.emptyApproved/);
  assert.doesNotMatch(composer, /<Input|onChangeText|hourlyPrice|durationHours|validForHours|notesPlaceholder/);
  assert.match(data, /approvedOfferId: string/);
  assert.match(data, /item\.approvalStatus === 'approved'/);
  assert.match(data, /approvedOfferId: approvedOffer\.id/);
});
