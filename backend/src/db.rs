use sqlx::postgres::{PgPool, PgPoolOptions};
use std::time::Duration;

pub type Db = PgPool;

pub async fn connect(database_url: &str) -> Result<Db, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(10)
        .acquire_timeout(Duration::from_secs(5))
        .connect(database_url)
        .await
}

pub async fn run_migrations(pool: &Db) -> Result<(), sqlx::migrate::MigrateError> {
    sqlx::migrate!("./migrations").run(pool).await
}
