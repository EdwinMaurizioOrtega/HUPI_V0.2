import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { resolveQaOnboardingEnabled } from '../src/config/qaMode.ts';
import {
  formatIconBadge,
  resolveIconButtonIconSize,
} from '../src/domain/iconButton.ts';

const root = new URL('../', import.meta.url);
const read = (relativePath) => fs.readFileSync(new URL(relativePath, root), 'utf8');

test('QA nativo se activa por __DEV__ y producción respeta persistencia', () => {
  assert.equal(resolveQaOnboardingEnabled(true), true);
  assert.equal(resolveQaOnboardingEnabled(false), false);
  const environment = read('src/config/environment.ts');
  assert.match(environment, /typeof __DEV__ !== 'undefined' && __DEV__/);
  assert.doesNotMatch(environment, /devAlwaysResetFlow === true/);
});

test('preparación QA es efímera y no borra perfil, mascotas ni direcciones', () => {
  const repository = read('src/data/localAccountRepository.ts');
  const body = repository.match(
    /export function prepareLocalStartupForQaSession[\s\S]*?\n}/,
  )?.[0] ?? '';
  assert.match(body, /onboardingCompleted: false/);
  assert.match(body, /loggedIn: false/);
  assert.match(body, /phoneVerified: false/);
  assert.match(body, /}, false\)/);
  assert.doesNotMatch(body, /profile:|addresses:|pets:/);
});

test('los tres assets del onboarding usan requires estáticos para Metro', () => {
  const slides = read('src/constants/onboardingSlides.ts');
  for (const image of ['1.png', '2.png', '3.png']) {
    assert.ok(slides.includes(`require('../../assets/banners/${image}')`));
  }
  assert.equal((slides.match(/require\('\.\.\/\.\.\/assets\/banners\//g) ?? []).length, 3);
  assert.doesNotMatch(slides, /require\(`|\$\{index\}/);
});

test('splash y carrusel nativo no navegan durante render', () => {
  const splash = read('src/startup/StartupVisualSplash.tsx');
  const welcome = read('src/app/(onboarding)/welcome.tsx');
  const guard = read('src/startup/StartupRouteGuard.tsx');
  assert.match(splash, /VISUAL_SPLASH_DURATION_MS = 3_000/);
  assert.match(splash, /setTimeout/);
  assert.match(splash, /clearTimeout/);
  assert.match(welcome, /data=\{ONBOARDING_SLIDES\}/);
  assert.match(welcome, /useWindowDimensions/);
  assert.match(welcome, /pagingEnabled/);
  assert.match(welcome, /resizeMode="cover"/);
  assert.match(welcome, /slideImage: \{ height: '100%', width: '100%' \}/);
  assert.doesNotMatch(welcome, /artworkFrame|maxWidth: 430|paddingHorizontal: 4/);
  assert.doesNotMatch(welcome, /router\.(replace|push)|<Redirect/);
  assert.match(guard, /onboardingRouteSelected: target === '\/welcome'/);
});

test('IconButton limita el glyph y formatea badges de uno a tres dígitos', () => {
  assert.equal(resolveIconButtonIconSize(40), 20);
  assert.equal(resolveIconButtonIconSize(40, 50), 26);
  assert.equal(resolveIconButtonIconSize(28, 30), 14);
  assert.equal(formatIconBadge(7), '7');
  assert.equal(formatIconBadge(42), '42');
  assert.equal(formatIconBadge(333), '333');
  assert.equal(formatIconBadge(1200), '999+');
});

test('IconButton mantiene badge dentro del wrapper y media de producto no recorta', () => {
  const iconButton = read('src/components/IconButton.tsx');
  const product = read('src/components/marketplace/ProductCard.tsx');
  const detail = read('src/app/marketplace/product-detail.tsx');
  assert.match(iconButton, /overflow: 'visible'/);
  assert.match(iconButton, /right: 1/);
  assert.match(iconButton, /top: 1/);
  assert.match(iconButton, /minWidth: 20/);
  assert.match(iconButton, /hitSlop=\{8\}/);
  assert.match(product, /lineHeight: 58/);
  assert.match(detail, /lineHeight: 132/);
  assert.doesNotMatch(product, /translateY: -/);
});

test('tab bar da holgura a los cinco iconos sin clipping', () => {
  const tabs = read('src/app/(tabs)/_layout.tsx');
  assert.equal((tabs.match(/home:|bookings:|marketplace:|profile:|support:/g) ?? []).length >= 5, true);
  assert.match(tabs, /iconPill: \{[\s\S]*?width: 34,[\s\S]*?height: 34/);
  assert.match(tabs, /overflow: 'visible'/);
  assert.match(tabs, /Math\.max\(insets\.bottom, FLOATING_TAB_BAR_MIN_BOTTOM_INSET\)/);
});
