use axum::extract::{Path, Query, State};
use axum::routing::{delete, get};
use axum::{Json, Router};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use uuid::Uuid;

use crate::auth::CurrentAccount;
use crate::domain::search::{
    derive_provider_search_results, Coordinate, ProviderFilter, SearchableProvider,
    DEFAULT_PROVIDER_SEARCH_RADIUS_KM,
};
use crate::error::{AppError, AppResult};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/providers/search", get(search_providers))
        .route("/providers/{id}", get(provider_detail))
        .route("/providers/{id}/reviews", get(provider_reviews))
        .route("/favorites", get(list_favorites).post(add_favorite))
        .route("/favorites/{provider_id}", delete(remove_favorite))
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderView {
    /// Código legible (`provider-andres`) si existe; si no, el UUID.
    pub id: String,
    pub uuid: Uuid,
    pub name: String,
    pub initials: String,
    pub level: Option<String>,
    pub avatar_color: Option<String>,
    pub is_verified_by_hupi: bool,
    pub is_online: bool,
    pub average_response_time_minutes: Option<i32>,
    pub rating: Decimal,
    pub review_count: i32,
    pub completed_services: i32,
    pub experience_years: Option<i32>,
    pub zone: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub service_types: Vec<String>,
    pub service_prices: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub distance_km: Option<f64>,
}

