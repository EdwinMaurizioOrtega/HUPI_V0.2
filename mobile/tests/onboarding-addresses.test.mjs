import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  createEmptyAddress,
  normalizeAddress,
  normalizeAddressCollection,
  saveAddressInCollection,
  setOnlyDefaultAddress,
} from '../src/domain/address.ts';
import {
  getProfileFieldErrors,
  isCustomerProfileComplete,
} from '../src/domain/profile.ts';
import { en } from '../src/i18n/resources/en.ts';
import { es } from '../src/i18n/resources/es.ts';

const root = new URL('../', import.meta.url);
const read = (relativePath) => fs.readFileSync(new URL(relativePath, root), 'utf8');

function validProfile(overrides = {}) {
  return {
    id: 'user-test',
    firstName: 'Ana',
    lastName: 'Pérez',
    email: 'ana@example.com',
    phone: '+593999999999',
    city: '',
    sector: '',
    avatar: 'AP',
    profilePhotoUri: undefined,
    ...overrides,
  };
}

function validAddress(overrides = {}) {
  return {
    ...createEmptyAddress('2026-01-01T00:00:00.000Z'),
    streetAddress: 'Av. República',
    formattedAddress: 'Av. República',
    houseNumber: 'Departamento 4B',
    reference: 'Puerta azul',
    city: 'Quito',
    province: 'Pichincha',
    country: 'Ecuador',
    latitude: -0.18,
    longitude: -78.48,
    ...overrides,
  };
}

test('perfil exige nombre, apellido y correo válido; la foto sigue siendo opcional', () => {
  assert.equal(getProfileFieldErrors(validProfile({ firstName: '' })).firstName, 'required');
  assert.equal(getProfileFieldErrors(validProfile({ lastName: '' })).lastName, 'required');
  assert.equal(getProfileFieldErrors(validProfile({ email: '' })).email, 'required');
  assert.equal(getProfileFieldErrors(validProfile({ email: 'correo-invalido' })).email, 'invalid');
  assert.equal(isCustomerProfileComplete(validProfile({ profilePhotoUri: undefined })), true);
});

