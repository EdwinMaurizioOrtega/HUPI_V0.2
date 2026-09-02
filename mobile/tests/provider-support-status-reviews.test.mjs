import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  getBookingStatusPresentation,
  getSupportCaseStatusPresentation,
  HUPI_STATUS_BLUE,
} from '../src/domain/statusPresentation.ts';
import { getMockProviderReviewSummary } from '../src/constants/mockProviderReviews.ts';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const t = (key) => key;

test('términos salen del perfil público y permanecen obligatorios solo en checkout', async () => {
  const [profile, checkout, acceptance, button] = await Promise.all([
    read('src/app/client/provider-detail.tsx'),
    read('src/app/client/service-checkout.tsx'),
    read('src/components/provider/ProviderTermsAcceptanceBlock.tsx'),
    read('src/components/Button.tsx'),
  ]);
  assert.doesNotMatch(profile, /public\.terms|acceptsProviderTerms|ProviderTermsAcceptanceBlock/);
  assert.match(checkout, /placement="checkout"/);
  assert.match(checkout, /canConfirm = acceptsServiceTerms && acceptsPrivacyPolicy/);
  assert.match(checkout, /acceptsServiceTerms \? 'providerProfile\.acceptance\.completeRequired'/);
  assert.match(acceptance, /placement !== 'checkout'/);
  assert.match(acceptance, /providerProfile\.acceptance\.standardCheckbox/);
  assert.match(acceptance, /ProviderTermsModal/);
  assert.match(button, /onDisabledPress/);
});

test('reseñas usan datos mock centralizados y vista consultable', async () => {
  const [profile, modal] = await Promise.all([
    read('src/app/client/provider-detail.tsx'),
    read('src/components/provider/ProviderReviewsModal.tsx'),
  ]);
  const summary = getMockProviderReviewSummary('provider-andres');
  assert.equal(Object.values(summary.distribution).reduce((total, value) => total + value, 0), 128);
  assert.ok(summary.reviews.length > 0);
  assert.match(profile, /ProviderReviewsModal/);
  assert.match(profile, /providerReviews\.view/);
  assert.match(modal, /providerReviews\.empty/);
  assert.match(modal, /distribution/);
});

test('escudo verificado usa exclusivamente el azul solicitado', async () => {
  const badge = await read('src/components/providers/HupiVerifiedBadge.tsx');
  assert.match(badge, /HUPI_VERIFIED_BLUE = '#0096FF'/);
  assert.match(badge, /verifiedBadge\.accessibilityLabel/);
});

test('reservas aplican la presentación central por estado', () => {
  const confirmed = getBookingStatusPresentation('Confirmada', false, t);
  const completed = getBookingStatusPresentation('Completada', false, t);
  const cancelled = getBookingStatusPresentation('Cancelada', false, t);
  const current = getBookingStatusPresentation('En curso', false, t);
  assert.equal(confirmed.textColor, '#237A58');
  assert.equal(completed.textColor, '#716D69');
  assert.equal(cancelled.textColor, '#B43838');
  assert.equal(current.textColor, HUPI_STATUS_BLUE);
});

test('soporte aplica azul, verde y gris desde el helper central', () => {
  assert.equal(getSupportCaseStatusPresentation('En revisión', false, t).textColor, '#0096FF');
  assert.equal(getSupportCaseStatusPresentation('Abierto', false, t).textColor, '#237A58');
  assert.equal(getSupportCaseStatusPresentation('Cerrado', false, t).textColor, '#716D69');
});

test('crear caso usa selector modal y valida el motivo Otro', async () => {
  const [support, picker] = await Promise.all([
    read('src/app/(tabs)/support.tsx'),
    read('src/components/support/SupportReasonPicker.tsx'),
  ]);
  assert.match(support, /category === 'other'/);
  assert.match(support, /trimmedOtherReason\.length < 5/);
  assert.match(support, /maxLength=\{120\}/);
  assert.match(picker, /animationType="slide"/);
  assert.match(picker, /supportReasonPicker\.placeholder/);
});

test('redes sociales usan URLs oficiales, accesibilidad y manejo seguro', async () => {
  const [data, support] = await Promise.all([
    read('src/constants/mockData.ts'),
    read('src/app/(tabs)/support.tsx'),
  ]);
  for (const url of [
    'https://www.instagram.com/hupi.pet',
    'https://www.facebook.com/hupi.pet',
    'https://www.tiktok.com/@hupi.pet',
    'https://www.linkedin.com/company/hupi-pet/',
    'https://www.hupi.pet/',
  ]) assert.match(data, new RegExp(url.replace(/[./@-]/g, '\\$&')));
  assert.match(support, /Linking\.canOpenURL/);
  assert.match(support, /Linking\.openURL/);
  assert.match(support, /socialLinks\.errorTitle/);
});
