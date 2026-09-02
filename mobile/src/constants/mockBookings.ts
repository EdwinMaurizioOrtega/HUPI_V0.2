import { getMockBookingDetails, type MockPaymentBreakdown } from './mockCheckout';
import { isBookableServiceEnabled } from './features';
import { type BookableServiceId, serviceCopy } from './services';
import { getRemoteBookings } from '@/data/remoteOverlay';
import { syncBookingReview, syncCancelBooking, syncCompleteWalk, syncCreateBooking, syncRequestResponse, syncStartWalk } from '@/data/remoteWrites';
import type { AddressDeliveryPreferences } from '@/domain/address';
import type { BookingCancellationQuote } from '@/domain/bookingCancellationPolicy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  calculateProviderWalkMetrics,
  formatWalkElapsedTime,
  getProviderDelayMinutes,
  getWalkElapsedSeconds,
  PROVIDER_ON_TIME_GRACE_MINUTES,
} from '@/domain/walkOperation';
import { QA_WALK_ID, transitionQaWalk, type QaWalkStatus } from '@/domain/qaWalk';

export { formatWalkElapsedTime, getProviderDelayMinutes, getWalkElapsedSeconds, PROVIDER_ON_TIME_GRACE_MINUTES };

export type BookingStatus = 'Solicitud creada' | 'Solicitud de coordinación' | 'Oferta enviada' | 'Pendiente de pago' | 'Confirmada' | 'Programada' | 'Próxima' | 'En curso' | 'Finalizada' | 'Completada' | 'Cancelada';
export type BookingSection = 'upcoming' | 'current' | 'history' | 'cancelled';
export type BookingService = 'Paseo' | 'Niñera' | 'Hospedaje' | 'Guardería';

export type MockBooking = {
  id: string;
  serviceId: BookableServiceId;
  service: BookingService;
  status: BookingStatus;
  section: BookingSection;
  provider: string;
  providerInitials: string;
  pet: string;
  client: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  relatedOrderNumber?: string;
  totalPaid: number;
  serviceValue?: number;
  clientFee?: number;
  providerPayout?: number;
  hupiProviderCommission?: number;
  hupiTotalRevenue?: number;
  coordinationRequestId?: string;
  selectedOfferId?: string;
  offerTitle?: string;
  meetingPreferences?: AddressDeliveryPreferences;
  chatAvailable: boolean;
  canCancel: boolean;
  timelineStep: number;
  startsAt: string;
  scheduledStartAt: string;
  startedAt?: string;
  completedAt?: string;
  actualDurationMinutes?: number;
  cancelledBy?: 'client' | 'provider';
  clientRefundAmount?: number;
  cancellation?: BookingCancellationQuote & { refundMethod: 'wallet' | 'refund' };
};

export const bookingTimelineLabels = [
  'Reserva creada',
  'Pago confirmado',
  'Chat habilitado',
  'Servicio próximo',
  'Servicio completado',
];

