use axum::extract::{Path, State};
use axum::routing::{get, post};
use axum::{Json, Router};
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use uuid::Uuid;

use crate::auth::CurrentAccount;
use crate::domain::pricing::calculate_payment;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/coordination/requests", get(list_requests).post(create_request))
        .route("/coordination/requests/{id}", get(request_detail))
        .route(
            "/coordination/requests/{id}/respond",
            post(respond_request),
        )
        .route("/offers", post(create_offer))
        .route("/offers/{id}/action", post(offer_action))
        .route("/conversations", get(list_conversations))
        .route("/conversations/{id}/messages", get(list_messages).post(send_message))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestView {
    pub id: Uuid,
    pub client_account_id: Uuid,
    pub provider_id: Uuid,
    pub provider_name: String,
    pub pet_id: Option<Uuid>,
    pub pet_name: Option<String>,
    pub service: String,
    pub status: String,
    pub zone: Option<String>,
    pub created_at: DateTime<Utc>,
    pub conversation_id: Option<Uuid>,
}

const REQUEST_SELECT: &str = r#"
    SELECT r.id, r.client_account_id, r.provider_id,
           coalesce(p.display_name, '') AS provider_name,
           r.pet_id, pe.name AS pet_name, r.service::text AS service,
           r.status::text AS status, r.zone, r.created_at,
           c.id AS conversation_id
    FROM coordination_requests r
    JOIN providers p ON p.id = r.provider_id
    LEFT JOIN pets pe ON pe.id = r.pet_id
    LEFT JOIN conversations c ON c.related_request_id = r.id
"#;

fn to_request(row: &sqlx::postgres::PgRow) -> RequestView {
    RequestView {
        id: row.get("id"),
        client_account_id: row.get("client_account_id"),
        provider_id: row.get("provider_id"),
        provider_name: row.get("provider_name"),
        pet_id: row.get("pet_id"),
        pet_name: row.get("pet_name"),
        service: row.get("service"),
        status: row.get("status"),
        zone: row.get("zone"),
        created_at: row.get("created_at"),
        conversation_id: row.get("conversation_id"),
    }
}

