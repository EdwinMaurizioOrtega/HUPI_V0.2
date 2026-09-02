//! Portado de `mobile/src/constants/mockCheckout.ts`.
//! Importes en Decimal: la especificación prohíbe floats binarios para dinero.

use rust_decimal::prelude::*;
use rust_decimal::Decimal;
use serde::Serialize;

/// Comisión que paga el cliente sobre el valor del proveedor (15 %).
pub fn client_fee_rate() -> Decimal {
    Decimal::new(15, 2)
}

/// Parte del valor que recibe el proveedor (70 %).
pub fn provider_payout_rate() -> Decimal {
    Decimal::new(70, 2)
}

/// Comisión de Hupi sobre el proveedor (30 %).
pub fn provider_commission_rate() -> Decimal {
    Decimal::new(30, 2)
}

/// IVA vigente hoy en el prototipo (0 %).
pub fn current_iva_rate() -> Decimal {
    Decimal::ZERO
}

/// IVA futuro de Ecuador (15 %), aún no aplicado.
pub fn future_ecuador_iva_rate() -> Decimal {
    Decimal::new(15, 2)
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaymentBreakdown {
    pub provider_value: Decimal,
    pub client_fee: Decimal,
    pub iva: Decimal,
    pub total: Decimal,
    pub provider_payout: Decimal,
    pub hupi_provider_commission: Decimal,
    pub hupi_total_revenue: Decimal,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PlanId {
    Basic,
    Frequent,
}

fn round_currency(value: Decimal) -> Decimal {
    value.round_dp_with_strategy(2, RoundingStrategy::MidpointAwayFromZero)
}

/// El plan `frequent` son 3 paseos con 10 % de descuento.
pub fn provider_value(hourly_price: Decimal, plan: PlanId) -> Decimal {
    match plan {
        PlanId::Frequent => {
            round_currency(hourly_price * Decimal::from(3) * Decimal::new(9, 1))
        }
        PlanId::Basic => round_currency(hourly_price),
    }
}

pub fn calculate_payment(provider_value: Decimal) -> PaymentBreakdown {
    let client_fee = round_currency(provider_value * client_fee_rate());
    let iva = round_currency(provider_value * current_iva_rate());
    let provider_payout = round_currency(provider_value * provider_payout_rate());
    let hupi_provider_commission = round_currency(provider_value * provider_commission_rate());

    PaymentBreakdown {
        provider_value,
        client_fee,
        iva,
        total: round_currency(provider_value + client_fee + iva),
        provider_payout,
        hupi_provider_commission,
        hupi_total_revenue: round_currency(client_fee + hupi_provider_commission),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn desglose_de_pago_con_valor_de_100() {
        let breakdown = calculate_payment(Decimal::new(10000, 2));

        assert_eq!(breakdown.client_fee, Decimal::new(1500, 2));
        assert_eq!(breakdown.iva, Decimal::ZERO);
        assert_eq!(breakdown.total, Decimal::new(11500, 2));
        assert_eq!(breakdown.provider_payout, Decimal::new(7000, 2));
        assert_eq!(breakdown.hupi_provider_commission, Decimal::new(3000, 2));
        assert_eq!(breakdown.hupi_total_revenue, Decimal::new(4500, 2));
    }

    #[test]
    fn el_payout_y_la_comision_suman_el_valor_del_proveedor() {
        let value = Decimal::new(4567, 2);
        let breakdown = calculate_payment(value);

        assert_eq!(
            breakdown.provider_payout + breakdown.hupi_provider_commission,
            value
        );
    }

    #[test]
    fn plan_frecuente_aplica_tres_paseos_con_diez_por_ciento_de_descuento() {
        // 10.00 * 3 * 0.9 = 27.00
        assert_eq!(
            provider_value(Decimal::new(1000, 2), PlanId::Frequent),
            Decimal::new(2700, 2)
        );
    }

    #[test]
    fn plan_basico_conserva_la_tarifa_por_hora() {
        assert_eq!(
            provider_value(Decimal::new(1250, 2), PlanId::Basic),
            Decimal::new(1250, 2)
        );
    }
}
