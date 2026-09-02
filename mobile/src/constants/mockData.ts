import { CAT_BREEDS, DOG_BREEDS } from './petBreeds';
import { colors } from './colors';
import { getCachedPetHistory, primePetHistory } from '@/data/hupiApi';
import { getRemoteConversations, getRemoteMessages, getRemotePets, getRemoteSupportTickets } from '@/data/remoteOverlay';
import {
  syncBillingProfile,
  syncCloseTicket,
  syncCreateOffer,
  syncCreateTicket,
  syncDeletePaymentMethod,
  syncFavorite,
  syncOfferAction,
  syncPaymentMethod,
  syncSavePet,
  syncTicketMessage,
} from '@/data/remoteWrites';
import { isBookableServiceEnabled, isServiceEnabled } from './features';
import { calculateMockPayment, getMockBookingDetails } from './mockCheckout';
import { mockProviders } from './mockProviders';
import type { MockBooking } from './mockBookings';
import { type BookableServiceId, type ServiceId, serviceCopy } from './services';
import {
  DEFAULT_ADDRESSES,
  DEFAULT_CUSTOMER_PROFILE,
  deleteLocalAddress,
  getLocalAccountSnapshot,
  saveLocalAddress,
  saveLocalCustomerProfile,
  setDefaultLocalAddress,
} from '@/data/localAccountRepository';
import type { Address, AddressDeliveryPreferences } from '@/domain/address';
import type { CustomerProfile } from '@/domain/profile';
import { getPublicProviderWalkProfile, isPublicProviderWalkPlan } from '@/domain/providerWalkProfile';

export const mockUser = {
  id: 'user-001',
  firstName: 'Valentina',
  lastName: 'Paredes',
  email: 'valentina@hupi.ec',
  phone: '+593 99 123 4567',
  location: 'La Carolina, Quito',
};

export const mockPet = {
  id: 'pet-001',
  name: 'Milo',
  breed: 'Golden retriever',
  age: '3',
  weight: '28',
  energy: 'Alta',
  emoji: '🐕',
};

export type MockCustomerProfile = CustomerProfile;

export type MockPaymentMethod = {
  id: string;
  brand: 'Visa' | 'Mastercard';
  last4: string;
  holderName: string;
  expiry: string;
  isDefault: boolean;
};

export type MockAddress = Address;

export type MockBillingProfile = {
  id: string;
  taxpayerType: string;
  identificationType: string;
  identificationNumber: string;
  nameOrBusinessName: string;
  billingEmail: string;
  contactPhone: string;
  fiscalAddress: string;
  isDefault?: boolean;
};

export type MockPetProfile = {
  id: string;
  code: string;
  avatar: string;
  petPhotoUri?: string;
  name: string;
  species: '' | 'Perro' | 'Gato';
  breed: string;
  birthday: string;
  age: string;
  weight: string;
  sex: string;
  size: '' | 'Pequeño' | 'Mediano' | 'Grande' | 'Muy grande';
  physicalActivity: '' | 'Muy baja' | 'Baja' | 'Media' | 'Alta';
  behavior: string;
  behaviorDescription: string;
  bites: boolean | null;
  allergies: string;
  medications: string;
  veterinarianName: string;
  clinicName: string;
  emergencyContact: {
    name: string;
    countryCode: string;
    phone: string;
    nationalNumber?: string;
    displayNumber?: string;
    normalizedPhone?: string;
  };
  careInstructions: string;
  vaccinesUpToDate: boolean;
  sterilized: boolean;
  vaccineCardFileName?: string;
  vaccineCardUri?: string;
  vaccineCardMimeType?: string;
};

export type MockPetStats = {
  petId: string;
  walksCompleted: number;
  walkingHours: number;
  monthlyServices: number;
  completedServices: number;
  nextService: string;
  lastService: string;
  favoriteProvider: string;
  averageRating: string;
};

export type MockPetServiceHistoryItem = {
  id: string;
  bookingId: string;
  petId: string;
  title: string;
  date: string;
  provider: string;
  status: string;
  detail: string;
  dateIso: string;
};

export const mockCustomerProfile: MockCustomerProfile = DEFAULT_CUSTOMER_PROFILE;

export const mockPaymentMethods: MockPaymentMethod[] = [
  { id: 'pay-visa-4242', brand: 'Visa', last4: '4242', holderName: 'Valentina Paredes', expiry: '09/29', isDefault: true },
  { id: 'pay-master-7788', brand: 'Mastercard', last4: '7788', holderName: 'Valentina Paredes', expiry: '04/28', isDefault: false },
];

export const mockDogBreeds = DOG_BREEDS;
export const mockCatBreeds = CAT_BREEDS;

export const mockCountryCodes = [
  { country: 'Ecuador', code: '+593' },
  { country: 'Colombia', code: '+57' },
  { country: 'Perú', code: '+51' },
  { country: 'Estados Unidos', code: '+1' },
  { country: 'México', code: '+52' },
  { country: 'Chile', code: '+56' },
  { country: 'Argentina', code: '+54' },
  { country: 'España', code: '+34' },
];

export const mockAddresses: MockAddress[] = DEFAULT_ADDRESSES;

export const mockPets: MockPetProfile[] = [
  {
    id: 'pet-001',
    code: '2049001001',
    avatar: '🐕',
    name: 'Milo',
    species: 'Perro',
    breed: 'Golden retriever',
    birthday: '09/07/2023',
    age: '3',
    weight: '28',
    sex: 'Macho',
    size: 'Grande',
    physicalActivity: 'Alta',
    behavior: 'Social',
    behaviorDescription: 'Se emociona al conocer otros perros y responde bien con premios.',
    bites: false,
    allergies: 'Polvo y algunos shampoos perfumados',
    medications: 'Ninguno',
    veterinarianName: 'Dra. Paula Ríos',
    clinicName: 'Vet Norte',
    emergencyContact: {
      name: 'Andrea Paredes',
      countryCode: '+593',
      phone: '0981112233',
      nationalNumber: '981112233',
      displayNumber: '0981112233',
      normalizedPhone: '+593981112233',
    },
    careInstructions: 'Usar arnés morado, evitar correr al inicio del paseo y ofrecer agua al final.',
    vaccinesUpToDate: true,
    sterilized: true,
    vaccineCardFileName: 'carnet-milo.pdf',
  },
];

export const mockPetStats: MockPetStats[] = [
  {
    petId: 'pet-001',
    walksCompleted: 18,
    walkingHours: 21,
    monthlyServices: 4,
    completedServices: 23,
    nextService: 'Paseo · 18 Jul 2026',
    lastService: 'Guardería · 9 Jul 2026',
    favoriteProvider: 'Andrés & Luna',
    averageRating: '4.9',
  },
];

export const mockPetServiceHistory: MockPetServiceHistoryItem[] = [
  { id: 'hist-001', bookingId: 'booking-walk-004', petId: 'pet-001', title: 'Paseo realizado', date: '28 Jun 2026', dateIso: '2026-06-28', provider: 'Andrés & Luna', status: 'Finalizado', detail: '60 minutos en La Carolina.' },
  { id: 'hist-002', bookingId: 'booking-daycare-002', petId: 'pet-001', title: 'Guardería', date: '4 Jul 2026', dateIso: '2026-07-04', provider: 'Casa Colitas', status: 'Finalizado', detail: 'Día completo con socialización controlada.' },
  { id: 'hist-003', bookingId: 'booking-boarding-005', petId: 'pet-001', title: 'Hospedaje', date: '20 Jun 2026', dateIso: '2026-06-20', provider: 'Patitas Hotel', status: 'Finalizado', detail: 'Dos noches sin novedades.' },
];

let paymentMethodsState = mockPaymentMethods.map((item) => ({ ...item }));
let petsState = mockPets.map((item) => ({ ...item }));
let selectedServicePetId = petsState[0]?.id ?? null;

export function getMockCustomerProfile() {
  return { ...getLocalAccountSnapshot().profile };
}

export function saveMockCustomerProfile(profile: MockCustomerProfile) {
  return saveLocalCustomerProfile(profile);
}

export function getMockPaymentMethods() {
  return paymentMethodsState.map((item) => ({ ...item }));
}

export function saveMockPaymentMethod(method: MockPaymentMethod) {
  const exists = paymentMethodsState.some((item) => item.id === method.id);
  paymentMethodsState = exists
    ? paymentMethodsState.map((item) => item.id === method.id ? { ...method } : item)
    : [...paymentMethodsState, { ...method }];
  if (method.isDefault) {
    paymentMethodsState = paymentMethodsState.map((item) => ({ ...item, isDefault: item.id === method.id }));
  }

  const [month, year] = method.expiry.split('/');
  syncPaymentMethod({
    // El prototipo no integra pasarela: el identificador local hace de token.
    gatewayToken: method.id,
    brand: method.brand,
    last4: method.last4,
    holderName: method.holderName,
    expiryMonth: Number(month) || 1,
    expiryYear: Number(year) || 0,
    isDefault: method.isDefault,
  });

  return getMockPaymentMethods();
}

export function deleteMockPaymentMethod(methodId: string) {
  paymentMethodsState = paymentMethodsState.filter((item) => item.id !== methodId);
  if (paymentMethodsState.length > 0 && !paymentMethodsState.some((item) => item.isDefault)) {
    paymentMethodsState[0] = { ...paymentMethodsState[0], isDefault: true };
  }
  syncDeletePaymentMethod(methodId);
  return getMockPaymentMethods();
}

export function setDefaultMockPaymentMethod(methodId: string) {
  paymentMethodsState = paymentMethodsState.map((item) => ({ ...item, isDefault: item.id === methodId }));
  return getMockPaymentMethods();
}

export function getMockAddresses() {
  return getLocalAccountSnapshot().addresses.map((item) => ({ ...item }));
}

export function saveMockAddress(address: MockAddress) {
  return saveLocalAddress(address);
}

export function deleteMockAddress(addressId: string) {
  return deleteLocalAddress(addressId);
}

export function setDefaultMockAddress(addressId: string) {
  return setDefaultLocalAddress(addressId);
}

export function getMockPets() {
  return getRemotePets(petsState) ?? petsState.map((item) => ({ ...item }));
}

export function getMockPetById(petId?: string) {
  const pets = getMockPets();
  const pet = pets.find((item) => item.id === petId) ?? pets[0];
  return pet ? { ...pet } : undefined;
}

export function saveMockPet(pet: MockPetProfile) {
  const exists = petsState.some((item) => item.id === pet.id);
  petsState = exists
    ? petsState.map((item) => item.id === pet.id ? { ...pet } : item)
    : [...petsState, { ...pet }];
  if (!selectedServicePetId) {
    selectedServicePetId = pet.id;
  }

  syncSavePet(
    {
      name: pet.name,
      species: pet.species || undefined,
      breed: pet.breed || undefined,
      sex: pet.sex || undefined,
      size: pet.size || undefined,
      weightKg: Number.parseFloat(String(pet.weight)) || undefined,
      allergies: pet.allergies || undefined,
      medications: pet.medications || undefined,
      careInstructions: pet.careInstructions || undefined,
      veterinarianName: pet.veterinarianName || undefined,
      clinicName: pet.clinicName || undefined,
      vaccinesUpToDate: pet.vaccinesUpToDate,
      sterilized: pet.sterilized,
    },
    exists ? pet.id : undefined,
  );

  return getMockPets();
}

export function deleteMockPet(petId: string) {
  petsState = petsState.filter((item) => item.id !== petId);
  if (selectedServicePetId === petId) {
    selectedServicePetId = petsState[0]?.id ?? null;
  }
  return getMockPets();
}