async fn list_requests(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<Vec<RequestView>>> {
    // Devuelve las solicitudes en las que participa, como cliente o proveedor.
    let rows = sqlx::query(&format!(
        "{REQUEST_SELECT} WHERE r.client_account_id = $1 OR p.account_id = $1
         ORDER BY r.created_at DESC"
    ))
    .bind(account.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(rows.iter().map(to_request).collect()))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateRequestInput {
    pub provider_id: Uuid,
    pub pet_id: Option<Uuid>,
    pub service: Option<String>,
    pub tentative_date: Option<chrono::NaiveDate>,
    pub tentative_time: Option<String>,
    pub zone: Option<String>,
}

async fn create_request(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<CreateRequestInput>,
) -> AppResult<Json<RequestView>> {
    let service = payload.service.unwrap_or_else(|| "walk".to_string());
    let mut tx = state.db.begin().await?;

    let request_id: Uuid = sqlx::query(
        r#"
        INSERT INTO coordination_requests (
            client_account_id, provider_id, pet_id, service, tentative_date,
            tentative_time, zone, status
        ) VALUES ($1, $2, $3, $4::service_id, $5, $6, $7, 'coordination_request')
        RETURNING id
        "#,
    )
    .bind(account.id)
    .bind(payload.provider_id)
    .bind(payload.pet_id)
    .bind(&service)
    .bind(payload.tentative_date)
    .bind(&payload.tentative_time)
    .bind(&payload.zone)
    .fetch_one(&mut *tx)
    .await?
    .get("id");

    // Crear la solicitud abre la conversación autorizada entre ambos.
    let provider_name: String = sqlx::query("SELECT coalesce(display_name, '') AS name FROM providers WHERE id = $1")
        .bind(payload.provider_id)
        .fetch_one(&mut *tx)
        .await?
        .get("name");

    sqlx::query(
        r#"
        INSERT INTO conversations (
            conversation_type, client_account_id, provider_id, related_request_id, title
        ) VALUES ('services', $1, $2, $3, $4)
        "#,
    )
    .bind(account.id)
    .bind(payload.provider_id)
    .bind(request_id)
    .bind(&provider_name)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    let row = sqlx::query(&format!("{REQUEST_SELECT} WHERE r.id = $1"))
        .bind(request_id)
        .fetch_one(&state.db)
        .await?;

    Ok(Json(to_request(&row)))
}

async fn request_detail(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<Uuid>,
) -> AppResult<Json<RequestView>> {
    let row = sqlx::query(&format!(
        "{REQUEST_SELECT} WHERE r.id = $1 AND (r.client_account_id = $2 OR p.account_id = $2)"
    ))
    .bind(id)
    .bind(account.id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("solicitud"))?;

    Ok(Json(to_request(&row)))
}

// --- Ofertas --------------------------------------------------------------

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OfferView {
    pub id: Uuid,
    pub request_id: Uuid,
    pub provider_id: Uuid,
    pub title: String,
    pub description: String,
    pub base_price: Decimal,
    pub client_fee: Decimal,
    pub client_total: Decimal,
    pub provider_amount: Decimal,
    pub hupi_commission: Decimal,
    pub status: String,
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateOfferInput {
    pub request_id: Uuid,
    pub approved_plan_id: Option<Uuid>,
    pub title: String,
    #[serde(default)]
    pub description: String,
    pub base_price: Decimal,
    pub valid_for_hours: Option<i64>,
}

async fn create_offer(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<CreateOfferInput>,
) -> AppResult<Json<OfferView>> {
    if payload.base_price <= Decimal::ZERO {
        return Err(AppError::Validation(
            "el precio debe ser mayor que cero".to_string(),
        ));
    }

    // Solo el proveedor dueño de la solicitud puede ofertar.
    let provider_id: Uuid = sqlx::query(
        r#"
        SELECT p.id FROM coordination_requests r
        JOIN providers p ON p.id = r.provider_id
        WHERE r.id = $1 AND p.account_id = $2
        "#,
    )
    .bind(payload.request_id)
    .bind(account.id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::Forbidden)?
    .get("id");

    let breakdown = calculate_payment(payload.base_price);
    let expires_at = Utc::now() + chrono::Duration::hours(payload.valid_for_hours.unwrap_or(48));

    let row = sqlx::query(
        r#"
        INSERT INTO service_offers (
            request_id, provider_id, approved_plan_id, title, description,
            base_price, client_fee, client_total, provider_amount, hupi_commission,
            status, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'sent', $11)
        RETURNING id, request_id, provider_id, title, description, base_price,
                  client_fee, client_total, provider_amount, hupi_commission,
                  status::text AS status, expires_at
        "#,
    )
    .bind(payload.request_id)
    .bind(provider_id)
    .bind(payload.approved_plan_id)
    .bind(payload.title.trim())
    .bind(&payload.description)
    .bind(breakdown.provider_value)
    .bind(breakdown.client_fee)
    .bind(breakdown.total)
    .bind(breakdown.provider_payout)
    .bind(breakdown.hupi_provider_commission)
    .bind(expires_at)
    .fetch_one(&state.db)
    .await?;

    sqlx::query(
        "UPDATE coordination_requests SET status = 'offer_sent', updated_at = now() WHERE id = $1",
    )
    .bind(payload.request_id)
    .execute(&state.db)
    .await?;

    Ok(Json(OfferView {
        id: row.get("id"),
        request_id: row.get("request_id"),
        provider_id: row.get("provider_id"),
        title: row.get("title"),
        description: row.get("description"),
        base_price: row.get("base_price"),
        client_fee: row.get("client_fee"),
        client_total: row.get("client_total"),
        provider_amount: row.get("provider_amount"),
        hupi_commission: row.get("hupi_commission"),
        status: row.get("status"),
        expires_at: row.get("expires_at"),
    }))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OfferActionRequest {
    /// `view`, `decline` o `accept`.
    pub action: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RespondRequest {
    /// `accept` o `decline`.
    pub action: String,
}

/// El proveedor acepta o rechaza una solicitud de coordinación suya.
async fn respond_request(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<Uuid>,
    Json(payload): Json<RespondRequest>,
) -> AppResult<Json<RequestView>> {
    let next = match payload.action.as_str() {
        "accept" => "coordination_request",
        "decline" => "cancelled",
        other => {
            return Err(AppError::Validation(format!(
                "acción no reconocida: {other}"
            )))
        }
    };

    // Solo el proveedor dueño de la solicitud puede responderla.
    let owned = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS (
             SELECT 1 FROM coordination_requests r
             JOIN providers p ON p.id = r.provider_id
             WHERE r.id = $1 AND p.account_id = $2
         )",
    )
    .bind(id)
    .bind(account.id)
    .fetch_one(&state.db)
    .await?;

    if !owned {
        return Err(AppError::NotFound("solicitud"));
    }

    sqlx::query(
        "UPDATE coordination_requests SET status = $2::booking_status, updated_at = now()
         WHERE id = $1",
    )
    .bind(id)
    .bind(next)
    .execute(&state.db)
    .await?;

    let row = sqlx::query(&format!("{REQUEST_SELECT} WHERE r.id = $1"))
        .bind(id)
        .fetch_one(&state.db)
        .await?;

    Ok(Json(to_request(&row)))
}

async fn offer_action(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<Uuid>,
    Json(payload): Json<OfferActionRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let row = sqlx::query(
        r#"
        SELECT o.status::text AS status, o.expires_at
        FROM service_offers o
        JOIN coordination_requests r ON r.id = o.request_id
        WHERE o.id = $1 AND r.client_account_id = $2
        "#,
    )
    .bind(id)
    .bind(account.id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("oferta"))?;

    let current: String = row.get("status");
    let expires_at: Option<DateTime<Utc>> = row.get("expires_at");

    if expires_at.is_some_and(|expiry| expiry < Utc::now()) {
        sqlx::query("UPDATE service_offers SET status = 'expired' WHERE id = $1")
            .bind(id)
            .execute(&state.db)
            .await?;
        return Err(AppError::Conflict("la oferta ha expirado".to_string()));
    }

    let next = match payload.action.as_str() {
        "view" if current == "sent" => "viewed",
        "decline" if current == "sent" || current == "viewed" => "declined",
        "accept" if current == "sent" || current == "viewed" => "accepted",
        other => {
            return Err(AppError::Conflict(format!(
                "no se puede aplicar '{other}' sobre una oferta en estado {current}"
            )))
        }
    };

    sqlx::query(
        r#"
        UPDATE service_offers
        SET status = $2::offer_status,
            viewed_at = CASE WHEN $2 = 'viewed' THEN now() ELSE viewed_at END,
            updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(id)
    .bind(next)
    .execute(&state.db)
    .await?;

    Ok(Json(serde_json::json!({ "status": next })))
}

// --- Chat -----------------------------------------------------------------

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConversationView {
    /// Código legible (`chat-service-walk-001`) si existe; si no, el UUID.
    pub id: String,
    pub conversation_type: String,
    pub title: String,
    pub is_open: bool,
    pub last_message_at: Option<DateTime<Utc>>,
    pub last_message: Option<String>,
    pub unread_count: i64,
}

async fn list_conversations(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<Vec<ConversationView>>> {
    let rows = sqlx::query(
        r#"
        SELECT coalesce(c.code, c.id::text) AS reference,
               c.conversation_type::text AS conversation_type, c.title,
               c.is_open, c.last_message_at,
               (SELECT body FROM messages m WHERE m.conversation_id = c.id
                ORDER BY m.created_at DESC LIMIT 1) AS last_message,
               (SELECT count(*) FROM messages m WHERE m.conversation_id = c.id
                AND m.status = 'sent' AND m.sender_account_id IS DISTINCT FROM $1) AS unread_count
        FROM conversations c
        LEFT JOIN providers p ON p.id = c.provider_id
        WHERE c.client_account_id = $1 OR p.account_id = $1
        ORDER BY c.last_message_at DESC NULLS LAST
        "#,
    )
    .bind(account.id)
    .fetch_all(&state.db)
    .await?;

    let conversations = rows
        .into_iter()
        .map(|row| ConversationView {
            id: row.get("reference"),
            conversation_type: row.get("conversation_type"),
            title: row.get("title"),
            is_open: row.get("is_open"),
            last_message_at: row.get("last_message_at"),
            last_message: row.get("last_message"),
            unread_count: row.get("unread_count"),
        })
        .collect();

    Ok(Json(conversations))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageView {
    pub id: Uuid,
    pub sender_role: String,
    pub sender_account_id: Option<Uuid>,
    pub body: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

/// Resuelve la conversación por código o UUID y comprueba que la cuenta participa.
async fn resolve_conversation(
    state: &AppState,
    account_id: Uuid,
    reference: &str,
) -> AppResult<Uuid> {
    sqlx::query(
        r#"
        SELECT c.id FROM conversations c
        LEFT JOIN providers p ON p.id = c.provider_id
        WHERE (c.code = $1 OR c.id::text = $1)
          AND (c.client_account_id = $2 OR p.account_id = $2)
        "#,
    )
    .bind(reference)
    .bind(account_id)
    .fetch_optional(&state.db)
    .await?
    .map(|row| row.get("id"))
    .ok_or(AppError::Forbidden)
}

async fn list_messages(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(reference): Path<String>,
) -> AppResult<Json<Vec<MessageView>>> {
    let id = resolve_conversation(&state, account.id, &reference).await?;

    let rows = sqlx::query(
        r#"
        SELECT id, sender_role::text AS sender_role, sender_account_id, body,
               status::text AS status, created_at
        FROM messages WHERE conversation_id = $1 ORDER BY created_at
        "#,
    )
    .bind(id)
    .fetch_all(&state.db)
    .await?;

    // Abrir la conversación marca como leídos los mensajes del otro.
    sqlx::query(
        "UPDATE messages SET status = 'read'
         WHERE conversation_id = $1 AND sender_account_id IS DISTINCT FROM $2",
    )
    .bind(id)
    .bind(account.id)
    .execute(&state.db)
    .await?;

    let messages = rows
        .into_iter()
        .map(|row| MessageView {
            id: row.get("id"),
            sender_role: row.get("sender_role"),
            sender_account_id: row.get("sender_account_id"),
            body: row.get("body"),
            status: row.get("status"),
            created_at: row.get("created_at"),
        })
        .collect();

    Ok(Json(messages))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SendMessageRequest {
    pub body: String,
}

async fn send_message(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(reference): Path<String>,
    Json(payload): Json<SendMessageRequest>,
) -> AppResult<Json<MessageView>> {
    let id = resolve_conversation(&state, account.id, &reference).await?;

    if payload.body.trim().is_empty() {
        return Err(AppError::Validation(
            "el mensaje no puede estar vacío".to_string(),
        ));
    }

    let is_provider: bool = sqlx::query(
        "SELECT EXISTS(SELECT 1 FROM providers WHERE account_id = $1) AS ok",
    )
    .bind(account.id)
    .fetch_one(&state.db)
    .await?
    .get("ok");

    let mut tx = state.db.begin().await?;

    let row = sqlx::query(
        r#"
        INSERT INTO messages (conversation_id, sender_account_id, sender_role, body, status)
        VALUES ($1, $2, $3::actor_role, $4, 'sent')
        RETURNING id, sender_role::text AS sender_role, sender_account_id, body,
                  status::text AS status, created_at
        "#,
    )
    .bind(id)
    .bind(account.id)
    .bind(if is_provider { "provider" } else { "client" })
    .bind(payload.body.trim())
    .fetch_one(&mut *tx)
    .await?;

    sqlx::query("UPDATE conversations SET last_message_at = now() WHERE id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    Ok(Json(MessageView {
        id: row.get("id"),
        sender_role: row.get("sender_role"),
        sender_account_id: row.get("sender_account_id"),
        body: row.get("body"),
        status: row.get("status"),
        created_at: row.get("created_at"),
    }))
}
