//! Portado de `mobile/src/domain/providerVerification.ts`.
//! La verificación general del proveedor y la aprobación de cada servicio
//! son estados distintos: aprobar el proveedor no aprueba sus servicios.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EntityType {
    Natural,
    Legal,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum VerificationStatus {
    NotStarted,
    InProgress,
    Submitted,
    UnderReview,
    ChangesRequested,
    Approved,
    Rejected,
    Suspended,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SectionStatus {
    Pending,
    Complete,
    UnderReview,
    Approved,
    ChangesRequested,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SectionKey {
    Account,
    Personal,
    Identity,
    Address,
    Contact,
    Bank,
    General,
    Company,
    CompanyDocuments,
    LegalRepresentative,
}

const NATURAL_SECTIONS: [SectionKey; 7] = [
    SectionKey::Account,
    SectionKey::Personal,
    SectionKey::Identity,
    SectionKey::Address,
    SectionKey::Contact,
    SectionKey::Bank,
    SectionKey::General,
];

const LEGAL_SECTIONS: [SectionKey; 7] = [
    SectionKey::Account,
    SectionKey::Company,
    SectionKey::CompanyDocuments,
    SectionKey::LegalRepresentative,
    SectionKey::Address,
    SectionKey::Contact,
    SectionKey::Bank,
];

pub fn sections_for(entity_type: EntityType) -> &'static [SectionKey; 7] {
    match entity_type {
        EntityType::Natural => &NATURAL_SECTIONS,
        EntityType::Legal => &LEGAL_SECTIONS,
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct VerificationSection {
    pub key: SectionKey,
    pub status: SectionStatus,
    pub complete: bool,
}

/// El estado visible de una sección deriva del override administrativo si existe;
/// si no, de si está completa y del estado global del enrollment.
pub fn resolve_section_status(
    complete: bool,
    override_status: Option<SectionStatus>,
    enrollment_status: VerificationStatus,
) -> SectionStatus {
    if let Some(status) = override_status {
        return status;
    }
    if !complete {
        return SectionStatus::Pending;
    }
    match enrollment_status {
        VerificationStatus::Submitted | VerificationStatus::UnderReview => {
            SectionStatus::UnderReview
        }
        VerificationStatus::Approved => SectionStatus::Approved,
        _ => SectionStatus::Complete,
    }
}

pub fn missing_sections(sections: &[VerificationSection]) -> Vec<SectionKey> {
    sections
        .iter()
        .filter(|section| !section.complete)
        .map(|section| section.key)
        .collect()
}

/// Porcentaje redondeado de secciones completas sobre el total.
pub fn verification_progress(sections: &[VerificationSection]) -> u8 {
    if sections.is_empty() {
        return 0;
    }
    let complete = sections.iter().filter(|section| section.complete).count();
    ((complete as f64 / sections.len() as f64) * 100.0).round() as u8
}

pub fn can_submit(status: VerificationStatus, sections: &[VerificationSection]) -> bool {
    matches!(
        status,
        VerificationStatus::InProgress | VerificationStatus::ChangesRequested
    ) && missing_sections(sections).is_empty()
}

pub fn is_generally_approved(status: VerificationStatus) -> bool {
    status == VerificationStatus::Approved
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sections(complete_count: usize) -> Vec<VerificationSection> {
        NATURAL_SECTIONS
            .iter()
            .enumerate()
            .map(|(index, key)| VerificationSection {
                key: *key,
                status: SectionStatus::Pending,
                complete: index < complete_count,
            })
            .collect()
    }

    #[test]
    fn ambos_tipos_tienen_siete_secciones() {
        assert_eq!(sections_for(EntityType::Natural).len(), 7);
        assert_eq!(sections_for(EntityType::Legal).len(), 7);
    }

    #[test]
    fn la_persona_juridica_pide_documentos_de_empresa() {
        let legal = sections_for(EntityType::Legal);
        assert!(legal.contains(&SectionKey::CompanyDocuments));
        assert!(legal.contains(&SectionKey::LegalRepresentative));
        assert!(!legal.contains(&SectionKey::Identity));
    }

    #[test]
    fn el_progreso_se_calcula_sobre_siete_secciones() {
        assert_eq!(verification_progress(&sections(0)), 0);
        assert_eq!(verification_progress(&sections(7)), 100);
        // 4/7 = 57.14 -> 57
        assert_eq!(verification_progress(&sections(4)), 57);
    }

    #[test]
    fn no_se_puede_enviar_con_secciones_pendientes() {
        assert!(!can_submit(VerificationStatus::InProgress, &sections(6)));
    }

    #[test]
    fn se_puede_enviar_estando_completo_y_en_progreso() {
        assert!(can_submit(VerificationStatus::InProgress, &sections(7)));
        assert!(can_submit(
            VerificationStatus::ChangesRequested,
            &sections(7)
        ));
    }

    #[test]
    fn no_se_puede_reenviar_mientras_esta_en_revision() {
        assert!(!can_submit(VerificationStatus::UnderReview, &sections(7)));
        assert!(!can_submit(VerificationStatus::Approved, &sections(7)));
    }

    #[test]
    fn el_override_administrativo_tiene_prioridad() {
        let status = resolve_section_status(
            true,
            Some(SectionStatus::ChangesRequested),
            VerificationStatus::UnderReview,
        );
        assert_eq!(status, SectionStatus::ChangesRequested);
    }

    #[test]
    fn una_seccion_completa_en_revision_se_muestra_en_revision() {
        let status = resolve_section_status(true, None, VerificationStatus::UnderReview);
        assert_eq!(status, SectionStatus::UnderReview);
    }

    #[test]
    fn una_seccion_incompleta_siempre_esta_pendiente() {
        let status = resolve_section_status(false, None, VerificationStatus::Approved);
        assert_eq!(status, SectionStatus::Pending);
    }

    #[test]
    fn lista_las_secciones_faltantes() {
        let missing = missing_sections(&sections(5));
        assert_eq!(missing.len(), 2);
        assert_eq!(missing[0], SectionKey::Bank);
    }
}
