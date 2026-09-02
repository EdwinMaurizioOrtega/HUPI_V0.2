use axum::extract::{Path, Query, State};
use axum::routing::{get, post};
use axum::{Json, Router};
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use uuid::Uuid;

use crate::auth::CurrentAccount;
use crate::domain::cancellation::{calculate_booking_cancellation, CancellationQuote};
use crate::domain::pricing::{calculate_payment, PaymentBreakdown};
use crate::error::{AppError, AppResult};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/bookings", get(list_bookings).post(create_booking))
        .route("/bookings/checkout/quote", post(checkout_quote))
        .route("/bookings/{id}", get(booking_detail))
        .route("/bookings/{id}/start", post(start_walk))
        .route("/bookings/{id}/complete", post(complete_walk))
        .route("/bookings/{id}/cancellation-quote", get(cancellation_quote))
        .route("/bookings/{id}/cancel", post(cancel_booking))
        .route("/bookings/{id}/review", get(get_review).post(submit_review))
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BookingView {
    pub id: Uuid,
    pub reference_code: Option<String>,
    pub service: String,
    pub status: String,
    pub section: String,
    pub provider_id: String,
    pub provider: String,
    pub provider_initials: String,
    pub pet: Option<String>,
    pub client: String,
    pub offer_title: Option<String>,
    pub scheduled_start_at: DateTime<Utc>,
    pub duration_minutes: i32,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub actual_duration_minutes: Option<i32>,
    pub total_paid: Decimal,
    pub service_value: Decimal,
    pub client_fee: Decimal,
    pub provider_payout: Decimal,
    pub client_refund_amount: Option<Decimal>,
    pub cancelled_by: Option<String>,
    pub chat_available: bool,
    pub can_cancel: bool,
    pub timeline_step: i32,
    pub address_snapshot: Option<serde_json::Value>,
}

const BOOKING_SELECT: &str = r#"
    SELECT b.id, b.reference_code, b.service::text AS service, b.status::text AS status,
           b.section::text AS section,
           coalesce(p.code, p.id::text) AS provider_reference,
           coalesce(p.display_name, '') AS provider_name,
           coalesce(p.initials, '') AS provider_initials,
           pe.name AS pet_name,
           a.first_name, a.last_name,
           b.offer_title, b.scheduled_start_at, b.duration_minutes,
           b.started_at, b.completed_at, b.actual_duration_minutes,
           b.total_paid, b.service_value, b.client_fee, b.provider_payout,
           b.client_refund_amount, b.cancelled_by::text AS cancelled_by,
           b.chat_available, b.can_cancel, b.timeline_step, b.address_snapshot
    FROM bookings b
    JOIN providers p ON p.id = b.provider_id
    JOIN accounts a ON a.id = b.client_account_id
    LEFT JOIN pets pe ON pe.id = b.pet_id
"#;

