import { syncCoupon } from '@/data/remoteWrites';

let reservedCouponCode: string | null = null;

export function getReservedCouponCode() {
  return reservedCouponCode;
}

export function setReservedCouponCode(code: string) {
  reservedCouponCode = code;
  syncCoupon(code);
}

export function clearReservedCouponCode() {
  reservedCouponCode = null;
  syncCoupon(null);
}
