import { getRemoteWallet } from '@/data/remoteOverlay';
import { syncCreateIssue } from '@/data/remoteWrites';

import { addMarketplaceClientNotification } from './marketplaceOrdersState';
import { addProviderNotification } from './marketplaceStoreState';

export type MarketplaceIssueStatus = 'Abierta' | 'En revisión' | 'Aprobada' | 'Rechazada' | 'Cerrada';
export type MarketplaceIssueReason =
  | 'No recibí mi pedido'
  | 'Producto incorrecto'
  | 'Producto llegó dañado'
  | 'Producto incompleto'
  | 'Quiero cancelar mi pedido'
  | 'Quiero solicitar reembolso'
  | 'Otro';
export type MarketplaceResolutionType =
  | 'Sin reembolso'
  | 'Reembolso total'
  | 'Reembolso parcial'
  | 'Saldo Hupi'
  | 'Reposición / nuevo envío'
  | 'Cancelación aprobada'
  | 'Cancelación rechazada';
export type MarketplaceRefundMethod = 'Saldo Hupi' | 'Método de pago original' | 'Transferencia manual';
export type MarketplaceRefundStatus = 'Pendiente' | 'Procesado' | 'Rechazado';

export type MarketplaceIssue = {
  id: string;
  caseNumber: string;
  orderId: string;
  customerId: string;
  providerId: string;
  storeId: string;
  reason: MarketplaceIssueReason;
  description: string;
  evidenceMock: string | null;
  status: MarketplaceIssueStatus;
  resolutionType: MarketplaceResolutionType | null;
  refundMethod: MarketplaceRefundMethod | null;
  refundAmount: number;
  createdAt: string;
  resolvedAt: string | null;
  adminComment: string;
};

export type MarketplaceRefund = {
  id: string;
  issueId: string;
  orderId: string;
  customerName: string;
  originalPaymentMethod: string;
  refundMethod: MarketplaceRefundMethod;
  amount: number;
  status: MarketplaceRefundStatus;
  createdAt: string;
};

export type HupiBalanceMovement = {
  id: string;
  concept: string;
  amount: number;
  createdAt: string;
  type: 'Reembolso acreditado' | 'Uso en compra' | 'Ajuste Hupi' | 'Saldo expirado';
  status: 'Disponible' | 'Usado' | 'Pendiente' | 'Reversado';
};

export const issueReasons: MarketplaceIssueReason[] = [
  'No recibí mi pedido',
  'Producto incorrecto',
  'Producto llegó dañado',
  'Producto incompleto',
  'Quiero cancelar mi pedido',
  'Quiero solicitar reembolso',
  'Otro',
];

let nextIssueSequence = 2049;

let mockMarketplaceIssues: MarketplaceIssue[] = [
  {
    id: 'issue-2056',
    caseNumber: 'INC-2056',
    orderId: 'HUPI-MK-2056',
    customerId: 'customer-001',
    providerId: 'provider-001',
    storeId: 'store-hupi-bites',
    reason: 'Producto llegó dañado',
    description: 'El empaque llegó golpeado y el producto parcialmente abierto.',
    evidenceMock: 'foto-empaque-danado.jpg',
    status: 'Abierta',
    resolutionType: null,
    refundMethod: null,
    refundAmount: 0,
    createdAt: '2026-07-09',
    resolvedAt: null,
    adminComment: 'Hupi solicita evidencia adicional al proveedor.',
  },
  {
    id: 'issue-2051',
    caseNumber: 'INC-2051',
    orderId: 'HUPI-MK-2051',
    customerId: 'customer-002',
    providerId: 'provider-002',
    storeId: 'store-kong',
    reason: 'Quiero cancelar mi pedido',
    description: 'El cliente pidió cancelar mientras el pedido estaba en camino.',
    evidenceMock: null,
    status: 'En revisión',
    resolutionType: null,
    refundMethod: null,
    refundAmount: 0,
    createdAt: '2026-07-08',
    resolvedAt: null,
    adminComment: 'Solicitud en revisión según avance logístico.',
  },
  {
    id: 'issue-2054',
    caseNumber: 'INC-2054',
    orderId: 'HUPI-MK-2054',
    customerId: 'customer-001',
    providerId: 'provider-003',
    storeId: 'store-clean-paw',
    reason: 'Quiero solicitar reembolso',
    description: 'Pedido cancelado por imposibilidad de despacho.',
    evidenceMock: null,
    status: 'Aprobada',
    resolutionType: 'Reembolso total',
    refundMethod: 'Método de pago original',
    refundAmount: 15.49,
    createdAt: '2026-07-04',
    resolvedAt: '2026-07-05',
    adminComment: 'Reembolso total aprobado por cancelación operacional.',
  },
  {
    id: 'issue-2048',
    caseNumber: 'INC-2048',
    orderId: 'HUPI-MK-2048',
    customerId: 'customer-001',
    providerId: 'provider-001',
    storeId: 'store-hupi-bites',
    reason: 'Producto incompleto',
    description: 'Faltó una unidad del producto principal.',
    evidenceMock: 'foto-paquete-incompleto.jpg',
    status: 'Cerrada',
    resolutionType: 'Reembolso parcial',
    refundMethod: 'Saldo Hupi',
    refundAmount: 4.5,
    createdAt: '2026-07-09',
    resolvedAt: '2026-07-09',
    adminComment: 'Se acreditó saldo Hupi por faltante parcial.',
  },
  {
    id: 'issue-2057',
    caseNumber: 'INC-2057',
    orderId: 'HUPI-MK-2057',
    customerId: 'customer-001',
    providerId: 'provider-001',
    storeId: 'store-hupi-bites',
    reason: 'Producto incorrecto',
    description: 'Se entregó una variación distinta a la solicitada.',
    evidenceMock: 'foto-producto-incorrecto.jpg',
    status: 'Cerrada',
    resolutionType: 'Reembolso parcial',
    refundMethod: 'Saldo Hupi',
    refundAmount: 3.5,
    createdAt: '2026-07-06',
    resolvedAt: '2026-07-07',
    adminComment: 'Reembolso parcial aplicado como saldo Hupi.',
  },
];

