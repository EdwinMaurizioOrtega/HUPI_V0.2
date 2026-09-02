use axum::extract::{Path, Query, State};
use axum::routing::{get, post};
use axum::{Json, Router};
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use uuid::Uuid;

use crate::auth::CurrentAccount;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/orders", get(list_orders).post(create_order))
        .route("/orders/{id}", get(order_detail))
        .route("/orders/{id}/payment-proof", post(upload_proof))
        .route("/orders/{id}/review", post(review_order))
        .route("/provider-orders", get(list_provider_orders))
        .route("/provider-orders/{id}", get(provider_order_detail))
        .route("/provider-orders/{id}/status", post(update_status))
        .route("/provider-orders/{id}/shipping-guide", post(save_guide))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderItemView {
    pub product_id: Option<Uuid>,
    pub product_name: String,
    pub variation_name: Option<String>,
    pub sku: Option<String>,
    pub quantity: i32,
    pub unit_price: Decimal,
    pub line_total: Decimal,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderView {
    pub id: Uuid,
    pub order_number: String,
    pub status: String,
    pub payment_method: String,
    pub payment_status: String,
    pub shipping_method: String,
    pub subtotal: Decimal,
    pub shipping_cost: Decimal,
    pub discount: Decimal,
    pub donation: Decimal,
    pub hupi_balance_applied: Decimal,
    pub total: Decimal,
    pub coupon_code: Option<String>,
    pub receipt_available: bool,
    pub can_rate: bool,
    pub rating_submitted: bool,
    pub delivered_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub delivery_address_snapshot: Option<serde_json::Value>,
    pub items: Vec<OrderItemView>,
    pub stores: Vec<String>,
}

const ORDER_SELECT: &str = r#"
    SELECT id, order_number, status::text AS status,
           payment_method::text AS payment_method,
           payment_status::text AS payment_status,
           shipping_method::text AS shipping_method,
           subtotal, shipping_cost, discount, donation, hupi_balance_applied,
           total, coupon_code, receipt_available, can_rate, rating_submitted,
           delivered_at, created_at, delivery_address_snapshot
    FROM orders
"#;

async fn load_items(state: &AppState, order_ids: &[Uuid]) -> AppResult<
    std::collections::HashMap<Uuid, (Vec<OrderItemView>, Vec<String>)>,
> {
    let rows = sqlx::query(
        r#"
        SELECT po.order_id, s.name AS store_name, i.product_id, i.product_name,
               i.variation_name, i.sku, i.quantity, i.unit_price, i.line_total
        FROM order_items i
        JOIN provider_orders po ON po.id = i.provider_order_id
        JOIN stores s ON s.id = po.store_id
        WHERE po.order_id = ANY($1)
        "#,
    )
    .bind(order_ids)
    .fetch_all(&state.db)
    .await?;

    let mut map: std::collections::HashMap<Uuid, (Vec<OrderItemView>, Vec<String>)> =
        std::collections::HashMap::new();

    for row in rows {
        let order_id: Uuid = row.get("order_id");
        let store_name: String = row.get("store_name");
        let entry = map.entry(order_id).or_default();

        entry.0.push(OrderItemView {
            product_id: row.get("product_id"),
            product_name: row.get("product_name"),
            variation_name: row.get("variation_name"),
            sku: row.get("sku"),
            quantity: row.get("quantity"),
            unit_price: row.get("unit_price"),
            line_total: row.get("line_total"),
        });

        if !entry.1.contains(&store_name) {
            entry.1.push(store_name);
        }
    }

    Ok(map)
}

fn to_order(
    row: &sqlx::postgres::PgRow,
    items: (Vec<OrderItemView>, Vec<String>),
) -> OrderView {
    OrderView {
        id: row.get("id"),
        order_number: row.get("order_number"),
        status: row.get("status"),
        payment_method: row.get("payment_method"),
        payment_status: row.get("payment_status"),
        shipping_method: row.get("shipping_method"),
        subtotal: row.get("subtotal"),
        shipping_cost: row.get("shipping_cost"),
        discount: row.get("discount"),
        donation: row.get("donation"),
        hupi_balance_applied: row.get("hupi_balance_applied"),
        total: row.get("total"),
        coupon_code: row.get("coupon_code"),
        receipt_available: row.get("receipt_available"),
        can_rate: row.get("can_rate"),
        rating_submitted: row.get("rating_submitted"),
        delivered_at: row.get("delivered_at"),
        created_at: row.get("created_at"),
        delivery_address_snapshot: row.get("delivery_address_snapshot"),
        items: items.0,
        stores: items.1,
    }
}

async fn list_orders(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<Vec<OrderView>>> {
    let rows = sqlx::query(&format!(
        "{ORDER_SELECT} WHERE client_account_id = $1 ORDER BY created_at DESC"
    ))
    .bind(account.id)
    .fetch_all(&state.db)
    .await?;

    let ids: Vec<Uuid> = rows.iter().map(|row| row.get("id")).collect();
    let mut items = load_items(&state, &ids).await?;

    let orders = rows
        .iter()
        .map(|row| {
            let id: Uuid = row.get("id");
            to_order(row, items.remove(&id).unwrap_or_default())
        })
        .collect();

    Ok(Json(orders))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateOrderRequest {
    pub payment_method: String,
    #[serde(default = "standard_shipping")]
    pub shipping_method: String,
    #[serde(default)]
    pub donation: Decimal,
    /// Intención de usar saldo; el importe real lo decide el servidor.
    #[serde(default)]
    pub use_hupi_balance: bool,
    pub delivery_address_snapshot: Option<serde_json::Value>,
    pub billing_profile_snapshot: Option<serde_json::Value>,
}

fn standard_shipping() -> String {
    "standard".to_string()
}

/// Convierte el carrito en un pedido y lo vacía. Un pedido por cliente,
/// dividido en un subpedido por tienda, que es lo que ve cada proveedor.
///
/// Los importes NO se aceptan del cliente: se recalculan aquí.
async fn create_order(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<CreateOrderRequest>,
) -> AppResult<Json<OrderView>> {
    let lines = sqlx::query(
        r#"
        SELECT ci.product_id, ci.variation_id, ci.quantity, ci.unit_price_snapshot,
               p.name AS product_name, p.sku, p.store_id
        FROM cart_items ci
        JOIN carts c ON c.id = ci.cart_id
        JOIN products p ON p.id = ci.product_id
        WHERE c.account_id = $1
        ORDER BY ci.added_at
        "#,
    )
    .bind(account.id)
    .fetch_all(&state.db)
    .await?;

    if lines.is_empty() {
        return Err(AppError::Validation("el carrito está vacío".into()));
    }

    let quote = crate::routes::marketplace::quote_cart(
        &state,
        account.id,
        Some(&payload.shipping_method),
        payload.donation,
        payload.use_hupi_balance,
    )
    .await?;

    let coupon_code: Option<String> =
        sqlx::query_scalar("SELECT coupon_code FROM carts WHERE account_id = $1")
            .bind(account.id)
            .fetch_optional(&state.db)
            .await?
            .flatten();

    let mut tx = state.db.begin().await?;

    let order_id: Uuid = sqlx::query(
        r#"
        INSERT INTO orders (
            order_number, client_account_id, status, payment_method, payment_status,
            shipping_method, delivery_address_snapshot, billing_profile_snapshot,
            subtotal, shipping_cost, discount, donation, hupi_balance_applied,
            total, coupon_code
        ) VALUES (
            'HUPI-MK-' || lpad(nextval('order_number_seq')::text, 4, '0'),
            $1, 'payment_pending', $2::payment_method, 'proof_pending',
            $3::shipping_method, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
        RETURNING id
        "#,
    )
    .bind(account.id)
    .bind(&payload.payment_method)
    .bind(&payload.shipping_method)
    .bind(&payload.delivery_address_snapshot)
    .bind(&payload.billing_profile_snapshot)
    .bind(quote.subtotal)
    .bind(quote.shipping_cost)
    .bind(quote.discount)
    .bind(quote.donation)
    .bind(quote.hupi_balance_applied)
    .bind(quote.total)
    .bind(coupon_code.as_deref())
    .fetch_one(&mut *tx)
    .await?
    .get("id");

    let commission_rate = crate::domain::pricing::provider_commission_rate();
    let mut provider_orders: std::collections::HashMap<Uuid, Uuid> =
        std::collections::HashMap::new();

    for row in &lines {
        let store_id: Uuid = row.get("store_id");
        let quantity: i32 = row.get("quantity");
        let unit_price: Decimal = row.get("unit_price_snapshot");
        let line_total = unit_price * Decimal::from(quantity);

        let provider_order_id = match provider_orders.get(&store_id) {
            Some(id) => *id,
            None => {
                let id: Uuid = sqlx::query(
                    r#"
                    INSERT INTO provider_orders (
                        provider_order_number, order_id, store_id, status, delivery_type
                    ) VALUES (
                        'HUPI-PO-' || lpad(nextval('provider_order_number_seq')::text, 4, '0'),
                        $1, $2, 'confirmed', $3::shipping_method
                    )
                    RETURNING id
                    "#,
                )
                .bind(order_id)
                .bind(store_id)
                .bind(&payload.shipping_method)
                .fetch_one(&mut *tx)
                .await?
                .get("id");

                provider_orders.insert(store_id, id);
                id
            }
        };

        sqlx::query(
            r#"
            INSERT INTO order_items (
                provider_order_id, product_id, variation_id, product_name, sku,
                quantity, unit_price, line_total
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(provider_order_id)
        .bind(row.get::<Uuid, _>("product_id"))
        .bind(row.get::<Option<Uuid>, _>("variation_id"))
        .bind(row.get::<String, _>("product_name"))
        .bind(row.get::<Option<String>, _>("sku"))
        .bind(quantity)
        .bind(unit_price)
        .bind(line_total)
        .execute(&mut *tx)
        .await?;
    }

    // Los importes del subpedido salen de sus propias líneas.
    sqlx::query(
        r#"
        UPDATE provider_orders po SET
            subtotal = totals.sum,
            hupi_commission = round(totals.sum * $2, 2),
            provider_net = totals.sum - round(totals.sum * $2, 2)
        FROM (
            SELECT provider_order_id, SUM(line_total) AS sum
            FROM order_items GROUP BY provider_order_id
        ) totals
        WHERE totals.provider_order_id = po.id AND po.order_id = $1
        "#,
    )
    .bind(order_id)
    .bind(commission_rate)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        "DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE account_id = $1)",
    )
    .bind(account.id)
    .execute(&mut *tx)
    .await?;

    // Usar saldo lo consume: si no, seguiría disponible para el siguiente pedido.
    if quote.hupi_balance_applied > Decimal::ZERO {
        sqlx::query(
            r#"
            INSERT INTO wallet_movements (account_id, concept, amount, movement_type, status)
            VALUES ($1, $2, $3, 'purchase_use', 'used')
            "#,
        )
        .bind(account.id)
        .bind("Uso de saldo en compra Marketplace")
        .bind(-quote.hupi_balance_applied)
        .execute(&mut *tx)
        .await?;
    }

    sqlx::query("UPDATE carts SET coupon_code = NULL WHERE account_id = $1")
        .bind(account.id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    let row = sqlx::query(&format!("{ORDER_SELECT} WHERE id = $1"))
        .bind(order_id)
        .fetch_one(&state.db)
        .await?;

    let mut items = load_items(&state, &[order_id]).await?;
    Ok(Json(to_order(&row, items.remove(&order_id).unwrap_or_default())))
}

async fn order_detail(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<String>,
) -> AppResult<Json<OrderView>> {
    let row = sqlx::query(&format!(
        "{ORDER_SELECT} WHERE (id::text = $1 OR order_number = $1) AND client_account_id = $2"
    ))
    .bind(&id)
    .bind(account.id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("pedido"))?;

    let order_id: Uuid = row.get("id");
    let mut items = load_items(&state, &[order_id]).await?;

    Ok(Json(to_order(&row, items.remove(&order_id).unwrap_or_default())))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProofRequest {
    pub file_name: String,
    pub mime_type: Option<String>,
}

async fn upload_proof(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<String>,
    Json(payload): Json<ProofRequest>,
) -> AppResult<Json<OrderView>> {
    let row = sqlx::query(
        "SELECT id FROM orders WHERE (id::text = $1 OR order_number = $1) AND client_account_id = $2",
    )
    .bind(&id)
    .bind(account.id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("pedido"))?;

    let order_id: Uuid = row.get("id");

    let mut tx = state.db.begin().await?;

    let document_id: Uuid = sqlx::query(
        r#"
        INSERT INTO documents (account_id, storage_key, file_name, mime_type, is_sensitive)
        VALUES ($1, $2, $3, $4, FALSE)
        RETURNING id
        "#,
    )
    .bind(account.id)
    .bind(format!("proofs/{order_id}/{}", payload.file_name))
    .bind(&payload.file_name)
    .bind(payload.mime_type.unwrap_or_else(|| "image/jpeg".to_string()))
    .fetch_one(&mut *tx)
    .await?
    .get("id");

    sqlx::query(
        r#"
        UPDATE orders
        SET proof_document_id = $2, payment_status = 'proof_submitted',
            status = 'payment_review', updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(order_id)
    .bind(document_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    order_detail(State(state), account, Path(id)).await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderReviewRequest {
    pub store_rating: Option<i16>,
    pub product_rating: Option<i16>,
    pub comment: Option<String>,
}

async fn review_order(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<String>,
    Json(payload): Json<OrderReviewRequest>,
) -> AppResult<Json<OrderView>> {
    let row = sqlx::query(
        "SELECT id, status::text AS status FROM orders
         WHERE (id::text = $1 OR order_number = $1) AND client_account_id = $2",
    )
    .bind(&id)
    .bind(account.id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("pedido"))?;

    let order_id: Uuid = row.get("id");
    let status: String = row.get("status");

    if status != "delivered" {
        return Err(AppError::Conflict(
            "solo se puede reseñar un pedido entregado".to_string(),
        ));
    }

    let mut tx = state.db.begin().await?;

    sqlx::query(
        r#"
        INSERT INTO order_reviews (order_id, store_rating, product_rating, comment)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (order_id) DO UPDATE SET
            store_rating = EXCLUDED.store_rating,
            product_rating = EXCLUDED.product_rating,
            comment = EXCLUDED.comment
        "#,
    )
    .bind(order_id)
    .bind(payload.store_rating)
    .bind(payload.product_rating)
    .bind(&payload.comment)
    .execute(&mut *tx)
    .await?;

    sqlx::query("UPDATE orders SET rating_submitted = TRUE, can_rate = FALSE WHERE id = $1")
        .bind(order_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    order_detail(State(state), account, Path(id)).await
}

// --- Lado proveedor -------------------------------------------------------

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderOrderView {
    pub id: Uuid,
    pub provider_order_number: String,
    pub order_id: Uuid,
    pub order_number: String,
    pub store_id: Uuid,
    pub store_name: String,
    pub customer_name: String,
    pub status: String,
    pub delivery_type: String,
    pub carrier: Option<String>,
    pub tracking_number: Option<String>,
    pub subtotal: Decimal,
    pub hupi_commission: Decimal,
    pub provider_net: Decimal,
    pub placed_at: DateTime<Utc>,
    pub items: Vec<OrderItemView>,
}

const PROVIDER_ORDER_SELECT: &str = r#"
    SELECT po.id, po.provider_order_number, po.order_id, o.order_number,
           po.store_id, s.name AS store_name,
           a.first_name, a.last_name,
           po.status::text AS status, po.delivery_type::text AS delivery_type,
           po.carrier, po.tracking_number, po.subtotal, po.hupi_commission,
           po.provider_net, po.placed_at
    FROM provider_orders po
    JOIN orders o ON o.id = po.order_id
    JOIN stores s ON s.id = po.store_id
    JOIN providers p ON p.id = s.provider_id
    JOIN accounts a ON a.id = o.client_account_id
"#;

async fn load_provider_items(
    state: &AppState,
    ids: &[Uuid],
) -> AppResult<std::collections::HashMap<Uuid, Vec<OrderItemView>>> {
    let rows = sqlx::query(
        r#"
        SELECT provider_order_id, product_id, product_name, variation_name, sku,
               quantity, unit_price, line_total
        FROM order_items WHERE provider_order_id = ANY($1)
        "#,
    )
    .bind(ids)
    .fetch_all(&state.db)
    .await?;

    let mut map: std::collections::HashMap<Uuid, Vec<OrderItemView>> =
        std::collections::HashMap::new();

    for row in rows {
        map.entry(row.get("provider_order_id"))
            .or_default()
            .push(OrderItemView {
                product_id: row.get("product_id"),
                product_name: row.get("product_name"),
                variation_name: row.get("variation_name"),
                sku: row.get("sku"),
                quantity: row.get("quantity"),
                unit_price: row.get("unit_price"),
                line_total: row.get("line_total"),
            });
    }

    Ok(map)
}

fn to_provider_order(row: &sqlx::postgres::PgRow, items: Vec<OrderItemView>) -> ProviderOrderView {
    let first: String = row.get("first_name");
    let last: String = row.get("last_name");

    ProviderOrderView {
        id: row.get("id"),
        provider_order_number: row.get("provider_order_number"),
        order_id: row.get("order_id"),
        order_number: row.get("order_number"),
        store_id: row.get("store_id"),
        store_name: row.get("store_name"),
        customer_name: format!("{first} {last}").trim().to_string(),
        status: row.get("status"),
        delivery_type: row.get("delivery_type"),
        carrier: row.get("carrier"),
        tracking_number: row.get("tracking_number"),
        subtotal: row.get("subtotal"),
        hupi_commission: row.get("hupi_commission"),
        provider_net: row.get("provider_net"),
        placed_at: row.get("placed_at"),
        items,
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderOrderQuery {
    pub status: Option<String>,
}

async fn list_provider_orders(
    State(state): State<AppState>,
    account: CurrentAccount,
    Query(query): Query<ProviderOrderQuery>,
) -> AppResult<Json<Vec<ProviderOrderView>>> {
    let rows = sqlx::query(&format!(
        "{PROVIDER_ORDER_SELECT} WHERE p.account_id = $1 ORDER BY po.placed_at DESC"
    ))
    .bind(account.id)
    .fetch_all(&state.db)
    .await?;

    let ids: Vec<Uuid> = rows.iter().map(|row| row.get("id")).collect();
    let mut items = load_provider_items(&state, &ids).await?;

    let orders = rows
        .iter()
        .map(|row| {
            let id: Uuid = row.get("id");
            to_provider_order(row, items.remove(&id).unwrap_or_default())
        })
        .filter(|order| query.status.as_ref().is_none_or(|s| &order.status == s))
        .collect();

    Ok(Json(orders))
}

async fn provider_order_detail(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<String>,
) -> AppResult<Json<ProviderOrderView>> {
    let row = sqlx::query(&format!(
        "{PROVIDER_ORDER_SELECT}
         WHERE (po.id::text = $1 OR po.provider_order_number = $1) AND p.account_id = $2"
    ))
    .bind(&id)
    .bind(account.id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("subpedido"))?;

    let provider_order_id: Uuid = row.get("id");
    let mut items = load_provider_items(&state, &[provider_order_id]).await?;

    Ok(Json(to_provider_order(
        &row,
        items.remove(&provider_order_id).unwrap_or_default(),
    )))
}

/// Transiciones permitidas del subpedido, según la máquina documentada.
fn next_status_allowed(current: &str, next: &str) -> bool {
    matches!(
        (current, next),
        ("confirmed", "preparing")
            | ("preparing", "ready_to_ship")
            | ("ready_to_ship", "in_transit")
            | ("in_transit", "delivered")
    ) || next == "cancelled"
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatusRequest {
    pub status: String,
}

async fn update_status(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<String>,
    Json(payload): Json<StatusRequest>,
) -> AppResult<Json<ProviderOrderView>> {
    let row = sqlx::query(
        r#"
        SELECT po.id, po.status::text AS status
        FROM provider_orders po
        JOIN stores s ON s.id = po.store_id
        JOIN providers p ON p.id = s.provider_id
        WHERE (po.id::text = $1 OR po.provider_order_number = $1) AND p.account_id = $2
        "#,
    )
    .bind(&id)
    .bind(account.id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("subpedido"))?;

    let provider_order_id: Uuid = row.get("id");
    let current: String = row.get("status");

    if !next_status_allowed(&current, &payload.status) {
        return Err(AppError::Conflict(format!(
            "no se puede pasar de {current} a {}",
            payload.status
        )));
    }

    let mut tx = state.db.begin().await?;

    sqlx::query(
        r#"
        UPDATE provider_orders
        SET status = $2::order_status,
            delivered_at = CASE WHEN $2 = 'delivered' THEN now() ELSE delivered_at END,
            updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(provider_order_id)
    .bind(&payload.status)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO provider_order_activities (
            provider_order_id, activity_type, title, actor_role, actor_account_id
        ) VALUES ($1, $2, $3, 'provider', $4)
        "#,
    )
    .bind(provider_order_id)
    .bind(&payload.status)
    .bind(format!("Pedido actualizado a {}", payload.status))
    .bind(account.id)
    .execute(&mut *tx)
    .await?;

    // El pedido del cliente refleja el estado del subpedido.
    sqlx::query(
        r#"
        UPDATE orders o
        SET status = $2::order_status,
            delivered_at = CASE WHEN $2 = 'delivered' THEN now() ELSE o.delivered_at END,
            can_rate = CASE WHEN $2 = 'delivered' THEN TRUE ELSE o.can_rate END,
            updated_at = now()
        FROM provider_orders po
        WHERE po.id = $1 AND o.id = po.order_id
        "#,
    )
    .bind(provider_order_id)
    .bind(&payload.status)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    provider_order_detail(State(state), account, Path(id)).await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GuideRequest {
    pub carrier: String,
    pub tracking_number: String,
}

async fn save_guide(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<String>,
    Json(payload): Json<GuideRequest>,
) -> AppResult<Json<ProviderOrderView>> {
    let updated = sqlx::query(
        r#"
        UPDATE provider_orders po
        SET carrier = $3, tracking_number = $4, updated_at = now()
        FROM stores s, providers p
        WHERE s.id = po.store_id AND p.id = s.provider_id
          AND (po.id::text = $1 OR po.provider_order_number = $1)
          AND p.account_id = $2
        RETURNING po.id
        "#,
    )
    .bind(&id)
    .bind(account.id)
    .bind(&payload.carrier)
    .bind(&payload.tracking_number)
    .fetch_optional(&state.db)
    .await?;

    if updated.is_none() {
        return Err(AppError::NotFound("subpedido"));
    }

    provider_order_detail(State(state), account, Path(id)).await
}
