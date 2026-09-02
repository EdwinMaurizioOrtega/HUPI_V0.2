import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getPublicProviderWalkProfile,
  type DogSize,
  type ProviderWalkProfile,
  type ServiceRequirement,
  type WalkType,
} from '@/domain/providerWalkProfile';
import type { BookableServiceId } from './services';
import { getRemoteProviders } from '@/data/remoteOverlay';
import { syncProviderRate } from '@/data/remoteWrites';

export type HupiLevel = 'Junior' | 'Senior' | 'Destacado';

export type MockProvider = {
  id: string;
  name: string;
  initials: string;
  isVerifiedByHupi: boolean;
  isOnline: boolean;
  averageResponseTimeMinutes: number;
  level: HupiLevel;
  rating: number;
  reviewCount: number;
  completedServices: number;
  distance: string;
  experienceYears: number;
  experience: string;
  diplomas: string[];
  services: string[];
  serviceTypes: BookableServiceId[];
  servicePrices: Record<BookableServiceId, number>;
  serviceConditions: Record<BookableServiceId, string[]>;
  serviceDetails: Record<BookableServiceId, string[]>;
  conditions: string[];
  zone: string;
  latitude: number;
  longitude: number;
  avatarColor: string;
  providerPhotoUri?: string;
  walkProfile: ProviderWalkProfile;
};

type MockProviderSeed = Omit<MockProvider, 'isVerifiedByHupi' | 'level' | 'walkProfile'> & {
  isVerifiedByHupi?: boolean;
  walkProfile?: ProviderWalkProfile;
};

// Coordenadas determinísticas de prueba para el MVP móvil. Representan el
// sector declarado por cada proveedor y se reemplazarán por datos del API.

export function getMockHupiLevel(completedServices: number, rating: number): HupiLevel {
  if (rating >= 4.8 && completedServices >= 100) {
    return 'Destacado';
  }

  if (completedServices >= 100) {
    return 'Senior';
  }

  return 'Junior';
}

function createMockProvider(provider: MockProviderSeed): MockProvider {
  return {
    ...provider,
    isVerifiedByHupi: provider.isVerifiedByHupi ?? true,
    level: getMockHupiLevel(provider.completedServices, provider.rating),
    walkProfile: provider.walkProfile ?? createPublishedWalkProfile(provider),
  };
}

