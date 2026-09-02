import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { createInstance } from 'i18next';

import generatedEn from '../src/i18n/generated/en.json' with { type: 'json' };
import generatedEs from '../src/i18n/generated/es.json' with { type: 'json' };
import { en } from '../src/i18n/resources/en.ts';
import { es } from '../src/i18n/resources/es.ts';
import {
  defaultLanguage,
  languageStorageKey,
  localesByLanguage,
  resolveLanguagePreference,
} from '../src/i18n/types.ts';

const resources = {
  es: { translation: { ...es, generated: generatedEs } },
  en: { translation: { ...en, generated: generatedEn } },
};

async function createI18n(language, fallbackLng = defaultLanguage) {
  const instance = createInstance();
  await instance.init({
    fallbackLng,
    interpolation: { escapeValue: false },
    lng: language,
    resources,
    returnNull: false,
  });
  return instance;
}

test('selecciona español en un dispositivo español', () => {
  assert.equal(resolveLanguagePreference(null, 'es'), 'es');
});

test('selecciona inglés en un dispositivo inglés', () => {
  assert.equal(resolveLanguagePreference(null, 'en'), 'en');
});

test('usa español para un idioma de dispositivo no soportado', () => {
  assert.equal(resolveLanguagePreference(null, 'fr'), 'es');
});

test('el idioma guardado prevalece sobre el idioma del dispositivo y simula el reinicio', () => {
  assert.equal(resolveLanguagePreference('en', 'es'), 'en');
  assert.equal(languageStorageKey, 'hupi.language');
});

test('el fallback inglés ausente muestra español y no la clave técnica', async () => {
  const instance = await createI18n('en');
  instance.addResource('es', 'translation', 'test.fallback', 'Texto de respaldo');
  assert.equal(instance.t('test.fallback'), 'Texto de respaldo');
});

test('el cambio de idioma se refleja inmediatamente en la misma instancia', async () => {
  const instance = await createI18n('es');
  assert.equal(instance.t('navigation.bookings'), 'Reservas');
  await instance.changeLanguage('en');
  assert.equal(instance.t('navigation.bookings'), 'Bookings');
});

test('pluraliza paseos, mascotas y horas en ambos idiomas', async () => {
  const instance = await createI18n('es');
  assert.equal(instance.t('common.walkCount', { count: 1 }), '1 paseo');
  assert.equal(instance.t('common.walkCount', { count: 2 }), '2 paseos');
  assert.equal(instance.t('common.petCount', { count: 3 }), '3 mascotas');
  await instance.changeLanguage('en');
  assert.equal(instance.t('common.walkCount', { count: 1 }), '1 walk');
  assert.equal(instance.t('common.walkCount', { count: 2 }), '2 walks');
  assert.equal(instance.t('common.hourCount', { count: 2 }), '2 hours');
});

test('pluraliza el subtítulo de Carrito sin exponer claves técnicas', async () => {
  const instance = await createI18n('es');
  assert.equal(instance.t('marketplace.cartProductCount', { count: 1 }), '1 producto');
  assert.equal(instance.t('marketplace.cartProductCount', { count: 3 }), '3 productos');
  await instance.changeLanguage('en');
  assert.equal(instance.t('marketplace.cartProductCount', { count: 1 }), '1 product');
  assert.equal(instance.t('marketplace.cartProductCount', { count: 3 }), '3 products');
});

test('pluraliza el contador de Pedidos marketplace proveedor sin exponer claves técnicas', async () => {
  const instance = await createI18n('es');
  assert.equal(instance.t('provider.marketplaceOrders.confirmedCount', { count: 1 }), '1 pedido confirmado');
  assert.equal(instance.t('provider.marketplaceOrders.confirmedCount', { count: 2 }), '2 pedidos confirmados');
  await instance.changeLanguage('en');
  assert.equal(instance.t('provider.marketplaceOrders.confirmedCount', { count: 1 }), '1 confirmed order');
  assert.equal(instance.t('provider.marketplaceOrders.confirmedCount', { count: 2 }), '2 confirmed orders');
});

test('interpola nombres y horas sin concatenar fragmentos', async () => {
  const instance = await createI18n('en');
  assert.equal(instance.t('home.greeting', { name: 'Ana' }), 'Hi, Ana');
  assert.equal(instance.t('walks.startsIn', { count: 2 }), 'Your walk starts in 2 hours.');
});

test('formatea fechas y moneda con el locale elegido sin cambiar USD', () => {
  const date = new Date('2026-07-26T10:30:00-05:00');
  const spanish = new Intl.DateTimeFormat(localesByLanguage.es, { dateStyle: 'long' }).format(date);
  const english = new Intl.DateTimeFormat(localesByLanguage.en, { dateStyle: 'long' }).format(date);
  assert.match(spanish, /26.*julio.*2026/i);
  assert.match(english, /July.*26.*2026/i);
  assert.match(new Intl.NumberFormat(localesByLanguage.en, { currency: 'USD', style: 'currency' }).format(10), /10/);
});

test('incluye todos los estados de aprobación de planes en ambos idiomas', () => {
  const statuses = ['draft', 'pendingApproval', 'changesRequested', 'approved', 'rejected', 'suspended', 'archived', 'superseded'];
  for (const status of statuses) {
    assert.ok(es.providerPlans.status[status]);
    assert.ok(en.providerPlans.status[status]);
  }
  assert.equal(en.providerPlans.status.superseded, 'Superseded');
});

test('navegación, login y Configuración usan el selector y recursos traducidos', () => {
  const tabs = fs.readFileSync(new URL('../src/app/(tabs)/_layout.tsx', import.meta.url), 'utf8');
  const login = fs.readFileSync(new URL('../src/app/(auth)/login.tsx', import.meta.url), 'utf8');
  const settings = fs.readFileSync(new URL('../src/app/client/settings.tsx', import.meta.url), 'utf8');
  assert.match(tabs, /navigation\.bookings/);
  assert.match(login, /LanguageSelectorModal/);
  assert.match(settings, /LanguageSelectorModal/);
});

test('el selector contempla modo oscuro y accesibilidad', () => {
  const selector = fs.readFileSync(new URL('../src/components/LanguageSelectorModal.tsx', import.meta.url), 'utf8');
  assert.match(selector, /useTheme/);
  assert.doesNotMatch(selector, /useColorScheme/);
  assert.match(selector, /accessibilityRole="radio"/);
  assert.match(selector, /announceForAccessibility/);
});

test('el wrapper de prompt no falla al importarse en web y conserva i18n', () => {
  const components = fs.readFileSync(new URL('../src/i18n/components.tsx', import.meta.url), 'utf8');
  const rootLayout = fs.readFileSync(new URL('../src/app/_layout.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(components, /\.bind\(NativeAlert\)/);
  assert.doesNotMatch(components, /window\.prompt/);
  assert.match(components, /Platform\.OS !== 'ios'/);
  assert.match(components, /typeof NativeAlert\.prompt !== 'function'/);
  assert.match(components, /LocalizedPromptHost/);
  assert.match(components, /translateVisibleText\(options\.title\)/);
  assert.match(components, /translateVisibleText\(options\.message\)/);
  assert.match(components, /translateVisibleText\(options\.placeholder\)/);
  assert.match(components, /acceptText.*i18n\.t\('common\.confirm'\)/s);
  assert.match(components, /cancelText.*i18n\.t\('common\.cancel'\)/s);
  assert.match(components, /translateVisibleText\(validationMessage\)/);
  assert.match(rootLayout, /<LocalizedPromptHost \/>/);
});
