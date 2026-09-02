import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { en } from '../src/i18n/resources/en.ts';
import { es } from '../src/i18n/resources/es.ts';
import {
  normalizeMarketplaceSearch,
  searchMarketplaceProducts,
  searchMarketplaceStores,
} from '../src/domain/marketplaceSearch.ts';

const root = new URL('../', import.meta.url);
const read = (relativePath) => fs.readFileSync(new URL(relativePath, root), 'utf8');

test('Perfil y títulos principales respetan safe area y permiten crecer', () => {
  const screen = read('src/components/ScreenContainer.tsx');
  const pageHeader = read('src/components/PageHeader.tsx');
  const profile = read('src/app/(tabs)/profile.tsx');
  const marketplace = read('src/app/(tabs)/marketplace.tsx');
  assert.match(screen, /SafeAreaView/);
  assert.match(screen, /edges=\{\['top'\]\}/);
  assert.match(profile, /headerCopy: \{ flex: 1, minWidth: 0 \}/);
  assert.match(profile, /title: \{[^}]*flexShrink: 1[^}]*lineHeight: 39/);
  assert.match(marketplace, /title: \{[^}]*flexShrink: 1[^}]*lineHeight: 39/);
  assert.doesNotMatch(profile, /header:[^\n]*overflow: 'hidden'/);
  assert.match(pageHeader, /paddingBottom: 2/);
  assert.match(pageHeader, /variant="pageTitle"/);
  assert.match(pageHeader, /variant="pageSubtitle"/);
  assert.match(pageHeader, /overflow: 'visible'/);
  assert.doesNotMatch(pageHeader, /height: 3[0-9]/);
});

test('Saldo Hupi reserva una caja Fredoka completa y reduce valores largos de forma controlada', () => {
  const profile = read('src/app/(tabs)/profile.tsx');
  assert.match(profile, /adjustsFontSizeToFit/);
  assert.match(profile, /minimumFontScale=\{0\.72\}/);
  assert.match(profile, /numberOfLines=\{1\}/);
  assert.match(profile, /balanceCopy: \{ flex: 1, minWidth: 0 \}/);
  assert.match(profile, /balanceAmount: \{[^}]*flexShrink: 1[^}]*lineHeight: 34[^}]*minHeight: 38[^}]*overflow: 'visible'/);
  for (const value of [0, 12.5, 1250.75, 10000]) {
    assert.equal(`$${value.toFixed(2)}`.includes('undefined'), false);
    assert.equal(`$${value.toFixed(2)}`.includes('NaN'), false);
  }
});

test('headers afectados usan PageHeader y la caja de Fredoka conserva padding', () => {
  const typography = read('src/i18n/components.tsx');
  const affectedScreens = [
    'src/app/(tabs)/support.tsx',
    'src/app/marketplace/wallet.tsx',
    'src/app/marketplace/orders.tsx',
    'src/app/marketplace/notifications.tsx',
    'src/app/marketplace/cart.tsx',
  ].map(read);

  assert.match(typography, /includeFontPadding: true/);
  for (const screen of affectedScreens) {
    assert.match(screen, /<PageHeader/);
  }
});

test('acciones Marketplace son horizontales, compactas y no recortan badges', () => {
  const marketplace = read('src/app/(tabs)/marketplace.tsx');
  const bell = read('src/components/NotificationBell.tsx');
  const iconButton = read('src/components/IconButton.tsx');
  assert.match(marketplace, /contentContainerStyle=\{styles\.headerActions\}[\s\S]*?horizontal/);
  assert.match(marketplace, /<NotificationBell compact/);
  assert.match(marketplace, /<IconButton[\s\S]*?badge=\{cartCount\}/);
  assert.match(bell, /<IconButton/);
  assert.match(iconButton, /overflow: 'visible'/);
  assert.match(iconButton, /minWidth: size/);
  assert.match(iconButton, /hitSlop=\{8\}/);
});

test('banners calculan ancho de ventana y admiten texto inglés más largo', () => {
  const marketplaceBanner = read('src/components/marketplace/MarketplaceBanner.tsx');
  const homeCarousel = read('src/features/home/PromoCarousel.tsx');
  for (const source of [marketplaceBanner, homeCarousel]) {
    assert.match(source, /useWindowDimensions/);
    assert.match(source, /flexShrink: 1/);
  }
  assert.match(marketplaceBanner, /Math\.min\(Math\.max\(width - 64, 248\), 340\)/);
  assert.match(homeCarousel, /snapToInterval=\{cardWidth \+ 12\}/);
  assert.match(homeCarousel, /minHeight: 176/);
});

