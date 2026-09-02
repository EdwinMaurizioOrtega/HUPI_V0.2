use std::env;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AppEnv {
    Development,
    Production,
}

impl AppEnv {
    pub fn is_development(&self) -> bool {
        matches!(self, AppEnv::Development)
    }
}

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub app_env: AppEnv,
    pub port: u16,
    pub cors_allowed_origins: Vec<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("falta la variable de entorno {0}")]
    Missing(&'static str),
    #[error("la variable {0} tiene un valor inválido: {1}")]
    Invalid(&'static str, String),
}

impl Config {
    pub fn from_env() -> Result<Self, ConfigError> {
        let database_url =
            env::var("DATABASE_URL").map_err(|_| ConfigError::Missing("DATABASE_URL"))?;

        let jwt_secret = env::var("JWT_SECRET").map_err(|_| ConfigError::Missing("JWT_SECRET"))?;

        let app_env = match env::var("APP_ENV").as_deref() {
            Ok("production") => AppEnv::Production,
            Ok("development") | Err(_) => AppEnv::Development,
            Ok(other) => {
                return Err(ConfigError::Invalid("APP_ENV", other.to_string()));
            }
        };

        // Un secreto corto hace el JWT trivial de forzar por fuerza bruta.
        if app_env == AppEnv::Production && jwt_secret.len() < 32 {
            return Err(ConfigError::Invalid(
                "JWT_SECRET",
                "debe tener al menos 32 caracteres en producción".to_string(),
            ));
        }

        let port = match env::var("PORT") {
            Ok(value) => value
                .parse::<u16>()
                .map_err(|_| ConfigError::Invalid("PORT", value))?,
            Err(_) => 8787,
        };

        let cors_allowed_origins = env::var("CORS_ALLOWED_ORIGINS")
            .unwrap_or_else(|_| "http://localhost:8081".to_string())
            .split(',')
            .map(|origin| origin.trim().to_string())
            .filter(|origin| !origin.is_empty())
            .collect();

        Ok(Config {
            database_url,
            jwt_secret,
            app_env,
            port,
            cors_allowed_origins,
        })
    }
}
