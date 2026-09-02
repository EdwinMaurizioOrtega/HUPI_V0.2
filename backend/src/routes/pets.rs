use axum::extract::{Path, Query, State};
use axum::routing::get;
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
        .route("/pets", get(list_pets).post(create_pet))
        .route("/pets/{id}", get(pet_detail).put(update_pet).delete(delete_pet))
        .route("/pets/{id}/history", get(pet_history))
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PetView {
    pub id: Uuid,
    pub code: Option<String>,
    pub name: String,
    pub species: Option<String>,
    pub breed: Option<String>,
    pub birthday: Option<NaiveDate>,
    pub weight_kg: Option<Decimal>,
    pub sex: Option<String>,
    pub size: Option<String>,
    pub physical_activity: Option<String>,
    pub behavior: Option<String>,
    pub behavior_description: Option<String>,
    pub bites: Option<bool>,
    pub allergies: Option<String>,
    pub medications: Option<String>,
    pub care_instructions: Option<String>,
    pub veterinarian_name: Option<String>,
    pub clinic_name: Option<String>,
    pub emergency_contact_name: Option<String>,
    pub emergency_contact_phone: Option<String>,
    pub vaccines_up_to_date: bool,
    pub sterilized: bool,
    pub photo_uri: Option<String>,
}

const PET_COLUMNS: &str = r#"
    id, code, name, species, breed, birthday, weight_kg, sex, size,
    physical_activity, behavior, behavior_description, bites, allergies,
    medications, care_instructions, veterinarian_name, clinic_name,
    emergency_contact_name, emergency_contact_phone, vaccines_up_to_date,
    sterilized, photo_uri
"#;

fn to_pet(row: &sqlx::postgres::PgRow) -> PetView {
    PetView {
        id: row.get("id"),
        code: row.get("code"),
        name: row.get("name"),
        species: row.get("species"),
        breed: row.get("breed"),
        birthday: row.get("birthday"),
        weight_kg: row.get("weight_kg"),
        sex: row.get("sex"),
        size: row.get("size"),
        physical_activity: row.get("physical_activity"),
        behavior: row.get("behavior"),
        behavior_description: row.get("behavior_description"),
        bites: row.get("bites"),
        allergies: row.get("allergies"),
        medications: row.get("medications"),
        care_instructions: row.get("care_instructions"),
        veterinarian_name: row.get("veterinarian_name"),
        clinic_name: row.get("clinic_name"),
        emergency_contact_name: row.get("emergency_contact_name"),
        emergency_contact_phone: row.get("emergency_contact_phone"),
        vaccines_up_to_date: row.get("vaccines_up_to_date"),
        sterilized: row.get("sterilized"),
        photo_uri: row.get("photo_uri"),
    }
}

