use std::net::SocketAddr;

use axum::http::{HeaderValue, Method};
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod auth;
mod config;
mod db;
mod domain;
mod error;
mod routes;
mod state;

use config::Config;
use state::AppState;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Busca .env desde el directorio actual y, si no, junto al Cargo.toml,
    // para poder arrancar desde la raíz del repositorio.
    if dotenvy::dotenv().is_err() {
        dotenvy::from_path(concat!(env!("CARGO_MANIFEST_DIR"), "/.env")).ok();
    }

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "hupi_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = Config::from_env()?;
    tracing::info!(env = ?config.app_env, "configuración cargada");

    let pool = db::connect(&config.database_url).await?;
    tracing::info!("conectado a PostgreSQL");

    db::run_migrations(&pool).await?;
    tracing::info!("migraciones aplicadas");

    let mut cors = CorsLayer::new()
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PATCH,
            Method::PUT,
            Method::DELETE,
        ])
        .allow_headers([
            axum::http::header::AUTHORIZATION,
            axum::http::header::CONTENT_TYPE,
        ]);

    for origin in &config.cors_allowed_origins {
        if let Ok(value) = origin.parse::<HeaderValue>() {
            cors = cors.allow_origin(value);
        }
    }

    let port = config.port;
    let state = AppState { db: pool, config };

    let app = routes::router(state.clone())
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("escuchando en http://{addr}");

    axum::serve(listener, app).await?;
    Ok(())
}
