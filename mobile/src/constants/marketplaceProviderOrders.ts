import { mockProducts } from './mockData';
import { getRemoteProviderOrders } from '@/data/remoteOverlay';
import { syncProviderOrderStatus, syncShippingGuide } from '@/data/remoteWrites';
import { syncMarketplaceOrderStatusFromProvider, type MarketplaceClientOrderStatus } from './marketplaceOrdersState';

export const marketplaceCommissionRate = 0.3;
export const sellerReceivesRate = 0.7;

// TODO: Esta distribución es interna para admin/proveedor y no debe mostrarse al cliente.

export type ProviderMarketplaceOrderStatus =
  | 'Pendiente de pago'
  | 'Pago en revisión'
  | 'Confirmado'
  | 'En preparación'
  | 'Listo para envío'
  | 'En camino'
  | 'Entregado'
  | 'Cancelado';

export type ProviderPaymentStatus = 'Pendiente de comprobante' | 'Comprobante enviado' | 'Pago validado' | 'Comprobante rechazado' | 'Pagado con tarjeta';
export type ProviderDeliveryType = 'standard' | 'express' | 'pickup';
export type ProviderOrderAttachmentFileType = 'image' | 'pdf';

export type ProviderOrderAttachment = {
  fileName: string;
  fileType: ProviderOrderAttachmentFileType;
  uploadedAt: string;
};

export type ProviderOrderShippingGuide = ProviderOrderAttachment & {
  carrierName: string;
  trackingNumber: string;
};

export type ProviderMarketplaceOrderItem = {
  id: string;
  productId: string;
  name: string;
  brand: string;
  emoji: string;
  color: string;
  quantity: number;
  sku: string;
  variation: string;
  unitPrice: number;
};

export type ProviderMarketplaceOrder = {
  id: string;
  providerOrderId: string;
  storeId: string;
  storeName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: ProviderMarketplaceOrderItem[];
  deliveryType: ProviderDeliveryType;
  deliveryMethod: string;
  address: string;
  pickupPoint?: string;
  notes?: string;
  paymentStatus: ProviderPaymentStatus;
  status: ProviderMarketplaceOrderStatus;
  placedAt: string;
  deliveredAt?: string;
  guideNumber?: string;
  carrier?: string;
  shippingGuide?: ProviderOrderShippingGuide;
  deliveryEvidence?: ProviderOrderAttachment;
  evidenceAdded?: boolean;
};

export type ProviderOrderActivityActor = 'Hupi' | 'Proveedor' | 'Sistema';
export type ProviderOrderActivity = {
  id: string;
  orderId: string;
  providerOrderId: string;
  providerId: string;
  title: string;
  description: string;
  actor: ProviderOrderActivityActor;
  type:
    | 'order_received'
    | 'payment_validated'
    | 'order_confirmed'
    | 'order_preparing'
    | 'ready_to_ship'
    | 'in_transit'
    | 'delivered'
    | 'hupi_requested_info'
    | 'provider_answered_hupi'
    | 'shipping_guide_registered'
    | 'delivery_evidence_added'
    | 'issue_opened'
    | 'refund_applied'
    | 'payout_pending'
    | 'payout_paid';
  createdAt: string;
};

const productById = (productId: string) => mockProducts.find((product) => product.id === productId) ?? mockProducts[0];

// TODO: Reemplazar por el storeId autenticado del vendedor cuando exista backend.
// El mock mantiene un pedido general cliente y subpedidos separados por proveedor.
export const currentMockMarketplaceProviderStoreIds = [
  'store-hupi-bites',
  'store-clean-paw',
  'store-urban-pet',
  'store-kong',
  'store-casa-colitas',
];

function createOrderItem(productId: string, quantity: number, variation: string): ProviderMarketplaceOrderItem {
  const product = productById(productId);
  const productSku = (product as { sku?: string }).sku;

  return {
    id: `${productId}-${variation}`,
    productId,
    name: product.name,
    brand: product.brand,
    emoji: product.emoji,
    color: product.color,
    quantity,
    sku: productSku ?? `${productId.toUpperCase()}-MOCK`,
    variation,
    unitPrice: product.transferPrice,
  };
}

