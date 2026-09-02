export type MockProviderReview = {
  id: string;
  providerId: string;
  customerDisplayName: string;
  createdAt: string;
  rating: number;
  comment: string;
  service?: string;
};

export type MockProviderReviewSummary = {
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  reviews: MockProviderReview[];
};

const summaries: Record<string, MockProviderReviewSummary> = {
  'provider-andres': {
    distribution: { 1: 0, 2: 0, 3: 1, 4: 10, 5: 117 },
    reviews: [
      { id: 'provider-review-andres-1', providerId: 'provider-andres', customerDisplayName: 'Valentina P.', createdAt: '2026-06-28', rating: 5, comment: 'Milo regresó tranquilo y recibí el reporte completo del paseo.', service: 'Paseo individual' },
      { id: 'provider-review-andres-2', providerId: 'provider-andres', customerDisplayName: 'Carolina M.', createdAt: '2026-06-19', rating: 5, comment: 'Muy puntual y cuidadoso con las indicaciones de la mascota.', service: 'Paseo individual' },
      { id: 'provider-review-andres-3', providerId: 'provider-andres', customerDisplayName: 'Diego P.', createdAt: '2026-06-02', rating: 4, comment: 'Buena comunicación antes y después del servicio.', service: 'Plan de paseos' },
    ],
  },
  'provider-sofia': {
    distribution: { 1: 0, 2: 0, 3: 3, 4: 13, 5: 78 },
    reviews: [
      { id: 'provider-review-sofia-1', providerId: 'provider-sofia', customerDisplayName: 'Ana R.', createdAt: '2026-06-25', rating: 5, comment: 'Tuvo mucha paciencia y respetó la rutina de socialización.', service: 'Paseo para cachorros' },
      { id: 'provider-review-sofia-2', providerId: 'provider-sofia', customerDisplayName: 'Mateo V.', createdAt: '2026-06-11', rating: 5, comment: 'Excelente comunicación y trato amable.', service: 'Paseo individual' },
    ],
  },
  'provider-mateo': {
    distribution: { 1: 0, 2: 0, 3: 2, 4: 13, 5: 46 },
    reviews: [
      { id: 'provider-review-mateo-1', providerId: 'provider-mateo', customerDisplayName: 'Lucía G.', createdAt: '2026-06-20', rating: 5, comment: 'El recorrido fue tranquilo y llegó a la hora acordada.', service: 'Paseo tranquilo' },
      { id: 'provider-review-mateo-2', providerId: 'provider-mateo', customerDisplayName: 'J. C.', createdAt: '2026-05-30', rating: 4, comment: 'Buen servicio y seguimiento por el chat de Hupi.', service: 'Paseo individual' },
    ],
  },
  'provider-camila': {
    distribution: { 1: 0, 2: 0, 3: 2, 4: 8, 5: 18 },
    reviews: [
      { id: 'provider-review-camila-1', providerId: 'provider-camila', customerDisplayName: 'María S.', createdAt: '2026-06-14', rating: 5, comment: 'Atenta con el ritmo de mi mascota y muy clara al coordinar.', service: 'Paseo tranquilo' },
      { id: 'provider-review-camila-2', providerId: 'provider-camila', customerDisplayName: 'P. A.', createdAt: '2026-05-22', rating: 4, comment: 'Servicio cuidadoso y reporte al finalizar.', service: 'Paseo individual' },
    ],
  },
};

const emptySummary: MockProviderReviewSummary = {
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  reviews: [],
};

/**
 * Resolutor de reseñas del backend.
 *
 * Se inyecta desde fuera en vez de importarse: este módulo lo carga la suite de
 * tests directamente con Node, que no resuelve los alias ni las dependencias de
 * Expo.
 */
type ProviderReviewsResolver = (providerId: string) => MockProviderReviewSummary | null;

let resolveRemoteReviews: ProviderReviewsResolver = () => null;

export function setProviderReviewsResolver(resolver: ProviderReviewsResolver) {
  resolveRemoteReviews = resolver;
}

export function getMockProviderReviewSummary(providerId: string): MockProviderReviewSummary {
  const remote = resolveRemoteReviews(providerId);
  if (remote) return remote;

  const summary = summaries[providerId] ?? emptySummary;
  return {
    distribution: { ...summary.distribution },
    reviews: summary.reviews.map((review) => ({ ...review })),
  };
}
