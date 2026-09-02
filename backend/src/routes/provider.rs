use axum::extract::{Path, State};
use axum::routing::{get, post};
use axum::{Json, Router};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::Row;
use uuid::Uuid;

use crate::auth::CurrentAccount;
use crate::domain::verification::{
    can_submit, missing_sections, resolve_section_status, sections_for, verification_progress,
    EntityType, SectionKey, SectionStatus, VerificationSection, VerificationStatus,
};
use crate::error::{AppError, AppResult};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/provider/enrollment", get(get_enrollment).post(create_enrollment))
        .route("/provider/enrollment/sections/{section}", axum::routing::patch(save_section))
        .route("/provider/enrollment/email/validate", post(validate_email))
        .route("/provider/enrollment/submit", post(submit))
        .route("/provider/documents", post(upload_document))
}

fn parse_entity(value: &str) -> AppResult<EntityType> {
    match value {
        "natural" => Ok(EntityType::Natural),
        "legal" => Ok(EntityType::Legal),
        _ => Err(AppError::Validation(
            "el tipo de persona debe ser natural o legal".to_string(),
        )),
    }
}

fn parse_status(value: &str) -> VerificationStatus {
    match value {
        "not_started" => VerificationStatus::NotStarted,
        "submitted" => VerificationStatus::Submitted,
        "under_review" => VerificationStatus::UnderReview,
        "changes_requested" => VerificationStatus::ChangesRequested,
        "approved" => VerificationStatus::Approved,
        "rejected" => VerificationStatus::Rejected,
        "suspended" => VerificationStatus::Suspended,
        _ => VerificationStatus::InProgress,
    }
}

fn parse_section(value: &str) -> AppResult<SectionKey> {
    Ok(match value {
        "account" => SectionKey::Account,
        "personal" => SectionKey::Personal,
        "identity" => SectionKey::Identity,
        "address" => SectionKey::Address,
        "contact" => SectionKey::Contact,
        "bank" => SectionKey::Bank,
        "general" => SectionKey::General,
        "company" => SectionKey::Company,
        "company_documents" => SectionKey::CompanyDocuments,
        "legal_representative" => SectionKey::LegalRepresentative,
        _ => return Err(AppError::NotFound("sección")),
    })
}

