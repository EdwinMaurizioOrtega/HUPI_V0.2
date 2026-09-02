import type { MockProvider } from '@/constants/mockProviders';

export function getProviderWalkHourlyRate(provider: MockProvider): number | undefined {
  const rate = provider.servicePrices.walk;

  return Number.isFinite(rate) && rate > 0 ? rate : undefined;
}

export function formatProviderHourlyRate(rate: number | undefined, language: string) {
  if (rate === undefined || !Number.isFinite(rate) || rate <= 0) return undefined;

  return new Intl.NumberFormat(language.startsWith('en') ? 'en-US' : 'es-EC', {
    currency: 'USD',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(rate);
}