export function generateMockPetCode() {
  const base = 2049001000 + petsState.length + 1;
  return String(base).padStart(10, '0').slice(-10);
}

export function getMockPetStats(petId?: string) {
  const targetPetId = petId ?? selectedServicePetId ?? petsState[0]?.id;
  return mockPetStats.find((item) => item.petId === targetPetId) ?? {
    petId: targetPetId ?? 'pet-empty',
    walksCompleted: 0,
    walkingHours: 0,
    monthlyServices: 0,
    completedServices: 0,
    nextService: 'Sin reservas próximas',
    lastService: 'Sin servicios registrados',
    favoriteProvider: 'Sin proveedor favorito',
    averageRating: '0.0',
  };
}

export function getMockPetServiceHistory(petId?: string) {
  const targetPetId = petId ?? selectedServicePetId ?? petsState[0]?.id;
  const remote = targetPetId ? getCachedPetHistory(targetPetId) : null;

  if (remote) {
    return remote.map((item) => ({
      id: item.bookingId,
      bookingId: item.referenceCode ?? item.bookingId,
      petId: targetPetId as string,
      title: item.title,
      date: item.date.slice(0, 10),
      dateIso: item.date.slice(0, 10),
      provider: item.provider,
      status: item.status,
      detail: '',
    }));
  }

  if (targetPetId) primePetHistory(targetPetId);

  return mockPetServiceHistory.filter((item) => (
    item.petId === targetPetId
    && !['Guardería', 'Hospedaje', 'Peluquería', 'Niñera', 'Adiestramiento'].some((service) => item.title.includes(service))
  ));
}

export function setSelectedServicePet(petId: string) {
  selectedServicePetId = petId;
}

export function getSelectedServicePet() {
  return getMockPetById(selectedServicePetId ?? undefined);
}

export const mockBanners = [
  {
    id: 'banner-1',
    eyebrow: 'BIENVENIDA',
    title: 'Su primera aventura tiene 20% off',
    subtitle: 'Usa HUPI20 en tu primera reserva.',
    backgroundColor: '#614193',
    accent: '🐾',
  },
  {
    id: 'banner-2',
    eyebrow: 'CONSEJO HUPI',
    title: 'Rutinas felices, mascotas tranquilas',
    subtitle: 'Agenda paseos recurrentes para Milo.',
    backgroundColor: '#e45336',
    accent: '☀️',
  },
];

export const mockReservations = {
  upcoming: [
    {
      id: 'booking-1',
      service: 'Paseo',
      provider: 'Andrés & Luna',
      date: 'Hoy, 17:30',
      pet: 'Milo',
      status: 'Confirmada',
      color: '#e45336',
    },
    {
      id: 'booking-2',
      service: 'Hogar guardería',
      provider: 'Casa Colitas',
      date: 'Sáb 12 Jul, 08:00',
      pet: 'Milo',
      status: 'Pendiente',
      color: '#614193',
    },
  ],
  history: [
    {
      id: 'booking-3',
      service: 'Niñera a domicilio',
      provider: 'Sofía M.',
      date: '28 Jun, 14:00',
      pet: 'Milo',
      status: 'Completada',
      color: '#32966f',
    },
    {
      id: 'booking-4',
      service: 'Paseo',
      provider: 'Andrés & Luna',
      date: '21 Jun, 09:30',
      pet: 'Milo',
      status: 'Completada',
      color: '#32966f',
    },
  ],
};

export const mockProducts = [
  {
    id: 'product-1',
    name: 'Snack natural de pollo',
    brand: 'Hupi Bites',
    taxRate: 15,
    storeId: 'store-hupi-bites',
    storeName: 'Hupi Bites',
    isVerifiedByHupi: true,
    isOfficialStore: true,
    category: 'Snacks',
    price: '$8.90',
    cardPrice: 8.9,
    transferPrice: 7.99,
    discount: 10,
    rating: '4.9',
    emoji: '🦴',
    color: '#fff0ec',
    description: 'Premios suaves con proteína real para entrenamientos, paseos y momentos felices.',
    benefits: ['Ingredientes naturales', 'Sin colorantes artificiales', 'Ideal para entrenamiento'],
    variations: {
      size: ['100 g', '250 g', '500 g'],
      flavor: ['Pollo', 'Pavo', 'Res'],
    },
    shipping: 'Entrega estimada en 24 a 48 horas en zonas habilitadas.',
  },
  {
    id: 'product-2',
    name: 'Arnés urbano ajustable',
    brand: 'Urban Pet',
    taxRate: 15,
    storeId: 'store-urban-pet',
    storeName: 'Urban Pet',
    isVerifiedByHupi: true,
    isOfficialStore: false,
    category: 'Accesorios',
    price: '$24.50',
    cardPrice: 24.5,
    transferPrice: 22.99,
    discount: 6,
    rating: '4.8',
    emoji: '🦮',
    color: '#f0ebf7',
    description: 'Arnés cómodo y resistente para paseos diarios con ajuste seguro en pecho y abdomen.',
    benefits: ['Material respirable', 'Ajuste seguro', 'Argolla reforzada'],
    variations: {
      size: ['S', 'M', 'L'],
      color: ['Coral', 'Morado', 'Negro'],
    },
    shipping: 'Disponible para envío estándar o retiro coordinado por Hupi.',
  },
  {
    id: 'product-3',
    name: 'Cama nube mediana',
    brand: 'Casa Colitas',
    taxRate: 15,
    storeId: 'store-casa-colitas',
    storeName: 'Casa Colitas',
    isVerifiedByHupi: true,
    isOfficialStore: false,
    category: 'Accesorios',
    price: '$39.00',
    cardPrice: 39,
    transferPrice: 36.5,
    discount: 0,
    rating: '4.7',
    emoji: '☁️',
    color: '#f9f9e2',
    description: 'Cama acolchada de descanso diario con funda suave y base antideslizante.',
    benefits: ['Funda lavable', 'Base antideslizante', 'Soporte cómodo'],
    variations: {
      size: ['M', 'L'],
      color: ['Beige', 'Gris', 'Coral'],
    },
    shipping: 'Producto voluminoso con entrega estimada de 2 a 3 días.',
  },
  {
    id: 'product-4',
    name: 'Pelota resistente coral',
    brand: 'Play Hupi',
    taxRate: 0,
    storeId: 'store-kong',
    storeName: 'KONG',
    isVerifiedByHupi: true,
    isOfficialStore: true,
    category: 'Juguetes',
    price: '$6.75',
    cardPrice: 6.75,
    transferPrice: 5.99,
    discount: 12,
    rating: '4.9',
    emoji: '🎾',
    color: '#fff0ec',
    description: 'Juguete resistente para juego activo, rebote controlado y mordidas moderadas.',
    benefits: ['Material durable', 'Fácil de limpiar', 'Color visible'],
    variations: {
      size: ['Pequeña', 'Mediana'],
      color: ['Coral', 'Verde'],
    },
    shipping: 'Entrega rápida junto con otros productos del carrito.',
  },
  {
    id: 'product-5',
    name: 'Alimento premium adulto',
    brand: 'NutriPet',
    taxRate: 15,
    storeId: 'store-royal-canin',
    storeName: 'Royal Canin',
    isVerifiedByHupi: true,
    isOfficialStore: true,
    category: 'Alimentos',
    price: '$18.99',
    cardPrice: 18.99,
    transferPrice: 17.5,
    discount: 8,
    rating: '4.8',
    emoji: '🥣',
    color: '#f9f9e2',
    description: 'Alimento balanceado para perros adultos con proteína de alta digestibilidad.',
    benefits: ['Proteína balanceada', 'Vitaminas esenciales', 'Saco resellable'],
    variations: {
      size: ['2 kg', '7 kg', '15 kg'],
      flavor: ['Pollo y arroz', 'Cordero'],
    },
    shipping: 'Envío estándar con manipulación cuidadosa para alimentos.',
  },
  {
    id: 'product-6',
    name: 'Shampoo hipoalergénico',
    brand: 'Clean Paw',
    taxRate: 15,
    storeId: 'store-clean-paw',
    storeName: 'Clean Paw',
    isVerifiedByHupi: true,
    isOfficialStore: false,
    category: 'Higiene y limpieza',
    price: '$12.99',
    cardPrice: 12.99,
    transferPrice: 11.99,
    discount: 0,
    rating: '4.6',
    emoji: '🧴',
    color: '#f0ebf7',
    description: 'Shampoo suave para baños frecuentes y piel sensible.',
    benefits: ['pH balanceado', 'Aroma suave', 'Para piel sensible'],
    variations: {
      size: ['250 ml', '500 ml'],
    },
    shipping: 'Protección anti derrames incluida en el empaque.',
  },
  {
    id: 'product-7',
    name: 'Suplemento piel y pelaje',
    brand: 'WellPet',
    taxRate: 0,
    storeId: 'store-royal-canin',
    storeName: 'Royal Canin',
    isVerifiedByHupi: true,
    isOfficialStore: true,
    category: 'Salud y bienestar',
    price: '$15.90',
    cardPrice: 15.9,
    transferPrice: 14.5,
    discount: 5,
    rating: '4.7',
    emoji: '💊',
    color: '#fff0ec',
    description: 'Suplemento con omega y vitaminas para apoyar piel y pelaje.',
    benefits: ['Omega 3 y 6', 'Apoyo nutricional', 'Formato fácil de dosificar'],
    variations: {
      size: ['30 unidades', '60 unidades'],
    },
    shipping: 'Entrega con recomendación de conservar en lugar fresco.',
  },
];

export const mockOfficialStores = [
  {
    id: 'store-kong',
    name: 'KONG',
    logo: '🧸',
    isVerifiedByHupi: true,
    isOfficialStore: true,
    category: 'Juguetes',
    productCount: 18,
    rating: '4.9',
    providerRating: '4.9',
    providerReviewsCount: 320,
    completedOrders: 1240,
    description: 'Juguetes resistentes y enriquecimiento para mascotas activas.',
    categories: ['Juguetes', 'Accesorios'],
    availableShippingMethods: ['standard', 'express', 'pickup'],
  },
  {
    id: 'store-hupi-bites',
    name: 'Hupi Bites',
    logo: '🦴',
    isVerifiedByHupi: true,
    isOfficialStore: true,
    category: 'Snacks',
    productCount: 12,
    rating: '4.9',
    providerRating: '4.9',
    providerReviewsCount: 280,
    completedOrders: 980,
    description: 'Snacks naturales seleccionados por Hupi para entrenar y premiar.',
    categories: ['Snacks', 'Productos naturales'],
    availableShippingMethods: ['standard', 'express'],
  },
  {
    id: 'store-royal-canin',
    name: 'Royal Canin',
    logo: '🥣',
    isVerifiedByHupi: true,
    isOfficialStore: true,
    category: 'Alimentos',
    productCount: 24,
    rating: '4.8',
    providerRating: '4.8',
    providerReviewsCount: 410,
    completedOrders: 1850,
    description: 'Alimentos especializados para distintas etapas y necesidades.',
    categories: ['Alimentos', 'Veterinaria'],
    availableShippingMethods: ['standard'],
  },
  {
    id: 'store-clean-paw',
    name: 'Clean Paw',
    logo: '🧴',
    isVerifiedByHupi: true,
    isOfficialStore: false,
    category: 'Higiene y limpieza',
    productCount: 9,
    rating: '4.7',
    providerRating: '4.7',
    providerReviewsCount: 96,
    completedOrders: 380,
    description: 'Higiene suave para rutinas de baño y cuidado diario.',
    categories: ['Higiene y limpieza', 'Accesorios'],
    availableShippingMethods: ['standard', 'pickup'],
  },
  {
    id: 'store-urban-pet',
    name: 'Urban Pet',
    logo: '🦮',
    isVerifiedByHupi: true,
    isOfficialStore: false,
    category: 'Accesorios',
    productCount: 15,
    rating: '4.8',
    providerRating: '4.8',
    providerReviewsCount: 180,
    completedOrders: 720,
    description: 'Accesorios urbanos, cómodos y seguros para paseos.',
    categories: ['Accesorios', 'Juguetes'],
    availableShippingMethods: ['standard', 'express', 'pickup'],
  },
];

