export type AdminProviderEventCategory = 'Proveedor' | 'Tienda' | 'Producto' | 'Ticket' | 'Liquidación';
export type AdminProviderEventPriority = 'normal' | 'important' | 'urgent';
export type ProviderVisibleStatus = 'Pendiente' | 'Aprobado' | 'Rechazado';
export type StoreVisibleStatus = 'En revisión' | 'Habilitada' | 'Necesita cambios' | 'Deshabilitada';
export type ProductVisibleStatus = 'Pendiente de revisión' | 'Aprobado' | 'Rechazado';
export type TicketVisibleStatus = 'Abierto' | 'En revisión' | 'Resuelto' | 'Cerrado';
export type PayoutVisibleStatus = 'Pendiente de pago' | 'Pagado';

export type AdminGeneratedProviderEvent = {
  id: string;
  providerId: string;
  category: AdminProviderEventCategory;
  type: string;
  title: string;
  message: string;
  priority: AdminProviderEventPriority;
  isRead: boolean;
  createdAt: string;
  actionLabel: string;
  actionTarget: string;
};

// TODO backend: reemplazar este mock por eventos emitidos por Admin/API para el proveedor autenticado.
export const adminGeneratedProviderEvents: AdminGeneratedProviderEvent[] = [
  {
    id: 'admin-event-001',
    providerId: 'provider-001',
    category: 'Proveedor',
    type: 'provider_approved',
    title: 'Proveedor aprobado',
    message: 'Tu perfil fue aprobado y ya puedes operar en Hupi.',
    priority: 'important',
    isRead: false,
    createdAt: '2026-07-09',
    actionLabel: 'Ver tienda',
    actionTarget: '/provider/marketplace-store',
  },
  {
    id: 'admin-event-002',
    providerId: 'provider-001',
    category: 'Tienda',
    type: 'store_approved',
    title: 'Tienda habilitada',
    message: 'Tu tienda pasó los filtros de Hupi y ya está habilitada en Marketplace.',
    priority: 'important',
    isRead: false,
    createdAt: '2026-07-09',
    actionLabel: 'Ver tienda',
    actionTarget: '/provider/store-profile',
  },
  {
    id: 'admin-event-003',
    providerId: 'provider-001',
    category: 'Tienda',
    type: 'store_official_enabled',
    title: 'Ahora eres tienda oficial',
    message: 'Hupi asignó el distintivo de Tienda Oficial a tu tienda.',
    priority: 'important',
    isRead: false,
    createdAt: '2026-07-09',
    actionLabel: 'Ver tienda',
    actionTarget: '/provider/marketplace-store',
  },
  {
    id: 'admin-event-004',
    providerId: 'provider-001',
    category: 'Tienda',
    type: 'store_changes_requested',
    title: 'Tu tienda necesita ajustes',
    message: 'Hupi encontró información que debes corregir para habilitar tu tienda.',
    priority: 'urgent',
    isRead: true,
    createdAt: '2026-07-08',
    actionLabel: 'Completar datos',
    actionTarget: '/provider/store-profile',
  },
  {
    id: 'admin-event-005',
    providerId: 'provider-001',
    category: 'Producto',
    type: 'product_approved',
    title: 'Producto aprobado',
    message: 'Tu producto fue aprobado y ya puede mostrarse en Marketplace.',
    priority: 'important',
    isRead: false,
    createdAt: '2026-07-09',
    actionLabel: 'Ver producto',
    actionTarget: '/provider/products',
  },
  {
    id: 'admin-event-006',
    providerId: 'provider-001',
    category: 'Producto',
    type: 'product_rejected',
    title: 'Producto no aprobado',
    message: 'Tu producto necesita cambios antes de publicarse.',
    priority: 'urgent',
    isRead: false,
    createdAt: '2026-07-08',
    actionLabel: 'Ver producto',
    actionTarget: '/provider/products',
  },
  {
    id: 'admin-event-007',
    providerId: 'provider-001',
    category: 'Ticket',
    type: 'ticket_resolved',
    title: 'Ticket resuelto',
    message: 'Hupi actualizó la información solicitada.',
    priority: 'important',
    isRead: false,
    createdAt: '2026-07-09',
    actionLabel: 'Ver solicitud',
    actionTarget: '/provider/store-profile',
  },
  {
    id: 'admin-event-008',
    providerId: 'provider-001',
    category: 'Ticket',
    type: 'ticket_rejected',
    title: 'Solicitud no aprobada',
    message: 'No pudimos aprobar tu solicitud. Revisa el comentario de soporte.',
    priority: 'important',
    isRead: true,
    createdAt: '2026-07-08',
    actionLabel: 'Contactar soporte',
    actionTarget: '/support',
  },
  {
    id: 'admin-event-009',
    providerId: 'provider-001',
    category: 'Liquidación',
    type: 'payout_paid',
    title: 'Liquidación pagada',
    message: 'Hupi marcó como pagada tu liquidación de Junio 2026.',
    priority: 'important',
    isRead: false,
    createdAt: '2026-07-09',
    actionLabel: 'Ver liquidación',
    actionTarget: '/provider/marketplace-finance',
  },
];