const initialMockBookings: MockBooking[] = [
  {
    id: QA_WALK_ID,
    serviceId: 'walk',
    service: 'Paseo',
    status: 'Programada',
    section: 'upcoming',
    provider: 'Andrés & Luna',
    providerInitials: 'AL',
    pet: 'Milo',
    client: 'Valentina Paredes',
    date: '25 de agosto de 2026',
    time: '17:30',
    duration: '60 minutos',
    location: 'La Carolina, Quito',
    totalPaid: 14.38,
    serviceValue: 12.5,
    clientFee: 1.88,
    providerPayout: 8.75,
    hupiProviderCommission: 3.75,
    hupiTotalRevenue: 5.63,
    chatAvailable: true,
    canCancel: true,
    timelineStep: 2,
    startsAt: '2026-08-25T17:30:00-05:00',
    scheduledStartAt: '2026-08-25T17:30:00-05:00',
  },
  {
    id: 'booking-walk-001',
    serviceId: 'walk',
    service: 'Paseo',
    status: 'Confirmada',
    section: 'upcoming',
    provider: 'Andrés & Luna',
    providerInitials: 'AL',
    pet: 'Milo',
    client: 'Valentina Paredes',
    date: '12 de julio de 2026',
    time: '17:30',
    duration: '60 minutos',
    location: 'La Carolina, Quito',
    totalPaid: 14.38,
    serviceValue: 12.5,
    clientFee: 1.88,
    providerPayout: 8.75,
    hupiProviderCommission: 3.75,
    hupiTotalRevenue: 5.63,
    chatAvailable: true,
    canCancel: true,
    timelineStep: 2,
    startsAt: '2026-07-12T17:30:00-05:00',
    scheduledStartAt: '2026-07-12T17:30:00-05:00',
  },
  {
    id: 'booking-daycare-002',
    serviceId: 'daycare',
    service: 'Guardería',
    status: 'Próxima',
    section: 'upcoming',
    provider: 'Casa Colitas',
    providerInitials: 'CC',
    pet: 'Milo',
    client: 'Valentina Paredes',
    date: '18 de julio de 2026',
    time: '08:00',
    duration: '8 horas',
    location: 'Cumbayá, Quito',
    totalPaid: 31.05,
    serviceValue: 27,
    clientFee: 4.05,
    providerPayout: 18.9,
    hupiProviderCommission: 8.1,
    hupiTotalRevenue: 12.15,
    chatAvailable: true,
    canCancel: true,
    timelineStep: 3,
    startsAt: '2026-07-18T08:00:00-05:00',
    scheduledStartAt: '2026-07-18T08:00:00-05:00',
  },
  {
    id: 'booking-sitter-003',
    serviceId: 'sitter',
    service: 'Niñera',
    status: 'En curso',
    section: 'current',
    provider: 'Sofía M.',
    providerInitials: 'SM',
    pet: 'Milo',
    client: 'Valentina Paredes',
    date: '6 de julio de 2026',
    time: '14:00',
    duration: '4 horas',
    location: 'La Floresta, Quito',
    totalPaid: 25.3,
    serviceValue: 22,
    clientFee: 3.3,
    providerPayout: 15.4,
    hupiProviderCommission: 6.6,
    hupiTotalRevenue: 9.9,
    chatAvailable: true,
    canCancel: false,
    timelineStep: 3,
    startsAt: '2026-07-06T14:00:00-05:00',
    scheduledStartAt: '2026-07-06T14:00:00-05:00',
    startedAt: '2026-07-06T14:03:00-05:00',
  },
  {
    id: 'booking-walk-004',
    serviceId: 'walk',
    service: 'Paseo',
    status: 'Completada',
    section: 'history',
    provider: 'Andrés & Luna',
    providerInitials: 'AL',
    pet: 'Milo',
    client: 'Valentina Paredes',
    date: '28 de junio de 2026',
    time: '09:30',
    duration: '60 minutos',
    location: 'La Carolina, Quito',
    relatedOrderNumber: 'HUPI-MK-2048',
    totalPaid: 14.38,
    serviceValue: 12.5,
    clientFee: 1.88,
    providerPayout: 8.75,
    hupiProviderCommission: 3.75,
    hupiTotalRevenue: 5.63,
    chatAvailable: false,
    canCancel: false,
    timelineStep: 4,
    startsAt: '2026-06-28T09:30:00-05:00',
    scheduledStartAt: '2026-06-28T09:30:00-05:00',
    startedAt: '2026-06-28T09:34:00-05:00',
    completedAt: '2026-06-28T10:35:00-05:00',
    actualDurationMinutes: 61,
  },
  {
    id: 'booking-boarding-005',
    serviceId: 'boarding',
    service: 'Hospedaje',
    status: 'Completada',
    section: 'history',
    provider: 'Patitas Hotel',
    providerInitials: 'PH',
    pet: 'Milo',
    client: 'Valentina Paredes',
    date: '14 de junio de 2026',
    time: '10:00',
    duration: '2 noches',
    location: 'Tumbaco, Quito',
    totalPaid: 82.8,
    serviceValue: 72,
    clientFee: 10.8,
    providerPayout: 50.4,
    hupiProviderCommission: 21.6,
    hupiTotalRevenue: 32.4,
    chatAvailable: false,
    canCancel: false,
    timelineStep: 4,
    startsAt: '2026-06-14T10:00:00-05:00',
    scheduledStartAt: '2026-06-14T10:00:00-05:00',
  },
  {
    id: 'booking-daycare-006',
    serviceId: 'daycare',
    service: 'Guardería',
    status: 'Cancelada',
    section: 'cancelled',
    provider: 'Hogar Peludo',
    providerInitials: 'HP',
    pet: 'Milo',
    client: 'Valentina Paredes',
    date: '2 de junio de 2026',
    time: '08:30',
    duration: '6 horas',
    location: 'Iñaquito, Quito',
    totalPaid: 0,
    chatAvailable: false,
    canCancel: false,
    timelineStep: 1,
    startsAt: '2026-06-02T08:30:00-05:00',
    scheduledStartAt: '2026-06-02T08:30:00-05:00',
  },
];