test('listas horizontales conservan padding final y el grid mantiene dos columnas', () => {
  const marketplace = read('src/app/(tabs)/marketplace.tsx');
  const product = read('src/components/marketplace/ProductCard.tsx');
  const provider = read('src/components/providers/ProviderCard.tsx');
  assert.match(marketplace, /categories: \{[^}]*paddingRight: 20/);
  assert.match(marketplace, /storeRow: \{ paddingRight: 20 \}/);
  assert.match(product, /MARKETPLACE_GRID_HORIZONTAL_PADDING = 40/);
  assert.match(product, /MARKETPLACE_GRID_GAP = 12/);
  assert.match(product, /Math\.min\(Math\.max\(viewportWidth, 0\), MARKETPLACE_MOBILE_FRAME_WIDTH\)/);
  assert.match(product, /width: cardWidth/);
  assert.match(product, /numberOfLines=\{2\} style=\{styles\.name\}/);
  assert.match(product, /compactNarrow=\{useStackedActions\}/);
  assert.match(provider, /metricsCompact/);
  assert.match(provider, /actionsCompact/);
});

test('Home abre directamente el formulario de Paseo sin selector de servicios', () => {
  const home = read('src/app/(tabs)/home.tsx');
  const carousel = read('src/features/home/PromoCarousel.tsx');
  assert.match(home, /<ServiceForm serviceId="walk" \/>/);
  assert.doesNotMatch(home, /ServiceCard|servicesForYourPet|chooseOne|selectedService/);
  assert.match(home, /<PromoCarousel \/>/);
  assert.match(carousel, /router\.push\(promo\.targetRoute as Href\)/);
});

test('detalle Marketplace mantiene hero, miniaturas y barra de compra dentro del frame', () => {
  const detail = read('src/app/marketplace/product-detail.tsx');
  const cartBar = read('src/components/marketplace/QuickCartBar.tsx');
  assert.match(detail, /useWindowDimensions/);
  assert.match(detail, /Math\.min\(windowWidth, 560\)/);
  assert.match(detail, /height: heroHeight/);
  assert.match(detail, /galleryRow: \{[^}]*paddingRight: 20/);
  assert.match(detail, /emoji: \{[^}]*lineHeight: 132[^}]*textAlign: 'center'/);
  assert.match(detail, /title: \{[^}]*flexShrink: 1[^}]*lineHeight: 35/);
  assert.match(cartBar, /const compact = width < 360/);
  assert.match(cartBar, /const paddingBottom = floatingCompact/);
  assert.match(cartBar, /Math\.max\(insets\.bottom, 12\)/);
  assert.match(cartBar, /bottom: bottomOffset/);
});

test('tab bar flota sobre las pantallas y su wrapper permanece transparente', () => {
  const tabs = read('src/app/(tabs)/_layout.tsx');
  const screen = read('src/components/ScreenContainer.tsx');
  assert.match(tabs, /Math\.max\(insets\.bottom, FLOATING_TAB_BAR_MIN_BOTTOM_INSET\)/);
  assert.match(tabs, /numberOfLines=\{1\}/);
  assert.match(tabs, /width < 375/);
  assert.match(tabs, /height: FLOATING_TAB_BAR_HEIGHT \+ FLOATING_TAB_BAR_TOP_GAP \+ safeBottom/);
  assert.match(tabs, /paddingBottom: safeBottom/);
  assert.match(tabs, /position: 'absolute'/);
  assert.match(tabs, /bottom: 0/);
  assert.match(tabs, /overflow: 'visible'/);
  assert.match(tabs, /rgba\(255, 255, 255, 0\.94\)/);
  assert.match(tabs, /DARK_TAB_BAR_SURFACE = '#5b2a22'/);
  assert.match(tabs, /DARK_TAB_ACTIVE_SURFACE = '#fff8f5'/);
  assert.match(tabs, /DARK_TAB_ACTIVE_FOREGROUND = '#8c2f20'/);
  assert.match(tabs, /backgroundColor: 'transparent'/);
  assert.match(tabs, /name="marketplace"[\s\S]*?sceneStyle: \{ backgroundColor: tokens\.background \}/);
  assert.match(tabs, /name="support"[\s\S]*?sceneStyle: \{ backgroundColor: tokens\.background \}/);
  assert.match(tabs, /shadowOpacity: 0\.14/);
  assert.match(screen, /avoidFloatingTabBar/);
  assert.match(screen, /FLOATING_TAB_BAR_CONTENT_CLEARANCE/);
});