export const mockReviewTags = [
  'Buena calidad',
  'A mi mascota le encantó',
  'Llegó rápido',
  'Buen precio',
  'Recomendado',
];

export const mockSupportReasons = [
  'Mi pedido no llega',
  'Problema con el pedido',
  'Producto incorrecto',
  'Producto dañado',
  'Problema con el pago',
  'Necesito cambiar dirección',
  'Otro motivo',
];

export const mockSupportTickets: MockSupportTicket[] = [
  {
    id: 'ticket-inc-2049',
    caseNumber: 'INC-2049',
    reason: 'Comprobante de pago',
    status: 'En revisión',
    createdAt: '2026-07-09 11:12',
    relatedOrderNumber: 'HUPI-MK-2049',
    description: 'Necesito validar el comprobante del pedido.',
    lastSupportMessage: 'Estamos revisando la información y te responderemos en máximo 24 horas.',
    history: [
      {
        id: 'ticket-inc-2049-1',
        author: 'Cliente',
        message: 'Adjunto el comprobante correcto para revisión.',
        createdAt: '2026-07-09 11:05',
      },
      {
        id: 'ticket-inc-2049-2',
        author: 'Soporte Hupi',
        message: 'Estamos revisando la información y te responderemos en máximo 24 horas.',
        createdAt: '2026-07-09 11:12',
      },
    ],
  },
  {
    id: 'ticket-inc-2050',
    caseNumber: 'INC-2050',
    reason: 'Reembolso o Saldo Hupi',
    status: 'Abierto',
    createdAt: '2026-07-10 09:24',
    relatedOrderNumber: 'HUPI-MK-2055',
    description: 'Necesito revisar si aplica saldo Hupi.',
    lastSupportMessage: 'Nuestro equipo revisará el detalle del caso.',
    history: [
      {
        id: 'ticket-inc-2050-1',
        author: 'Cliente',
        message: 'Necesito revisar si aplica saldo Hupi.',
        createdAt: '2026-07-10 09:21',
      },
      {
        id: 'ticket-inc-2050-2',
        author: 'Soporte Hupi',
        message: 'Nuestro equipo revisará el detalle del caso.',
        createdAt: '2026-07-10 09:24',
      },
    ],
  },
];

export const mockProviderReviewPrompt = {
  orderId: 'HUPI-MK-2052',
  providerName: 'KONG',
  title: '¿Cómo llegó tu pedido?',
  subtitle: 'Califica a KONG',
  tags: ['Llegó bien', 'Producto correcto', 'Buen empaque', 'Entrega rápida', 'Buena atención'],
};

export const mockCartSummary = {
  count: 4,
  total: 32.79,
};

export const mockCoupons = [
  {
    id: 'coupon-hupi10',
    code: 'HUPI10',
    name: '10% de descuento',
    description: 'Usa HUPI10 en tu próxima compra.',
    discountType: 'percentage',
    value: 10,
    validUntil: '31 Jul 2026',
    status: 'Disponible',
  },
  {
    id: 'coupon-shipping',
    code: 'ENVIOHUPI',
    name: 'Envío gratis',
    description: 'Cubre el costo de envío estándar o express de forma visual.',
    discountType: 'free_shipping',
    value: 0,
    validUntil: '20 Jul 2026',
    status: 'Disponible',
  },
  {
    id: 'coupon-hupi2',
    code: 'HUPI2',
    name: '$2 de beneficio',
    description: 'Aplica $2 de descuento al total de marketplace.',
    discountType: 'fixed',
    value: 2,
    validUntil: '25 Jul 2026',
    status: 'Disponible',
  },
  {
    id: 'coupon-ruleta5',
    code: 'RULETA5',
    name: '5% off ganado en ruleta',
    description: 'Beneficio promocional guardado desde la ruleta.',
    discountType: 'percentage',
    value: 5,
    validUntil: '18 Jul 2026',
    status: 'Disponible',
  },
  {
    id: 'coupon-used',
    code: 'MILO5',
    name: 'Cupón usado',
    description: 'Beneficio ya usado en una compra anterior.',
    discountType: 'percentage',
    value: 5,
    validUntil: '1 Jul 2026',
    status: 'Usado',
  },
  {
    id: 'coupon-expired',
    code: 'PETOLD',
    name: 'Cupón expirado',
    description: 'Promoción fuera de vigencia.',
    discountType: 'fixed',
    value: 3,
    validUntil: '15 Jun 2026',
    status: 'Expirado',
  },
];

export const mockMarketplaceNotifications = [
  {
    id: 'market-notification-1',
    icon: 'ticket-outline',
    title: 'Tienes un cupón disponible',
    description: 'Usa HUPI10 en tu próxima compra.',
    time: 'Hoy, 09:20',
    unread: true,
    action: 'Ver cupones',
  },
  {
    id: 'market-notification-2',
    icon: 'gift-outline',
    title: 'Tu beneficio de la ruleta fue guardado',
    description: 'RULETA5 ya está disponible en Mis cupones.',
    time: 'Hoy, 09:05',
    unread: true,
    action: 'Ver beneficio',
  },
  {
    id: 'market-notification-3',
    icon: 'checkmark-circle-outline',
    title: 'Aplicaste el cupón HUPI10 a tu compra',
    description: 'El descuento se verá reflejado en el checkout.',
    time: 'Hoy, 09:00',
    unread: true,
    action: 'Ver cupones',
  },
  {
    id: 'market-notification-4',
    icon: 'paw-outline',
    title: 'Producto recomendado para Milo',
    description: 'Encontramos snacks y juguetes que podrían gustarle.',
    time: 'Ayer, 18:30',
    unread: false,
    action: 'Ver productos',
  },
  {
    id: 'market-notification-5',
    icon: 'cube-outline',
    title: 'Tu pedido está en preparación',
    description: 'El pedido HUPI-MK-2048 avanza correctamente.',
    time: 'Ayer, 12:10',
    unread: false,
    action: 'Ver tracking',
  },
  {
    id: 'market-notification-6',
    icon: 'document-attach-outline',
    title: 'Recuerda cargar el comprobante de tu pedido',
    description: 'Completa tu compra pendiente cuando tengas el comprobante.',
    time: 'Lun, 16:45',
    unread: true,
    action: 'Cargar comprobante',
  },
  {
    id: 'market-notification-7',
    icon: 'storefront-outline',
    title: 'Nueva tienda oficial disponible',
    description: 'Royal Canin ya tiene tienda oficial validada por Hupi.',
    time: 'Lun, 10:00',
    unread: false,
    action: 'Ver tienda',
  },
];

export const mockProductReviews = [
  {
    id: 'review-1',
    productId: 'product-1',
    customerName: 'Carolina M.',
    rating: 5,
    date: '3 Jul 2026',
    createdAt: '2026-07-03',
    comment: 'Milo los recibe como premio después del paseo. Buen tamaño y olor natural.',
    tags: ['Buena calidad', 'A mi mascota le encantó'],
    verifiedPurchase: true,
    orderNumber: 'HUPI-MK-2048',
  },
  {
    id: 'review-2',
    productId: 'product-1',
    customerName: 'Diego P.',
    rating: 5,
    date: '29 Jun 2026',
    createdAt: '2026-06-29',
    comment: 'Llegó rápido y el empaque se siente premium.',
    tags: ['Llegó rápido', 'Recomendado'],
    verifiedPurchase: true,
    orderNumber: 'HUPI-MK-2038',
  },
  {
    id: 'review-3',
    productId: 'product-2',
    customerName: 'Ana R.',
    rating: 4,
    date: '1 Jul 2026',
    createdAt: '2026-07-01',
    comment: 'Cómodo para paseos largos. El color coral se ve muy bien.',
    tags: ['Buena calidad'],
    verifiedPurchase: true,
    orderNumber: 'HUPI-MK-2048',
  },
  {
    id: 'review-4',
    productId: 'product-6',
    customerName: 'Mateo V.',
    rating: 5,
    date: '25 Jun 2026',
    createdAt: '2026-06-25',
    comment: 'Aroma suave y no irritó la piel de Nala.',
    tags: ['Recomendado', 'Buen precio'],
    verifiedPurchase: true,
    orderNumber: 'HUPI-MK-2034',
  },
];

export const mockCustomerOrders = [
  {
    orderNumber: 'HUPI-MK-2048',
    orderStatus: 'Entregado',
    paymentStatus: 'Pagado con tarjeta',
    products: ['product-1', 'product-2'],
  },
  {
    orderNumber: 'HUPI-MK-2051',
    orderStatus: 'En camino',
    paymentStatus: 'Pago validado',
    products: ['product-4'],
  },
  {
    orderNumber: 'HUPI-MK-2056',
    orderStatus: 'Entregado',
    paymentStatus: 'Pago validado',
    products: ['product-8'],
  },
  {
    orderNumber: 'HUPI-MK-2060',
    orderStatus: 'Confirmado',
    paymentStatus: 'Saldo Hupi',
    products: ['product-1'],
  },
];

export const mockPurchasedProducts = mockCustomerOrders.flatMap((order) => (
  order.products.map((productId) => ({
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    productId,
  }))
));

export type MockProductReview = typeof mockProductReviews[number];
export type MockCustomerOrder = typeof mockCustomerOrders[number];

export function canReviewProduct(
  productId: string,
  customerOrders: MockCustomerOrder[] = mockCustomerOrders,
  productReviews: Array<Pick<MockProductReview, 'orderNumber' | 'productId'>> = mockProductReviews,
) {
  const purchasedOrders = customerOrders.filter((order) => order.products.includes(productId));

  if (purchasedOrders.length === 0) {
    return { canReview: false, reason: 'not_purchased' as const };
  }

  const deliveredOrder = purchasedOrders.find((order) => (
    order.orderStatus === 'Entregado'
    && ['Pago validado', 'Pagado con tarjeta', 'Saldo Hupi'].includes(order.paymentStatus)
  ));

  if (!deliveredOrder) {
    return { canReview: false, reason: 'not_delivered' as const, order: purchasedOrders[0] };
  }

  const alreadyReviewed = productReviews.some((review) => (
    review.productId === productId && review.orderNumber === deliveredOrder.orderNumber
  ));

  if (alreadyReviewed) {
    return { canReview: false, reason: 'already_reviewed' as const, order: deliveredOrder };
  }

  return { canReview: true, reason: 'eligible' as const, order: deliveredOrder };
}

export const mockCategories = [
  { id: 'all', name: 'Todo', icon: 'apps-outline', emoji: '🛍️', color: '#fff0ec' },
  { id: 'food', name: 'Alimentos', icon: 'nutrition-outline', emoji: '🥣', color: '#f9f9e2' },
  { id: 'snacks', name: 'Snacks', icon: 'fish-outline', emoji: '🦴', color: '#fff0ec' },
  { id: 'toys', name: 'Juguetes', icon: 'tennisball-outline', emoji: '🎾', color: '#f0ebf7' },
  { id: 'accessories', name: 'Accesorios', icon: 'sparkles-outline', emoji: '🦮', color: '#f9f9e2' },
  { id: 'hygiene-cleaning', name: 'Higiene y limpieza', icon: 'water-outline', emoji: '🧴', color: '#f0ebf7' },
  { id: 'wellness', name: 'Salud y bienestar', icon: 'medkit-outline', emoji: '💊', color: '#fff0ec' },
];