let mockBookingsState = initialMockBookings.map((booking) => ({ ...booking }));
const WALK_OPERATIONS_STORAGE_KEY = 'hupi.walkOperations.v1';
export type MockWalkEventType = 'walk_started' | 'walk_completed' | 'provider_cancelled_walk';
export type MockWalkEvent = { bookingId: string; type: MockWalkEventType; timestamp: string };
let mockWalkEventsState: MockWalkEvent[] = [];

type PersistedWalkOperations = {
  bookings: Array<Pick<MockBooking, 'id' | 'status' | 'section' | 'startedAt' | 'completedAt' | 'actualDurationMinutes' | 'cancelledBy' | 'providerPayout' | 'clientRefundAmount' | 'canCancel' | 'chatAvailable' | 'timelineStep'>>;
  events: MockWalkEvent[];
};

function persistMockWalkOperations() {
  const payload: PersistedWalkOperations = {
    bookings: mockBookingsState.filter((booking) => booking.serviceId === 'walk').map((booking) => ({
      id: booking.id,
      status: booking.status,
      section: booking.section,
      startedAt: booking.startedAt,
      completedAt: booking.completedAt,
      actualDurationMinutes: booking.actualDurationMinutes,
      cancelledBy: booking.cancelledBy,
      providerPayout: booking.providerPayout,
      clientRefundAmount: booking.clientRefundAmount,
      canCancel: booking.canCancel,
      chatAvailable: booking.chatAvailable,
      timelineStep: booking.timelineStep,
    })),
    events: mockWalkEventsState,
  };
  void AsyncStorage.setItem(WALK_OPERATIONS_STORAGE_KEY, JSON.stringify(payload)).catch((error) => {
    if (__DEV__) console.warn('[walk-operations] No se pudo persistir el estado local.', error);
  });
}

export async function initializeMockWalkOperations() {
  try {
    const stored = await AsyncStorage.getItem(WALK_OPERATIONS_STORAGE_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored) as PersistedWalkOperations;
    const storedById = new Map(parsed.bookings?.map((booking) => [booking.id, booking]) ?? []);
    mockBookingsState = mockBookingsState.map((booking) => ({ ...booking, ...(storedById.get(booking.id) ?? {}) }));
    mockBookings.splice(0, mockBookings.length, ...mockBookingsState);
    mockWalkEventsState = Array.isArray(parsed.events) ? parsed.events : [];
  } catch (error) {
    if (__DEV__) console.warn('[walk-operations] No se pudo restaurar el estado local.', error);
  }
}
const mockBookingReviewsState = new Map<string, MockBookingReview>();

export const mockBookings = mockBookingsState;

export type MockBookingReview = {
  rating: number;
  tags: string[];
};

export function getMockBookingReview(bookingId: string) {
  const review = mockBookingReviewsState.get(bookingId);
  return review ? { ...review, tags: [...review.tags] } : undefined;
}

export function submitMockBookingReview(bookingId: string, review: MockBookingReview) {
  const savedReview = {
    rating: Math.max(1, Math.min(5, Math.round(review.rating))),
    tags: [...review.tags],
  };
  mockBookingReviewsState.set(bookingId, savedReview);
  syncBookingReview(bookingId, savedReview);
  return { ...savedReview, tags: [...savedReview.tags] };
}

export type MockServiceBookingInput = {
  serviceId: BookableServiceId;
  provider: string;
  providerInitials: string;
  pet: string;
  location: string;
  payment: MockPaymentBreakdown;
  donation?: number;
  coordinationRequestId?: string;
  selectedOfferId?: string;
  offerTitle?: string;
  meetingPreferences?: AddressDeliveryPreferences;
  /** Necesarios para persistir la reserva en el backend. */
  providerId?: string;
  petId?: string;
};

export function getMockBookings() {
  const local = mockBookingsState
    .filter((booking) => isBookableServiceEnabled(booking.serviceId))
    .map((booking) => ({ ...booking }));

  // Con backend configurado el estado vivo manda; si no, se usan los mocks.
  const remote = getRemoteBookings(mockBookingsState);
  if (!remote) return local;

  return remote.filter((booking) => isBookableServiceEnabled(booking.serviceId));
}

