import { apiRequest } from './apiClient';
import { createRemoteCollection } from './remoteCollection';

// Formas devueltas por el backend. Se mantienen los nombres de los mocks para
// que las pantallas no tengan que cambiar.

export type RemoteProvider = {
  id: string;
  name: string;
  initials: string;
  level: string | null;
  avatarColor: string | null;
  isVerifiedByHupi: boolean;
  isOnline: boolean;
  averageResponseTimeMinutes: number | null;
  rating: string;
  reviewCount: number;
  completedServices: number;
  experienceYears: number | null;
  zone: string | null;
  latitude: number | null;
  longitude: number | null;
  serviceTypes: string[];
  servicePrices: Record<string, string>;
  distanceKm?: number;
};

export type RemoteBooking = {
  id: string;
  referenceCode: string | null;
  service: string;
  status: string;
  section: string;
  providerId: string;
  provider: string;
  providerInitials: string;
  pet: string | null;
  client: string;
  offerTitle: string | null;
  scheduledStartAt: string;
  durationMinutes: number;
  startedAt: string | null;
  completedAt: string | null;
  totalPaid: string;
  serviceValue: string;
  clientFee: string;
  providerPayout: string;
  chatAvailable: boolean;
  canCancel: boolean;
  timelineStep: number;
};

export type RemotePet = {
  id: string;
  code: string | null;
  name: string;
  species: string | null;
  breed: string | null;
  weightKg: string | null;
  sex: string | null;
  size: string | null;
  vaccinesUpToDate: boolean;
  sterilized: boolean;
};

export type RemoteProduct = {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  brand: string | null;
  cardPriceAfter: string;
  transferPriceAfter: string;
  stock: number;
  isAvailable: boolean;
  tags: string[];
};

export type RemoteOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: string;
  createdAt: string;
  items: { productName: string; quantity: number; unitPrice: string }[];
  stores: string[];
};

export type RemoteNotification = {
  id: string;
  category: string;
  title: string;
  body: string;
  isRead: boolean;
  actionTarget: string | null;
  createdAt: string;
};

