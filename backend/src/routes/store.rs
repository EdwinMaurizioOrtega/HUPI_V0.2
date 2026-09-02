//! Tienda del proveedor: perfil, envíos y catálogo propio.
//!
//! El marketplace público es de solo lectura; aquí el proveedor gestiona lo
//! suyo. Cada operación se acota a la tienda de la cuenta autenticada, así que
//! nadie puede tocar el catálogo de otro.

use axum::extract::{Path, State};
use axum::routing::{get, put};
use axum::{Json, Router};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use uuid::Uuid;

use crate::auth::CurrentAccount;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/provider/store", get(get_store).put(save_store))
        .route("/provider/store/shipping", get(get_shipping).put(save_shipping))
        .route("/provider/store/products", get(list_products).post(create_product))
        .route(
            "/provider/store/products/{id}",
            put(update_product).delete(delete_product),
        )
}

/// Tienda de la cuenta autenticada. Falla si la cuenta no es proveedor.
async fn store_id(state: &AppState, account_id: Uuid) -> AppResult<Uuid> {
    sqlx::query_scalar::<_, Uuid>(
        "SELECT s.id FROM stores s
         JOIN providers p ON p.id = s.provider_id
         WHERE p.account_id = $1",
    )
    .bind(account_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("tienda"))
}

// --- Perfil de tienda -----------------------------------------------------

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StoreView {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub categories: Vec<String>,
    pub status: String,
    pub is_official_store: bool,
    pub is_verified_by_hupi: bool,
    pub province: Option<String>,
    pub city: Option<String>,
    pub pickup_address: Option<String>,
    pub address_reference: Option<String>,
    pub billing_email: Option<String>,
    pub billing_phone: Option<String>,
    pub internal_email: Option<String>,
    pub internal_phone: Option<String>,
    pub rating: Decimal,
    pub completed_orders: i32,
}

const STORE_COLUMNS: &str = r#"
    id, name, description, categories, status::text AS status, is_official_store,
    is_verified_by_hupi, province, city, pickup_address, address_reference,
    billing_email, billing_phone, internal_email, internal_phone, rating,
    completed_orders
"#;

fn to_store(row: &sqlx::postgres::PgRow) -> StoreView {
    StoreView {
        id: row.get("id"),
        name: row.get("name"),
        description: row.get("description"),
        categories: row.get("categories"),
        status: row.get("status"),
        is_official_store: row.get("is_official_store"),
        is_verified_by_hupi: row.get("is_verified_by_hupi"),
        province: row.get("province"),
        city: row.get("city"),
        pickup_address: row.get("pickup_address"),
        address_reference: row.get("address_reference"),
        billing_email: row.get("billing_email"),
        billing_phone: row.get("billing_phone"),
        internal_email: row.get("internal_email"),
        internal_phone: row.get("internal_phone"),
        rating: row.get("rating"),
        completed_orders: row.get("completed_orders"),
    }
}

async fn get_store(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<StoreView>> {
    let id = store_id(&state, account.id).await?;
    let row = sqlx::query(&format!("SELECT {STORE_COLUMNS} FROM stores WHERE id = $1"))
        .bind(id)
        .fetch_one(&state.db)
        .await?;

    Ok(Json(to_store(&row)))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoreInput {
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub categories: Vec<String>,
    pub pickup_address: Option<String>,
    pub address_reference: Option<String>,
    pub billing_email: Option<String>,
    pub billing_phone: Option<String>,
    pub internal_email: Option<String>,
    pub internal_phone: Option<String>,
}

async fn save_store(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<StoreInput>,
) -> AppResult<Json<StoreView>> {
    if payload.name.trim().is_empty() {
        return Err(AppError::Validation(
            "la tienda necesita un nombre".to_string(),
        ));
    }

    let id = store_id(&state, account.id).await?;

    // La identidad legal (provincia, ciudad) viene de la verificación: no se toca.
    let row = sqlx::query(&format!(
        r#"
        UPDATE stores SET
            name = $2, description = $3, categories = $4, pickup_address = $5,
            address_reference = $6, billing_email = $7, billing_phone = $8,
            internal_email = $9, internal_phone = $10, updated_at = now()
        WHERE id = $1
        RETURNING {STORE_COLUMNS}
        "#
    ))
    .bind(id)
    .bind(payload.name.trim())
    .bind(&payload.description)
    .bind(&payload.categories)
    .bind(&payload.pickup_address)
    .bind(&payload.address_reference)
    .bind(&payload.billing_email)
    .bind(&payload.billing_phone)
    .bind(&payload.internal_email)
    .bind(&payload.internal_phone)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(to_store(&row)))
}

// --- Envíos ---------------------------------------------------------------

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShippingOption {
    pub method: String,
    pub enabled: bool,
    #[serde(default)]
    pub price: Decimal,
    pub estimate: Option<String>,
    pub instructions: Option<String>,
}

async fn load_shipping(state: &AppState, store: Uuid) -> AppResult<Vec<ShippingOption>> {
    let rows = sqlx::query(
        "SELECT method::text AS method, enabled, price, estimate, instructions
         FROM store_shipping_settings WHERE store_id = $1 ORDER BY method",
    )
    .bind(store)
    .fetch_all(&state.db)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| ShippingOption {
            method: row.get("method"),
            enabled: row.get("enabled"),
            price: row.get("price"),
            estimate: row.get("estimate"),
            instructions: row.get("instructions"),
        })
        .collect())
}