export function getMockBookingById(bookingId?: string) {
  const visibleBookings = getMockBookings();
  return visibleBookings.find((booking) => booking.id === bookingId) ?? visibleBookings[0] ?? mockBookingsState[0];
}

export function getQaMockWalk() {
  const booking = mockBookingsState.find((item) => item.id === QA_WALK_ID);
  return booking ? { ...booking } : undefined;
}

export function getQaWalkForClient() {
  return getMockBookingById(QA_WALK_ID);
}

export function getQaWalkForProvider() {
  return getMockBookingById(QA_WALK_ID);
}

export function cancelMockBooking(
  bookingId: string,
  refundMethod: 'wallet' | 'refund',
  quote: BookingCancellationQuote,
) {
  mockBookingsState = mockBookingsState.map((booking) => booking.id === bookingId
    ? {
      ...booking,
      status: 'Cancelada',
      section: 'cancelled',
      canCancel: false,
      chatAvailable: false,
      cancellation: { ...quote, refundMethod },
      cancelledBy: 'client',
    }
    : booking);
  mockBookings.splice(0, mockBookings.length, ...mockBookingsState);
  persistMockWalkOperations();
  syncCancelBooking(bookingId, refundMethod === 'wallet' ? 'hupi_balance' : 'original_payment_method');
  return getMockBookingById(bookingId);
}

export function resolveMockBookingStartAt(date: string, time: string) {
  const months: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
  };
  const dateMatch = date.toLocaleLowerCase().match(/(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+de\s+(\d{4})/);
  const timeMatch = time.match(/(\d{1,2}):(\d{2})/);
  const month = dateMatch ? months[dateMatch[2]] : undefined;
  if (!dateMatch || !timeMatch || month === undefined) return new Date();
  return new Date(Number(dateMatch[3]), month, Number(dateMatch[1]), Number(timeMatch[1]), Number(timeMatch[2]));
}

export function addMockServiceBooking(input: MockServiceBookingInput) {
  const details = getMockBookingDetails(input.serviceId);
  const copy = serviceCopy[input.serviceId];
  const donation = input.donation ?? 0;
  const booking: MockBooking = {
    id: `booking-${input.serviceId}-${Date.now()}`,
    serviceId: input.serviceId,
    service: copy.label as BookingService,
    status: 'Programada',
    section: 'upcoming',
    provider: input.provider,
    providerInitials: input.providerInitials,
    pet: input.pet,
    client: 'Valentina Paredes',
    date: details.date,
    time: details.hour,
    duration: details.duration,
    location: input.location,
    totalPaid: Math.round((input.payment.total + donation + Number.EPSILON) * 100) / 100,
    serviceValue: input.payment.providerValue,
    clientFee: input.payment.clientFee,
    providerPayout: input.payment.providerPayout,
    hupiProviderCommission: input.payment.hupiProviderCommission,
    hupiTotalRevenue: input.payment.hupiTotalRevenue,
    coordinationRequestId: input.coordinationRequestId,
    selectedOfferId: input.selectedOfferId,
    offerTitle: input.offerTitle,
    meetingPreferences: input.meetingPreferences,
    chatAvailable: true,
    canCancel: true,
    timelineStep: 2,
    startsAt: resolveMockBookingStartAt(details.date, details.hour).toISOString(),
    scheduledStartAt: resolveMockBookingStartAt(details.date, details.hour).toISOString(),
  };

  mockBookingsState = [booking, ...mockBookingsState];
  mockBookings.splice(0, mockBookings.length, ...mockBookingsState);
  persistMockWalkOperations();

  // El backend recalcula el desglose a partir del valor del proveedor.
  if (input.providerId) {
    syncCreateBooking({
      providerId: input.providerId,
      petId: input.petId,
      service: input.serviceId,
      offerTitle: input.offerTitle,
      scheduledStartAt: booking.scheduledStartAt,
      durationMinutes: Number.parseInt(details.duration, 10) || 60,
      providerValue: input.payment.providerValue,
      addressSnapshot: { formattedAddress: input.location },
      meetingPreferences: input.meetingPreferences,
    });
  }

  return { ...booking };
}

