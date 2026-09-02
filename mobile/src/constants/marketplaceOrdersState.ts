import { addProviderNotification } from './marketplaceStoreState';
import { mockBillingProfiles, mockInvoiceStatuses, mockOrderDocuments } from './mockData';
import { getRemoteOrders } from '@/data/remoteOverlay';
import { syncOrderReview, syncPaymentProof } from '@/data/remoteWrites';

export type MarketplaceClientOrderStatus =
  | 'Pendiente de pago'
  | 'Pago en revisión'
  | 'Confirmado'
  | 'En preparación'
  | 'Listo para envío'
  | 'En camino'
  | 'Entregado'
  | 'Cancelado';

export type MarketplaceClientPaymentStatus =
  | 'Pendiente de comprobante'
  | 'Comprobante enviado'
  | 'Pago validado'
  | 'Comprobante rechazado'
  | 'Pagado con tarjeta';

export type MarketplaceClientPaymentMethod = 'Tarjeta terminada en 4242' | 'Transferencia bancaria' | 'Deuna' | 'Saldo Hupi';
export type MarketplaceInvoiceStatus = typeof mockInvoiceStatuses[number];

export type MarketplaceBillingProfile = {
  taxpayerType: string;
  identificationType: string;
  identificationNumber: string;
  nameOrBusinessName: string;
  billingEmail: string;
  contactPhone: string;
  fiscalAddress?: string;
};

export type MarketplaceOrderDocuments = {
  receiptStatus: MarketplaceInvoiceStatus;
  invoiceStatus: MarketplaceInvoiceStatus;
  sentToEmail: boolean;
};

export type MarketplaceOrderProduct = {
  id: string;
  name: string;
  brand: string;
  storeId: string;
  storeName: string;
  storeOfficial: boolean;
  storeVerifiedByHupi: boolean;
  emoji: string;
  color: string;
  quantity: number;
  unitPrice: number;
};

export type MarketplaceOrderStore = {
  id: string;
  name: string;
  isOfficialStore: boolean;
  isVerifiedByHupi: boolean;
  preparationStatus: 'Pendiente de pago' | 'Confirmado' | 'En preparación' | 'Listo para envío' | 'En camino' | 'Entregado' | 'Cancelado';
};

export type MarketplaceClientOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  stores: MarketplaceOrderStore[];
  products: MarketplaceOrderProduct[];
  paymentMethod: MarketplaceClientPaymentMethod;
  paymentStatus: MarketplaceClientPaymentStatus;
  orderStatus: MarketplaceClientOrderStatus;
  billingProfile: MarketplaceBillingProfile;
  documents: MarketplaceOrderDocuments;
  shippingMethod: string;
  deliveryAddress: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  donation: number;
  hupiBalanceApplied?: number;
  total: number;
  proofUploaded: boolean;
  proofDraftLoaded?: boolean;
  receiptAvailable: boolean;
  canRate: boolean;
  deliveredAt?: string;
  couponCode?: string;
  cancellationReason?: string;
  refundResolution?: string;
  ratingSubmitted?: boolean;
  rating?: {
    store: number;
    product: number;
    comment?: string;
  };
};

export type MarketplaceClientNotification = {
  id: string;
  title: string;
  message: string;
  type:
    | 'payment_proof_sent'
    | 'payment_proof_rejected'
    | 'payment_validated'
    | 'order_confirmed'
    | 'order_preparing'
    | 'order_ready_to_ship'
    | 'order_on_the_way'
    | 'order_delivered'
    | 'ticket_received'
    | 'ticket_updated'
    | 'support_case_sent'
    | 'chat_message_support';
  isRead: boolean;
  createdAt: string;
  actionTarget: string;
  category?: 'Soporte';
};

export const marketplaceTimelineSteps = [
  'Pedido creado',
  'Pago recibido / comprobante enviado',
  'Pago validado',
  'En preparación',
  'Listo para envío',
  'En camino',
  'Entregado',
] as const;

export type MarketplaceTimelineStep = typeof marketplaceTimelineSteps[number];

