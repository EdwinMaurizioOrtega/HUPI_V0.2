import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  isValidShippingCostInput,
  isValidShippingHoursInput,
  parseShippingCost,
} from '../src/domain/providerShipping.ts';
import { getSpecialWalkConditions } from '../src/domain/providerCancellationPolicy.ts';
import { en } from '../src/i18n/resources/en.ts';
import { es } from '../src/i18n/resources/es.ts';

const root = new URL('../', import.meta.url);
const read = (relativePath) => fs.readFileSync(new URL(relativePath, root), 'utf8');
const translateFrom = (resource) => (key) => key.split('.').reduce((value, segment) => value?.[segment], resource) ?? key;

test('condición informativa de extensión de 40 minutos existe en ambos idiomas y en perfil público/configuración', () => {
  const spanish = getSpecialWalkConditions(translateFrom(es));
  const english = getSpecialWalkConditions(translateFrom(en));
  const editor = read('src/components/provider/ProviderWalkProfileEditor.tsx');
  const publicProfile = read('src/app/client/provider-detail.tsx');

  assert.match(spanish.find((item) => item.id === 'operational_delay_extension')?.description ?? '', /40 minutos adicionales/);
  assert.match(english.find((item) => item.id === 'operational_delay_extension')?.description ?? '', /40 additional minutes/);
  assert.equal(spanish.find((item) => item.id === 'operational_delay_extension')?.isSelectable, false);
  assert.match(editor, /<WalkSpecialConditionsAccordion \/>/);
  assert.match(publicProfile, /<WalkSpecialConditionsAccordion \/>/);
});

