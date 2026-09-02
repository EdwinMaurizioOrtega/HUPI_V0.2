use axum::extract::State;
use axum::routing::{get, post, put};
use axum::{Json, Router};
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use sqlx::Row;
use uuid::Uuid;

use crate::auth::{jwt, otp, password as password_hashing, CurrentAccount};
use crate::domain::masking;
use crate::domain::profile::{normalize_profile, profile_field_errors, ProfileInput};
use crate::error::{AppError, AppResult};
use crate::routes::snapshot::{load_snapshot, AccountSnapshot};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
        .route("/auth/verify-otp", post(verify_otp))
        .route("/auth/resend-otp", post(resend_otp))
        .route("/auth/recovery", post(request_recovery))
        .route("/auth/logout", post(logout))
        .route("/account", get(get_account))
        .route("/account/profile", put(update_profile))
        .route("/account/preferences", put(update_preferences))
        .route("/account/onboarding/complete", post(complete_onboarding))
}

// --- Registro y login -----------------------------------------------------

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterRequest {
    pub phone: String,
    pub consent: bool,
    pub password: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VerificationPendingResponse {
    pub pending_phone: String,
    pub masked_phone: String,
    pub verification_channel: String,
    pub auth_mode: String,
    /// Solo en desarrollo, para poder probar sin SMS real.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dev_code: Option<String>,
}

fn normalize_phone(raw: &str) -> String {
    raw.chars().filter(char::is_ascii_digit).collect()
}

/// Busca la cuenta por los últimos 9 dígitos: el mismo número puede llegar
/// con o sin prefijo de país (`991234567` y `593991234567` son la misma persona).
async fn find_account_by_phone(state: &AppState, phone: &str) -> AppResult<Option<Uuid>> {
    Ok(sqlx::query("SELECT id FROM accounts WHERE right(phone, 9) = right($1, 9)")
        .bind(phone)
        .fetch_optional(&state.db)
        .await?
        .map(|row| row.get("id")))
}

async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> AppResult<Json<VerificationPendingResponse>> {
    let phone = normalize_phone(&payload.phone);

    if phone.len() < 8 {
        return Err(AppError::Validation(
            "el teléfono debe tener al menos 8 dígitos".to_string(),
        ));
    }
    if !payload.consent {
        return Err(AppError::Validation(
            "se requiere aceptar los términos".to_string(),
        ));
    }

    let password_hash = match payload.password.as_deref() {
        Some(value) if !value.is_empty() => {
            if value.chars().count() < 8 {
                return Err(AppError::Validation(
                    "la contraseña debe tener al menos 8 caracteres".to_string(),
                ));
            }
            Some(password_hashing::hash_password(value)?)
        }
        _ => None,
    };

    let existing = find_account_by_phone(&state, &phone).await?;

    let account_id: Uuid = match existing {
        Some(id) => {
            if password_hash.is_some() {
                sqlx::query(
                    "UPDATE accounts SET password_hash = $2, updated_at = now() WHERE id = $1",
                )
                .bind(id)
                .bind(&password_hash)
                .execute(&state.db)
                .await?;
            }
            id
        }
        None => sqlx::query(
            "INSERT INTO accounts (phone, password_hash) VALUES ($1, $2) RETURNING id",
        )
        .bind(&phone)
        .bind(&password_hash)
        .fetch_one(&state.db)
        .await?
        .get("id"),
    };

    sqlx::query(
        "INSERT INTO account_preferences (account_id) VALUES ($1) ON CONFLICT DO NOTHING",
    )
    .bind(account_id)
    .execute(&state.db)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO account_consents (account_id, consent_key, consent_version)
        VALUES ($1, 'terms_and_privacy', 'v1')
        ON CONFLICT DO NOTHING
        "#,
    )
    .bind(account_id)
    .execute(&state.db)
    .await?;

    issue_otp(&state, Some(account_id), &phone, "sms", "register").await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginRequest {
    pub phone: String,
}

async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> AppResult<Json<VerificationPendingResponse>> {
    let phone = normalize_phone(&payload.phone);

    if phone.len() < 8 {
        return Err(AppError::Validation(
            "el teléfono debe tener al menos 8 dígitos".to_string(),
        ));
    }

    let account_id: Option<Uuid> = find_account_by_phone(&state, &phone).await?;

    // Se responde igual exista o no la cuenta, para no permitir enumeración.
    issue_otp(&state, account_id, &phone, "sms", "login").await
}

async fn issue_otp(
    state: &AppState,
    account_id: Option<Uuid>,
    phone: &str,
    channel: &str,
    auth_mode: &str,
) -> AppResult<Json<VerificationPendingResponse>> {
    let is_development = state.config.app_env.is_development();
    let code = otp::generate_code(is_development);
    let code_hash = password_hashing::hash_password(&code)?;
    let expires_at = Utc::now() + Duration::minutes(otp::OTP_EXPIRY_MINUTES);

    sqlx::query(
        r#"
        INSERT INTO otp_codes (account_id, phone, code_hash, channel, max_attempts, expires_at)
        VALUES ($1, $2, $3, $4::verification_channel, $5, $6)
        "#,
    )
    .bind(account_id)
    .bind(phone)
    .bind(&code_hash)
    .bind(channel)
    .bind(otp::OTP_MAX_ATTEMPTS)
    .bind(expires_at)
    .execute(&state.db)
    .await?;

    Ok(Json(VerificationPendingResponse {
        masked_phone: masking::mask_phone(phone),
        pending_phone: phone.to_string(),
        verification_channel: channel.to_string(),
        auth_mode: auth_mode.to_string(),
        dev_code: is_development.then_some(code),
    }))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResendOtpRequest {
    pub phone: String,
}

async fn resend_otp(
    State(state): State<AppState>,
    Json(payload): Json<ResendOtpRequest>,
) -> AppResult<Json<VerificationPendingResponse>> {
    let phone = normalize_phone(&payload.phone);
    let account_id: Option<Uuid> = find_account_by_phone(&state, &phone).await?;

    issue_otp(&state, account_id, &phone, "sms", "login").await
}

// --- Verificación del código ----------------------------------------------

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VerifyOtpRequest {
    pub phone: String,
    pub code: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthenticatedResponse {
    pub token: String,
    pub snapshot: AccountSnapshot,
}

async fn verify_otp(
    State(state): State<AppState>,
    Json(payload): Json<VerifyOtpRequest>,
) -> AppResult<Json<AuthenticatedResponse>> {
    let phone = normalize_phone(&payload.phone);

    // Los números de prueba entran con el código fijo sin necesidad de SMS previo.
    let uses_fixed_code = otp::accepts_fixed_code(
        state.config.app_env.is_development(),
        &phone,
        &payload.code,
    );

    let pending_otp_id: Option<Uuid> = if uses_fixed_code {
        None
    } else {
        let row = sqlx::query(
            r#"
            SELECT id, account_id, code_hash, attempts, max_attempts, expires_at, consumed_at
            FROM otp_codes
            WHERE phone = $1
            ORDER BY created_at DESC
            LIMIT 1
            "#,
        )
        .bind(&phone)
        .fetch_optional(&state.db)
        .await?
        .ok_or(AppError::Unauthorized)?;

        let otp_id: Uuid = row.get("id");
        let attempts: i32 = row.get("attempts");
        let max_attempts: i32 = row.get("max_attempts");
        let consumed_at: Option<chrono::DateTime<Utc>> = row.get("consumed_at");
        let expires_at: chrono::DateTime<Utc> = row.get("expires_at");
        let code_hash: String = row.get("code_hash");

        if consumed_at.is_some() || expires_at < Utc::now() {
            return Err(AppError::Unauthorized);
        }
        if attempts >= max_attempts {
            return Err(AppError::TooManyRequests);
        }

        if !password_hashing::verify_password(payload.code.trim(), &code_hash) {
            sqlx::query("UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1")
                .bind(otp_id)
                .execute(&state.db)
                .await?;
            return Err(AppError::Unauthorized);
        }

        Some(otp_id)
    };

    // El código es válido: se consume y la cuenta queda verificada.
    let mut tx = state.db.begin().await?;

    if let Some(otp_id) = pending_otp_id {
        sqlx::query("UPDATE otp_codes SET consumed_at = now() WHERE id = $1")
            .bind(otp_id)
            .execute(&mut *tx)
            .await?;
    }

    // Si el número ya existe (con o sin prefijo país) se reutiliza esa cuenta.
    let existing = find_account_by_phone(&state, &phone).await?;

    let account_id: Uuid = match existing {
        Some(id) => {
            sqlx::query(
                "UPDATE accounts SET phone_verified = TRUE, updated_at = now() WHERE id = $1",
            )
            .bind(id)
            .execute(&mut *tx)
            .await?;
            id
        }
        None => sqlx::query(
            "INSERT INTO accounts (phone, phone_verified) VALUES ($1, TRUE) RETURNING id",
        )
        .bind(&phone)
        .fetch_one(&mut *tx)
        .await?
        .get("id"),
    };

    sqlx::query(
        "INSERT INTO account_preferences (account_id) VALUES ($1) ON CONFLICT DO NOTHING",
    )
    .bind(account_id)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO audit_log (actor_account_id, actor_role, action, entity_type, entity_id)
        VALUES ($1, 'client', 'phone_verified', 'account', $1)
        "#,
    )
    .bind(account_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    let token = jwt::issue_token(account_id, true, &state.config.jwt_secret)?;
    let snapshot = load_snapshot(&state.db, account_id).await?;

    Ok(Json(AuthenticatedResponse { token, snapshot }))
}

// --- Recuperación de acceso -----------------------------------------------

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryRequest {
    pub channel: String,
    pub email: Option<String>,
    pub phone: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryResponse {
    /// Mensaje idéntico exista o no la cuenta.
    pub message: String,
    pub masked_target: String,
}

async fn request_recovery(
    State(state): State<AppState>,
    Json(payload): Json<RecoveryRequest>,
) -> AppResult<Json<RecoveryResponse>> {
    let masked_target = match payload.channel.as_str() {
        "email" => {
            let email = payload.email.unwrap_or_default();
            if !masking::is_valid_recovery_email(&email) {
                return Err(AppError::Validation(
                    "el correo no tiene un formato válido".to_string(),
                ));
            }
            let normalized = masking::normalize_recovery_email(&email);

            // Se genera el OTP solo si la cuenta existe, pero la respuesta no lo revela.
            if let Some(row) = sqlx::query("SELECT id, phone FROM accounts WHERE email = $1")
                .bind(&normalized)
                .fetch_optional(&state.db)
                .await?
            {
                let account_id: Uuid = row.get("id");
                let phone: String = row.get("phone");
                let _ = issue_otp(&state, Some(account_id), &phone, "email", "login").await?;
            }

            masking::mask_email(&normalized)
        }
        _ => {
            let phone = normalize_phone(&payload.phone.unwrap_or_default());
            if phone.len() < 8 {
                return Err(AppError::Validation(
                    "el teléfono debe tener al menos 8 dígitos".to_string(),
                ));
            }

            if let Some(row) = sqlx::query("SELECT id FROM accounts WHERE phone = $1")
                .bind(&phone)
                .fetch_optional(&state.db)
                .await?
            {
                let account_id: Uuid = row.get("id");
                let _ = issue_otp(&state, Some(account_id), &phone, "sms", "login").await?;
            }

            masking::mask_phone(&phone)
        }
    };

    Ok(Json(RecoveryResponse {
        message: "Si la cuenta existe, enviamos las instrucciones de recuperación.".to_string(),
        masked_target,
    }))
}

// --- Sesión y perfil ------------------------------------------------------

async fn logout(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<serde_json::Value>> {
    sqlx::query(
        "UPDATE sessions SET revoked_at = now() WHERE account_id = $1 AND revoked_at IS NULL",
    )
    .bind(account.id)
    .execute(&state.db)
    .await?;

    Ok(Json(serde_json::json!({ "loggedIn": false })))
}

async fn get_account(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<AccountSnapshot>> {
    Ok(Json(load_snapshot(&state.db, account.id).await?))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProfileRequest {
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub phone: Option<String>,
    pub profile_photo_uri: Option<String>,
    pub city: Option<String>,
    pub sector: Option<String>,
    /// Un borrador no marca el perfil como completo.
    #[serde(default)]
    pub is_draft: bool,
}

async fn update_profile(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<UpdateProfileRequest>,
) -> AppResult<Json<AccountSnapshot>> {
    let input = ProfileInput {
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        phone: payload.phone,
    };

    if !payload.is_draft {
        let errors = profile_field_errors(&input);
        if !errors.is_empty() {
            let detail = errors
                .iter()
                .map(|error| format!("{}: {}", error.field, error.message))
                .collect::<Vec<_>>()
                .join("; ");
            return Err(AppError::Validation(detail));
        }
    }

    let normalized = normalize_profile(&input);
    let profile_completed = !payload.is_draft;

    sqlx::query(
        r#"
        UPDATE accounts
        SET first_name = $2,
            last_name = $3,
            email = NULLIF($4, ''),
            profile_photo_uri = COALESCE($5, profile_photo_uri),
            city = COALESCE($6, city),
            sector = COALESCE($7, sector),
            profile_completed = profile_completed OR $8,
            updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(account.id)
    .bind(&normalized.first_name)
    .bind(&normalized.last_name)
    .bind(&normalized.email)
    .bind(&payload.profile_photo_uri)
    .bind(&payload.city)
    .bind(&payload.sector)
    .bind(profile_completed)
    .execute(&state.db)
    .await?;

    Ok(Json(load_snapshot(&state.db, account.id).await?))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePreferencesRequest {
    pub language: Option<String>,
    pub appearance: Option<String>,
    pub notifications_enabled: Option<bool>,
}

async fn update_preferences(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<UpdatePreferencesRequest>,
) -> AppResult<Json<AccountSnapshot>> {
    if let Some(language) = payload.language.as_deref() {
        if !matches!(language, "es" | "en") {
            return Err(AppError::Validation("idioma no soportado".to_string()));
        }
    }
    if let Some(appearance) = payload.appearance.as_deref() {
        if !matches!(appearance, "system" | "light" | "dark") {
            return Err(AppError::Validation("apariencia no soportada".to_string()));
        }
    }

    sqlx::query(
        r#"
        INSERT INTO account_preferences (account_id, language, appearance, notifications_enabled)
        VALUES (
            $1,
            COALESCE($2::app_language, 'es'),
            COALESCE($3::app_appearance, 'system'),
            COALESCE($4, TRUE)
        )
        ON CONFLICT (account_id) DO UPDATE
            SET language = COALESCE($2::app_language, account_preferences.language),
                appearance = COALESCE($3::app_appearance, account_preferences.appearance),
                notifications_enabled = COALESCE($4, account_preferences.notifications_enabled),
                updated_at = now()
        "#,
    )
    .bind(account.id)
    .bind(&payload.language)
    .bind(&payload.appearance)
    .bind(payload.notifications_enabled)
    .execute(&state.db)
    .await?;

    Ok(Json(load_snapshot(&state.db, account.id).await?))
}

async fn complete_onboarding(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<AccountSnapshot>> {
    sqlx::query(
        "UPDATE accounts SET onboarding_completed = TRUE, updated_at = now() WHERE id = $1",
    )
    .bind(account.id)
    .execute(&state.db)
    .await?;

    Ok(Json(load_snapshot(&state.db, account.id).await?))
}