let mockMarketplaceOrders: MarketplaceClientOrder[] = [
  {
    id: 'order-001',
    orderNumber: 'HUPI-MK-2048',
    createdAt: '2026-07-08 · 16:20',
    customerName: 'Ana Morales',
    stores: [
      { id: 'store-hupi-bites', name: 'Hupi Bites', isOfficialStore: true, isVerifiedByHupi: true, preparationStatus: 'Entregado' },
      { id: 'store-urban-pet', name: 'Urban Pet', isOfficialStore: false, isVerifiedByHupi: true, preparationStatus: 'Entregado' },
    ],
    products: [
      createProduct('product-1', 'Snack natural de pollo', 'Hupi Bites', 'store-hupi-bites', 'Hupi Bites', true, true, 'SN', '#fff0ec', 2, 8.9),
      createProduct('product-2', 'Arnés urbano ajustable', 'Urban Pet', 'store-urban-pet', 'Urban Pet', false, true, 'AR', '#f0ebf7', 1, 24.5),
    ],
    paymentMethod: 'Tarjeta terminada en 4242',
    paymentStatus: 'Pagado con tarjeta',
    orderStatus: 'Entregado',
    billingProfile: getMockBillingProfile('billing-natural'),
    documents: getMockOrderDocuments('HUPI-MK-2048'),
    shippingMethod: 'Envío express · 24h',
    deliveryAddress: 'Casa: La Carolina, Quito',
    subtotal: 42.3,
    shippingCost: 4.5,
    discount: 4.23,
    donation: 1,
    total: 43.57,
    proofUploaded: false,
    receiptAvailable: true,
    canRate: true,
    couponCode: 'HUPI10',
    deliveredAt: '2026-07-09 · 12:15',
  },
  {
    id: 'order-002',
    orderNumber: 'HUPI-MK-2049',
    createdAt: '2026-07-09 · 09:10',
    customerName: 'Ana Morales',
    stores: [
      { id: 'store-hupi-bites', name: 'Hupi Bites', isOfficialStore: true, isVerifiedByHupi: true, preparationStatus: 'Pendiente de pago' },
    ],
    products: [
      createProduct('product-8', 'Mix entrenamiento premium', 'Hupi Bites', 'store-hupi-bites', 'Hupi Bites', true, true, 'MX', '#fff0ec', 1, 12.9),
    ],
    paymentMethod: 'Transferencia bancaria',
    paymentStatus: 'Pendiente de comprobante',
    orderStatus: 'Pendiente de pago',
    billingProfile: getMockBillingProfile('billing-natural'),
    documents: getMockOrderDocuments('HUPI-MK-2049'),
    shippingMethod: 'Envío estándar · 24-48h',
    deliveryAddress: 'Casa: La Carolina, Quito',
    subtotal: 12.9,
    shippingCost: 2.5,
    discount: 0,
    donation: 2,
    total: 17.4,
    proofUploaded: false,
    receiptAvailable: false,
    canRate: false,
  },
  {
    id: 'order-003',
    orderNumber: 'HUPI-MK-2050',
    createdAt: '2026-07-09 · 11:35',
    customerName: 'Ana Morales',
    stores: [
      { id: 'store-urban-pet', name: 'Urban Pet', isOfficialStore: false, isVerifiedByHupi: true, preparationStatus: 'Pendiente de pago' },
    ],
    products: [
      createProduct('product-2', 'Arnés urbano ajustable', 'Urban Pet', 'store-urban-pet', 'Urban Pet', false, true, 'AR', '#f0ebf7', 1, 22.99),
    ],
    paymentMethod: 'Deuna',
    paymentStatus: 'Comprobante enviado',
    orderStatus: 'Pago en revisión',
    billingProfile: getMockBillingProfile('billing-natural'),
    documents: getMockOrderDocuments('HUPI-MK-2050'),
    shippingMethod: 'Recogida en punto · Urban Pet',
    deliveryAddress: 'Punto Urban Pet · Av. República',
    subtotal: 22.99,
    shippingCost: 0,
    discount: 0,
    donation: 0,
    total: 22.99,
    proofUploaded: true,
    receiptAvailable: false,
    canRate: false,
  },
  {
    id: 'order-004',
    orderNumber: 'HUPI-MK-2051',
    createdAt: '2026-07-07 · 15:42',
    customerName: 'Ana Morales',
    stores: [
      { id: 'store-hupi-bites', name: 'Hupi Bites', isOfficialStore: true, isVerifiedByHupi: true, preparationStatus: 'En preparación' },
    ],
    products: [
      createProduct('product-1', 'Snack natural de pollo', 'Hupi Bites', 'store-hupi-bites', 'Hupi Bites', true, true, 'SN', '#fff0ec', 3, 8.9),
    ],
    paymentMethod: 'Tarjeta terminada en 4242',
    paymentStatus: 'Pagado con tarjeta',
    orderStatus: 'En preparación',
    billingProfile: getMockBillingProfile('billing-company'),
    documents: getMockOrderDocuments('HUPI-MK-2051'),
    shippingMethod: 'Envío estándar · 24-48h',
    deliveryAddress: 'Oficina: Av. República, Quito',
    subtotal: 26.7,
    shippingCost: 2.5,
    discount: 0,
    donation: 1,
    total: 30.2,
    proofUploaded: false,
    receiptAvailable: true,
    canRate: false,
  },
  {
    id: 'order-005',
    orderNumber: 'HUPI-MK-2052',
    createdAt: '2026-07-06 · 18:04',
    customerName: 'Ana Morales',
    stores: [
      { id: 'store-clean-paw', name: 'Clean Paw', isOfficialStore: false, isVerifiedByHupi: false, preparationStatus: 'Pendiente de pago' },
    ],
    products: [
      createProduct('product-6', 'Shampoo hipoalergénico', 'Clean Paw', 'store-clean-paw', 'Clean Paw', false, false, 'SH', '#eef9f3', 1, 12.99),
    ],
    paymentMethod: 'Transferencia bancaria',
    paymentStatus: 'Comprobante rechazado',
    orderStatus: 'Pendiente de pago',
    billingProfile: getMockBillingProfile('billing-natural'),
    documents: getMockOrderDocuments('HUPI-MK-2052'),
    shippingMethod: 'Envío estándar · 24-48h',
    deliveryAddress: 'Casa: La Carolina, Quito',
    subtotal: 12.99,
    shippingCost: 2.5,
    discount: 0,
    donation: 0,
    total: 15.49,
    proofUploaded: true,
    receiptAvailable: false,
    canRate: false,
  },
  {
    id: 'order-006',
    orderNumber: 'HUPI-MK-2053',
    createdAt: '2026-07-05 · 10:18',
    customerName: 'Ana Morales',
    stores: [
      { id: 'store-urban-pet', name: 'Urban Pet', isOfficialStore: false, isVerifiedByHupi: true, preparationStatus: 'Listo para envío' },
    ],
    products: [
      createProduct('product-2', 'Arnés urbano ajustable', 'Urban Pet', 'store-urban-pet', 'Urban Pet', false, true, 'AR', '#f0ebf7', 1, 22.99),
    ],
    paymentMethod: 'Transferencia bancaria',
    paymentStatus: 'Pago validado',
    orderStatus: 'Listo para envío',
    billingProfile: getMockBillingProfile('billing-company'),
    documents: getMockOrderDocuments('HUPI-MK-2053'),
    shippingMethod: 'Envío estándar · 24-48h',
    deliveryAddress: 'Casa: La Carolina, Quito',
    subtotal: 22.99,
    shippingCost: 2.5,
    discount: 0,
    donation: 1,
    total: 26.49,
    proofUploaded: true,
    receiptAvailable: true,
    canRate: false,
  },
  {
    id: 'order-007',
    orderNumber: 'HUPI-MK-2054',
    createdAt: '2026-07-04 · 13:25',
    customerName: 'Ana Morales',
    stores: [
      { id: 'store-clean-paw', name: 'Clean Paw', isOfficialStore: false, isVerifiedByHupi: false, preparationStatus: 'Cancelado' },
    ],
    products: [
      createProduct('product-6', 'Shampoo hipoalergénico', 'Clean Paw', 'store-clean-paw', 'Clean Paw', false, false, 'SH', '#eef9f3', 1, 12.99),
    ],
    paymentMethod: 'Tarjeta terminada en 4242',
    paymentStatus: 'Pagado con tarjeta',
    orderStatus: 'Cancelado',
    billingProfile: getMockBillingProfile('billing-natural'),
    documents: getMockOrderDocuments('HUPI-MK-2054', 'No aplica'),
    shippingMethod: 'Envío estándar · 24-48h',
    deliveryAddress: 'Casa: La Carolina, Quito',
    subtotal: 12.99,
    shippingCost: 2.5,
    discount: 0,
    donation: 0,
    total: 15.49,
    proofUploaded: false,
    receiptAvailable: true,
    canRate: false,
    cancellationReason: 'La tienda no pudo completar el despacho dentro del tiempo comprometido.',
    refundResolution: 'Reembolso a tarjeta en proceso.',
  },
  {
    id: 'order-008',
    orderNumber: 'HUPI-MK-2055',
    createdAt: '2026-07-08 · 10:00',
    customerName: 'Ana Morales',
    stores: [
      { id: 'store-hupi-bites', name: 'Hupi Bites', isOfficialStore: true, isVerifiedByHupi: true, preparationStatus: 'Confirmado' },
    ],
    products: [
      createProduct('product-8', 'Mix entrenamiento premium', 'Hupi Bites', 'store-hupi-bites', 'Hupi Bites', true, true, 'MX', '#fff0ec', 1, 12.9),
    ],
    paymentMethod: 'Transferencia bancaria',
    paymentStatus: 'Pago validado',
    orderStatus: 'Confirmado',
    billingProfile: getMockBillingProfile('billing-natural'),
    documents: getMockOrderDocuments('HUPI-MK-2055'),
    shippingMethod: 'Envío estándar · 24-48h',
    deliveryAddress: 'Casa: La Carolina, Quito',
    subtotal: 12.9,
    shippingCost: 2.5,
    discount: 0,
    donation: 0,
    hupiBalanceApplied: 8.5,
    total: 6.9,
    proofUploaded: true,
    receiptAvailable: true,
    canRate: false,
  },
  {
    id: 'order-009',
    orderNumber: 'HUPI-MK-2056',
    createdAt: '2026-07-03 · 09:10',
    customerName: 'Ana Morales',
    stores: [
      { id: 'store-hupi-bites', name: 'Hupi Bites', isOfficialStore: true, isVerifiedByHupi: true, preparationStatus: 'Entregado' },
    ],
    products: [
      createProduct('product-1', 'Snack natural de pollo', 'Hupi Bites', 'store-hupi-bites', 'Hupi Bites', true, true, 'SN', '#fff0ec', 2, 8.9),
    ],
    paymentMethod: 'Transferencia bancaria',
    paymentStatus: 'Pago validado',
    orderStatus: 'Entregado',
    billingProfile: getMockBillingProfile('billing-natural'),
    documents: getMockOrderDocuments('HUPI-MK-2056', 'Emitido'),
    shippingMethod: 'Envío express · 24h',
    deliveryAddress: 'Casa: La Carolina, Quito',
    subtotal: 17.8,
    shippingCost: 3,
    discount: 0,
    donation: 1,
    total: 21.8,
    proofUploaded: true,
    receiptAvailable: true,
    canRate: false,
    ratingSubmitted: true,
    deliveredAt: '2026-07-04 · 12:10',
    rating: { product: 5, store: 5, comment: 'Excelente entrega.' },
  },
  {
    id: 'order-010',
    orderNumber: 'HUPI-MK-2060',
    createdAt: '2026-07-10 · 09:20',
    customerName: 'Ana Morales',
    stores: [
      { id: 'store-hupi-bites', name: 'Hupi Bites', isOfficialStore: true, isVerifiedByHupi: true, preparationStatus: 'Confirmado' },
    ],
    products: [
      createProduct('product-1', 'Snack natural de pollo', 'Hupi Bites', 'store-hupi-bites', 'Hupi Bites', true, true, 'SN', '#fff0ec', 1, 8.9),
    ],
    paymentMethod: 'Saldo Hupi',
    paymentStatus: 'Pago validado',
    orderStatus: 'Confirmado',
    billingProfile: getMockBillingProfile('billing-natural'),
    documents: getMockOrderDocuments('HUPI-MK-2060', 'Pendiente de emisión'),
    shippingMethod: 'Envío estándar · 24-48h',
    deliveryAddress: 'Casa: La Carolina, Quito',
    subtotal: 8.9,
    shippingCost: 0,
    discount: 0,
    donation: 0,
    hupiBalanceApplied: 8.9,
    total: 0,
    proofUploaded: false,
    receiptAvailable: true,
    canRate: false,
  },
];