export const mockPromoRewards = [
  {
    id: 'free-shipping',
    title: 'Envío gratis',
    description: 'Tienes envío gratis en esta compra',
    icon: '🚚',
  },
  {
    id: 'hupi-balance',
    title: '$2 de saldo Hupi',
    description: 'Tienes $2 de saldo Hupi',
    icon: '💜',
  },
  {
    id: 'discount',
    title: '5% off',
    description: 'Tienes 5% off visual',
    icon: '🏷️',
  },
  {
    id: 'recommended',
    title: 'Producto recomendado',
    description: 'Hupi recomienda un producto para tu mascota',
    icon: '🐾',
  },
];

export const mockCart = {
  items: [
    { id: 'cart-1', productId: 'product-1', quantity: 2, variationId: 'HUPI-SNACK-11' },
    { id: 'cart-2', productId: 'product-8', quantity: 1, variationId: 'HUPI-ADU-250' },
    { id: 'cart-3', productId: 'product-1', quantity: 20, variationId: 'HUPI-SNACK-12' },
  ],
  shipping: 2.5,
  discount: 1.5,
};

export const mockMarketplaceAddresses = [
  {
    id: 'home',
    name: 'Casa',
    city: 'Quito',
    sector: 'La Carolina',
    street: 'La Carolina, Quito',
    number: 'Departamento 802',
    reference: 'Torre frente al parque, recepción 24h',
    phone: '+593 99 123 4567',
  },
  {
    id: 'office',
    name: 'Oficina',
    city: 'Quito',
    sector: 'Av. República',
    street: 'Av. República, Quito',
    number: 'Piso 6',
    reference: 'Edificio corporativo junto a cafetería',
    phone: '+593 98 222 3344',
  },
  {
    id: 'other',
    name: 'Otra',
    city: 'Quito',
    sector: 'Cumbayá',
    street: 'Cumbayá, Quito',
    number: 'Casa 12',
    reference: 'Urbanización con garita principal',
    phone: '+593 97 555 7788',
  },
];

export const mockBillingProfiles: MockBillingProfile[] = [
  {
    id: 'billing-natural',
    taxpayerType: 'Persona Natural',
    identificationType: 'Cédula',
    identificationNumber: '1712345678',
    nameOrBusinessName: 'Ana Morales',
    billingEmail: 'ana@email.com',
    contactPhone: '+593 99 123 4567',
    fiscalAddress: '',
  },
  {
    id: 'billing-company',
    taxpayerType: 'Persona Jurídica',
    identificationType: 'RUC',
    identificationNumber: '1799999999001',
    nameOrBusinessName: 'Peludos Felices S.A.',
    billingEmail: 'facturacion@peludos.com',
    contactPhone: '+593 98 765 4321',
    fiscalAddress: 'Av. República y Eloy Alfaro, Quito',
  },
];

let billingProfilesState: MockBillingProfile[] = mockBillingProfiles.map((item, index) => ({ ...item, isDefault: index === 0 }));

export function getMockBillingProfiles() {
  return billingProfilesState.map((item) => ({ ...item }));
}

export function saveMockBillingProfile(profile: MockBillingProfile) {
  const exists = billingProfilesState.some((item) => item.id === profile.id);
  billingProfilesState = exists
    ? billingProfilesState.map((item) => item.id === profile.id ? { ...profile } : item)
    : [...billingProfilesState, { ...profile }];
  if (profile.isDefault) {
    billingProfilesState = billingProfilesState.map((item) => ({ ...item, isDefault: item.id === profile.id }));
  }

  syncBillingProfile({
    taxpayerType: profile.taxpayerType,
    identificationType: profile.identificationType,
    identificationNumber: profile.identificationNumber,
    nameOrBusinessName: profile.nameOrBusinessName,
    billingEmail: profile.billingEmail,
    contactPhone: profile.contactPhone,
    fiscalAddress: profile.fiscalAddress,
    isDefault: profile.isDefault ?? false,
  });

  return getMockBillingProfiles();
}

export function deleteMockBillingProfile(profileId: string) {
  billingProfilesState = billingProfilesState.filter((item) => item.id !== profileId);
  if (billingProfilesState.length > 0 && !billingProfilesState.some((item) => item.isDefault)) {
    billingProfilesState[0] = { ...billingProfilesState[0], isDefault: true };
  }
  return getMockBillingProfiles();
}

export function setDefaultMockBillingProfile(profileId: string) {
  billingProfilesState = billingProfilesState.map((item) => ({ ...item, isDefault: item.id === profileId }));
  return getMockBillingProfiles();
}

export const mockInvoiceStatuses = [
  'Pendiente de emisión',
  'Emitido',
  'Enviado al correo',
  'No aplica',
] as const;

export const mockOrderDocuments = {
  'HUPI-MK-2048': {
    receiptStatus: 'Emitido',
    invoiceStatus: 'Enviado al correo',
    sentToEmail: true,
  },
  'HUPI-MK-2049': {
    receiptStatus: 'Pendiente de emisión',
    invoiceStatus: 'Pendiente de emisión',
    sentToEmail: false,
  },
  'HUPI-MK-2055': {
    receiptStatus: 'Emitido',
    invoiceStatus: 'Pendiente de emisión',
    sentToEmail: false,
  },
} satisfies Record<string, {
  receiptStatus: typeof mockInvoiceStatuses[number];
  invoiceStatus: typeof mockInvoiceStatuses[number];
  sentToEmail: boolean;
}>;

export const mockShippingMethods = [
  {
    id: 'standard',
    title: 'Envío estándar',
    estimate: '24 a 48 horas',
    price: 2.5,
  },
  {
    id: 'express',
    title: 'Envío express',
    estimate: 'Mismo día en zonas habilitadas',
    price: 4.5,
  },
  {
    id: 'pickup',
    title: 'Retiro / coordinación',
    estimate: 'Coordina retiro en punto Hupi',
    price: 0,
  },
];

export const mockHupiBankAccounts = [
  {
    id: 'bank-1',
    bank: 'Banco Pichincha',
    accountType: 'Cuenta corriente',
    accountNumber: '2200456789',
    holder: 'Hupi Pet S.A.S.',
    taxId: '1799999999001',
    email: 'pagos@hupi.pet',
  },
  {
    id: 'bank-2',
    bank: 'Produbanco',
    accountType: 'Cuenta de ahorros',
    accountNumber: '1100789456',
    holder: 'Hupi Pet S.A.S.',
    taxId: '1799999999001',
    email: 'pagos@hupi.pet',
  },
];

// TODO: Esta distribución es interna para admin/proveedor y no debe mostrarse al cliente.
export const mockMarketplaceFinancials = {
  marketplaceCommissionRate: 0.30,
  sellerReceivesRate: 0.70,
};

export const mockOrders = [
  {
    id: 'HUPI-MK-2048',
    receiptNumber: 'REC-HUPI-2048',
    receiptDate: '7 Jul 2026',
    products: 'Snack natural de pollo x2, Shampoo hipoalergénico x1',
    totalPaid: 32.29,
    donation: 1,
    address: 'Casa: La Carolina, Quito',
    paymentMethod: 'Tarjeta terminada en 4242',
    estimatedDate: 'Jue 9 Jul',
    currentStep: 1,
    steps: ['Pedido recibido', 'Preparando pedido', 'En camino', 'Entregado'],
  },
];

export const mockMarketplaceOrderHistory = [
  {
    id: 'HUPI-MK-2048',
    status: 'Confirmado',
    products: 'Snack natural de pollo x2',
    total: '$32.29',
    date: '7 Jul 2026',
  },
  {
    id: 'HUPI-MK-2049',
    status: 'Pendiente de comprobante',
    products: 'Arnés urbano ajustable x1',
    total: '$24.49',
    date: '7 Jul 2026',
  },
  {
    id: 'HUPI-MK-2050',
    status: 'En preparación',
    products: 'Shampoo hipoalergénico x1',
    total: '$14.49',
    date: '6 Jul 2026',
  },
  {
    id: 'HUPI-MK-2051',
    status: 'En camino',
    products: 'Pelota resistente coral x2',
    total: '$15.98',
    date: '5 Jul 2026',
  },
  {
    id: 'HUPI-MK-2052',
    status: 'Entregado',
    products: 'Cama nube mediana x1',
    total: '$41.50',
    date: '2 Jul 2026',
  },
];

export const mockNotifications = [
  { id: 'notification-1', title: 'Paseo confirmado', read: false },
  { id: 'notification-2', title: 'Nuevo consejo para Milo', read: false },
  { id: 'notification-3', title: 'Tu pedido está en camino', read: true },
  { id: 'notification-chat-1', title: 'Respuesta de Soporte Hupi', read: false },
  { id: 'notification-chat-2', title: 'Nuevo mensaje de Soporte Hupi', read: false },
];

export const mockProvider = {
  providerId: 'provider-andres',
  name: 'Valentina P.',
  verification: 'Documentos en revisión',
  completion: 72,
  earnings: '$284,50',
  newRequests: 3,
  nextBookings: 2,
};

// Presencia local determinista para la fase mock. Se reemplazará por métricas del backend.
export const mockClientPresence = {
  isOnline: false,
  averageResponseTimeMinutes: 18,
};

export type MockConversationType = 'marketplace' | 'services' | 'support';
export type MockChatRole = 'Cliente' | 'Proveedor' | 'Soporte Hupi';
export type MockChatStatus = 'En línea' | 'Ausente' | 'Soporte Hupi';
export type MockMessageSender = 'customer' | 'provider' | 'support' | 'system';
export type MockAttachmentType = 'image' | 'document' | 'receipt' | null;
export type MockMessageStatus = 'Enviado' | 'Leído';

export type MockConversation = {
  id: string;
  type: MockConversationType;
  relatedId: string;
  participants: string[];
  audience?: 'customer' | 'provider' | 'admin';
  caseNumber?: string;
  orderId?: string;
  orderNumber?: string;
  providerId?: string;
  customerId?: string;
  relatedOrderId?: string;
  relatedProviderOrderId?: string;
  relatedOrderRoute?: string;
  relatedCustomerOrderRoute?: string;
  relatedAdminOrderRoute?: string;
  orderStatus?: string;
  paymentStatus?: string;
  storeName?: string;
  title: string;
  subtitle: string;
  role: MockChatRole;
  status: MockChatStatus;
  unreadCount: number;
  lastMessage: string;
  updatedAt: string;
  accentColor: string;
  initials: string;
  ticketNumber?: string;
  ticketReason?: string;
  ticketStatus?: string;
};

export type MockMessage = {
  id: string;
  conversationId: string;
  sender: MockMessageSender;
  text: string;
  createdAt: string;
  status: MockMessageStatus;
  attachmentType: MockAttachmentType;
};

