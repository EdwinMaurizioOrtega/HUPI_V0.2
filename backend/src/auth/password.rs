//! Hash de contraseñas con Argon2id.

use argon2::password_hash::{rand_core::OsRng, PasswordHasher, PasswordVerifier, SaltString};
use argon2::{Argon2, PasswordHash};

use crate::error::AppError;

pub fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut OsRng);

    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|err| AppError::Internal(format!("no se pudo hashear la contraseña: {err}")))
}

pub fn verify_password(password: &str, stored_hash: &str) -> bool {
    let Ok(parsed) = PasswordHash::new(stored_hash) else {
        return false;
    };

    Argon2::default()
        .verify_password(password.as_bytes(), &parsed)
        .is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn una_contrasena_correcta_se_verifica() {
        let hash = hash_password("contrasena-secreta").unwrap();
        assert!(verify_password("contrasena-secreta", &hash));
    }

    #[test]
    fn una_contrasena_incorrecta_se_rechaza() {
        let hash = hash_password("contrasena-secreta").unwrap();
        assert!(!verify_password("otra-contrasena", &hash));
    }

    #[test]
    fn el_hash_nunca_contiene_la_contrasena_en_claro() {
        let hash = hash_password("contrasena-secreta").unwrap();
        assert!(!hash.contains("contrasena-secreta"));
        assert!(hash.starts_with("$argon2"));
    }

    #[test]
    fn dos_hashes_de_la_misma_contrasena_son_distintos() {
        let first = hash_password("misma").unwrap();
        let second = hash_password("misma").unwrap();
        assert_ne!(first, second);
    }

    #[test]
    fn un_hash_corrupto_no_valida() {
        assert!(!verify_password("cualquiera", "no-es-un-hash"));
    }
}
