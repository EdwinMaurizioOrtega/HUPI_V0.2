import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  isPathAllowedForStartup,
  resolveStartupDestination,
  resolveStartupRedirect,
} from '../src/domain/startup.ts';
import {
  fonts,
  resolveFredokaFamily,
  typography,
} from '../src/constants/typographyTokens.ts';
import { en } from '../src/i18n/resources/en.ts';
import { es } from '../src/i18n/resources/es.ts';

const root = new URL('../', import.meta.url);
const read = (relativePath) => fs.readFileSync(new URL(relativePath, root), 'utf8');

function startup(overrides = {}) {
  return {
    ready: true,
    hasCompletedOnboarding: true,
    hasAuthenticatedSession: true,
    hasVerifiedPhone: true,
    hasCompletedProfile: true,
    selectedLanguage: 'es',
    selectedAppearance: 'system',
    ...overrides,
  };
}

test('primera instalación abre informativas sin usar root como destino', () => {
  assert.equal(resolveStartupDestination(startup({
    hasCompletedOnboarding: false,
    hasAuthenticatedSession: false,
    hasVerifiedPhone: false,
    hasCompletedProfile: false,
  })), 'onboarding');
  assert.equal(resolveStartupRedirect('onboarding', '/'), '/welcome');
  assert.equal(resolveStartupRedirect('onboarding', '/welcome'), null);
});

test('onboarding completado sin sesión abre auth y conserva login/registro', () => {
  const state = startup({
    hasAuthenticatedSession: false,
    hasVerifiedPhone: false,
    hasCompletedProfile: false,
  });
  assert.equal(resolveStartupDestination(state), 'auth');
  assert.equal(isPathAllowedForStartup('auth', '/login'), true);
  assert.equal(isPathAllowedForStartup('auth', '/register'), true);
  assert.equal(isPathAllowedForStartup('auth', '/home'), false);
});

test('sesión sin teléfono validado reanuda verificación', () => {
  assert.equal(resolveStartupDestination(startup({
    hasVerifiedPhone: false,
    hasCompletedProfile: false,
  })), 'verify-phone');
});

test('teléfono validado sin perfil obliga profile setup', () => {
  assert.equal(resolveStartupDestination(startup({
    hasCompletedProfile: false,
  })), 'profile-setup');
  assert.equal(isPathAllowedForStartup('profile-setup', '/home'), false);
});

test('sesión, teléfono y perfil completos permiten la app', () => {
  assert.equal(resolveStartupDestination(startup()), 'app');
  assert.equal(isPathAllowedForStartup('app', '/home'), true);
  assert.equal(isPathAllowedForStartup('app', '/login'), false);
});

test('reapertura a mitad del flujo conserva verify o profile setup', () => {
  assert.equal(resolveStartupDestination(startup({
    hasVerifiedPhone: false,
    hasCompletedProfile: false,
  })), 'verify-phone');
  assert.equal(resolveStartupDestination(startup({
    hasCompletedProfile: false,
  })), 'profile-setup');
});

test('logout vuelve a auth y reset manual vuelve a onboarding', () => {
  assert.equal(resolveStartupDestination(startup({
    hasAuthenticatedSession: false,
    hasVerifiedPhone: false,
  })), 'auth');
  assert.equal(resolveStartupDestination(startup({
    hasCompletedOnboarding: false,
  })), 'onboarding');
});

