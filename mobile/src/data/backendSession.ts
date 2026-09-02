import { isRemoteBackendEnabled } from '@/config/environment';
import { matchesDevOtpCode } from '@/domain/otp';

import {
  confirmRemotePhoneVerification,
  requestRemoteLogin,
  requestRemoteRegistration,
  resendRemoteOtp,
} from './httpAccountRepository';
import { hydrateAccountFromBackend } from './localAccountRepository';
import { primeRemoteData } from './remoteOverlay';

/**
 * Pide al backend que emita el código. Sin esto solo entrarían los teléfonos
 * de prueba, que aceptan el código fijo sin SMS previo.
 *
 * Si el backend falla se sigue adelante: el prototipo debe poder demostrarse
 * aunque el servidor no esté disponible.
 */
export async function requestOtpCode(
  phone: string,
  authMode: 'login' | 'register',
  consent = true,
): Promise<void> {
  if (!isRemoteBackendEnabled()) return;

  try {
    if (authMode === 'register') await requestRemoteRegistration(phone, consent);
    else await requestRemoteLogin(phone);
  } catch {
    // El código fijo de desarrollo sigue sirviendo para los teléfonos de prueba.
  }
}

/** Reemite el código. Sin backend el código fijo sigue siendo válido. */
export async function resendOtpCode(phone: string): Promise<void> {
  if (!isRemoteBackendEnabled()) return;

  try {
    await resendRemoteOtp(phone);
  } catch {
    // El código anterior sigue vigente hasta que expire.
  }
}

/**
 * Valida el código de verificación.
 *
 * Con backend configurado el backend es la única autoridad: decide él y, si
 * acepta, devuelve el token de sesión. Sin backend se usa el código de
 * desarrollo para que el prototipo siga navegable sin servidor.
 */
export async function verifyOtpCode(phone: string, code: string): Promise<boolean> {
  if (!isRemoteBackendEnabled()) {
    return matchesDevOtpCode(code);
  }

  try {
    const remote = await confirmRemotePhoneVerification(phone, code);
    await hydrateAccountFromBackend(remote);
    primeRemoteData();
    return true;
  } catch {
    return false;
  }
}