export type RemoteConversation = {
  id: string;
  conversationType: string;
  title: string;
  isOpen: boolean;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

export type RemoteMessage = {
  id: string;
  senderRole: string;
  senderAccountId: string | null;
  body: string;
  status: string;
  createdAt: string;
};

export type RemoteProviderOrder = {
  id: string;
  providerOrderNumber: string;
  orderId: string;
  orderNumber: string;
  storeId: string;
  storeName: string;
  customerName: string;
  status: string;
  deliveryType: string;
  carrier: string | null;
  trackingNumber: string | null;
  subtotal: string;
  hupiCommission: string;
  providerNet: string;
  placedAt: string;
  items: { productName: string; quantity: number; unitPrice: string; sku: string | null }[];
};

export type RemotePayout = {
  id: string;
  settlementNumber: string;
  periodMonth: string;
  grossSales: string;
  hupiCommission: string;
  providerNet: string;
  totalToTransfer: string;
  status: string;
};

export type RemotePetHistoryItem = {
  bookingId: string;
  referenceCode: string | null;
  title: string;
  provider: string;
  status: string;
  date: string;
};

const historyByPet = new Map<string, RemotePetHistoryItem[]>();
const historyListeners = new Set<() => void>();
const historyInFlight = new Set<string>();

export function getCachedPetHistory(petId: string): RemotePetHistoryItem[] | null {
  return historyByPet.get(petId) ?? null;
}

export function subscribePetHistory(listener: () => void) {
  historyListeners.add(listener);
  return () => {
    historyListeners.delete(listener);
  };
}

export function primePetHistory(petId: string): void {
  if (historyByPet.has(petId) || historyInFlight.has(petId)) return;

  historyInFlight.add(petId);
  apiRequest<RemotePetHistoryItem[]>(`/pets/${petId}/history`)
    .then((items) => {
      historyByPet.set(petId, items);
      historyListeners.forEach((listener) => listener());
    })
    .catch(() => undefined)
    .finally(() => {
      historyInFlight.delete(petId);
    });
}

export type RemoteProviderReview = {
  bookingId: string;
  rating: number;
  tags: string[];
  comment: string | null;
  customerDisplayName: string;
  createdAt: string;
};

const reviewsByProvider = new Map<string, RemoteProviderReview[]>();
const reviewListeners = new Set<() => void>();
const reviewsInFlight = new Set<string>();

export function getCachedProviderReviews(providerId: string): RemoteProviderReview[] | null {
  return reviewsByProvider.get(providerId) ?? null;
}

export function subscribeProviderReviews(listener: () => void) {
  reviewListeners.add(listener);
  return () => {
    reviewListeners.delete(listener);
  };
}

/** Las reseñas se piden por proveedor y se cachean para leerlas en el render. */
export function primeProviderReviews(providerId: string): void {
  if (reviewsByProvider.has(providerId) || reviewsInFlight.has(providerId)) return;

  reviewsInFlight.add(providerId);
  apiRequest<RemoteProviderReview[]>(`/providers/${providerId}/reviews`)
    .then((reviews) => {
      reviewsByProvider.set(providerId, reviews);
      reviewListeners.forEach((listener) => listener());
    })
    .catch(() => undefined)
    .finally(() => {
      reviewsInFlight.delete(providerId);
    });
}

export type RemoteWalkProfile = {
  description: string;
  acceptedDogSizes: string[];
  acceptedDogAges: string[];
  maximumDogsPerWalk: number;
  modalities: string[];
  walkTypes: string[];
  requirements: string[];
  hourlyRate: string | null;
  status: string;
};

export async function fetchWalkProfile(): Promise<RemoteWalkProfile | null> {
  return apiRequest<RemoteWalkProfile | null>('/provider/walks/profile');
}

export type RemoteTicket = {
  id: string;
  caseNumber: string;
  category: string;
  description: string;
  status: string;
  createdAt: string;
  messages: { authorRole: string; body: string; createdAt: string }[];
};

export type RemoteWalletMovement = {  id: string;
  concept: string;
  amount: string;
  movementType: string;
  status: string;
  createdAt: string;
};

export const providersRepository = createRemoteCollection<RemoteProvider>(
  '/providers/search?service=walk',
);export const bookingsRepository = createRemoteCollection<RemoteBooking>('/bookings');
export const petsRepository = createRemoteCollection<RemotePet>('/pets');
export const productsRepository = createRemoteCollection<RemoteProduct>('/marketplace/products');
export const ordersRepository = createRemoteCollection<RemoteOrder>('/orders');
export const notificationsRepository = createRemoteCollection<RemoteNotification>('/notifications');
export const conversationsRepository = createRemoteCollection<RemoteConversation>('/conversations');
export const providerOrdersRepository =
  createRemoteCollection<RemoteProviderOrder>('/provider-orders');
export const walletMovementsRepository =
  createRemoteCollection<RemoteWalletMovement>('/wallet/movements');
export const supportTicketsRepository =
  createRemoteCollection<RemoteTicket>('/support/tickets');
export const payoutsRepository = createRemoteCollection<RemotePayout>('/provider/payouts');

// Los mensajes se piden por conversación; se cachean para poder leerlos
// de forma síncrona desde las pantallas.
const messagesByConversation = new Map<string, RemoteMessage[]>();
const messageListeners = new Set<() => void>();

export function getCachedMessages(conversationId: string): RemoteMessage[] | null {
  return messagesByConversation.get(conversationId) ?? null;
}

export function subscribeMessages(listener: () => void) {
  messageListeners.add(listener);
  return () => {
    messageListeners.delete(listener);
  };
}

export async function primeMessages(conversationId: string): Promise<void> {
  try {
    const messages = await apiRequest<RemoteMessage[]>(
      `/conversations/${conversationId}/messages`,
    );
    messagesByConversation.set(conversationId, messages);
    messageListeners.forEach((listener) => listener());
  } catch {
    // Sin conexión la pantalla conserva lo que ya tuviera.
  }
}

/** Búsqueda con coordenadas y filtro; no usa la caché de la colección. */
export async function searchProviders(params: {
  service?: string;
  latitude?: number;
  longitude?: number;
  filter?: 'best-rated' | 'closest' | 'verified';
  radiusKm?: number;
}): Promise<RemoteProvider[]> {
  const query = new URLSearchParams();
  query.set('service', params.service ?? 'walk');
  if (params.latitude !== undefined) query.set('latitude', String(params.latitude));
  if (params.longitude !== undefined) query.set('longitude', String(params.longitude));
  if (params.filter) query.set('filter', params.filter);
  if (params.radiusKm !== undefined) query.set('radiusKm', String(params.radiusKm));

  return apiRequest<RemoteProvider[]>(`/providers/search?${query.toString()}`);
}

export async function getProviderDetail(providerId: string) {
  return apiRequest<RemoteProvider & { plans: unknown[]; walkProfile: unknown }>(
    `/providers/${providerId}`,
  );
}

export async function getBooking(reference: string) {
  return apiRequest<RemoteBooking>(`/bookings/${reference}`);
}

export async function getCancellationQuote(reference: string) {
  return apiRequest<{
    tier: 'free' | 'half' | 'full';
    penaltyPercent: number;
    originalAmount: string;
    cancellationCharge: string;
    refundAmount: string;
    hoursUntilStart: number;
  }>(`/bookings/${reference}/cancellation-quote`);
}

export async function cancelBooking(reference: string, refundMethod?: string) {
  const booking = await apiRequest<RemoteBooking>(`/bookings/${reference}/cancel`, {
    method: 'POST',
    body: { refundMethod },
  });
  await bookingsRepository.refresh();
  return booking;
}

export async function startWalk(reference: string) {
  const booking = await apiRequest<RemoteBooking>(`/bookings/${reference}/start`, {
    method: 'POST',
  });
  await bookingsRepository.refresh();
  return booking;
}

export async function completeWalk(reference: string) {
  const booking = await apiRequest<RemoteBooking>(`/bookings/${reference}/complete`, {
    method: 'POST',
  });
  await bookingsRepository.refresh();
  return booking;
}

export async function getWalletBalance() {
  return apiRequest<{ available: string; pending: string }>('/wallet');
}

export type RemoteEnrollment = {
  id: string;
  entityType: 'natural' | 'legal';
  status: string;
  emailValidated: boolean;
  progress: number;
  missingSections: string[];
  lastPendingSection: string | null;
  canSubmit: boolean;
  submittedAt: string | null;
  sections: { key: string; status: string; complete: boolean }[];
};

/** Devuelve null si la cuenta no tiene enrolamiento o no hay backend. */
export async function fetchProviderEnrollment(): Promise<RemoteEnrollment | null> {
  try {
    return await apiRequest<RemoteEnrollment | null>('/provider/enrollment');
  } catch {
    return null;
  }
}

export async function getConversations() {
  return apiRequest<
    {
      id: string;
      conversationType: string;
      title: string;
      lastMessage: string | null;
      unreadCount: number;
    }[]
  >('/conversations');
}

export async function getMessages(conversationId: string) {
  return apiRequest<
    { id: string; senderRole: string; body: string; status: string; createdAt: string }[]
  >(`/conversations/${conversationId}/messages`);
}

export async function sendMessage(conversationId: string, body: string) {
  return apiRequest(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: { body },
  });
}
