//! Portado de `mobile/src/domain/marketplaceSearch.ts`.
//! En SQL el equivalente es `unaccent()` sobre un `tsvector`.

/// Minúsculas y sin diacríticos, con espacios colapsados.
pub fn normalize_search(value: &str) -> String {
    let lowercase = value.to_lowercase();
    let stripped: String = lowercase.chars().map(strip_diacritic).collect();

    stripped
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn strip_diacritic(character: char) -> char {
    match character {
        'á' | 'à' | 'ä' | 'â' | 'ã' | 'å' => 'a',
        'é' | 'è' | 'ë' | 'ê' => 'e',
        'í' | 'ì' | 'ï' | 'î' => 'i',
        'ó' | 'ò' | 'ö' | 'ô' | 'õ' => 'o',
        'ú' | 'ù' | 'ü' | 'û' => 'u',
        'ñ' => 'n',
        'ç' => 'c',
        other => other,
    }
}

/// Coincide si TODOS los términos aparecen en el texto (AND).
pub fn matches_all_terms(haystack: &str, query: &str) -> bool {
    let normalized_haystack = normalize_search(haystack);
    let normalized_query = normalize_search(query);

    if normalized_query.is_empty() {
        return true;
    }

    normalized_query
        .split(' ')
        .all(|term| normalized_haystack.contains(term))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn quita_acentos_y_pasa_a_minusculas() {
        assert_eq!(normalize_search("Alimentación Canína"), "alimentacion canina");
        assert_eq!(normalize_search("PEQUEÑO"), "pequeno");
    }

    #[test]
    fn colapsa_espacios_repetidos() {
        assert_eq!(normalize_search("  collar   azul  "), "collar azul");
    }

    #[test]
    fn encuentra_ignorando_acentos() {
        assert!(matches_all_terms("Alimentación premium", "alimentacion"));
        assert!(matches_all_terms("Collar pequeño", "PEQUENO"));
    }

    #[test]
    fn exige_que_aparezcan_todos_los_terminos() {
        assert!(matches_all_terms("collar azul para perro", "collar perro"));
        assert!(!matches_all_terms("collar azul para perro", "collar gato"));
    }

    #[test]
    fn una_busqueda_vacia_coincide_siempre() {
        assert!(matches_all_terms("cualquier cosa", "   "));
    }
}