let providerMarketplaceOrders: ProviderMarketplaceOrder[] = [
  {
    id: 'HUPI-MK-2048',
    providerOrderId: 'HUPI-MK-2048-A',
    storeId: 'store-hupi-bites',
    storeName: 'Hupi Bites',
    customerName: 'Ana Morales',
    customerPhone: '+593 99 123 4567',
    customerEmail: 'ana@email.com',
    items: [createOrderItem('product-1', 2, '250 g · Pollo')],
    deliveryType: 'express',
    deliveryMethod: 'Envío express',
    address: 'Casa: La Carolina, Quito · Edificio Torre Norte, recepción',
    notes: 'Milo prefiere snacks suaves. Entregar en recepción.',
    paymentStatus: 'Pagado con tarjeta',
    status: 'Confirmado',
    placedAt: '7 Jul 2026 · 15:42',
  },
  {
    id: 'HUPI-MK-2048',
    providerOrderId: 'HUPI-MK-2048-B',
    storeId: 'store-clean-paw',
    storeName: 'Clean Paw',
    customerName: 'Ana Morales',
    customerPhone: '+593 99 123 4567',
    customerEmail: 'ana@email.com',
    items: [createOrderItem('product-6', 1, '250 ml')],
    deliveryType: 'standard',
    deliveryMethod: 'Envío estándar',
    address: 'Casa: La Carolina, Quito · Edificio Torre Norte, recepción',
    notes: 'Empacar con protección anti derrames.',
    paymentStatus: 'Pago validado',
    status: 'En preparación',
    placedAt: '7 Jul 2026 · 15:42',
  },
  {
    id: 'HUPI-MK-2049',
    providerOrderId: 'HUPI-MK-2049-A',
    storeId: 'store-urban-pet',
    storeName: 'Urban Pet',
    customerName: 'Ana Morales',
    customerPhone: '+593 99 123 4567',
    customerEmail: 'ana@email.com',
    items: [createOrderItem('product-2', 1, 'M · Coral')],
    deliveryType: 'pickup',
    deliveryMethod: 'Recogida en punto',
    address: 'Punto Urban Pet · Av. República, Quito',
    pickupPoint: 'Punto Urban Pet · Av. República y Eloy Alfaro',
    notes: 'Cliente retirará con cédula registrada.',
    paymentStatus: 'Comprobante enviado',
    status: 'Pago en revisión',
    placedAt: '7 Jul 2026 · 18:10',
  },
  {
    id: 'HUPI-MK-2051',
    providerOrderId: 'HUPI-MK-2051-A',
    storeId: 'store-kong',
    storeName: 'KONG',
    customerName: 'Carlos Benítez',
    customerPhone: '+593 98 555 0101',
    customerEmail: 'carlos@email.com',
    items: [createOrderItem('product-4', 2, 'Mediana · Coral')],
    deliveryType: 'standard',
    deliveryMethod: 'Envío estándar',
    address: 'Oficina: Av. República, Quito · Piso 8',
    paymentStatus: 'Pago validado',
    status: 'En camino',
    placedAt: '5 Jul 2026 · 11:24',
    carrier: 'Hupi Express',
    guideNumber: 'HUPI-GUIA-7821',
    shippingGuide: {
      carrierName: 'Hupi Express',
      trackingNumber: 'HUPI-GUIA-7821',
      fileName: 'guia-envio.pdf',
      fileType: 'pdf',
      uploadedAt: '2026-07-05T12:20:00',
    },
  },
  {
    id: 'HUPI-MK-2052',
    providerOrderId: 'HUPI-MK-2052-A',
    storeId: 'store-casa-colitas',
    storeName: 'Casa Colitas',
    customerName: 'María Torres',
    customerPhone: '+593 97 444 0202',
    customerEmail: 'maria@email.com',
    items: [createOrderItem('product-3', 1, 'M · Beige')],
    deliveryType: 'pickup',
    deliveryMethod: 'Recogida en punto',
    address: 'Punto Casa Colitas · Cumbayá',
    pickupPoint: 'Punto Casa Colitas · Paseo San Francisco, local 12',
    notes: 'Retira hoy después de las 17:00.',
    paymentStatus: 'Pago validado',
    status: 'Listo para envío',
    placedAt: '7 Jul 2026 · 13:05',
  },
  {
    id: 'HUPI-MK-2052',
    providerOrderId: 'HUPI-MK-2052-B',
    storeId: 'store-casa-colitas',
    storeName: 'Casa Colitas',
    customerName: 'María Torres',
    customerPhone: '+593 97 444 0202',
    customerEmail: 'maria@email.com',
    items: [createOrderItem('product-8', 1, '250 g')],
    deliveryType: 'standard',
    deliveryMethod: 'Envío estándar',
    address: 'Casa: La Carolina, Quito',
    notes: 'Pedido bloqueado por comprobante rechazado.',
    paymentStatus: 'Comprobante rechazado',
    status: 'Pendiente de pago',
    placedAt: '6 Jul 2026 · 18:04',
  },
  {
    id: 'HUPI-MK-2055',
    providerOrderId: 'HUPI-MK-2055-A',
    storeId: 'store-hupi-bites',
    storeName: 'Hupi Bites',
    customerName: 'Ana Morales',
    customerPhone: '+593 99 123 4567',
    customerEmail: 'ana@email.com',
    items: [createOrderItem('product-8', 1, '250 g')],
    deliveryType: 'standard',
    deliveryMethod: 'Envío estándar',
    address: 'Casa: La Carolina, Quito',
    notes: 'Entregar en portería.',
    paymentStatus: 'Pago validado',
    status: 'Confirmado',
    placedAt: '8 Jul 2026 · 10:00',
  },
  {
    id: 'HUPI-MK-2056',
    providerOrderId: 'HUPI-MK-2056-A',
    storeId: 'store-hupi-bites',
    storeName: 'Hupi Bites',
    customerName: 'Ana Morales',
    customerPhone: '+593 99 123 4567',
    customerEmail: 'ana@email.com',
    items: [createOrderItem('product-1', 2, '250 g · Pollo')],
    deliveryType: 'express',
    deliveryMethod: 'Envío express',
    address: 'Casa: La Carolina, Quito',
    paymentStatus: 'Pago validado',
    status: 'Entregado',
    placedAt: '3 Jul 2026 · 09:10',
    deliveredAt: '4 Jul 2026 · 12:10',
    carrier: 'Hupi Express',
    guideNumber: 'HUPI-GUIA-2056',
    shippingGuide: {
      carrierName: 'Hupi Express',
      trackingNumber: 'HUPI-GUIA-2056',
      fileName: 'guia-envio.pdf',
      fileType: 'pdf',
      uploadedAt: '2026-07-03T10:30:00',
    },
    deliveryEvidence: {
      fileName: 'evidencia-entrega.jpg',
      fileType: 'image',
      uploadedAt: '2026-07-04T12:10:00',
    },
    evidenceAdded: true,
  },
  {
    id: 'HUPI-MK-2057',
    providerOrderId: 'HUPI-MK-2057-A',
    storeId: 'store-hupi-bites',
    storeName: 'Hupi Bites',
    customerName: 'Ana Morales',
    customerPhone: '+593 99 123 4567',
    customerEmail: 'ana@email.com',
    items: [createOrderItem('product-8', 1, '250 g')],
    deliveryType: 'standard',
    deliveryMethod: 'Envío estándar',
    address: 'Casa: La Carolina, Quito',
    paymentStatus: 'Pago validado',
    status: 'Entregado',
    placedAt: '6 Jul 2026 · 09:10',
    deliveredAt: '6 Jul 2026 · 17:40',
    carrier: 'Hupi Express',
    guideNumber: 'HUPI-GUIA-2057',
    shippingGuide: {
      carrierName: 'Hupi Express',
      trackingNumber: 'HUPI-GUIA-2057',
      fileName: 'guia-envio.jpg',
      fileType: 'image',
      uploadedAt: '2026-07-06T10:00:00',
    },
    deliveryEvidence: {
      fileName: 'evidencia-entrega.pdf',
      fileType: 'pdf',
      uploadedAt: '2026-07-06T17:40:00',
    },
    evidenceAdded: true,
  },
];

