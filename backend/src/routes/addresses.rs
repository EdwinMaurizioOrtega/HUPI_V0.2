use axum::extract::{Path, State};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::CurrentAccount;
use crate::error::{AppError, AppResult};
use crate::routes::snapshot::{load_snapshot, AccountSnapshot};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/addresses", get(list_addresses).post(create_address))
        .route(
            "/addresses/{id}",
            axum::routing::put(update_address).delete(delete_address),
        )
        .route("/addresses/{id}/default", post(set_default_address))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddressPayload {
    pub label_type: Option<String>,
    pub custom_label: Option<String>,
    pub icon_key: Option<String>,
    pub formatted_address: String,
    pub street_address: Option<String>,
    pub house_number: Option<String>,
    pub reference: Option<String>,
    pub city: Option<String>,
    pub province: Option<String>,
    pub country: Option<String>,
    pub postal_code: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    #[serde(default)]
    pub is_default: bool,
    pub source: Option<String>,
}

fn validate(payload: &AddressPayload) -> AppResult<()> {
    if payload.formatted_address.trim().is_empty() {
        return Err(AppError::Validation(
            "la dirección es obligatoria".to_string(),
        ));
    }
    if let Some(label) = payload.label_type.as_deref() {
        if !matches!(label, "home" | "work" | "other") {
            return Err(AppError::Validation("etiqueta no soportada".to_string()));
        }
    }
    if let Some(latitude) = payload.latitude {
        if !(-90.0..=90.0).contains(&latitude) {
            return Err(AppError::Validation("latitud fuera de rango".to_string()));
        }
    }
    if let Some(longitude) = payload.longitude {
        if !(-180.0..=180.0).contains(&longitude) {
            return Err(AppError::Validation("longitud fuera de rango".to_string()));
        }
    }
    Ok(())
}

async fn list_addresses(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<AccountSnapshot>> {
    Ok(Json(load_snapshot(&state.db, account.id).await?))
}

async fn create_address(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<AddressPayload>,
) -> AppResult<Json<AccountSnapshot>> {
    validate(&payload)?;

    let mut tx = state.db.begin().await?;

    // La primera dirección de la cuenta siempre queda como predeterminada.
    let existing: i64 = sqlx::query_scalar(
        "SELECT count(*) FROM addresses WHERE account_id = $1",
    )
    .bind(account.id)
    .fetch_one(&mut *tx)
    .await?;

    let should_be_default = payload.is_default || existing == 0;

    if should_be_default {
        sqlx::query("UPDATE addresses SET is_default = FALSE WHERE account_id = $1")
            .bind(account.id)
            .execute(&mut *tx)
            .await?;
    }

    sqlx::query(
        r#"
        INSERT INTO addresses (
            account_id, label_type, custom_label, icon_key, formatted_address,
            street_address, house_number, reference, city, province, country,
            postal_code, latitude, longitude, is_default, source
        )
        VALUES (
            $1, COALESCE($2::address_label_type, 'home'), $3, COALESCE($4, 'home'), $5,
            COALESCE($6, ''), $7, $8, COALESCE($9, ''), COALESCE($10, ''), COALESCE($11, 'EC'),
            $12, $13, $14, $15, COALESCE($16::address_source, 'manual')
        )
        "#,
    )
    .bind(account.id)
    .bind(&payload.label_type)
    .bind(&payload.custom_label)
    .bind(&payload.icon_key)
    .bind(payload.formatted_address.trim())
    .bind(&payload.street_address)
    .bind(&payload.house_number)
    .bind(&payload.reference)
    .bind(&payload.city)
    .bind(&payload.province)
    .bind(&payload.country)
    .bind(&payload.postal_code)
    .bind(payload.latitude)
    .bind(payload.longitude)
    .bind(should_be_default)
    .bind(&payload.source)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(Json(load_snapshot(&state.db, account.id).await?))
}

async fn update_address(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<Uuid>,
    Json(payload): Json<AddressPayload>,
) -> AppResult<Json<AccountSnapshot>> {
    validate(&payload)?;

    let affected = sqlx::query(
        r#"
        UPDATE addresses
        SET label_type = COALESCE($3::address_label_type, label_type),
            custom_label = $4,
            icon_key = COALESCE($5, icon_key),
            formatted_address = $6,
            street_address = COALESCE($7, street_address),
            house_number = $8,
            reference = $9,
            city = COALESCE($10, city),
            province = COALESCE($11, province),
            country = COALESCE($12, country),
            postal_code = $13,
            latitude = $14,
            longitude = $15,
            updated_at = now()
        WHERE id = $1 AND account_id = $2
        "#,
    )
    .bind(id)
    .bind(account.id)
    .bind(&payload.label_type)
    .bind(&payload.custom_label)
    .bind(&payload.icon_key)
    .bind(payload.formatted_address.trim())
    .bind(&payload.street_address)
    .bind(&payload.house_number)
    .bind(&payload.reference)
    .bind(&payload.city)
    .bind(&payload.province)
    .bind(&payload.country)
    .bind(&payload.postal_code)
    .bind(payload.latitude)
    .bind(payload.longitude)
    .execute(&state.db)
    .await?
    .rows_affected();

    if affected == 0 {
        return Err(AppError::NotFound("dirección"));
    }

    Ok(Json(load_snapshot(&state.db, account.id).await?))
}

async fn delete_address(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<Uuid>,
) -> AppResult<Json<AccountSnapshot>> {
    let mut tx = state.db.begin().await?;

    let was_default: Option<bool> = sqlx::query_scalar(
        "DELETE FROM addresses WHERE id = $1 AND account_id = $2 RETURNING is_default",
    )
    .bind(id)
    .bind(account.id)
    .fetch_optional(&mut *tx)
    .await?;

    let Some(was_default) = was_default else {
        return Err(AppError::NotFound("dirección"));
    };

    // Al borrar la predeterminada, se promueve la más antigua restante.
    if was_default {
        sqlx::query(
            r#"
            UPDATE addresses SET is_default = TRUE
            WHERE id = (
                SELECT id FROM addresses
                WHERE account_id = $1
                ORDER BY created_at ASC
                LIMIT 1
            )
            "#,
        )
        .bind(account.id)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok(Json(load_snapshot(&state.db, account.id).await?))
}

async fn set_default_address(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<Uuid>,
) -> AppResult<Json<AccountSnapshot>> {
    let mut tx = state.db.begin().await?;

    sqlx::query("UPDATE addresses SET is_default = FALSE WHERE account_id = $1")
        .bind(account.id)
        .execute(&mut *tx)
        .await?;

    let affected = sqlx::query(
        "UPDATE addresses SET is_default = TRUE, updated_at = now() WHERE id = $1 AND account_id = $2",
    )
    .bind(id)
    .bind(account.id)
    .execute(&mut *tx)
    .await?
    .rows_affected();

    if affected == 0 {
        return Err(AppError::NotFound("dirección"));
    }

    tx.commit().await?;

    Ok(Json(load_snapshot(&state.db, account.id).await?))
}