let marketplaceClientNotifications: MarketplaceClientNotification[] = [
  {
    id: 'client-notif-001',
    title: 'Comprobante enviado',
    message: 'Hupi recibió tu comprobante y revisará el pago.',
    type: 'payment_proof_sent',
    isRead: false,
    createdAt: '2026-07-09',
    actionTarget: '/marketplace/orders',
  },
  {
    id: 'client-notif-002',
    title: 'Comprobante rechazado',
    message: 'Hupi no pudo validar tu comprobante. Por favor sube uno corregido.',
    type: 'payment_proof_rejected',
    isRead: false,
    createdAt: '2026-07-08',
    actionTarget: '/marketplace/orders',
  },
  {
    id: 'client-notif-003',
    title: 'Pago validado',
    message: 'Hupi validó tu pago. Tu pedido fue confirmado.',
    type: 'payment_validated',
    isRead: true,
    createdAt: '2026-07-07',
    actionTarget: '/marketplace/orders',
  },
  {
    id: 'client-notif-004',
    title: 'Pedido en camino',
    message: 'Tu pedido ya salió hacia tu dirección.',
    type: 'order_on_the_way',
    isRead: false,
    createdAt: '2026-07-08',
    actionTarget: '/marketplace/orders',
  },
  {
    id: 'client-notif-005',
    title: 'Ticket recibido',
    message: 'Tu solicitud fue registrada correctamente.',
    type: 'ticket_received',
    isRead: false,
    createdAt: '2026-07-09',
    actionTarget: '/support',
  },
  {
    id: 'client-notif-chat-001',
    title: 'Caso enviado a Soporte Hupi',
    message: 'Tu solicitud sobre el pedido HUPI-MK-2048 fue enviada a soporte.',
    type: 'support_case_sent',
    isRead: false,
    createdAt: '2026-07-10',
    actionTarget: '/chat?chatId=chat-marketplace-2048-hupi-bites&viewer=client',
  },
  {
    id: 'client-notif-chat-002',
    title: 'Nuevo mensaje de Soporte Hupi',
    message: 'Soporte Hupi respondió tu ticket #INC-2049.',
    type: 'chat_message_support',
    isRead: false,
    createdAt: '2026-07-10',
    actionTarget: '/chat?chatId=chat-support-client-2049&viewer=client',
  },
];