export type MockProviderRequest = {
  id: string;
  serviceId: BookableServiceId;
  service: BookingService;
  pet: string;
  client: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  providerTotal: number;
  serviceValue: number;
  hupiCommission: number;
  status: 'Solicitud creada' | 'Aceptada' | 'Rechazada';
  careNotes: string;
  conditions: string[];
};

const mockProviderRequestsSeed: MockProviderRequest[] = [
  {
    id: 'request-walk-001',
    serviceId: 'walk',
    service: 'Paseo',
    pet: 'Milo',
    client: 'Valentina Paredes',
    date: '12 de julio de 2026',
    time: '17:30',
    duration: '60 minutos',
    location: 'La Carolina, Quito',
    providerTotal: 8.75,
    serviceValue: 12.5,
    hupiCommission: 3.75,
    status: 'Solicitud creada',
    careNotes: 'Usar arnés morado, evitar correr al inicio y ofrecer agua al final.',
    conditions: ['Tracking obligatorio', 'Registrar lluvia o saldo de tiempo si aplica'],
  },
  {
    id: 'request-sitter-002',
    serviceId: 'sitter',
    service: 'Niñera',
    pet: 'Milo',
    client: 'Valentina Paredes',
    date: '12 de julio de 2026',
    time: '14:00',
    duration: '2 horas',
    location: 'La Carolina, Quito',
    providerTotal: 14,
    serviceValue: 20,
    hupiCommission: 6,
    status: 'Solicitud creada',
    careNotes: 'Revisar agua, comida y enviar fotos por chat cuando la reserva esté programada.',
    conditions: ['Cuidado a domicilio', 'Acceso coordinado por soporte Hupi'],
  },
  {
    id: 'request-daycare-003',
    serviceId: 'daycare',
    service: 'Guardería',
    pet: 'Milo',
    client: 'Valentina Paredes',
    date: '18 de julio de 2026',
    time: '08:00 a 16:00',
    duration: '8 horas',
    location: 'Cumbayá, Quito',
    providerTotal: 18.9,
    serviceValue: 27,
    hupiCommission: 8.1,
    status: 'Solicitud creada',
    careNotes: 'Socialización controlada y descanso al mediodía.',
    conditions: ['Máximo 5 mascotas', 'Supervisión permanente'],
  },
  {
    id: 'request-boarding-004',
    serviceId: 'boarding',
    service: 'Hospedaje',
    pet: 'Milo',
    client: 'Valentina Paredes',
    date: '20 al 21 de julio de 2026',
    time: 'Entrega 09:00',
    duration: '1 noche',
    location: 'Tumbaco, Quito',
    providerTotal: 29.4,
    serviceValue: 42,
    hupiCommission: 12.6,
    status: 'Solicitud creada',
    careNotes: 'Milo duerme dentro de casa y necesita paseo corto en la noche.',
    conditions: ['Vacunas al día', 'Alimento identificado', 'Sin jaulas'],
  },
];

let mockProviderRequestsState = mockProviderRequestsSeed.map((request) => ({ ...request }));

export function getMockProviderRequests() {
  return mockProviderRequestsState
    .filter((request) => isBookableServiceEnabled(request.serviceId))
    .map((request) => ({ ...request, conditions: [...request.conditions] }));
}

export function updateMockProviderRequestStatus(requestId: string, status: MockProviderRequest['status']) {
  mockProviderRequestsState = mockProviderRequestsState.map((request) => (
    request.id === requestId ? { ...request, status } : request
  ));

  if (status === 'Aceptada' || status === 'Rechazada') {
    syncRequestResponse(requestId, status === 'Aceptada');
  }

  return getMockProviderRequests();
}

export function formatBookingCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

export function canStartProviderWalk(booking: MockBooking) {
  return booking.serviceId === 'walk' && ['Confirmada', 'Programada', 'Próxima'].includes(booking.status);
}

export function canCancelProviderWalk(booking: MockBooking) {
  return booking.serviceId === 'walk' && ['Confirmada', 'Programada', 'Próxima'].includes(booking.status);
}

export function startMockProviderWalk(bookingId: string, startedAt = new Date().toISOString()) {
  const current = mockBookingsState.find((booking) => booking.id === bookingId);
  if (!current || !canStartProviderWalk(current)) return current ? { ...current } : undefined;
  mockBookingsState = mockBookingsState.map((booking) => booking.id === bookingId ? {
    ...booking,
    status: 'En curso',
    section: 'current',
    startedAt,
    canCancel: false,
    timelineStep: 3,
  } : booking);
  mockWalkEventsState = [...mockWalkEventsState, { bookingId, type: 'walk_started', timestamp: startedAt }];
  mockBookings.splice(0, mockBookings.length, ...mockBookingsState);
  persistMockWalkOperations();
  syncStartWalk(bookingId);
  return getMockBookingById(bookingId);
}