function createPublishedWalkProfile(provider: MockProviderSeed): ProviderWalkProfile {
  const combined = `${provider.experience} ${provider.serviceDetails.walk.join(' ')} ${provider.services.join(' ')}`.toLocaleLowerCase();
  const acceptedDogSizes: DogSize[] = provider.id === 'provider-andres'
    ? ['medium', 'large']
    : provider.id === 'provider-sofia'
      ? ['small', 'medium']
      : provider.id === 'provider-camila'
        ? ['small']
        : ['medium', 'large'];
  const maximumDogsMatch = combined.match(/m[aá]ximo\s+(\d+)/);
  const maximumDogsPerWalk = Number(maximumDogsMatch?.[1] ?? 2);
  const walkTypes: WalkType[] = [
    ...(combined.includes('tranquil') || combined.includes('baja intensidad') ? ['calm' as const] : []),
    ...(combined.includes('activ') ? ['active' as const] : []),
    ...(combined.includes('urban') ? ['urban' as const] : []),
    ...(combined.includes('parque') ? ['park' as const] : []),
  ];
  const requirementText = provider.serviceConditions.walk.join(' ').toLocaleLowerCase();
  const requirements: ServiceRequirement[] = [
    ...(requirementText.includes('vacun') ? ['vaccines_current' as const] : []),
    ...(requirementText.includes('arnés') || requirementText.includes('arnes') || requirementText.includes('correa') || requirementText.includes('collar') ? ['secure_harness_or_collar' as const] : []),
    ...(requirementText.includes('identific') ? ['identification_tag' as const] : []),
    ...(requirementText.includes('comportamiento') || requirementText.includes('sociable') ? ['report_behavior_issues' as const] : []),
    ...(requirementText.includes('evaluación') || requirementText.includes('evaluacion') || requirementText.includes('encuentro inicial') ? ['prior_evaluation' as const] : []),
  ];
  const hourlyRate = provider.servicePrices.walk;

  return {
    description: provider.experience.trim().slice(0, 150),
    acceptedDogSizes,
    acceptedDogAges: combined.includes('cachorr') ? ['puppy', 'adult'] : ['adult'],
    maximumDogsPerWalk,
    modalities: maximumDogsPerWalk > 1 ? ['individual', 'group'] : ['individual'],
    walkTypes: walkTypes.length > 0 ? walkTypes : ['urban'],
    specialHandling: [
      ...(combined.includes('nervios') || combined.includes('tímid') ? ['nervous_dogs' as const] : []),
      ...(combined.includes('senior') ? ['reduced_mobility' as const] : []),
    ],
    requirements: requirements.length > 0 ? requirements : ['report_behavior_issues'],
    certifications: provider.diplomas.map((name, index) => ({
      id: `legacy-${provider.id}-${index}`,
      name,
      institution: '',
      year: null,
      status: 'draft',
    })),
    plans: [
      {
        id: `plan-${provider.id}-walk-0`, version: 1, name: 'Paseo individual de 1 hora', description: 'Paseo protegido con reporte al finalizar.', type: 'individual', durationMinutes: 60, walkCount: 1, frequencyType: 'customer_configurable', petsIncluded: 1, modality: 'individual', price: hourlyRate, includes: ['Paseo', 'Reporte al finalizar'], specificConditions: [], isAvailable: true, status: 'approved', updatedAt: '2026-08-05T12:00:00.000Z',
      },
      {
        id: `plan-${provider.id}-walk-1`, version: 1, name: 'Plan de 12 paseos', description: 'Rutina recurrente con frecuencia recomendada.', type: 'recurring', durationMinutes: 60, walkCount: 12, frequencyPerWeek: 3, frequencyType: 'recommended', validityDays: 30, petsIncluded: 1, modality: 'individual', price: Math.round(hourlyRate * 10.8 * 100) / 100, includes: ['12 paseos', 'Reporte en cada paseo'], specificConditions: [], isAvailable: true, status: 'approved', updatedAt: '2026-08-05T12:00:00.000Z',
      },
    ],
    terms: {
      id: `terms-${provider.id}-v1`,
      version: 1,
      effectiveDate: '2026-08-05',
      status: 'approved',
      fields: {
        freeRescheduleHours: 48,
        lateRescheduleWindowHours: 24,
        lateReschedulePenaltyPercent: 50,
        minimumCancellationHours: 24,
        lateCancellationPenaltyPercent: 100,
        maximumWaitingMinutes: 10,
        maximumDelayMinutes: 15,
        rainTreatment: 'reschedule',
        maximumContactAttempts: 2,
        planValidityDays: 30,
        walkRecoveryConditions: 'Sujeto a disponibilidad dentro de la vigencia del plan.',
        specificServiceConditions: 'La mascota debe contar con equipo seguro para el paseo.',
        operationalContactInstructions: 'Coordinar exclusivamente por el chat de Hupi.',
      },
    },
    status: 'approved',
  };
}

