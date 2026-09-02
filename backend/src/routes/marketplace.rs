use axum::extract::{Path, Query, State};
use axum::routing::{get, post};
use axum::{Json, Router};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use uuid::Uuid;

use crate::auth::CurrentAccount;
use crate::domain::text_search::matches_all_terms;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/marketplace/products", get(list_products))
        .route("/marketplace/products/{id}", get(product_detail))
        .route("/marketplace/stores", get(list_stores))
        .route("/marketplace/cart", get(get_cart).put(replace_cart))
        .route("/marketplace/cart/validate", post(validate_cart))
        .route("/marketplace/cart/coupon", post(apply_coupon).delete(clear_coupon))
        .route("/marketplace/checkout/quote", post(checkout_quote))
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductView {
    /// Código legible (`product-1`) si existe; si no, el UUID.
    pub id: String,
    pub uuid: Uuid,
    pub store_id: Uuid,
    pub store_name: String,
    pub store_is_official: bool,
    pub store_is_verified: bool,
    pub name: String,
    pub description: String,
    pub brand: Option<String>,
    pub sku: Option<String>,
    pub product_type: String,
    pub category_id: Option<String>,
    pub card_price_after: Decimal,
    pub transfer_price_after: Decimal,
    pub card_price_before: Option<Decimal>,
    pub transfer_price_before: Option<Decimal>,
    pub stock: i32,
    pub stock_status: String,
    pub status: String,
    pub tags: Vec<String>,
    pub is_available: bool,
}

const PRODUCT_SELECT: &str = r#"
    SELECT p.id, p.code, p.store_id, s.name AS store_name, s.is_official_store,
           s.is_verified_by_hupi, s.status::text AS store_status,
           p.name, p.description, p.brand, p.sku, p.product_type::text AS product_type,
           p.category_id, p.card_price_after, p.transfer_price_after,
           p.card_price_before, p.transfer_price_before, p.stock,
           p.stock_status::text AS stock_status, p.status::text AS status,
           p.tags, p.is_active
    FROM products p
    JOIN stores s ON s.id = p.store_id
"#;

