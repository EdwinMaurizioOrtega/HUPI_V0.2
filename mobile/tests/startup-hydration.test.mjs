import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  STARTUP_SAFETY_TIMEOUT_MS,
  StartupTimeoutError,
  withStartupTimeout,
} from '../src/startup/bootstrap.ts';
import { en } from '../src/i18n/resources/en.ts';
import { es } from '../src/i18n/resources/es.ts';
import {
  resolveStartupRedirect,
  startupPaths,
} from '../src/domain/startup.ts';

const root = new URL('../', import.meta.url);
const read = (relativePath) => fs.readFileSync(new URL(relativePath, root), 'utf8');

test('el timeout controlado resuelve tareas normales y rechaza tareas congeladas', async () => {
  assert.equal(
    await withStartupTimeout(Promise.resolve('ready'), 50, 'timeout'),
    'ready',
  );
  await assert.rejects(
    withStartupTimeout(new Promise(() => {}), 5, 'timeout'),
    (error) => error instanceof StartupTimeoutError && error.message === 'timeout',
  );
  assert.equal(STARTUP_SAFETY_TIMEOUT_MS, 8_000);
});

test('el splash nativo entrega a una única superficie Hupi con la ruta final preparada', () => {
  const layout = read('src/app/_layout.tsx');
  const guard = read('src/startup/StartupRouteGuard.tsx');
  const index = read('src/app/index.tsx');
  const provider = read('src/startup/StartupProvider.tsx');
  const visualSplash = read('src/startup/StartupVisualSplash.tsx');
  assert.equal((layout.match(/preventAutoHideAsync/g) ?? []).length, 1);
  assert.match(layout, /destinationReady/);
  assert.match(layout, /onLayout=\{\(\) => setRootViewReady\(true\)\}/);
  assert.match(layout, /rootViewReady.*bootstrapReady.*startupFailed/s);
  assert.match(layout, /SplashScreen\.hideAsync\(\)/);
  assert.match(layout, /\.finally\(\(\) => \{[\s\S]*?logStartupMilestone\('splashHidden'/);
  assert.match(layout, /SplashScreen\.hide\(\)/);
  assert.match(guard, /onDestinationReady\?\.\(\)/);
  assert.doesNotMatch(guard, /if \(visualSplashVisible\) return/);
  assert.match(provider, /useState\(true\)/);
  assert.match(visualSplash, /VISUAL_SPLASH_DURATION_MS = 3_000/);
  assert.match(guard, /visualContentConfig\.splash\.backgroundColor/);
  assert.doesNotMatch(guard, /HupiPagesLogo|tokens\.background/);
  assert.match(index, /visualContentConfig\.splash\.backgroundColor/);
  assert.doesNotMatch(index, /HupiPagesLogo|StartupLoadingScreen/);
});

test('fuentes fallidas no bloquean y el timeout muestra recuperación reintentable', () => {
  const layout = read('src/app/_layout.tsx');
  const recovery = read('src/startup/StartupRecoveryScreen.tsx');
  assert.match(layout, /fontsLoaded \|\| Boolean\(fontError\)/);
  assert.match(layout, /STARTUP_SAFETY_TIMEOUT_MS/);
  assert.match(layout, /startupFailed \? \(/);
  assert.match(recovery, /StartupRecoveryScreen/);
  assert.match(recovery, /onRetry/);
  assert.equal(es.startup.couldNotStart, 'No pudimos iniciar Hupi.');
  assert.equal(en.startup.couldNotStart, 'We couldn’t start Hupi.');
});

test('idioma, apariencia y cuenta local tienen timeout, fallback y diagnóstico', () => {
  const language = read('src/i18n/index.ts');
  const appearance = read('src/theme/ThemeProvider.tsx');
  const account = read('src/data/localAccountRepository.ts');
  for (const source of [language, appearance, account]) {
    assert.match(source, /withStartupTimeout/);
    assert.match(source, /STORAGE_READ_TIMEOUT_MS/);
  }
  assert.match(language, /return detectDeviceLanguage\(\)/);
  assert.match(appearance, /return 'system' as const/);
  assert.match(account, /replaceSnapshot\(\{ \.\.\.snapshot, ready: true \}, false\)/);
});

test('los hitos de desarrollo no incluyen datos sensibles', () => {
  const layout = read('src/app/_layout.tsx');
  const guard = read('src/startup/StartupRouteGuard.tsx');
  for (const milestone of [
    'fontsLoaded',
    'preferencesHydrated',
    'onboardingResolved',
    'sessionResolved',
    'profileResolved',
    'splashHidden',
  ]) {
    assert.match(layout, new RegExp(`'${milestone}'`));
  }
  assert.match(guard, /destinationRoute:/);
  assert.doesNotMatch(layout, /pendingPhone|email|firstName|lastName/);
});

test('el guard espera al router raíz y evita redirects duplicados', () => {
  const guard = read('src/startup/StartupRouteGuard.tsx');
  const index = read('src/app/index.tsx');
  const welcome = read('src/app/(onboarding)/welcome.tsx');
  assert.match(guard, /useRootNavigationState/);
  assert.match(guard, /routerReady/);
  assert.doesNotMatch(guard, /if \(visualSplashVisible\) return/);
  assert.match(guard, /lastRedirectRef/);
  assert.match(guard, /resolveStartupRedirect/);
  assert.match(guard, /router\.replace\(redirectTarget as never\)/);
  assert.equal((guard.match(/router\.replace/g) ?? []).length, 1);
  assert.match(guard, /\{children\}/);
  assert.doesNotMatch(index, /router\.(replace|push)|<Redirect|useRouter/);
  assert.doesNotMatch(welcome, /router\.(replace|push)|<Redirect/);
  assert.equal(Object.values(startupPaths).includes('/'), false);
  assert.equal(resolveStartupRedirect('onboarding', '/'), '/welcome');
  assert.equal(resolveStartupRedirect('onboarding', '/welcome'), null);
  assert.equal(resolveStartupRedirect('auth', '/'), '/login');
  assert.equal(resolveStartupRedirect('auth', '/login'), null);
  assert.equal(resolveStartupRedirect('profile-setup', '/'), '/onboarding-profile');
  assert.equal(resolveStartupRedirect('profile-setup', '/onboarding-profile'), null);
  assert.equal(resolveStartupRedirect('app', '/'), '/home');
  assert.equal(resolveStartupRedirect('app', '/home'), null);
});

test('onboarding usa una clave definitiva y el modo QA nativo no destruye persistencia', () => {
  const layout = read('src/app/_layout.tsx');
  const account = read('src/data/localAccountRepository.ts');
  const settings = read('src/app/client/settings.tsx');
  const provider = read('src/startup/StartupProvider.tsx');
  const environment = read('src/config/environment.ts');
  const qaMode = read('src/config/qaMode.ts');
  const resetBody = account.match(
    /export function resetLocalStartupForDevelopment[\s\S]*?\n}/,
  )?.[0] ?? '';
  const qaPreparationBody = account.match(
    /export function prepareLocalStartupForQaSession[\s\S]*?\n}/,
  )?.[0] ?? '';
  assert.match(account, /ONBOARDING_STORAGE_KEY = 'hupi\.onboarding\.completed'/);
  assert.match(account, /storedOnboarding === 'true'/);
  assert.match(account, /Boolean\(account\?\.onboardingCompleted\)/);
  assert.match(account, /resetLocalStartupForDevelopment/);
  assert.match(account, /if \(!isDevelopmentEnvironment\(\)\) return snapshot/);
  assert.match(resetBody, /onboardingCompleted: false/);
  assert.match(resetBody, /profileCompleted: false/);
  assert.match(resetBody, /loggedIn: false/);
  assert.match(resetBody, /phoneVerified: false/);
  assert.doesNotMatch(resetBody, /addresses:|pets:|language|appearance/);
  assert.match(qaPreparationBody, /replaceSnapshot\([\s\S]*false/);
  assert.match(qaPreparationBody, /onboardingCompleted: false/);
  assert.match(qaPreparationBody, /profileCompleted: false/);
  assert.match(qaPreparationBody, /loggedIn: false/);
  assert.match(qaPreparationBody, /phoneVerified: false/);
  assert.doesNotMatch(qaPreparationBody, /profile: \{|addresses: \[/);
  assert.equal((provider.match(/resetLocalStartupForDevelopment\(\)/g) ?? []).length, 1);
  assert.match(settings, /resetWelcomeFlow/);
  assert.doesNotMatch(settings, /router\.replace\('\/welcome'\)/);
  assert.match(provider, /hupiQa = \{ resetWelcomeFlow \}/);
  assert.doesNotMatch(provider, /router\.(replace|push)/);
  assert.match(qaMode, /return isDevelopmentBundle/);
  assert.match(environment, /typeof __DEV__ !== 'undefined' && __DEV__/);
  assert.match(environment, /DEV_ALWAYS_SHOW_ONBOARDING/);
  assert.match(layout, /shouldAlwaysResetDevelopmentFlow\(\)/);
  assert.match(layout, /qaStartupPreparedRef/);
  assert.match(layout, /prepareLocalStartupForQaSession\(\)/);
});

test('provider tiene layout e index reales sin ruta provider-home duplicada', () => {
  const rootLayout = read('src/app/_layout.tsx');
  const providerLayout = read('src/app/provider/_layout.tsx');
  const home = read('src/app/(tabs)/home.tsx');
  const profile = read('src/app/(tabs)/profile.tsx');
  assert.match(rootLayout, /<Stack\.Screen name="provider" \/>/);
  assert.doesNotMatch(rootLayout, /name="provider-home"/);
  assert.match(providerLayout, /initialRouteName="index"/);
  assert.equal(fs.existsSync(new URL('src/app/provider/index.tsx', root)), true);
  assert.equal(fs.existsSync(new URL('src/app/provider-home.tsx', root)), false);
  assert.match(home, /router\.push\('\/provider'\)/);
  assert.match(profile, /router\.push\(hasProviderMode \? '\/provider' : '\/provider-onboarding\?existing=1'\)/);
});