/// Precios y servicios ofrecidos de un proveedor, en un solo viaje a la base.
async fn load_service_prices(
    db: &crate::db::Db,
    provider_ids: &[Uuid],
) -> AppResult<std::collections::HashMap<Uuid, (Vec<String>, serde_json::Map<String, serde_json::Value>)>>
{
    let rows = sqlx::query(
        r#"
        SELECT provider_id, service::text AS service, price, is_offered
        FROM provider_service_prices
        WHERE provider_id = ANY($1)
        "#,
    )
    .bind(provider_ids)
    .fetch_all(db)
    .await?;

    let mut map: std::collections::HashMap<
        Uuid,
        (Vec<String>, serde_json::Map<String, serde_json::Value>),
    > = std::collections::HashMap::new();

    for row in rows {
        let provider_id: Uuid = row.get("provider_id");
        let service: String = row.get("service");
        let price: Decimal = row.get("price");
        let is_offered: bool = row.get("is_offered");

        let entry = map.entry(provider_id).or_default();
        if is_offered {
            entry.0.push(service.clone());
        }
        entry.1.insert(
            service,
            serde_json::to_value(price).unwrap_or(serde_json::Value::Null),
        );
    }

    Ok(map)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchQuery {
    pub service: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub filter: Option<String>,
    pub radius_km: Option<f64>,
}

async fn search_providers(
    State(state): State<AppState>,
    _account: CurrentAccount,
    Query(query): Query<SearchQuery>,
) -> AppResult<Json<Vec<ProviderView>>> {
    let service = query.service.unwrap_or_else(|| "walk".to_string());

    let rows = sqlx::query(
        r#"
        SELECT p.id, p.code, p.display_name, p.initials, p.level, p.avatar_color,
               p.is_verified_by_hupi, p.is_online, p.average_response_time_minutes,
               p.rating, p.review_count, p.completed_services, p.experience_years,
               p.zone, p.latitude, p.longitude
        FROM providers p
        JOIN provider_service_prices sp
          ON sp.provider_id = p.id AND sp.service = $1::service_id AND sp.is_offered
        WHERE p.is_searchable
        "#,
    )
    .bind(&service)
    .fetch_all(&state.db)
    .await?;

    let ids: Vec<Uuid> = rows.iter().map(|row| row.get("id")).collect();
    let prices = load_service_prices(&state.db, &ids).await?;

    let mut views: Vec<ProviderView> = rows
        .into_iter()
        .map(|row| {
            let uuid: Uuid = row.get("id");
            let (service_types, service_prices) = prices.get(&uuid).cloned().unwrap_or_default();
            ProviderView {
                id: row
                    .get::<Option<String>, _>("code")
                    .unwrap_or_else(|| uuid.to_string()),
                uuid,
                name: row
                    .get::<Option<String>, _>("display_name")
                    .unwrap_or_default(),
                initials: row.get::<Option<String>, _>("initials").unwrap_or_default(),
                level: row.get("level"),
                avatar_color: row.get("avatar_color"),
                is_verified_by_hupi: row.get("is_verified_by_hupi"),
                is_online: row.get("is_online"),
                average_response_time_minutes: row.get("average_response_time_minutes"),
                rating: row.get("rating"),
                review_count: row.get("review_count"),
                completed_services: row.get("completed_services"),
                experience_years: row.get("experience_years"),
                zone: row.get("zone"),
                latitude: row.get("latitude"),
                longitude: row.get("longitude"),
                service_types,
                service_prices: serde_json::Value::Object(service_prices),
                distance_km: None,
            }
        })
        .collect();

    // Sin coordenadas no hay filtro geográfico: se ordena por rating.
    let Some(center) = query
        .latitude
        .zip(query.longitude)
        .map(|(latitude, longitude)| Coordinate {
            latitude,
            longitude,
        })
    else {
        views.sort_by_key(|view| std::cmp::Reverse(view.rating));
        return Ok(Json(views));
    };

    let filter = match query.filter.as_deref() {
        Some("closest") => ProviderFilter::Closest,
        Some("verified") => ProviderFilter::Verified,
        _ => ProviderFilter::BestRated,
    };

    let searchable: Vec<SearchableProvider> = views
        .iter()
        .filter_map(|view| {
            Some(SearchableProvider {
                id: view.uuid,
                coordinate: Coordinate {
                    latitude: view.latitude?,
                    longitude: view.longitude?,
                },
                is_verified_by_hupi: view.is_verified_by_hupi,
                rating: view.rating.to_string().parse().unwrap_or(0.0),
            })
        })
        .collect();

    let located = derive_provider_search_results(
        searchable,
        center,
        filter,
        query.radius_km.unwrap_or(DEFAULT_PROVIDER_SEARCH_RADIUS_KM),
    );

    let ordered = located
        .into_iter()
        .filter_map(|item| {
            let mut view = views
                .iter()
                .find(|v| v.uuid == item.provider.id)?
                .clone_view();
            view.distance_km = Some((item.distance_km * 10.0).round() / 10.0);
            Some(view)
        })
        .collect();

    Ok(Json(ordered))
}

impl ProviderView {
    fn clone_view(&self) -> ProviderView {
        ProviderView {
            id: self.id.clone(),
            uuid: self.uuid,
            name: self.name.clone(),
            initials: self.initials.clone(),
            level: self.level.clone(),
            avatar_color: self.avatar_color.clone(),
            is_verified_by_hupi: self.is_verified_by_hupi,
            is_online: self.is_online,
            average_response_time_minutes: self.average_response_time_minutes,
            rating: self.rating,
            review_count: self.review_count,
            completed_services: self.completed_services,
            experience_years: self.experience_years,
            zone: self.zone.clone(),
            latitude: self.latitude,
            longitude: self.longitude,
            service_types: self.service_types.clone(),
            service_prices: self.service_prices.clone(),
            distance_km: self.distance_km,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WalkPlanView {
    pub id: Uuid,
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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderDetailView {
    #[serde(flatten)]
    pub provider: ProviderView,
    pub walk_profile: Option<serde_json::Value>,
    pub plans: Vec<WalkPlanView>,
}

async fn provider_detail(
    State(state): State<AppState>,
    _account: CurrentAccount,
    Path(reference): Path<String>,
) -> AppResult<Json<ProviderDetailView>> {
    let row = sqlx::query(
        r#"
        SELECT id, code, display_name, initials, level, avatar_color, is_verified_by_hupi,
               is_online, average_response_time_minutes, rating, review_count,
               completed_services, experience_years, zone, latitude, longitude
        FROM providers WHERE code = $1 OR id::text = $1
        "#,
    )
    .bind(&reference)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("proveedor"))?;

    let id: Uuid = row.get("id");
    let prices = load_service_prices(&state.db, &[id]).await?;
    let (service_types, service_prices) = prices.get(&id).cloned().unwrap_or_default();

    let provider = ProviderView {
        id: row
            .get::<Option<String>, _>("code")
            .unwrap_or_else(|| id.to_string()),
        uuid: id,
        name: row
            .get::<Option<String>, _>("display_name")
            .unwrap_or_default(),
        initials: row.get::<Option<String>, _>("initials").unwrap_or_default(),
        level: row.get("level"),
        avatar_color: row.get("avatar_color"),
        is_verified_by_hupi: row.get("is_verified_by_hupi"),
        is_online: row.get("is_online"),
        average_response_time_minutes: row.get("average_response_time_minutes"),
        rating: row.get("rating"),
        review_count: row.get("review_count"),
        completed_services: row.get("completed_services"),
        experience_years: row.get("experience_years"),
        zone: row.get("zone"),
        latitude: row.get("latitude"),
        longitude: row.get("longitude"),
        service_types,
        service_prices: serde_json::Value::Object(service_prices),
        distance_km: None,
    };

    let profile_row = sqlx::query(
        r#"
        SELECT description, accepted_dog_sizes, accepted_dog_ages, maximum_dogs_per_walk,
               modalities, walk_types, requirements, hourly_rate, status::text AS status
        FROM provider_walk_profiles WHERE provider_id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?;

    let walk_profile = profile_row.map(|row| {
        serde_json::json!({
            "description": row.get::<String, _>("description"),
            "acceptedDogSizes": row.get::<Vec<String>, _>("accepted_dog_sizes"),
            "acceptedDogAges": row.get::<Vec<String>, _>("accepted_dog_ages"),
            "maximumDogsPerWalk": row.get::<i32, _>("maximum_dogs_per_walk"),
            "modalities": row.get::<Vec<String>, _>("modalities"),
            "walkTypes": row.get::<Vec<String>, _>("walk_types"),
            "requirements": row.get::<Vec<String>, _>("requirements"),
            "hourlyRate": row.get::<Option<Decimal>, _>("hourly_rate"),
            "status": row.get::<String, _>("status"),
        })
    });

    // La ficha pública solo expone planes aprobados y disponibles.
    let plan_rows = sqlx::query(
        r#"
        SELECT id, name, description, plan_type, duration_minutes, walk_count,
               pets_included, modality, price, includes, is_available, status::text AS status
        FROM provider_walk_plans
        WHERE provider_id = $1 AND status = 'approved' AND is_available
        ORDER BY price ASC
        "#,
    )
    .bind(id)
    .fetch_all(&state.db)
    .await?;

    let plans = plan_rows
        .into_iter()
        .map(|row| WalkPlanView {
            id: row.get("id"),
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
        })
        .collect();

    Ok(Json(ProviderDetailView {
        provider,
        walk_profile,
        plans,
    }))
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReviewView {
    pub booking_id: Uuid,
    pub rating: i16,
    pub tags: Vec<String>,
    pub comment: Option<String>,
    pub customer_display_name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

async fn provider_reviews(
    State(state): State<AppState>,
    _account: CurrentAccount,
    Path(reference): Path<String>,
) -> AppResult<Json<Vec<ReviewView>>> {
    let rows = sqlx::query(
        r#"
        SELECT r.booking_id, r.rating, r.tags, r.comment, r.created_at,
               a.first_name, a.last_name
        FROM booking_reviews r
        JOIN bookings b ON b.id = r.booking_id
        JOIN providers p ON p.id = b.provider_id
        JOIN accounts a ON a.id = b.client_account_id
        WHERE p.code = $1 OR p.id::text = $1
        ORDER BY r.created_at DESC
        "#,
    )
    .bind(&reference)
    .fetch_all(&state.db)
    .await?;

    let reviews = rows
        .into_iter()
        .map(|row| {
            let first: String = row.get("first_name");
            let last: String = row.get("last_name");
            ReviewView {
                booking_id: row.get("booking_id"),
                rating: row.get("rating"),
                tags: row.get("tags"),
                comment: row.get("comment"),
                customer_display_name: format!(
                    "{first} {}",
                    last.chars().next().map(|c| format!("{c}.")).unwrap_or_default()
                )
                .trim()
                .to_string(),
                created_at: row.get("created_at"),
            }
        })
        .collect();

    Ok(Json(reviews))
}

// --- Favoritos ------------------------------------------------------------

const DEFAULT_FAVORITE_LIST: &str = "Mis favoritos";

async fn default_favorite_list(state: &AppState, account_id: Uuid) -> AppResult<Uuid> {
    let existing: Option<Uuid> = sqlx::query(
        "SELECT id FROM favorite_provider_lists WHERE account_id = $1 ORDER BY created_at LIMIT 1",
    )
    .bind(account_id)
    .fetch_optional(&state.db)
    .await?
    .map(|row| row.get("id"));

    if let Some(id) = existing {
        return Ok(id);
    }

    let id: Uuid = sqlx::query(
        "INSERT INTO favorite_provider_lists (account_id, name) VALUES ($1, $2) RETURNING id",
    )
    .bind(account_id)
    .bind(DEFAULT_FAVORITE_LIST)
    .fetch_one(&state.db)
    .await?
    .get("id");

    Ok(id)
}

async fn list_favorites(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<Vec<String>>> {
    let rows = sqlx::query(
        r#"
        SELECT coalesce(p.code, p.id::text) AS reference
        FROM favorite_providers fp
        JOIN favorite_provider_lists fl ON fl.id = fp.list_id
        JOIN providers p ON p.id = fp.provider_id
        WHERE fl.account_id = $1
        "#,
    )
    .bind(account.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(rows.into_iter().map(|row| row.get("reference")).collect()))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FavoriteRequest {
    pub provider_id: String,
}

/// Resuelve el UUID a partir del código legible o del propio UUID.
async fn resolve_provider(state: &AppState, reference: &str) -> AppResult<Uuid> {
    sqlx::query("SELECT id FROM providers WHERE code = $1 OR id::text = $1")
        .bind(reference)
        .fetch_optional(&state.db)
        .await?
        .map(|row| row.get("id"))
        .ok_or(AppError::NotFound("proveedor"))
}

async fn add_favorite(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<FavoriteRequest>,
) -> AppResult<Json<Vec<String>>> {
    let list_id = default_favorite_list(&state, account.id).await?;
    let provider_uuid = resolve_provider(&state, &payload.provider_id).await?;

    sqlx::query(
        "INSERT INTO favorite_providers (list_id, provider_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    )
    .bind(list_id)
    .bind(provider_uuid)
    .execute(&state.db)
    .await?;

    list_favorites(State(state), account).await
}

async fn remove_favorite(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(reference): Path<String>,
) -> AppResult<Json<Vec<String>>> {
    let provider_uuid = resolve_provider(&state, &reference).await?;

    sqlx::query(
        r#"
        DELETE FROM favorite_providers fp
        USING favorite_provider_lists fl
        WHERE fp.list_id = fl.id AND fl.account_id = $1 AND fp.provider_id = $2
        "#,
    )
    .bind(account.id)
    .bind(provider_uuid)
    .execute(&state.db)
    .await?;

    list_favorites(State(state), account).await
}
