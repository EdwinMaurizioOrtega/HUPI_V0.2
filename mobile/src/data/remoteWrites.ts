import { isRemoteBackendEnabled } from '@/config/environment';

import { apiRequest } from './apiClient';
import {
  bookingsRepository,
  conversationsRepository,
  notificationsRepository,
  ordersRepository,
  primeMessages,
  productsRepository,
  providerOrdersRepository,
  supportTicketsRepository,
} from './hupiApi';

/**
 * Propaga al backend las acciones del usuario.
 *
 * La mutación local ya ocurrió, así que la UI responde al instante; aquí se
 * persiste y luego se refresca la colección para reconciliar con el servidor.
 * Sin backend configurado no hace nada.
 */

function fireAndForget(request: Promise<unknown>, refresh?: () => Promise<unknown>) {
  request
    .then(() => refresh?.())
    .catch(() => {
      // El estado local sigue siendo válido; la próxima lectura reconcilia.
    });
}

export function syncStartWalk(bookingId: string): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest(`/bookings/${bookingId}/start`, { method: 'POST' }),
    bookingsRepository.refresh,
  );
}

export function syncCompleteWalk(bookingId: string): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest(`/bookings/${bookingId}/complete`, { method: 'POST' }),
    bookingsRepository.refresh,
  );
}

export function syncCancelBooking(bookingId: string, refundMethod?: string): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: { refundMethod },
    }),
    bookingsRepository.refresh,
  );
}

/** Etiquetas del prototipo a los estados del backend. */
const ORDER_STATUS_CODES: Record<string, string> = {
  Confirmado: 'confirmed',
  'En preparación': 'preparing',
  'Listo para envío': 'ready_to_ship',
  'En camino': 'in_transit',
  Entregado: 'delivered',
  Cancelado: 'cancelled',
};

export function syncProviderOrderStatus(providerOrderId: string, label: string): void {
  if (!isRemoteBackendEnabled()) return;

  const status = ORDER_STATUS_CODES[label];
  if (!status) return;

  fireAndForget(
    apiRequest(`/provider-orders/${providerOrderId}/status`, {
      method: 'POST',
      body: { status },
    }),
    async () => {
      await providerOrdersRepository.refresh();
      await ordersRepository.refresh();
    },
  );
}

export function syncSendMessage(conversationId: string, body: string): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { body },
    }),
    async () => {
      await primeMessages(conversationId);
      await conversationsRepository.refresh();
    },
  );
}

export function syncNotificationRead(notificationId: string): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest(`/notifications/${notificationId}/read`, { method: 'POST' }),
    notificationsRepository.refresh,
  );
}

export function syncNotificationDeleted(notificationId: string): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest(`/notifications/${notificationId}`, { method: 'DELETE' }),
    notificationsRepository.refresh,
  );
}

export function syncBookingReview(
  bookingId: string,
  review: { rating: number; tags: string[]; comment?: string },
): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest(`/bookings/${bookingId}/review`, { method: 'POST', body: review }),
    bookingsRepository.refresh,
  );
}

export function syncRequestResponse(requestId: string, accepted: boolean): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest(`/coordination/requests/${requestId}/respond`, {
      method: 'POST',
      body: { action: accepted ? 'accept' : 'decline' },
    }),
    bookingsRepository.refresh,
  );
}

export function syncCreateTicket(category: string, description: string): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest('/support/tickets', {
      method: 'POST',
      body: { category, description },
    }),
    supportTicketsRepository.refresh,
  );
}

export function syncTicketMessage(ticketId: string, body: string): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest(`/support/tickets/${ticketId}/messages`, { method: 'POST', body: { body } }),
    supportTicketsRepository.refresh,
  );
}

export function syncCloseTicket(ticketId: string): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest(`/support/tickets/${ticketId}/close`, { method: 'POST' }),
    supportTicketsRepository.refresh,
  );
}

// --- Tienda del proveedor -------------------------------------------------

export type StoreProfileInput = {
  name: string;
  description?: string;
  categories?: string[];
  pickupAddress?: string;
  addressReference?: string;
  billingEmail?: string;
  billingPhone?: string;
  internalEmail?: string;
  internalPhone?: string;
};

export function syncStoreProfile(profile: StoreProfileInput): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(apiRequest('/provider/store', { method: 'PUT', body: profile }));
}

export type StoreProductInput = {
  code: string;
  name: string;
  description?: string;
  brand?: string;
  sku?: string;
  categoryId?: string;
  cardPriceBefore?: number;
  cardPriceAfter: number;
  transferPriceBefore?: number;
  transferPriceAfter: number;
  stock: number;
  stockAlertMin?: number;
  tags?: string[];
  isActive: boolean;
};