export const mockConversations: MockConversation[] = [
  {
    id: 'chat-marketplace-2048-hupi-bites',
    type: 'marketplace',
    relatedId: 'HUPI-MK-2048',
    participants: ['customer-001', 'support-hupi'],
    audience: 'customer',
    caseNumber: 'INC-2049',
    orderId: 'order-2048',
    orderNumber: 'HUPI-MK-2048',
    providerId: 'provider-001',
    customerId: 'customer-001',
    relatedOrderId: 'order-2048',
    relatedProviderOrderId: 'HUPI-MK-2048-A',
    relatedOrderRoute: '/marketplace/order-detail?orderId=HUPI-MK-2048',
    relatedCustomerOrderRoute: '/marketplace/order-detail?orderId=HUPI-MK-2048',
    relatedAdminOrderRoute: '/marketplace/orders/HUPI-MK-2048',
    orderStatus: 'En preparación',
    paymentStatus: 'Pagado con tarjeta',
    storeName: 'Hupi Bites',
    title: 'Soporte Hupi',
    subtitle: 'Caso #INC-2049 · Pedido HUPI-MK-2048',
    role: 'Soporte Hupi',
    status: 'Soporte Hupi',
    unreadCount: 2,
    lastMessage: 'Respondemos en máximo 24 horas.',
    updatedAt: '2026-07-09 10:30',
    accentColor: '#e45336',
    initials: 'SH',
    ticketNumber: 'INC-2049',
    ticketReason: 'Producto dañado',
    ticketStatus: 'En revisión',
  },
  {
    id: 'chat-service-walk-001',
    type: 'services',
    relatedId: 'booking-walk-001',
    participants: ['customer-001', 'provider-walk-001'],
    title: 'Andrés & Luna',
    subtitle: 'Reserva paseo',
    role: 'Proveedor',
    status: 'En línea',
    unreadCount: 1,
    lastMessage: 'Llevaré agua y correa extra para Milo.',
    updatedAt: '2026-07-09 16:42',
    accentColor: '#614193',
    initials: 'AL',
  },
  {
    id: 'chat-support-client-2049',
    type: 'support',
    relatedId: 'INC-2049',
    participants: ['customer-001', 'support-hupi'],
    audience: 'customer',
    caseNumber: 'INC-2049',
    orderId: 'order-2049',
    orderNumber: 'HUPI-MK-2049',
    providerId: 'provider-001',
    customerId: 'customer-001',
    relatedOrderId: 'order-2049',
    relatedProviderOrderId: 'HUPI-MK-2049-A',
    relatedOrderRoute: '/marketplace/order-detail?orderId=HUPI-MK-2049',
    relatedCustomerOrderRoute: '/marketplace/order-detail?orderId=HUPI-MK-2049',
    relatedAdminOrderRoute: '/marketplace/orders/HUPI-MK-2049',
    orderStatus: 'Pago en revisión',
    paymentStatus: 'Comprobante enviado',
    storeName: 'Urban Pet',
    title: 'Soporte Hupi',
    subtitle: 'Caso #INC-2049 · Pedido HUPI-MK-2049',
    role: 'Soporte Hupi',
    status: 'Soporte Hupi',
    unreadCount: 0,
    lastMessage: 'Estamos revisando la información.',
    updatedAt: '2026-07-09 11:12',
    accentColor: '#e45336',
    initials: 'SH',
    ticketNumber: 'INC-2049',
    ticketReason: 'Comprobante de pago',
    ticketStatus: 'En revisión',
  },
  {
    id: 'chat-support-provider-2050',
    type: 'support',
    relatedId: 'INC-2050',
    participants: ['provider-001', 'support-hupi'],
    audience: 'provider',
    caseNumber: 'INC-2050',
    orderId: 'order-2049',
    orderNumber: 'HUPI-MK-2049',
    providerId: 'provider-001',
    customerId: 'customer-001',
    relatedOrderId: 'order-2049',
    relatedProviderOrderId: 'HUPI-MK-2049-A',
    relatedOrderRoute: '/provider/marketplace-order-detail?providerOrderId=HUPI-MK-2049-A',
    relatedCustomerOrderRoute: '/marketplace/order-detail?orderId=HUPI-MK-2049',
    relatedAdminOrderRoute: '/marketplace/orders/HUPI-MK-2049',
    orderStatus: 'Pago en revisión',
    paymentStatus: 'Comprobante enviado',
    storeName: 'Hupi Bites',
    title: 'Soporte Hupi',
    subtitle: 'Caso #INC-2050 · Pedido HUPI-MK-2049',
    role: 'Soporte Hupi',
    status: 'Soporte Hupi',
    unreadCount: 1,
    lastMessage: 'Nuestro equipo revisará el detalle del pedido.',
    updatedAt: '2026-07-10 09:24',
    accentColor: '#614193',
    initials: 'SH',
    ticketNumber: 'INC-2050',
    ticketReason: 'Incidencia de pedido',
    ticketStatus: 'Abierto',
  },
  {
    id: 'chat-marketplace-2055-hupi-bites',
    type: 'marketplace',
    relatedId: 'HUPI-MK-2055',
    participants: ['customer-001', 'support-hupi'],
    audience: 'customer',
    caseNumber: 'INC-2050',
    orderId: 'order-2055',
    orderNumber: 'HUPI-MK-2055',
    providerId: 'provider-001',
    customerId: 'customer-001',
    relatedOrderId: 'order-2055',
    relatedProviderOrderId: 'HUPI-MK-2055-A',
    relatedOrderRoute: '/marketplace/order-detail?orderId=HUPI-MK-2055',
    relatedCustomerOrderRoute: '/marketplace/order-detail?orderId=HUPI-MK-2055',
    relatedAdminOrderRoute: '/marketplace/orders/HUPI-MK-2055',
    orderStatus: 'Pago en revisión',
    paymentStatus: 'Comprobante enviado',
    storeName: 'Hupi Bites',
    title: 'Soporte Hupi',
    subtitle: 'Caso #INC-2050 · Pedido HUPI-MK-2055',
    role: 'Soporte Hupi',
    status: 'Soporte Hupi',
    unreadCount: 0,
    lastMessage: 'Respondemos en máximo 24 horas.',
    updatedAt: '2026-07-08 13:18',
    accentColor: '#32966f',
    initials: 'SH',
    ticketNumber: 'INC-2050',
    ticketReason: 'Reembolso o saldo Hupi',
    ticketStatus: 'Abierto',
  },
  {
    id: 'chat-marketplace-2048-urban-pet',
    type: 'marketplace',
    relatedId: 'HUPI-MK-2048',
    participants: ['customer-001', 'support-hupi'],
    audience: 'customer',
    caseNumber: 'INC-2051',
    orderId: 'order-2048',
    orderNumber: 'HUPI-MK-2048',
    providerId: 'provider-001',
    customerId: 'customer-001',
    relatedOrderId: 'order-2048',
    relatedProviderOrderId: 'HUPI-MK-2048-A',
    relatedOrderRoute: '/marketplace/order-detail?orderId=HUPI-MK-2048',
    relatedCustomerOrderRoute: '/marketplace/order-detail?orderId=HUPI-MK-2048',
    relatedAdminOrderRoute: '/marketplace/orders/HUPI-MK-2048',
    orderStatus: 'En preparación',
    paymentStatus: 'Pagado con tarjeta',
    storeName: 'Urban Pet',
    title: 'Soporte Hupi',
    subtitle: 'Caso #INC-2051 · Pedido HUPI-MK-2048',
    role: 'Soporte Hupi',
    status: 'Soporte Hupi',
    unreadCount: 0,
    lastMessage: 'Respondemos en máximo 24 horas.',
    updatedAt: '2026-07-09 09:48',
    accentColor: '#614193',
    initials: 'SH',
    ticketNumber: 'INC-2051',
    ticketReason: 'Comprobante de pago',
    ticketStatus: 'En revisión',
  },
  {
    id: 'chat-support-admin-2049',
    type: 'support',
    relatedId: 'INC-2049',
    participants: ['admin-hupi', 'support-hupi'],
    audience: 'admin',
    caseNumber: 'INC-2049',
    orderId: 'order-2049',
    orderNumber: 'HUPI-MK-2049',
    providerId: 'provider-001',
    customerId: 'customer-001',
    relatedOrderId: 'order-2049',
    relatedProviderOrderId: 'HUPI-MK-2049-A',
    relatedOrderRoute: '/marketplace/orders/HUPI-MK-2049',
    relatedCustomerOrderRoute: '/marketplace/order-detail?orderId=HUPI-MK-2049',
    relatedAdminOrderRoute: '/marketplace/orders/HUPI-MK-2049',
    orderStatus: 'Pago en revisión',
    paymentStatus: 'Comprobante enviado',
    storeName: 'Hupi Bites',
    title: 'Soporte Hupi',
    subtitle: 'Caso #INC-2049 · Pedido HUPI-MK-2049',
    role: 'Soporte Hupi',
    status: 'Soporte Hupi',
    unreadCount: 0,
    lastMessage: 'Historial de soporte vinculado al pedido.',
    updatedAt: '2026-07-10 10:15',
    accentColor: '#614193',
    initials: 'SH',
    ticketNumber: 'INC-2049',
    ticketReason: 'Producto incorrecto',
    ticketStatus: 'En revisión',
  },
];

export function isMockConversationVisibleForMvp(conversation: MockConversation) {
  if (conversation.type === 'support') {
    return true;
  }

  if (conversation.type === 'marketplace') {
    return conversation.role === 'Soporte Hupi';
  }

  const coordination = mockServiceCoordinationRequests.find((request) => request.chatId === conversation.id);
  if (coordination) {
    return isBookableServiceEnabled(coordination.serviceType);
  }

  return conversation.relatedId.includes('walk') || conversation.subtitle.toLowerCase().includes('paseo');
}

export function getVisibleMockConversations() {
  const local = mockConversations.filter(isMockConversationVisibleForMvp);
  return getRemoteConversations(mockConversations) ?? local;
}

export const mockMessages: MockMessage[] = [
  {
    id: 'msg-001',
    conversationId: 'chat-marketplace-2048-hupi-bites',
    sender: 'customer',
    text: 'Motivo: Producto llegó dañado\nPedido: HUPI-MK-2048\nDescripción: El producto llegó roto.',
    createdAt: '10:20',
    status: 'Leído',
    attachmentType: null,
  },
  {
    id: 'msg-002',
    conversationId: 'chat-marketplace-2048-hupi-bites',
    sender: 'support',
    text: 'Hola, recibimos tu caso #INC-2049. Nuestro equipo revisará la información y te responderemos en un máximo de 24 horas.',
    createdAt: '10:23',
    status: 'Leído',
    attachmentType: null,
  },
  {
    id: 'msg-003',
    conversationId: 'chat-marketplace-2048-hupi-bites',
    sender: 'support',
    text: 'Soporte Hupi gestionará tu caso. Si necesitamos información de la tienda, la solicitaremos desde Hupi.',
    createdAt: '10:30',
    status: 'Leído',
    attachmentType: null,
  },
  {
    id: 'msg-004',
    conversationId: 'chat-service-walk-001',
    sender: 'system',
    text: 'Chat habilitado por reserva confirmada.',
    createdAt: '16:05',
    status: 'Leído',
    attachmentType: null,
  },
  {
    id: 'msg-005',
    conversationId: 'chat-service-walk-001',
    sender: 'provider',
    text: 'Hola Ana, coordinemos la hora de entrega.',
    createdAt: '16:34',
    status: 'Leído',
    attachmentType: null,
  },
  {
    id: 'msg-006',
    conversationId: 'chat-service-walk-001',
    sender: 'customer',
    text: 'Perfecto, Milo estará listo a las 17:20 en recepción.',
    createdAt: '16:39',
    status: 'Leído',
    attachmentType: null,
  },
  {
    id: 'msg-007',
    conversationId: 'chat-service-walk-001',
    sender: 'provider',
    text: 'Llevaré agua y correa extra para Milo.',
    createdAt: '16:42',
    status: 'Leído',
    attachmentType: null,
  },
  {
    id: 'msg-008',
    conversationId: 'chat-support-client-2049',
    sender: 'support',
    text: 'Hola, recibimos tu caso #INC-2049. Estamos revisando la información.',
    createdAt: '11:02',
    status: 'Leído',
    attachmentType: null,
  },
  {
    id: 'msg-009',
    conversationId: 'chat-support-client-2049',
    sender: 'customer',
    text: 'Adjunto el comprobante correcto.',
    createdAt: '11:05',
    status: 'Leído',
    attachmentType: 'receipt',
  },
  {
    id: 'msg-010',
    conversationId: 'chat-support-provider-2050',
    sender: 'support',
    text: 'Hola, recibimos tu caso #INC-2050. Estamos revisando el pedido reportado.',
    createdAt: '09:18',
    status: 'Leído',
    attachmentType: null,
  },
  {
    id: 'msg-011',
    conversationId: 'chat-support-provider-2050',
    sender: 'provider',
    text: 'Comparto detalle del pedido para revisión.',
    createdAt: '09:21',
    status: 'Enviado',
    attachmentType: 'document',
  },
  {
    id: 'msg-012',
    conversationId: 'chat-marketplace-2055-hupi-bites',
    sender: 'customer',
    text: 'Motivo: Reembolso o Saldo Hupi\nPedido: HUPI-MK-2055\nDescripción: Necesito revisar si aplica saldo Hupi.',
    createdAt: '13:18',
    status: 'Leído',
    attachmentType: 'document',
  },
  {
    id: 'msg-013',
    conversationId: 'chat-marketplace-2048-urban-pet',
    sender: 'customer',
    text: 'Motivo: Comprobante de pago\nPedido: HUPI-MK-2048\nDescripción: Necesito validar el comprobante del pedido.',
    createdAt: '09:44',
    status: 'Leído',
    attachmentType: null,
  },
  {
    id: 'msg-014',
    conversationId: 'chat-marketplace-2048-urban-pet',
    sender: 'support',
    text: 'Validaremos el comprobante asociado al pedido.',
    createdAt: '09:48',
    status: 'Leído',
    attachmentType: null,
  },
];

