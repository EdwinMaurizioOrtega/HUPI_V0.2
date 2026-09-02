use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Serialize;

// Varias variantes las emitirán los handlers aún pendientes.
#[allow(dead_code)]
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("no autorizado")]
    Unauthorized,

    #[error("prohibido")]
    Forbidden,

    #[error("{0} no encontrado")]
    NotFound(&'static str),

    #[error("{0}")]
    Validation(String),

    #[error("conflicto: {0}")]
    Conflict(String),

    #[error("demasiados intentos")]
    TooManyRequests,

    #[error("capacidad aún no implementada")]
    NotImplemented,

    #[error(transparent)]
    Database(#[from] sqlx::Error),

    #[error("error interno")]
    Internal(String),
}

#[derive(Serialize)]
struct ErrorBody {
    error: ErrorDetail,
}

#[derive(Serialize)]
struct ErrorDetail {
    code: &'static str,
    message: String,
}

impl AppError {
    fn parts(&self) -> (StatusCode, &'static str, String) {
        match self {
            AppError::Unauthorized => (
                StatusCode::UNAUTHORIZED,
                "unauthorized",
                self.to_string(),
            ),
            AppError::Forbidden => (StatusCode::FORBIDDEN, "forbidden", self.to_string()),
            AppError::NotFound(_) => (StatusCode::NOT_FOUND, "not_found", self.to_string()),
            AppError::Validation(_) => (
                StatusCode::UNPROCESSABLE_ENTITY,
                "validation_error",
                self.to_string(),
            ),
            AppError::Conflict(_) => (StatusCode::CONFLICT, "conflict", self.to_string()),
            AppError::TooManyRequests => (
                StatusCode::TOO_MANY_REQUESTS,
                "too_many_requests",
                self.to_string(),
            ),
            AppError::NotImplemented => (
                StatusCode::NOT_IMPLEMENTED,
                "not_implemented",
                self.to_string(),
            ),
            // Los detalles internos se registran, nunca se exponen al cliente.
            AppError::Database(err) => {
                tracing::error!(error = %err, "error de base de datos");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "internal_error",
                    "error interno".to_string(),
                )
            }
            AppError::Internal(detail) => {
                tracing::error!(error = %detail, "error interno");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "internal_error",
                    "error interno".to_string(),
                )
            }
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, message) = self.parts();
        let body = ErrorBody {
            error: ErrorDetail { code, message },
        };
        (status, Json(body)).into_response()
    }
}

pub type AppResult<T> = Result<T, AppError>;
