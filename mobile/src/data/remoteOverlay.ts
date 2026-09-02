import { isRemoteBackendEnabled } from '@/config/environment';

import {
  bookingsRepository,
  conversationsRepository,
  getCachedMessages,
  getCachedProviderReviews,
  notificationsRepository,
  ordersRepository,
  payoutsRepository,
  petsRepository,
  primeMessages,
  primeProviderReviews,
  productsRepository,
  providerOrdersRepository,
  providersRepository,
  supportTicketsRepository,
  walletMovementsRepository,
} from './hupiApi';

/**
 * Sustituye los datos mock por los del backend cuando hay API configurada.
 *
 * Los mocks siguen definiendo la FORMA completa del objeto (campos que el
 * backend aún no sirve, como la ficha de paseos o los diplomas); el backend
 * define el CONTENIDO vivo: estados, importes y disponibilidad.
 *
 * Sin `EXPO_PUBLIC_API_URL` todo esto devuelve null y la app usa los mocks.
 */

/** Estados del backend (snake_case) a las etiquetas del prototipo. */
const BOOKING_STATUS_LABELS: Record<string, string> = {
  request_created: 'Solicitud creada',
  coordination_request: 'Solicitud de coordinación',
  offer_sent: 'Oferta enviada',
  payment_pending: 'Pendiente de pago',
  confirmed: 'Confirmada',
  scheduled: 'Programada',
  upcoming: 'Próxima',
  in_progress: 'En curso',
  finished: 'Finalizada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value;
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function isActive(): boolean {
  return isRemoteBackendEnabled();
}

/** El backend devuelve ISO; el prototipo muestra `HH:MM`. */
function toClockTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Formato `YYYY-MM-DD HH:MM` usado en la lista de conversaciones. */
function toListStamp(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.toISOString().slice(0, 10)} ${toClockTime(iso)}`;
}

export function getRemoteProviders<T extends { id: string }>(templates: readonly T[]): T[] | null {
  if (!isActive() || !providersRepository.isReady()) return null;

  const remote = providersRepository.getAll();
  if (remote.length === 0) return null;

  const fallback = templates[0];
  if (!fallback) return null;

  return remote.map((item) => {
    const template = templates.find((candidate) => candidate.id === item.id) ?? fallback;

    const servicePrices = Object.fromEntries(
      Object.entries(item.servicePrices ?? {}).map(([service, price]) => [
        service,
        toNumber(price),
      ]),
    );

    return {
      ...template,
      id: item.id,
      name: item.name,
      initials: item.initials,
      isVerifiedByHupi: item.isVerifiedByHupi,
      isOnline: item.isOnline,
      averageResponseTimeMinutes:
        item.averageResponseTimeMinutes ??
        (template as { averageResponseTimeMinutes?: number }).averageResponseTimeMinutes,
      rating: toNumber(item.rating),
      reviewCount: item.reviewCount,
      completedServices: item.completedServices,
      experienceYears: item.experienceYears ?? undefined,
      zone: item.zone ?? undefined,
      latitude: item.latitude ?? undefined,
      longitude: item.longitude ?? undefined,
      serviceTypes: item.serviceTypes,
      servicePrices: {
        ...(template as { servicePrices?: Record<string, number> }).servicePrices,
        ...servicePrices,
      },
    } as T;
  });
}

/**
 * Las mascotas del backend sustituyen a las mock. El mock aporta los campos
 * que el backend todavía no sirve (comportamiento, contacto de emergencia).
 */
export function getRemotePets<T extends { id: string }>(templates: readonly T[]): T[] | null {
  if (!isActive() || !petsRepository.isReady()) return null;

  const remote = petsRepository.getAll();
  const fallback = templates[0];
  if (!fallback) return null;

  // Una lista vacía es una respuesta válida: esta cuenta no tiene mascotas.
  return remote.map((item) => {
    const template = templates.find((candidate) => candidate.id === item.id) ?? fallback;
    const weight = toNumber(item.weightKg);
    const initials = item.name.trim().slice(0, 2).toUpperCase();

    return {
      ...template,
      id: item.id,
      code: item.code ?? (template as { code?: string }).code,
      avatar: initials || (template as { avatar?: string }).avatar,
      name: item.name,
      species: item.species ?? (template as { species?: string }).species ?? '',
      breed: item.breed ?? '',
      sex: item.sex ?? '',
      size: item.size ?? '',
      weight: weight > 0 ? String(weight) : '',
      vaccinesUpToDate: item.vaccinesUpToDate,
      sterilized: item.sterilized,
    } as T;
  });
}

/**
 * Notificaciones del backend. El mock aporta prioridad, icono y etiqueta de
 * acción; el backend define cuáles existen y cuáles están leídas.
 */
export function getRemoteNotifications<T extends { id: string }>(
  templates: readonly T[],
): T[] | null {
  if (!isActive() || !notificationsRepository.isReady()) return null;

  const remote = notificationsRepository.getAll();
  const fallback = templates[0];
  if (remote.length === 0 || !fallback) return null;

  return remote.map((item) => {
    const template = templates.find((candidate) => candidate.id === item.id) ?? fallback;

    return {
      ...template,
      id: item.id,
      category: item.category || (template as { category?: string }).category,
      title: item.title,
      message: item.body,
      isRead: item.isRead,
      createdAt: item.createdAt,
      actionTarget: item.actionTarget ?? undefined,
    } as T;
  });
}

/**
 * Saldo Hupi. El disponible se calcula desde los movimientos para que cuadre
 * siempre con la lista que se muestra debajo.
 */
export function getRemoteWallet<T extends { id: string }>(
  templates: readonly T[],
): { available: number; movements: T[] } | null {
  if (!isActive() || !walletMovementsRepository.isReady()) return null;

  const remote = walletMovementsRepository.getAll();
  const fallback = templates[0];
  if (!fallback) return null;

  const movements = remote.map((item) => {
    const template = templates.find((candidate) => candidate.id === item.id) ?? fallback;

    return {
      ...template,
      id: item.id,
      concept: item.concept,
      amount: toNumber(item.amount),
      createdAt: item.createdAt.slice(0, 10),
      status: item.status,
    } as T;
  });

  const available = remote
    .filter((item) => item.status === 'available')
    .reduce((sum, item) => sum + toNumber(item.amount), 0);

  return { available: Number(available.toFixed(2)), movements };
}

const TICKET_STATUS_LABELS: Record<string, string> = {
  open: 'Abierto',
  under_review: 'En revisión',
  awaiting_reply: 'Esperando respuesta',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

const TICKET_AUTHOR_LABELS: Record<string, string> = {
  client: 'Cliente',
  provider: 'Cliente',
  support: 'Soporte Hupi',
  hupi: 'Soporte Hupi',
  system: 'Sistema Hupi',
};

/** Tickets de soporte del backend, con su hilo de mensajes. */
export function getRemoteSupportTickets<T extends { id: string }>(
  templates: readonly T[],
): T[] | null {
  if (!isActive() || !supportTicketsRepository.isReady()) return null;

  const remote = supportTicketsRepository.getAll();
  const fallback = templates[0];
  if (!fallback) return null;

  return remote.map((item) => {
    const template = templates.find((candidate) => candidate.id === item.id) ?? fallback;
    const history = item.messages.map((message, index) => ({
      id: `${item.id}-msg-${index}`,
      author: TICKET_AUTHOR_LABELS[message.authorRole] ?? 'Soporte Hupi',
      message: message.body,
      createdAt: toListStamp(message.createdAt),
    }));
    const lastSupport = [...item.messages]
      .reverse()
      .find((message) => message.authorRole !== 'client');

    return {
      ...template,
      id: item.id,
      caseNumber: item.caseNumber,
      reason: item.category,
      status: TICKET_STATUS_LABELS[item.status] ?? item.status,
      createdAt: item.createdAt.slice(0, 10),
      description: item.description,
      lastSupportMessage: lastSupport?.body ?? '',
      history,
    } as T;
  });
}

/**
 * Liquidaciones del proveedor. El backend aporta las cifras; el mock conserva
 * los ajustes y documentos que todavía no existen en el servidor.
 */
export function getRemotePayouts<T extends { id: string }>(
  templates: readonly T[],
): T[] | null {
  if (!isActive() || !payoutsRepository.isReady()) return null;

  const remote = payoutsRepository.getAll();
  const fallback = templates[0];
  if (remote.length === 0 || !fallback) return null;

  return remote.map((item) => {
    const template = templates.find((candidate) => candidate.id === item.id) ?? fallback;

    return {
      ...template,
      id: item.id,
      settlementNumber: item.settlementNumber,
      grossSales: toNumber(item.grossSales),
      hupiCommission: toNumber(item.hupiCommission),
      providerNet: toNumber(item.providerNet),
      totalToTransfer: toNumber(item.totalToTransfer),
      status: item.status,
    } as T;
  });
}

export function getRemoteBookings<T extends { id: string }>(templates: readonly T[]): T[] | null {
  if (!isActive() || !bookingsRepository.isReady()) return null;

  const remote = bookingsRepository.getAll();
  if (remote.length === 0) return null;

  const fallback = templates[0];
  if (!fallback) return null;

  return remote.map((item) => {
    const reference = item.referenceCode ?? item.id;
    const template = templates.find((candidate) => candidate.id === reference) ?? fallback;

    return {
      ...template,
      id: reference,
      status: BOOKING_STATUS_LABELS[item.status] ?? item.status,
      section: item.section,
      provider: item.provider,
      providerInitials: item.providerInitials,
      pet: item.pet ?? (template as { pet?: string }).pet,
      client: item.client,
      totalPaid: toNumber(item.totalPaid),
      serviceValue: toNumber(item.serviceValue),
      clientFee: toNumber(item.clientFee),
      providerPayout: toNumber(item.providerPayout),
      startsAt: item.scheduledStartAt,
      scheduledStartAt: item.scheduledStartAt,
      startedAt: item.startedAt ?? undefined,
      completedAt: item.completedAt ?? undefined,
      chatAvailable: item.chatAvailable,
      canCancel: item.canCancel,
      timelineStep: item.timelineStep,
    } as T;
  });
}

/** Arranca la hidratación en segundo plano al iniciar la app. */
export function primeRemoteData(): void {
  if (!isActive()) return;

  void import('../constants/mockProviderReviews').then((module) => {
    module.setProviderReviewsResolver((providerId) => {
      const remote = getCachedProviderReviews(providerId);
      if (!remote) {
        primeProviderReviews(providerId);
        return null;
      }

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      remote.forEach((review) => {
        const stars = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
        distribution[stars] += 1;
      });

      return {
        distribution,
        reviews: remote.map((review) => ({
          id: review.bookingId,
          providerId,
          customerDisplayName: review.customerDisplayName,
          createdAt: review.createdAt.slice(0, 10),
          rating: review.rating,
          comment: review.comment ?? '',
          service: review.tags[0],
        })),
      };
    });
  });
  void providersRepository.refresh();
  void bookingsRepository.refresh();
  void petsRepository.refresh();
  void productsRepository.refresh();
  void ordersRepository.refresh();
  void notificationsRepository.refresh();
  void conversationsRepository.refresh();
  void providerOrdersRepository.refresh();
  void walletMovementsRepository.refresh();
  void supportTicketsRepository.refresh();
  void payoutsRepository.refresh();
  // El estado de proveedor decide si se puede entrar al modo proveedor.
  void import('./localProviderRepository').then((module) =>
    module.hydrateProviderFromBackend(),
  );
  void Promise.all([
    import('./mockProviderProfileRepository'),
    import('../constants/mockProviders'),
  ]).then(([profiles, providers]) => {
    const first = providers.mockProviders[0];
    if (first) void profiles.hydrateWalkProfileFromBackend(first.id);
  });
  // Tras reabrir la app el perfil guardado puede ser el de otra cuenta.
  void Promise.all([
    import('./httpAccountRepository'),
    import('./localAccountRepository'),
  ])
    .then(async ([remote, local]) => {
      local.hydrateAccountFromBackend(await remote.fetchRemoteAccountSnapshot());
    })
    .catch(() => undefined);
}

// --- Marketplace ----------------------------------------------------------

export function getRemoteProducts<T extends { id: string }>(
  templates: readonly T[],
): T[] | null {
  if (!isActive() || !productsRepository.isReady()) return null;

  const remote = productsRepository.getAll();
  const fallback = templates[0];
  if (remote.length === 0 || !fallback) return null;

  return remote.map((item) => {
    const template = templates.find((candidate) => candidate.id === item.id) ?? fallback;

    return {
      ...template,
      id: item.id,
      name: item.name,
      brand: item.brand ?? (template as { brand?: string }).brand,
      storeId: item.storeId,
      cardPriceAfter: toNumber(item.cardPriceAfter),
      transferPriceAfter: toNumber(item.transferPriceAfter),
      stock: item.stock,
      stockStatus: item.isAvailable ? 'Disponible' : 'Sin stock',
      status: item.isAvailable ? 'Activo' : 'Pausado',
      tags: item.tags,
    } as T;
  });
}

// --- Pedidos --------------------------------------------------------------

const ORDER_STATUS_LABELS: Record<string, string> = {
  payment_pending: 'Pendiente de pago',
  payment_review: 'Pago en revisión',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  ready_to_ship: 'Listo para envío',
  in_transit: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  proof_pending: 'Pendiente de comprobante',
  proof_submitted: 'Comprobante enviado',
  payment_review: 'Comprobante enviado',
  confirmed: 'Pago validado',
  proof_rejected: 'Comprobante rechazado',
};

export function getRemoteOrders<T extends { id: string }>(templates: readonly T[]): T[] | null {
  if (!isActive() || !ordersRepository.isReady()) return null;

  const remote = ordersRepository.getAll();
  const fallback = templates[0];
  if (remote.length === 0 || !fallback) return null;

  return remote.map((item) => {
    const template =
      templates.find((candidate) => candidate.id === item.id)
      ?? templates.find(
        (candidate) => (candidate as { orderNumber?: string }).orderNumber === item.orderNumber,
      )
      ?? fallback;

    return {
      ...template,
      id: item.id,
      orderNumber: item.orderNumber,
      orderStatus: ORDER_STATUS_LABELS[item.status] ?? item.status,
      paymentStatus: PAYMENT_STATUS_LABELS[item.paymentStatus] ?? item.paymentStatus,
      total: toNumber(item.total),
      createdAt: item.createdAt,
    } as T;
  });
}

// --- Pedidos del proveedor ------------------------------------------------

export function getRemoteProviderOrders<T extends { id: string }>(
  templates: readonly T[],
): T[] | null {
  if (!isActive() || !providerOrdersRepository.isReady()) return null;

  const remote = providerOrdersRepository.getAll();
  const fallback = templates[0];
  if (remote.length === 0 || !fallback) return null;

  return remote.map((item) => {
    const template =
      templates.find(
        (candidate) =>
          (candidate as { providerOrderId?: string }).providerOrderId === item.providerOrderNumber,
      ) ?? fallback;

    return {
      ...template,
      id: item.id,
      providerOrderId: item.providerOrderNumber,
      storeId: item.storeId,
      storeName: item.storeName,
      customerName: item.customerName,
      status: ORDER_STATUS_LABELS[item.status] ?? item.status,
      carrier: item.carrier ?? undefined,
      guideNumber: item.trackingNumber ?? undefined,
      placedAt: item.placedAt,
    } as T;
  });
}

// --- Chat -----------------------------------------------------------------

export function getRemoteConversations<T extends { id: string }>(
  templates: readonly T[],
): T[] | null {
  if (!isActive() || !conversationsRepository.isReady()) return null;

  const remote = conversationsRepository.getAll();
  const fallback = templates[0];
  if (remote.length === 0 || !fallback) return null;

  return remote.map((item) => {
    const template = templates.find((candidate) => candidate.id === item.id) ?? fallback;

    return {
      ...template,
      id: item.id,
      type: item.conversationType,
      title: item.title,
      lastMessage: item.lastMessage ?? (template as { lastMessage?: string }).lastMessage,
      unreadCount: item.unreadCount,
      updatedAt: toListStamp(item.lastMessageAt) || (template as { updatedAt?: string }).updatedAt,
    } as T;
  });
}

const MESSAGE_SENDERS: Record<string, string> = {
  client: 'customer',
  provider: 'provider',
  support: 'support',
  system: 'system',
};

export function getRemoteMessages<T extends { id: string }>(
  conversationId: string,
  templates: readonly T[],
): T[] | null {
  if (!isActive()) return null;

  const cached = getCachedMessages(conversationId);
  if (!cached) {
    void primeMessages(conversationId);
    return null;
  }

  const fallback = templates[0];
  if (!fallback) return null;

  return cached.map((item) => ({
    ...fallback,
    id: item.id,
    conversationId,
    sender: MESSAGE_SENDERS[item.senderRole] ?? 'system',
    text: item.body,
    createdAt: toClockTime(item.createdAt),
    status: item.status === 'read' ? 'Leído' : 'Enviado',
    attachmentType: null,
  }) as T);
}
