pub mod account;
pub mod addresses;
pub mod bookings;
pub mod coordination;
pub mod discovery;
pub mod finance;
pub mod marketplace;
pub mod orders;
pub mod pets;
pub mod provider;
pub mod snapshot;
pub mod store;
pub mod walks;

use axum::extract::State;
use axum::routing::get;
use axum::{Json, Router};
use serde::Serialize;

use crate::state::AppState;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HealthResponse {
    status: &'static str,
    database: &'static str,
    version: &'static str,
}

async fn health(State(state): State<AppState>) -> Json<HealthResponse> {
    let database = match sqlx::query("SELECT 1").fetch_one(&state.db).await {
        Ok(_) => "up",
        Err(_) => "down",
    };

    Json(HealthResponse {
        status: "ok",
        database,
        version: env!("CARGO_PKG_VERSION"),
    })
}

pub fn router(state: AppState) -> Router {
    let api = Router::new()
        .merge(account::router())
        .merge(addresses::router())
        .merge(pets::router())
        .merge(discovery::router())
        .merge(bookings::router())
        .merge(coordination::router())
        .merge(marketplace::router())
        .merge(orders::router())
        .merge(provider::router())
        .merge(store::router())
        .merge(walks::router())
        .merge(finance::router());

    Router::new()
        .route("/health", get(health))
        .nest("/api/v1", api)
        .with_state(state)
}
