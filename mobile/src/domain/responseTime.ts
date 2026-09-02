import type { TFunction } from 'i18next';

export function formatAverageResponseTime(minutes: number, t: TFunction) {
  const normalized = Math.max(0, Math.round(minutes));

  if (normalized <= 2) return t('chatPresence.responseAlmostImmediately');
  if (normalized <= 15) return t('chatPresence.responseInMinutes', { count: normalized });
  if (normalized <= 59) return t('chatPresence.responseUnderOneHour');
  if (normalized <= 119) return t('chatPresence.responseAboutOneHour');
  if (normalized <= 1439) return t('chatPresence.responseInHours', { count: Math.max(2, Math.round(normalized / 60)) });
  return t('chatPresence.responseInDays', { count: Math.max(1, Math.round(normalized / 1440)) });
}
