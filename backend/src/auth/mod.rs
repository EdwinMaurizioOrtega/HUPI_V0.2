// `VerifiedAccount` y parte de los helpers los consumirán los handlers pendientes.
#![allow(dead_code)]

pub mod jwt;
pub mod otp;
pub mod password;

use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use uuid::Uuid;

use crate::error::AppError;
use crate::state::AppState;

/// Actor autenticado, extraído del header `Authorization: Bearer <token>`.
#[derive(Debug, Clone)]
pub struct CurrentAccount {
    pub id: Uuid,
    pub phone_verified: bool,
}

impl FromRequestParts<AppState> for CurrentAccount {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let token = parts
            .headers
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .and_then(|value| value.strip_prefix("Bearer "))
            .ok_or(AppError::Unauthorized)?;

        let claims = jwt::verify_token(token.trim(), &state.config.jwt_secret)?;
        let id = Uuid::parse_str(&claims.sub).map_err(|_| AppError::Unauthorized)?;

        Ok(CurrentAccount {
            id,
            phone_verified: claims.phone_verified,
        })
    }
}

/// Cuenta con el teléfono ya verificado. El resto de la API lo exige.
#[derive(Debug, Clone)]
pub struct VerifiedAccount(pub CurrentAccount);

impl FromRequestParts<AppState> for VerifiedAccount {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let account = CurrentAccount::from_request_parts(parts, state).await?;

        if !account.phone_verified {
            return Err(AppError::Forbidden);
        }
        Ok(VerifiedAccount(account))
    }
}