export function completeMockProviderWalk(bookingId: string, completedAt = new Date().toISOString()) {
  const current = mockBookingsState.find((booking) => booking.id === bookingId);
  if (!current || current.status !== 'En curso' || !current.startedAt) return current ? { ...current } : undefined;
  const durationMs = Math.max(0, new Date(completedAt).getTime() - new Date(current.startedAt).getTime());
  mockBookingsState = mockBookingsState.map((booking) => booking.id === bookingId ? {
    ...booking,
    status: 'Completada',
    section: 'history',
    completedAt,
    actualDurationMinutes: Math.round(durationMs / 60_000),
    canCancel: false,
    chatAvailable: false,
    timelineStep: 4,
  } : booking);
  mockWalkEventsState = [...mockWalkEventsState, { bookingId, type: 'walk_completed', timestamp: completedAt }];
  mockBookings.splice(0, mockBookings.length, ...mockBookingsState);
  persistMockWalkOperations();
  syncCompleteWalk(bookingId);
  return getMockBookingById(bookingId);
}

export function cancelMockProviderWalk(bookingId: string, cancelledAt = new Date().toISOString()) {
  const current = mockBookingsState.find((booking) => booking.id === bookingId);
  if (!current || !canCancelProviderWalk(current)) return current ? { ...current } : undefined;
  mockBookingsState = mockBookingsState.map((booking) => booking.id === bookingId ? {
    ...booking,
    status: 'Cancelada',
    section: 'cancelled',
    cancelledBy: 'provider',
    providerPayout: 0,
    clientRefundAmount: booking.totalPaid,
    canCancel: false,
    chatAvailable: false,
  } : booking);
  mockWalkEventsState = [...mockWalkEventsState, { bookingId, type: 'provider_cancelled_walk', timestamp: cancelledAt }];
  mockBookings.splice(0, mockBookings.length, ...mockBookingsState);
  persistMockWalkOperations();
  return getMockBookingById(bookingId);
}

export function setMockQaWalkStatus(status: QaWalkStatus, timestamp = new Date().toISOString()) {
  const current = getQaMockWalk();
  if (!current) return undefined;
  const timing = transitionQaWalk(current.status === 'En curso'
    ? { status: 'in_progress', startedAt: current.startedAt }
    : { status: 'scheduled' }, status, timestamp);

  mockWalkEventsState = mockWalkEventsState.filter((event) => event.bookingId !== QA_WALK_ID);
  mockBookingsState = mockBookingsState.map((booking) => booking.id === QA_WALK_ID ? {
    ...booking,
    status: 'Programada',
    section: 'upcoming',
    startedAt: undefined,
    completedAt: undefined,
    actualDurationMinutes: undefined,
    cancelledBy: undefined,
    clientRefundAmount: undefined,
    providerPayout: 8.75,
    canCancel: true,
    chatAvailable: true,
    timelineStep: 2,
  } : booking);
  mockBookings.splice(0, mockBookings.length, ...mockBookingsState);

  if (timing.status === 'in_progress') return startMockProviderWalk(QA_WALK_ID, timing.startedAt);
  if (timing.status === 'completed') {
    const startedAt = current.startedAt ?? new Date(new Date(timestamp).getTime() - 30 * 60_000).toISOString();
    startMockProviderWalk(QA_WALK_ID, startedAt);
    return completeMockProviderWalk(QA_WALK_ID, timing.completedAt);
  }
  if (timing.status === 'cancelled') return cancelMockProviderWalk(QA_WALK_ID, timestamp);

  persistMockWalkOperations();
  return getQaMockWalk();
}

export function getMockWalkEvents(bookingId?: string) {
  return mockWalkEventsState.filter((event) => !bookingId || event.bookingId === bookingId).map((event) => ({ ...event }));
}

export function getMockProviderWalkMetrics(providerName: string) {
  const relevant = mockBookingsState.filter((booking) => booking.serviceId === 'walk' && booking.provider === providerName);
  return calculateProviderWalkMetrics(relevant);
}
