import { isRemoteBackendEnabled } from '@/config/environment';

import { httpAccountRepository } from './httpAccountRepository';
import { localAccountRepository, type AccountRepository } from './localAccountRepository';

/**
 * Selecciona la implementación activa del contrato `AccountRepository`.
 * Sin `EXPO_PUBLIC_API_URL` la app sigue funcionando con datos locales, de modo
 * que el prototipo se puede demostrar sin backend.
 */
export function getAccountRepository(): AccountRepository {
  return isRemoteBackendEnabled() ? httpAccountRepository : localAccountRepository;
}

export const accountRepository: AccountRepository = {
  initialize: () => getAccountRepository().initialize(),
  getSnapshot: () => getAccountRepository().getSnapshot(),
  subscribe: (listener) => getAccountRepository().subscribe(listener),
  saveProfile: (profile) => getAccountRepository().saveProfile(profile),
  saveProfileDraft: (profile) => getAccountRepository().saveProfileDraft(profile),
  saveAddress: (address) => getAccountRepository().saveAddress(address),
  deleteAddress: (addressId) => getAccountRepository().deleteAddress(addressId),
  setDefaultAddress: (addressId) => getAccountRepository().setDefaultAddress(addressId),
  completeOnboarding: () => getAccountRepository().completeOnboarding(),
  resetOnboarding: () => getAccountRepository().resetOnboarding(),
  resetStartupForDevelopment: () => getAccountRepository().resetStartupForDevelopment(),
};
