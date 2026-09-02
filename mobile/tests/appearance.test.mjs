import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  APPEARANCE_STORAGE_KEY,
  readAppearancePreference,
  resolveAppearance,
  writeAppearancePreference,
} from '../src/theme/appearance.ts';
import { darkTheme, lightTheme } from '../src/theme/tokens.ts';
import { en } from '../src/i18n/resources/en.ts';
import { es } from '../src/i18n/resources/es.ts';

const root = new URL('../', import.meta.url);
const read = (relativePath) => fs.readFileSync(new URL(relativePath, root), 'utf8');

function luminance(hex) {
  const channels = hex.slice(1).match(/.{2}/g).map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test('la preferencia inicial es system y resuelve los esquemas del dispositivo', async () => {
  assert.equal(await readAppearancePreference(async () => null), 'system');
  assert.equal(await readAppearancePreference(async () => 'invalid'), 'system');
  assert.equal(resolveAppearance('system', 'light'), 'light');
  assert.equal(resolveAppearance('system', 'dark'), 'dark');
  assert.equal(resolveAppearance('system', null), 'light');
});

test('light y dark manuales prevalecen, y volver a system restaura el dispositivo', () => {
  assert.equal(resolveAppearance('light', 'dark'), 'light');
  assert.equal(resolveAppearance('dark', 'light'), 'dark');
  assert.equal(resolveAppearance('system', 'dark'), 'dark');
});

test('la preferencia persiste y se recupera después de un reinicio simulado', async () => {
  const storage = new Map();
  await writeAppearancePreference('dark', async (key, value) => storage.set(key, value));
  assert.equal(storage.get(APPEARANCE_STORAGE_KEY), 'dark');
  assert.equal(APPEARANCE_STORAGE_KEY, 'hupi.appearance');
  assert.equal(
    await readAppearancePreference(async (key) => storage.get(key) ?? null),
    'dark',
  );
});

test('el proveedor centraliza useColorScheme y protege la sincronización nativa', () => {
  const provider = read('src/theme/ThemeProvider.tsx');
  const sourceFiles = fs.readdirSync(new URL('src/', root), { recursive: true })
    .filter((file) => typeof file === 'string' && /\.(ts|tsx)$/.test(file))
    .map((file) => `src/${file.replaceAll('\\', '/')}`);

  assert.match(provider, /useColorScheme\(\)/);
  assert.match(provider, /import \{[\s\S]*Appearance,[\s\S]*Platform,[\s\S]*useColorScheme/);
  assert.match(provider, /Platform\.OS !== 'web'/);
  assert.match(provider, /typeof Appearance\.setColorScheme === 'function'/);
  assert.match(provider, /Appearance\.setColorScheme/);
  assert.match(provider, /appearance === 'system' \? null : appearance/);
  assert.match(provider, /document\.documentElement\.dataset\.theme = resolvedTheme/);
  assert.match(provider, /document\.documentElement\.style\.colorScheme = resolvedTheme/);
  const setterBody = provider.match(
    /const setAppearance = useCallback[\s\S]*?\n  }, \[appearance\]\);/,
  )?.[0] ?? '';
  assert.doesNotMatch(setterBody, /Appearance\.setColorScheme/);
  assert.match(setterBody, /nextAppearance === appearance/);
  for (const file of sourceFiles) {
    if (file === 'src/theme/ThemeProvider.tsx') continue;
    assert.doesNotMatch(read(file), /\buseColorScheme\b/, `${file} debe consumir useTheme`);
  }
});

test('login y Configuración ofrecen selector de tres opciones accesible', () => {
  const login = read('src/app/(auth)/login.tsx');
  const settings = read('src/app/client/settings.tsx');
  const selector = read('src/components/AppearanceSelectorModal.tsx');

  assert.match(login, /AppearanceSelectorModal/);
  assert.match(settings, /AppearanceSelectorModal/);
  assert.match(settings, /settings\.appearanceUpdated/);
  assert.match(selector, /appearancePreferences\.map/);
  assert.match(selector, /accessibilityRole="radio"/);
  assert.match(selector, /accessibilityState=\{\{ checked: selected, selected \}\}/);
  assert.match(selector, /announceForAccessibility/);
});

