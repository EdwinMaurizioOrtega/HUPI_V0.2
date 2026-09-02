//! Portado de `mobile/src/domain/bookingCancellationPolicy.ts`.

use chrono::{DateTime, Utc};
use rust_decimal::prelude::*;
use rust_decimal::Decimal;
use serde::Serialize;

pub const FREE_CANCELLATION_HOURS: f64 = 72.0;
pub const PARTIAL_CANCELLATION_HOURS: f64 = 24.0;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum CancellationTier {
    Free,
    Half,
    Full,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CancellationQuote {
    pub tier: CancellationTier,
    pub penalty_percent: u8,
    pub original_amount: Decimal,
    pub cancellation_charge: Decimal,
    pub refund_amount: Decimal,
    pub hours_until_start: f64,
}

fn round_currency(value: Decimal) -> Decimal {
    value.round_dp_with_strategy(2, RoundingStrategy::MidpointAwayFromZero)
}

pub fn calculate_booking_cancellation(
    starts_at: DateTime<Utc>,
    original_amount: Decimal,
    now: DateTime<Utc>,
) -> CancellationQuote {
    let amount = round_currency(original_amount).max(Decimal::ZERO);

    let hours_until_start =
        (starts_at - now).num_milliseconds() as f64 / 3_600_000.0;

    let penalty_percent: u8 = if hours_until_start >= FREE_CANCELLATION_HOURS {
        0
    } else if hours_until_start >= PARTIAL_CANCELLATION_HOURS {
        50
    } else {
        100
    };

    let cancellation_charge =
        round_currency(amount * Decimal::from(penalty_percent) / Decimal::from(100));

    let tier = match penalty_percent {
        0 => CancellationTier::Free,
        50 => CancellationTier::Half,
        _ => CancellationTier::Full,
    };

    CancellationQuote {
        tier,
        penalty_percent,
        original_amount: amount,
        cancellation_charge,
        refund_amount: round_currency((amount - cancellation_charge).max(Decimal::ZERO)),
        hours_until_start,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Duration;

    fn amount() -> Decimal {
        Decimal::new(10000, 2) // 100.00
    }

    #[test]
    fn cancelacion_con_mas_de_72h_es_gratuita() {
        let now = Utc::now();
        let quote = calculate_booking_cancellation(now + Duration::hours(73), amount(), now);

        assert_eq!(quote.tier, CancellationTier::Free);
        assert_eq!(quote.penalty_percent, 0);
        assert_eq!(quote.cancellation_charge, Decimal::ZERO);
        assert_eq!(quote.refund_amount, amount());
    }

    #[test]
    fn exactamente_72h_sigue_siendo_gratuita() {
        let now = Utc::now();
        let quote = calculate_booking_cancellation(now + Duration::hours(72), amount(), now);

        assert_eq!(quote.tier, CancellationTier::Free);
    }

    #[test]
    fn entre_24h_y_72h_cobra_la_mitad() {
        let now = Utc::now();
        let quote = calculate_booking_cancellation(now + Duration::hours(48), amount(), now);

        assert_eq!(quote.tier, CancellationTier::Half);
        assert_eq!(quote.penalty_percent, 50);
        assert_eq!(quote.cancellation_charge, Decimal::new(5000, 2));
        assert_eq!(quote.refund_amount, Decimal::new(5000, 2));
    }

    #[test]
    fn exactamente_24h_cobra_la_mitad() {
        let now = Utc::now();
        let quote = calculate_booking_cancellation(now + Duration::hours(24), amount(), now);

        assert_eq!(quote.tier, CancellationTier::Half);
    }

    #[test]
    fn menos_de_24h_cobra_todo_y_no_reembolsa() {
        let now = Utc::now();
        let quote = calculate_booking_cancellation(now + Duration::hours(3), amount(), now);

        assert_eq!(quote.tier, CancellationTier::Full);
        assert_eq!(quote.penalty_percent, 100);
        assert_eq!(quote.cancellation_charge, amount());
        assert_eq!(quote.refund_amount, Decimal::ZERO);
    }

    #[test]
    fn una_reserva_ya_pasada_cobra_todo() {
        let now = Utc::now();
        let quote = calculate_booking_cancellation(now - Duration::hours(5), amount(), now);

        assert_eq!(quote.tier, CancellationTier::Full);
        assert!(quote.hours_until_start < 0.0);
    }

    #[test]
    fn importe_negativo_se_normaliza_a_cero() {
        let now = Utc::now();
        let quote =
            calculate_booking_cancellation(now + Duration::hours(1), Decimal::new(-500, 2), now);

        assert_eq!(quote.original_amount, Decimal::ZERO);
        assert_eq!(quote.refund_amount, Decimal::ZERO);
    }

    #[test]
    fn redondea_a_dos_decimales() {
        let now = Utc::now();
        let quote =
            calculate_booking_cancellation(now + Duration::hours(48), Decimal::new(3333, 2), now);

        // 33.33 * 50% = 16.665 -> 16.67
        assert_eq!(quote.cancellation_charge, Decimal::new(1667, 2));
        assert_eq!(quote.refund_amount, Decimal::new(1666, 2));
    }
}
