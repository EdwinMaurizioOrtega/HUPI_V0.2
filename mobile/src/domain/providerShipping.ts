export const PROVIDER_SHIPPING_HOURS_PATTERN = /^\d*$/;
export const PROVIDER_SHIPPING_COST_PATTERN = /^\d*([.,]\d{0,2})?$/;

export function isValidShippingHoursInput(value: string) {
  return PROVIDER_SHIPPING_HOURS_PATTERN.test(value);
}

export function isValidShippingCostInput(value: string) {
  return PROVIDER_SHIPPING_COST_PATTERN.test(value);
}

export function parseShippingCost(value: string) {
  if (!value || !isValidShippingCostInput(value)) return 0;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}
