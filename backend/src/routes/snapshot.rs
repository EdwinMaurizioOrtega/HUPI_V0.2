//! Snapshot equivalente a `LocalAccountSnapshot` del prototipo móvil,
//! para que el adaptador HTTP encaje en el contrato `AccountRepository`.

use serde::Serialize;
use sqlx::Row;
use uuid::Uuid;

use crate::db::Db;
use crate::domain::profile::profile_initials;
use crate::error::{AppError, AppResult};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionView {
    pub logged_in: bool,
    pub phone_verified: bool,
    pub pending_phone: String,
    pub verification_channel: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileView {
    pub id: Uuid,
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub phone: String,
    pub city: Option<String>,
    pub sector: Option<String>,
    pub avatar: String,
    pub profile_photo_uri: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AddressView {
    pub id: Uuid,
    pub label_type: String,
    pub custom_label: Option<String>,
    pub icon_key: String,
    pub formatted_address: String,
    pub street_address: String,
    pub house_number: Option<String>,
    pub reference: Option<String>,
    pub city: String,
    pub province: String,
    pub country: String,
    pub postal_code: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub is_default: bool,
    pub source: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PreferencesView {
    pub language: String,
    pub appearance: String,
    pub notifications_enabled: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountSnapshot {
    pub ready: bool,
    pub onboarding_completed: bool,
    pub profile_completed: bool,
    pub session: SessionView,
    pub profile: ProfileView,
    pub addresses: Vec<AddressView>,
    pub preferences: PreferencesView,
}

pub async fn load_snapshot(db: &Db, account_id: Uuid) -> AppResult<AccountSnapshot> {
    let account = sqlx::query(
        r#"
        SELECT id, phone, phone_verified, coalesce(email, '') AS email,
               first_name, last_name, city, sector, profile_photo_uri,
               onboarding_completed, profile_completed
        FROM accounts
        WHERE id = $1
        "#,
    )
    .bind(account_id)
    .fetch_optional(db)
    .await?
    // El token puede apuntar a una cuenta ya borrada: eso es sesión inválida,
    // no un fallo del servidor.
    .ok_or(AppError::Unauthorized)?;

    let first_name: String = account.get("first_name");
    let last_name: String = account.get("last_name");
    let phone: String = account.get("phone");
    let phone_verified: bool = account.get("phone_verified");

    let preferences = sqlx::query(
        r#"
        SELECT language::text AS language,
               appearance::text AS appearance,
               notifications_enabled
        FROM account_preferences
        WHERE account_id = $1
        "#,
    )
    .bind(account_id)
    .fetch_optional(db)
    .await?;

    let address_rows = sqlx::query(
        r#"
        SELECT id, label_type::text AS label_type, custom_label, icon_key,
               formatted_address, street_address, house_number, reference,
               city, province, country, postal_code, latitude, longitude,
               is_default, source::text AS source
        FROM addresses
        WHERE account_id = $1
        ORDER BY is_default DESC, created_at ASC
        "#,
    )
    .bind(account_id)
    .fetch_all(db)
    .await?;

    let addresses = address_rows
        .into_iter()
        .map(|row| AddressView {
            id: row.get("id"),
            label_type: row.get("label_type"),
            custom_label: row.get("custom_label"),
            icon_key: row.get("icon_key"),
            formatted_address: row.get("formatted_address"),
            street_address: row.get("street_address"),
            house_number: row.get("house_number"),
            reference: row.get("reference"),
            city: row.get("city"),
            province: row.get("province"),
            country: row.get("country"),
            postal_code: row.get("postal_code"),
            latitude: row.get("latitude"),
            longitude: row.get("longitude"),
            is_default: row.get("is_default"),
            source: row.get("source"),
        })
        .collect();

    Ok(AccountSnapshot {
        ready: true,
        onboarding_completed: account.get("onboarding_completed"),
        profile_completed: account.get("profile_completed"),
        session: SessionView {
            logged_in: true,
            phone_verified,
            pending_phone: if phone_verified { String::new() } else { phone.clone() },
            verification_channel: "sms".to_string(),
        },
        profile: ProfileView {
            id: account.get("id"),
            avatar: profile_initials(&first_name, &last_name),
            first_name,
            last_name,
            email: account.get("email"),
            phone,
            city: account.get("city"),
            sector: account.get("sector"),
            profile_photo_uri: account.get("profile_photo_uri"),
        },
        addresses,
        preferences: PreferencesView {
            language: preferences
                .as_ref()
                .map(|row| row.get("language"))
                .unwrap_or_else(|| "es".to_string()),
            appearance: preferences
                .as_ref()
                .map(|row| row.get("appearance"))
                .unwrap_or_else(|| "system".to_string()),
            notifications_enabled: preferences
                .as_ref()
                .map(|row| row.get("notifications_enabled"))
                .unwrap_or(true),
        },
    })
}