test('navegación, StatusBar, tabs y DateTimePicker usan el tema resuelto', () => {
  const rootLayout = read('src/app/_layout.tsx');
  const tabs = read('src/app/(tabs)/_layout.tsx');
  const picker = read('src/components/NativeDateTimeFields.tsx');
  const language = read('src/components/LanguageSelectorModal.tsx');
  const map = read('src/components/addresses/AddressMap.native.tsx');

  assert.match(rootLayout, /<ThemeProvider initialAppearance=\{appearance\}>/);
  assert.match(rootLayout, /resolvedTheme === 'dark' \? 'light' : 'dark'/);
  assert.match(rootLayout, /contentStyle: \{ backgroundColor: tokens\.background \}/);
  assert.match(tabs, /const darkMode = resolvedTheme === 'dark'/);
  assert.match(tabs, /const translucentBar = darkMode/);
  assert.match(tabs, /DARK_TAB_BAR_SURFACE/);
  assert.match(tabs, /backgroundColor: translucentBar/);
  assert.match(tabs, /tokens\.primarySoft/);
  assert.match(picker, /themeVariant=\{resolvedTheme\}/);
  assert.match(picker, /textColor=\{tokens\.text\}/);
  assert.doesNotMatch(picker, /themeVariant="light"/);
  assert.match(language, /useTheme/);
  assert.match(map, /userInterfaceStyle=\{resolvedTheme\}/);
  assert.match(map, /pinColor=\{tokens\.primary\}/);
});

test('tokens claros y oscuros mantienen contraste y el oscuro evita negro puro', () => {
  assert.ok(contrast(lightTheme.text, lightTheme.background) >= 4.5);
  assert.ok(contrast(darkTheme.text, darkTheme.background) >= 4.5);
  assert.ok(contrast(darkTheme.text, darkTheme.surface) >= 4.5);
  assert.ok(contrast(darkTheme.text, darkTheme.inputPurple) >= 4.5);
  assert.ok(contrast(darkTheme.placeholder, darkTheme.inputPurple) >= 4.5);
  assert.ok(contrast(darkTheme.success, darkTheme.successSoft) >= 4.5);
  assert.ok(contrast(darkTheme.warning, darkTheme.warningSoft) >= 4.5);
  assert.notEqual(darkTheme.background.toLowerCase(), '#000000');
  assert.notEqual(darkTheme.surface.toLowerCase(), '#000000');
  assert.notEqual(darkTheme.background, darkTheme.surface);
});

test('el morado de la maleta centraliza tarjetas, superficies e inputs oscuros', () => {
  assert.equal(darkTheme.surfacePurple, '#3b304a');
  assert.equal(darkTheme.secondarySoft, darkTheme.surfacePurple);
  assert.equal(darkTheme.card, darkTheme.surfacePurple);
  assert.equal(darkTheme.surface, darkTheme.surfacePurple);
  assert.equal(darkTheme.input, darkTheme.inputPurple);
  assert.notEqual(darkTheme.inputPurple, '#302a36');
  assert.notEqual(darkTheme.soft, '#383429');
});