let providerOrderActivity: ProviderOrderActivity[] = [
  {
    id: 'poa-2049-001',
    orderId: 'HUPI-MK-2049',
    providerOrderId: 'HUPI-MK-2049-A',
    providerId: 'provider-001',
    title: 'Orden recibida',
    description: 'El pedido HUPI-MK-2049 ingresó a tu tienda.',
    actor: 'Sistema',
    type: 'order_received',
    createdAt: '2026-07-09T10:35:00',
  },
  {
    id: 'poa-2049-002',
    orderId: 'HUPI-MK-2049',
    providerOrderId: 'HUPI-MK-2049-A',
    providerId: 'provider-001',
    title: 'Incidencia abierta relacionada al pedido',
    description: 'Hupi abrió una revisión operativa sobre el pedido.',
    actor: 'Hupi',
    type: 'issue_opened',
    createdAt: '2026-07-09T12:05:00',
  },
  {
    id: 'poa-2049-003',
    orderId: 'HUPI-MK-2049',
    providerOrderId: 'HUPI-MK-2049-A',
    providerId: 'provider-001',
    title: 'Hupi solicitó información',
    description: 'Hupi pidió confirmar el SKU enviado y evidencia si aplica.',
    actor: 'Hupi',
    type: 'hupi_requested_info',
    createdAt: '2026-07-09T12:20:00',
  },
  {
    id: 'poa-2048-001',
    orderId: 'HUPI-MK-2048',
    providerOrderId: 'HUPI-MK-2048-A',
    providerId: 'provider-001',
    title: 'Orden recibida',
    description: 'El pedido HUPI-MK-2048 ingresó a tu tienda.',
    actor: 'Sistema',
    type: 'order_received',
    createdAt: '2026-07-07T15:42:00',
  },
  {
    id: 'poa-2048-002',
    orderId: 'HUPI-MK-2048',
    providerOrderId: 'HUPI-MK-2048-A',
    providerId: 'provider-001',
    title: 'Pago validado por Hupi',
    description: 'Hupi validó el pago del cliente.',
    actor: 'Hupi',
    type: 'payment_validated',
    createdAt: '2026-07-07T15:48:00',
  },
  {
    id: 'poa-2048-003',
    orderId: 'HUPI-MK-2048',
    providerOrderId: 'HUPI-MK-2048-A',
    providerId: 'provider-001',
    title: 'Pedido confirmado',
    description: 'El pedido quedó confirmado para preparación.',
    actor: 'Sistema',
    type: 'order_confirmed',
    createdAt: '2026-07-07T15:50:00',
  },
  {
    id: 'poa-2048-004',
    orderId: 'HUPI-MK-2048',
    providerOrderId: 'HUPI-MK-2048-A',
    providerId: 'provider-001',
    title: 'Pedido en preparación',
    description: 'Marcaste el pedido como en preparación.',
    actor: 'Proveedor',
    type: 'order_preparing',
    createdAt: '2026-07-07T16:10:00',
  },
  {
    id: 'poa-2056-001',
    orderId: 'HUPI-MK-2056',
    providerOrderId: 'HUPI-MK-2056-A',
    providerId: 'provider-001',
    title: 'Pedido entregado',
    description: 'El pedido fue marcado como entregado.',
    actor: 'Proveedor',
    type: 'delivered',
    createdAt: '2026-07-04T12:10:00',
  },
  {
    id: 'poa-2056-002',
    orderId: 'HUPI-MK-2056',
    providerOrderId: 'HUPI-MK-2056-A',
    providerId: 'provider-001',
    title: 'Liquidación pendiente de pago',
    description: 'El valor del proveedor quedó preparado para liquidación Hupi.',
    actor: 'Sistema',
    type: 'payout_pending',
    createdAt: '2026-07-06T12:10:00',
  },
];