function createProduct(
  id: string,
  name: string,
  brand: string,
  storeId: string,
  storeName: string,
  storeOfficial: boolean,
  storeVerifiedByHupi: boolean,
  emoji: string,
  color: string,
  quantity: number,
  unitPrice: number,
): MarketplaceOrderProduct {
  return {
    id,
    name,
    brand,
    storeId,
    storeName,
    storeOfficial,
    storeVerifiedByHupi,
    emoji,
    color,
    quantity,
    unitPrice,
  };
}

function getMockBillingProfile(profileId: string): MarketplaceBillingProfile {
  const profile = mockBillingProfiles.find((item) => item.id === profileId) ?? mockBillingProfiles[0];

  return {
    taxpayerType: profile.taxpayerType,
    identificationType: profile.identificationType,
    identificationNumber: profile.identificationNumber,
    nameOrBusinessName: profile.nameOrBusinessName,
    billingEmail: profile.billingEmail,
    contactPhone: profile.contactPhone,
    fiscalAddress: profile.fiscalAddress,
  };
}

function getMockOrderDocuments(orderNumber: string, fallbackInvoiceStatus: MarketplaceInvoiceStatus = 'Pendiente de emisión'): MarketplaceOrderDocuments {
  return mockOrderDocuments[orderNumber as keyof typeof mockOrderDocuments] ?? {
    receiptStatus: 'Emitido',
    invoiceStatus: fallbackInvoiceStatus,
    sentToEmail: fallbackInvoiceStatus === 'Enviado al correo',
  };
}

