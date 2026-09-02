use axum::extract::{Path, State};
use axum::routing::{get, post, put};
use axum::{Json, Router};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use uuid::Uuid;

use crate::auth::CurrentAccount;
use crate::domain::walk_metrics::{
    calculate_provider_walk_metrics, ProviderWalkMetrics, WalkMetricRecord,
};
use crate::error::{AppError, AppResult};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/provider/walks/profile", get(get_profile).put(save_profile))
        .route("/provider/walks/profile/submit", post(submit_profile))
        .route("/provider/walks/rate", put(save_rate))
        .route("/provider/walks/plans", get(list_plans).post(create_plan))
        .route("/provider/walks/plans/{id}", put(update_plan))
        .route("/provider/walks/plans/{id}/submit", post(submit_plan))
        .route("/provider/walks/metrics", get(metrics))
        .route("/provider/walks/terms", get(terms))
}

/// Id del proveedor asociado a la cuenta autenticada.
async fn provider_id(state: &AppState, account_id: Uuid) -> AppResult<Uuid> {
    sqlx::query("SELECT id FROM providers WHERE account_id = $1")
        .bind(account_id)
        .fetch_optional(&state.db)
        .await?
        .map(|row| row.get("id"))
        .ok_or(AppError::Forbidden)
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WalkProfile {
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub accepted_dog_sizes: Vec<String>,
    #[serde(default)]
    pub accepted_dog_ages: Vec<String>,
    #[serde(default = "one")]
    pub maximum_dogs_per_walk: i32,
    #[serde(default)]
    pub modalities: Vec<String>,
    #[serde(default)]
    pub walk_types: Vec<String>,
    #[serde(default)]
    pub requirements: Vec<String>,
    pub hourly_rate: Option<Decimal>,
    #[serde(default)]
    pub status: String,
}

fn one() -> i32 {
    1
}

async fn get_profile(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<Option<WalkProfile>>> {
    let id = provider_id(&state, account.id).await?;

    let profile = sqlx::query(
        r#"
        SELECT description, accepted_dog_sizes, accepted_dog_ages, maximum_dogs_per_walk,
               modalities, walk_types, requirements, hourly_rate, status::text AS status
        FROM provider_walk_profiles WHERE provider_id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .map(|row| WalkProfile {
        description: row.get("description"),
        accepted_dog_sizes: row.get("accepted_dog_sizes"),
        accepted_dog_ages: row.get("accepted_dog_ages"),
        maximum_dogs_per_walk: row.get("maximum_dogs_per_walk"),
        modalities: row.get("modalities"),
        walk_types: row.get("walk_types"),
        requirements: row.get("requirements"),
        hourly_rate: row.get("hourly_rate"),
        status: row.get("status"),
    });

    Ok(Json(profile))
}

async fn save_profile(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<WalkProfile>,
) -> AppResult<Json<Option<WalkProfile>>> {
    let id = provider_id(&state, account.id).await?;

    // La descripción del prototipo se limita a 150 caracteres.
    let description: String = payload
        .description
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .chars()
        .take(150)
        .collect();

    if !(1..=8).contains(&payload.maximum_dogs_per_walk) {
        return Err(AppError::Validation(
            "el máximo de perros por paseo debe estar entre 1 y 8".to_string(),
        ));
    }

    sqlx::query(
        r#"
        INSERT INTO provider_walk_profiles (
            provider_id, description, accepted_dog_sizes, accepted_dog_ages,
            maximum_dogs_per_walk, modalities, walk_types, requirements,
            hourly_rate, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
        ON CONFLICT (provider_id) DO UPDATE SET
            description = EXCLUDED.description,
            accepted_dog_sizes = EXCLUDED.accepted_dog_sizes,
            accepted_dog_ages = EXCLUDED.accepted_dog_ages,
            maximum_dogs_per_walk = EXCLUDED.maximum_dogs_per_walk,
            modalities = EXCLUDED.modalities,
            walk_types = EXCLUDED.walk_types,
            requirements = EXCLUDED.requirements,
            hourly_rate = COALESCE(EXCLUDED.hourly_rate, provider_walk_profiles.hourly_rate),
            status = 'draft',
            updated_at = now()
        "#,
    )
    .bind(id)
    .bind(&description)
    .bind(&payload.accepted_dog_sizes)
    .bind(&payload.accepted_dog_ages)
    .bind(payload.maximum_dogs_per_walk)
    .bind(&payload.modalities)
    .bind(&payload.walk_types)
    .bind(&payload.requirements)
    .bind(payload.hourly_rate)
    .execute(&state.db)
    .await?;

    get_profile(State(state), account).await
}

async fn submit_profile(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<Option<WalkProfile>>> {
    let id = provider_id(&state, account.id).await?;

    let mut tx = state.db.begin().await?;

    sqlx::query(
        r#"
        UPDATE provider_walk_profiles SET status = 'pending_approval', updated_at = now()
        WHERE provider_id = $1 AND status IN ('draft', 'changes_requested')
        "#,
    )
    .bind(id)
    .execute(&mut *tx)
    .await?;

    // Enviar la ficha arrastra sus planes en borrador.
    sqlx::query(
        r#"
        UPDATE provider_walk_plans SET status = 'pending_approval', updated_at = now()
        WHERE provider_id = $1 AND status IN ('draft', 'changes_requested')
        "#,
    )
    .bind(id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    get_profile(State(state), account).await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RateRequest {
    pub service: Option<String>,
    pub price: Decimal,
}

async fn save_rate(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<RateRequest>,
) -> AppResult<Json<serde_json::Value>> {
    if payload.price <= Decimal::ZERO {
        return Err(AppError::Validation(
            "la tarifa debe ser mayor que cero".to_string(),
        ));
    }

    let id = provider_id(&state, account.id).await?;
    let service = payload.service.unwrap_or_else(|| "walk".to_string());

    sqlx::query(
        r#"
        INSERT INTO provider_service_prices (provider_id, service, price)
        VALUES ($1, $2::service_id, $3)
        ON CONFLICT (provider_id, service) DO UPDATE SET
            price = EXCLUDED.price, updated_at = now()
        "#,
    )
    .bind(id)
    .bind(&service)
    .bind(payload.price)
    .execute(&state.db)
    .await?;

    if service == "walk" {
        sqlx::query(
            "UPDATE provider_walk_profiles SET hourly_rate = $2, updated_at = now() WHERE provider_id = $1",
        )
        .bind(id)
        .bind(payload.price)
        .execute(&state.db)
        .await?;
    }

    Ok(Json(
        serde_json::json!({ "service": service, "price": payload.price }),
    ))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanView {
    /// Código estable si la app lo fijó; si no, el UUID.
    pub id: String,
    pub uuid: Uuid,
    pub version: i32,
    pub name: String,
    pub description: String,
    pub plan_type: String,
    pub duration_minutes: i32,
    pub walk_count: i32,
    pub pets_included: i32,
    pub modality: String,
    pub price: Decimal,
    pub includes: Vec<String>,
    pub is_available: bool,
    pub status: String,
}

fn to_plan(row: &sqlx::postgres::PgRow) -> PlanView {
    let uuid: Uuid = row.get("id");
    let code: Option<String> = row.get("code");

    PlanView {
        id: code.unwrap_or_else(|| uuid.to_string()),
        uuid,
        version: row.get("version"),
        name: row.get("name"),
        description: row.get("description"),
        plan_type: row.get("plan_type"),
        duration_minutes: row.get("duration_minutes"),
        walk_count: row.get("walk_count"),
        pets_included: row.get("pets_included"),
        modality: row.get("modality"),
        price: row.get("price"),
        includes: row.get("includes"),
        is_available: row.get("is_available"),
        status: row.get("status"),
    }
}

const PLAN_COLUMNS: &str = r#"
    id, code, version, name, description, plan_type, duration_minutes, walk_count,
    pets_included, modality, price, includes, is_available, status::text AS status
"#;

/// Resuelve un plan por código estable o por UUID.
async fn resolve_plan_id(
    state: &AppState,
    provider: Uuid,
    reference: &str,
) -> AppResult<Uuid> {
    sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM provider_walk_plans
         WHERE provider_id = $1 AND status <> 'superseded'
           AND (code = $2 OR id::text = $2)
         ORDER BY version DESC LIMIT 1",
    )
    .bind(provider)
    .bind(reference)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("plan"))
}

async fn list_plans(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<Vec<PlanView>>> {
    let id = provider_id(&state, account.id).await?;

    let rows = sqlx::query(&format!(
        "SELECT {PLAN_COLUMNS} FROM provider_walk_plans
         WHERE provider_id = $1 AND status <> 'superseded'
         ORDER BY created_at"
    ))
    .bind(id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(rows.iter().map(to_plan).collect()))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanInput {
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default = "individual")]
    pub plan_type: String,
    pub duration_minutes: i32,
    #[serde(default = "one")]
    pub walk_count: i32,
    #[serde(default = "one")]
    pub pets_included: i32,
    #[serde(default = "individual")]
    pub modality: String,
    pub price: Decimal,
    #[serde(default)]
    pub includes: Vec<String>,
    /// Identificador propio de la app, para poder editar el plan después.
    #[serde(default)]
    pub code: Option<String>,
}

fn individual() -> String {
    "individual".to_string()
}

fn validate_plan(input: &PlanInput) -> AppResult<()> {
    if input.name.trim().is_empty() {
        return Err(AppError::Validation("el plan necesita un nombre".into()));
    }
    if input.duration_minutes <= 0 || input.walk_count <= 0 || input.pets_included <= 0 {
        return Err(AppError::Validation(
            "duración, número de paseos y mascotas deben ser mayores que cero".into(),
        ));
    }
    if input.price <= Decimal::ZERO {
        return Err(AppError::Validation(
            "el precio debe ser mayor que cero".into(),
        ));
    }
    if input.includes.is_empty() {
        return Err(AppError::Validation(
            "el plan debe indicar qué incluye".into(),
        ));
    }
    Ok(())
}

async fn create_plan(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<PlanInput>,
) -> AppResult<Json<PlanView>> {
    validate_plan(&payload)?;
    let id = provider_id(&state, account.id).await?;
    let plan_id = Uuid::new_v4();

    let row = sqlx::query(&format!(
        r#"
        INSERT INTO provider_walk_plans (
            id, provider_id, version_root_id, version, name, description, plan_type,
            duration_minutes, walk_count, pets_included, modality, price, includes, status, code
        ) VALUES ($1, $2, $1, 1, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft', $12)
        RETURNING {PLAN_COLUMNS}
        "#
    ))
    .bind(plan_id)
    .bind(id)
    .bind(payload.name.trim())
    .bind(&payload.description)
    .bind(&payload.plan_type)
    .bind(payload.duration_minutes)
    .bind(payload.walk_count)
    .bind(payload.pets_included)
    .bind(&payload.modality)
    .bind(payload.price)
    .bind(&payload.includes)
    .bind(payload.code.as_deref())
    .fetch_one(&state.db)
    .await?;

    Ok(Json(to_plan(&row)))
}

async fn update_plan(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(reference): Path<String>,
    Json(payload): Json<PlanInput>,
) -> AppResult<Json<PlanView>> {
    validate_plan(&payload)?;
    let id = provider_id(&state, account.id).await?;
    let plan_id = resolve_plan_id(&state, id, &reference).await?;

    let current = sqlx::query(
        "SELECT status::text AS status, version, version_root_id, code
         FROM provider_walk_plans WHERE id = $1 AND provider_id = $2",
    )
    .bind(plan_id)
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("plan"))?;

    let status: String = current.get("status");

    // Editar un plan aprobado crea una versión nueva: la vigente sigue publicada.
    if status == "approved" {
        let version: i32 = current.get("version");
        let root: Uuid = current.get("version_root_id");
        let code: Option<String> = current.get("code");

        // El código viaja a la versión nueva: solo una queda no superseded.
        sqlx::query("UPDATE provider_walk_plans SET code = NULL WHERE id = $1")
            .bind(plan_id)
            .execute(&state.db)
            .await?;

        let row = sqlx::query(&format!(
            r#"
            INSERT INTO provider_walk_plans (
                provider_id, version_root_id, version, replaces_plan_id, name, description,
                plan_type, duration_minutes, walk_count, pets_included, modality,
                price, includes, status, code
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'draft', $14)
            RETURNING {PLAN_COLUMNS}
            "#
        ))
        .bind(id)
        .bind(root)
        .bind(version + 1)
        .bind(plan_id)
        .bind(payload.name.trim())
        .bind(&payload.description)
        .bind(&payload.plan_type)
        .bind(payload.duration_minutes)
        .bind(payload.walk_count)
        .bind(payload.pets_included)
        .bind(&payload.modality)
        .bind(payload.price)
        .bind(&payload.includes)
        .bind(code.as_deref())
        .fetch_one(&state.db)
        .await?;

        return Ok(Json(to_plan(&row)));
    }

    let row = sqlx::query(&format!(
        r#"
        UPDATE provider_walk_plans SET
            name = $3, description = $4, plan_type = $5, duration_minutes = $6,
            walk_count = $7, pets_included = $8, modality = $9, price = $10,
            includes = $11, status = 'draft', updated_at = now()
        WHERE id = $1 AND provider_id = $2
        RETURNING {PLAN_COLUMNS}
        "#
    ))
    .bind(plan_id)
    .bind(id)
    .bind(payload.name.trim())
    .bind(&payload.description)
    .bind(&payload.plan_type)
    .bind(payload.duration_minutes)
    .bind(payload.walk_count)
    .bind(payload.pets_included)
    .bind(&payload.modality)
    .bind(payload.price)
    .bind(&payload.includes)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(to_plan(&row)))
}

async fn submit_plan(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(reference): Path<String>,
) -> AppResult<Json<PlanView>> {
    let id = provider_id(&state, account.id).await?;
    let plan_id = resolve_plan_id(&state, id, &reference).await?;

    let row = sqlx::query(&format!(
        r#"
        UPDATE provider_walk_plans SET status = 'pending_approval', updated_at = now()
        WHERE id = $1 AND provider_id = $2 AND status IN ('draft', 'changes_requested')
        RETURNING {PLAN_COLUMNS}
        "#
    ))
    .bind(plan_id)
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::Conflict(
        "solo se envían planes en borrador o con cambios solicitados".to_string(),
    ))?;

    Ok(Json(to_plan(&row)))
}

async fn metrics(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<ProviderWalkMetrics>> {
    let id = provider_id(&state, account.id).await?;

    let rows = sqlx::query(
        r#"
        SELECT scheduled_start_at, started_at, status::text AS status,
               cancelled_by::text AS cancelled_by, provider_payout
        FROM bookings WHERE provider_id = $1
        "#,
    )
    .bind(id)
    .fetch_all(&state.db)
    .await?;

    let records: Vec<WalkMetricRecord> = rows
        .into_iter()
        .map(|row| {
            let status: String = row.get("status");
            let cancelled_by: Option<String> = row.get("cancelled_by");
            WalkMetricRecord {
                scheduled_start_at: row.get("scheduled_start_at"),
                started_at: row.get("started_at"),
                completed: status == "completed",
                cancelled_by_provider: cancelled_by.as_deref() == Some("provider"),
                provider_payout: row.get("provider_payout"),
            }
        })
        .collect();

    Ok(Json(calculate_provider_walk_metrics(&records)))
}

async fn terms(State(state): State<AppState>, _account: CurrentAccount) -> AppResult<Json<serde_json::Value>> {
    let row = sqlx::query(
        r#"
        SELECT id, version, effective_date, minimum_cancellation_hours,
               late_cancellation_penalty_percent, maximum_waiting_minutes,
               maximum_delay_minutes, rain_treatment
        FROM provider_terms_versions
        WHERE status = 'approved'
        ORDER BY version DESC LIMIT 1
        "#,
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("términos"))?;

    Ok(Json(serde_json::json!({
        "id": row.get::<String, _>("id"),
        "version": row.get::<i32, _>("version"),
        "effectiveDate": row.get::<chrono::NaiveDate, _>("effective_date"),
        "minimumCancellationHours": row.get::<Option<i32>, _>("minimum_cancellation_hours"),
        "lateCancellationPenaltyPercent": row.get::<Option<i32>, _>("late_cancellation_penalty_percent"),
        "maximumWaitingMinutes": row.get::<Option<i32>, _>("maximum_waiting_minutes"),
        "maximumDelayMinutes": row.get::<Option<i32>, _>("maximum_delay_minutes"),
        "rainTreatment": row.get::<Option<String>, _>("rain_treatment"),
    })))
}