export const mockProviders: MockProvider[] = [
  createMockProvider({
    id: 'provider-andres',
    name: 'Andrés & Luna',
    initials: 'AL',
    rating: 4.9,
    reviewCount: 128,
    isOnline: true,
    averageResponseTimeMinutes: 5,
    completedServices: 342,
    distance: '0,8 km',
    experienceYears: 5,
    experience: 'Paseador especializado en perros medianos y grandes, con enfoque en rutinas activas y manejo amable.',
    diplomas: ['Primeros auxilios para mascotas', 'Manejo canino positivo', 'Bienestar animal'],
    services: ['Paseo individual', 'Niñera a domicilio', 'Guardería diurna', 'Hospedaje familiar'],
    serviceTypes: ['walk', 'sitter', 'daycare', 'boarding'],
    servicePrices: { walk: 12.5, sitter: 18, daycare: 27, boarding: 42 },
    serviceConditions: {
      walk: ['Vacunas al día', 'Arnés o collar seguro', 'Paseo máximo de 2 mascotas'],
      sitter: ['Rutina escrita', 'Llaves o acceso coordinado por Hupi', 'Visita previa opcional'],
      daycare: ['Mascota sociable', 'Entrada entre 08:00 y 10:00', 'Alimento identificado'],
      boarding: ['Vacunas al día', 'Cama o manta familiar', 'No hembras en celo'],
    },
    serviceDetails: {
      walk: ['Duración 1h o 2h', 'Manejo de perros medianos y grandes', 'Máximo 2 mascotas por salida', 'Experiencia en paseos urbanos activos'],
      sitter: ['Cuidado a domicilio', 'Horarios disponibles tarde y noche', 'Juego, agua, comida y reporte con fotos', 'Condiciones según rutina escrita'],
      daycare: ['Espacio familiar con patio', 'Horario 08:00 a 16:00', 'Máximo 5 mascotas por jornada', 'Supervisión permanente'],
      boarding: ['Noches disponibles entre semana', 'La mascota duerme dentro de casa', 'Incluye salidas cortas y paseo de rutina', 'Hogar sin jaulas'],
    },
    conditions: ['Vacunas al día', 'Arnés o collar seguro', 'Ficha de comportamiento completa'],
    zone: 'La Carolina, Quito',
    latitude: -0.1825,
    longitude: -78.483,
    avatarColor: '#614193',
  }),
  createMockProvider({
    id: 'provider-sofia',
    name: 'Sofía M.',
    initials: 'SM',
    rating: 4.8,
    reviewCount: 94,
    isOnline: false,
    averageResponseTimeMinutes: 20,
    completedServices: 218,
    distance: '1,2 km',
    experienceYears: 4,
    experience: 'Cuidadora y paseadora con experiencia en mascotas tímidas, cachorros y rutinas de socialización gradual.',
    diplomas: ['Cuidado responsable', 'Introducción al comportamiento canino'],
    services: ['Paseo individual', 'Paseo para cachorros', 'Niñera a domicilio', 'Guardería tranquila'],
    serviceTypes: ['walk', 'sitter', 'daycare'],
    servicePrices: { walk: 11, sitter: 20, daycare: 25, boarding: 46 },
    serviceConditions: {
      walk: ['Encuentro inicial', 'Correa identificada', 'Indicaciones de alimentación'],
      sitter: ['Cuidado mínimo 2 horas', 'Acceso coordinado por Hupi', 'Medicamentos solo con receta'],
      daycare: ['Mascotas pequeñas o medianas', 'Salida antes de las 17:00', 'Ficha de comportamiento completa'],
      boarding: ['Hospedaje sujeto a evaluación', 'Vacunas al día', 'Mascota habituada a interiores'],
    },
    serviceDetails: {
      walk: ['Duración 1h o 2h', 'Manejo amable de cachorros', 'Máximo 2 mascotas', 'Experiencia en socialización gradual'],
      sitter: ['Cuidado a domicilio', 'Horarios disponibles mañana y tarde', 'Juego, alimentación y acompañamiento', 'Ideal para mascotas tímidas'],
      daycare: ['Espacio interior tranquilo', 'Horario 09:00 a 17:00', 'Máximo 4 mascotas', 'Supervisión con reportes'],
      boarding: ['Noches limitadas bajo evaluación', 'Descanso dentro de casa', 'Paseos cortos incluidos', 'Hogar tranquilo'],
    },
    conditions: ['Encuentro inicial', 'Correa identificada', 'Indicaciones de alimentación'],
    zone: 'La Floresta, Quito',
    latitude: -0.2055,
    longitude: -78.482,
    avatarColor: '#e45336',
  }),
  createMockProvider({
    id: 'provider-mateo',
    name: 'Mateo R.',
    initials: 'MR',
    rating: 4.7,
    reviewCount: 61,
    isOnline: true,
    averageResponseTimeMinutes: 12,
    completedServices: 126,
    distance: '1,7 km',
    experienceYears: 3,
    experience: 'Paseador de barrio con horarios flexibles y experiencia en recorridos urbanos de baja y media intensidad.',
    diplomas: ['Seguridad durante el paseo', 'Introducción a primeros auxilios'],
    services: ['Paseo individual', 'Paseo tranquilo', 'Guardería por horas'],
    serviceTypes: ['walk', 'daycare'],
    servicePrices: { walk: 9.5, sitter: 16, daycare: 22, boarding: 38 },
    serviceConditions: {
      walk: ['Mascota sociable', 'Correa en buen estado', 'Contacto de emergencia'],
      sitter: ['Disponible solo por horas', 'Rutina simple', 'Acceso coordinado por Hupi'],
      daycare: ['Guardería por horas', 'Ingreso con alimento', 'Mascotas sociables'],
      boarding: ['No disponible por ahora', 'Pendiente de validación Hupi', 'Sin cupos nocturnos'],
    },
    serviceDetails: {
      walk: ['Duración 1h o 2h', 'Recorridos tranquilos', 'Máximo 2 mascotas', 'Experiencia en zonas urbanas'],
      sitter: ['Cuidado puntual', 'Horarios flexibles', 'Acompañamiento básico', 'Solo servicios cercanos'],
      daycare: ['Espacio de día por horas', 'Horario 10:00 a 16:00', 'Máximo 3 mascotas', 'Supervisión directa'],
      boarding: ['Noches no activas', 'Sin cupos de hospedaje', 'Paseos no incluidos', 'Pendiente de aprobación'],
    },
    conditions: ['Mascota sociable', 'Correa en buen estado', 'Contacto de emergencia'],
    zone: 'Iñaquito, Quito',
    latitude: -0.1785,
    longitude: -78.4805,
    avatarColor: '#32966f',
  }),
  createMockProvider({
    id: 'provider-camila',
    name: 'Camila & Nala',
    initials: 'CN',
    rating: 4.6,
    reviewCount: 28,
    isOnline: false,
    averageResponseTimeMinutes: 75,
    completedServices: 54,
    distance: '2,1 km',
    experienceYears: 2,
    experience: 'Paseadora entusiasta con experiencia en perros pequeños y mascotas con movilidad reducida.',
    diplomas: ['Cuidado de mascotas senior'],
    services: ['Paseo tranquilo', 'Visita a domicilio', 'Hospedaje para mascotas senior'],
    serviceTypes: ['walk', 'sitter', 'boarding'],
    servicePrices: { walk: 8, sitter: 17, daycare: 21, boarding: 36 },
    serviceConditions: {
      walk: ['Rutina detallada', 'Identificación visible', 'Paseo máximo de 60 minutos'],
      sitter: ['Cuidado para mascotas senior', 'Indicaciones médicas claras', 'Contacto de emergencia activo'],
      daycare: ['Guardería bajo evaluación', 'Rutina tranquila', 'Sin grupos grandes'],
      boarding: ['Mascotas pequeñas o senior', 'Vacunas al día', 'Alimento y medicina identificados'],
    },
    serviceDetails: {
      walk: ['Duración 1h', 'Manejo de perros pequeños y senior', 'Máximo 1 mascota senior', 'Paseos de baja intensidad'],
      sitter: ['Cuidado a domicilio', 'Horarios disponibles tarde', 'Acompañamiento y medicación indicada', 'Condiciones para mascotas senior'],
      daycare: ['Espacio tranquilo bajo evaluación', 'Horario reducido', 'Máximo 2 mascotas', 'Supervisión cercana'],
      boarding: ['Noches disponibles fines de semana', 'La mascota duerme en sala interior', 'Salidas cortas incluidas', 'Hogar tranquilo sin grupos grandes'],
    },
    conditions: ['Rutina detallada', 'Identificación visible', 'Paseo máximo de 60 minutos'],
    zone: 'Cumbayá, Quito',
    latitude: -0.2002,
    longitude: -78.4297,
    isVerifiedByHupi: false,
    avatarColor: '#d69b28',
  }),
];