test('ajustes oscuros y carrito compacto quedan aislados a sus pantallas', () => {
  const marketplace = read('src/app/(tabs)/marketplace.tsx');
  const support = read('src/app/(tabs)/support.tsx');
  const quickCart = read('src/components/marketplace/QuickCartBar.tsx');
  const officialStore = read('src/app/marketplace/official-store.tsx');
  const productDetail = read('src/app/marketplace/product-detail.tsx');
  const cart = read('src/app/marketplace/cart.tsx');

  assert.match(support, /DARK_SUPPORT_BANNER_SURFACE = '#5b2a22'/);
  assert.match(support, /backgroundColor: DARK_SUPPORT_BANNER_SURFACE/);
  assert.match(quickCart, /variant\?: 'default' \| 'floatingCompact'/);
  assert.match(quickCart, /floatingCompactBar/);
  assert.match(quickCart, /DARK_COMPACT_CART_SURFACE = '#5b2a22'/);
  assert.match(marketplace, /variant="floatingCompact"/);
  assert.doesNotMatch(officialStore, /variant="floatingCompact"/);
  assert.doesNotMatch(productDetail, /variant="floatingCompact"/);
  assert.match(cart, /t\('marketplace\.cartProductCount', \{ count: cartProducts\.length \}\)/);
  assert.doesNotMatch(cart, /__hupi_i18n:common\.products/);
});

test('búsqueda Marketplace normaliza texto y cubre producto, marca, tienda, categoría y tags', () => {
  const products = [{
    name: 'Arnés urbano ajustable',
    brand: 'Urban Pet',
    storeName: 'Casa Colitas',
    category: 'Accesorios',
    tags: ['Recomendado', 'Paseo seguro'],
  }];
  const stores = [{
    name: 'Baños Felices',
    category: 'Higiene',
    categories: ['Piel sensible'],
  }];

  assert.equal(normalizeMarketplaceSearch('  HIGIÉNE   '), 'higiene');
  for (const query of ['arnes', 'Urban', 'colitas', 'accesorios', 'paseo seguro']) {
    assert.equal(searchMarketplaceProducts(products, query).length, 1);
  }
  assert.equal(searchMarketplaceProducts(products, 'alimento').length, 0);
  assert.equal(searchMarketplaceStores(stores, 'piel sensible').length, 1);

  const marketplace = read('src/app/(tabs)/marketplace.tsx');
  assert.match(marketplace, /onChangeText=\{setQuery\}/);
  assert.match(marketplace, /searchMarketplaceProducts\(marketplaceProducts, query\)/);
  assert.match(marketplace, /letterSpacing: 0/);
  assert.match(marketplace, /emptySearch/);
});

test('OTP usa seis celdas legibles, cursor propio y entrada nativa sin letterSpacing', () => {
  const otp = read('src/components/OtpInput.tsx');
  assert.match(otp, /const OTP_LENGTH = 6/);
  assert.match(otp, /height: 66/);
  assert.match(otp, /fontSize: 26/);
  assert.match(otp, /lineHeight: 34/);
  assert.match(otp, /textAlign: 'center'/);
  assert.match(otp, /styles\.cursor/);
  assert.match(otp, /textContentType="oneTimeCode"/);
  assert.doesNotMatch(otp, /letterSpacing/);
  assert.doesNotMatch(otp, /overflow: 'hidden'/);
});

