use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::AppError;

/// Duración corta: la app renueva con el refresh token.
const ACCESS_TOKEN_HOURS: i64 = 12;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    /// account_id
    pub sub: String,
    pub phone_verified: bool,
    pub exp: i64,
    pub iat: i64,
}

pub fn issue_token(
    account_id: Uuid,
    phone_verified: bool,
    secret: &str,
) -> Result<String, AppError> {
    let now = Utc::now();
    let claims = Claims {
        sub: account_id.to_string(),
        phone_verified,
        iat: now.timestamp(),
        exp: (now + Duration::hours(ACCESS_TOKEN_HOURS)).timestamp(),
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|err| AppError::Internal(format!("no se pudo firmar el token: {err}")))
}

pub fn verify_token(token: &str, secret: &str) -> Result<Claims, AppError> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::new(Algorithm::HS256),
    )
    .map(|data| data.claims)
    .map_err(|_| AppError::Unauthorized)
}

#[cfg(test)]
mod tests {
    use super::*;

    const SECRET: &str = "secreto-de-pruebas-con-longitud-suficiente";

    #[test]
    fn un_token_emitido_se_valida_correctamente() {
        let account_id = Uuid::new_v4();
        let token = issue_token(account_id, true, SECRET).unwrap();
        let claims = verify_token(&token, SECRET).unwrap();

        assert_eq!(claims.sub, account_id.to_string());
        assert!(claims.phone_verified);
    }

    #[test]
    fn un_token_firmado_con_otro_secreto_se_rechaza() {
        let token = issue_token(Uuid::new_v4(), false, SECRET).unwrap();
        assert!(verify_token(&token, "otro-secreto-distinto").is_err());
    }

    #[test]
    fn un_token_corrupto_se_rechaza() {
        assert!(verify_token("no-es-un-jwt", SECRET).is_err());
    }
}