async fn list_pets(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<Vec<PetView>>> {
    let rows = sqlx::query(&format!(
        "SELECT {PET_COLUMNS} FROM pets WHERE account_id = $1 ORDER BY created_at"
    ))
    .bind(account.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(rows.iter().map(to_pet).collect()))
}

async fn pet_detail(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<Uuid>,
) -> AppResult<Json<PetView>> {
    let row = sqlx::query(&format!(
        "SELECT {PET_COLUMNS} FROM pets WHERE id = $1 AND account_id = $2"
    ))
    .bind(id)
    .bind(account.id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("mascota"))?;

    Ok(Json(to_pet(&row)))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PetInput {
    pub name: String,
    pub species: Option<String>,
    pub breed: Option<String>,
    pub birthday: Option<NaiveDate>,
    pub weight_kg: Option<Decimal>,
    pub sex: Option<String>,
    pub size: Option<String>,
    pub physical_activity: Option<String>,
    pub behavior: Option<String>,
    pub behavior_description: Option<String>,
    pub bites: Option<bool>,
    pub allergies: Option<String>,
    pub medications: Option<String>,
    pub care_instructions: Option<String>,
    pub veterinarian_name: Option<String>,
    pub clinic_name: Option<String>,
    pub emergency_contact_name: Option<String>,
    pub emergency_contact_phone: Option<String>,
    #[serde(default)]
    pub vaccines_up_to_date: bool,
    #[serde(default)]
    pub sterilized: bool,
    pub photo_uri: Option<String>,
}

async fn create_pet(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<PetInput>,
) -> AppResult<Json<PetView>> {
    if payload.name.trim().is_empty() {
        return Err(AppError::Validation(
            "el nombre de la mascota es obligatorio".to_string(),
        ));
    }

    let row = sqlx::query(&format!(
        r#"
        INSERT INTO pets (
            account_id, name, species, breed, birthday, weight_kg, sex, size,
            physical_activity, behavior, behavior_description, bites, allergies,
            medications, care_instructions, veterinarian_name, clinic_name,
            emergency_contact_name, emergency_contact_phone, vaccines_up_to_date,
            sterilized, photo_uri
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
            $14, $15, $16, $17, $18, $19, $20, $21, $22
        )
        RETURNING {PET_COLUMNS}
        "#
    ))
    .bind(account.id)
    .bind(payload.name.trim())
    .bind(&payload.species)
    .bind(&payload.breed)
    .bind(payload.birthday)
    .bind(payload.weight_kg)
    .bind(&payload.sex)
    .bind(&payload.size)
    .bind(&payload.physical_activity)
    .bind(&payload.behavior)
    .bind(&payload.behavior_description)
    .bind(payload.bites)
    .bind(&payload.allergies)
    .bind(&payload.medications)
    .bind(&payload.care_instructions)
    .bind(&payload.veterinarian_name)
    .bind(&payload.clinic_name)
    .bind(&payload.emergency_contact_name)
    .bind(&payload.emergency_contact_phone)
    .bind(payload.vaccines_up_to_date)
    .bind(payload.sterilized)
    .bind(&payload.photo_uri)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(to_pet(&row)))
}

async fn update_pet(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<Uuid>,
    Json(payload): Json<PetInput>,
) -> AppResult<Json<PetView>> {
    if payload.name.trim().is_empty() {
        return Err(AppError::Validation(
            "el nombre de la mascota es obligatorio".to_string(),
        ));
    }

    let row = sqlx::query(&format!(
        r#"
        UPDATE pets SET
            name = $3, species = $4, breed = $5, birthday = $6, weight_kg = $7,
            sex = $8, size = $9, physical_activity = $10, behavior = $11,
            behavior_description = $12, bites = $13, allergies = $14,
            medications = $15, care_instructions = $16, veterinarian_name = $17,
            clinic_name = $18, emergency_contact_name = $19,
            emergency_contact_phone = $20, vaccines_up_to_date = $21,
            sterilized = $22, photo_uri = COALESCE($23, photo_uri), updated_at = now()
        WHERE id = $1 AND account_id = $2
        RETURNING {PET_COLUMNS}
        "#
    ))
    .bind(id)
    .bind(account.id)
    .bind(payload.name.trim())
    .bind(&payload.species)
    .bind(&payload.breed)
    .bind(payload.birthday)
    .bind(payload.weight_kg)
    .bind(&payload.sex)
    .bind(&payload.size)
    .bind(&payload.physical_activity)
    .bind(&payload.behavior)
    .bind(&payload.behavior_description)
    .bind(payload.bites)
    .bind(&payload.allergies)
    .bind(&payload.medications)
    .bind(&payload.care_instructions)
    .bind(&payload.veterinarian_name)
    .bind(&payload.clinic_name)
    .bind(&payload.emergency_contact_name)
    .bind(&payload.emergency_contact_phone)
    .bind(payload.vaccines_up_to_date)
    .bind(payload.sterilized)
    .bind(&payload.photo_uri)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("mascota"))?;

    Ok(Json(to_pet(&row)))
}

async fn delete_pet(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Vec<PetView>>> {
    sqlx::query("DELETE FROM pets WHERE id = $1 AND account_id = $2")
        .bind(id)
        .bind(account.id)
        .execute(&state.db)
        .await?;

    list_pets(State(state), account).await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryQuery {
    pub from: Option<DateTime<Utc>>,
    pub to: Option<DateTime<Utc>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PetHistoryItem {
    pub booking_id: Uuid,
    pub reference_code: Option<String>,
    pub title: String,
    pub provider: String,
    pub status: String,
    pub date: DateTime<Utc>,
}

async fn pet_history(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(id): Path<Uuid>,
    Query(query): Query<HistoryQuery>,
) -> AppResult<Json<Vec<PetHistoryItem>>> {
    let rows = sqlx::query(
        r#"
        SELECT b.id, b.reference_code, b.service::text AS service,
               b.status::text AS status, b.scheduled_start_at,
               coalesce(p.display_name, '') AS provider_name
        FROM bookings b
        JOIN providers p ON p.id = b.provider_id
        WHERE b.pet_id = $1 AND b.client_account_id = $2
          AND ($3::timestamptz IS NULL OR b.scheduled_start_at >= $3)
          AND ($4::timestamptz IS NULL OR b.scheduled_start_at <= $4)
        ORDER BY b.scheduled_start_at DESC
        "#,
    )
    .bind(id)
    .bind(account.id)
    .bind(query.from)
    .bind(query.to)
    .fetch_all(&state.db)
    .await?;

    let items = rows
        .into_iter()
        .map(|row| PetHistoryItem {
            booking_id: row.get("id"),
            reference_code: row.get("reference_code"),
            title: row.get("service"),
            provider: row.get("provider_name"),
            status: row.get("status"),
            date: row.get("scheduled_start_at"),
        })
        .collect();

    Ok(Json(items))
}
