//! Portado de `mobile/src/domain/profile.ts`.

use serde::{Deserialize, Serialize};

use super::masking::is_valid_recovery_email;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileInput {
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub phone: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ProfileFieldError {
    pub field: &'static str,
    pub message: &'static str,
}

pub fn normalize_profile(input: &ProfileInput) -> ProfileInput {
    ProfileInput {
        first_name: input.first_name.trim().to_string(),
        last_name: input.last_name.trim().to_string(),
        email: input.email.trim().to_lowercase(),
        phone: input
            .phone
            .as_ref()
            .map(|phone| phone.trim().to_string())
            .filter(|phone| !phone.is_empty()),
    }
}

/// Iniciales usadas como avatar por defecto.
pub fn profile_initials(first_name: &str, last_name: &str) -> String {
    let first = first_name.trim().chars().next();
    let last = last_name.trim().chars().next();

    match (first, last) {
        (Some(a), Some(b)) => format!("{a}{b}").to_uppercase(),
        (Some(a), None) => a.to_uppercase().to_string(),
        (None, Some(b)) => b.to_uppercase().to_string(),
        (None, None) => String::new(),
    }
}

pub fn profile_field_errors(input: &ProfileInput) -> Vec<ProfileFieldError> {
    let normalized = normalize_profile(input);
    let mut errors = Vec::new();

    if normalized.first_name.is_empty() {
        errors.push(ProfileFieldError {
            field: "first_name",
            message: "el nombre es obligatorio",
        });
    }
    if normalized.last_name.is_empty() {
        errors.push(ProfileFieldError {
            field: "last_name",
            message: "el apellido es obligatorio",
        });
    }
    if normalized.email.is_empty() {
        errors.push(ProfileFieldError {
            field: "email",
            message: "el correo es obligatorio",
        });
    } else if !is_valid_recovery_email(&normalized.email) {
        errors.push(ProfileFieldError {
            field: "email",
            message: "el correo no tiene un formato válido",
        });
    }

    errors
}

pub fn is_profile_complete(input: &ProfileInput) -> bool {
    profile_field_errors(input).is_empty()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn valid() -> ProfileInput {
        ProfileInput {
            first_name: "  Andrés ".to_string(),
            last_name: " Luna ".to_string(),
            email: "  Andres@Hupi.PET ".to_string(),
            phone: Some(" 99 123 4567 ".to_string()),
        }
    }

    #[test]
    fn normaliza_espacios_y_pasa_el_correo_a_minusculas() {
        let normalized = normalize_profile(&valid());

        assert_eq!(normalized.first_name, "Andrés");
        assert_eq!(normalized.last_name, "Luna");
        assert_eq!(normalized.email, "andres@hupi.pet");
        assert_eq!(normalized.phone.as_deref(), Some("99 123 4567"));
    }

    #[test]
    fn un_telefono_vacio_se_convierte_en_ausente() {
        let input = ProfileInput {
            phone: Some("   ".to_string()),
            ..valid()
        };
        assert!(normalize_profile(&input).phone.is_none());
    }

    #[test]
    fn deriva_las_iniciales_en_mayusculas() {
        assert_eq!(profile_initials("andrés", "luna"), "AL");
        assert_eq!(profile_initials("andrés", ""), "A");
        assert_eq!(profile_initials("", ""), "");
    }

    #[test]
    fn un_perfil_valido_no_tiene_errores() {
        assert!(profile_field_errors(&valid()).is_empty());
        assert!(is_profile_complete(&valid()));
    }

    #[test]
    fn exige_nombre_apellido_y_correo() {
        let input = ProfileInput {
            first_name: " ".to_string(),
            last_name: " ".to_string(),
            email: " ".to_string(),
            phone: None,
        };

        assert_eq!(profile_field_errors(&input).len(), 3);
        assert!(!is_profile_complete(&input));
    }

    #[test]
    fn rechaza_un_correo_mal_formado() {
        let input = ProfileInput {
            email: "sin-arroba".to_string(),
            ..valid()
        };

        let errors = profile_field_errors(&input);
        assert_eq!(errors.len(), 1);
        assert_eq!(errors[0].field, "email");
    }
}
