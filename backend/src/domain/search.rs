//! Portado de `mobile/src/domain/providerSearch.ts`.

use serde::{Deserialize, Serialize};

pub const DEFAULT_PROVIDER_SEARCH_RADIUS_KM: f64 = 8.0;
const EARTH_RADIUS_KM: f64 = 6_371.0;

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Coordinate {
    pub latitude: f64,
    pub longitude: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ProviderFilter {
    BestRated,
    Closest,
    Verified,
}

#[derive(Debug, Clone)]
pub struct SearchableProvider {
    pub id: uuid::Uuid,
    pub coordinate: Coordinate,
    pub is_verified_by_hupi: bool,
    pub rating: f64,
}

#[derive(Debug, Clone)]
pub struct LocatedProvider {
    pub provider: SearchableProvider,
    pub distance_km: f64,
}

pub fn haversine_distance_km(from: Coordinate, to: Coordinate) -> f64 {
    let latitude_delta = (to.latitude - from.latitude).to_radians();
    let longitude_delta = (to.longitude - from.longitude).to_radians();
    let from_latitude = from.latitude.to_radians();
    let to_latitude = to.latitude.to_radians();

    let haversine = (latitude_delta / 2.0).sin().powi(2)
        + from_latitude.cos() * to_latitude.cos() * (longitude_delta / 2.0).sin().powi(2);

    EARTH_RADIUS_KM * 2.0 * haversine.sqrt().atan2((1.0 - haversine).sqrt())
}

/// Filtra por radio y ordena. `closest` ordena por distancia; el resto por
/// rating descendente y, a igualdad, por distancia ascendente.
pub fn derive_provider_search_results(
    providers: Vec<SearchableProvider>,
    center: Coordinate,
    filter: ProviderFilter,
    radius_km: f64,
) -> Vec<LocatedProvider> {
    let mut located: Vec<LocatedProvider> = providers
        .into_iter()
        .map(|provider| LocatedProvider {
            distance_km: haversine_distance_km(center, provider.coordinate),
            provider,
        })
        .filter(|item| item.distance_km <= radius_km)
        .filter(|item| filter != ProviderFilter::Verified || item.provider.is_verified_by_hupi)
        .collect();

    located.sort_by(|left, right| match filter {
        ProviderFilter::Closest => left
            .distance_km
            .partial_cmp(&right.distance_km)
            .unwrap_or(std::cmp::Ordering::Equal),
        _ => right
            .provider
            .rating
            .partial_cmp(&left.provider.rating)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then(
                left.distance_km
                    .partial_cmp(&right.distance_km)
                    .unwrap_or(std::cmp::Ordering::Equal),
            ),
    });

    located
}

#[cfg(test)]
mod tests {
    use super::*;

    fn provider(rating: f64, verified: bool, latitude: f64, longitude: f64) -> SearchableProvider {
        SearchableProvider {
            id: uuid::Uuid::new_v4(),
            coordinate: Coordinate {
                latitude,
                longitude,
            },
            is_verified_by_hupi: verified,
            rating,
        }
    }

    #[test]
    fn la_distancia_a_si_mismo_es_cero() {
        let point = Coordinate {
            latitude: -0.1807,
            longitude: -78.4678,
        };
        assert!(haversine_distance_km(point, point).abs() < 1e-9);
    }

    #[test]
    fn calcula_la_distancia_quito_guayaquil() {
        let quito = Coordinate {
            latitude: -0.1807,
            longitude: -78.4678,
        };
        let guayaquil = Coordinate {
            latitude: -2.1894,
            longitude: -79.8891,
        };

        // Distancia real aproximada: 273 km.
        let distance = haversine_distance_km(quito, guayaquil);
        assert!((distance - 273.0).abs() < 5.0, "distancia = {distance}");
    }

    #[test]
    fn descarta_proveedores_fuera_del_radio() {
        let center = Coordinate {
            latitude: -0.1807,
            longitude: -78.4678,
        };
        let lejano = provider(5.0, true, -2.1894, -79.8891);

        let results = derive_provider_search_results(
            vec![lejano],
            center,
            ProviderFilter::BestRated,
            DEFAULT_PROVIDER_SEARCH_RADIUS_KM,
        );

        assert!(results.is_empty());
    }

    #[test]
    fn el_filtro_verified_excluye_no_verificados() {
        let center = Coordinate {
            latitude: 0.0,
            longitude: 0.0,
        };
        let results = derive_provider_search_results(
            vec![
                provider(5.0, false, 0.0, 0.01),
                provider(4.0, true, 0.0, 0.02),
            ],
            center,
            ProviderFilter::Verified,
            DEFAULT_PROVIDER_SEARCH_RADIUS_KM,
        );

        assert_eq!(results.len(), 1);
        assert!(results[0].provider.is_verified_by_hupi);
    }

    #[test]
    fn best_rated_ordena_por_rating_descendente() {
        let center = Coordinate {
            latitude: 0.0,
            longitude: 0.0,
        };
        let results = derive_provider_search_results(
            vec![
                provider(3.5, true, 0.0, 0.001),
                provider(4.9, true, 0.0, 0.02),
            ],
            center,
            ProviderFilter::BestRated,
            DEFAULT_PROVIDER_SEARCH_RADIUS_KM,
        );

        assert_eq!(results[0].provider.rating, 4.9);
    }

    #[test]
    fn closest_ordena_por_distancia_ascendente() {
        let center = Coordinate {
            latitude: 0.0,
            longitude: 0.0,
        };
        let results = derive_provider_search_results(
            vec![
                provider(4.9, true, 0.0, 0.02),
                provider(3.5, true, 0.0, 0.001),
            ],
            center,
            ProviderFilter::Closest,
            DEFAULT_PROVIDER_SEARCH_RADIUS_KM,
        );

        assert!(results[0].distance_km < results[1].distance_km);
    }
}
