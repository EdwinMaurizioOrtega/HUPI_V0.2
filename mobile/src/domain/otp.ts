/**
 * Código de desarrollo del prototipo.
 *
 * Solo se usa cuando NO hay backend configurado, para que el prototipo siga
 * siendo navegable sin servidor. Con `EXPO_PUBLIC_API_URL` la validación la
 * hace el backend y este valor no interviene.
 */
export const DEV_OTP_CODE = '123456';

export const OTP_LENGTH = 6;

export function isOtpComplete(code: string) {
  return code.trim().length === OTP_LENGTH;
}

export function matchesDevOtpCode(code: string) {
  return code.trim() === DEV_OTP_CODE;
}
