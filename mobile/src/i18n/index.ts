import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from '../../node_modules/react-i18next';

import { en } from './resources/en';
import { es } from './resources/es';
import generatedEn from './generated/en.json';
import generatedEs from './generated/es.json';
import {
  STORAGE_READ_TIMEOUT_MS,
  withStartupTimeout,
} from '@/startup/bootstrap';
import {
  defaultLanguage,
  isSupportedLanguage,
  languageStorageKey,
  localesByLanguage,
  resolveLanguagePreference,
  type SupportedLanguage,
} from './types';

export const resources = {
  es: { translation: { ...es, generated: generatedEs } },
  en: { translation: { ...en, generated: generatedEn } },
} as const;

export function detectDeviceLanguage(): SupportedLanguage {
  const languageCode = getLocales()[0]?.languageCode;
  return resolveLanguagePreference(null, languageCode);
}

export async function resolveInitialLanguage(
  readLanguage: () => Promise<string | null> = () => AsyncStorage.getItem(languageStorageKey),
): Promise<SupportedLanguage> {
  try {
    const storedLanguage = await withStartupTimeout(
      readLanguage(),
      STORAGE_READ_TIMEOUT_MS,
      'Language hydration timed out.',
    );
    if (isSupportedLanguage(storedLanguage)) return storedLanguage;
  } catch (error) {
    if (__DEV__) {
      console.warn('[i18n] No se pudo leer el idioma guardado.', error);
    }
  }

  return detectDeviceLanguage();
}

let initializationPromise: Promise<typeof i18n> | null = null;

export function initializeI18n() {
  if (initializationPromise) {
    return initializationPromise;
  }

  const task = resolveInitialLanguage().then(async (language) => {
    await i18n.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: defaultLanguage,
      supportedLngs: ['es', 'en'],
      load: 'languageOnly',
      cleanCode: true,
      interpolation: { escapeValue: false },
      returnEmptyString: false,
      returnNull: false,
      saveMissing: __DEV__,
      missingKeyHandler: (_languages, _namespace, key) => {
        if (__DEV__) {
          console.warn(`[i18n] Falta la traducción: ${key}`);
        }
      },
    });

    try {
      await AsyncStorage.setItem(languageStorageKey, language);
    } catch (error) {
      if (__DEV__) {
        console.warn('[i18n] No se pudo persistir el idioma inicial.', error);
      }
    }

    return i18n;
  });

  initializationPromise = task.catch((error) => {
    initializationPromise = null;
    throw error;
  });

  return initializationPromise;
}

export async function changeAppLanguage(language: SupportedLanguage) {
  if (!i18n.isInitialized) {
    await initializeI18n();
  }
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(languageStorageKey, language);
}

export function getCurrentLanguage(): SupportedLanguage {
  const language = i18n.resolvedLanguage ?? i18n.language;
  return isSupportedLanguage(language) ? language : defaultLanguage;
}

export function getCurrentLocale() {
  return localesByLanguage[getCurrentLanguage()];
}

export { i18n };
export * from './types';
