import { getCachedQuote, primeQuote } from '@/data/remoteQuotes';

import { serviceCopy, type BookableServiceId } from './services';

export type MockPlanId = 'basic' | 'frequent';

export type MockPaymentBreakdown = {
  providerValue: number;
  clientFee: number;
  iva: number;
  total: number;
  providerPayout: number;
  hupiProviderCommission: number;
  hupiTotalRevenue: number;
};

export const CLIENT_FEE_RATE = 0.15;
export const PROVIDER_PAYOUT_RATE = 0.7;
export const PROVIDER_COMMISSION_RATE = 0.3;
export const CURRENT_IVA_RATE = 0;
export const FUTURE_ECUADOR_IVA_RATE = 0.15;

export const mockBookingDetails = {
  service: 'Paseo',
  pet: 'Milo',
  date: '12 de julio de 2026',
  hour: '17:30',
  duration: '60 minutos',
  location: 'La Carolina, Quito',
};

export function getMockBookingDetails(serviceId: BookableServiceId) {
  const copy = serviceCopy[serviceId];

  return {
    service: copy.title,
    pet: 'Milo',
    date: copy.schedule.date,
    hour: copy.schedule.time,
    duration: copy.schedule.duration,
    location: copy.schedule.location,
  };
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getMockProviderValue(hourlyPrice: number, planId: MockPlanId) {
  if (planId === 'frequent') {
    return roundCurrency(hourlyPrice * 3 * 0.9);
  }

  return roundCurrency(hourlyPrice);
}

export function calculateMockPayment(providerValue: number): MockPaymentBreakdown {
  // El servidor es quien fija el importe al crear la reserva: si ya lo
  // conocemos se muestra el suyo, no una copia local de las tarifas.
  const remote = getCachedQuote(providerValue);
  if (remote) return remote;
  primeQuote(providerValue);

  const clientFee = roundCurrency(providerValue * CLIENT_FEE_RATE);
  const iva = roundCurrency(providerValue * CURRENT_IVA_RATE);
  const providerPayout = roundCurrency(providerValue * PROVIDER_PAYOUT_RATE);
  const hupiProviderCommission = roundCurrency(providerValue * PROVIDER_COMMISSION_RATE);

  return {
    providerValue,
    clientFee,
    iva,
    total: roundCurrency(providerValue + clientFee + iva),
    providerPayout,
    hupiProviderCommission,
    hupiTotalRevenue: roundCurrency(clientFee + hupiProviderCommission),
  };
}

export function formatMockCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}