let providerPhotoState: Record<string, string | undefined> = {};
const PROVIDER_SERVICE_PRICES_KEY = 'hupi.mockProviderServicePrices.v1';
let providerPricingInitialized = false;
let providerPricingInitialization: Promise<void> | null = null;
const providerPricingListeners = new Set<() => void>();

function emitProviderPricing() {
  providerPricingListeners.forEach((listener) => listener());
}

export function subscribeMockProviderPricing(listener: () => void) {
  providerPricingListeners.add(listener);
  return () => {
    providerPricingListeners.delete(listener);
  };
}

export function initializeMockProviderPricing() {
  if (providerPricingInitialized) return Promise.resolve();
  if (providerPricingInitialization) return providerPricingInitialization;

  providerPricingInitialization = AsyncStorage.getItem(PROVIDER_SERVICE_PRICES_KEY)
    .then((stored) => {
      if (!stored) return;
      const parsed = JSON.parse(stored) as Record<string, Partial<Record<BookableServiceId, number>>>;
      mockProviders.forEach((provider) => {
        const savedPrices = parsed[provider.id];
        if (!savedPrices) return;
        Object.entries(savedPrices).forEach(([serviceId, price]) => {
          if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
            provider.servicePrices[serviceId as BookableServiceId] = price;
          }
        });
      });
    })
    .catch((error) => {
      if (__DEV__) console.warn('[mock-provider-pricing] No se pudo cargar la tarifa local.', error);
    })
    .finally(() => {
      providerPricingInitialized = true;
      providerPricingInitialization = null;
      emitProviderPricing();
    });

  return providerPricingInitialization;
}

