import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  getUnavailableMarketplaceCartItemIds,
  isMarketplaceProductPublishable,
  isMarketplaceStoreEnabled,
  removeUnavailableMarketplaceCartItems,
} from '../src/domain/marketplaceAvailability.ts';
import { en } from '../src/i18n/resources/en.ts';
import { es } from '../src/i18n/resources/es.ts';

const root = new URL('../', import.meta.url);
const read = (relativePath) => fs.readFileSync(new URL(relativePath, root), 'utf8');

test('un producto activo con stock se publica y uno agotado se oculta', () => {
  const enabledStore = {
    providerStatus: 'Aprobado',
    storeStatus: 'Habilitada',
  };
  const product = {
    isActive: true,
    productType: 'simple',
    status: 'Activo',
    stock: 5,
    stockStatus: 'Disponible',
  };

  assert.equal(isMarketplaceStoreEnabled(enabledStore), true);
  assert.equal(isMarketplaceProductPublishable(product, true), true);
  assert.equal(isMarketplaceProductPublishable({ ...product, stock: 0 }, true), false);
  assert.equal(isMarketplaceProductPublishable(product, false), false);
});

test('un producto variable requiere al menos una variante activa con stock', () => {
  const product = {
    productType: 'variable',
    status: 'Activo',
    variations: [
      { isActive: true, status: 'Activa', stock: 0 },
      { isActive: false, status: 'Activa', stock: 8 },
    ],
  };

  assert.equal(isMarketplaceProductPublishable(product), false);
  assert.equal(isMarketplaceProductPublishable({
    ...product,
    variations: [...product.variations, { isActive: true, status: 'Activa', stock: 3 }],
  }), true);
});

test('la limpieza elimina agotados o inactivos y conserva excesos de cantidad', () => {
  const items = [
    { id: 'available', quantity: 1 },
    { id: 'out-of-stock', quantity: 1 },
    { id: 'inactive-variation', quantity: 1 },
    { id: 'too-many', quantity: 7 },
  ];
  const issues = [
    { itemId: 'out-of-stock', type: 'product_unavailable' },
    { itemId: 'inactive-variation', type: 'variation_unavailable' },
    { itemId: 'too-many', type: 'quantity_exceeds_stock' },
  ];

  assert.deepEqual(
    getUnavailableMarketplaceCartItemIds(issues),
    ['out-of-stock', 'inactive-variation'],
  );
  assert.deepEqual(
    removeUnavailableMarketplaceCartItems(items, issues).map((item) => item.id),
    ['available', 'too-many'],
  );
  assert.deepEqual(
    removeUnavailableMarketplaceCartItems(items, [
      { itemId: 'too-many', type: 'quantity_exceeds_stock' },
    ]),
    items,
  );
  assert.deepEqual(
    removeUnavailableMarketplaceCartItems(items.slice(1, 3), issues),
    [],
  );
});

test('Marketplace, búsqueda, tiendas y carrito consumen el selector y la validación central', () => {
  const state = read('src/constants/marketplaceStoreState.ts');
  const marketplace = read('src/app/(tabs)/marketplace.tsx');
  const cart = read('src/app/marketplace/cart.tsx');

  assert.match(state, /getPublicMarketplaceProducts\(\)[\s\S]*?isMarketplaceProductPublishable/);
  assert.match(state, /getPublicMarketplaceStores\(\)[\s\S]*?isMarketplaceProductPublishable/);
  assert.match(marketplace, /searchMarketplaceProducts\(marketplaceProducts, query\)/);
  assert.match(cart, /removeUnavailableMarketplaceCartItems\(items, cartValidation\.issues\)/);
  assert.match(cart, /unavailableItemIds\.length > 0/);
  assert.match(cart, /unavailableItemIds\.length === 0 && hasQuantityIssues/);
  assert.doesNotMatch(cart, /viewCartIssues/);
});

test('wrappers flotantes son transparentes y el badge agotado usa error rojo', () => {
  const tabs = read('src/app/(tabs)/_layout.tsx');
  const quickCart = read('src/components/marketplace/QuickCartBar.tsx');
  const cartCard = read('src/components/marketplace/CartItemCard.tsx');

  assert.match(tabs, /<NativeView[\s\S]*?pointerEvents="box-none"/);
  assert.match(tabs, /backgroundColor: 'transparent'/);
  assert.match(quickCart, /styles\.floatingWrapper/);
  assert.match(quickCart, /pointerEvents="box-none"/);
  assert.match(quickCart, /floatingWrapper: \{[\s\S]*?backgroundColor: 'transparent'/);
  assert.match(cartCard, /badgeUnavailable: \{ backgroundColor: colors\.danger \}/);
  assert.match(cartCard, /badgeTextUnavailable: \{ color: colors\.white \}/);
});

test('las acciones nuevas del carrito existen en español e inglés', () => {
  assert.equal(es.marketplace.removeUnavailableProducts, 'Quitar productos sin stock');
  assert.equal(en.marketplace.removeUnavailableProducts, 'Remove out-of-stock products');
  assert.equal(es.marketplace.cartUpdatedTitle, 'Carrito actualizado');
  assert.equal(en.marketplace.cartUpdatedTitle, 'Cart updated');
});