let mockMarketplaceRefunds: MarketplaceRefund[] = [
  {
    id: 'refund-2054',
    issueId: 'issue-2054',
    orderId: 'HUPI-MK-2054',
    customerName: 'Ana Morales',
    originalPaymentMethod: 'Tarjeta terminada en 4242',
    refundMethod: 'Método de pago original',
    amount: 15.49,
    status: 'Procesado',
    createdAt: '2026-07-05',
  },
  {
    id: 'refund-2048',
    issueId: 'issue-2048',
    orderId: 'HUPI-MK-2048',
    customerName: 'Ana Morales',
    originalPaymentMethod: 'Tarjeta terminada en 4242',
    refundMethod: 'Saldo Hupi',
    amount: 4.5,
    status: 'Procesado',
    createdAt: '2026-07-09',
  },
  {
    id: 'refund-2057',
    issueId: 'issue-2057',
    orderId: 'HUPI-MK-2057',
    customerName: 'Ana Morales',
    originalPaymentMethod: 'Transferencia bancaria',
    refundMethod: 'Saldo Hupi',
    amount: 3.5,
    status: 'Procesado',
    createdAt: '2026-07-07',
  },
];

export const mockCustomerHupiBalance = {
  customerId: 'customer-001',
  available: 9.5,
};

let mockHupiBalanceMovements: HupiBalanceMovement[] = [
  { id: 'balance-001', concept: 'Reembolso por pedido HUPI-MK-2049', amount: 8.5, createdAt: '2026-07-09', type: 'Reembolso acreditado', status: 'Disponible' },
  { id: 'balance-004', concept: 'Reembolso parcial por pedido HUPI-MK-2057', amount: 3.5, createdAt: '2026-07-07', type: 'Reembolso acreditado', status: 'Disponible' },
  { id: 'balance-002', concept: 'Uso de saldo en pedido HUPI-MK-2051', amount: -5, createdAt: '2026-07-07', type: 'Uso en compra', status: 'Usado' },
  { id: 'balance-003', concept: 'Ajuste Hupi', amount: 2, createdAt: '2026-07-06', type: 'Ajuste Hupi', status: 'Disponible' },
];

export function getMarketplaceIssues() {
  return [...mockMarketplaceIssues];
}

export function getMarketplaceIssueForOrder(orderNumber?: string) {
  return mockMarketplaceIssues.find((issue) => issue.orderId === orderNumber) ?? null;
}