async fn get_shipping(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<Vec<ShippingOption>>> {
    let id = store_id(&state, account.id).await?;
    Ok(Json(load_shipping(&state, id).await?))
}

async fn save_shipping(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<Vec<ShippingOption>>,
) -> AppResult<Json<Vec<ShippingOption>>> {
    let id = store_id(&state, account.id).await?;

    for option in &payload {
        if !matches!(option.method.as_str(), "standard" | "express" | "pickup") {
            return Err(AppError::Validation(format!(
                "método de envío desconocido: {}",
                option.method
            )));
        }
        if option.price < Decimal::ZERO {
            return Err(AppError::Validation(
                "el precio de envío no puede ser negativo".to_string(),
            ));
        }
    }

    let mut tx = state.db.begin().await?;
    for option in &payload {
        sqlx::query(
            r#"
            INSERT INTO store_shipping_settings (
                store_id, method, enabled, price, estimate, instructions
            ) VALUES ($1, $2::shipping_method, $3, $4, $5, $6)
            ON CONFLICT (store_id, method) DO UPDATE SET
                enabled = EXCLUDED.enabled,
                price = EXCLUDED.price,
                estimate = EXCLUDED.estimate,
                instructions = EXCLUDED.instructions
            "#,
        )
        .bind(id)
        .bind(&option.method)
        .bind(option.enabled)
        .bind(option.price)
        .bind(&option.estimate)
        .bind(&option.instructions)
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;

    Ok(Json(load_shipping(&state, id).await?))
}

// --- Catálogo propio ------------------------------------------------------

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StoreProductView {
    /// Código estable si existe; si no, el UUID.
    pub id: String,
    pub uuid: Uuid,
    pub name: String,
    pub description: String,
    pub brand: Option<String>,
    pub sku: Option<String>,
    pub category_id: Option<String>,
    pub card_price_before: Option<Decimal>,
    pub card_price_after: Decimal,
    pub transfer_price_before: Option<Decimal>,
    pub transfer_price_after: Decimal,
    pub stock: i32,
    pub stock_alert_min: i32,
    pub status: String,
    pub approval_status: String,
    pub is_active: bool,
    pub tags: Vec<String>,
}

const PRODUCT_COLUMNS: &str = r#"
    id, code, name, description, brand, sku, category_id, card_price_before,
    card_price_after, transfer_price_before, transfer_price_after, stock,
    stock_alert_min, status::text AS status, approval_status::text AS approval_status,
    is_active, tags
"#;

fn to_product(row: &sqlx::postgres::PgRow) -> StoreProductView {
    let uuid: Uuid = row.get("id");
    let code: Option<String> = row.get("code");

    StoreProductView {
        id: code.unwrap_or_else(|| uuid.to_string()),
        uuid,
        name: row.get("name"),
        description: row.get("description"),
        brand: row.get("brand"),
        sku: row.get("sku"),
        category_id: row.get("category_id"),
        card_price_before: row.get("card_price_before"),
        card_price_after: row.get("card_price_after"),
        transfer_price_before: row.get("transfer_price_before"),
        transfer_price_after: row.get("transfer_price_after"),
        stock: row.get("stock"),
        stock_alert_min: row.get("stock_alert_min"),
        status: row.get("status"),
        approval_status: row.get("approval_status"),
        is_active: row.get("is_active"),
        tags: row.get("tags"),
    }
}

async fn list_products(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<Vec<StoreProductView>>> {
    let id = store_id(&state, account.id).await?;
    let rows = sqlx::query(&format!(
        "SELECT {PRODUCT_COLUMNS} FROM products WHERE store_id = $1 ORDER BY created_at DESC"
    ))
    .bind(id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(rows.iter().map(to_product).collect()))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductInput {
    pub code: Option<String>,
    pub name: String,
    #[serde(default)]
    pub description: String,
    pub brand: Option<String>,
    pub sku: Option<String>,
    pub category_id: Option<String>,
    pub card_price_before: Option<Decimal>,
    pub card_price_after: Decimal,
    pub transfer_price_before: Option<Decimal>,
    pub transfer_price_after: Decimal,
    #[serde(default)]
    pub stock: i32,
    #[serde(default)]
    pub stock_alert_min: i32,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default = "yes")]
    pub is_active: bool,
}

fn yes() -> bool {
    true
}

fn validate_product(input: &ProductInput) -> AppResult<()> {
    if input.name.trim().is_empty() {
        return Err(AppError::Validation(
            "el producto necesita un nombre".into(),
        ));
    }
    if input.card_price_after <= Decimal::ZERO || input.transfer_price_after <= Decimal::ZERO {
        return Err(AppError::Validation(
            "los precios deben ser mayores que cero".into(),
        ));
    }
    if input.stock < 0 || input.stock_alert_min < 0 {
        return Err(AppError::Validation(
            "el stock no puede ser negativo".into(),
        ));
    }
    Ok(())
}

/// Sin stock el producto no se puede vender, aunque esté activo.
fn stock_status(stock: i32) -> &'static str {
    if stock > 0 {
        "available"
    } else {
        "out_of_stock"
    }
}

async fn create_product(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<ProductInput>,
) -> AppResult<Json<StoreProductView>> {
    validate_product(&payload)?;
    let id = store_id(&state, account.id).await?;

    let row = sqlx::query(&format!(
        r#"
        INSERT INTO products (
            store_id, code, name, description, brand, sku, category_id,
            card_price_before, card_price_after, transfer_price_before,
            transfer_price_after, stock, stock_alert_min, stock_status,
            status, approval_status, is_active, tags
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
            $14::stock_status, 'under_review', 'draft', $15, $16
        )
        RETURNING {PRODUCT_COLUMNS}
        "#
    ))
    .bind(id)
    .bind(payload.code.as_deref())
    .bind(payload.name.trim())
    .bind(&payload.description)
    .bind(&payload.brand)
    .bind(&payload.sku)
    .bind(&payload.category_id)
    .bind(payload.card_price_before)
    .bind(payload.card_price_after)
    .bind(payload.transfer_price_before)
    .bind(payload.transfer_price_after)
    .bind(payload.stock)
    .bind(payload.stock_alert_min)
    .bind(stock_status(payload.stock))
    .bind(payload.is_active)
    .bind(&payload.tags)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(to_product(&row)))
}