export function getMockConversation(chatId?: string) {
  return mockConversations.find((item) => item.id === chatId) ?? mockConversations[0];
}

export function getMockMessages(conversationId: string) {
  const local = mockMessages.filter((message) => message.conversationId === conversationId);
  return getRemoteMessages(conversationId, mockMessages) ?? local;
}

export type MockSupportTicketStatus = 'Abierto' | 'En revisión' | 'Esperando respuesta' | 'Resuelto' | 'Cerrado';

export type MockSupportTicket = {
  id: string;
  caseNumber: string;
  reason: string;
  status: MockSupportTicketStatus;
  createdAt: string;
  relatedOrderNumber?: string;
  relatedBookingId?: string;
  description: string;
  lastSupportMessage: string;
  history: Array<{
    id: string;
    author: 'Cliente' | 'Soporte Hupi' | 'Sistema Hupi';
    message: string;
    createdAt: string;
  }>;
};

let mockSupportTicketsState: MockSupportTicket[] = mockSupportTickets;

export function getMockSupportTickets() {
  const local = mockSupportTicketsState.map((ticket) => ({
    ...ticket,
    history: ticket.history.map((item) => ({ ...item })),
  }));

  return getRemoteSupportTickets(local) ?? local;
}

export function getMockSupportTicketById(ticketId?: string) {
  const ticket = getMockSupportTickets().find((item) => item.id === ticketId);
  return ticket ? { ...ticket, history: ticket.history.map((item) => ({ ...item })) } : undefined;
}

export function createMockSupportTicket({
  description,
  reason,
  relatedBookingId,
  relatedOrderNumber,
}: {
  description: string;
  reason: string;
  relatedBookingId?: string;
  relatedOrderNumber?: string;
}) {
  const caseNumber = `INC-${Date.now().toString().slice(-4)}`;
  const ticket: MockSupportTicket = {
    id: `ticket-${caseNumber.toLowerCase()}`,
    caseNumber,
    reason,
    status: 'Abierto',
    createdAt: 'Ahora',
    relatedBookingId,
    relatedOrderNumber,
    description,
    lastSupportMessage: 'Tu solicitud fue enviada a Soporte Hupi. Te responderemos en máximo 24 horas.',
    history: [
      {
        id: `history-${caseNumber}-client`,
        author: 'Cliente',
        message: description,
        createdAt: 'Ahora',
      },
      {
        id: `history-${caseNumber}-support`,
        author: 'Soporte Hupi',
        message: 'Tu solicitud fue enviada a Soporte Hupi. Te responderemos en máximo 24 horas.',
        createdAt: 'Ahora',
      },
    ],
  };

  mockSupportTicketsState = [ticket, ...mockSupportTicketsState];
  syncCreateTicket(reason, description);
  return { ...ticket, history: ticket.history.map((item) => ({ ...item })) };
}

export function addMockSupportTicketMessage(ticketId: string, message: string) {
  mockSupportTicketsState = mockSupportTicketsState.map((ticket) => {
    if (ticket.id !== ticketId) {
      return ticket;
    }

    return {
      ...ticket,
      status: ticket.status === 'Cerrado' ? ticket.status : 'Esperando respuesta',
      lastSupportMessage: 'Recibimos tu actualización. Soporte Hupi la revisará.',
      history: [
        ...ticket.history,
        {
          id: `history-${ticket.caseNumber}-${Date.now()}`,
          author: 'Cliente',
          message,
          createdAt: 'Ahora',
        },
        {
          id: `history-${ticket.caseNumber}-support-${Date.now()}`,
          author: 'Soporte Hupi',
          message: 'Recibimos tu actualización. Soporte Hupi la revisará.',
          createdAt: 'Ahora',
        },
      ],
    };
  });

  syncTicketMessage(ticketId, message);
  return getMockSupportTicketById(ticketId);
}

export function closeMockSupportTicket(ticketId: string) {
  mockSupportTicketsState = mockSupportTicketsState.map((ticket) => (
    ticket.id === ticketId
      ? {
        ...ticket,
        status: 'Cerrado',
        lastSupportMessage: 'Caso cerrado por el cliente.',
        history: [
          ...ticket.history,
          {
            id: `history-${ticket.caseNumber}-closed-${Date.now()}`,
            author: 'Sistema Hupi',
            message: 'Caso cerrado por el cliente.',
            createdAt: 'Ahora',
          },
        ],
      }
      : ticket
  ));

  syncCloseTicket(ticketId);
  return getMockSupportTicketById(ticketId);
}

export function getMarketplaceChatForOrder(orderNumber: string, storeId?: string) {
  return mockConversations.find((conversation) => (
    conversation.type === 'marketplace'
    && conversation.relatedId === orderNumber
    && (!storeId || conversation.id.includes(storeId.replace('store-', '')))
  )) ?? mockConversations.find((conversation) => conversation.type === 'marketplace' && conversation.relatedId === orderNumber);
}

export function getServiceChatForBooking(bookingId: string) {
  return mockConversations.find((conversation) => conversation.type === 'services' && conversation.relatedId === bookingId);
}

