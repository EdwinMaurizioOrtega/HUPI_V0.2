export const supportedLanguages = ['es', 'en'] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage: SupportedLanguage = 'es';
export const languageStorageKey = 'hupi.language';

export const localesByLanguage: Record<SupportedLanguage, string> = {
  es: 'es-EC',
  en: 'en-US',
};

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === 'string' && supportedLanguages.includes(value as SupportedLanguage);
}

export function resolveLanguagePreference(
  storedLanguage: unknown,
  deviceLanguage: unknown,
): SupportedLanguage {
  if (isSupportedLanguage(storedLanguage)) {
    return storedLanguage;
  }
  return isSupportedLanguage(deviceLanguage) ? deviceLanguage : defaultLanguage;
}
