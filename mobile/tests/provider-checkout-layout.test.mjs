import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relativePath) => fs.readFileSync(new URL(relativePath, root), 'utf8');

const providerHeaderRoutes = [
  'src/app/provider/marketplace-finance.tsx',
  'src/app/provider/marketplace-order-detail.tsx',
  'src/app/provider/marketplace-orders.tsx',
  'src/app/provider/marketplace-store.tsx',
  'src/app/provider/messages.tsx',
  'src/app/provider/notifications.tsx',
  'src/app/provider/product-editor.tsx',
  'src/app/provider/products.tsx',
  'src/app/provider/shipping-settings.tsx',
  'src/app/provider/store-profile.tsx',
  'src/app/provider/verification.tsx',
  'src/app/provider/walks.tsx',
];

test('todas las rutas proveedor con topbar usan el header específico sin recorte', () => {
  const providerHeader = read('src/components/provider/ProviderPageHeader.tsx');

  assert.match(providerHeader, /numberOfLines=\{2\}/);
  assert.match(providerHeader, /fontSize: 27/);
  assert.match(providerHeader, /lineHeight: 35/);
  assert.match(providerHeader, /paddingBottom: 2/);
  assert.match(providerHeader, /overflow: 'visible'/);
  const titleStyle = providerHeader.match(/title: \{([\s\S]*?)\n  \},/)?.[1] ?? '';
  assert.doesNotMatch(titleStyle, /\bheight:/);
  assert.doesNotMatch(titleStyle, /\bmaxHeight:/);

  for (const route of providerHeaderRoutes) {
    assert.match(read(route), /<ProviderPageHeader/);
  }
});

test('dashboard proveedor protege cabecera, cifras y tarjetas macro Fredoka', () => {
  const dashboard = read('src/app/provider/index.tsx');

  assert.match(dashboard, /headerCopy: \{ flex: 1, minWidth: 0 \}/);
  assert.match(dashboard, /serviceCopy: \{ flex: 1, minWidth: 0 \}/);
  assert.match(dashboard, /metricValue: \{[^}]*fontSize: 19[^}]*lineHeight: 25/);
  assert.match(dashboard, /serviceTitle: \{[^}]*flexShrink: 1[^}]*lineHeight: 23/);
});

test('Checkout separa productos sin divisor después del último', () => {
  const checkout = read('src/app/marketplace/checkout.tsx');

  assert.match(checkout, /showDivider=\{index < cartProducts\.length - 1\}/);
  assert.match(checkout, /styles\.productBlock, showDivider && styles\.productBlockDivider/);
  assert.match(checkout, /productBlock: \{ paddingVertical: 12 \}/);
  assert.match(checkout, /productBlockDivider: \{ borderBottomWidth: 1, borderBottomColor: colors\.border \}/);
  assert.match(checkout, /productRow: \{[^}]*alignItems: 'flex-start'/);
  assert.match(checkout, /removeProductButton: \{[^}]*marginTop: 2/);
  assert.match(checkout, /\{issueLabel \? <Text style=\{styles\.productIssue\}>\{issueLabel\}<\/Text> : null\}/);
});