export function getMarketplaceOrders() {
  // Con backend configurado la lista viva manda; si no, se usan los mocks.
  return getRemoteOrders(mockMarketplaceOrders) ?? [...mockMarketplaceOrders];
}

export function getMarketplaceOrder(orderId?: string) {
  return mockMarketplaceOrders.find((order) => order.id === orderId || order.orderNumber === orderId) ?? mockMarketplaceOrders[0];
}

export function uploadMarketplacePaymentProof(orderId: string) {
  let updatedOrder = getMarketplaceOrder(orderId);
  const wasRejected = updatedOrder.paymentStatus === 'Comprobante rechazado';

  mockMarketplaceOrders = mockMarketplaceOrders.map((order) => {
    if (order.id !== orderId && order.orderNumber !== orderId) {
      return order;
    }

    updatedOrder = {
      ...order,
      proofUploaded: true,
      proofDraftLoaded: false,
      paymentStatus: 'Comprobante enviado',
      orderStatus: 'Pago en revisión',
      stores: order.stores.map((store) => ({ ...store, preparationStatus: 'Pendiente de pago' })),
    };
    return updatedOrder;
  });
  addMarketplaceClientNotification({
    title: 'Comprobante enviado',
    message: wasRejected ? 'Hupi recibió tu comprobante corregido y revisará nuevamente el pago.' : 'Hupi recibió tu comprobante y revisará el pago.',
    type: 'payment_proof_sent',
    actionTarget: `/marketplace/order-detail?orderId=${updatedOrder.id}`,
  });

  syncPaymentProof(updatedOrder.orderNumber, `comprobante-${updatedOrder.orderNumber}.pdf`);

  return updatedOrder;
}