fn section_key_text(key: SectionKey) -> &'static str {
    match key {
        SectionKey::Account => "account",
        SectionKey::Personal => "personal",
        SectionKey::Identity => "identity",
        SectionKey::Address => "address",
        SectionKey::Contact => "contact",
        SectionKey::Bank => "bank",
        SectionKey::General => "general",
        SectionKey::Company => "company",
        SectionKey::CompanyDocuments => "company_documents",
        SectionKey::LegalRepresentative => "legal_representative",
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SectionView {
    pub key: String,
    pub status: String,
    pub complete: bool,
    pub draft: Option<serde_json::Value>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EnrollmentView {
    pub id: Uuid,
    pub entity_type: String,
    pub status: String,
    pub email_validated: bool,
    pub progress: u8,
    pub missing_sections: Vec<String>,
    pub last_pending_section: Option<String>,
    pub can_submit: bool,
    pub submitted_at: Option<DateTime<Utc>>,
    pub sections: Vec<SectionView>,
}

async fn load_enrollment(state: &AppState, account_id: Uuid) -> AppResult<Option<EnrollmentView>> {
    let Some(row) = sqlx::query(
        r#"
        SELECT id, entity_type::text AS entity_type, status::text AS status,
               email_validated, last_pending_section::text AS last_pending_section,
               submitted_at
        FROM provider_enrollments WHERE account_id = $1
        "#,
    )
    .bind(account_id)
    .fetch_optional(&state.db)
    .await?
    else {
        return Ok(None);
    };

    let enrollment_id: Uuid = row.get("id");
    let entity_type = parse_entity(&row.get::<String, _>("entity_type"))?;
    let status = parse_status(&row.get::<String, _>("status"));

    let stored = sqlx::query(
        r#"
        SELECT section_key::text AS section_key,
               status_override::text AS status_override,
               is_complete
        FROM provider_verification_sections WHERE enrollment_id = $1
        "#,
    )
    .bind(enrollment_id)
    .fetch_all(&state.db)
    .await?;

    let sections: Vec<VerificationSection> = sections_for(entity_type)
        .iter()
        .map(|key| {
            let stored_row = stored
                .iter()
                .find(|row| row.get::<String, _>("section_key") == section_key_text(*key));

            let complete = stored_row
                .map(|row| row.get::<bool, _>("is_complete"))
                .unwrap_or(false);

            let override_status = stored_row
                .and_then(|row| row.get::<Option<String>, _>("status_override"))
                .map(|value| match value.as_str() {
                    "complete" => SectionStatus::Complete,
                    "under_review" => SectionStatus::UnderReview,
                    "approved" => SectionStatus::Approved,
                    "changes_requested" => SectionStatus::ChangesRequested,
                    _ => SectionStatus::Pending,
                });

            VerificationSection {
                key: *key,
                status: resolve_section_status(complete, override_status, status),
                complete,
            }
        })
        .collect();

    Ok(Some(EnrollmentView {
        id: enrollment_id,
        entity_type: row.get("entity_type"),
        status: row.get("status"),
        email_validated: row.get("email_validated"),
        progress: verification_progress(&sections),
        missing_sections: missing_sections(&sections)
            .into_iter()
            .map(|key| section_key_text(key).to_string())
            .collect(),
        last_pending_section: row.get("last_pending_section"),
        can_submit: can_submit(status, &sections),
        submitted_at: row.get("submitted_at"),
        sections: sections
            .into_iter()
            .map(|section| SectionView {
                key: section_key_text(section.key).to_string(),
                status: format!("{:?}", section.status)
                    .chars()
                    .fold(String::new(), |mut acc, c| {
                        if c.is_uppercase() && !acc.is_empty() {
                            acc.push('_');
                        }
                        acc.push(c.to_ascii_lowercase());
                        acc
                    }),
                complete: section.complete,
                draft: None,
            })
            .collect(),
    }))
}

async fn get_enrollment(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<Option<EnrollmentView>>> {
    Ok(Json(load_enrollment(&state, account.id).await?))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateEnrollmentRequest {
    pub entity_type: String,
}

async fn create_enrollment(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<CreateEnrollmentRequest>,
) -> AppResult<Json<EnrollmentView>> {
    let entity_type = parse_entity(&payload.entity_type)?;

    let enrollment_id: Uuid = sqlx::query(
        r#"
        INSERT INTO provider_enrollments (account_id, entity_type, status)
        VALUES ($1, $2::provider_entity_type, 'in_progress')
        ON CONFLICT (account_id) DO UPDATE SET updated_at = now()
        RETURNING id
        "#,
    )
    .bind(account.id)
    .bind(&payload.entity_type)
    .fetch_one(&state.db)
    .await?
    .get("id");

    // Se crean las 7 secciones del tipo elegido, todas pendientes.
    for key in sections_for(entity_type) {
        sqlx::query(
            r#"
            INSERT INTO provider_verification_sections (enrollment_id, section_key, is_complete)
            VALUES ($1, $2::provider_section_key, FALSE)
            ON CONFLICT (enrollment_id, section_key) DO NOTHING
            "#,
        )
        .bind(enrollment_id)
        .bind(section_key_text(*key))
        .execute(&state.db)
        .await?;
    }

    load_enrollment(&state, account.id)
        .await?
        .map(Json)
        .ok_or(AppError::Internal("no se pudo crear el enrolamiento".into()))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveSectionRequest {
    #[serde(default)]
    pub is_complete: bool,
}

async fn save_section(
    State(state): State<AppState>,
    account: CurrentAccount,
    Path(section): Path<String>,
    Json(payload): Json<SaveSectionRequest>,
) -> AppResult<Json<EnrollmentView>> {
    let key = parse_section(&section)?;

    let enrollment_id: Uuid = sqlx::query("SELECT id FROM provider_enrollments WHERE account_id = $1")
        .bind(account.id)
        .fetch_optional(&state.db)
        .await?
        .ok_or(AppError::NotFound("enrolamiento"))?
        .get("id");

    sqlx::query(
        r#"
        INSERT INTO provider_verification_sections (enrollment_id, section_key, is_complete)
        VALUES ($1, $2::provider_section_key, $3)
        ON CONFLICT (enrollment_id, section_key) DO UPDATE SET
            is_complete = EXCLUDED.is_complete, updated_at = now()
        "#,
    )
    .bind(enrollment_id)
    .bind(section_key_text(key))
    .bind(payload.is_complete)
    .execute(&state.db)
    .await?;

    // Guardar avanza el enrolamiento y recuerda dónde se quedó.
    sqlx::query(
        r#"
        UPDATE provider_enrollments
        SET status = CASE WHEN status = 'not_started' THEN 'in_progress' ELSE status END,
            last_pending_section = $2::provider_section_key,
            updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(enrollment_id)
    .bind(section_key_text(key))
    .execute(&state.db)
    .await?;

    load_enrollment(&state, account.id)
        .await?
        .map(Json)
        .ok_or(AppError::NotFound("enrolamiento"))
}

async fn validate_email(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<EnrollmentView>> {
    sqlx::query(
        "UPDATE provider_enrollments SET email_validated = TRUE, updated_at = now() WHERE account_id = $1",
    )
    .bind(account.id)
    .execute(&state.db)
    .await?;

    load_enrollment(&state, account.id)
        .await?
        .map(Json)
        .ok_or(AppError::NotFound("enrolamiento"))
}

async fn submit(
    State(state): State<AppState>,
    account: CurrentAccount,
) -> AppResult<Json<EnrollmentView>> {
    let current = load_enrollment(&state, account.id)
        .await?
        .ok_or(AppError::NotFound("enrolamiento"))?;

    if !current.can_submit {
        return Err(AppError::Conflict(format!(
            "faltan secciones por completar: {}",
            current.missing_sections.join(", ")
        )));
    }

    sqlx::query(
        r#"
        UPDATE provider_enrollments
        SET status = 'under_review', submitted_at = now(), updated_at = now()
        WHERE account_id = $1
        "#,
    )
    .bind(account.id)
    .execute(&state.db)
    .await?;

    load_enrollment(&state, account.id)
        .await?
        .map(Json)
        .ok_or(AppError::NotFound("enrolamiento"))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentRequest {
    pub file_name: String,
    pub mime_type: String,
    pub kind: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentView {
    pub id: Uuid,
    pub file_name: String,
    pub mime_type: String,
    pub uploaded_at: DateTime<Utc>,
}

async fn upload_document(
    State(state): State<AppState>,
    account: CurrentAccount,
    Json(payload): Json<DocumentRequest>,
) -> AppResult<Json<DocumentView>> {
    // Los documentos de verificación son sensibles: bucket privado, nunca público.
    let row = sqlx::query(
        r#"
        INSERT INTO documents (account_id, storage_key, file_name, mime_type, is_sensitive)
        VALUES ($1, $2, $3, $4, TRUE)
        RETURNING id, file_name, mime_type, uploaded_at
        "#,
    )
    .bind(account.id)
    .bind(format!("kyc/{}/{}/{}", account.id, payload.kind, payload.file_name))
    .bind(&payload.file_name)
    .bind(&payload.mime_type)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(DocumentView {
        id: row.get("id"),
        file_name: row.get("file_name"),
        mime_type: row.get("mime_type"),
        uploaded_at: row.get("uploaded_at"),
    }))
}