test('el repositorio persiste onboarding y verificación pendiente sin bypass', () => {
  const repository = read('src/data/localAccountRepository.ts');
  assert.match(repository, /ONBOARDING_STORAGE_KEY = 'hupi\.onboarding\.completed'/);
  assert.match(repository, /AsyncStorage\.setItem\(\s*ONBOARDING_STORAGE_KEY/);
  assert.match(repository, /Boolean\(account\?\.onboardingCompleted\)/);
  assert.match(repository, /profileCompleted: snapshot\.profileCompleted/);
  assert.match(repository, /session: snapshot\.session/);
  assert.match(repository, /pendingPhone: String\(account\?\.session\?\.pendingPhone/);
  assert.match(repository, /beginPhoneVerification/);
  assert.match(repository, /completePhoneVerification/);
  assert.doesNotMatch(repository, /beginVerifiedSession/);
  assert.doesNotMatch(read('src/constants/mockData.ts'), /setMockLoggedIn|isMockLoggedIn/);
});

test('el borrador de perfil no completa el paso hasta guardar explícitamente', () => {
  const repository = read('src/data/localAccountRepository.ts');
  const startupProvider = read('src/startup/StartupProvider.tsx');
  const profileSetup = read('src/app/(onboarding)/onboarding-profile.tsx');
  const draftBody = repository.match(
    /export function saveLocalProfileDraft[\s\S]*?\n}/,
  )?.[0] ?? '';
  const finalBody = repository.match(
    /export function saveLocalCustomerProfile[\s\S]*?\n}/,
  )?.[0] ?? '';
  assert.doesNotMatch(draftBody, /profileCompleted/);
  assert.match(finalBody, /profileCompleted: isCustomerProfileComplete/);
  assert.match(startupProvider, /account\.profileCompleted && isCustomerProfileComplete/);
  assert.match(profileSetup, /useEffect\(\(\) => \{\s*saveLocalProfileDraft\(profile\)/);
  assert.doesNotMatch(
    profileSetup,
    /setProfile\(\(current\) => \{[\s\S]*saveLocalProfileDraft/,
  );
});

test('el guard central reemplaza rutas y los layouts no duplican redirects', () => {
  const guard = read('src/startup/StartupRouteGuard.tsx');
  const index = read('src/app/index.tsx');
  const tabs = read('src/app/(tabs)/_layout.tsx');
  const profileSetup = read('src/app/(onboarding)/onboarding-profile.tsx');
  assert.match(guard, /resolveStartupRedirect/);
  assert.match(guard, /router\.replace\(redirectTarget as never\)/);
  assert.match(guard, /\{children\}/);
  assert.doesNotMatch(index, /router\.(replace|push)|<Redirect|useRouter/);
  assert.doesNotMatch(tabs, /<Redirect/);
  assert.doesNotMatch(profileSetup, /<Redirect/);
});

test('splash e informativas están separadas y conservan sonido', () => {
  const splash = read('src/app/index.tsx');
  const rootLayout = read('src/app/_layout.tsx');
  const visualSplash = read('src/startup/StartupVisualSplash.tsx');
  const welcome = read('src/app/(onboarding)/welcome.tsx');
  assert.match(rootLayout, /StartupVisualSplash/);
  assert.match(visualSplash, /playHupiBrandSound/);
  assert.match(visualSplash, /VISUAL_SPLASH_DURATION_MS = 3_000/);
  assert.match(visualSplash, /VISUAL_SPLASH_DURATION_MS - SPLASH_FADE_OUT_MS/);
  assert.match(visualSplash, /visualContentConfig\.splash\.logo/);
  assert.doesNotMatch(splash, /markSplashCompleted|router\.(replace|push)|<Redirect/);
  assert.doesNotMatch(splash, /account\.session\.loggedIn/);
  assert.match(welcome, /completeOnboarding/);
  assert.match(welcome, /ONBOARDING_SLIDES\.map/);
  assert.match(welcome, /<FlatList/);
  assert.match(welcome, /horizontal/);
  assert.match(welcome, /pagingEnabled/);
  assert.match(welcome, /snapToInterval=\{carouselWidth\}/);
  assert.match(welcome, /onMomentumScrollEnd=\{handleScrollEnd\}/);
  assert.match(welcome, /resizeMode="cover"/);
  assert.match(welcome, /carousel: \{ \.\.\.StyleSheet\.absoluteFillObject \}/);
  assert.match(welcome, /slideImage: \{ height: '100%', width: '100%' \}/);
  assert.doesNotMatch(welcome, /common\.jump|skipButton/);
  const content = read('src/constants/onboardingSlides.ts');
  assert.match(content, /width: 1290/);
  assert.match(content, /height: 2796/);
  for (const image of ['1.png', '2.png', '3.png']) {
    assert.match(content, new RegExp(`assets/banners/${image.replace('.', '\\.')}`));
  }
});

test('SMS valida código, reenvío y persistencia del teléfono pendiente', () => {
  const sms = read('src/app/(auth)/verify-sms.tsx');
  // La validación la decide el backend; la pantalla no compara el código.
  assert.match(sms, /verifyOtpCode\(/);
  assert.doesNotMatch(sms, /code !== '123456'/);
  assert.match(sms, /setInterval/);
  assert.match(sms, /auth\.sms\.resendNow/);
  assert.match(sms, /completePhoneVerification/);
  assert.match(sms, /account\.session\.pendingPhone/);
});

test('carga cinco variantes Fredoka y define todas las jerarquías', () => {
  assert.deepEqual(Object.values(fonts), [
    'Fredoka_300Light',
    'Fredoka_400Regular',
    'Fredoka_500Medium',
    'Fredoka_600SemiBold',
    'Fredoka_700Bold',
  ]);
  for (const variant of [
    'display', 'h1', 'h2', 'h3', 'title', 'subtitle', 'body',
    'pageTitle', 'pageSubtitle', 'bodyMedium', 'caption', 'label', 'button', 'overline',
  ]) {
    assert.ok(typography[variant], `falta ${variant}`);
  }
});

test('pesos existentes se traducen a variantes Fredoka reales', () => {
  assert.equal(resolveFredokaFamily('900'), fonts.bold);
  assert.equal(resolveFredokaFamily('700'), fonts.bold);
  assert.equal(resolveFredokaFamily('600'), fonts.semiBold);
  assert.equal(resolveFredokaFamily('500'), fonts.medium);
  assert.equal(resolveFredokaFamily('300'), fonts.light);
  assert.equal(resolveFredokaFamily(undefined), fonts.regular);
});

test('AppText, AppTextInput y AppButton aplican la capa central', () => {
  const components = read('src/i18n/components.tsx');
  const input = read('src/components/Input.tsx');
  const button = read('src/components/Button.tsx');
  assert.match(components, /export const AppText/);
  assert.match(components, /export const AppTextInput/);
  assert.match(components, /fontWeight: undefined/);
  assert.match(input, /AppTextInput/);
  assert.match(button, /export const AppButton = Button/);
});

test('tabs y banners renderizados por la app usan Fredoka', () => {
  const tabs = read('src/app/(tabs)/_layout.tsx');
  const homeBanner = read('src/features/home/PromoCarousel.tsx');
  const marketplaceBanner = read('src/components/marketplace/MarketplaceBanner.tsx');
  assert.match(tabs, /fontFamily: fonts\.semiBold/);
  assert.match(homeBanner, /from '@\/i18n\/components'/);
  assert.match(marketplaceBanner, /from '@\/i18n\/components'/);
});

test('auth, perfil y errores nuevos existen en español e inglés', () => {
  assert.equal(es.auth.login.recovery, 'Recuperar acceso');
  assert.equal(en.auth.login.recovery, 'Recover access');
  assert.ok(es.auth.register.consent);
  assert.ok(en.auth.register.consent);
  assert.equal(es.auth.sms.invalidCode, 'El código ingresado no es correcto.');
  assert.equal(en.auth.sms.invalidCode, 'The code you entered is incorrect.');
  assert.ok(es.onboarding.profile.recoveryEmail);
  assert.ok(en.onboarding.profile.recoveryEmail);
});

test('welcome consume tema central para claro, oscuro y sistema', () => {
  const welcome = read('src/app/(onboarding)/welcome.tsx');
  const rootLayout = read('src/app/_layout.tsx');
  assert.match(welcome, /useTheme/);
  assert.match(welcome, /backgroundColor: activeSlide\.backgroundColor/);
  assert.match(welcome, /backgroundColor: tokens\.secondary/);
  assert.match(rootLayout, /<StartupProvider>/);
  assert.match(rootLayout, /<StartupRouteGuard onDestinationReady=/);
});