fn to_booking(row: &sqlx::postgres::PgRow) -> BookingView {
    let first: String = row.get("first_name");
    let last: String = row.get("last_name");

    BookingView {
        id: row.get("id"),
        reference_code: row.get("reference_code"),
        service: row.get("service"),
        status: row.get("status"),
        section: row.get("section"),
        provider_id: row.get("provider_reference"),
        provider: row.get("provider_name"),
        provider_initials: row.get("provider_initials"),
        pet: row.get("pet_name"),
        client: format!("{first} {last}").trim().to_string(),
        offer_title: row.get("offer_title"),
        scheduled_start_at: row.get("scheduled_start_at"),
        duration_minutes: row.get("duration_minutes"),
        started_at: row.get("started_at"),
        completed_at: row.get("completed_at"),
        actual_duration_minutes: row.get("actual_duration_minutes"),
        total_paid: row.get("total_paid"),
        service_value: row.get("service_value"),
        client_fee: row.get("client_fee"),
        provider_payout: row.get("provider_payout"),
        client_refund_amount: row.get("client_refund_amount"),
        cancelled_by: row.get("cancelled_by"),
        chat_available: row.get("chat_available"),
        can_cancel: row.get("can_cancel"),
        timeline_step: row.get("timeline_step"),
        address_snapshot: row.get("address_snapshot"),
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BookingListQuery {
    /// `client` (por defecto) o `provider`.
    pub role: Option<String>,
    pub section: Option<String>,
}

async fn list_bookings(
    State(state): State<AppState>,
    account: CurrentAccount,
    Query(query): Query<BookingListQuery>,
) -> AppResult<Json<Vec<BookingView>>> {
    let as_provider = query.role.as_deref() == Some("provider");

    // Cliente y proveedor son dos vistas sobre la MISMA fila.
    let sql = format!(
        "{BOOKING_SELECT} WHERE {} ORDER BY b.scheduled_start_at DESC",
        if as_provider {
            "p.account_id = $1"
        } else {
            "b.client_account_id = $1"
        }
    );

    let rows = sqlx::query(&sql)
        .bind(account.id)
        .fetch_all(&state.db)
        .await?;

    let bookings: Vec<BookingView> = rows
        .iter()
        .map(to_booking)
        .filter(|booking| {
            query
                .section
                .as_ref()
                .is_none_or(|section| &booking.section == section)
        })
        .collect();

    Ok(Json(bookings))
}

/// Acepta el UUID o el código legible (`QA-WALK-001`).
async fn find_booking(
    state: &AppState,
    account_id: Uuid,
    reference: &str,
) -> AppResult<sqlx::postgres::PgRow> {
    let sql = format!(
        "{BOOKING_SELECT} WHERE (b.reference_code = $1 OR b.id::text = $1)
           AND (b.client_account_id = $2 OR p.account_id = $2)"
    );

    sqlx::query(&sql)
        .bind(reference)
        .bind(account_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or(AppError::NotFound("reserva"))
}

async fn booking_detail(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<String>,
) -> AppResult<Json<BookingView>> {
    let row = find_booking(&state, account.id, &id).await?;
    Ok(Json(to_booking(&row)))
}

// --- Checkout -------------------------------------------------------------

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckoutQuoteRequest {
    pub provider_value: Decimal,
}

async fn checkout_quote(
    _account: CurrentAccount,
    Json(payload): Json<CheckoutQuoteRequest>,
) -> AppResult<Json<PaymentBreakdown>> {
    if payload.provider_value <= Decimal::ZERO {
        return Err(AppError::Validation(
            "el valor del servicio debe ser mayor que cero".to_string(),
        ));
    }
    Ok(Json(calculate_payment(payload.provider_value)))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBookingRequest {
    pub provider_id: String,
    pub pet_id: Option<Uuid>,
    pub service: Option<String>,
    pub plan_id: Option<Uuid>,
    pub offer_title: Option<String>,
    pub scheduled_start_at: DateTime<Utc>,
    pub duration_minutes: Option<i32>,
    pub provider_value: Decimal,
    pub address_snapshot: Option<serde_json::Value>,
    pub meeting_preferences: Option<serde_json::Value>,
}

async fn create_booking(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<CreateBookingRequest>,
) -> AppResult<Json<BookingView>> {
    if payload.provider_value <= Decimal::ZERO {
        return Err(AppError::Validation(
            "el valor del servicio debe ser mayor que cero".to_string(),
        ));
    }

    let breakdown = calculate_payment(payload.provider_value);
    let service = payload.service.unwrap_or_else(|| "walk".to_string());

    let provider_uuid: Uuid =
        sqlx::query("SELECT id FROM providers WHERE code = $1 OR id::text = $1")
            .bind(&payload.provider_id)
            .fetch_optional(&state.db)
            .await?
            .map(|row| row.get("id"))
            .ok_or(AppError::NotFound("proveedor"))?;

    let id: Uuid = sqlx::query(
        r#"
        INSERT INTO bookings (
            client_account_id, provider_id, pet_id, service, status, section,
            plan_id, offer_title, scheduled_start_at, duration_minutes,
            total_paid, service_value, client_fee, provider_payout,
            hupi_provider_commission, hupi_total_revenue,
            address_snapshot, meeting_preferences, timeline_step
        ) VALUES (
            $1, $2, $3, $4::service_id, 'scheduled', 'upcoming',
            $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 2
        )
        RETURNING id
        "#,
    )
    .bind(account.id)
    .bind(provider_uuid)
    .bind(payload.pet_id)
    .bind(&service)
    .bind(payload.plan_id)
    .bind(&payload.offer_title)
    .bind(payload.scheduled_start_at)
    .bind(payload.duration_minutes.unwrap_or(60))
    .bind(breakdown.total)
    .bind(breakdown.provider_value)
    .bind(breakdown.client_fee)
    .bind(breakdown.provider_payout)
    .bind(breakdown.hupi_provider_commission)
    .bind(breakdown.hupi_total_revenue)
    .bind(&payload.address_snapshot)
    .bind(&payload.meeting_preferences)
    .fetch_one(&state.db)
    .await?
    .get("id");

    audit(&state, account.id, "booking_created", "booking", id).await?;

    let row = find_booking(&state, account.id, &id.to_string()).await?;
    Ok(Json(to_booking(&row)))
}

// --- Operación del paseo --------------------------------------------------

/// Solo el proveedor dueño de la reserva puede operarla.
async fn assert_is_provider(state: &AppState, account_id: Uuid, booking_id: Uuid) -> AppResult<()> {
    let owns: Option<bool> = sqlx::query(
        r#"
        SELECT TRUE AS owns FROM bookings b
        JOIN providers p ON p.id = b.provider_id
        WHERE b.id = $1 AND p.account_id = $2
        "#,
    )
    .bind(booking_id)
    .bind(account_id)
    .fetch_optional(&state.db)
    .await?
    .map(|row| row.get("owns"));

    owns.map(|_| ()).ok_or(AppError::Forbidden)
}

async fn start_walk(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<String>,
) -> AppResult<Json<BookingView>> {
    let existing = find_booking(&state, account.id, &id).await?;
    let booking_id: Uuid = existing.get("id");
    assert_is_provider(&state, account.id, booking_id).await?;

    let status: String = existing.get("status");
    if status != "scheduled" && status != "confirmed" && status != "upcoming" {
        return Err(AppError::Conflict(
            "el paseo no está en un estado que permita iniciarlo".to_string(),
        ));
    }

    let mut tx = state.db.begin().await?;

    sqlx::query(
        r#"
        UPDATE bookings
        SET status = 'in_progress', section = 'current', started_at = now(),
            can_cancel = FALSE, timeline_step = 3, updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(booking_id)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO walk_events (booking_id, event_type, actor_role, actor_account_id)
        VALUES ($1, 'walk_started', 'provider', $2)
        "#,
    )
    .bind(booking_id)
    .bind(account.id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    let row = find_booking(&state, account.id, &id).await?;
    Ok(Json(to_booking(&row)))
}

async fn complete_walk(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<String>,
) -> AppResult<Json<BookingView>> {
    let existing = find_booking(&state, account.id, &id).await?;
    let booking_id: Uuid = existing.get("id");
    assert_is_provider(&state, account.id, booking_id).await?;

    let status: String = existing.get("status");
    if status != "in_progress" {
        return Err(AppError::Conflict(
            "solo se puede finalizar un paseo en curso".to_string(),
        ));
    }

    let mut tx = state.db.begin().await?;

    sqlx::query(
        r#"
        UPDATE bookings
        SET status = 'completed', section = 'history', completed_at = now(),
            actual_duration_minutes = GREATEST(1, EXTRACT(EPOCH FROM (now() - started_at))::int / 60),
            chat_available = FALSE, can_cancel = FALSE, timeline_step = 5, updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(booking_id)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO walk_events (booking_id, event_type, actor_role, actor_account_id)
        VALUES ($1, 'walk_completed', 'provider', $2)
        "#,
    )
    .bind(booking_id)
    .bind(account.id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    let row = find_booking(&state, account.id, &id).await?;
    Ok(Json(to_booking(&row)))
}

// --- Cancelación ----------------------------------------------------------

async fn cancellation_quote(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<String>,
) -> AppResult<Json<CancellationQuote>> {
    let row = find_booking(&state, account.id, &id).await?;
    let starts_at: DateTime<Utc> = row.get("scheduled_start_at");
    let total: Decimal = row.get("total_paid");

    Ok(Json(calculate_booking_cancellation(
        starts_at,
        total,
        Utc::now(),
    )))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CancelRequest {
    /// `hupi_balance`, `original_payment_method` o `manual_transfer`.
    pub refund_method: Option<String>,
    pub reason: Option<String>,
}

async fn cancel_booking(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<String>,
    Json(payload): Json<CancelRequest>,
) -> AppResult<Json<BookingView>> {
    let row = find_booking(&state, account.id, &id).await?;
    let booking_id: Uuid = row.get("id");
    let status: String = row.get("status");

    if status == "cancelled" || status == "completed" {
        return Err(AppError::Conflict(
            "la reserva ya está cerrada".to_string(),
        ));
    }

    let client_account_id: Uuid = sqlx::query("SELECT client_account_id FROM bookings WHERE id = $1")
        .bind(booking_id)
        .fetch_one(&state.db)
        .await?
        .get("client_account_id");

    let cancelled_by = if client_account_id == account.id {
        "client"
    } else {
        "provider"
    };

    let starts_at: DateTime<Utc> = row.get("scheduled_start_at");
    let total: Decimal = row.get("total_paid");

    // Si cancela el proveedor no hay penalización: reembolso total y payout 0.
    let quote = calculate_booking_cancellation(starts_at, total, Utc::now());
    let (charge, refund, tier) = if cancelled_by == "provider" {
        (Decimal::ZERO, total, "free".to_string())
    } else {
        (
            quote.cancellation_charge,
            quote.refund_amount,
            format!("{:?}", quote.tier).to_lowercase(),
        )
    };

    let mut tx = state.db.begin().await?;

    sqlx::query(
        r#"
        UPDATE bookings
        SET status = 'cancelled', section = 'cancelled', cancelled_at = now(),
            cancelled_by = $2::actor_role, cancellation_reason = $3,
            cancellation_tier = $4::cancellation_tier,
            client_refund_amount = $5,
            provider_payout = CASE WHEN $2 = 'provider' THEN 0 ELSE provider_payout END,
            chat_available = FALSE, can_cancel = FALSE, updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(booking_id)
    .bind(cancelled_by)
    .bind(&payload.reason)
    .bind(&tier)
    .bind(refund)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO booking_cancellations (
            booking_id, tier, penalty_percent, original_amount, cancellation_charge,
            refund_amount, refund_method, hours_until_start, cancelled_by
        ) VALUES ($1, $2::cancellation_tier, $3, $4, $5, $6, $7::refund_method, $8, $9::actor_role)
        ON CONFLICT (booking_id) DO UPDATE SET
            tier = EXCLUDED.tier,
            refund_amount = EXCLUDED.refund_amount,
            cancellation_charge = EXCLUDED.cancellation_charge
        "#,
    )
    .bind(booking_id)
    .bind(&tier)
    .bind(quote.penalty_percent as i16)
    .bind(total)
    .bind(charge)
    .bind(refund)
    .bind(
        payload
            .refund_method
            .clone()
            .unwrap_or_else(|| "original_payment_method".to_string()),
    )
    .bind(Decimal::from_f64_retain(quote.hours_until_start).unwrap_or_default())
    .bind(cancelled_by)
    .execute(&mut *tx)
    .await?;

    if cancelled_by == "provider" {
        sqlx::query(
            r#"
            INSERT INTO walk_events (booking_id, event_type, actor_role, actor_account_id)
            VALUES ($1, 'provider_cancelled_walk', 'provider', $2)
            "#,
        )
        .bind(booking_id)
        .bind(account.id)
        .execute(&mut *tx)
        .await?;
    }

    // El reembolso a Saldo Hupi entra como movimiento del ledger.
    if payload.refund_method.as_deref() == Some("hupi_balance") && refund > Decimal::ZERO {
        sqlx::query(
            r#"
            INSERT INTO wallet_movements (account_id, concept, amount, movement_type, status)
            VALUES ($1, $2, $3, 'refund_credited', 'available')
            "#,
        )
        .bind(client_account_id)
        .bind(format!("Reembolso reserva {id}"))
        .bind(refund)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    audit(&state, account.id, "booking_cancelled", "booking", booking_id).await?;

    let row = find_booking(&state, account.id, &id).await?;
    Ok(Json(to_booking(&row)))
}

// --- Reseñas --------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BookingReview {
    pub rating: i16,
    #[serde(default)]
    pub tags: Vec<String>,
    pub comment: Option<String>,
}

async fn get_review(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<String>,
) -> AppResult<Json<Option<BookingReview>>> {
    let booking = find_booking(&state, account.id, &id).await?;
    let booking_id: Uuid = booking.get("id");

    let review = sqlx::query("SELECT rating, tags, comment FROM booking_reviews WHERE booking_id = $1")
        .bind(booking_id)
        .fetch_optional(&state.db)
        .await?
        .map(|row| BookingReview {
            rating: row.get("rating"),
            tags: row.get("tags"),
            comment: row.get("comment"),
        });

    Ok(Json(review))
}

async fn submit_review(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<String>,
    Json(payload): Json<BookingReview>,
) -> AppResult<Json<BookingReview>> {
    if !(1..=5).contains(&payload.rating) {
        return Err(AppError::Validation(
            "la calificación debe estar entre 1 y 5".to_string(),
        ));
    }

    let booking = find_booking(&state, account.id, &id).await?;
    let booking_id: Uuid = booking.get("id");
    let status: String = booking.get("status");

    // Solo se reseña lo ya completado.
    if status != "completed" {
        return Err(AppError::Conflict(
            "solo se puede reseñar una reserva completada".to_string(),
        ));
    }

    sqlx::query(
        r#"
        INSERT INTO booking_reviews (booking_id, rating, tags, comment)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (booking_id) DO UPDATE SET
            rating = EXCLUDED.rating, tags = EXCLUDED.tags, comment = EXCLUDED.comment
        "#,
    )
    .bind(booking_id)
    .bind(payload.rating)
    .bind(&payload.tags)
    .bind(&payload.comment)
    .execute(&state.db)
    .await?;

    Ok(Json(payload))
}

pub async fn audit(
    state: &AppState,
    actor: Uuid,
    action: &str,
    entity_type: &str,
    entity_id: Uuid,
) -> AppResult<()> {
    sqlx::query(
        r#"
        INSERT INTO audit_log (actor_account_id, actor_role, action, entity_type, entity_id)
        VALUES ($1, 'client', $2, $3, $4)
        "#,
    )
    .bind(actor)
    .bind(action)
    .bind(entity_type)
    .bind(entity_id)
    .execute(&state.db)
    .await?;
    Ok(())
}
