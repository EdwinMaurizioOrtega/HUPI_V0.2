//! Portado de `mobile/src/domain/passwordPolicy.ts`.

pub const MINIMUM_PASSWORD_LENGTH: usize = 8;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PasswordError {
    Required,
    TooShort,
    Mismatch,
}

impl PasswordError {
    pub fn message(&self) -> &'static str {
        match self {
            PasswordError::Required => "la contraseña es obligatoria",
            PasswordError::TooShort => "la contraseña debe tener al menos 8 caracteres",
            PasswordError::Mismatch => "las contraseñas no coinciden",
        }
    }
}

pub fn validate_password(password: &str, confirmation: &str) -> Result<(), PasswordError> {
    if password.is_empty() || confirmation.is_empty() {
        return Err(PasswordError::Required);
    }
    if password.chars().count() < MINIMUM_PASSWORD_LENGTH {
        return Err(PasswordError::TooShort);
    }
    if password != confirmation {
        return Err(PasswordError::Mismatch);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn acepta_una_contrasena_valida() {
        assert!(validate_password("contrasena1", "contrasena1").is_ok());
    }

    #[test]
    fn exige_ambos_campos() {
        assert_eq!(validate_password("", ""), Err(PasswordError::Required));
        assert_eq!(
            validate_password("contrasena1", ""),
            Err(PasswordError::Required)
        );
    }

    #[test]
    fn exige_minimo_ocho_caracteres() {
        assert_eq!(
            validate_password("corta1", "corta1"),
            Err(PasswordError::TooShort)
        );
    }

    #[test]
    fn exige_que_la_confirmacion_coincida() {
        assert_eq!(
            validate_password("contrasena1", "contrasena2"),
            Err(PasswordError::Mismatch)
        );
    }
}