export function saveMarketplacePaymentProofDraft(orderId: string) {
  let updatedOrder = getMarketplaceOrder(orderId);

  mockMarketplaceOrders = mockMarketplaceOrders.map((order) => {
    if (order.id !== orderId && order.orderNumber !== orderId) {
      return order;
    }

    updatedOrder = {
      ...order,
      proofDraftLoaded: true,
    };
    return updatedOrder;
  });

  return updatedOrder;
}

export function markMarketplacePaymentProofRejected(orderId: string) {
  let updatedOrder = getMarketplaceOrder(orderId);

  mockMarketplaceOrders = mockMarketplaceOrders.map((order) => {
    if (order.id !== orderId && order.orderNumber !== orderId) {
      return order;
    }

    updatedOrder = {
      ...order,
      paymentStatus: 'Comprobante rechazado',
      orderStatus: 'Pendiente de pago',
      proofUploaded: false,
      proofDraftLoaded: false,
      receiptAvailable: false,
      stores: order.stores.map((store) => ({ ...store, preparationStatus: 'Pendiente de pago' })),
    };
    return updatedOrder;
  });
  addMarketplaceClientNotification({
    title: 'Comprobante rechazado',
    message: 'Hupi no pudo validar tu comprobante. Por favor sube uno corregido.',
    type: 'payment_proof_rejected',
    actionTarget: `/marketplace/order-detail?orderId=${updatedOrder.id}`,
  });

  return updatedOrder;
}

export function markMarketplacePaymentValidated(orderId: string) {
  let updatedOrder = getMarketplaceOrder(orderId);

  mockMarketplaceOrders = mockMarketplaceOrders.map((order) => {
    if (order.id !== orderId && order.orderNumber !== orderId) {
      return order;
    }

    updatedOrder = {
      ...order,
      paymentStatus: 'Pago validado',
      orderStatus: 'Confirmado',
      proofUploaded: true,
      proofDraftLoaded: false,
      receiptAvailable: true,
      stores: order.stores.map((store) => ({ ...store, preparationStatus: 'En preparación' })),
    };
    return updatedOrder;
  });
  addMarketplaceClientNotification({
    title: 'Pago validado',
    message: 'Hupi validó tu pago. Tu pedido fue confirmado.',
    type: 'payment_validated',
    actionTarget: `/marketplace/order-detail?orderId=${updatedOrder.id}`,
  });

  return updatedOrder;
}

export function submitMarketplaceOrderRating(orderId: string, rating: MarketplaceClientOrder['rating']) {
  let updatedOrder = getMarketplaceOrder(orderId);

  mockMarketplaceOrders = mockMarketplaceOrders.map((order) => {
    if (order.id !== orderId && order.orderNumber !== orderId) {
      return order;
    }

    updatedOrder = {
      ...order,
      canRate: false,
      rating,
      ratingSubmitted: true,
    };
    return updatedOrder;
  });
  addProviderNotification({
    category: 'Calificaciones',
    type: 'marketplace_order_rating',
    title: 'Nueva calificación',
    message: 'Recibiste una nueva calificación por un pedido Marketplace.',
    priority: 'Importante',
    actionLabel: 'Ver pedidos',
    actionTarget: 'marketplace-orders',
    dedupeKey: `rating:${updatedOrder.orderNumber}`,
  });

  syncOrderReview(updatedOrder.orderNumber, {
    storeRating: rating?.store,
    productRating: rating?.product,
    comment: rating?.comment,
  });

  return updatedOrder;
}