/** Crear y editar comparten cuerpo; el código decide cuál toca. */
export function syncStoreProduct(product: StoreProductInput, exists: boolean): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    exists
      ? apiRequest(`/provider/store/products/${product.code}`, {
        method: 'PUT',
        body: product,
      })
      : apiRequest('/provider/store/products', { method: 'POST', body: product }),
    productsRepository.refresh,
  );
}

export type ShippingOptionInput = {
  method: string;
  enabled: boolean;
  price: number;
  estimate?: string;
  instructions?: string;
};

export function syncStoreShipping(options: ShippingOptionInput[]): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(apiRequest('/provider/store/shipping', { method: 'PUT', body: options }));
}

// --- Favoritos ------------------------------------------------------------

export function syncFavorite(providerId: string, isFavorite: boolean): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    isFavorite
      ? apiRequest('/favorites', { method: 'POST', body: { providerId } })
      : apiRequest(`/favorites/${providerId}`, { method: 'DELETE' }),
  );
}

// --- Métodos de pago y facturación ----------------------------------------

export type PaymentMethodInput = {
  gatewayToken: string;
  brand: string;
  last4: string;
  holderName: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
};

export function syncPaymentMethod(method: PaymentMethodInput): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(apiRequest('/payment-methods', { method: 'POST', body: method }));
}

export function syncDeletePaymentMethod(methodId: string): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(apiRequest(`/payment-methods/${methodId}`, { method: 'DELETE' }));
}

export type BillingProfileInput = {
  taxpayerType: string;
  identificationType: string;
  identificationNumber: string;
  nameOrBusinessName: string;
  billingEmail: string;
  contactPhone?: string;
  fiscalAddress?: string;
  isDefault: boolean;
};

export function syncBillingProfile(profile: BillingProfileInput): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(apiRequest('/billing-profiles', { method: 'POST', body: profile }));
}

// --- Cupones y validación del carrito -------------------------------------

export function syncCoupon(code: string | null): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    code
      ? apiRequest('/marketplace/cart/coupon', { method: 'POST', body: { code } })
      : apiRequest('/marketplace/cart/coupon', { method: 'DELETE' }),
  );
}

// --- Incidencias ----------------------------------------------------------

export function syncCreateIssue(orderId: string, reason: string, description: string): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest('/issues', { method: 'POST', body: { orderId, reason, description } }),
  );
}

// --- Pedidos: comprobante, reseña y guía ----------------------------------

export function syncPaymentProof(orderId: string, fileName: string): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest(`/orders/${orderId}/payment-proof`, { method: 'POST', body: { fileName } }),
    ordersRepository.refresh,
  );
}

export function syncOrderReview(
  orderId: string,
  review: { storeRating?: number; productRating?: number; comment?: string },
): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest(`/orders/${orderId}/review`, { method: 'POST', body: review }),
    ordersRepository.refresh,
  );
}

export function syncShippingGuide(
  providerOrderId: string,
  carrier: string,
  trackingNumber: string,
): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest(`/provider-orders/${providerOrderId}/shipping-guide`, {
      method: 'POST',
      body: { carrier, trackingNumber },
    }),
    providerOrdersRepository.refresh,
  );
}

// --- Preferencias y reenvío de código -------------------------------------

export function syncPreferences(preferences: {
  language?: string;
  appearance?: string;
  notificationsEnabled?: boolean;
}): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(apiRequest('/account/preferences', { method: 'PUT', body: preferences }));
}

// --- Ofertas de coordinación ---------------------------------------------

export type OfferInput = {
  requestId: string;
  title: string;
  description: string;
  basePrice: number;
  validForHours?: number;
};

export function syncCreateOffer(offer: OfferInput): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(apiRequest('/offers', { method: 'POST', body: offer }));
}

/** `view`, `accept` o `decline`. */
export function syncOfferAction(offerId: string, action: string): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest(`/offers/${offerId}/action`, { method: 'POST', body: { action } }),
    bookingsRepository.refresh,
  );
}

export type NewOrder = {
  paymentMethod: string;
  shippingMethod: string;
  donation: number;
  useHupiBalance: boolean;
  deliveryAddressSnapshot?: unknown;
  billingProfileSnapshot?: unknown;
};

/** El backend numera el pedido y recalcula todos los importes. */
export function syncCreateOrder(order: NewOrder): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest('/orders', { method: 'POST', body: order }),
    async () => {
      await ordersRepository.refresh();
      await providerOrdersRepository.refresh();
    },
  );
}