export function createMarketplaceIssue(input: {
  description: string;
  evidenceMock?: string | null;
  orderId: string;
  reason: MarketplaceIssueReason;
  storeId?: string;
}) {
  const caseNumber = `INC-${nextIssueSequence}`;
  nextIssueSequence += 1;

  const issue: MarketplaceIssue = {
    id: `issue-${caseNumber.toLowerCase()}`,
    caseNumber,
    orderId: input.orderId,
    customerId: 'customer-001',
    providerId: 'provider-001',
    storeId: input.storeId ?? 'store-hupi-bites',
    reason: input.reason,
    description: input.description,
    evidenceMock: input.evidenceMock ?? null,
    status: input.reason === 'Quiero cancelar mi pedido' ? 'En revisión' : 'Abierta',
    resolutionType: null,
    refundMethod: null,
    refundAmount: 0,
    createdAt: new Date().toISOString().slice(0, 10),
    resolvedAt: null,
    adminComment: 'Caso creado por el cliente. Pendiente revisión Hupi.',
  };

  mockMarketplaceIssues = [issue, ...mockMarketplaceIssues];
  syncCreateIssue(input.orderId, input.reason, input.description);
  addMarketplaceClientNotification({
    title: 'Solicitud recibida',
    message: 'Hupi revisará tu caso y te notificará una respuesta.',
    type: 'ticket_received',
    actionTarget: `/marketplace/order-detail?orderId=${input.orderId}`,
  });
  addProviderNotification({
    category: 'Pedidos',
    type: 'marketplace_issue_opened',
    title: 'Incidencia abierta',
    message: 'Hupi está revisando una solicitud relacionada con un pedido Marketplace.',
    priority: 'Importante',
    actionLabel: 'Ver pedidos',
    actionTarget: 'marketplace-orders',
    dedupeKey: `issue:${issue.caseNumber}`,
  });

  return issue;
}

export function getCustomerHupiBalance() {
  const remote = getRemoteWallet(mockHupiBalanceMovements);
  if (remote) {
    return {
      ...mockCustomerHupiBalance,
      available: remote.available,
      movements: remote.movements,
    };
  }

  return {
    ...mockCustomerHupiBalance,
    movements: [...mockHupiBalanceMovements],
  };
}

export function useCustomerHupiBalanceForPurchase(orderNumber: string, amount: number) {
  const normalizedAmount = Math.min(mockCustomerHupiBalance.available, Math.max(0, Number(amount.toFixed(2))));
  if (normalizedAmount <= 0) {
    return getCustomerHupiBalance();
  }

  mockCustomerHupiBalance.available = Number((mockCustomerHupiBalance.available - normalizedAmount).toFixed(2));
  mockHupiBalanceMovements = [
    {
      id: `balance-use-${Date.now()}`,
      concept: `Uso de Saldo Hupi en pedido ${orderNumber}`,
      amount: -normalizedAmount,
      createdAt: new Date().toISOString().slice(0, 10),
      type: 'Uso en compra',
      status: 'Usado',
    },
    ...mockHupiBalanceMovements,
  ];
  addMarketplaceClientNotification({
    title: 'Saldo usado en compra',
    message: `Usaste Saldo Hupi en el pedido ${orderNumber}.`,
    type: 'ticket_updated',
    actionTarget: '/marketplace/wallet',
  });

  return getCustomerHupiBalance();
}

export function creditCustomerHupiBalance(orderNumber: string, amount: number, comment = 'Reembolso acreditado') {
  const normalizedAmount = Math.max(0, Number(amount.toFixed(2)));
  mockCustomerHupiBalance.available = Number((mockCustomerHupiBalance.available + normalizedAmount).toFixed(2));
  mockHupiBalanceMovements = [
    {
      id: `balance-credit-${Date.now()}`,
      concept: `${comment} por pedido ${orderNumber}`,
      amount: normalizedAmount,
      createdAt: new Date().toISOString().slice(0, 10),
      type: 'Reembolso acreditado',
      status: 'Disponible',
    },
    ...mockHupiBalanceMovements,
  ];
  addMarketplaceClientNotification({
    title: 'Saldo Hupi acreditado',
    message: `Hupi acreditó saldo a tu cuenta por el pedido ${orderNumber}.`,
    type: 'ticket_updated',
    actionTarget: '/marketplace/wallet',
  });

  return getCustomerHupiBalance();
}

export function getMarketplaceRefunds() {
  return [...mockMarketplaceRefunds];
}

export function getProviderIssueAdjustmentForOrder(orderNumber: string) {
  return mockMarketplaceIssues
    .filter((issue) => (
      issue.orderId === orderNumber
      && (issue.status === 'Aprobada' || issue.status === 'Cerrada')
      && (issue.resolutionType === 'Reembolso total' || issue.resolutionType === 'Reembolso parcial' || issue.resolutionType === 'Saldo Hupi' || issue.resolutionType === 'Cancelación aprobada')
    ))
    .reduce((total, issue) => total + issue.refundAmount, 0);
}

export function hasOpenIssueForOrder(orderNumber: string) {
  const issue = getMarketplaceIssueForOrder(orderNumber);
  return Boolean(issue && (issue.status === 'Abierta' || issue.status === 'En revisión'));
}
