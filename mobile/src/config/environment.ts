import Constants from 'expo-constants';
import { resolveQaOnboardingEnabled } from './qaMode';

export type AppEnvironment = 'development' | 'production';

/**
 * Expo Go does not require APP_ENV to expose a development bundle. __DEV__ is
 * the native-safe source of truth and becomes false in production bundles.
 */
export const DEV_ALWAYS_SHOW_ONBOARDING =
  resolveQaOnboardingEnabled(typeof __DEV__ !== 'undefined' && __DEV__);

export function isDevelopmentBundle() {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

export function getAppEnvironment(): AppEnvironment {
  return DEV_ALWAYS_SHOW_ONBOARDING
    || Constants.expoConfig?.extra?.appEnv === 'development'
    ? 'development'
    : 'production';
}

export function isDevelopmentEnvironment() {
  return DEV_ALWAYS_SHOW_ONBOARDING || getAppEnvironment() === 'development';
}

export function shouldAlwaysResetDevelopmentFlow() {
  return DEV_ALWAYS_SHOW_ONBOARDING;
}

/** Vacío cuando no hay backend configurado: la app sigue con datos locales. */
export function getApiBaseUrl(): string {
  const value = Constants.expoConfig?.extra?.apiBaseUrl;
  return typeof value === 'string' ? value.replace(/\/+$/, '') : '';
}

export function isRemoteBackendEnabled() {
  return getApiBaseUrl().length > 0;
}
