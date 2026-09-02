//! Portado de `mobile/src/domain/accessRecovery.ts`.
//! Se usa para responder sin revelar si una cuenta existe.

pub fn normalize_recovery_email(value: &str) -> String {
    value.trim().to_lowercase()
}

pub fn is_valid_recovery_email(value: &str) -> bool {
    let normalized = normalize_recovery_email(value);
    let Some((local, domain)) = normalized.split_once('@') else {
        return false;
    };

    !local.is_empty()
        && !local.contains(char::is_whitespace)
        && !domain.is_empty()
        && !domain.contains('@')
        && !domain.contains(char::is_whitespace)
        && domain.contains('.')
        && !domain.starts_with('.')
        && !domain.ends_with('.')
}

fn mask_tail(length: usize) -> String {
    "•".repeat(length.max(1))
}

pub fn mask_email(value: &str) -> String {
    let normalized = normalize_recovery_email(value);

    let Some(at_index) = normalized.find('@').filter(|index| *index > 0) else {
        return match normalized.chars().next() {
            Some(first) => format!(
                "{first}{}",
                mask_tail(normalized.chars().count().saturating_sub(1))
            ),
            None => "••••".to_string(),
        };
    };

    let local: String = normalized.chars().take(at_index).collect();
    let domain: String = normalized.chars().skip(at_index + 1).collect();
    let first = local.chars().next().unwrap_or_default();
    let masked_local = format!("{first}{}", mask_tail(local.chars().count() - 1));

    if domain.is_empty() {
        masked_local
    } else {
        format!("{masked_local}@{domain}")
    }
}

pub fn phone_last_four(value: &str) -> String {
    let digits: String = value.chars().filter(char::is_ascii_digit).collect();
    let start = digits.len().saturating_sub(4);
    digits[start..].to_string()
}

pub fn mask_phone(value: &str) -> String {
    let last_four = phone_last_four(value);

    if last_four.is_empty() {
        return "••• ••• ••••".to_string();
    }
    if last_four.len() < 4 {
        return "•".repeat(last_four.len());
    }
    format!("••• ••• {last_four}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn valida_correos_con_formato_correcto() {
        assert!(is_valid_recovery_email("Ana@Hupi.PET"));
        assert!(is_valid_recovery_email("  user@example.com  "));
    }

    #[test]
    fn rechaza_correos_mal_formados() {
        assert!(!is_valid_recovery_email("sin-arroba.com"));
        assert!(!is_valid_recovery_email("@example.com"));
        assert!(!is_valid_recovery_email("user@"));
        assert!(!is_valid_recovery_email("user@sinpunto"));
        assert!(!is_valid_recovery_email("us er@example.com"));
    }

    #[test]
    fn enmascara_el_correo_conservando_el_dominio() {
        assert_eq!(mask_email("andres@hupi.pet"), "a•••••@hupi.pet");
    }

    #[test]
    fn enmascara_valores_sin_arroba() {
        assert_eq!(mask_email("andres"), "a•••••");
        assert_eq!(mask_email(""), "••••");
    }

    #[test]
    fn extrae_los_ultimos_cuatro_digitos() {
        assert_eq!(phone_last_four("+593 99 123 4567"), "4567");
        assert_eq!(phone_last_four("sin numeros"), "");
    }

    #[test]
    fn enmascara_el_telefono() {
        assert_eq!(mask_phone("+593 99 123 4567"), "••• ••• 4567");
        assert_eq!(mask_phone("sin numeros"), "••• ••• ••••");
        assert_eq!(mask_phone("12"), "••");
    }
}
