use axum::extract::{Path, State};
use axum::routing::{delete, get, post};
use axum::{Json, Router};
use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use uuid::Uuid;

use crate::auth::CurrentAccount;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/wallet", get(wallet_balance))
        .route("/wallet/movements", get(wallet_movements))
        .route("/issues", get(list_issues).post(create_issue))
        .route("/issues/{id}", get(issue_detail))
        .route("/refunds", get(list_refunds))
        .route("/provider/payouts", get(list_payouts))
        .route("/billing-profiles", get(list_billing).post(save_billing))
        .route("/payment-methods", get(list_payment_methods).post(save_payment_method))
        .route("/payment-methods/{id}", delete(delete_payment_method))
        .route("/support/tickets", get(list_tickets).post(create_ticket))
        .route("/support/tickets/{id}", get(ticket_detail))
        .route("/support/tickets/{id}/messages", post(add_ticket_message))
        .route("/support/tickets/{id}/close", post(close_ticket))
        .route("/notifications", get(list_notifications))
        .route("/notifications/{id}/read", post(mark_read))
        .route("/notifications/{id}", delete(delete_notification))
}

// --- Saldo Hupi -----------------------------------------------------------

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WalletBalance {
    pub available: Decimal,
    pub pending: Decimal,
}

async fn wallet_balance(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<WalletBalance>> {
    let row = sqlx::query(
        r#"
        SELECT
            COALESCE(SUM(amount) FILTER (WHERE status = 'available'), 0) AS available,
            COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) AS pending
        FROM wallet_movements WHERE account_id = $1
        "#,
    )
    .bind(account.id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(WalletBalance {
        available: row.get("available"),
        pending: row.get("pending"),
    }))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WalletMovement {
    pub id: Uuid,
    pub concept: String,
    pub amount: Decimal,
    pub movement_type: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

async fn wallet_movements(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<Vec<WalletMovement>>> {
    let rows = sqlx::query(
        r#"
        SELECT id, concept, amount, movement_type::text AS movement_type,
               status::text AS status, created_at
        FROM wallet_movements WHERE account_id = $1 ORDER BY created_at DESC
        "#,
    )
    .bind(account.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(
        rows.into_iter()
            .map(|row| WalletMovement {
                id: row.get("id"),
                concept: row.get("concept"),
                amount: row.get("amount"),
                movement_type: row.get("movement_type"),
                status: row.get("status"),
                created_at: row.get("created_at"),
            })
            .collect(),
    ))
}

// --- Incidencias ----------------------------------------------------------

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IssueView {
    pub id: Uuid,
    pub case_number: String,
    pub order_id: Uuid,
    pub reason: String,
    pub description: String,
    pub status: String,
    pub resolution_type: Option<String>,
    pub refund_amount: Option<Decimal>,
    pub created_at: DateTime<Utc>,
}

fn to_issue(row: &sqlx::postgres::PgRow) -> IssueView {
    IssueView {
        id: row.get("id"),
        case_number: row.get("case_number"),
        order_id: row.get("order_id"),
        reason: row.get("reason"),
        description: row.get("description"),
        status: row.get("status"),
        resolution_type: row.get("resolution_type"),
        refund_amount: row.get("refund_amount"),
        created_at: row.get("created_at"),
    }
}

const ISSUE_COLUMNS: &str = r#"
    id, case_number, order_id, reason, description, status::text AS status,
    resolution_type, refund_amount, created_at
"#;

async fn list_issues(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<Vec<IssueView>>> {
    let rows = sqlx::query(&format!(
        "SELECT {ISSUE_COLUMNS} FROM marketplace_issues
         WHERE client_account_id = $1 ORDER BY created_at DESC"
    ))
    .bind(account.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(rows.iter().map(to_issue).collect()))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateIssueRequest {
    pub order_id: Uuid,
    pub reason: String,
    #[serde(default)]
    pub description: String,
}

async fn create_issue(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<CreateIssueRequest>,
) -> AppResult<Json<IssueView>> {
    let owns: Option<bool> =
        sqlx::query("SELECT TRUE AS ok FROM orders WHERE id = $1 AND client_account_id = $2")
            .bind(payload.order_id)
            .bind(account.id)
            .fetch_optional(&state.db)
            .await?
            .map(|row| row.get("ok"));

    if owns.is_none() {
        return Err(AppError::NotFound("pedido"));
    }

    let case_number = format!("HUPI-CS-{}", &Uuid::new_v4().to_string()[..8].to_uppercase());

    let row = sqlx::query(&format!(
        r#"
        INSERT INTO marketplace_issues (
            case_number, order_id, client_account_id, reason, description, status
        ) VALUES ($1, $2, $3, $4, $5, 'open')
        RETURNING {ISSUE_COLUMNS}
        "#
    ))
    .bind(&case_number)
    .bind(payload.order_id)
    .bind(account.id)
    .bind(&payload.reason)
    .bind(&payload.description)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(to_issue(&row)))
}

async fn issue_detail(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<String>,
) -> AppResult<Json<IssueView>> {
    let row = sqlx::query(&format!(
        "SELECT {ISSUE_COLUMNS} FROM marketplace_issues
         WHERE (id::text = $1 OR case_number = $1) AND client_account_id = $2"
    ))
    .bind(&id)
    .bind(account.id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("incidencia"))?;

    Ok(Json(to_issue(&row)))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RefundView {
    pub id: Uuid,
    pub amount: Decimal,
    pub method: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

async fn list_refunds(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<Vec<RefundView>>> {
    let rows = sqlx::query(
        r#"
        SELECT id, amount, method::text AS method, status::text AS status, created_at
        FROM refunds WHERE account_id = $1 ORDER BY created_at DESC
        "#,
    )
    .bind(account.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(
        rows.into_iter()
            .map(|row| RefundView {
                id: row.get("id"),
                amount: row.get("amount"),
                method: row.get("method"),
                status: row.get("status"),
                created_at: row.get("created_at"),
            })
            .collect(),
    ))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PayoutView {
    pub id: Uuid,
    pub settlement_number: String,
    pub period_month: NaiveDate,
    pub gross_sales: Decimal,
    pub hupi_commission: Decimal,
    pub provider_net: Decimal,
    pub total_to_transfer: Decimal,
    pub status: String,
}

async fn list_payouts(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<Vec<PayoutView>>> {
    let rows = sqlx::query(
        r#"
        SELECT pp.id, pp.settlement_number, pp.period_month, pp.gross_sales,
               pp.hupi_commission, pp.provider_net, pp.total_to_transfer,
               pp.status::text AS status
        FROM provider_payouts pp
        JOIN providers p ON p.id = pp.provider_id
        WHERE p.account_id = $1
        ORDER BY pp.period_month DESC
        "#,
    )
    .bind(account.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(
        rows.into_iter()
            .map(|row| PayoutView {
                id: row.get("id"),
                settlement_number: row.get("settlement_number"),
                period_month: row.get("period_month"),
                gross_sales: row.get("gross_sales"),
                hupi_commission: row.get("hupi_commission"),
                provider_net: row.get("provider_net"),
                total_to_transfer: row.get("total_to_transfer"),
                status: row.get("status"),
            })
            .collect(),
    ))
}

// --- Facturación y pagos --------------------------------------------------

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BillingProfile {
    #[serde(default)]
    pub id: Option<Uuid>,
    pub taxpayer_type: String,
    pub identification_type: String,
    pub identification_number: String,
    pub name_or_business_name: String,
    pub billing_email: String,
    pub contact_phone: Option<String>,
    pub fiscal_address: Option<String>,
    #[serde(default)]
    pub is_default: bool,
}

async fn list_billing(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<Vec<BillingProfile>>> {
    let rows = sqlx::query(
        r#"
        SELECT id, taxpayer_type, identification_type, identification_number,
               name_or_business_name, billing_email, contact_phone, fiscal_address, is_default
        FROM billing_profiles WHERE account_id = $1 ORDER BY is_default DESC, created_at
        "#,
    )
    .bind(account.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(
        rows.into_iter()
            .map(|row| BillingProfile {
                id: row.get("id"),
                taxpayer_type: row.get("taxpayer_type"),
                identification_type: row.get("identification_type"),
                identification_number: row.get("identification_number"),
                name_or_business_name: row.get("name_or_business_name"),
                billing_email: row.get("billing_email"),
                contact_phone: row.get("contact_phone"),
                fiscal_address: row.get("fiscal_address"),
                is_default: row.get("is_default"),
            })
            .collect(),
    ))
}

async fn save_billing(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<BillingProfile>,
) -> AppResult<Json<Vec<BillingProfile>>> {
    let mut tx = state.db.begin().await?;

    if payload.is_default {
        sqlx::query("UPDATE billing_profiles SET is_default = FALSE WHERE account_id = $1")
            .bind(account.id)
            .execute(&mut *tx)
            .await?;
    }

    sqlx::query(
        r#"
        INSERT INTO billing_profiles (
            id, account_id, taxpayer_type, identification_type, identification_number,
            name_or_business_name, billing_email, contact_phone, fiscal_address, is_default
        ) VALUES (COALESCE($1, uuid_generate_v4()), $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
            taxpayer_type = EXCLUDED.taxpayer_type,
            identification_type = EXCLUDED.identification_type,
            identification_number = EXCLUDED.identification_number,
            name_or_business_name = EXCLUDED.name_or_business_name,
            billing_email = EXCLUDED.billing_email,
            contact_phone = EXCLUDED.contact_phone,
            fiscal_address = EXCLUDED.fiscal_address,
            is_default = EXCLUDED.is_default
        "#,
    )
    .bind(payload.id)
    .bind(account.id)
    .bind(&payload.taxpayer_type)
    .bind(&payload.identification_type)
    .bind(&payload.identification_number)
    .bind(&payload.name_or_business_name)
    .bind(&payload.billing_email)
    .bind(&payload.contact_phone)
    .bind(&payload.fiscal_address)
    .bind(payload.is_default)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    list_billing(State(state), account).await
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaymentMethodView {
    pub id: Uuid,
    pub brand: String,
    pub last4: String,
    pub holder_name: String,
    pub expiry_month: i16,
    pub expiry_year: i16,
    pub is_default: bool,
}

async fn list_payment_methods(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<Vec<PaymentMethodView>>> {
    let rows = sqlx::query(
        r#"
        SELECT id, brand, last4, holder_name, expiry_month, expiry_year, is_default
        FROM payment_methods WHERE account_id = $1 ORDER BY is_default DESC, created_at
        "#,
    )
    .bind(account.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(
        rows.into_iter()
            .map(|row| PaymentMethodView {
                id: row.get("id"),
                brand: row.get("brand"),
                last4: row.get::<String, _>("last4").trim().to_string(),
                holder_name: row.get("holder_name"),
                expiry_month: row.get("expiry_month"),
                expiry_year: row.get("expiry_year"),
                is_default: row.get("is_default"),
            })
            .collect(),
    ))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SavePaymentMethodRequest {
    /// Token de la pasarela. Nunca se recibe ni almacena el número completo.
    pub gateway_token: String,
    pub brand: String,
    pub last4: String,
    pub holder_name: String,
    pub expiry_month: i16,
    pub expiry_year: i16,
    #[serde(default)]
    pub is_default: bool,
}

async fn save_payment_method(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<SavePaymentMethodRequest>,
) -> AppResult<Json<Vec<PaymentMethodView>>> {
    if payload.last4.len() != 4 || !payload.last4.chars().all(|c| c.is_ascii_digit()) {
        return Err(AppError::Validation(
            "last4 debe ser exactamente cuatro dígitos".to_string(),
        ));
    }

    let mut tx = state.db.begin().await?;

    if payload.is_default {
        sqlx::query("UPDATE payment_methods SET is_default = FALSE WHERE account_id = $1")
            .bind(account.id)
            .execute(&mut *tx)
            .await?;
    }

    sqlx::query(
        r#"
        INSERT INTO payment_methods (
            account_id, gateway_token, brand, last4, holder_name,
            expiry_month, expiry_year, is_default
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        "#,
    )
    .bind(account.id)
    .bind(&payload.gateway_token)
    .bind(&payload.brand)
    .bind(&payload.last4)
    .bind(&payload.holder_name)
    .bind(payload.expiry_month)
    .bind(payload.expiry_year)
    .bind(payload.is_default)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    list_payment_methods(State(state), account).await
}

async fn delete_payment_method(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Vec<PaymentMethodView>>> {
    sqlx::query("DELETE FROM payment_methods WHERE id = $1 AND account_id = $2")
        .bind(id)
        .bind(account.id)
        .execute(&state.db)
        .await?;

    list_payment_methods(State(state), account).await
}

// --- Soporte --------------------------------------------------------------

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TicketMessageView {
    pub author_role: String,
    pub body: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TicketView {
    pub id: Uuid,
    pub case_number: String,
    pub category: String,
    pub description: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub messages: Vec<TicketMessageView>,
}

const TICKET_COLUMNS: &str =
    "id, case_number, category, description, status::text AS status, created_at";

async fn load_ticket_messages(
    state: &AppState,
    ticket_id: Uuid,
) -> AppResult<Vec<TicketMessageView>> {
    let rows = sqlx::query(
        r#"
        SELECT author_role::text AS author_role, body, created_at
        FROM support_ticket_messages WHERE ticket_id = $1 ORDER BY created_at
        "#,
    )
    .bind(ticket_id)
    .fetch_all(&state.db)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| TicketMessageView {
            author_role: row.get("author_role"),
            body: row.get("body"),
            created_at: row.get("created_at"),
        })
        .collect())
}

async fn list_tickets(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<Vec<TicketView>>> {
    let rows = sqlx::query(&format!(
        "SELECT {TICKET_COLUMNS} FROM support_tickets
         WHERE account_id = $1 ORDER BY created_at DESC"
    ))
    .bind(account.id)
    .fetch_all(&state.db)
    .await?;

    let mut tickets = Vec::with_capacity(rows.len());
    for row in rows {
        let id: Uuid = row.get("id");
        tickets.push(TicketView {
            id,
            case_number: row.get("case_number"),
            category: row.get("category"),
            description: row.get("description"),
            status: row.get("status"),
            created_at: row.get("created_at"),
            messages: load_ticket_messages(&state, id).await?,
        });
    }

    Ok(Json(tickets))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTicketRequest {
    pub category: String,
    pub description: String,
    pub related_booking_id: Option<Uuid>,
    pub related_order_id: Option<Uuid>,
}

async fn create_ticket(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<CreateTicketRequest>,
) -> AppResult<Json<TicketView>> {
    if payload.description.trim().is_empty() {
        return Err(AppError::Validation(
            "la descripción es obligatoria".to_string(),
        ));
    }

    let case_number = format!("HUPI-CS-{}", &Uuid::new_v4().to_string()[..8].to_uppercase());

    let row = sqlx::query(&format!(
        r#"
        INSERT INTO support_tickets (
            case_number, account_id, category, description, status,
            related_booking_id, related_order_id
        ) VALUES ($1, $2, $3, $4, 'open', $5, $6)
        RETURNING {TICKET_COLUMNS}
        "#
    ))
    .bind(&case_number)
    .bind(account.id)
    .bind(&payload.category)
    .bind(payload.description.trim())
    .bind(payload.related_booking_id)
    .bind(payload.related_order_id)
    .fetch_one(&state.db)
    .await?;

    let id: Uuid = row.get("id");

    sqlx::query(
        r#"
        INSERT INTO support_ticket_messages (ticket_id, author_role, author_account_id, body)
        VALUES ($1, 'client', $2, $3)
        "#,
    )
    .bind(id)
    .bind(account.id)
    .bind(payload.description.trim())
    .execute(&state.db)
    .await?;

    Ok(Json(TicketView {
        id,
        case_number: row.get("case_number"),
        category: row.get("category"),
        description: row.get("description"),
        status: row.get("status"),
        created_at: row.get("created_at"),
        messages: load_ticket_messages(&state, id).await?,
    }))
}

async fn find_ticket(state: &AppState, account_id: Uuid, id: &str) -> AppResult<Uuid> {
    sqlx::query(
        "SELECT id FROM support_tickets
         WHERE (id::text = $1 OR case_number = $1) AND account_id = $2",
    )
    .bind(id)
    .bind(account_id)
    .fetch_optional(&state.db)
    .await?
    .map(|row| row.get("id"))
    .ok_or(AppError::NotFound("ticket"))
}

async fn ticket_detail(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<String>,
) -> AppResult<Json<TicketView>> {
    let ticket_id = find_ticket(&state, account.id, &id).await?;

    let row = sqlx::query(&format!(
        "SELECT {TICKET_COLUMNS} FROM support_tickets WHERE id = $1"
    ))
    .bind(ticket_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(TicketView {
        id: ticket_id,
        case_number: row.get("case_number"),
        category: row.get("category"),
        description: row.get("description"),
        status: row.get("status"),
        created_at: row.get("created_at"),
        messages: load_ticket_messages(&state, ticket_id).await?,
    }))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TicketMessageRequest {
    pub body: String,
}

async fn add_ticket_message(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<String>,
    Json(payload): Json<TicketMessageRequest>,
) -> AppResult<Json<TicketView>> {
    let ticket_id = find_ticket(&state, account.id, &id).await?;

    if payload.body.trim().is_empty() {
        return Err(AppError::Validation(
            "el mensaje no puede estar vacío".to_string(),
        ));
    }

    let mut tx = state.db.begin().await?;

    sqlx::query(
        r#"
        INSERT INTO support_ticket_messages (ticket_id, author_role, author_account_id, body)
        VALUES ($1, 'client', $2, $3)
        "#,
    )
    .bind(ticket_id)
    .bind(account.id)
    .bind(payload.body.trim())
    .execute(&mut *tx)
    .await?;

    // Responder devuelve el caso a revisión.
    sqlx::query(
        "UPDATE support_tickets SET status = 'under_review', updated_at = now()
         WHERE id = $1 AND status <> 'closed'",
    )
    .bind(ticket_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    ticket_detail(State(state), account, Path(id)).await
}

async fn close_ticket(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<String>,
) -> AppResult<Json<TicketView>> {
    let ticket_id = find_ticket(&state, account.id, &id).await?;

    sqlx::query(
        "UPDATE support_tickets SET status = 'closed', resolved_at = now(), updated_at = now()
         WHERE id = $1",
    )
    .bind(ticket_id)
    .execute(&state.db)
    .await?;

    ticket_detail(State(state), account, Path(id)).await
}

// --- Notificaciones -------------------------------------------------------

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationView {
    pub id: Uuid,
    pub category: String,
    pub notification_type: String,
    pub title: String,
    pub body: String,
    pub priority: String,
    pub action_target: Option<String>,
    pub is_read: bool,
    pub created_at: DateTime<Utc>,
}

async fn list_notifications(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<Vec<NotificationView>>> {
    let rows = sqlx::query(
        r#"
        SELECT id, category, notification_type, title, body,
               priority::text AS priority, action_target, read_at, created_at
        FROM notifications
        WHERE account_id = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC
        "#,
    )
    .bind(account.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(
        rows.into_iter()
            .map(|row| NotificationView {
                id: row.get("id"),
                category: row.get("category"),
                notification_type: row.get("notification_type"),
                title: row.get("title"),
                body: row.get("body"),
                priority: row.get("priority"),
                action_target: row.get("action_target"),
                is_read: row.get::<Option<DateTime<Utc>>, _>("read_at").is_some(),
                created_at: row.get("created_at"),
            })
            .collect(),
    ))
}

async fn mark_read(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Vec<NotificationView>>> {
    sqlx::query(
        "UPDATE notifications SET read_at = COALESCE(read_at, now())
         WHERE id = $1 AND account_id = $2",
    )
    .bind(id)
    .bind(account.id)
    .execute(&state.db)
    .await?;

    list_notifications(State(state), account).await
}

async fn delete_notification(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Vec<NotificationView>>> {
    sqlx::query(
        "UPDATE notifications SET deleted_at = now() WHERE id = $1 AND account_id = $2",
    )
    .bind(id)
    .bind(account.id)
    .execute(&state.db)
    .await?;

    list_notifications(State(state), account).await
}