export function getOrCreateServiceChatForBooking(booking: MockBooking) {
  const existingConversation = getServiceChatForBooking(booking.id);

  if (existingConversation) {
    return existingConversation;
  }

  const provider = mockProviders.find((item) => item.name === booking.provider);
  const providerId = provider?.id ?? `provider-${booking.provider.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
  const requestId = booking.coordinationRequestId ?? `coord-${booking.id}`;
  const chatId = `chat-service-${booking.id}`;
  const customer = getLocalAccountSnapshot().profile;

  mockServiceCoordinationRequests = [
    {
      id: requestId,
      clientId: customer.id,
      clientName: `${customer.firstName} ${customer.lastName}`.trim(),
      providerId,
      petId: 'pet-001',
      petName: booking.pet,
      serviceType: booking.serviceId,
      tentativeDate: booking.date,
      tentativeTime: booking.time,
      zone: booking.location,
      status: booking.status === 'En curso' ? 'En curso' : 'Confirmada',
      chatId,
      bookingId: booking.id,
    },
    ...mockServiceCoordinationRequests,
  ];

  const conversation: MockConversation = {
    id: chatId,
    type: 'services',
    relatedId: booking.id,
    participants: [customer.id, providerId],
    title: booking.provider,
    subtitle: `${booking.service} · ${booking.pet} · Reserva ${booking.id}`,
    role: 'Proveedor',
    status: provider?.isOnline ? 'En línea' : 'Ausente',
    unreadCount: 0,
    lastMessage: 'Chat habilitado para coordinar esta reserva.',
    updatedAt: 'Ahora',
    accentColor: provider?.avatarColor ?? colors.secondary,
    initials: provider?.initials ?? booking.providerInitials,
  };

  mockConversations.unshift(conversation);
  mockMessages.push(
    {
      id: `msg-${chatId}-system`,
      conversationId: chatId,
      sender: 'system',
      text: `Chat habilitado para la reserva ${booking.id}. Coordina dentro de Hupi para mantener tu servicio protegido.`,
      createdAt: 'Ahora',
      status: 'Leído',
      attachmentType: null,
    },
    {
      id: `msg-${chatId}-provider`,
      conversationId: chatId,
      sender: 'provider',
      text: `Hola, soy ${booking.provider}. Podemos coordinar los detalles de ${booking.service.toLowerCase()} para ${booking.pet}.`,
      createdAt: 'Ahora',
      status: 'Leído',
      attachmentType: null,
    },
  );

  return conversation;
}

export type MockServiceCoordinationStatus =
  | 'Solicitud de coordinación'
  | 'Oferta enviada'
  | 'Pendiente de pago'
  | 'Confirmada'
  | 'Programada'
  | 'En curso'
  | 'Finalizada'
  | 'Cancelada';

export type MockServiceCoordinationRequest = {
  id: string;
  clientId: string;
  clientName: string;
  providerId: string;
  petId: string;
  petName: string;
  serviceType: BookableServiceId;
  tentativeDate: string;
  tentativeTime: string;
  zone: string;
  status: MockServiceCoordinationStatus;
  chatId: string;
  selectedOfferId?: string;
  bookingId?: string;
  meetingPreferences?: AddressDeliveryPreferences;
};

export type MockServiceOfferStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'cancelled';

export type MockServiceOffer = {
  id: string;
  approvedOfferId: string;
  approvedOfferType: 'individual' | 'plan';
  requestId: string;
  providerId: string;
  serviceType: BookableServiceId;
  title: string;
  description: string;
  duration: string;
  proposedDate: string;
  proposedTime: string;
  petName: string;
  hourlyPrice: number;
  durationHours: number;
  walkCount: number;
  basePrice: number;
  platformFeePercent: 15;
  clientFee: number;
  clientTotal: number;
  providerPercent: 70;
  providerAmount: number;
  hupiPercent: 30;
  hupiCommission: number;
  conditions: string[];
  validForHours: number;
  expiresAt: string;
  status: MockServiceOfferStatus;
};

export type MockServiceOfferInput = {
  approvedOfferId: string;
};

export type MockProviderPlan = {
  id: string;
  providerId: string;
  serviceType: BookableServiceId;
  title: string;
  description: string;
  duration: string;
  basePrice: number;
  clientFee: number;
  clientTotal: number;
  providerAmount: number;
  hupiCommission: number;
  conditions: string[];
  type: 'individual' | 'recurring';
  durationMinutes: number;
  walkCount: number;
  frequencyPerWeek?: number;
  frequencyType: 'required' | 'recommended' | 'customer_configurable';
  validityDays?: number;
  petsIncluded: number;
  modality: 'individual' | 'group';
  includes: string[];
  isAvailable: boolean;
  approvalStatus: 'approved';
};

let mockServiceCoordinationRequests: MockServiceCoordinationRequest[] = [
  {
    id: 'coord-walk-001',
    clientId: mockUser.id,
    clientName: `${mockUser.firstName} ${mockUser.lastName}`,
    providerId: 'provider-andres',
    petId: 'pet-001',
    petName: 'Milo',
    serviceType: 'walk',
    tentativeDate: '12 de julio de 2026',
    tentativeTime: '17:30',
    zone: 'La Carolina, Quito',
    status: 'Solicitud de coordinación',
    chatId: 'chat-service-walk-001',
  },
];

let mockServiceOffers: MockServiceOffer[] = [];

function roundMockCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function createProviderPlan(providerId: string, plan: (typeof mockProviders)[number]['walkProfile']['plans'][number]) {
  const basePrice = roundMockCurrency(plan.price);
  const payment = calculateMockPayment(basePrice);

  return {
    id: plan.id,
    providerId,
    serviceType: 'walk',
    title: plan.name,
    description: plan.description,
    duration: `${plan.durationMinutes} minutos`,
    basePrice,
    clientFee: payment.clientFee,
    clientTotal: payment.total,
    providerAmount: payment.providerPayout,
    hupiCommission: payment.hupiProviderCommission,
    conditions: [...plan.specificConditions],
    type: plan.type,
    durationMinutes: plan.durationMinutes,
    walkCount: plan.walkCount,
    frequencyPerWeek: plan.frequencyPerWeek,
    frequencyType: plan.frequencyType,
    validityDays: plan.validityDays,
    petsIncluded: plan.petsIncluded,
    modality: plan.modality,
    includes: [...plan.includes],
    isAvailable: plan.isAvailable,
    approvalStatus: 'approved',
  } satisfies MockProviderPlan;
}

export function getMockProviderPlans(providerId: string, serviceType?: BookableServiceId) {
  const provider = mockProviders.find((item) => item.id === providerId) ?? mockProviders[0];
  if (serviceType && serviceType !== 'walk') return [];
  if (!isBookableServiceEnabled('walk')) return [];
  if (!getPublicProviderWalkProfile(provider.walkProfile, provider.servicePrices.walk, provider.zone)) return [];
  return provider.walkProfile.plans
    .filter((plan) => isPublicProviderWalkPlan(plan))
    .map((plan) => createProviderPlan(provider.id, plan));
}

export function getMockProviderPlanById(planId?: string) {
  if (!planId) {
    return undefined;
  }

  return mockProviders
    .flatMap((provider) => getMockProviderPlans(provider.id))
    .find((plan) => plan.id === planId);
}

export function getMockServiceCoordinationRequests() {
  return mockServiceCoordinationRequests
    .filter((request) => isBookableServiceEnabled(request.serviceType))
    .map((request) => ({ ...request }));
}

export function getMockServiceCoordinationByChatId(chatId?: string) {
  const request = mockServiceCoordinationRequests.find((item) => item.chatId === chatId);
  return request && isBookableServiceEnabled(request.serviceType) ? request : undefined;
}

export function getMockServiceCoordinationById(requestId?: string) {
  const request = mockServiceCoordinationRequests.find((item) => item.id === requestId);
  return request && isBookableServiceEnabled(request.serviceType) ? request : undefined;
}

export function createMockServiceCoordinationRequest({
  providerId,
  serviceType,
  zone,
}: {
  providerId: string;
  serviceType: BookableServiceId;
  zone?: string;
}) {
  const provider = mockProviders.find((item) => item.id === providerId) ?? mockProviders[0];
  const selectedPet = getSelectedServicePet();
  const details = getMockBookingDetails(serviceType);
  const requestId = `coord-${serviceType}-${Date.now()}`;
  const chatId = `chat-service-${serviceType}-${provider.id}-${Date.now()}`;
  const customer = getLocalAccountSnapshot().profile;
  const request: MockServiceCoordinationRequest = {
    id: requestId,
    clientId: customer.id,
    clientName: `${customer.firstName} ${customer.lastName}`.trim(),
    providerId: provider.id,
    petId: selectedPet?.id ?? 'pet-001',
    petName: selectedPet?.name ?? 'Milo',
    serviceType,
    tentativeDate: details.date,
    tentativeTime: details.hour,
    zone: zone?.trim() || provider.zone,
    status: 'Solicitud de coordinación',
    chatId,
  };

  mockServiceCoordinationRequests = [request, ...mockServiceCoordinationRequests];
  mockConversations.unshift({
    id: chatId,
    type: 'services',
    relatedId: requestId,
    participants: [customer.id, provider.id],
    title: provider.name,
    subtitle: `${serviceCopy[serviceType].label} · ${request.petName} · ${request.tentativeDate}`,
    role: 'Proveedor',
    status: provider.isOnline ? 'En línea' : 'Ausente',
    unreadCount: 0,
    lastMessage: 'Solicitud de coordinación creada.',
    updatedAt: 'Ahora',
    accentColor: provider.avatarColor,
    initials: provider.initials,
  });
  return { ...request };
}

export function getMockServiceOffers(requestId?: string) {
  const now = Date.now();
  mockServiceOffers = mockServiceOffers.map((offer) => (
    (offer.status === 'sent' || offer.status === 'viewed') && Date.parse(offer.expiresAt) <= now
      ? { ...offer, status: 'expired' }
      : offer
  ));
  return mockServiceOffers
    .filter((offer) => isBookableServiceEnabled(offer.serviceType) && (!requestId || offer.requestId === requestId))
    .map((offer) => ({ ...offer, conditions: [...offer.conditions] }));
}

export function getMockServiceOfferById(offerId?: string) {
  const offer = mockServiceOffers.find((item) => item.id === offerId);
  return offer ? { ...offer, conditions: [...offer.conditions] } : undefined;
}

export function sendMockServiceOffer(requestId: string, input: MockServiceOfferInput) {
  const request = mockServiceCoordinationRequests.find((item) => item.id === requestId);

  if (!request) {
    return undefined;
  }

  const approvedOffer = getMockProviderPlans(request.providerId, request.serviceType)
    .find((item) => item.id === input.approvedOfferId && item.approvalStatus === 'approved');
  if (!approvedOffer) return undefined;
  const durationHours = approvedOffer.durationMinutes / 60;
  const walkCount = approvedOffer.walkCount;
  const basePrice = approvedOffer.basePrice;
  const hourlyPrice = roundMockCurrency(basePrice / Math.max(1, durationHours * walkCount));
  const payment = calculateMockPayment(basePrice);
  const validForHours = 24;
  const offer: MockServiceOffer = {
    id: `offer-${request.id}-${Date.now()}`,
    approvedOfferId: approvedOffer.id,
    approvedOfferType: approvedOffer.type === 'individual' ? 'individual' : 'plan',
    requestId: request.id,
    providerId: request.providerId,
    serviceType: request.serviceType,
    title: approvedOffer.title,
    description: approvedOffer.description,
    duration: approvedOffer.duration,
    proposedDate: request.tentativeDate,
    proposedTime: request.tentativeTime,
    petName: request.petName,
    hourlyPrice,
    durationHours,
    walkCount,
    basePrice,
    platformFeePercent: 15,
    clientFee: payment.clientFee,
    clientTotal: payment.total,
    providerPercent: 70,
    providerAmount: payment.providerPayout,
    hupiPercent: 30,
    hupiCommission: payment.hupiProviderCommission,
    conditions: [...approvedOffer.conditions, ...approvedOffer.includes],
    validForHours,
    expiresAt: new Date(Date.now() + validForHours * 60 * 60 * 1000).toISOString(),
    status: 'sent',
  };
  mockServiceOffers = [offer, ...mockServiceOffers];
  mockServiceCoordinationRequests = mockServiceCoordinationRequests.map((item) => (
    item.id === request.id ? { ...item, status: 'Oferta enviada' } : item
  ));

  syncCreateOffer({
    requestId: request.id,
    title: offer.title,
    description: offer.description,
    basePrice,
    validForHours,
  });

  return { ...offer, conditions: [...offer.conditions] };
}

export function selectMockServiceOffer(offerId: string) {
  const offer = mockServiceOffers.find((item) => item.id === offerId);

  if (!offer) {
    return undefined;
  }

  mockServiceOffers = mockServiceOffers.map((item) => (
    item.id === offerId ? { ...item, status: 'accepted' } : item
  ));
  mockServiceCoordinationRequests = mockServiceCoordinationRequests.map((request) => (
    request.id === offer.requestId ? { ...request, status: 'Pendiente de pago', selectedOfferId: offer.id } : request
  ));
  syncOfferAction(offerId, 'accept');
  return { ...offer };
}

export function markMockServiceOffersViewed(requestId: string) {
  mockServiceOffers = mockServiceOffers.map((offer) => (
    offer.requestId === requestId && offer.status === 'sent' ? { ...offer, status: 'viewed' } : offer
  ));
  return getMockServiceOffers(requestId);
}

export function updateMockServiceOfferStatus(
  offerId: string,
  status: Extract<MockServiceOfferStatus, 'declined' | 'expired' | 'cancelled'>,
) {
  mockServiceOffers = mockServiceOffers.map((offer) => offer.id === offerId ? { ...offer, status } : offer);
  return getMockServiceOfferById(offerId);
}

export function confirmMockServiceCoordination(
  requestId: string | undefined,
  bookingId: string,
  offerId?: string,
  meetingPreferences?: AddressDeliveryPreferences,
) {
  if (!requestId) {
    return;
  }

  const request = mockServiceCoordinationRequests.find((item) => item.id === requestId);
  mockServiceCoordinationRequests = mockServiceCoordinationRequests.map((request) => (
    request.id === requestId
      ? { ...request, status: 'Confirmada', bookingId, selectedOfferId: offerId ?? request.selectedOfferId, meetingPreferences }
      : request
  ));
  if (request) {
    const conversation = mockConversations.find((item) => item.id === request.chatId);
    if (conversation) {
      conversation.relatedId = bookingId;
      conversation.subtitle = `${serviceCopy[request.serviceType].label} · Reserva confirmada`;
      conversation.lastMessage = 'Reserva confirmada dentro de Hupi.';
    }
  }
}

export type MockFavoriteProviderList = {
  id: string;
  name: string;
  serviceType?: ServiceId;
  providerIds: string[];
  locked?: boolean;
};

let favoriteProviderListsState: MockFavoriteProviderList[] = [
  { id: 'fav-walk', name: 'Paseadores favoritos', serviceType: 'walk', providerIds: ['provider-andres'], locked: true },
  { id: 'fav-sitter', name: 'Niñeras favoritas', serviceType: 'sitter', providerIds: [], locked: true },
  { id: 'fav-boarding', name: 'Hospedajes favoritos', serviceType: 'boarding', providerIds: [], locked: true },
  { id: 'fav-daycare', name: 'Guarderías favoritas', serviceType: 'daycare', providerIds: [], locked: true },
  { id: 'fav-grooming', name: 'Grooming favoritos', serviceType: 'grooming', providerIds: [], locked: true },
  { id: 'fav-training', name: 'Adiestradores favoritos', serviceType: 'training', providerIds: [], locked: true },
];

export function getMockFavoriteProviderIds() {
  return Array.from(new Set(getMockFavoriteProviderLists().flatMap((list) => list.providerIds)));
}

export function isMockFavoriteProvider(providerId: string) {
  return getMockFavoriteProviderIds().includes(providerId);
}

export function toggleMockFavoriteProvider(providerId: string) {
  const favorite = isMockFavoriteProvider(providerId);
  syncFavorite(providerId, !favorite);

  if (favorite) {
    removeMockProviderFromAllFavoriteLists(providerId);
    return false;
  }

  saveMockProviderFavoriteLists(providerId, getSuggestedFavoriteListIds(providerId));
  return true;
}

export function getSuggestedFavoriteListIds(providerId: string) {
  const provider = mockProviders.find((item) => item.id === providerId);

  if (!provider) {
    return [];
  }

  return favoriteProviderListsState
    .filter((list) => list.serviceType && isServiceEnabled(list.serviceType) && provider.serviceTypes.includes(list.serviceType as BookableServiceId))
    .map((list) => list.id);
}

export function getMockFavoriteProviders(serviceType?: BookableServiceId) {
  const favoriteProviderIds = getMockFavoriteProviderIds();
  return mockProviders.filter((provider) => (
    favoriteProviderIds.includes(provider.id)
    && (!serviceType || provider.serviceTypes.includes(serviceType))
  ));
}

export function getMockFavoriteProviderLists() {
  return favoriteProviderListsState
    .filter((list) => !list.serviceType || isServiceEnabled(list.serviceType))
    .map((list) => ({ ...list, providerIds: [...list.providerIds] }));
}

export function getMockFavoriteProviderListById(listId?: string) {
  const list = favoriteProviderListsState.find((item) => item.id === listId);
  return list && (!list.serviceType || isServiceEnabled(list.serviceType))
    ? { ...list, providerIds: [...list.providerIds] }
    : undefined;
}

export function getMockProviderFavoriteListIds(providerId: string) {
  return favoriteProviderListsState
    .filter((list) => list.providerIds.includes(providerId))
    .map((list) => list.id);
}

export function createMockFavoriteProviderList(name?: string) {
  const normalizedName = name?.trim();
  const nextName = normalizedName || `Lista personal ${favoriteProviderListsState.filter((item) => !item.locked).length + 1}`;
  const existingList = favoriteProviderListsState.find((list) => (
    list.name.trim().toLowerCase() === nextName.toLowerCase()
  ));

  if (existingList) {
    return getMockFavoriteProviderLists();
  }

  const list: MockFavoriteProviderList = {
    id: `fav-custom-${Date.now()}`,
    name: nextName,
    providerIds: [],
  };
  favoriteProviderListsState = [...favoriteProviderListsState, list];
  return getMockFavoriteProviderLists();
}

export function renameMockFavoriteProviderList(listId: string, name: string) {
  favoriteProviderListsState = favoriteProviderListsState.map((list) => (
    list.id === listId ? { ...list, name } : list
  ));
  return getMockFavoriteProviderLists();
}

export function deleteMockFavoriteProviderList(listId: string) {
  favoriteProviderListsState = favoriteProviderListsState.filter((list) => list.id !== listId || list.locked);
  return getMockFavoriteProviderLists();
}

export function addMockProviderToFavoriteList(listId: string, providerId: string) {
  favoriteProviderListsState = favoriteProviderListsState.map((list) => (
    list.id === listId && !list.providerIds.includes(providerId)
      ? { ...list, providerIds: [providerId, ...list.providerIds] }
      : list
  ));
  return getMockFavoriteProviderLists();
}

export function removeMockProviderFromFavoriteList(listId: string, providerId: string) {
  favoriteProviderListsState = favoriteProviderListsState.map((list) => (
    list.id === listId ? { ...list, providerIds: list.providerIds.filter((id) => id !== providerId) } : list
  ));
  return getMockFavoriteProviderLists();
}

export function removeMockProviderFromAllFavoriteLists(providerId: string) {
  favoriteProviderListsState = favoriteProviderListsState.map((list) => ({
    ...list,
    providerIds: list.providerIds.filter((id) => id !== providerId),
  }));
  return getMockFavoriteProviderLists();
}

export function saveMockProviderFavoriteLists(providerId: string, listIds: string[]) {
  favoriteProviderListsState = favoriteProviderListsState.map((list) => {
    const shouldInclude = listIds.includes(list.id);
    const hasProvider = list.providerIds.includes(providerId);

    if (shouldInclude && !hasProvider) {
      return { ...list, providerIds: [providerId, ...list.providerIds] };
    }

    if (!shouldInclude && hasProvider) {
      return { ...list, providerIds: list.providerIds.filter((id) => id !== providerId) };
    }

    return list;
  });

  return getMockFavoriteProviderLists();
}

export function getSupportChatForTicket(ticketNumber?: string, viewer: 'client' | 'provider' = 'client') {
  if (ticketNumber) {
    const normalizedTicket = ticketNumber.replace('#', '');
    const conversation = mockConversations.find((item) => (
      item.type === 'support'
      && item.relatedId === normalizedTicket
      && item.audience === (viewer === 'provider' ? 'provider' : 'customer')
    )) ?? mockConversations.find((item) => (
      item.type === 'support'
      && item.relatedId === normalizedTicket
      && !item.audience
    ));

    if (conversation) {
      return conversation;
    }
  }

  return mockConversations.find((item) => item.id === (viewer === 'provider' ? 'chat-support-provider-2050' : 'chat-support-client-2049'))
    ?? mockConversations.find((item) => item.type === 'support');
}

export const mockChats = [
  {
    id: 'chat-1',
    providerName: 'Andrés & Luna',
    initials: 'AL',
    service: 'Paseo',
    pet: 'Milo',
    status: 'Chat activo',
    preview: 'Hola Ana, coordinemos la hora de entrega.',
    time: '16:42',
    unread: 2,
    accentColor: '#e45336',
    messages: [
      {
        id: 'message-1',
        author: 'system',
        text: 'Chat habilitado por reserva confirmada.',
        time: '16:05',
      },
      {
        id: 'message-2',
        author: 'system',
        text: 'Recuerda mantener la coordinación dentro de Hupi.',
        time: '16:06',
      },
      {
        id: 'message-3',
        author: 'provider',
        text: 'Hola Ana, coordinemos la hora de entrega.',
        time: '16:34',
      },
      {
        id: 'message-4',
        author: 'client',
        text: 'Perfecto, Milo estará listo a las 17:20 en recepción.',
        time: '16:39',
      },
      {
        id: 'message-5',
        author: 'system',
        text: 'No compartas teléfonos, redes sociales o datos para coordinar fuera de la app.',
        time: '16:40',
      },
      {
        id: 'message-6',
        author: 'provider',
        text: 'Gracias, llevaré correa extra y agua para el paseo.',
        time: '16:42',
      },
    ],
  },
  {
    id: 'chat-2',
    providerName: 'Sofía M.',
    initials: 'SM',
    service: 'Niñera',
    pet: 'Nala',
    status: 'Reserva confirmada',
    preview: 'Puedo llegar 10 minutos antes para conocer su rutina.',
    time: '12:18',
    unread: 1,
    accentColor: '#614193',
    messages: [
      {
        id: 'message-1',
        author: 'system',
        text: 'Chat habilitado por reserva confirmada.',
        time: '11:52',
      },
      {
        id: 'message-2',
        author: 'provider',
        text: 'Puedo llegar 10 minutos antes para conocer su rutina.',
        time: '12:18',
      },
      {
        id: 'message-3',
        author: 'system',
        text: 'No compartas teléfonos, redes sociales o datos para coordinar fuera de la app.',
        time: '12:19',
      },
    ],
  },
  {
    id: 'chat-3',
    providerName: 'Casa Colitas',
    initials: 'CC',
    service: 'Guardería',
    pet: 'Milo',
    status: 'Servicio próximo',
    preview: 'Te compartimos las condiciones de ingreso.',
    time: 'Ayer',
    unread: 0,
    accentColor: '#32966f',
    messages: [
      {
        id: 'message-1',
        author: 'system',
        text: 'Chat habilitado por reserva confirmada.',
        time: 'Ayer',
      },
      {
        id: 'message-2',
        author: 'provider',
        text: 'Te compartimos las condiciones de ingreso.',
        time: 'Ayer',
      },
      {
        id: 'message-3',
        author: 'client',
        text: 'Gracias, llevaré su carnet y alimento marcado.',
        time: 'Ayer',
      },
    ],
  },
];

export const mockFaqs = [
  {
    id: 'faq-chat-enabled',
    question: '¿Cuándo se habilita el chat con el proveedor?',
    answer: 'El chat se habilita cuando la reserva queda confirmada, para coordinar detalles del servicio dentro de Hupi.',
  },
  {
    id: 'faq-cancel',
    question: '¿Puedo cancelar una reserva?',
    answer: 'Sí. La app mostrará la política de cancelación y las opciones disponibles según el estado de la reserva.',
  },
  {
    id: 'faq-no-show',
    question: '¿Qué pasa si el proveedor no llega?',
    answer: 'Puedes contactar a Soporte Hupi desde esta sección para revisar el caso, proteger tu pago y aplicar las políticas correspondientes.',
  },
  {
    id: 'faq-refunds',
    question: '¿Cómo funcionan los reembolsos o saldo Hupi?',
    answer: 'Cuando aplique, Hupi podrá gestionar el reembolso o dejar el monto como saldo Hupi para una próxima reserva.',
  },
  {
    id: 'faq-marketplace',
    question: '¿Cómo contacto soporte por marketplace?',
    answer: 'En ecommerce Marketplace, todo reclamo o problema se gestiona únicamente con Soporte Hupi. No hay chat directo con la tienda.',
  },
];

export const mockSupportOptions = [
  {
    id: 'reservation-help',
    title: 'Necesito ayuda con una reserva',
    description: 'Fechas, cambios, llegada del proveedor o coordinación del servicio.',
    icon: 'calendar-outline',
  },
  {
    id: 'payment-issue',
    title: 'Problema con un pago',
    description: 'Cobros, reembolsos, saldo Hupi o comprobantes.',
    icon: 'card-outline',
  },
  {
    id: 'marketplace-help',
    title: 'Ayuda con marketplace',
    description: 'Pedidos, productos, comprobantes o incidencias con soporte Hupi.',
    icon: 'bag-handle-outline',
  },
  {
    id: 'provider-report',
    title: 'Reportar un proveedor',
    description: 'Incumplimientos, retrasos o problemas con el servicio.',
    icon: 'flag-outline',
  },
  {
    id: 'behavior-report',
    title: 'Reportar comportamiento inadecuado',
    description: 'Situaciones que requieren revisión prioritaria de Hupi.',
    icon: 'shield-checkmark-outline',
  },
];

export const mockSocialLinks = [
  {
    id: 'instagram',
    accessibilityLabelKey: 'socialLinks.openInstagram',
    icon: 'logo-instagram',
    labelKey: 'socialLinks.instagram',
    url: 'https://www.instagram.com/hupi.pet',
  },
  {
    id: 'facebook',
    accessibilityLabelKey: 'socialLinks.openFacebook',
    icon: 'logo-facebook',
    labelKey: 'socialLinks.facebook',
    url: 'https://www.facebook.com/hupi.pet',
  },
  {
    id: 'tiktok',
    accessibilityLabelKey: 'socialLinks.openTikTok',
    icon: 'logo-tiktok',
    labelKey: 'socialLinks.tiktok',
    url: 'https://www.tiktok.com/@hupi.pet',
  },
  {
    id: 'linkedin',
    accessibilityLabelKey: 'socialLinks.openLinkedIn',
    icon: 'logo-linkedin',
    labelKey: 'socialLinks.linkedin',
    url: 'https://www.linkedin.com/company/hupi-pet/',
  },
  {
    id: 'web',
    accessibilityLabelKey: 'socialLinks.openWebsite',
    icon: 'globe-outline',
    labelKey: 'socialLinks.website',
    url: 'https://www.hupi.pet/',
  },
] as const;
