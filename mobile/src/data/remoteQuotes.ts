import { isRemoteBackendEnabled } from '@/config/environment';

import { apiRequest } from './apiClient';

/**
 * Desglose de pago calculado por el backend.
 *
 * El importe que se cobra lo decide el servidor al crear la reserva. Esta
 * caché existe para que la vista previa muestre exactamente esa cifra, en vez
 * de una copia local de las tarifas que puede quedar desfasada.
 *
 * La consulta es asíncrona pero la pantalla pinta de forma síncrona: se
 * devuelve lo cacheado y, cuando llega la respuesta, se avisa para repintar.
 */
export type RemoteQuote = {
  providerValue: number;
  clientFee: number;
  iva: number;
  total: number;
  providerPayout: number;
  hupiProviderCommission: number;
  hupiTotalRevenue: number;
};

/** El backend serializa los importes como texto para no perder precisión. */
type RawQuote = Record<keyof RemoteQuote, string | number>;

const quotes = new Map<string, RemoteQuote>();
const pending = new Set<string>();
const listeners = new Set<() => void>();

function toNumber(value: string | number): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toQuote(raw: RawQuote): RemoteQuote {
  return {
    providerValue: toNumber(raw.providerValue),
    clientFee: toNumber(raw.clientFee),
    iva: toNumber(raw.iva),
    total: toNumber(raw.total),
    providerPayout: toNumber(raw.providerPayout),
    hupiProviderCommission: toNumber(raw.hupiProviderCommission),
    hupiTotalRevenue: toNumber(raw.hupiTotalRevenue),
  };
}

function key(providerValue: number) {
  return providerValue.toFixed(2);
}

export function subscribeQuotes(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCachedQuote(providerValue: number): RemoteQuote | null {
  return quotes.get(key(providerValue)) ?? null;
}

/** Pide la cotización si no está en caché. Repetir la llamada no duplica red. */
export function primeQuote(providerValue: number): void {
  if (!isRemoteBackendEnabled() || providerValue <= 0) return;

  const id = key(providerValue);
  if (quotes.has(id) || pending.has(id)) return;

  pending.add(id);
  apiRequest<RawQuote>('/bookings/checkout/quote', {
    method: 'POST',
    body: { providerValue },
  })
    .then((raw) => {
      quotes.set(id, toQuote(raw));
      listeners.forEach((listener) => listener());
    })
    .catch(() => {
      // Se mantiene el cálculo local como respaldo.
    })
    .finally(() => {
      pending.delete(id);
    });
}