test('Hupi Crédito usa el verde Disponible solo en su variante oscura', () => {
  const checkout = read('src/app/marketplace/checkout.tsx');
  const colors = read('src/constants/colors.ts');

  assert.match(colors, /success: '#32966f'/);
  assert.match(checkout, /darkMode && styles\.hupiBalanceCardDark/);
  assert.match(checkout, /hupiBalanceCardDark: \{[^}]*backgroundColor: colors\.success/);
  assert.match(checkout, /hupiBalanceTitle: \{ color: colors\.success/);
  assert.match(checkout, /balanceCheckboxDark/);
  assert.match(checkout, /Math\.min\(hupiBalance\.available, totalBeforeHupiBalance\)/);
});

test('Confirmar compra flota dentro de wrapper transparente y conserva safe area', () => {
  const checkout = read('src/app/marketplace/checkout.tsx');

  assert.match(checkout, /<NativeView[\s\S]*?pointerEvents="box-none"/);
  assert.match(checkout, /bottom: Math\.max\(insets\.bottom, 12\)/);
  assert.match(checkout, /bottomBarWrapper: \{[\s\S]*?backgroundColor: 'transparent'/);
  assert.match(checkout, /bottomBar: \{[\s\S]*?borderRadius: 22/);
  assert.match(checkout, /paddingBottom: 180 \+ Math\.max\(insets\.bottom, 12\)/);
  assert.match(checkout, /disabled=\{!canConfirmPurchase\}/);
  assert.match(checkout, /onPress=\{confirmPurchase\}/);
});

test('Pedidos proveedor traduce contador y filtros sin renderizar una llave cruda', () => {
  const orders = read('src/app/provider/marketplace-orders.tsx');
  const es = read('src/i18n/resources/es.ts');
  const en = read('src/i18n/resources/en.ts');

  assert.match(orders, /t\('provider\.marketplaceOrders\.confirmedCount', \{ count: newOrdersCount \}\)/);
  assert.match(orders, /t\(filterTranslationKeys\[filter\]\)/);
  assert.doesNotMatch(orders, /subtitle=\{<>[\s\S]*?__hupi_i18n:/);
  assert.match(es, /confirmedCount_one: '\{\{count\}\} pedido confirmado'/);
  assert.match(es, /confirmedCount_other: '\{\{count\}\} pedidos confirmados'/);
  assert.match(en, /confirmedCount_one: '\{\{count\}\} confirmed order'/);
  assert.match(en, /confirmedCount_other: '\{\{count\}\} confirmed orders'/);
});

test('Perfil de tienda limita la superficie morada a sus campos readonly oscuros', () => {
  const storeProfile = read('src/app/provider/store-profile.tsx');

  assert.match(storeProfile, /function ReadOnlyMutedField/);
  assert.match(storeProfile, /const \{ isDark, tokens \} = useTheme\(\)/);
  assert.match(storeProfile, /isDark && \{[\s\S]*?backgroundColor: tokens\.surfacePurple/);
  assert.match(storeProfile, /borderColor: tokens\.border/);
  assert.match(storeProfile, /opacity: 1/);
});

test('Checkout y subsecciones de Perfil dejan crecer la caja tipográfica Fredoka', () => {
  const checkout = read('src/app/marketplace/checkout.tsx');
  const profileRoutes = [
    'src/app/(tabs)/profile.tsx',
    'src/app/client/edit-profile.tsx',
    'src/app/client/billing.tsx',
    'src/app/client/payment-methods.tsx',
    'src/app/client/terms.tsx',
    'src/app/client/privacy.tsx',
    'src/app/client/pets.tsx',
    'src/app/client/pet-detail.tsx',
    'src/app/client/pet-form.tsx',
    'src/app/client/pet-stats.tsx',
    'src/app/client/favorites.tsx',
    'src/app/client/settings.tsx',
    'src/app/client/addresses.tsx',
  ];

  assert.match(checkout, /title: \{[^}]*fontSize: 28[^}]*lineHeight: 36[^}]*overflow: 'visible'/);
  assert.match(checkout, /subtitle: \{[^}]*fontSize: 13[^}]*lineHeight: 20[^}]*overflow: 'visible'/);

  for (const route of profileRoutes) {
    const source = read(route);
    assert.match(source, /title: \{[^}]*lineHeight: \d+[^}]*overflow: 'visible'[^}]*paddingBottom: 2/);
  }
});

test('Marketplace y Chat reutilizan el fondo correcto de Perfil bajo el tab bar', () => {
  const tabs = read('src/app/(tabs)/_layout.tsx');

  assert.match(tabs, /pointerEvents="box-none"/);
  assert.match(tabs, /backgroundColor: 'transparent'/);
  for (const route of ['marketplace', 'profile', 'support']) {
    assert.match(
      tabs,
      new RegExp(`name="${route}"[\\s\\S]*?sceneStyle: \\{ backgroundColor: tokens\\.background \\}`),
    );
  }
});