test('reserva usa jerarquía Fredoka y conserva contenido regular o light', () => {
  const form = read('src/features/home/ServiceForm.tsx');
  const input = read('src/components/Input.tsx');
  const nativeFields = read('src/components/NativeDateTimeFields.tsx');
  const detail = read('src/app/client/booking-detail.tsx');
  const timeline = read('src/components/bookings/BookingTimeline.tsx');
  const confirmation = read('src/app/client/booking-confirmation.tsx');

  assert.match(input, /label: \{[\s\S]*?fontFamily: fonts\.semiBold/);
  assert.match(input, /input: \{[\s\S]*?fontFamily: fonts\.regular/);
  assert.match(input, /hint: \{[\s\S]*?fontFamily: fonts\.light/);
  assert.match(form, /inputLabel: \{[^}]*fontFamily: fonts\.semiBold/);
  assert.match(form, /readonlyValue: \{[^}]*fontFamily: fonts\.regular/);
  assert.doesNotMatch(form, /readonlyValue: \{[^}]*fontWeight/);
  assert.match(nativeFields, /readonlyValue: \{[^}]*fontFamily: fonts\.regular/);
  assert.doesNotMatch(nativeFields, /readonlyValue: \{[^}]*fontWeight/);
  assert.match(detail, /value: \{[^}]*fontFamily: fonts\.regular/);
  assert.match(timeline, /detail: \{[^}]*fontFamily: fonts\.light/);
  assert.match(confirmation, /messageText: \{[^}]*fontFamily: fonts\.regular/);
});

test('detalle elimina ayuda inerte y soporte abre un caso trazable', () => {
  const detail = read('src/app/client/booking-detail.tsx');
  const support = read('src/app/(tabs)/support.tsx');
  const mockData = read('src/constants/mockData.ts');
  assert.doesNotMatch(detail, /help-circle-outline|styles\.helpButton/);
  assert.match(detail, /openHupiSupport/);
  assert.match(detail, /bookingId=\$\{encodeURIComponent\(booking\.id\)\}/);
  assert.match(detail, /booking\.relatedOrderNumber/);
  assert.match(support, /setSupportView\('create'\)/);
  assert.match(support, /relatedBookingId: bookingId/);
  assert.match(support, /t\('support\.relatedBooking'\)/);
  assert.match(mockData, /relatedBookingId\?: string/);
  assert.match(mockData, /relatedBookingId,/);
});

test('calificación guarda el mock y confirma el envío con modal Hupi', () => {
  const review = read('src/components/bookings/ReviewPromptCard.tsx');
  const bookings = read('src/constants/mockBookings.ts');
  assert.match(review, /submitMockBookingReview\(bookingId/);
  assert.match(review, /title=\{t\('reviewPrompt\.thanksTitle'\)\}/);
  assert.match(review, /title=\{t\('reviewPrompt\.submit'\)\}/);
  assert.match(review, /<HupiSuccessModal/);
  assert.match(bookings, /mockBookingReviewsState/);
  assert.match(bookings, /export function submitMockBookingReview/);
});

test('tarjeta de proveedor reserva una columna flexible para ubicaciones largas', () => {
  const provider = read('src/components/providers/ProviderCard.tsx');
  assert.match(provider, /numberOfLines=\{2\} style=\{\[styles\.metricValue, styles\.locationValue\]\}/);
  assert.match(provider, /locationMetric: \{ flex: 1, flexGrow: 1\.6, minWidth: 0 \}/);
  assert.match(provider, /metricCopy: \{ flex: 1, minWidth: 0 \}/);
  assert.match(provider, /priceMetric:/);
  assert.match(provider, /experienceMetric:/);
});

test('web usa frame móvil sin modificar el estilo nativo', () => {
  const layout = read('src/app/_layout.tsx');
  assert.match(layout, /Platform\.OS === 'web' && styles\.webApplication/);
  assert.match(layout, /maxWidth: 600/);
  assert.match(layout, /application: \{ flex: 1, width: '100%' \}/);
});

test('reset y splash tienen textos completos en español e inglés', () => {
  assert.equal(es.settings.resetWelcomeConfirmTitle, '¿Reiniciar el flujo de bienvenida?');
  assert.equal(en.settings.resetWelcomeConfirmTitle, 'Reset the welcome flow?');
  assert.ok(es.settings.resetWelcomeConfirmMessage.includes('direcciones'));
  assert.ok(en.settings.resetWelcomeConfirmMessage.includes('addresses'));
  assert.ok(es.startup.brandFooter);
  assert.ok(en.startup.brandFooter);
});

test('dashboard proveedor permite que tarjetas, títulos, cifras y badges crezcan', () => {
  const provider = read('src/app/provider/index.tsx');
  assert.match(provider, /serviceCard: \{[^}]*minHeight: 112/);
  assert.match(provider, /serviceCopy: \{ flex: 1, minWidth: 0 \}/);
  assert.match(provider, /serviceTitle: \{[^}]*flexShrink: 1/);
  assert.match(provider, /serviceTitleRow: \{[^}]*flexWrap: 'wrap'/);
  assert.match(provider, /headerCopy: \{ flex: 1, minWidth: 0 \}/);
});