export function getOrderTimelineCurrentStep(order: MarketplaceClientOrder): MarketplaceTimelineStep {
  if (order.orderStatus === 'Pendiente de pago') {
    return 'Pedido creado';
  }

  if (order.paymentStatus === 'Comprobante enviado' || order.orderStatus === 'Pago en revisión') {
    return 'Pago recibido / comprobante enviado';
  }

  if (order.orderStatus === 'En preparación') {
    return 'En preparación';
  }

  if (order.orderStatus === 'Listo para envío') {
    return 'Listo para envío';
  }

  if (order.orderStatus === 'En camino') {
    return 'En camino';
  }

  if (order.orderStatus === 'Entregado') {
    return 'Entregado';
  }

  if (order.paymentStatus === 'Pago validado' || order.paymentStatus === 'Pagado con tarjeta' || order.orderStatus === 'Confirmado') {
    return 'Pago validado';
  }

  return 'Pedido creado';
}

export function syncMarketplaceOrderStatusFromProvider(orderNumber: string, status: MarketplaceClientOrderStatus, storeId?: string) {
  let updatedOrder = getMarketplaceOrder(orderNumber);

  mockMarketplaceOrders = mockMarketplaceOrders.map((order) => {
    if (order.orderNumber !== orderNumber) {
      return order;
    }

    updatedOrder = {
      ...order,
      orderStatus: status,
      canRate: status === 'Entregado' && !order.ratingSubmitted,
      deliveredAt: status === 'Entregado' ? order.deliveredAt ?? new Date().toISOString().slice(0, 10) : order.deliveredAt,
      stores: order.stores.map((store) => (
        !storeId || store.id === storeId
          ? { ...store, preparationStatus: mapOrderStatusToStorePreparation(status) }
          : store
      )),
    };
    return updatedOrder;
  });

  const notification = getClientNotificationForProviderStatus(status, updatedOrder.id);
  if (notification) {
    addMarketplaceClientNotification(notification);
  }

  return updatedOrder;
}

export function getMarketplaceClientNotifications() {
  return [...marketplaceClientNotifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addMarketplaceClientNotification(notification: Omit<MarketplaceClientNotification, 'createdAt' | 'id' | 'isRead'> & {
  createdAt?: string;
  id?: string;
  isRead?: boolean;
}) {
  const nextNotification: MarketplaceClientNotification = {
    ...notification,
    id: notification.id ?? `client-notif-${Date.now()}-${marketplaceClientNotifications.length + 1}`,
    isRead: notification.isRead ?? false,
    createdAt: notification.createdAt ?? new Date().toISOString().slice(0, 10),
  };

  marketplaceClientNotifications = [nextNotification, ...marketplaceClientNotifications];
  return nextNotification;
}

function mapOrderStatusToStorePreparation(status: MarketplaceClientOrderStatus): MarketplaceOrderStore['preparationStatus'] {
  if (status === 'Confirmado') {
    return 'Confirmado';
  }

  if (status === 'Pago en revisión' || status === 'Pendiente de pago') {
    return 'Pendiente de pago';
  }

  if (status === 'Cancelado') {
    return 'Cancelado';
  }

  return status;
}

function getClientNotificationForProviderStatus(status: MarketplaceClientOrderStatus, orderId: string): Omit<MarketplaceClientNotification, 'createdAt' | 'id' | 'isRead'> | null {
  if (status === 'En preparación') {
    return {
      title: 'Tu pedido está en preparación',
      message: 'La tienda ya está preparando tu pedido.',
      type: 'order_preparing',
      actionTarget: `/marketplace/order-detail?orderId=${orderId}`,
    };
  }

  if (status === 'Listo para envío') {
    return {
      title: 'Tu pedido está listo para envío',
      message: 'La tienda terminó de preparar tu pedido.',
      type: 'order_ready_to_ship',
      actionTarget: `/marketplace/order-detail?orderId=${orderId}`,
    };
  }

  if (status === 'En camino') {
    return {
      title: 'Tu pedido está en camino',
      message: 'Tu pedido ya salió hacia tu dirección.',
      type: 'order_on_the_way',
      actionTarget: `/marketplace/order-detail?orderId=${orderId}`,
    };
  }

  if (status === 'Entregado') {
    return {
      title: 'Pedido entregado',
      message: 'Tu pedido fue marcado como entregado.',
      type: 'order_delivered',
      actionTarget: `/marketplace/order-detail?orderId=${orderId}`,
    };
  }

  return null;
}
