//! Portado de `mobile/src/domain/walkOperation.ts`.

use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::Serialize;

pub const PROVIDER_ON_TIME_GRACE_MINUTES: i64 = 10;

#[derive(Debug, Clone)]
pub struct WalkMetricRecord {
    pub scheduled_start_at: DateTime<Utc>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed: bool,
    pub cancelled_by_provider: bool,
    pub provider_payout: Decimal,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderWalkMetrics {
    pub appointments: usize,
    pub completed: usize,
    pub provider_cancellations: usize,
    pub provider_cancellation_rate: f64,
    pub provider_punctuality_rate: f64,
    pub income: Decimal,
}

pub fn walk_elapsed_seconds(started_at: DateTime<Utc>, now: DateTime<Utc>) -> i64 {
    (now - started_at).num_seconds().max(0)
}

pub fn format_walk_elapsed_time(total_seconds: i64) -> String {
    let seconds = total_seconds.max(0);
    format!(
        "{:02}:{:02}:{:02}",
        seconds / 3600,
        (seconds % 3600) / 60,
        seconds % 60
    )
}

pub fn provider_delay_minutes(record: &WalkMetricRecord) -> Option<i64> {
    record
        .started_at
        .map(|started| (started - record.scheduled_start_at).num_minutes())
}

pub fn calculate_provider_walk_metrics(records: &[WalkMetricRecord]) -> ProviderWalkMetrics {
    let started: Vec<&WalkMetricRecord> = records
        .iter()
        .filter(|record| record.started_at.is_some())
        .collect();

    let punctual = started
        .iter()
        .filter(|record| {
            provider_delay_minutes(record)
                .is_some_and(|delay| delay <= PROVIDER_ON_TIME_GRACE_MINUTES)
        })
        .count();

    let completed = records.iter().filter(|record| record.completed).count();
    let provider_cancellations = records
        .iter()
        .filter(|record| record.cancelled_by_provider)
        .count();

    // Un paseo cancelado por el proveedor paga 0.
    let income = records
        .iter()
        .filter(|record| record.completed)
        .map(|record| record.provider_payout)
        .sum();

    ProviderWalkMetrics {
        appointments: records.len(),
        completed,
        provider_cancellations,
        provider_cancellation_rate: if records.is_empty() {
            0.0
        } else {
            provider_cancellations as f64 / records.len() as f64
        },
        provider_punctuality_rate: if started.is_empty() {
            0.0
        } else {
            punctual as f64 / started.len() as f64
        },
        income,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Duration;

    fn record(delay_minutes: i64, completed: bool, payout: i64) -> WalkMetricRecord {
        let scheduled = Utc::now();
        WalkMetricRecord {
            scheduled_start_at: scheduled,
            started_at: Some(scheduled + Duration::minutes(delay_minutes)),
            completed,
            cancelled_by_provider: false,
            provider_payout: Decimal::new(payout, 2),
        }
    }

    #[test]
    fn formatea_el_tiempo_transcurrido() {
        assert_eq!(format_walk_elapsed_time(0), "00:00:00");
        assert_eq!(format_walk_elapsed_time(65), "00:01:05");
        assert_eq!(format_walk_elapsed_time(3661), "01:01:01");
    }

    #[test]
    fn el_tiempo_transcurrido_nunca_es_negativo() {
        let now = Utc::now();
        assert_eq!(walk_elapsed_seconds(now + Duration::hours(1), now), 0);
    }

    #[test]
    fn diez_minutos_de_retraso_siguen_siendo_puntuales() {
        let metrics = calculate_provider_walk_metrics(&[record(10, true, 1000)]);
        assert_eq!(metrics.provider_punctuality_rate, 1.0);
    }

    #[test]
    fn once_minutos_de_retraso_ya_no_son_puntuales() {
        let metrics = calculate_provider_walk_metrics(&[record(11, true, 1000)]);
        assert_eq!(metrics.provider_punctuality_rate, 0.0);
    }

    #[test]
    fn el_ingreso_solo_suma_paseos_completados() {
        let metrics =
            calculate_provider_walk_metrics(&[record(0, true, 1000), record(0, false, 5000)]);

        assert_eq!(metrics.income, Decimal::new(1000, 2));
        assert_eq!(metrics.completed, 1);
    }

    #[test]
    fn la_tasa_de_cancelacion_cuenta_solo_las_del_proveedor() {
        let mut cancelado = record(0, false, 0);
        cancelado.cancelled_by_provider = true;

        let metrics = calculate_provider_walk_metrics(&[record(0, true, 1000), cancelado]);

        assert_eq!(metrics.provider_cancellations, 1);
        assert_eq!(metrics.provider_cancellation_rate, 0.5);
    }

    #[test]
    fn sin_registros_las_tasas_son_cero() {
        let metrics = calculate_provider_walk_metrics(&[]);

        assert_eq!(metrics.provider_cancellation_rate, 0.0);
        assert_eq!(metrics.provider_punctuality_rate, 0.0);
        assert_eq!(metrics.income, Decimal::ZERO);
    }
}