fn to_product(row: &sqlx::postgres::PgRow) -> ProductView {
    let store_status: String = row.get("store_status");
    let status: String = row.get("status");
    let stock: i32 = row.get("stock");
    let is_active: bool = row.get("is_active");
    let uuid: Uuid = row.get("id");

    ProductView {
        id: row
            .get::<Option<String>, _>("code")
            .unwrap_or_else(|| uuid.to_string()),
        uuid,
        store_id: row.get("store_id"),
        store_name: row.get("store_name"),
        store_is_official: row.get("is_official_store"),
        store_is_verified: row.get("is_verified_by_hupi"),
        name: row.get("name"),
        description: row.get("description"),
        brand: row.get("brand"),
        sku: row.get("sku"),
        product_type: row.get("product_type"),
        category_id: row.get("category_id"),
        card_price_after: row.get("card_price_after"),
        transfer_price_after: row.get("transfer_price_after"),
        card_price_before: row.get("card_price_before"),
        transfer_price_before: row.get("transfer_price_before"),
        stock,
        stock_status: row.get("stock_status"),
        // Publicable = tienda habilitada + producto activo + hay stock.
        is_available: store_status == "enabled" && is_active && status == "active" && stock > 0,
        status,
        tags: row.get("tags"),
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductQuery {
    pub query: Option<String>,
    pub category: Option<String>,
    pub store_id: Option<Uuid>,
}

async fn list_products(
    State(state): State<AppState>,
    _account: CurrentAccount,
    Query(params): Query<ProductQuery>,
) -> AppResult<Json<Vec<ProductView>>> {
    // El catálogo público solo muestra tiendas habilitadas y productos activos.
    let sql = format!(
        "{PRODUCT_SELECT}
         WHERE s.status = 'enabled' AND p.is_active AND p.status = 'active'
           AND ($1::uuid IS NULL OR p.store_id = $1)
           AND ($2::text IS NULL OR p.category_id = $2)
         ORDER BY p.name"
    );

    let rows = sqlx::query(&sql)
        .bind(params.store_id)
        .bind(&params.category)
        .fetch_all(&state.db)
        .await?;

    let products: Vec<ProductView> = rows
        .iter()
        .map(to_product)
        .filter(|product| {
            params.query.as_ref().is_none_or(|term| {
                let haystack = format!(
                    "{} {} {}",
                    product.name,
                    product.brand.clone().unwrap_or_default(),
                    product.description
                );
                matches_all_terms(&haystack, term)
            })
        })
        .collect();

    Ok(Json(products))
}

async fn product_detail(
    State(state): State<AppState>,
    _account: CurrentAccount,
    Path(reference): Path<String>,
) -> AppResult<Json<ProductView>> {
    let row = sqlx::query(&format!(
        "{PRODUCT_SELECT} WHERE p.code = $1 OR p.id::text = $1"
    ))
    .bind(&reference)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("producto"))?;

    Ok(Json(to_product(&row)))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StoreView {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub categories: Vec<String>,
    pub is_official_store: bool,
    pub is_verified_by_hupi: bool,
    pub province: Option<String>,
    pub city: Option<String>,
    pub rating: Decimal,
    pub completed_orders: i32,
}

async fn list_stores(
    State(state): State<AppState>,
    _account: CurrentAccount,
) -> AppResult<Json<Vec<StoreView>>> {
    let rows = sqlx::query(
        r#"
        SELECT id, name, description, categories, is_official_store,
               is_verified_by_hupi, province, city, rating, completed_orders
        FROM stores WHERE status = 'enabled' ORDER BY is_official_store DESC, rating DESC
        "#,
    )
    .fetch_all(&state.db)
    .await?;

    let stores = rows
        .into_iter()
        .map(|row| StoreView {
            id: row.get("id"),
            name: row.get("name"),
            description: row.get("description"),
            categories: row.get("categories"),
            is_official_store: row.get("is_official_store"),
            is_verified_by_hupi: row.get("is_verified_by_hupi"),
            province: row.get("province"),
            city: row.get("city"),
            rating: row.get("rating"),
            completed_orders: row.get("completed_orders"),
        })
        .collect();

    Ok(Json(stores))
}

// --- Carrito --------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CartItem {
    /// Acepta el código legible o el UUID.
    pub product_id: String,
    pub variation_id: Option<Uuid>,
    pub quantity: i32,
    #[serde(default)]
    pub unit_price: Decimal,
    #[serde(default)]
    pub product_name: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CartView {
    pub items: Vec<CartItem>,
    pub coupon_code: Option<String>,
    pub subtotal: Decimal,
}

async fn cart_id(state: &AppState, account_id: Uuid) -> AppResult<Uuid> {
    let id: Uuid = sqlx::query(
        r#"
        INSERT INTO carts (account_id) VALUES ($1)
        ON CONFLICT (account_id) DO UPDATE SET updated_at = now()
        RETURNING id
        "#,
    )
    .bind(account_id)
    .fetch_one(&state.db)
    .await?
    .get("id");
    Ok(id)
}

async fn load_cart(state: &AppState, account_id: Uuid) -> AppResult<CartView> {
    let cart = cart_id(state, account_id).await?;

    let coupon_code: Option<String> = sqlx::query("SELECT coupon_code FROM carts WHERE id = $1")
        .bind(cart)
        .fetch_one(&state.db)
        .await?
        .get("coupon_code");

    let rows = sqlx::query(
        r#"
        SELECT coalesce(p.code, p.id::text) AS product_reference,
               ci.variation_id, ci.quantity, ci.unit_price_snapshot, p.name
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        WHERE ci.cart_id = $1
        ORDER BY ci.added_at
        "#,
    )
    .bind(cart)
    .fetch_all(&state.db)
    .await?;

    let items: Vec<CartItem> = rows
        .into_iter()
        .map(|row| CartItem {
            product_id: row.get("product_reference"),
            variation_id: row.get("variation_id"),
            quantity: row.get("quantity"),
            unit_price: row.get("unit_price_snapshot"),
            product_name: row.get("name"),
        })
        .collect();

    let subtotal = items
        .iter()
        .map(|item| item.unit_price * Decimal::from(item.quantity))
        .sum();

    Ok(CartView {
        items,
        coupon_code,
        subtotal,
    })
}

async fn get_cart(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<CartView>> {
    Ok(Json(load_cart(&state, account.id).await?))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReplaceCartRequest {
    pub items: Vec<CartItem>,
}

async fn replace_cart(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<ReplaceCartRequest>,
) -> AppResult<Json<CartView>> {
    let cart = cart_id(&state, account.id).await?;
    let mut tx = state.db.begin().await?;

    sqlx::query("DELETE FROM cart_items WHERE cart_id = $1")
        .bind(cart)
        .execute(&mut *tx)
        .await?;

    for item in &payload.items {
        if item.quantity <= 0 {
            return Err(AppError::Validation(
                "la cantidad debe ser mayor que cero".to_string(),
            ));
        }

        // El precio se toma del catálogo, nunca del cliente.
        sqlx::query(
            r#"
            INSERT INTO cart_items (cart_id, product_id, variation_id, quantity, unit_price_snapshot)
            SELECT $1, p.id, $3, $4, p.card_price_after
            FROM products p WHERE p.code = $2 OR p.id::text = $2
            ON CONFLICT (cart_id, product_id, variation_id)
                DO UPDATE SET quantity = EXCLUDED.quantity
            "#,
        )
        .bind(cart)
        .bind(&item.product_id)
        .bind(item.variation_id)
        .bind(item.quantity)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(Json(load_cart(&state, account.id).await?))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CartIssue {
    pub product_id: String,
    pub product_name: String,
    pub issue_type: String,
    pub message: String,
}

async fn validate_cart(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<Vec<CartIssue>>> {
    let cart = cart_id(&state, account.id).await?;

    let rows = sqlx::query(
        r#"
        SELECT coalesce(p.code, p.id::text) AS product_reference,
               ci.quantity, p.name, p.stock, p.status::text AS status,
               p.is_active, s.status::text AS store_status
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        JOIN stores s ON s.id = p.store_id
        WHERE ci.cart_id = $1
        "#,
    )
    .bind(cart)
    .fetch_all(&state.db)
    .await?;

    let issues = rows
        .into_iter()
        .filter_map(|row| {
            let name: String = row.get("name");
            let stock: i32 = row.get("stock");
            let quantity: i32 = row.get("quantity");
            let status: String = row.get("status");
            let store_status: String = row.get("store_status");
            let is_active: bool = row.get("is_active");

            let (issue_type, message) = if store_status != "enabled" || !is_active || status != "active" {
                (
                    "product_unavailable",
                    format!("{name} ya no está disponible."),
                )
            } else if quantity > stock {
                (
                    "quantity_exceeds_stock",
                    format!("Solo quedan {stock} unidades de {name}."),
                )
            } else {
                return None;
            };

            Some(CartIssue {
                product_id: row.get("product_reference"),
                product_name: name,
                issue_type: issue_type.to_string(),
                message,
            })
        })
        .collect();

    Ok(Json(issues))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CouponRequest {
    pub code: String,
}

async fn apply_coupon(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<CouponRequest>,
) -> AppResult<Json<CartView>> {
    let code = payload.code.trim().to_uppercase();

    let valid: Option<bool> = sqlx::query(
        r#"
        SELECT TRUE AS ok FROM coupons
        WHERE code = $1 AND is_active
          AND (valid_from IS NULL OR valid_from <= now())
          AND (valid_until IS NULL OR valid_until >= now())
          AND (max_uses IS NULL OR used_count < max_uses)
        "#,
    )
    .bind(&code)
    .fetch_optional(&state.db)
    .await?
    .map(|row| row.get("ok"));

    if valid.is_none() {
        return Err(AppError::Validation("el cupón no es válido".to_string()));
    }

    let cart = cart_id(&state, account.id).await?;
    sqlx::query("UPDATE carts SET coupon_code = $2, updated_at = now() WHERE id = $1")
        .bind(cart)
        .bind(&code)
        .execute(&state.db)
        .await?;

    Ok(Json(load_cart(&state, account.id).await?))
}

async fn clear_coupon(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<CartView>> {
    let cart = cart_id(&state, account.id).await?;
    sqlx::query("UPDATE carts SET coupon_code = NULL, updated_at = now() WHERE id = $1")
        .bind(cart)
        .execute(&state.db)
        .await?;

    Ok(Json(load_cart(&state, account.id).await?))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckoutQuoteRequest {
    pub shipping_method: Option<String>,
    #[serde(default)]
    pub donation: Decimal,
    #[serde(default)]
    pub use_hupi_balance: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckoutQuote {
    pub subtotal: Decimal,
    pub shipping_cost: Decimal,
    pub discount: Decimal,
    pub donation: Decimal,
    pub hupi_balance_applied: Decimal,
    pub total: Decimal,
}

/// Calcula el importe del carrito. Es la única fuente: la usan tanto la
/// cotización previa como la creación del pedido, para que no puedan diferir.
pub async fn quote_cart(
    state: &AppState,
    account_id: Uuid,
    shipping_method: Option<&str>,
    donation: Decimal,
    use_hupi_balance: bool,
) -> AppResult<CheckoutQuote> {
    let cart = load_cart(state, account_id).await?;

    let shipping_cost = match shipping_method {
        Some("pickup") => Decimal::ZERO,
        Some("express") => Decimal::new(450, 2),
        _ => Decimal::new(250, 2),
    };

    let discount = match &cart.coupon_code {
        Some(code) => {
            let row = sqlx::query(
                "SELECT discount_percent, discount_amount FROM coupons WHERE code = $1",
            )
            .bind(code)
            .fetch_optional(&state.db)
            .await?;

            row.map(|row| {
                let percent: Option<i16> = row.get("discount_percent");
                let amount: Option<Decimal> = row.get("discount_amount");
                percent
                    .map(|value| cart.subtotal * Decimal::from(value) / Decimal::from(100))
                    .or(amount)
                    .unwrap_or(Decimal::ZERO)
            })
            .unwrap_or(Decimal::ZERO)
        }
        None => Decimal::ZERO,
    };

    let before_balance = (cart.subtotal + shipping_cost + donation - discount).max(Decimal::ZERO);

    let hupi_balance_applied = if use_hupi_balance {
        let balance: Decimal = sqlx::query(
            "SELECT COALESCE(SUM(amount), 0) AS balance FROM wallet_movements
             WHERE account_id = $1 AND status = 'available'",
        )
        .bind(account_id)
        .fetch_one(&state.db)
        .await?
        .get("balance");

        balance.min(before_balance).max(Decimal::ZERO)
    } else {
        Decimal::ZERO
    };

    Ok(CheckoutQuote {
        subtotal: cart.subtotal,
        shipping_cost,
        discount,
        donation,
        hupi_balance_applied,
        total: before_balance - hupi_balance_applied,
    })
}

async fn checkout_quote(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<CheckoutQuoteRequest>,
) -> AppResult<Json<CheckoutQuote>> {
    Ok(Json(
        quote_cart(
            &state,
            account.id,
            payload.shipping_method.as_deref(),
            payload.donation,
            payload.use_hupi_balance,
        )
        .await?,
    ))
}