test('inputs, OTP, Paseo y paseadores consumen tokens de contraste compartidos', () => {
  const components = read('src/i18n/components.tsx');
  const input = read('src/components/Input.tsx');
  const phone = read('src/components/PhoneCountryInput.tsx');
  const sms = read('src/app/(auth)/verify-sms.tsx');
  const otp = read('src/components/OtpInput.tsx');
  const serviceForm = read('src/features/home/ServiceForm.tsx');
  const providerCard = read('src/components/providers/ProviderCard.tsx');

  assert.match(components, /placeholderTextColor=\{resolvedPlaceholderTextColor\}/);
  assert.match(components, /placeholderTextColor === colors\.textMuted[\s\S]*?tokens\.placeholder/);
  assert.match(components, /cursorColor=\{cursorColor \?\? tokens\.primary\}/);
  assert.match(components, /\{ color: tokens\.text \},[\s\S]*?combinedStyle/);
  assert.match(components, /semanticInputOverrides/);
  assert.match(input, /backgroundColor: tokens\.input/);
  assert.match(phone, /backgroundColor: tokens\.input/);
  assert.match(phone, /color: tokens\.text/);
  assert.match(sms, /<OtpInput/);
  assert.match(otp, /backgroundColor: tokens\.inputPurple/);
  assert.match(otp, /color: digit \? tokens\.text : tokens\.placeholder/);
  assert.match(otp, /backgroundColor: tokens\.primary/);
  assert.match(serviceForm, /backgroundColor: tokens\.inputPurple/);
  assert.match(serviceForm, /backgroundColor: tokens\.elevatedPurple/);
  assert.match(providerCard, /backgroundColor: tokens\.border/);
});

test('splash nativo y visual conservan naranja y logo sin variante oscura', () => {
  const appConfig = read('app.config.js');
  const appJson = read('app.json');
  const visualSplash = read('src/startup/StartupVisualSplash.tsx');
  const layout = read('src/app/_layout.tsx');

  assert.match(appConfig, /backgroundColor: '#e45336'/);
  assert.match(appConfig, /image: '\.\/assets\/brand\/logo_hupi\.png'/);
  assert.doesNotMatch(appConfig, /\bdark:\s*\{/);
  assert.match(appConfig, /barStyle: 'dark-content'/);
  assert.match(appConfig, /UIStatusBarStyle: 'UIStatusBarStyleDarkContent'/);
  assert.match(appJson, /"backgroundColor": "#e45336"/);
  assert.match(visualSplash, /backgroundColor: visualContentConfig\.splash\.backgroundColor/);
  assert.doesNotMatch(visualSplash, /\bisDark\b|#2b2631/);
  assert.match(layout, /const startupBackground = visualContentConfig\.splash\.backgroundColor/);
  assert.match(layout, /visualSplashVisible[\s\S]*?\? 'dark'[\s\S]*?resolvedTheme === 'dark' \? 'light' : 'dark'/);
});

test('web conserva ancho móvil razonable y superficies semánticas', () => {
  const screen = read('src/components/ScreenContainer.tsx');
  const themedView = read('src/theme/ThemedView.tsx');
  const themedIcons = read('src/theme/ThemedIonicons.tsx');
  assert.match(screen, /maxWidth: 560/);
  assert.match(screen, /alignSelf: 'center'/);
  assert.match(themedView, /getSemanticViewOverrides/);
  assert.match(themedView, /tokens\.surface/);
  assert.match(themedIcons, /color === colors\.text/);
  assert.match(themedIcons, /tokens\.textMuted/);
});

test('traducciones de apariencia coinciden en español e inglés', () => {
  assert.equal(es.settings.appearance, 'Apariencia');
  assert.equal(en.settings.appearance, 'Appearance');
  assert.equal(es.settings.appearanceSystem, 'Sistema');
  assert.equal(en.settings.appearanceSystem, 'System');
  assert.equal(es.settings.appearanceLight, 'Claro');
  assert.equal(en.settings.appearanceLight, 'Light');
  assert.equal(es.settings.appearanceDark, 'Oscuro');
  assert.equal(en.settings.appearanceDark, 'Dark');
  assert.equal(es.settings.appearanceUpdated, 'Apariencia actualizada.');
  assert.equal(en.settings.appearanceUpdated, 'Appearance updated.');
  assert.equal(es.settings.appearanceDevice, 'Usar configuración del dispositivo');
  assert.equal(en.settings.appearanceDevice, 'Use device setting');
});