async fn update_product(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(reference): Path<String>,
    Json(payload): Json<ProductInput>,
) -> AppResult<Json<StoreProductView>> {
    validate_product(&payload)?;
    let id = store_id(&state, account.id).await?;

    let row = sqlx::query(&format!(
        r#"
        UPDATE products SET
            name = $3, description = $4, brand = $5, sku = $6, category_id = $7,
            card_price_before = $8, card_price_after = $9,
            transfer_price_before = $10, transfer_price_after = $11,
            stock = $12, stock_alert_min = $13, stock_status = $14::stock_status,
            is_active = $15, tags = $16, updated_at = now()
        WHERE store_id = $1 AND (code = $2 OR id::text = $2)
        RETURNING {PRODUCT_COLUMNS}
        "#
    ))
    .bind(id)
    .bind(&reference)
    .bind(payload.name.trim())
    .bind(&payload.description)
    .bind(&payload.brand)
    .bind(&payload.sku)
    .bind(&payload.category_id)
    .bind(payload.card_price_before)
    .bind(payload.card_price_after)
    .bind(payload.transfer_price_before)
    .bind(payload.transfer_price_after)
    .bind(payload.stock)
    .bind(payload.stock_alert_min)
    .bind(stock_status(payload.stock))
    .bind(payload.is_active)
    .bind(&payload.tags)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("producto"))?;

    Ok(Json(to_product(&row)))
}

/// Se despublica en vez de borrar: los pedidos ya hechos siguen apuntando aquí.
async fn delete_product(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(reference): Path<String>,
) -> AppResult<Json<StoreProductView>> {
    let id = store_id(&state, account.id).await?;

    let row = sqlx::query(&format!(
        r#"
        UPDATE products SET is_active = FALSE, status = 'paused', updated_at = now()
        WHERE store_id = $1 AND (code = $2 OR id::text = $2)
        RETURNING {PRODUCT_COLUMNS}
        "#
    ))
    .bind(id)
    .bind(&reference)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("producto"))?;

    Ok(Json(to_product(&row)))
}