export type CartLine = {
  productId: string;
  variationId?: string | null;
  quantity: number;
};

export type NewBooking = {
  providerId: string;
  petId?: string;
  service?: string;
  offerTitle?: string;
  scheduledStartAt: string;
  durationMinutes?: number;
  providerValue: number;
  addressSnapshot?: Record<string, unknown>;
  meetingPreferences?: unknown;
};

export function syncCreateBooking(booking: NewBooking): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest('/bookings', { method: 'POST', body: booking }),
    bookingsRepository.refresh,
  );
}

export function syncCart(items: CartLine[]): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest('/marketplace/cart', {
      method: 'PUT',
      body: {
        items: items.map((item) => ({
          productId: item.productId,
          variationId: item.variationId || null,
          quantity: item.quantity,
        })),
      },
    }),
  );
}

export function syncProviderEnrollment(entityType: 'natural' | 'legal'): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest('/provider/enrollment', { method: 'POST', body: { entityType } }),
  );
}

export function syncProviderSection(section: string, isComplete: boolean): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest(`/provider/enrollment/sections/${section}`, {
      method: 'PATCH',
      body: { isComplete },
    }),
  );
}

export function syncProviderEmailValidated(): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(apiRequest('/provider/enrollment/email/validate', { method: 'POST' }));
}

export function syncProviderSubmit(): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(apiRequest('/provider/enrollment/submit', { method: 'POST' }));
}

// --- Servicio Paseos ------------------------------------------------------

export function syncProviderRate(service: string, price: number): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    apiRequest('/provider/walks/rate', { method: 'PUT', body: { service, price } }),
  );
}

export type WalkPlanInput = {
  code?: string;
  name: string;
  description?: string;
  planType?: string;
  durationMinutes: number;
  walkCount?: number;
  petsIncluded?: number;
  modality?: string;
  price: number;
  includes?: string[];
};

export type WalkProfileInput = {
  description: string;
  acceptedDogSizes: string[];
  acceptedDogAges: string[];
  maximumDogsPerWalk: number;
  modalities: string[];
  walkTypes: string[];
  requirements: string[];
};

export function syncWalkProfile(profile: WalkProfileInput): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(apiRequest('/provider/walks/profile', { method: 'PUT', body: profile }));
}

export function syncSubmitWalkProfile(): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(apiRequest('/provider/walks/profile/submit', { method: 'POST' }));
}

export function syncCreateWalkPlan(plan: WalkPlanInput): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(apiRequest('/provider/walks/plans', { method: 'POST', body: plan }));
}

export function syncUpdateWalkPlan(planId: string, plan: WalkPlanInput): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(apiRequest(`/provider/walks/plans/${planId}`, { method: 'PUT', body: plan }));
}

export function syncSubmitWalkPlan(planId: string): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(apiRequest(`/provider/walks/plans/${planId}/submit`, { method: 'POST' }));
}

// --- Cuenta del cliente ---------------------------------------------------

export type ProfileUpdate = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  sector?: string;
  profilePhotoUri?: string;
  isDraft?: boolean;
};

export function syncProfile(profile: ProfileUpdate): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(apiRequest('/account/profile', { method: 'PUT', body: profile }));
}

export function syncSaveAddress(address: Record<string, unknown>, isKnown: boolean): void {
  if (!isRemoteBackendEnabled()) return;

  const id = address.id as string | undefined;
  fireAndForget(
    isKnown && id
      ? apiRequest(`/addresses/${id}`, { method: 'PUT', body: address })
      : apiRequest('/addresses', { method: 'POST', body: address }),
  );
}

export function syncDeleteAddress(addressId: string): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(apiRequest(`/addresses/${addressId}`, { method: 'DELETE' }));
}

export function syncDefaultAddress(addressId: string): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(apiRequest(`/addresses/${addressId}/default`, { method: 'POST' }));
}

export type PetInput = {
  name: string;
  species?: string;
  breed?: string;
  sex?: string;
  size?: string;
  weightKg?: number;
  allergies?: string;
  medications?: string;
  careInstructions?: string;
  veterinarianName?: string;
  clinicName?: string;
  vaccinesUpToDate?: boolean;
  sterilized?: boolean;
};

export function syncSavePet(pet: PetInput, existingId?: string): void {
  if (!isRemoteBackendEnabled()) return;
  fireAndForget(
    existingId
      ? apiRequest(`/pets/${existingId}`, { method: 'PUT', body: pet })
      : apiRequest('/pets', { method: 'POST', body: pet }),
  );
}
