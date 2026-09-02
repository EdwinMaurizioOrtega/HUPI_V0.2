export type RecoveryChannel = 'sms' | 'email';

export function normalizeRecoveryEmail(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function isValidRecoveryEmail(value: string) {
  const normalized = normalizeRecoveryEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function maskEmail(value: string) {
  const normalized = normalizeRecoveryEmail(value);
  const atIndex = normalized.indexOf('@');

  if (atIndex <= 0) {
    return normalized ? `${normalized.charAt(0)}${'•'.repeat(Math.max(normalized.length - 1, 1))}` : '••••';
  }

  const localPart = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);
  const maskedLocalPart = `${localPart.charAt(0)}${'•'.repeat(Math.max(localPart.length - 1, 1))}`;
  return domain ? `${maskedLocalPart}@${domain}` : maskedLocalPart;
}

export function getPhoneLastFour(value: string) {
  return value.replace(/\D/g, '').slice(-4);
}

export function maskPhone(value: string) {
  const lastFour = getPhoneLastFour(value);
  if (!lastFour) return '••• ••• ••••';
  if (lastFour.length < 4) return '•'.repeat(lastFour.length);
  return `••• ••• ${lastFour}`;
}
