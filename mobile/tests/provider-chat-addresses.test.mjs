import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  LOCATION_TYPES,
  MEETING_POINTS_BY_LOCATION,
  normalizeAddress,
} from '../src/domain/address.ts';
import { formatAverageResponseTime } from '../src/domain/responseTime.ts';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('las direcciones antiguas reciben preferencias seguras sin perder datos', () => {
  const address = normalizeAddress({
    id: 'legacy',
    label: 'Casa',
    address: 'Av. República, edificio Torre Norte',
    houseNumber: 'Departamento 802',
  });

  assert.equal(address.address, 'Av. República, edificio Torre Norte');
  assert.equal(address.deliveryPreferences.locationType, 'apartment_building');
  assert.equal(address.deliveryPreferences.meetingPointType, 'building_entrance');
  assert.equal(address.deliveryPreferences.handoffType, 'hand_to_customer');
  assert.equal(address.deliveryPreferences.arrivalContactPreference, 'chat');
});

test('los tipos de lugar ofrecen únicamente puntos de encuentro vigentes', () => {
  assert.deepEqual(LOCATION_TYPES, ['house', 'apartment_building', 'residential_complex', 'office_or_store']);
  assert.deepEqual(MEETING_POINTS_BY_LOCATION.house, [
    'house_exterior_door', 'garage_or_patio', 'meet_outside', 'other',
  ]);
  assert.ok(MEETING_POINTS_BY_LOCATION.apartment_building.includes('apartment_door'));
  assert.ok(MEETING_POINTS_BY_LOCATION.residential_complex.includes('house_entrance'));
  assert.ok(!MEETING_POINTS_BY_LOCATION.residential_complex.includes('block_entrance'));
  assert.ok(MEETING_POINTS_BY_LOCATION.office_or_store.includes('office_or_store_door'));
});

test('las preferencias históricas eliminadas migran sin borrar la dirección', () => {
  const safePlace = normalizeAddress({
    id: 'legacy-safe',
    label: 'Otro',
    address: 'Punto histórico sin categoría',
    deliveryPreferences: {
      locationType: 'other',
      meetingPointType: 'safe_place',
      handoffType: 'leave_at_location',
    },
  });
  const oldBlock = normalizeAddress({
    id: 'legacy-block',
    label: 'Conjunto',
    address: 'Conjunto residencial Los Pinos',
    deliveryPreferences: {
      locationType: 'residential_complex',
      meetingPointType: 'house_or_block_entrance',
    },
  });

  assert.equal(safePlace.deliveryPreferences.locationType, 'house');
  assert.equal(safePlace.deliveryPreferences.meetingPointType, 'house_exterior_door');
  assert.equal(safePlace.deliveryPreferences.handoffType, 'hand_to_customer');
  assert.equal(oldBlock.deliveryPreferences.meetingPointType, 'house_entrance');
});

test('el tiempo promedio se formatea con rangos deterministas', () => {
  const t = (key, options = {}) => `${key}:${options.count ?? ''}`;
  assert.equal(formatAverageResponseTime(2, t), 'chatPresence.responseAlmostImmediately:');
  assert.equal(formatAverageResponseTime(5, t), 'chatPresence.responseInMinutes:5');
  assert.equal(formatAverageResponseTime(20, t), 'chatPresence.responseUnderOneHour:');
  assert.equal(formatAverageResponseTime(75, t), 'chatPresence.responseAboutOneHour:');
  assert.equal(formatAverageResponseTime(180, t), 'chatPresence.responseInHours:3');
  assert.equal(formatAverageResponseTime(2880, t), 'chatPresence.responseInDays:2');
});

test('tarjetas, perfil y chat consumen datos centrales y no muestran la tarjeta automática', async () => {
  const [card, profile, chat, providers, pricing, presence] = await Promise.all([
    read('src/components/providers/ProviderCard.tsx'),
    read('src/app/client/provider-detail.tsx'),
    read('src/app/chat.tsx'),
    read('src/constants/mockProviders.ts'),
    read('src/domain/providerPricing.ts'),
    read('src/components/chat/PresenceStatus.tsx'),
  ]);

  assert.match(card, /getProviderWalkHourlyRate\(provider\)/);
  assert.match(profile, /getProviderWalkHourlyRate\(provider\)/);
  assert.doesNotMatch(chat, /defaultHourlyPrice|hourlyPrice=|durationHours=/);
  assert.match(pricing, /provider\.servicePrices\.walk/);
  assert.doesNotMatch(card, /__hupi_i18n:providerSearch\.hour|generated\.providerPricing/);
  assert.match(card, /provider\.isVerifiedByHupi \? <HupiVerifiedBadge/);
  assert.doesNotMatch(profile, /levelDescription/);
  assert.doesNotMatch(chat, /styles\.coordinationCard/);
  assert.match(chat, /OfferComposerModal/);
  assert.match(chat, /approvedOfferType/);
  assert.match(chat, /seenSafetyNoticeConversationIds/);
  assert.match(chat, /}, 5000\)/);
  assert.match(chat, /toValue: 1/);
  assert.match(chat, /toValue: 0/);
  assert.match(presence, /fontFamily: fonts\.light/);
  assert.match(presence, /tokens\.success/);
  assert.match(presence, /tokens\.textMuted/);
  assert.match(providers, /PROVIDER_SERVICE_PRICES_KEY/);
  assert.doesNotMatch(providers, /hourlyPrice: number/);
});

test('las opciones retiradas no permanecen en UI ni traducciones', async () => {
  const [addressDomain, editor, es, en] = await Promise.all([
    read('src/domain/address.ts'),
    read('src/components/addresses/AddressPreferencesEditor.tsx'),
    read('src/i18n/resources/es.ts'),
    read('src/i18n/resources/en.ts'),
  ]);

  assert.doesNotMatch(editor, /safe_place|block_entrance|house_or_block_entrance/);
  assert.doesNotMatch(es, /Dejar en un lugar seguro|Entrada del bloque/);
  assert.doesNotMatch(en, /Leave in a safe place|Block entrance/);
  assert.match(addressDomain, /rawMeetingPointType === 'safe_place'/);
});

test('las ofertas soportan el ciclo completo y checkout conserva el subtotal enviado', async () => {
  const [data, chat, checkout] = await Promise.all([
    read('src/constants/mockData.ts'),
    read('src/app/chat.tsx'),
    read('src/app/client/service-checkout.tsx'),
  ]);

  for (const status of ['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'cancelled']) {
    assert.match(data, new RegExp(`'${status}'`));
  }
  assert.match(chat, /offer\.id.*offerId=\$\{offer\.id\}/s);
  assert.match(checkout, /selectedOffer\?\.basePrice/);
  assert.match(checkout, /meetingPreferences: checkoutPreferences/);
});

test('crear, editar y ambos checkouts reutilizan Address y sus preferencias', async () => {
  const [editor, serviceCheckout, marketplaceCheckout] = await Promise.all([
    read('src/components/addresses/AddressEditor.tsx'),
    read('src/app/client/service-checkout.tsx'),
    read('src/app/marketplace/checkout.tsx'),
  ]);

  assert.match(editor, /AddressPreferencesEditor/);
  assert.match(serviceCheckout, /AddressPreferencesEditor context="service"/);
  assert.match(serviceCheckout, /savePreferencesToAddress/);
  assert.match(marketplaceCheckout, /type Address.*from '@\/domain\/address'/s);
  assert.doesNotMatch(marketplaceCheckout, /mockMarketplaceAddresses/);
  assert.match(marketplaceCheckout, /AddressEditor/);
});
