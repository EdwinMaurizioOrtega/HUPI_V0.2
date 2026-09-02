import { getCurrentLocale } from '.';

export function formatDate(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'long' },
) {
  return new Intl.DateTimeFormat(getCurrentLocale(), options).format(new Date(value));
}

export function formatTime(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' },
) {
  return new Intl.DateTimeFormat(getCurrentLocale(), options).format(new Date(value));
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(getCurrentLocale(), options).format(value);
}

export function formatUsd(value: number) {
  return new Intl.NumberFormat(getCurrentLocale(), {
    currency: 'USD',
    style: 'currency',
  }).format(value);
}

