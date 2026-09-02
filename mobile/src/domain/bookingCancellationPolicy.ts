export const FREE_CANCELLATION_HOURS = 72;
export const PARTIAL_CANCELLATION_HOURS = 24;

export type BookingCancellationTier = 'free' | 'half' | 'full';

export type BookingCancellationQuote = {
  tier: BookingCancellationTier;
  penaltyPercent: 0 | 50 | 100;
  originalAmount: number;
  cancellationCharge: number;
  refundAmount: number;
  hoursUntilStart: number;
};

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateBookingCancellation(
  startsAt: Date | string,
  originalAmount: number,
  now = new Date(),
): BookingCancellationQuote {
  const startTime = startsAt instanceof Date ? startsAt.getTime() : Date.parse(startsAt);
  const amount = Math.max(0, roundCurrency(originalAmount));

  if (!Number.isFinite(startTime)) {
    throw new Error('A valid booking start date and time is required.');
  }

  const hoursUntilStart = (startTime - now.getTime()) / 3_600_000;
  const penaltyPercent: BookingCancellationQuote['penaltyPercent'] = hoursUntilStart >= FREE_CANCELLATION_HOURS
    ? 0
    : hoursUntilStart >= PARTIAL_CANCELLATION_HOURS
      ? 50
      : 100;
  const cancellationCharge = roundCurrency(amount * penaltyPercent / 100);

  return {
    tier: penaltyPercent === 0 ? 'free' : penaltyPercent === 50 ? 'half' : 'full',
    penaltyPercent,
    originalAmount: amount,
    cancellationCharge,
    refundAmount: roundCurrency(Math.max(0, amount - cancellationCharge)),
    hoursUntilStart,
  };
}
