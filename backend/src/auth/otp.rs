//! Generación y validación del código OTP.
#![allow(dead_code)]

use rand::Rng;

/// Código fijo aceptado en desarrollo, igual que el prototipo móvil.
pub const DEV_OTP_CODE: &str = "123456";

pub const OTP_LENGTH: usize = 6;
pub const OTP_EXPIRY_MINUTES: i64 = 10;
pub const OTP_MAX_ATTEMPTS: i32 = 5;

/// Números del prototipo. El código fijo solo se acepta para estos y solo
/// cuando `APP_ENV=development`.
const TEST_PHONE_NUMBERS: &[&str] = &[
    "+593 99 123 4567",
    "+593 98 765 4321",
    "+593 98 222 3344",
    "+593 97 555 7788",
    "+593 98 111 2233",
];

/// Últimos 9 dígitos: acepta el número con o sin prefijo de país.
fn national_digits(phone: &str) -> String {
    let digits: String = phone.chars().filter(char::is_ascii_digit).collect();
    let start = digits.len().saturating_sub(9);
    digits[start..].to_string()
}

pub fn is_test_phone(phone: &str) -> bool {
    let national = national_digits(phone);
    !national.is_empty()
        && TEST_PHONE_NUMBERS
            .iter()
            .any(|candidate| national_digits(candidate) == national)
}

/// Permite entrar con `123456` sin pedir SMS, para demos y QA.
pub fn accepts_fixed_code(is_development: bool, phone: &str, code: &str) -> bool {
    is_development && is_test_phone(phone) && codes_match(DEV_OTP_CODE, code.trim())
}

pub fn generate_code(is_development: bool) -> String {
    if is_development {
        return DEV_OTP_CODE.to_string();
    }
    let value: u32 = rand::thread_rng().gen_range(0..1_000_000);
    format!("{value:06}")
}

/// Comparación en tiempo constante para no filtrar el código por temporización.
pub fn codes_match(expected: &str, provided: &str) -> bool {
    let expected = expected.as_bytes();
    let provided = provided.as_bytes();

    if expected.len() != provided.len() {
        return false;
    }

    expected
        .iter()
        .zip(provided.iter())
        .fold(0u8, |acc, (a, b)| acc | (a ^ b))
        == 0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn en_desarrollo_el_codigo_es_el_fijo_del_prototipo() {
        assert_eq!(generate_code(true), "123456");
    }

    #[test]
    fn en_produccion_genera_seis_digitos() {
        let code = generate_code(false);
        assert_eq!(code.len(), OTP_LENGTH);
        assert!(code.chars().all(|c| c.is_ascii_digit()));
    }

    #[test]
    fn compara_codigos_correctamente() {
        assert!(codes_match("123456", "123456"));
        assert!(!codes_match("123456", "654321"));
        assert!(!codes_match("123456", "12345"));
    }

    #[test]
    fn reconoce_los_numeros_de_prueba_con_y_sin_prefijo_pais() {
        assert!(is_test_phone("+593 99 123 4567"));
        assert!(is_test_phone("991234567"));
        assert!(is_test_phone("593991234567"));
    }

    #[test]
    fn un_numero_cualquiera_no_es_de_prueba() {
        assert!(!is_test_phone("0999999999"));
        assert!(!is_test_phone(""));
    }

    #[test]
    fn en_desarrollo_el_codigo_fijo_vale_para_numeros_de_prueba() {
        assert!(accepts_fixed_code(true, "99 123 4567", "123456"));
        assert!(accepts_fixed_code(true, "+593 99 123 4567", " 123456 "));
    }

    #[test]
    fn el_codigo_fijo_no_vale_para_numeros_ajenos() {
        assert!(!accepts_fixed_code(true, "0999999999", "123456"));
    }

    #[test]
    fn en_produccion_el_codigo_fijo_nunca_se_acepta() {
        assert!(!accepts_fixed_code(false, "+593 99 123 4567", "123456"));
    }

    #[test]
    fn otro_codigo_no_entra_por_la_via_rapida() {
        assert!(!accepts_fixed_code(true, "+593 99 123 4567", "000000"));
    }
}