let marketplaceClientNotifications: string[] = [];
let providerReviewPromptActive = false;
let providerReviewPromptStoreName = 'Hupi Bites';

export function getProviderMarketplaceOrders(storeIds = currentMockMarketplaceProviderStoreIds) {
  const remote = getRemoteProviderOrders(providerMarketplaceOrders);
  if (remote) return remote;

  return providerMarketplaceOrders.filter((order) => storeIds.includes(order.storeId));
}

export function getProviderMarketplaceOrder(providerOrderId?: string) {
  return providerMarketplaceOrders.find((order) => order.providerOrderId === providerOrderId) ?? getProviderMarketplaceOrders()[0];
}

export function getProviderOrderActivity(providerOrderId?: string) {
  return providerOrderActivity
    .filter((event) => event.providerOrderId === providerOrderId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addProviderOrderActivity(event: Omit<ProviderOrderActivity, 'id' | 'createdAt'> & { createdAt?: string }) {
  const activity: ProviderOrderActivity = {
    ...event,
    id: `poa-${Date.now()}`,
    createdAt: event.createdAt ?? new Date().toISOString(),
  };

  providerOrderActivity = [activity, ...providerOrderActivity];

  return activity;
}

export function getProviderOrderSubtotal(order: ProviderMarketplaceOrder) {
  return Number(order.items.reduce((total, item) => total + item.unitPrice * item.quantity, 0).toFixed(2));
}

export function getProviderOrderFinancialSummary(order: ProviderMarketplaceOrder) {
  const productsValue = getProviderOrderSubtotal(order);
  const hupiCommission = Number((productsValue * marketplaceCommissionRate).toFixed(2));
  const providerReceives = Number((productsValue * sellerReceivesRate).toFixed(2));

  return {
    productsValue,
    hupiCommission,
    providerReceives,
  };
}

export function getDeliveredPaidProviderPayoutItems(storeId: string, payoutId: string, monthLabel = 'Julio 2026') {
  return providerMarketplaceOrders
    .filter((order) => (
      order.storeId === storeId
      && order.status === 'Entregado'
      && canProviderPrepareOrder(order)
      && isOrderInMonth(order.placedAt, monthLabel)
    ))
    .flatMap((order) => order.items.map((item) => {
      const productTotal = Number((item.unitPrice * item.quantity).toFixed(2));
      const hupiCommission = Number((productTotal * marketplaceCommissionRate).toFixed(2));
      const providerValue = Number((productTotal * sellerReceivesRate).toFixed(2));

      return {
        id: `provider-payout-${order.providerOrderId}-${item.id}`,
        payoutId,
        date: order.deliveredAt ?? order.placedAt,
        orderNumber: order.id,
        product: item.name,
        sku: item.sku,
        quantity: item.quantity,
        soldPrice: item.unitPrice,
        productTotal,
        hupiCommission,
        providerValue,
      };
    }));
}

function isOrderInMonth(placedAt: string, monthLabel: string) {
  if (monthLabel === 'Julio 2026') {
    return placedAt.includes('Jul 2026');
  }

  if (monthLabel === 'Junio 2026') {
    return placedAt.includes('Jun 2026');
  }

  if (monthLabel === 'Agosto 2026') {
    return placedAt.includes('Ago 2026') || placedAt.includes('Aug 2026');
  }

  return true;
}

export function getProviderStatusFlow(deliveryType: ProviderDeliveryType) {
  return ['Confirmado', 'En preparación', 'Listo para envío', 'En camino', 'Entregado'] as ProviderMarketplaceOrderStatus[];
}

export function canProviderPrepareOrder(order: ProviderMarketplaceOrder) {
  return order.paymentStatus === 'Pago validado' || order.paymentStatus === 'Pagado con tarjeta';
}

export function getProviderStatusDisplay(status: ProviderMarketplaceOrderStatus, deliveryType: ProviderDeliveryType) {
  return status;
}

export function getNextProviderStatus(order: ProviderMarketplaceOrder) {
  if (!canProviderPrepareOrder(order) || order.status === 'Pendiente de pago' || order.status === 'Pago en revisión' || order.status === 'Cancelado') {
    return null;
  }

  const flow = getProviderStatusFlow(order.deliveryType);
  const currentIndex = flow.indexOf(order.status);

  if (currentIndex < 0 || currentIndex >= flow.length - 1) {
    return null;
  }

  return flow[currentIndex + 1];
}

export function updateProviderMarketplaceOrderStatus(providerOrderId: string, status: ProviderMarketplaceOrderStatus) {
  const order = getProviderMarketplaceOrder(providerOrderId);
  const nextStatus = getNextProviderStatus(order);

  if (!nextStatus || nextStatus !== status) {
    return order;
  }

  providerMarketplaceOrders = providerMarketplaceOrders.map((item) => (
    item.providerOrderId === providerOrderId
      ? { ...item, status, deliveredAt: status === 'Entregado' ? new Date().toISOString().slice(0, 10) : item.deliveredAt }
      : item
  ));

  const updatedOrder = getProviderMarketplaceOrder(providerOrderId);
  syncMarketplaceOrderStatusFromProvider(updatedOrder.id, status as MarketplaceClientOrderStatus, updatedOrder.storeId);
  marketplaceClientNotifications = [getClientNotificationForStatus(status), ...marketplaceClientNotifications].filter(Boolean);
  addProviderOrderActivity({
    orderId: updatedOrder.id,
    providerOrderId: updatedOrder.providerOrderId,
    providerId: 'provider-001',
    title: getProviderStatusDisplay(status, updatedOrder.deliveryType),
    description: getStatusActivityDescription(status),
    actor: 'Proveedor',
    type: getStatusActivityType(status),
  });

  if (status === 'Entregado') {
    providerReviewPromptActive = true;
    providerReviewPromptStoreName = updatedOrder.storeName;
  }

  syncProviderOrderStatus(updatedOrder.providerOrderId, status);

  return updatedOrder;
}

function getStatusActivityType(status: ProviderMarketplaceOrderStatus): ProviderOrderActivity['type'] {
  if (status === 'En preparación') {
    return 'order_preparing';
  }

  if (status === 'Listo para envío') {
    return 'ready_to_ship';
  }

  if (status === 'En camino') {
    return 'in_transit';
  }

  if (status === 'Entregado') {
    return 'delivered';
  }

  return 'order_confirmed';
}

function getStatusActivityDescription(status: ProviderMarketplaceOrderStatus) {
  if (status === 'En preparación') {
    return 'Marcaste el pedido como en preparación.';
  }

  if (status === 'Listo para envío') {
    return 'Marcaste el pedido como listo para envío.';
  }

  if (status === 'En camino') {
    return 'Marcaste el pedido como en camino.';
  }

  if (status === 'Entregado') {
    return 'Marcaste el pedido como entregado.';
  }

  return 'Actualizaste el estado operativo del pedido.';
}

export function saveProviderOrderGuide(
  providerOrderId: string,
  carrierName: string,
  trackingNumber: string,
  file: ProviderOrderAttachment,
) {
  providerMarketplaceOrders = providerMarketplaceOrders.map((order) => (
    order.providerOrderId === providerOrderId
      ? {
          ...order,
          carrier: carrierName,
          guideNumber: trackingNumber,
          shippingGuide: {
            carrierName,
            trackingNumber,
            fileName: file.fileName,
            fileType: file.fileType,
            uploadedAt: file.uploadedAt,
          },
        }
      : order
  ));

  const updatedOrder = getProviderMarketplaceOrder(providerOrderId);

  syncShippingGuide(providerOrderId, carrierName, trackingNumber);

  addProviderOrderActivity({
    orderId: updatedOrder.id,
    providerOrderId: updatedOrder.providerOrderId,
    providerId: 'provider-001',
    title: 'Guía de envío registrada',
    description: 'El proveedor registró el transportista y número de guía.',
    actor: 'Proveedor',
    type: 'shipping_guide_registered',
  });

  return updatedOrder;
}

export function addProviderOrderEvidence(providerOrderId: string, file: ProviderOrderAttachment) {
  providerMarketplaceOrders = providerMarketplaceOrders.map((order) => (
    order.providerOrderId === providerOrderId ? { ...order, deliveryEvidence: file, evidenceAdded: true } : order
  ));

  const updatedOrder = getProviderMarketplaceOrder(providerOrderId);

  addProviderOrderActivity({
    orderId: updatedOrder.id,
    providerOrderId: updatedOrder.providerOrderId,
    providerId: 'provider-001',
    title: 'Evidencia de entrega adjunta',
    description: 'El proveedor adjuntó una evidencia de entrega.',
    actor: 'Proveedor',
    type: 'delivery_evidence_added',
  });

  return updatedOrder;
}

export function getMarketplaceClientNotifications() {
  return marketplaceClientNotifications;
}

export function getProviderReviewPromptState() {
  return {
    active: providerReviewPromptActive,
    providerName: providerReviewPromptStoreName,
  };
}

export function clearProviderReviewPromptState() {
  providerReviewPromptActive = false;
}

export function getClientTrackingOrder(orderId?: string) {
  const providerOrders = providerMarketplaceOrders.filter((order) => order.id === orderId);
  const relatedOrders = providerOrders.length > 0 ? providerOrders : providerMarketplaceOrders.filter((order) => order.id === 'HUPI-MK-2048');
  const statuses = relatedOrders.map((order) => order.status);
  const hasPickup = relatedOrders.some((order) => order.deliveryType === 'pickup');
  const hasShipping = relatedOrders.some((order) => order.deliveryType !== 'pickup');
  const steps = getClientTrackingSteps(hasPickup, hasShipping);
  const status = getClientTrackingStatus(statuses, hasPickup, hasShipping);
  const currentStep = Math.max(0, steps.indexOf(status));

  return {
    id: relatedOrders[0]?.id ?? 'HUPI-MK-2048',
    currentStep,
    steps,
    status,
    address: relatedOrders[0]?.address ?? 'Casa: La Carolina, Quito',
    estimatedDate: 'Jue 9 Jul',
    providerOrders: relatedOrders.map((order) => ({
      providerOrderId: order.providerOrderId,
      storeName: order.storeName,
      status: mapProviderStatusToClientStatus(order.status),
      rawStatus: order.status,
      deliveryMethod: order.deliveryMethod,
      carrierName: order.shippingGuide?.carrierName ?? order.carrier,
      trackingNumber: order.shippingGuide?.trackingNumber ?? order.guideNumber,
    })),
    latestNotification: marketplaceClientNotifications[0],
  };
}

function getClientTrackingSteps(hasPickup: boolean, hasShipping: boolean) {
  return ['Pedido creado', 'Pago validado', 'En preparación', 'Listo para envío', 'En camino', 'Entregado'];
}

function getClientTrackingStatus(statuses: ProviderMarketplaceOrderStatus[], hasPickup: boolean, hasShipping: boolean) {
  if (statuses.length === 0) {
    return 'Pedido creado';
  }

  if (statuses.every((status) => status === 'Entregado')) {
    return 'Entregado';
  }

  if (statuses.some((status) => status === 'En camino')) {
    return 'En camino';
  }

  if (statuses.some((status) => status === 'Listo para envío')) {
    return 'Listo para envío';
  }

  if (statuses.some((status) => status === 'En preparación')) {
    return 'En preparación';
  }

  if (statuses.some((status) => status === 'Confirmado')) {
    return 'Pago validado';
  }

  return 'Pedido creado';
}

function mapProviderStatusToClientStatus(status: ProviderMarketplaceOrderStatus) {
  if (status === 'En preparación') {
    return 'En preparación';
  }

  if (status === 'Listo para envío') {
    return 'Listo para envío';
  }

  if (status === 'En camino') {
    return 'En camino';
  }

  if (status === 'Entregado') {
    return 'Entregado';
  }

  if (status === 'Confirmado') {
    return 'Pago validado';
  }

  return 'Pedido creado';
}

function getClientNotificationForStatus(status: ProviderMarketplaceOrderStatus) {
  if (status === 'En preparación') {
    return 'Tu pedido está en preparación. La tienda ya está preparando tu pedido.';
  }

  if (status === 'En camino') {
    return 'Tu pedido está en camino. Tu pedido ya salió hacia tu dirección.';
  }

  if (status === 'Entregado') {
    return 'Pedido entregado. Tu pedido fue marcado como entregado.';
  }

  if (status === 'Listo para envío') {
    return 'Tu pedido está listo para envío. La tienda terminó de preparar tu pedido.';
  }

  return '';
}