test('notificaciones accionables permiten tap completo, swipe horizontal y CTA coral', () => {
  const swipe = read('src/components/notifications/SwipeableNotification.tsx');
  const provider = read('src/app/provider/notifications.tsx');
  const client = read('src/app/marketplace/notifications.tsx');

  assert.match(swipe, /onPress=\{onOpen \?\? onPress\}/);
  assert.match(swipe, /Math\.abs\(gesture\.dx\) > Math\.abs\(gesture\.dy\) \* 1\.5/);
  assert.match(swipe, /gesture\.dx <= -SWIPE_THRESHOLD/);
  assert.match(swipe, /completeSwipe\('open'\)/);
  assert.match(swipe, /gesture\.dx >= SWIPE_THRESHOLD/);
  assert.match(swipe, /completeSwipe\('delete'\)/);
  assert.match(swipe, /notificationActions\.open/);
  assert.match(swipe, /notificationActions\.delete/);
  for (const source of [provider, client]) {
    assert.match(source, /<SwipeableNotification/);
    assert.match(source, /actionButton: \{[^}]*backgroundColor: colors\.primary/);
    assert.match(source, /actionText: \{ color: colors\.white/);
  }
});

test('notificaciones proveedor corrige contador y elimina marcar todo como leído', () => {
  const notifications = read('src/app/provider/notifications.tsx');
  assert.match(notifications, /providerNotifications\.unreadCount/);
  assert.doesNotMatch(notifications, /markAllProviderNotificationsAsRead|markAllAsRead|markAllAsRead/);
  assert.doesNotMatch(notifications, /35_hupi_i18/);
  assert.doesNotMatch(notifications, /subtitle=\{<>[\s\S]*?__hupi_i18n/);
});

test('edición de planes usa modal con scroll, teclado, safe area, guardar y cancelar', () => {
  const editor = read('src/components/provider/ProviderWalkProfileEditor.tsx');
  assert.match(editor, /<Modal animationType="slide"/);
  assert.match(editor, /<KeyboardAvoidingView/);
  assert.match(editor, /<ScrollView contentContainerStyle=\{styles\.planEditor\}/);
  assert.match(editor, /useSafeAreaInsets/);
  assert.match(editor, /title=\{t\('common\.cancel'\)\}/);
  assert.match(editor, /title=\{t\('common\.save'\)\}/);
  assert.doesNotMatch(editor, /\{editingPlan \? \(\s*<View style=\{styles\.planEditor\}>/);
});

test('configuración de envío limita horas y acepta coma monetaria normalizada', () => {
  const shipping = read('src/app/provider/shipping-settings.tsx');
  assert.equal(isValidShippingHoursInput('48'), true);
  assert.equal(isValidShippingHoursInput('48h'), false);
  assert.equal(isValidShippingHoursInput('2 horas'), false);
  for (const value of ['10', '10,5', '10,50', '10.50']) assert.equal(isValidShippingCostInput(value), true);
  for (const value of ['10,5,0', '10.555', 'USD 10']) assert.equal(isValidShippingCostInput(value), false);
  assert.equal(parseShippingCost('10,50'), 10.5);
  assert.equal(parseShippingCost('texto'), 0);
  assert.match(shipping, /keyboardType="number-pad"/);
  assert.match(shipping, /shippingSettings\.hours/);
});

test('Mis productos no muestra keys crudas ni ofrece Icono visual', () => {
  const products = read('src/app/provider/products.tsx');
  const editor = read('src/app/provider/product-editor.tsx');
  assert.match(products, /providerProducts\.count/);
  assert.doesNotMatch(products, /4_hupi_i18n|subtitle=\{<>[\s\S]*?__hupi_i18n/);
  assert.doesNotMatch(editor, /common\.visualIcon|updateField\('emoji', value\)/);
  assert.match(editor, /productImages/);
  assert.match(editor, /mainImageId/);
});

test('pedidos Marketplace inicia contraído, expande uno y gestiona desde el detalle', () => {
  const orders = read('src/app/provider/marketplace-orders.tsx');
  assert.match(orders, /useState<string \| null>\(null\)/);
  assert.match(orders, /expanded=\{expandedOrderId === order\.providerOrderId\}/);
  assert.match(orders, /current === order\.providerOrderId \? null : order\.providerOrderId/);
  assert.match(orders, /accessibilityState=\{\{ expanded \}\}/);
  assert.match(orders, /\{expanded \? <>/);
  assert.match(orders, /provider\/marketplace-order-detail\?providerOrderId=/);
});

test('evidencia aparece únicamente al preparar el cambio a En camino', () => {
  const detail = read('src/app/provider/marketplace-order-detail.tsx');
  assert.match(detail, /nextStatus === 'En camino'/);
  assert.match(detail, /providerOrders\.attachEvidence/);
  assert.match(detail, /status === 'En camino' && evidenceRequired && !order\.deliveryEvidence/);
  assert.doesNotMatch(detail, /status === 'Entregado' && evidenceRequired/);
  assert.doesNotMatch(detail, /proofOfDelivery/);
});

test('Mi tienda no duplica Notificaciones dentro de sus herramientas', () => {
  const store = read('src/app/provider/marketplace-store.tsx');
  const cards = store.match(/const actionCards = \[([\s\S]*?)\] as const;/)?.[1] ?? '';
  assert.doesNotMatch(cards, /Notificaciones|provider\/notifications/);
  assert.match(store, /Pedidos marketplace/);
  assert.match(store, /Mis productos/);
  assert.match(store, /Métodos de envío/);
});

test('dashboard proveedor muestra macroservicios, header y progreso sin duplicar herramientas o solicitudes', () => {
  const dashboard = read('src/app/provider/index.tsx');
  assert.match(dashboard, /providerDashboard\.walks/);
  assert.match(dashboard, /providerDashboard\.marketplaceStore/);
  assert.match(dashboard, /providerApproved \? '\/provider\/walks' : '\/provider\/verification'/);
  assert.match(dashboard, /providerApproved \? '\/provider\/marketplace-store' : '\/provider\/verification'/);
  assert.match(dashboard, /router\.push\('\/provider\/verification'/);
  assert.match(dashboard, /router\.push\('\/provider\/messages'/);
  assert.match(dashboard, /router\.push\('\/provider\/notifications'/);
  assert.doesNotMatch(dashboard, /router\.push\('\/provider\/(products|marketplace-orders|shipping-settings)'/);
  assert.doesNotMatch(dashboard, /serviceRequests\.map|coordinationRequests\.map/);
  assert.doesNotMatch(dashboard, /ProviderShortcut|marketplaceGrid/);
});

test('Paseos conserva navegación interna a agendamientos, solicitudes, planes y tarifa', () => {
  const walks = read('src/app/provider/walks.tsx');
  for (const section of ["setActiveSection('appointments')", "setActiveSection('requests')", "setActiveSection('plans')", "setActiveSection('rate')", "setActiveSection('publicProfile')"]) {
    assert.match(walks, new RegExp(section.replace(/[()]/g, '\\$&')));
  }
  assert.match(walks, /getMockBookings/);
  assert.match(walks, /getMockProviderRequests/);
  assert.match(walks, /ProviderWalkProfileEditor/);
  assert.match(walks, /saveMockProviderServicePrice/);
});