export function saveMockProviderServicePrice(providerId: string, serviceId: BookableServiceId, price: number) {
  if (!Number.isFinite(price) || price <= 0) return false;
  const normalizedPrice = Math.round((price + Number.EPSILON) * 100) / 100;
  const provider = mockProviders.find((item) => item.id === providerId);
  if (!provider) return false;

  provider.servicePrices[serviceId] = normalizedPrice;
  emitProviderPricing();
  syncProviderRate(serviceId, normalizedPrice);

  const persisted = Object.fromEntries(mockProviders.map((item) => [item.id, item.servicePrices]));
  void AsyncStorage.setItem(PROVIDER_SERVICE_PRICES_KEY, JSON.stringify(persisted)).catch((error) => {
    if (__DEV__) console.warn('[mock-provider-pricing] No se pudo guardar la tarifa local.', error);
  });
  return true;
}

export function getMockProviderPhotoUri(providerId: string) {
  return providerPhotoState[providerId] ?? mockProviders.find((provider) => provider.id === providerId)?.providerPhotoUri;
}

export function saveMockProviderPhotoUri(providerId: string, providerPhotoUri?: string) {
  providerPhotoState = { ...providerPhotoState, [providerId]: providerPhotoUri };
  return getMockProviderPhotoUri(providerId);
}

export function getMockServiceProviders(serviceId: BookableServiceId) {
  const available = mockProviders.filter((provider) => (
    provider.serviceTypes.includes(serviceId)
    && (serviceId !== 'walk' || Boolean(getPublicProviderWalkProfile(provider.walkProfile, provider.servicePrices.walk, provider.zone)))
  ));

  // Con backend configurado la lista viva manda; si no, se usan los mocks.
  const remote = getRemoteProviders(mockProviders);
  if (!remote) return available;

  return remote.filter((provider) => provider.serviceTypes.includes(serviceId));
}

export function getMockProviderServicePrice(provider: MockProvider, serviceId: BookableServiceId) {
  return provider.servicePrices[serviceId];
}

export const hupiLevels: Record<HupiLevel, { description: string }> = {
  Junior: { description: 'Proveedor verificado que está construyendo su historial en Hupi.' },
  Senior: { description: 'Proveedor con amplia experiencia y más de 100 servicios realizados.' },
  Destacado: { description: 'Proveedor con excelente calificación y alto historial de servicios.' },
};