test('onboarding persiste el borrador, guard central bloquea la app y edición usa el mismo repositorio', () => {
  const onboarding = read('src/app/(onboarding)/onboarding-profile.tsx');
  const guard = read('src/startup/StartupRouteGuard.tsx');
  const repository = read('src/data/localAccountRepository.ts');
  const editProfile = read('src/app/client/edit-profile.tsx');

  assert.match(onboarding, /saveLocalProfileDraft/);
  assert.match(onboarding, /useEffect\(\(\) => \{\s*saveLocalProfileDraft\(profile\)/);
  assert.doesNotMatch(onboarding, /setProfile\(\(current\) => \{[\s\S]*saveLocalProfileDraft/);
  assert.match(onboarding, /disabled=\{!isComplete\}/);
  assert.match(guard, /resolveStartupRedirect/);
  assert.match(guard, /startupPaths\[destination\]/);
  assert.match(repository, /AsyncStorage\.setItem\(STORAGE_KEY/);
  assert.match(editProfile, /saveLocalCustomerProfile/);
});

test('normaliza direcciones antiguas sin perder sus datos', () => {
  const migrated = normalizeAddress({
    id: 'legacy',
    label: 'Trabajo',
    address: 'Av. Amazonas',
    formattedAddress: 'Av. Amazonas, Quito',
    sector: 'Iñaquito',
    city: 'Quito',
    province: 'Pichincha',
    reference: 'Piso 2',
    contactPhone: '+593999999999',
    latitude: -0.18,
    longitude: -78.47,
    isDefault: true,
  }, '2026-01-01T00:00:00.000Z');

  assert.equal(migrated.labelType, 'work');
  assert.equal(migrated.iconKey, 'briefcase');
  assert.equal(migrated.streetAddress, 'Av. Amazonas');
  assert.equal(migrated.reference, 'Piso 2');
  assert.equal(migrated.sector, 'Iñaquito');
  assert.equal(migrated.source, 'legacy');
});

test('crear genera ID y editar por ID no duplica', () => {
  const created = saveAddressInCollection([], validAddress());
  assert.equal(created.length, 1);
  assert.match(created[0].id, /^addr-/);
  assert.equal(created[0].houseNumber, 'Departamento 4B');
  assert.equal(created[0].reference, 'Puerta azul');

  const edited = saveAddressInCollection(created, {
    ...created[0],
    houseNumber: 'Casa 12',
  });
  assert.equal(edited.length, 1);
  assert.equal(edited[0].id, created[0].id);
  assert.equal(edited[0].houseNumber, 'Casa 12');
});

test('solo una dirección puede ser predeterminada y la migración corrige duplicadas', () => {
  const first = validAddress({ id: 'one', isDefault: true });
  const second = validAddress({ id: 'two', isDefault: true });
  const migrated = normalizeAddressCollection([first, second]);
  assert.equal(migrated.filter((item) => item.isDefault).length, 1);
  assert.equal(migrated[0].isDefault, true);

  const changed = setOnlyDefaultAddress(migrated, 'two');
  assert.equal(changed.filter((item) => item.isDefault).length, 1);
  assert.equal(changed.find((item) => item.id === 'two').isDefault, true);
});

test('etiqueta Otro guarda customLabel e iconKey técnicos', () => {
  const custom = normalizeAddress(validAddress({
    labelType: 'other',
    customLabel: 'Veterinaria',
    iconKey: 'medical',
    label: 'Veterinaria',
  }));
  assert.equal(custom.customLabel, 'Veterinaria');
  assert.equal(custom.iconKey, 'medical');
  assert.equal(custom.labelType, 'other');
  assert.doesNotMatch(custom.iconKey, /🐾|🏠/);
});

test('la lista es compacta, tiene alta rápida y creación/edición modal', () => {
  const screen = read('src/app/client/addresses.tsx');
  assert.match(screen, /presentationStyle="pageSheet"/);
  assert.match(screen, /openCreate/);
  assert.match(screen, /openEdit\(address\)/);
  assert.match(screen, /setDefaultLocalAddress/);
  assert.match(screen, /star-outline/);
  assert.match(screen, /onDirtyChange=\{setDirty\}/);
  assert.match(screen, /KeyboardAvoidingView/);
  assert.match(screen, /useTheme/);
  assert.doesNotMatch(screen, /useColorScheme/);
});

test('mapa nativo permite toque, pin manual y ubicación actual contempla permisos', () => {
  const map = read('src/components/addresses/AddressMap.native.tsx');
  const editor = read('src/components/addresses/AddressEditor.tsx');
  assert.match(map, /<MapView/);
  assert.match(map, /onPress=/);
  assert.match(map, /draggable/);
  assert.match(map, /onDragEnd=/);
  assert.match(editor, /requestForegroundPermissionsAsync/);
  assert.match(editor, /getCurrentPositionAsync/);
  assert.match(editor, /reverseGeocodeAsync/);
  assert.match(editor, /geocodeAsync/);
  assert.match(editor, /permissionDenied/);
  assert.match(editor, /source.*current_location/s);
  assert.match(editor, /addressSearchVersion/);
  assert.match(editor, /ECUADOR_PROVINCES/);
  assert.match(editor, /getEcuadorCities/);
  assert.doesNotMatch(editor, /centerOnAddress|addressBook\.recenter|recenterButton/);
  assert.equal((editor.match(/title=\{t\('addressBook\.useCurrentLocation'\)\}/g) ?? []).length, 1);
});

test('precarga las 24 provincias y guía la selección provincia ciudad', () => {
  const locations = read('src/constants/ecuadorLocations.ts');
  const editor = read('src/components/addresses/AddressEditor.tsx');
  const provinces = locations.match(/^  [^:\n]+: \[/gm) ?? [];
  assert.equal(provinces.length, 24);
  assert.match(locations, /Pichincha: \['Quito'/);
  assert.match(locations, /Guayas: \['Guayaquil'/);
  assert.match(editor, /selectProvinceFirst/);
  assert.match(editor, /disabled=\{!draft\.province\}/);
  assert.match(editor, /editable=\{false\}[\s\S]*addressBook\.country/);
});

test('todos los textos clave existen en español e inglés', () => {
  assert.equal(es.onboarding.profile.recoveryEmail, 'Correo de recuperación');
  assert.equal(en.onboarding.profile.recoveryEmail, 'Recovery email');
  assert.equal(es.addressBook.houseNumber, 'Número de casa / departamento');
  assert.equal(en.addressBook.houseNumber, 'House / apartment number');
  assert.equal(es.addressBook.defaultUpdated, 'Dirección predeterminada actualizada.');
  assert.equal(en.addressBook.defaultUpdated, 'Default address updated.');
  assert.ok(es.addressBook.reference.includes('Referencia'));
  assert.ok(en.addressBook.reference.includes('Reference'));
});
