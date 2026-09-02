import { mockProductCategories } from './marketplaceProductEditorOptions';
import { defaultStoreSchedule } from './marketplaceStoreProfileOptions';
import { getRemoteNotifications, getRemotePayouts, getRemoteProducts } from '@/data/remoteOverlay';
import {
  syncCart,
  syncNotificationDeleted,
  syncNotificationRead,
  syncStoreProduct,
  syncStoreProfile,
  syncStoreShipping,
} from '@/data/remoteWrites';
import {
  mockCart,
  mockCartSummary,
  mockOfficialStores,
  mockProducts,
  mockShippingMethods,
} from './mockData';
import {
  isMarketplaceProductPublishable,
  isMarketplaceStoreEnabled,
  isMarketplaceVariationPublishable,
} from '../domain/marketplaceAvailability';
import {
  adminGeneratedProviderEvents as initialAdminGeneratedProviderEvents,
  type AdminGeneratedProviderEvent,
  type ProductVisibleStatus,
  type ProviderVisibleStatus,
  type StoreVisibleStatus,
  type TicketVisibleStatus,
} from '../mocks/provider-events';

export const currentMockProviderId = 'provider-001';
export const currentMockMarketplaceStoreId = 'store-hupi-bites';
export const marketplaceCommissionRate = 0.3;
export const providerReceivesRate = 0.7;

export type MarketplaceProductStatus = 'Activo' | 'Pausado' | 'En revisión' | 'Sin stock';
export type MarketplaceProductTag = 'Nuevo' | 'Oferta' | 'Recomendado';
export type MarketplaceShippingMethodId = 'standard' | 'express' | 'pickup';
export type MarketplaceProductType = 'simple' | 'variable';
export type MarketplaceProductTaxRate = 0 | 15;
export type ProductStockStatus = 'Disponible' | 'Sin stock' | 'Pausado';
export type ProductVariationKind = 'Color' | 'Talla' | 'Sabor' | 'Tamaño de empaque' | 'Personalizado';
export type ProductVariationOptionStatus = 'Activa' | 'Pausada' | 'Sin stock';
export type ProductImageMock = {
  id: string;
  label: string;
  emoji: string;
  isPrimary: boolean;
  order: number;
};
export type ProductVariationOption = {
  id: string;
  colorHex?: string;
  discount: number;
  name: string;
  priceBefore?: number;
  priceCurrent: number;
  sku: string;
  stock: number;
  status: ProductVariationOptionStatus;
};
export type ProductVariationGroup = {
  id: string;
  kind: ProductVariationKind;
  name: string;
  options: ProductVariationOption[];
};
export type ProductVariationCombination = ProductVariationOption & {
  combination: string;
};
export type ProductPackageDimensions = {
  weight: string;
  weightUnit: 'g' | 'kg' | 'lb';
  lengthCm: string;
  widthCm: string;
  heightCm: string;
};
export type ProductPackageLogistics = {
  pickupAddress: string;
  shippingMethod: string;
  weight: string;
  weightUnit: 'g' | 'kg' | 'lb';
  lengthCm: string;
  widthCm: string;
  heightCm: string;
};
export type ProviderPersonType = 'Persona Natural' | 'Persona Jurídica';
export type ProviderDocumentType = 'Cédula' | 'RUC';
export type ProviderStoreType = 'Local físico' | 'Tienda online';
export type ProviderStoreScheduleDay = {
  day: string;
  enabled: boolean;
  opensAt: string;
  closesAt: string;
};
export type PublicMarketplaceProduct = typeof mockProducts[number];
export type MarketplaceProductVariations = {
  color?: string[];
  flavor?: string[];
  size?: string[];
};
export type ProductAttributeOptionMock = {
  id: string;
  name: string;
  colorHex?: string;
};
export type ProductAttributeMock = {
  id: string;
  kind: ProductVariationKind;
  name: string;
  options: ProductAttributeOptionMock[];
};
export type ProductVariationMock = {
  id: string;
  name: string;
  selectedOptions: Record<string, string>;
  isSaved: boolean;
  isActive: boolean;
  priceBeforeCard?: number;
  priceAfterCard: number;
  priceBeforeTransfer?: number;
  priceAfterTransfer: number;
  stock: number;
  stockAlertMin: number;
  sku: string;
  status: ProductVariationOptionStatus;
  packageDimensions: ProductPackageDimensions;
};
export type ProductDisplayPrice = {
  discount: number;
  priceBefore?: number;
  priceCurrent: number;
  stock: number;
  stockStatus: ProductStockStatus;
  transferDiscount: number;
  transferPrice: number;
  transferPriceBefore?: number;
  variation: ProductVariationMock | null;
};
export type MarketplaceCartLikeItem = {
  id: string;
  productId: string;
  quantity: number;
  variationId?: string;
};
export type MarketplaceCartValidationIssueType = 'product_unavailable' | 'quantity_exceeds_stock' | 'variation_unavailable';
export type MarketplaceCartValidationIssue = {
  itemId: string;
  productName: string;
  type: MarketplaceCartValidationIssueType;
  message: string;
};
export type MarketplaceAvailability = {
  available: boolean;
  issue?: MarketplaceCartValidationIssueType;
  price: number;
  product: PublicMarketplaceProduct | ProviderMarketplaceProduct;
  stock: number;
  stockAlertMin?: number;
  storeName: string;
  variation?: ProductVariationMock | null;
  variationName?: string;
};

export type ProviderMarketplaceProduct = Omit<PublicMarketplaceProduct, 'variations'> & {
  categoryOther?: string;
  productType: MarketplaceProductType;
  sku?: string;
  isActive?: boolean;
  taxRate: MarketplaceProductTaxRate;
  isProductSaved: boolean;
  isDraft: boolean;
  categoryId: string;
  images: ProductImageMock[];
  mainImageId: string;
  logistics: ProductPackageLogistics;
  priceBefore?: number;
  cardPriceBefore?: number;
  cardPriceAfter: number;
  transferPriceBefore?: number;
  transferPriceAfter: number;
  packageDimensions: ProductPackageDimensions;
  attributes: ProductAttributeMock[];
  richVariations: ProductVariationGroup[];
  stockAlertMin: number;
  stockStatus: ProductStockStatus;
  stock: number;
  status: MarketplaceProductStatus;
  tags: MarketplaceProductTag[];
  legacyVariations: MarketplaceProductVariations;
  variations: ProductVariationMock[];
  variationCombinations: ProductVariationCombination[];
};

export type ProviderStoreProfile = {
  id: string;
  providerStatus: ProviderVisibleStatus;
  storeStatus: StoreVisibleStatus;
  name: string;
  description: string;
  categories: string[];
  logo: string;
  logoFileName?: string;
  personType: ProviderPersonType;
  documentType: ProviderDocumentType;
  documentNumber: string;
  legalName: string;
  businessName: string;
  financialContact: string;
  billingEmail: string;
  billingPhoneCountryCode: string;
  billingPhoneNumber: string;
  internalPhoneCountryCode: string;
  internalPhoneNumber: string;
  storeTypes: ProviderStoreType[];
  province: string;
  city: string;
  pickupAddress: string;
  addressReference: string;
  schedule: string;
  scheduleDays: ProviderStoreScheduleDay[];
  internalPhone: string;
  internalEmail: string;
  isVerifiedByHupi: boolean;
  isOfficialStore: boolean;
  rating: string;
  providerReviewsCount: number;
  completedOrders: number;
};

export type ProviderShippingSetting = {
  id: MarketplaceShippingMethodId;
  title: string;
  enabled: boolean;
  price: number;
  estimate: string;
  instructions: string;
};

export type ProviderStockNotification = {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export type ProviderNotificationCategory =
  | 'Verificación'
  | 'Tienda'
  | 'Marketplace'
  | 'Productos'
  | 'Stock'
  | 'Pedidos'
  | 'Liquidaciones'
  | 'Servicios'
  | 'Reservas'
  | 'Calificaciones'
  | 'Soporte'
  | 'Documentos'
  | 'Sistema Hupi';
export type ProviderNotificationPriority = 'Normal' | 'Importante' | 'Urgente';
export type ProviderNotification = {
  id: string;
  category: ProviderNotificationCategory;
  type: string;
  title: string;
  message: string;
  priority: ProviderNotificationPriority;
  isRead: boolean;
  createdAt: string;
  actionLabel?: string;
  actionTarget?: string;
  dedupeKey?: string;
  providerId?: string;
  orderId?: string;
  orderNumber?: string;
  caseNumber?: string;
  hupiMessage?: string;
  relatedOrderId?: string;
  relatedCaseId?: string;
  providerOrderId?: string;
};

export type ProviderInfoRequestStatus = 'Pendiente de respuesta' | 'Respondido';
export type ProviderInfoRequest = {
  id: string;
  providerId: string;
  orderId: string;
  orderNumber: string;
  providerOrderId: string;
  caseNumber: string;
  status: ProviderInfoRequestStatus;
  priority: ProviderNotificationPriority;
  hupiMessage: string;
  providerResponse: string;
  requestedAt: string;
  respondedAt: string | null;
};

export type MarketplaceMonthlyPayoutStatus = 'pending_payment' | 'paid';
export type MarketplacePayoutItem = {
  id: string;
  payoutId: string;
  date: string;
  orderNumber: string;
  product: string;
  sku: string;
  quantity: number;
  soldPrice: number;
  productTotal: number;
  hupiCommission: number;
  providerValue: number;
};
export type MarketplaceMonthlyPayout = {
  id: string;
  providerStoreId: string;
  month: string;
  grossSales: number;
  hupiCommission: number;
  providerNet: number;
  adjustments: {
    refunds: number;
    canceledOrders: number;
    administrativeDiscounts: number;
    others: number;
  };
  totalToTransfer: number;
  status: MarketplaceMonthlyPayoutStatus;
  paidAt?: string;
  nextPayoutDate: string;
  transferProofUploadedByAdmin: boolean;
  providerCanSeeAsPaid: boolean;
  settlementNumber: string;
  summaryDocumentAvailable: boolean;
};

export type InternalSupportTicketStatus = TicketVisibleStatus;
export type LegalDataUpdateRequestType =
  | 'Cambio de RUC'
  | 'Cambio de Razón Social'
  | 'Cambio de tipo de persona'
  | 'Actualización de documento'
  | 'Actualización de ubicación registrada'
  | 'Actualización de teléfono de contacto registrado'
  | 'Actualización de correo de facturación'
  | 'Otro dato interno bloqueado';

export type InternalSupportTicket = {
  id: string;
  ticketNumber: string;
  type: LegalDataUpdateRequestType;
  status: InternalSupportTicketStatus;
  createdAt: string;
  description: string;
  relatedSection: 'legal_data_update';
  attachmentName?: string;
};

const baseStore = mockOfficialStores.find((store) => store.id === currentMockMarketplaceStoreId) ?? mockOfficialStores[0];

let providerStoreProfile: ProviderStoreProfile = {
  id: baseStore.id,
  providerStatus: getDerivedProviderStatus(initialAdminGeneratedProviderEvents),
  storeStatus: getDerivedStoreStatus(initialAdminGeneratedProviderEvents),
  name: baseStore.name,
  description: baseStore.description,
  categories: baseStore.categories,
  logo: baseStore.logo,
  logoFileName: undefined,
  personType: 'Persona Jurídica',
  documentType: 'RUC',
  documentNumber: '1799999999001',
  legalName: 'Hupi Bites S.A.S.',
  businessName: baseStore.name,
  financialContact: 'Valentina Paredes',
  billingEmail: 'facturacion@hupibites.ec',
  billingPhoneCountryCode: '+593',
  billingPhoneNumber: '994441122',
  internalPhoneCountryCode: '+593',
  internalPhoneNumber: '994441122',
  storeTypes: ['Local físico', 'Tienda online'],
  province: 'Pichincha',
  city: 'Quito',
  pickupAddress: 'Punto Hupi Bites · Av. República y Eloy Alfaro',
  addressReference: 'Local 12, junto a cafetería pet friendly',
  schedule: 'Lunes a sábado · 09:00 a 18:00',
  scheduleDays: defaultStoreSchedule,
  internalPhone: '+593 99 444 1122',
  internalEmail: 'tienda@hupibites.ec',
  isVerifiedByHupi: getDerivedStoreStatus(initialAdminGeneratedProviderEvents) === 'Habilitada',
  isOfficialStore: getDerivedStoreOfficialState(initialAdminGeneratedProviderEvents) || baseStore.isOfficialStore,
  rating: baseStore.providerRating,
  providerReviewsCount: baseStore.providerReviewsCount,
  completedOrders: baseStore.completedOrders,
};

let providerProducts: ProviderMarketplaceProduct[] = [
  ...mockProducts
    .filter((product) => product.storeId === currentMockMarketplaceStoreId)
    .map((product) => ({
      ...product,
      productType: 'variable' as MarketplaceProductType,
      taxRate: normalizeTaxRate(product.taxRate),
      isProductSaved: true,
      isDraft: false,
      categoryId: getProductCategoryId(product.category),
      priceBefore: 9.99,
      cardPriceBefore: 9.99,
      cardPriceAfter: product.cardPrice,
      transferPriceBefore: 8.99,
      transferPriceAfter: product.transferPrice,
      images: createDefaultImages(product.emoji, product.name),
      mainImageId: `${product.name}-main`,
      packageDimensions: createDefaultPackageDimensions(),
      attributes: createAttributesFromLegacy(product.variations),
      richVariations: [
        createVariationGroup('Sabor', ['Pollo', 'Pavo'], product.transferPrice, 'HUPI-SAB'),
        createVariationGroup('Tamaño de empaque', ['100 g', '250 g', '500 g'], product.transferPrice, 'HUPI-TAM'),
      ],
      legacyVariations: product.variations,
      variations: createProductVariationsFromLegacy(product.variations, product.cardPrice, product.transferPrice, 'HUPI-SNACK'),
      variationCombinations: [],
      logistics: createDefaultLogistics(),
      stockAlertMin: 5,
      stockStatus: 'Disponible' as ProductStockStatus,
      stock: 38,
      status: 'Activo' as MarketplaceProductStatus,
      tags: ['Oferta', 'Recomendado'] as MarketplaceProductTag[],
    })),
  {
    id: 'provider-product-2',
    name: 'Galletas digestivas',
    brand: 'Hupi Bites',
    storeId: currentMockMarketplaceStoreId,
    storeName: providerStoreProfile.name,
    isVerifiedByHupi: providerStoreProfile.isVerifiedByHupi,
    isOfficialStore: providerStoreProfile.isOfficialStore,
    productType: 'variable',
    taxRate: 15 as MarketplaceProductTaxRate,
    isProductSaved: true,
    isDraft: false,
    categoryId: getProductCategoryId('Snacks'),
    category: 'Snacks',
    price: '$6.90',
    priceBefore: 7.9,
    cardPriceBefore: 7.9,
    cardPrice: 6.9,
    cardPriceAfter: 6.9,
    transferPriceBefore: 7.1,
    transferPrice: 6.25,
    transferPriceAfter: 6.25,
    discount: 0,
    rating: '4.8',
    emoji: '🍪',
    color: '#f9f9e2',
    description: 'Galletas suaves para premios diarios con fibra prebiótica.',
    benefits: ['Fibra prebiótica', 'Textura suave', 'Porciones pequeñas'],
    images: createDefaultImages('🍪', 'Galletas digestivas'),
    mainImageId: 'Galletas digestivas-main',
    packageDimensions: createDefaultPackageDimensions(),
    attributes: createAttributesFromLegacy({
      size: ['150 g', '300 g'],
      flavor: ['Avena', 'Manzana'],
    }),
    richVariations: [
      createVariationGroup('Sabor', ['Avena', 'Manzana'], 6.25, 'HUPI-GAL'),
      createVariationGroup('Tamaño de empaque', ['150 g', '300 g'], 6.25, 'HUPI-GAL-TAM'),
    ],
    legacyVariations: {
      size: ['150 g', '300 g'],
      flavor: ['Avena', 'Manzana'],
    },
    variations: [
      createProductVariation('Avena + 150 g', { flavor: 'sabor-avena', size: 'tamaño-de-empaque-150-g' }, 7.9, 6.9, 7.1, 6.25, 10, 'HUPI-AVE-150'),
      createProductVariation('Manzana + 300 g', { flavor: 'sabor-manzana', size: 'tamaño-de-empaque-300-g' }, 8.5, 7.4, 7.8, 6.8, 8, 'HUPI-MAN-300'),
    ],
    variationCombinations: [],
    logistics: createDefaultLogistics(),
    stockAlertMin: 4,
    stockStatus: 'Disponible',
    shipping: 'Entrega con empaque sellado.',
    stock: 18,
    status: 'Pausado',
    tags: ['Nuevo'],
  },
  {
    id: 'provider-product-3',
    name: 'Snack dental menta',
    brand: 'Hupi Bites',
    storeId: currentMockMarketplaceStoreId,
    storeName: providerStoreProfile.name,
    isVerifiedByHupi: providerStoreProfile.isVerifiedByHupi,
    isOfficialStore: providerStoreProfile.isOfficialStore,
    productType: 'simple',
    sku: 'SNACK-DENTAL-MENTA',
    isActive: false,
    taxRate: 0 as MarketplaceProductTaxRate,
    isProductSaved: true,
    isDraft: false,
    categoryId: getProductCategoryId('Higiene y limpieza'),
    category: 'Higiene y limpieza',
    price: '$9.50',
    priceBefore: 10.5,
    cardPriceBefore: 10.5,
    cardPrice: 9.5,
    cardPriceAfter: 9.5,
    transferPriceBefore: 9.5,
    transferPrice: 8.75,
    transferPriceAfter: 8.75,
    discount: 8,
    rating: '4.7',
    emoji: '🪥',
    color: '#f0ebf7',
    description: 'Premio dental para ayudar con aliento fresco y rutina oral.',
    benefits: ['Rutina dental', 'Aliento fresco', 'Mordida moderada'],
    images: createDefaultImages('🪥', 'Snack dental menta'),
    mainImageId: 'Snack dental menta-main',
    packageDimensions: createDefaultPackageDimensions(),
    attributes: [],
    richVariations: [],
    legacyVariations: {
      size: [],
      flavor: [],
    },
    variations: [],
    variationCombinations: [],
    logistics: createDefaultLogistics(),
    stockAlertMin: 3,
    stockStatus: 'Sin stock',
    shipping: 'Producto en revisión antes de publicarse.',
    stock: 0,
    status: 'Sin stock',
    tags: ['Oferta'],
  },
  {
    id: 'provider-product-4',
    name: 'Mix entrenamiento premium',
    brand: 'Hupi Bites',
    storeId: currentMockMarketplaceStoreId,
    storeName: providerStoreProfile.name,
    isVerifiedByHupi: providerStoreProfile.isVerifiedByHupi,
    isOfficialStore: providerStoreProfile.isOfficialStore,
    productType: 'variable',
    taxRate: 15 as MarketplaceProductTaxRate,
    isProductSaved: true,
    isDraft: false,
    categoryId: getProductCategoryId('Snacks'),
    category: 'Snacks',
    price: '$12.90',
    priceBefore: undefined,
    cardPriceBefore: undefined,
    cardPrice: 12.9,
    cardPriceAfter: 12.9,
    transferPriceBefore: undefined,
    transferPrice: 11.9,
    transferPriceAfter: 11.9,
    discount: 0,
    rating: '4.9',
    emoji: '🎒',
    color: '#fff0ec',
    description: 'Mix para entrenamientos con premios pequeños de alta aceptación.',
    benefits: ['Alta aceptación', 'Formato pequeño', 'Ideal para paseos'],
    images: createDefaultImages('🎒', 'Mix entrenamiento premium'),
    mainImageId: 'Mix entrenamiento premium-main',
    packageDimensions: createDefaultPackageDimensions(),
    attributes: [
      {
        id: 'attr-edad',
        kind: 'Personalizado',
        name: 'Edad',
        options: ['Cachorro', 'Adulto', 'Senior'].map((name) => ({ id: `edad-${name.toLowerCase()}`, name })),
      },
    ],
    richVariations: [
      createVariationGroup('Personalizado', ['Cachorro', 'Adulto', 'Senior'], 11.9, 'HUPI-MIX-EDAD'),
    ],
    legacyVariations: {
      size: ['250 g'],
      flavor: ['Pollo y pavo'],
    },
    variations: [
      createProductVariation('Cachorro', { 'attr-edad': 'edad-cachorro' }, undefined, 12.9, undefined, 11.9, 6, 'HUPI-CAC-250'),
      createProductVariation('Adulto', { 'attr-edad': 'edad-adulto' }, undefined, 12.9, undefined, 11.9, 24, 'HUPI-ADU-250'),
      createProductVariation('Senior', { 'attr-edad': 'edad-senior' }, 13.5, 12.4, 12.5, 11.4, 4, 'HUPI-SEN-250'),
    ],
    variationCombinations: [],
    logistics: createDefaultLogistics(),
    stockAlertMin: 5,
    stockStatus: 'Disponible',
    shipping: 'Pendiente de revisión Hupi antes de venderse.',
    stock: 24,
    status: 'En revisión',
    tags: ['Nuevo', 'Recomendado'],
  },
];

export const mockProviderProducts = providerProducts;
export const mockProductImages = providerProducts.flatMap((product) => product.images);
export const mockProductVariations = providerProducts.flatMap((product) => product.variations);

function createDefaultImages(emoji: string, name: string): ProductImageMock[] {
  return [
    { id: `${name}-main`, label: `${name} principal`, emoji, isPrimary: true, order: 1 },
    { id: `${name}-detail`, label: `${name} detalle`, emoji: '📦', isPrimary: false, order: 2 },
  ];
}

function createDefaultPackageDimensions(): ProductPackageDimensions {
  return {
    weight: '250',
    weightUnit: 'g',
    lengthCm: '18',
    widthCm: '12',
    heightCm: '8',
  };
}

function createDefaultLogistics(): ProductPackageLogistics {
  return {
    pickupAddress: providerStoreProfile.pickupAddress,
    shippingMethod: 'Envío estándar / express según checkout',
    ...createDefaultPackageDimensions(),
  };
}

function calculateDiscount(priceBefore: number | undefined, priceCurrent: number) {
  if (!priceBefore || priceBefore <= priceCurrent || priceCurrent <= 0) {
    return 0;
  }

  return Math.round(((priceBefore - priceCurrent) / priceBefore) * 100);
}

function normalizeTaxRate(taxRate: number | undefined): MarketplaceProductTaxRate {
  return taxRate === 15 ? 15 : 0;
}

function createVariationGroup(kind: ProductVariationKind, optionNames: string[], priceCurrent: number, skuPrefix: string): ProductVariationGroup {
  return {
    id: `${kind}-${skuPrefix}`,
    kind,
    name: kind,
    options: optionNames.map((name, index) => ({
      id: `${skuPrefix}-${index + 1}`,
      colorHex: getMockColorHex(name),
      discount: 0,
      name,
      priceBefore: undefined,
      priceCurrent,
      sku: `${skuPrefix}-${index + 1}`,
      stock: index === 0 ? 18 : 12,
      status: 'Activa',
    })),
  };
}

function createCombination(
  combination: string,
  priceCurrent: number,
  stock: number,
  sku: string,
  status: ProductVariationOptionStatus = 'Activa',
): ProductVariationCombination {
  return {
    id: sku,
    combination,
    discount: 0,
    name: combination,
    priceBefore: undefined,
    priceCurrent,
    sku,
    stock,
    status,
  };
}

function getProductCategoryId(categoryName: string) {
  return mockProductCategories.find((category) => category.name === categoryName)?.id
    ?? mockProductCategories.find((category) => category.name === 'Otros')?.id
    ?? 'other';
}

export function getProductCategoryName(categoryId?: string, fallbackName = 'Otros') {
  return mockProductCategories.find((category) => category.id === categoryId)?.name ?? fallbackName;
}

function createAttributeOption(kind: ProductVariationKind, name: string): ProductAttributeOptionMock {
  return {
    id: `${kind.toLowerCase().replace(/\s+/g, '-')}-${name.toLowerCase().replace(/\s+/g, '-')}`,
    colorHex: kind === 'Color' ? getMockColorHex(name) : undefined,
    name,
  };
}

function createAttributesFromLegacy(legacyVariations: MarketplaceProductVariations): ProductAttributeMock[] {
  const attributes: ProductAttributeMock[] = [];

  if (legacyVariations.color?.length) {
    attributes.push({
      id: 'color',
      kind: 'Color',
      name: 'Color',
      options: legacyVariations.color.map((name) => createAttributeOption('Color', name)),
    });
  }

  if (legacyVariations.size?.length) {
    attributes.push({
      id: 'size',
      kind: 'Tamaño de empaque',
      name: 'Tamaño de empaque',
      options: legacyVariations.size.map((name) => createAttributeOption('Tamaño de empaque', name)),
    });
  }

  if (legacyVariations.flavor?.length) {
    attributes.push({
      id: 'flavor',
      kind: 'Sabor',
      name: 'Sabor',
      options: legacyVariations.flavor.map((name) => createAttributeOption('Sabor', name)),
    });
  }

  return attributes;
}

function createProductVariation(
  name: string,
  selectedOptions: Record<string, string>,
  priceBeforeCard: number | undefined,
  priceAfterCard: number,
  priceBeforeTransfer: number | undefined,
  priceAfterTransfer: number,
  stock: number,
  sku: string,
  status: ProductVariationOptionStatus = stock <= 0 ? 'Sin stock' : 'Activa',
): ProductVariationMock {
  return {
    id: sku,
    name,
    selectedOptions,
    priceBeforeCard,
    priceAfterCard,
    priceBeforeTransfer,
    priceAfterTransfer,
    stock,
    stockAlertMin: 2,
    sku,
    status,
    isActive: status === 'Activa',
    isSaved: true,
    packageDimensions: createDefaultPackageDimensions(),
  };
}

function createProductVariationsFromLegacy(
  legacyVariations: MarketplaceProductVariations,
  cardPrice: number,
  transferPrice: number,
  skuPrefix: string,
): ProductVariationMock[] {
  const attributes = createAttributesFromLegacy(legacyVariations);

  if (attributes.length === 0) {
    return [];
  }

  const first = attributes[0];
  const second = attributes[1];

  if (!second) {
    return first.options.map((option, index) => createProductVariation(
      option.name,
      { [first.id]: option.id },
      index === 0 ? Number((cardPrice + 1).toFixed(2)) : undefined,
      cardPrice,
      index === 0 ? Number((transferPrice + 0.75).toFixed(2)) : undefined,
      transferPrice,
      index === 0 ? 18 : 12,
      `${skuPrefix}-${index + 1}`,
    ));
  }

  return first.options.slice(0, 2).flatMap((firstOption, firstIndex) => (
    second.options.slice(0, 2).map((secondOption, secondIndex) => {
      const variationIndex = firstIndex + secondIndex;

      return createProductVariation(
        `${firstOption.name} + ${secondOption.name}`,
        { [first.id]: firstOption.id, [second.id]: secondOption.id },
        variationIndex === 0 ? Number((cardPrice + 1.1).toFixed(2)) : undefined,
        Number((cardPrice + variationIndex * 0.4).toFixed(2)),
        variationIndex === 0 ? Number((transferPrice + 0.9).toFixed(2)) : undefined,
        Number((transferPrice + variationIndex * 0.35).toFixed(2)),
        variationIndex === 0 ? 18 : 12,
        `${skuPrefix}-${firstIndex + 1}${secondIndex + 1}`,
      );
    })
  ));
}

function getMockColorHex(name: string) {
  const colorsByName: Record<string, string> = {
    Amarillo: '#f5c542',
    Azul: '#3478f6',
    Beige: '#d8c7a3',
    Blanco: '#ffffff',
    Coral: '#e45336',
    Menta: '#70c1a1',
    Morado: '#614193',
    Negro: '#333333',
    Rojo: '#d64141',
    Verde: '#32966f',
  };

  return colorsByName[name] ?? '#e45336';
}

let shippingSettings: ProviderShippingSetting[] = [
  {
    id: 'standard',
    title: 'Envío estándar',
    enabled: true,
    price: 2.5,
    estimate: '48',
    instructions: 'Despacho con preparación en el mismo día hábil.',
  },
  {
    id: 'express',
    title: 'Envío express',
    enabled: true,
    price: 4.5,
    estimate: '8',
    instructions: 'Disponible en zonas habilitadas de Quito hasta las 16:00.',
  },
  {
    id: 'pickup',
    title: 'Recogida en punto',
    enabled: false,
    price: 0,
    estimate: '1',
    instructions: `${providerStoreProfile.pickupAddress} · ${providerStoreProfile.schedule}`,
  },
];

let nextInternalLegalTicketSequence = 2048;

export let mockInternalSupportTickets: InternalSupportTicket[] = [
  {
    id: 'internal-ticket-legal-1019',
    ticketNumber: 'TK-1019',
    type: 'Actualización de documento',
    status: 'En revisión',
    createdAt: '2026-07-07T09:30:00.000Z',
    description: 'Solicitud para revisar documento tributario actualizado.',
    relatedSection: 'legal_data_update',
    attachmentName: 'ruc-actualizado.pdf',
  },
];

export let mockProviderStockNotifications: ProviderStockNotification[] = [];

let mockProviderInfoRequests: ProviderInfoRequest[] = [
  {
    id: 'info-request-001',
    providerId: currentMockProviderId,
    orderId: 'order-2049',
    orderNumber: 'HUPI-MK-2049',
    providerOrderId: 'HUPI-MK-2049-A',
    caseNumber: 'INC-2049',
    status: 'Pendiente de respuesta',
    priority: 'Urgente',
    hupiMessage: 'Por favor confirma si el producto enviado corresponde al SKU solicitado y adjunta una evidencia si aplica.',
    providerResponse: '',
    requestedAt: '2026-07-09 · 12:20',
    respondedAt: null,
  },
];

let providerNotifications: ProviderNotification[] = [
  {
    id: 'notif-001',
    category: 'Verificación',
    type: 'provider_application_received',
    title: 'Solicitud recibida',
    message: 'Hupi recibió tu solicitud como proveedor. Revisaremos tu información.',
    priority: 'Normal',
    isRead: true,
    createdAt: '2026-06-18',
    actionLabel: 'Ver estado',
    actionTarget: 'store-profile',
  },
  {
    id: 'notif-002',
    category: 'Documentos',
    type: 'documents_pending',
    title: 'Documentos pendientes',
    message: 'Completa tus documentos para continuar con la verificación.',
    priority: 'Importante',
    isRead: false,
    createdAt: '2026-06-20',
    actionLabel: 'Completar datos',
    actionTarget: 'store-profile',
  },
  {
    id: 'notif-003',
    category: 'Verificación',
    type: 'verification_review',
    title: 'Verificación en revisión',
    message: 'Estamos revisando tu información para habilitar tu perfil.',
    priority: 'Normal',
    isRead: true,
    createdAt: '2026-06-21',
    actionLabel: 'Ver estado',
    actionTarget: 'store-profile',
  },
  {
    id: 'notif-004',
    category: 'Verificación',
    type: 'provider_approved',
    title: 'Proveedor aprobado',
    message: 'Tu perfil fue aprobado y ya puedes operar en Hupi.',
    priority: 'Importante',
    isRead: false,
    createdAt: '2026-06-24',
    actionLabel: 'Ver tienda',
    actionTarget: 'marketplace-store',
  },
  {
    id: 'notif-provider-info-001',
    providerId: currentMockProviderId,
    orderId: 'order-2049',
    orderNumber: 'HUPI-MK-2049',
    caseNumber: 'INC-2049',
    category: 'Soporte',
    type: 'hupi_needs_provider_info',
    title: 'Hupi necesita información',
    message: 'Tenemos una consulta sobre el pedido HUPI-MK-2049.',
    hupiMessage: 'Por favor confirma si el producto enviado corresponde al SKU solicitado y adjunta una evidencia si aplica.',
    priority: 'Urgente',
    isRead: false,
    createdAt: '2026-07-09',
    actionLabel: 'Ver mensaje de Hupi',
    actionTarget: 'provider-order-detail',
    relatedOrderId: 'order-2049',
    relatedCaseId: 'case-2049',
    providerOrderId: 'HUPI-MK-2049-A',
  },
  {
    id: 'notif-chat-002',
    category: 'Soporte',
    type: 'chat_message_support',
    title: 'Nuevo mensaje de Soporte Hupi',
    message: 'Soporte Hupi respondió tu ticket #INC-2050.',
    priority: 'Importante',
    isRead: false,
    createdAt: '2026-07-10',
    actionLabel: 'Abrir chat',
    actionTarget: 'chat-provider-support',
  },
  {
    id: 'notif-005',
    category: 'Verificación',
    type: 'provider_rejected',
    title: 'Solicitud no aprobada',
    message: 'Tu solicitud no fue aprobada. Revisa los comentarios o contacta a soporte.',
    priority: 'Urgente',
    isRead: true,
    createdAt: '2026-06-25',
    actionLabel: 'Contactar soporte',
    actionTarget: 'support',
  },
  {
    id: 'notif-006',
    category: 'Tienda',
    type: 'store_review',
    title: 'Tienda en revisión',
    message: 'Hupi está revisando los datos de tu tienda.',
    priority: 'Normal',
    isRead: true,
    createdAt: '2026-06-26',
    actionLabel: 'Ver tienda',
    actionTarget: 'store-profile',
  },
  {
    id: 'notif-007',
    category: 'Tienda',
    type: 'store_enabled',
    title: 'Tienda habilitada',
    message: 'Tu tienda pasó los filtros de Hupi y ya está habilitada en Marketplace.',
    priority: 'Importante',
    isRead: false,
    createdAt: '2026-06-27',
    actionLabel: 'Ver tienda',
    actionTarget: 'marketplace-store',
  },
  {
    id: 'notif-008',
    category: 'Tienda',
    type: 'store_needs_changes',
    title: 'Tu tienda necesita ajustes',
    message: 'Hupi encontró información que debes corregir para habilitar tu tienda.',
    priority: 'Urgente',
    isRead: false,
    createdAt: '2026-06-28',
    actionLabel: 'Completar datos',
    actionTarget: 'store-profile',
  },
  {
    id: 'notif-009',
    category: 'Tienda',
    type: 'store_disabled',
    title: 'Tienda deshabilitada',
    message: 'Tu tienda fue deshabilitada temporalmente. Revisa el motivo o contacta a soporte.',
    priority: 'Urgente',
    isRead: true,
    createdAt: '2026-06-29',
    actionLabel: 'Contactar soporte',
    actionTarget: 'support',
  },
  {
    id: 'notif-010',
    category: 'Tienda',
    type: 'official_store_assigned',
    title: 'Ahora eres tienda oficial',
    message: 'Hupi asignó el distintivo de Tienda Oficial a tu tienda.',
    priority: 'Importante',
    isRead: false,
    createdAt: '2026-07-01',
    actionLabel: 'Ver tienda',
    actionTarget: 'marketplace-store',
  },
  {
    id: 'notif-011',
    category: 'Tienda',
    type: 'store_verified',
    title: 'Tienda verificada por Hupi',
    message: 'Tu tienda fue verificada correctamente.',
    priority: 'Importante',
    isRead: true,
    createdAt: '2026-07-01',
    actionLabel: 'Ver tienda',
    actionTarget: 'marketplace-store',
  },
  {
    id: 'notif-012',
    category: 'Productos',
    type: 'product_saved',
    title: 'Producto guardado',
    message: 'Tu producto se guardó correctamente.',
    priority: 'Normal',
    isRead: true,
    createdAt: '2026-07-02',
    actionLabel: 'Ver producto',
    actionTarget: 'products',
  },
  {
    id: 'notif-013',
    category: 'Productos',
    type: 'product_approved',
    title: 'Producto aprobado',
    message: 'Tu producto fue aprobado y ya puede mostrarse en Marketplace.',
    priority: 'Importante',
    isRead: false,
    createdAt: '2026-07-02',
    actionLabel: 'Ver producto',
    actionTarget: 'products',
  },
  {
    id: 'notif-014',
    category: 'Productos',
    type: 'product_rejected',
    title: 'Producto no aprobado',
    message: 'Tu producto necesita cambios antes de publicarse.',
    priority: 'Urgente',
    isRead: false,
    createdAt: '2026-07-03',
    actionLabel: 'Ver producto',
    actionTarget: 'products',
  },
  {
    id: 'notif-015',
    category: 'Productos',
    type: 'product_disabled',
    title: 'Producto apagado',
    message: 'Tu producto ya no está visible en Marketplace.',
    priority: 'Normal',
    isRead: true,
    createdAt: '2026-07-03',
    actionLabel: 'Ver producto',
    actionTarget: 'products',
  },
  {
    id: 'notif-016',
    category: 'Productos',
    type: 'product_enabled',
    title: 'Producto activo',
    message: 'Tu producto está visible en Marketplace.',
    priority: 'Normal',
    isRead: true,
    createdAt: '2026-07-04',
    actionLabel: 'Ver producto',
    actionTarget: 'products',
  },
  {
    id: 'notif-017',
    category: 'Productos',
    type: 'variation_saved',
    title: 'Variación guardada',
    message: 'La variación se guardó correctamente.',
    priority: 'Normal',
    isRead: true,
    createdAt: '2026-07-04',
    actionLabel: 'Ver producto',
    actionTarget: 'products',
  },
  {
    id: 'notif-018',
    category: 'Productos',
    type: 'variation_disabled',
    title: 'Variación apagada',
    message: 'Esta variación ya no está disponible para los clientes.',
    priority: 'Normal',
    isRead: false,
    createdAt: '2026-07-05',
    actionLabel: 'Ver producto',
    actionTarget: 'products',
  },
  {
    id: 'notif-019',
    category: 'Productos',
    type: 'variation_enabled',
    title: 'Variación activa',
    message: 'Esta variación ya está disponible para los clientes.',
    priority: 'Normal',
    isRead: true,
    createdAt: '2026-07-05',
    actionLabel: 'Ver producto',
    actionTarget: 'products',
  },
  {
    id: 'notif-020',
    category: 'Stock',
    type: 'stock_low_simple',
    title: 'Stock bajo',
    message: 'Tu producto Snack dental menta llegó al stock mínimo.',
    priority: 'Urgente',
    isRead: false,
    createdAt: '2026-07-06',
    actionLabel: 'Ver producto',
    actionTarget: 'products',
    dedupeKey: 'stock:Snack dental menta',
  },
  {
    id: 'notif-021',
    category: 'Stock',
    type: 'stock_low_variation',
    title: 'Stock bajo en variación',
    message: 'La variación Sabor Pollo de Snack natural de pollo llegó al stock mínimo.',
    priority: 'Urgente',
    isRead: false,
    createdAt: '2026-07-06',
    actionLabel: 'Ver producto',
    actionTarget: 'products',
    dedupeKey: 'stock:Sabor Pollo:Snack natural de pollo',
  },
  {
    id: 'notif-022',
    category: 'Stock',
    type: 'out_of_stock',
    title: 'Producto sin stock',
    message: 'Tu producto se quedó sin stock y no podrá agregarse al carrito.',
    priority: 'Urgente',
    isRead: true,
    createdAt: '2026-07-06',
    actionLabel: 'Ver producto',
    actionTarget: 'products',
  },
  {
    id: 'notif-023',
    category: 'Pedidos',
    type: 'marketplace_order_new',
    title: 'Nuevo pedido Marketplace',
    message: 'Recibiste un nuevo pedido en tu tienda.',
    priority: 'Importante',
    isRead: false,
    createdAt: '2026-07-07',
    actionLabel: 'Ver pedido',
    actionTarget: 'marketplace-orders',
  },
  {
    id: 'notif-024',
    category: 'Pedidos',
    type: 'marketplace_order_paid',
    title: 'Pedido pagado',
    message: 'El pedido fue pagado correctamente y puedes prepararlo.',
    priority: 'Importante',
    isRead: false,
    createdAt: '2026-07-07',
    actionLabel: 'Ver pedido',
    actionTarget: 'marketplace-orders',
  },
  {
    id: 'notif-025',
    category: 'Pedidos',
    type: 'payment_proof_pending',
    title: 'Pago pendiente de validación',
    message: 'El pedido está bloqueado hasta que Hupi valide el comprobante.',
    priority: 'Importante',
    isRead: true,
    createdAt: '2026-07-07',
    actionLabel: 'Ver pedido',
    actionTarget: 'marketplace-orders',
  },
  {
    id: 'notif-026',
    category: 'Pedidos',
    type: 'order_ready_to_prepare',
    title: 'Pedido listo para preparar',
    message: 'Hupi validó el pago del pedido y ya puedes prepararlo.',
    priority: 'Importante',
    isRead: false,
    createdAt: '2026-07-08',
    actionLabel: 'Ver pedido',
    actionTarget: 'marketplace-orders',
  },
  {
    id: 'notif-027',
    category: 'Pedidos',
    type: 'order_canceled',
    title: 'Pedido cancelado',
    message: 'El pedido fue cancelado. Revisa el detalle.',
    priority: 'Importante',
    isRead: true,
    createdAt: '2026-07-08',
    actionLabel: 'Ver pedido',
    actionTarget: 'marketplace-orders',
  },
  {
    id: 'notif-028',
    category: 'Pedidos',
    type: 'order_delivered',
    title: 'Pedido entregado',
    message: 'El pedido fue marcado como entregado.',
    priority: 'Normal',
    isRead: true,
    createdAt: '2026-07-08',
    actionLabel: 'Ver pedido',
    actionTarget: 'marketplace-orders',
  },
  {
    id: 'notif-029',
    category: 'Calificaciones',
    type: 'marketplace_order_review',
    title: 'Nueva calificación',
    message: 'Recibiste una nueva calificación por un pedido Marketplace.',
    priority: 'Normal',
    isRead: false,
    createdAt: '2026-07-08',
    actionLabel: 'Ver detalle',
    actionTarget: 'mock-detail',
  },
  {
    id: 'notif-030',
    category: 'Liquidaciones',
    type: 'payout_pending_payment',
    title: 'Liquidación pendiente de pago',
    message: 'Tu liquidación de Julio 2026 está pendiente de pago.',
    priority: 'Importante',
    isRead: false,
    createdAt: '2026-07-08',
    actionLabel: 'Ver liquidación',
    actionTarget: 'marketplace-finance',
  },
  {
    id: 'notif-031',
    category: 'Liquidaciones',
    type: 'payout_paid',
    title: 'Liquidación pagada',
    message: 'Hupi marcó como pagada tu liquidación de Junio 2026.',
    priority: 'Importante',
    isRead: false,
    createdAt: '2026-07-03',
    actionLabel: 'Ver liquidación',
    actionTarget: 'marketplace-finance',
  },
  {
    id: 'notif-032',
    category: 'Liquidaciones',
    type: 'payout_summary_available',
    title: 'Resumen disponible',
    message: 'Ya puedes descargar el resumen de liquidación de Junio 2026.',
    priority: 'Normal',
    isRead: false,
    createdAt: '2026-07-03',
    actionLabel: 'Ver liquidación',
    actionTarget: 'marketplace-finance',
  },
  {
    id: 'notif-033',
    category: 'Reservas',
    type: 'service_booking_new',
    title: 'Nueva reserva',
    message: 'Recibiste una nueva solicitud de servicio.',
    priority: 'Importante',
    isRead: false,
    createdAt: '2026-07-09',
    actionLabel: 'Ver detalle',
    actionTarget: 'mock-detail',
  },
  {
    id: 'notif-034',
    category: 'Reservas',
    type: 'booking_confirmed',
    title: 'Reserva confirmada',
    message: 'El cliente confirmó una reserva contigo.',
    priority: 'Importante',
    isRead: false,
    createdAt: '2026-07-09',
    actionLabel: 'Ver detalle',
    actionTarget: 'mock-detail',
  },
  {
    id: 'notif-035',
    category: 'Reservas',
    type: 'booking_canceled',
    title: 'Reserva cancelada',
    message: 'El cliente canceló una reserva.',
    priority: 'Importante',
    isRead: true,
    createdAt: '2026-07-08',
    actionLabel: 'Ver detalle',
    actionTarget: 'mock-detail',
  },
  {
    id: 'notif-036',
    category: 'Servicios',
    type: 'service_upcoming',
    title: 'Servicio próximo',
    message: 'Tienes un servicio programado próximamente.',
    priority: 'Importante',
    isRead: false,
    createdAt: '2026-07-09',
    actionLabel: 'Ver detalle',
    actionTarget: 'mock-detail',
  },
  {
    id: 'notif-037',
    category: 'Servicios',
    type: 'client_message',
    title: 'Nuevo mensaje',
    message: 'Tienes un nuevo mensaje de un cliente.',
    priority: 'Importante',
    isRead: false,
    createdAt: '2026-07-09',
    actionLabel: 'Contactar soporte',
    actionTarget: 'support',
  },
  {
    id: 'notif-038',
    category: 'Servicios',
    type: 'service_finished',
    title: 'Servicio finalizado',
    message: 'El servicio fue marcado como finalizado.',
    priority: 'Normal',
    isRead: true,
    createdAt: '2026-07-08',
    actionLabel: 'Ver detalle',
    actionTarget: 'mock-detail',
  },
  {
    id: 'notif-039',
    category: 'Calificaciones',
    type: 'service_review',
    title: 'Nueva calificación',
    message: 'Recibiste una nueva calificación por tu servicio.',
    priority: 'Normal',
    isRead: false,
    createdAt: '2026-07-09',
    actionLabel: 'Ver detalle',
    actionTarget: 'mock-detail',
  },
  {
    id: 'notif-040',
    category: 'Soporte',
    type: 'ticket_created',
    title: 'Ticket creado',
    message: 'Hupi recibió tu solicitud de actualización de datos.',
    priority: 'Normal',
    isRead: true,
    createdAt: '2026-07-05',
    actionLabel: 'Contactar soporte',
    actionTarget: 'support',
  },
  {
    id: 'notif-041',
    category: 'Soporte',
    type: 'ticket_review',
    title: 'Ticket en revisión',
    message: 'Estamos revisando tu solicitud.',
    priority: 'Normal',
    isRead: false,
    createdAt: '2026-07-06',
    actionLabel: 'Contactar soporte',
    actionTarget: 'support',
  },
  {
    id: 'notif-042',
    category: 'Soporte',
    type: 'ticket_resolved',
    title: 'Ticket resuelto',
    message: 'Hupi actualizó la información solicitada.',
    priority: 'Importante',
    isRead: false,
    createdAt: '2026-07-07',
    actionLabel: 'Ver tienda',
    actionTarget: 'store-profile',
  },
  {
    id: 'notif-043',
    category: 'Soporte',
    type: 'ticket_rejected',
    title: 'Solicitud no aprobada',
    message: 'No pudimos aprobar tu solicitud. Revisa el comentario de soporte.',
    priority: 'Importante',
    isRead: true,
    createdAt: '2026-07-07',
    actionLabel: 'Contactar soporte',
    actionTarget: 'support',
  },
  {
    id: 'notif-044',
    category: 'Documentos',
    type: 'legal_data_incomplete',
    title: 'Datos legales incompletos',
    message: 'Completa tus datos legales para continuar operando.',
    priority: 'Urgente',
    isRead: false,
    createdAt: '2026-07-08',
    actionLabel: 'Completar datos',
    actionTarget: 'store-profile',
  },
  {
    id: 'notif-045',
    category: 'Documentos',
    type: 'document_expiring',
    title: 'Documento por vencer',
    message: 'Uno de tus documentos está próximo a vencer.',
    priority: 'Importante',
    isRead: false,
    createdAt: '2026-07-09',
    actionLabel: 'Completar datos',
    actionTarget: 'store-profile',
  },
  {
    id: 'notif-046',
    category: 'Documentos',
    type: 'document_expired',
    title: 'Documento vencido',
    message: 'Actualiza tu documento para evitar restricciones.',
    priority: 'Urgente',
    isRead: false,
    createdAt: '2026-07-09',
    actionLabel: 'Completar datos',
    actionTarget: 'store-profile',
  },
  {
    id: 'notif-047',
    category: 'Sistema Hupi',
    type: 'policy_updated',
    title: 'Política actualizada',
    message: 'Hupi actualizó una política importante para proveedores.',
    priority: 'Importante',
    isRead: false,
    createdAt: '2026-07-09',
    actionLabel: 'Ver detalle',
    actionTarget: 'mock-detail',
  },
  {
    id: 'notif-048',
    category: 'Sistema Hupi',
    type: 'new_terms',
    title: 'Nuevos términos disponibles',
    message: 'Revisa los nuevos términos y condiciones de Hupi.',
    priority: 'Importante',
    isRead: false,
    createdAt: '2026-07-09',
    actionLabel: 'Ver detalle',
    actionTarget: 'mock-detail',
  },
];

let providerAdminGeneratedEvents: AdminGeneratedProviderEvent[] = [...initialAdminGeneratedProviderEvents];
let hiddenAdminProviderEventIds = new Set<string>();

function convertAdminEventToProviderNotification(event: AdminGeneratedProviderEvent): ProviderNotification {
  return {
    id: event.id,
    category: mapAdminCategoryToProviderNotificationCategory(event.category),
    type: event.type,
    title: event.title,
    message: event.message,
    priority: mapAdminPriorityToProviderNotificationPriority(event.priority),
    isRead: event.isRead,
    createdAt: event.createdAt,
    actionLabel: event.actionLabel,
    actionTarget: event.actionTarget,
    dedupeKey: `admin:${event.id}`,
  };
}

function mapAdminCategoryToProviderNotificationCategory(category: AdminGeneratedProviderEvent['category']): ProviderNotificationCategory {
  if (category === 'Proveedor') {
    return 'Verificación';
  }

  if (category === 'Producto') {
    return 'Productos';
  }

  if (category === 'Ticket') {
    return 'Soporte';
  }

  if (category === 'Liquidación') {
    return 'Liquidaciones';
  }

  return 'Tienda';
}

function mapAdminPriorityToProviderNotificationPriority(priority: AdminGeneratedProviderEvent['priority']): ProviderNotificationPriority {
  if (priority === 'urgent') {
    return 'Urgente';
  }

  if (priority === 'important') {
    return 'Importante';
  }

  return 'Normal';
}

function getOrderedAdminEvents(events: AdminGeneratedProviderEvent[]) {
  return [...events].sort((a, b) => {
    const dateOrder = a.createdAt.localeCompare(b.createdAt);
    return dateOrder === 0 ? a.id.localeCompare(b.id) : dateOrder;
  });
}

function getDerivedProviderStatus(events: AdminGeneratedProviderEvent[]): ProviderVisibleStatus {
  return getOrderedAdminEvents(events).reduce<ProviderVisibleStatus>((status, event) => {
    if (event.type === 'provider_approved') {
      return 'Aprobado';
    }

    if (event.type === 'provider_rejected') {
      return 'Rechazado';
    }

    return status;
  }, 'Pendiente');
}

function getDerivedStoreStatus(events: AdminGeneratedProviderEvent[]): StoreVisibleStatus {
  return getOrderedAdminEvents(events).reduce<StoreVisibleStatus>((status, event) => {
    if (event.type === 'store_approved') {
      return 'Habilitada';
    }

    if (event.type === 'store_changes_requested') {
      return 'Necesita cambios';
    }

    if (event.type === 'store_disabled') {
      return 'Deshabilitada';
    }

    return status;
  }, 'En revisión');
}

function getDerivedStoreOfficialState(events: AdminGeneratedProviderEvent[]) {
  return getOrderedAdminEvents(events).some((event) => event.type === 'store_official_enabled');
}

function getDerivedProductStatus(events: AdminGeneratedProviderEvent[]): ProductVisibleStatus {
  return getOrderedAdminEvents(events).reduce<ProductVisibleStatus>((status, event) => {
    if (event.type === 'product_approved') {
      return 'Aprobado';
    }

    if (event.type === 'product_rejected') {
      return 'Rechazado';
    }

    return status;
  }, 'Pendiente de revisión');
}

function getDerivedTicketStatus(events: AdminGeneratedProviderEvent[]): TicketVisibleStatus {
  return getOrderedAdminEvents(events).reduce<TicketVisibleStatus>((status, event) => {
    if (event.type === 'ticket_resolved') {
      return 'Resuelto';
    }

    if (event.type === 'ticket_rejected') {
      return 'Cerrado';
    }

    return status;
  }, 'Abierto');
}

export const mockMarketplaceMonthlyPayouts: MarketplaceMonthlyPayout[] = [
  {
    id: 'payout-2026-06-hupi-bites',
    providerStoreId: currentMockMarketplaceStoreId,
    month: 'Junio 2026',
    grossSales: 1000,
    hupiCommission: 300,
    providerNet: 700,
    adjustments: {
      refunds: 0,
      canceledOrders: 0,
      administrativeDiscounts: 0,
      others: 0,
    },
    totalToTransfer: 700,
    status: 'paid',
    paidAt: '2026-07-03',
    nextPayoutDate: 'hasta el 3 de julio de 2026',
    transferProofUploadedByAdmin: true,
    providerCanSeeAsPaid: true,
    settlementNumber: 'LIQ-HUPI-2026-06-001',
    summaryDocumentAvailable: true,
  },
  {
    id: 'payout-2026-07-hupi-bites',
    providerStoreId: currentMockMarketplaceStoreId,
    month: 'Julio 2026',
    grossSales: 486.4,
    hupiCommission: 145.92,
    providerNet: 340.48,
    adjustments: {
      refunds: 18.5,
      canceledOrders: 24,
      administrativeDiscounts: 0,
      others: 0,
    },
    totalToTransfer: 297.98,
    status: 'pending_payment',
    nextPayoutDate: 'hasta el 5 de agosto de 2026',
    transferProofUploadedByAdmin: false,
    providerCanSeeAsPaid: false,
    settlementNumber: 'LIQ-HUPI-2026-07-001',
    summaryDocumentAvailable: false,
  },
  {
    id: 'payout-2026-08-hupi-bites',
    providerStoreId: currentMockMarketplaceStoreId,
    month: 'Agosto 2026',
    grossSales: 0,
    hupiCommission: 0,
    providerNet: 0,
    adjustments: {
      refunds: 0,
      canceledOrders: 0,
      administrativeDiscounts: 0,
      others: 0,
    },
    totalToTransfer: 0,
    status: 'pending_payment',
    nextPayoutDate: 'hasta el 3 de septiembre de 2026',
    transferProofUploadedByAdmin: false,
    providerCanSeeAsPaid: false,
    settlementNumber: 'LIQ-HUPI-2026-08-001',
    summaryDocumentAvailable: false,
  },
];

export const mockMarketplacePayoutItems: MarketplacePayoutItem[] = [
  {
    id: 'payout-item-001',
    payoutId: 'payout-2026-06-hupi-bites',
    date: '2026-06-04',
    orderNumber: 'HUPI-MK-1988',
    product: 'Snack natural de pollo',
    sku: 'SNACK-POLLO-100G',
    quantity: 25,
    soldPrice: 8.9,
    productTotal: 222.5,
    hupiCommission: 66.75,
    providerValue: 155.75,
  },
  {
    id: 'payout-item-002',
    payoutId: 'payout-2026-06-hupi-bites',
    date: '2026-06-12',
    orderNumber: 'HUPI-MK-2012',
    product: 'Galletas digestivas',
    sku: 'HUPI-AVE-150',
    quantity: 44,
    soldPrice: 6.9,
    productTotal: 303.6,
    hupiCommission: 91.08,
    providerValue: 212.52,
  },
  {
    id: 'payout-item-003',
    payoutId: 'payout-2026-06-hupi-bites',
    date: '2026-06-21',
    orderNumber: 'HUPI-MK-2031',
    product: 'Mix entrenamiento premium',
    sku: 'HUPI-ADU-250',
    quantity: 35,
    soldPrice: 12.9,
    productTotal: 451.5,
    hupiCommission: 135.45,
    providerValue: 316.05,
  },
  {
    id: 'payout-item-004',
    payoutId: 'payout-2026-06-hupi-bites',
    date: '2026-06-28',
    orderNumber: 'HUPI-MK-2039',
    product: 'Snack dental menta',
    sku: 'SNACK-DENTAL-MENTA',
    quantity: 2,
    soldPrice: 11.2,
    productTotal: 22.4,
    hupiCommission: 6.72,
    providerValue: 15.68,
  },
  {
    id: 'payout-item-005',
    payoutId: 'payout-2026-07-hupi-bites',
    date: '2026-07-07',
    orderNumber: 'HUPI-MK-2048',
    product: 'Snack natural de pollo',
    sku: 'SNACK-POLLO-100G',
    quantity: 18,
    soldPrice: 8.9,
    productTotal: 160.2,
    hupiCommission: 48.06,
    providerValue: 112.14,
  },
  {
    id: 'payout-item-006',
    payoutId: 'payout-2026-07-hupi-bites',
    date: '2026-07-12',
    orderNumber: 'HUPI-MK-2058',
    product: 'Galletas digestivas',
    sku: 'HUPI-MAN-300',
    quantity: 24,
    soldPrice: 7.4,
    productTotal: 177.6,
    hupiCommission: 53.28,
    providerValue: 124.32,
  },
];

export function getProviderNotifications() {
  const local = [
    ...providerAdminGeneratedEvents
      .filter((event) => !hiddenAdminProviderEventIds.has(event.id))
      .map(convertAdminEventToProviderNotification),
    ...providerNotifications,
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return getRemoteNotifications(local) ?? local;
}

export function getProviderUnreadNotificationCount() {
  return getProviderNotifications().filter((notification) => !notification.isRead).length;
}

export function getProviderInfoRequestForOrder(orderNumberOrProviderOrderId?: string) {
  return mockProviderInfoRequests.find((request) => (
    request.orderNumber === orderNumberOrProviderOrderId || request.providerOrderId === orderNumberOrProviderOrderId
  )) ?? null;
}

export function respondToProviderInfoRequest(requestId: string, providerResponse: string) {
  let updatedRequest = mockProviderInfoRequests.find((request) => request.id === requestId) ?? null;

  mockProviderInfoRequests = mockProviderInfoRequests.map((request) => {
    if (request.id !== requestId) {
      return request;
    }

    updatedRequest = {
      ...request,
      providerResponse,
      respondedAt: new Date().toISOString().slice(0, 10),
      status: 'Respondido',
    };
    return updatedRequest;
  });

  return updatedRequest;
}

export function markProviderNotificationAsRead(notificationId: string) {
  providerNotifications = providerNotifications.map((notification) => (
    notification.id === notificationId ? { ...notification, isRead: true } : notification
  ));
  providerAdminGeneratedEvents = providerAdminGeneratedEvents.map((event) => (
    event.id === notificationId ? { ...event, isRead: true } : event
  ));

  syncNotificationRead(notificationId);
  return getProviderNotifications();
}

export function markAllProviderNotificationsAsRead() {
  getProviderNotifications()
    .filter((notification) => !notification.isRead)
    .forEach((notification) => syncNotificationRead(notification.id));
  providerNotifications = providerNotifications.map((notification) => ({ ...notification, isRead: true }));
  providerAdminGeneratedEvents = providerAdminGeneratedEvents.map((event) => ({ ...event, isRead: true }));
  return getProviderNotifications();
}

export function clearReadProviderNotifications() {
  getProviderNotifications()
    .filter((notification) => notification.isRead)
    .forEach((notification) => syncNotificationDeleted(notification.id));
  providerNotifications = providerNotifications.filter((notification) => !notification.isRead);
  hiddenAdminProviderEventIds = new Set([
    ...hiddenAdminProviderEventIds,
    ...providerAdminGeneratedEvents.filter((event) => event.isRead).map((event) => event.id),
  ]);
  return getProviderNotifications();
}

export function removeProviderNotification(notificationId: string) {
  providerNotifications = providerNotifications.filter((notification) => notification.id !== notificationId);
  if (providerAdminGeneratedEvents.some((event) => event.id === notificationId)) {
    hiddenAdminProviderEventIds = new Set([...hiddenAdminProviderEventIds, notificationId]);
  }

  syncNotificationDeleted(notificationId);
  return getProviderNotifications();
}

export function addProviderNotification(notification: Omit<ProviderNotification, 'createdAt' | 'id' | 'isRead'> & {
  createdAt?: string;
  id?: string;
  isRead?: boolean;
}) {
  if (notification.dedupeKey) {
    const existingNotification = providerNotifications.find((item) => item.dedupeKey === notification.dedupeKey);

    if (existingNotification) {
      return existingNotification;
    }
  }

  const nextNotification: ProviderNotification = {
    ...notification,
    id: notification.id ?? `notif-${Date.now()}-${providerNotifications.length + 1}`,
    isRead: notification.isRead ?? false,
    createdAt: notification.createdAt ?? new Date().toISOString().slice(0, 10),
  };

  providerNotifications = [nextNotification, ...providerNotifications];
  return nextNotification;
}

export function addProviderStockNotification(message: string) {
  const notification: ProviderStockNotification = {
    id: `provider-stock-${Date.now()}-${mockProviderStockNotifications.length + 1}`,
    message,
    createdAt: new Date().toISOString(),
    read: false,
  };

  mockProviderStockNotifications = [notification, ...mockProviderStockNotifications];
  addProviderNotification({
    category: 'Stock',
    type: message.includes('variación') ? 'stock_low_variation' : 'stock_low_simple',
    title: message.includes('variación') ? 'Stock bajo en variación' : 'Stock bajo',
    message,
    priority: 'Urgente',
    actionLabel: 'Ver producto',
    actionTarget: 'products',
    dedupeKey: `stock:${message}`,
  });
  return notification;
}

export function getProviderStoreProfile() {
  providerStoreProfile = {
    ...providerStoreProfile,
    providerStatus: getDerivedProviderStatus(providerAdminGeneratedEvents),
    storeStatus: getDerivedStoreStatus(providerAdminGeneratedEvents),
    isVerifiedByHupi: getDerivedStoreStatus(providerAdminGeneratedEvents) === 'Habilitada',
    isOfficialStore: getDerivedStoreOfficialState(providerAdminGeneratedEvents) || providerStoreProfile.isOfficialStore,
  };
  providerProducts = providerProducts.map((product) => ({
    ...product,
    isOfficialStore: providerStoreProfile.isOfficialStore,
    isVerifiedByHupi: providerStoreProfile.isVerifiedByHupi,
  }));

  return providerStoreProfile;
}

export function getProviderAdminMarketplaceState() {
  return {
    providerStatus: getDerivedProviderStatus(providerAdminGeneratedEvents),
    storeStatus: getDerivedStoreStatus(providerAdminGeneratedEvents),
    officialStore: getDerivedStoreOfficialState(providerAdminGeneratedEvents),
    productStatus: getDerivedProductStatus(providerAdminGeneratedEvents),
    ticketStatus: getDerivedTicketStatus(providerAdminGeneratedEvents),
    payoutStatus: providerAdminGeneratedEvents.some((event) => event.type === 'payout_paid') ? 'Pagado' as const : 'Pendiente de pago' as const,
    adminEvents: [...providerAdminGeneratedEvents],
  };
}

export function saveProviderStoreProfile(updates: Partial<ProviderStoreProfile>) {
  providerStoreProfile = {
    ...providerStoreProfile,
    ...updates,
    isOfficialStore: providerStoreProfile.isOfficialStore,
    isVerifiedByHupi: providerStoreProfile.isVerifiedByHupi,
    providerStatus: providerStoreProfile.providerStatus,
    storeStatus: providerStoreProfile.storeStatus,
  };

  providerProducts = providerProducts.map((product) => ({
    ...product,
    storeName: providerStoreProfile.name,
    isOfficialStore: providerStoreProfile.isOfficialStore,
    isVerifiedByHupi: providerStoreProfile.isVerifiedByHupi,
  }));

  syncStoreProfile({
    name: providerStoreProfile.name,
    description: providerStoreProfile.description,
    categories: providerStoreProfile.categories,
    pickupAddress: providerStoreProfile.pickupAddress,
    addressReference: providerStoreProfile.addressReference,
    billingEmail: providerStoreProfile.billingEmail,
    billingPhone: providerStoreProfile.billingPhoneNumber,
    internalEmail: providerStoreProfile.internalEmail,
    internalPhone: providerStoreProfile.internalPhone,
  });

  return providerStoreProfile;
}

export function getProviderProducts() {
  return providerProducts;
}

export function getProviderProduct(productId?: string) {
  return providerProducts.find((product) => product.id === productId) ?? null;
}

export function saveProviderProduct(product: ProviderMarketplaceProduct) {
  const categoryName = getProductCategoryName(product.categoryId, product.category);
  const variableStock = product.variations.reduce((total, variation) => (
    isVariationAvailable(variation) ? total + variation.stock : total
  ), 0);
  const simpleStock = Number(product.stock || 0);
  const stock = product.productType === 'variable' ? variableStock : simpleStock;
  const cardPrice = product.productType === 'variable'
    ? getVariableBasePrice(product.variations, 'card')
    : Number(product.cardPriceAfter || product.cardPrice || 0);
  const transferPrice = product.productType === 'variable'
    ? getVariableBasePrice(product.variations, 'transfer')
    : Number(product.transferPriceAfter || product.transferPrice || 0);
  const priceBefore = product.productType === 'variable'
    ? getVariableBaseBeforePrice(product.variations, 'card')
    : product.cardPriceBefore;

  const normalizedStatus: MarketplaceProductStatus = product.productType === 'variable'
    ? variableStock > 0 ? 'Activo' : 'Pausado'
    : product.isActive === false || product.status === 'Pausado'
    ? 'Pausado'
    : stock <= 0
      ? 'Sin stock'
      : product.status;
  const normalizedProduct: ProviderMarketplaceProduct = {
    ...product,
    storeId: currentMockMarketplaceStoreId,
    storeName: providerStoreProfile.name,
    isOfficialStore: providerStoreProfile.isOfficialStore,
    isVerifiedByHupi: providerStoreProfile.isVerifiedByHupi,
    category: categoryName,
    categoryId: product.categoryId || getProductCategoryId(categoryName),
    cardPrice,
    cardPriceAfter: cardPrice,
    discount: getProductDiscount(product),
    mainImageId: product.mainImageId || product.images[0]?.id || '',
    price: `$${cardPrice.toFixed(2)}`,
    priceBefore,
    sku: product.productType === 'simple' ? product.sku?.trim() : undefined,
    stock,
    status: normalizedStatus,
    stockStatus: normalizedStatus === 'Pausado'
      ? 'Pausado'
      : stock <= 0 ? 'Sin stock' : product.stockStatus,
    isActive: product.productType === 'simple' ? product.isActive ?? product.status === 'Activo' : undefined,
    taxRate: normalizeTaxRate(product.taxRate),
    isProductSaved: product.isProductSaved,
    isDraft: product.isDraft,
    transferPrice,
    transferPriceAfter: transferPrice,
  };
  if (normalizedProduct.productType === 'variable') {
    delete normalizedProduct.sku;
  }
  const exists = providerProducts.some((item) => item.id === normalizedProduct.id);

  providerProducts = exists
    ? providerProducts.map((item) => (item.id === normalizedProduct.id ? normalizedProduct : item))
    : [normalizedProduct, ...providerProducts];

  syncStoreProduct(
    {
      code: normalizedProduct.id,
      name: normalizedProduct.name,
      description: normalizedProduct.description,
      brand: normalizedProduct.brand,
      sku: normalizedProduct.sku,
      categoryId: normalizedProduct.categoryId,
      cardPriceBefore: normalizedProduct.priceBefore,
      cardPriceAfter: cardPrice,
      transferPriceAfter: transferPrice,
      stock,
      stockAlertMin: normalizedProduct.stockAlertMin,
      tags: normalizedProduct.tags,
      isActive: normalizedStatus === 'Activo',
    },
    exists,
  );

  return normalizedProduct;
}

export function toggleProviderProductStatus(productId: string) {
  const product = providerProducts.find((item) => item.id === productId);

  if (!product) {
    return null;
  }

  const nextStatus: MarketplaceProductStatus = product.status === 'Activo' ? 'Pausado' : 'Activo';

  providerProducts = providerProducts.map((item) => (
    item.id === productId
      ? { ...item, status: item.stock <= 0 ? 'Sin stock' : nextStatus }
      : item
  ));

  return getProviderProduct(productId);
}

export function getProviderShippingSettings() {
  return shippingSettings;
}

export function updateProviderShippingSetting(methodId: MarketplaceShippingMethodId, updates: Partial<ProviderShippingSetting>) {
  shippingSettings = shippingSettings.map((method) => (
    method.id === methodId ? { ...method, ...updates } : method
  ));

  // Los identificadores de envío del prototipo ya coinciden con el enum del backend.
  syncStoreShipping(shippingSettings.map((method) => ({
    method: method.id,
    enabled: method.enabled,
    price: Number(method.price ?? 0),
    estimate: method.estimate,
    instructions: method.instructions,
  })));

  return shippingSettings.find((method) => method.id === methodId) ?? shippingSettings[0];
}

export function createMockLegalDataUpdateTicket({
  attachmentName,
  description,
  type,
}: {
  attachmentName?: string;
  description: string;
  type: LegalDataUpdateRequestType;
}) {
  const ticketNumber = `TK-${nextInternalLegalTicketSequence}`;
  nextInternalLegalTicketSequence += 1;

  const ticket: InternalSupportTicket = {
    id: `internal-ticket-${ticketNumber.toLowerCase()}`,
    ticketNumber,
    type,
    status: 'En revisión',
    createdAt: new Date().toISOString(),
    description,
    relatedSection: 'legal_data_update',
    attachmentName,
  };

  mockInternalSupportTickets = [ticket, ...mockInternalSupportTickets];
  addProviderNotification({
    category: 'Soporte',
    type: 'ticket_created',
    title: 'Ticket creado',
    message: 'Hupi recibió tu solicitud de actualización de datos.',
    priority: 'Normal',
    actionLabel: 'Contactar soporte',
    actionTarget: 'support',
    dedupeKey: `ticket:${ticket.ticketNumber}`,
  });

  return ticket;
}

export function getMockInternalSupportTickets() {
  return mockInternalSupportTickets;
}

export function getEnabledShippingMethodIdsForStore(storeId: string) {
  if (storeId === currentMockMarketplaceStoreId) {
    return shippingSettings.filter((method) => method.enabled).map((method) => method.id);
  }

  return (mockOfficialStores.find((store) => store.id === storeId)?.availableShippingMethods ?? ['standard']) as MarketplaceShippingMethodId[];
}

export function getPublicShippingMethodsForStoreIds(storeIds: string[]) {
  const methodSets = storeIds.map((storeId) => getEnabledShippingMethodIdsForStore(storeId));
  const enabledIds = methodSets.length > 0
    ? methodSets.reduce<MarketplaceShippingMethodId[]>((available, currentSet) => (
      available.filter((methodId) => currentSet.includes(methodId))
    ), [...methodSets[0]])
    : ['standard' as MarketplaceShippingMethodId];

  return enabledIds.map((methodId) => {
    const providerMethod = shippingSettings.find((method) => method.id === methodId);
    const baseMethod = mockShippingMethods.find((method) => method.id === methodId) ?? mockShippingMethods[0];

    if (storeIds.includes(currentMockMarketplaceStoreId) && providerMethod) {
      return {
        id: providerMethod.id,
        title: providerMethod.title,
        estimate: providerMethod.estimate,
        price: providerMethod.price,
      };
    }

    return baseMethod;
  });
}

export function getPublicMarketplaceStores() {
  return mockOfficialStores
    .filter((store) => (
      store.id !== currentMockMarketplaceStoreId
      || isMarketplaceStoreEnabled(providerStoreProfile)
    ))
    .map((store) => {
    if (store.id !== currentMockMarketplaceStoreId) {
      return store;
    }

    return {
      ...store,
      name: providerStoreProfile.name,
      logo: providerStoreProfile.logo,
      description: providerStoreProfile.description,
      categories: providerStoreProfile.categories,
      category: providerStoreProfile.categories[0] ?? store.category,
      isVerifiedByHupi: providerStoreProfile.isVerifiedByHupi,
      isOfficialStore: providerStoreProfile.isOfficialStore,
      rating: providerStoreProfile.rating,
      providerRating: providerStoreProfile.rating,
      providerReviewsCount: providerStoreProfile.providerReviewsCount,
      completedOrders: providerStoreProfile.completedOrders,
      productCount: providerProducts.filter((product) => (
        isMarketplaceProductPublishable(
          product,
          isMarketplaceStoreEnabled(providerStoreProfile),
        )
      )).length,
      availableShippingMethods: getEnabledShippingMethodIdsForStore(store.id),
    };
  });
}

export function getPublicMarketplaceProducts() {
  const currentStoreProducts = providerProducts;
  const otherProducts = mockProducts.filter((product) => product.storeId !== currentMockMarketplaceStoreId);

  const local = [...currentStoreProducts, ...otherProducts].filter((product) => {
    const store = product.storeId === currentMockMarketplaceStoreId
      ? providerStoreProfile
      : mockOfficialStores.find((item) => item.id === product.storeId);

    return isMarketplaceProductPublishable(
      product,
      isMarketplaceStoreEnabled(store),
    );
  });

  // El backend ya devuelve solo catálogo publicable, así que no se refiltra.
  return getRemoteProducts([...currentStoreProducts, ...otherProducts]) ?? local;
}

export function getPublicMarketplaceProduct(productId?: string) {
  return getPublicMarketplaceProducts().find((product) => product.id === productId)
    ?? getPublicMarketplaceProducts()[0];
}

export function getMarketplaceProductForCart(productId?: string) {
  return providerProducts.find((product) => product.id === productId)
    ?? mockProducts.find((product) => product.id === productId)
    ?? getPublicMarketplaceProducts()[0];
}

export function getMarketplaceItemAvailability(
  item: MarketplaceCartLikeItem,
  selectedOptionIds: Record<string, string> = {},
): MarketplaceAvailability {
  const product = getMarketplaceProductForCart(item.productId);
  const productName = product.name;
  const storeEnabled = product.storeId === currentMockMarketplaceStoreId
    ? isMarketplaceStoreEnabled(providerStoreProfile)
    : isMarketplaceStoreEnabled(
      mockOfficialStores.find((store) => store.id === product.storeId),
    );

  if ('productType' in product) {
    if (product.productType === 'simple') {
      const display = getProductDisplayPrice(product);
      const available = storeEnabled && isSimpleProductAvailable(product);

      return {
        available,
        issue: available ? undefined : 'product_unavailable',
        price: display.priceCurrent,
        product,
        stock: available ? product.stock : 0,
        stockAlertMin: product.stockAlertMin,
        storeName: product.storeName,
        variation: null,
      };
    }

    const selectedVariation = item.variationId
      ? product.variations.find((variation) => variation.id === item.variationId || variation.sku === item.variationId) ?? null
      : findMatchingProductVariation(product.variations, selectedOptionIds) ?? getFirstAvailableVariation(product.variations);
    const productAvailable = storeEnabled
      && product.status === 'Activo'
      && product.variations.some((variation) => isVariationAvailable(variation));
    const variationAvailable = Boolean(selectedVariation && isVariationAvailable(selectedVariation));
    const display = getProductDisplayPrice(product, selectedVariation?.selectedOptions ?? selectedOptionIds);

    return {
      available: productAvailable && variationAvailable,
      issue: !productAvailable ? 'product_unavailable' : !variationAvailable ? 'variation_unavailable' : undefined,
      price: selectedVariation?.priceAfterCard ?? display.priceCurrent,
      product,
      stock: productAvailable && selectedVariation ? selectedVariation.stock : 0,
      stockAlertMin: selectedVariation?.stockAlertMin,
      storeName: product.storeName,
      variation: selectedVariation,
      variationName: selectedVariation?.name,
    };
  }

  const richVariations = getProductRichVariations(product);
  const selectedOptions = richVariations
    .map((group) => group.options.find((option) => option.id === selectedOptionIds[group.id]) ?? group.options[0])
    .filter(Boolean) as ProductVariationOption[];
  const selectedOption = selectedOptions[0];
  const stock = selectedOption?.stock ?? 12;
  const available = storeEnabled
    && stock > 0
    && (!selectedOption || selectedOption.status === 'Activa');

  return {
    available,
    issue: available ? undefined : 'product_unavailable',
    price: getProductDisplayPrice(product, selectedOptionIds).priceCurrent,
    product,
    stock: available ? stock : 0,
    storeName: product.storeName,
    variationName: selectedOption?.name,
  };
}

export function validateMarketplaceCartItems(items: MarketplaceCartLikeItem[]) {
  const issues = items.flatMap((item) => {
    const availability = getMarketplaceItemAvailability(item);
    const itemIssues: MarketplaceCartValidationIssue[] = [];

    if (!availability.available) {
      itemIssues.push({
        itemId: item.id,
        productName: availability.product.name,
        type: availability.issue ?? 'product_unavailable',
        message: availability.issue === 'variation_unavailable'
          ? 'Variación no disponible'
          : 'Producto sin stock',
      });
    }

    if (availability.available && item.quantity > availability.stock) {
      itemIssues.push({
        itemId: item.id,
        productName: availability.product.name,
        type: 'quantity_exceeds_stock',
        message: 'Cantidad mayor al stock',
      });
    }

    return itemIssues;
  });

  return {
    issues,
    valid: issues.length === 0,
  };
}

export function saveMockMarketplaceCartItems(items: MarketplaceCartLikeItem[]) {
  const nextItems = items.map((item) => ({
    ...item,
    variationId: item.variationId ?? '',
  }));

  mockCart.items.splice(0, mockCart.items.length, ...nextItems);
  mockCartSummary.count = nextItems.reduce((count, item) => count + item.quantity, 0);
  mockCartSummary.total = Number(nextItems.reduce((total, item) => {
    const availability = getMarketplaceItemAvailability(item);
    return total + (availability.price * item.quantity);
  }, 0).toFixed(2));

  syncCart(nextItems);

  return nextItems;
}

export function purchaseMarketplaceCartItems(items: MarketplaceCartLikeItem[]) {
  const validation = validateMarketplaceCartItems(items);

  if (!validation.valid) {
    return validation;
  }

  items.forEach((item) => {
    const productIndex = providerProducts.findIndex((product) => product.id === item.productId);

    if (productIndex < 0) {
      return;
    }

    const product = providerProducts[productIndex];

    if (product.productType === 'simple') {
      const nextStock = Math.max(0, product.stock - item.quantity);
      providerProducts[productIndex] = {
        ...product,
        stock: nextStock,
        stockStatus: nextStock <= 0 ? 'Sin stock' : product.stockStatus,
        status: nextStock <= 0 ? 'Sin stock' : product.status,
      };
      notifyStockThreshold(providerProducts[productIndex]);
      return;
    }

    const updatedVariations = product.variations.map((variation) => {
      if (variation.id !== item.variationId && variation.sku !== item.variationId) {
        return variation;
      }

      const nextStock = Math.max(0, variation.stock - item.quantity);
      return {
        ...variation,
        stock: nextStock,
        status: nextStock <= 0 ? 'Sin stock' as const : variation.status,
      };
    });
    providerProducts[productIndex] = {
      ...product,
      stock: updatedVariations.reduce((total, variation) => total + (isVariationAvailable(variation) ? variation.stock : 0), 0),
      variations: updatedVariations,
    };
    notifyStockThreshold(providerProducts[productIndex], item.variationId);
  });

  return validateMarketplaceCartItems(items);
}

export function getPublicStoreInfo(storeId: string) {
  return getPublicMarketplaceStores().find((store) => store.id === storeId);
}

export function getProviderMarketplaceFinanceSummary() {
  const localPayouts = mockMarketplaceMonthlyPayouts.filter((payout) => (
    payout.providerStoreId === currentMockMarketplaceStoreId
  ));
  const monthlyPayouts = getRemotePayouts(localPayouts) ?? localPayouts;
  const currentPayout = monthlyPayouts.find((payout) => (
    payout.providerStoreId === currentMockMarketplaceStoreId && payout.status !== 'paid'
  )) ?? monthlyPayouts[0];
  const paidPayouts = monthlyPayouts.filter((payout) => (
    payout.providerStoreId === currentMockMarketplaceStoreId
    && payout.status === 'paid'
    && payout.transferProofUploadedByAdmin
    && payout.providerCanSeeAsPaid
  ));
  const currentItems = mockMarketplacePayoutItems.filter((item) => item.payoutId === currentPayout.id);
  const payoutItems = mockMarketplacePayoutItems.filter((item) => (
    monthlyPayouts.some((payout) => payout.id === item.payoutId)
  ));
  const providerLegalData = {
    businessName: providerStoreProfile.businessName,
    personType: providerStoreProfile.personType,
    documentType: providerStoreProfile.documentType,
    documentNumber: providerStoreProfile.documentNumber,
    legalName: providerStoreProfile.legalName,
    billingEmail: providerStoreProfile.billingEmail,
    financialPhone: `${providerStoreProfile.billingPhoneCountryCode} ${providerStoreProfile.billingPhoneNumber}`,
  };

  return {
    currentPayout,
    currentItems,
    monthlyPayouts,
    payoutItems,
    paidPayouts,
    providerLegalData,
    summaryDocuments: paidPayouts.map((payout) => ({
      providerLegalData,
      payout,
      items: mockMarketplacePayoutItems.filter((item) => item.payoutId === payout.id),
      formats: {
        pdf: {
          providerLegalData,
          payout,
          items: mockMarketplacePayoutItems.filter((item) => item.payoutId === payout.id),
        },
        excel: {
          providerLegalData,
          payout,
          items: mockMarketplacePayoutItems.filter((item) => item.payoutId === payout.id),
        },
      },
    })),
  };
}

export function getProviderProductFinancialEstimate(cardPrice: number) {
  const commission = Number((cardPrice * marketplaceCommissionRate).toFixed(2));
  const providerReceives = Number((cardPrice * providerReceivesRate).toFixed(2));

  return {
    price: cardPrice,
    commission,
    providerReceives,
  };
}

export function getProductImages(product: PublicMarketplaceProduct | ProviderMarketplaceProduct): ProductImageMock[] {
  if ('images' in product && product.images.length > 0) {
    return [...product.images]
      .map((image) => ({
        ...image,
        isPrimary: 'mainImageId' in product ? image.id === product.mainImageId : image.isPrimary,
      }))
      .sort((a, b) => a.order - b.order);
  }

  return createDefaultImages(product.emoji, product.name);
}

export function getProductRichVariations(product: PublicMarketplaceProduct | ProviderMarketplaceProduct): ProductVariationGroup[] {
  if ('productType' in product && product.productType === 'simple') {
    return [];
  }

  if ('attributes' in product && product.attributes.length > 0) {
    return product.attributes.map((attribute) => ({
      id: attribute.id,
      kind: attribute.kind,
      name: attribute.name,
      options: attribute.options.map((option) => {
        const matchingVariation = product.variations.find((variation) => variation.selectedOptions[attribute.id] === option.id);

        return {
          id: option.id,
          colorHex: option.colorHex,
          discount: 0,
          name: option.name,
          priceBefore: undefined,
          priceCurrent: matchingVariation?.priceAfterCard ?? 0,
          sku: matchingVariation?.sku ?? option.id,
          stock: matchingVariation?.stock ?? 0,
          status: matchingVariation && isVariationAvailable(matchingVariation)
            ? 'Activa'
            : 'Pausada',
        };
      }),
    }));
  }

  if ('richVariations' in product && product.richVariations.length > 0) {
    return product.richVariations;
  }

  const groups: ProductVariationGroup[] = [];
  const legacyVariations = getProductLegacyVariations(product);

  if (legacyVariations.size?.length) {
    groups.push(createVariationGroup('Tamaño de empaque', legacyVariations.size, product.transferPrice, `${product.id}-SIZE`));
  }

  if (legacyVariations.flavor?.length) {
    groups.push(createVariationGroup('Sabor', legacyVariations.flavor, product.transferPrice, `${product.id}-FLAVOR`));
  }

  if (legacyVariations.color?.length) {
    groups.push(createVariationGroup('Color', legacyVariations.color, product.transferPrice, `${product.id}-COLOR`));
  }

  return groups;
}

export function getProductDisplayPrice(
  product: PublicMarketplaceProduct | ProviderMarketplaceProduct,
  selectedOptionIds: Record<string, string> = {},
): ProductDisplayPrice {
  if ('productType' in product) {
    if (product.productType === 'simple') {
      const priceBefore = product.cardPriceBefore ?? product.priceBefore;
      const transferPriceBefore = product.transferPriceBefore;
      const productPaused = product.isActive === false || (product.status !== 'Activo' && product.status !== 'Sin stock');

      return {
        discount: calculateDiscount(priceBefore, product.cardPriceAfter),
        priceBefore,
        priceCurrent: product.cardPriceAfter,
        stock: productPaused ? 0 : product.stock,
        stockStatus: productPaused ? 'Pausado' : product.stockStatus,
        transferDiscount: calculateDiscount(transferPriceBefore, product.transferPriceAfter),
        transferPrice: product.transferPriceAfter,
        transferPriceBefore,
        variation: null,
      };
    }

    const selectedVariation = findMatchingProductVariation(product.variations, selectedOptionIds);
    const hasCompleteSelection = product.attributes.length > 0
      && product.attributes.every((attribute) => Boolean(selectedOptionIds[attribute.id]));

    if (hasCompleteSelection && !selectedVariation) {
      const fallbackPrice = getVariableBasePrice(product.variations, 'card');
      const fallbackTransferPrice = getVariableBasePrice(product.variations, 'transfer');

      return {
        discount: 0,
        priceBefore: undefined,
        priceCurrent: fallbackPrice,
        stock: 0,
        stockStatus: 'Sin stock' as ProductStockStatus,
        transferDiscount: 0,
        transferPrice: fallbackTransferPrice,
        transferPriceBefore: undefined,
        variation: null,
      };
    }

    const fallbackVariation = getFirstAvailableVariation(product.variations) ?? product.variations[0];
    const variation = selectedVariation ?? fallbackVariation;

    if (!variation) {
      return {
        discount: 0,
        priceBefore: undefined,
        priceCurrent: product.cardPriceAfter,
        stock: 0,
        stockStatus: 'Sin stock' as ProductStockStatus,
        transferDiscount: 0,
        transferPrice: product.transferPriceAfter,
        transferPriceBefore: undefined,
        variation: null,
      };
    }

    const productPaused = product.status !== 'Activo' && product.status !== 'Sin stock';
    const stockStatus: ProductStockStatus = productPaused
      ? 'Pausado'
      : variation.stock <= 0 || variation.status === 'Sin stock'
      ? 'Sin stock'
      : variation.status === 'Pausada'
        ? 'Pausado'
        : 'Disponible';

    return {
      discount: calculateDiscount(variation.priceBeforeCard, variation.priceAfterCard),
      priceBefore: variation.priceBeforeCard,
      priceCurrent: variation.priceAfterCard,
      stock: productPaused ? 0 : variation.stock,
      stockStatus,
      transferDiscount: calculateDiscount(variation.priceBeforeTransfer, variation.priceAfterTransfer),
      transferPrice: variation.priceAfterTransfer,
      transferPriceBefore: variation.priceBeforeTransfer,
      variation,
    };
  }

  const richVariations = getProductRichVariations(product);
  const selectedOptions = richVariations
    .map((group) => group.options.find((option) => option.id === selectedOptionIds[group.id]) ?? group.options[0])
    .filter(Boolean) as ProductVariationOption[];
  const pricedOption = selectedOptions.find((option) => option.priceCurrent > 0);
  const priceCurrent = Number(pricedOption?.priceCurrent ?? product.transferPrice);
  const priceBefore = pricedOption?.priceBefore ?? ('priceBefore' in product ? product.priceBefore as number | undefined : undefined);
  const discount = pricedOption?.discount || calculateDiscount(priceBefore, priceCurrent) || product.discount;
  const stock = Number(pricedOption?.stock ?? ('stock' in product ? product.stock : 12));
  const stockStatus: ProductStockStatus = stock <= 0
    ? 'Sin stock'
    : ('stockStatus' in product ? product.stockStatus as ProductStockStatus : 'Disponible');

  return {
    discount,
    priceBefore,
    priceCurrent,
    stock,
    stockStatus,
    transferDiscount: 0,
    transferPrice: product.transferPrice,
    transferPriceBefore: undefined,
    variation: null,
  };
}

export function getProductCardDisplay(product: PublicMarketplaceProduct | ProviderMarketplaceProduct) {
  const display = getProductDisplayPrice(product);
  const isVariable = 'productType' in product && product.productType === 'variable';

  return {
    ...display,
    discount: isVariable ? getProductDiscount(product) : display.discount,
    isVariable,
    pricePrefix: isVariable ? 'Desde ' : undefined,
  };
}

export function getProductLegacyVariations(product: PublicMarketplaceProduct | ProviderMarketplaceProduct): MarketplaceProductVariations {
  if ('legacyVariations' in product) {
    return product.legacyVariations;
  }

  return product.variations;
}

export function findMatchingProductVariation(
  variations: ProductVariationMock[],
  selectedOptionIds: Record<string, string>,
) {
  const selectedEntries = Object.entries(selectedOptionIds).filter(([, optionId]) => Boolean(optionId));

  if (selectedEntries.length === 0) {
    return null;
  }

  return variations.find((variation) => (
    selectedEntries.every(([attributeId, optionId]) => variation.selectedOptions[attributeId] === optionId)
  )) ?? null;
}

function getFirstAvailableVariation(variations: ProductVariationMock[]) {
  return variations.find((variation) => isVariationAvailable(variation)) ?? null;
}

function isSimpleProductAvailable(product: ProviderMarketplaceProduct) {
  return product.productType === 'simple'
    && product.isActive !== false
    && product.status === 'Activo'
    && product.stockStatus === 'Disponible'
    && product.stock > 0;
}

function notifyStockThreshold(product: ProviderMarketplaceProduct, variationId?: string) {
  if (product.productType === 'simple') {
    if (product.stock <= product.stockAlertMin) {
      addProviderNotification({
        category: 'Stock',
        type: 'stock_low_simple',
        title: 'Stock bajo',
        message: `Tu producto ${product.name} llegó al stock mínimo.`,
        priority: 'Urgente',
        actionLabel: 'Ver producto',
        actionTarget: 'products',
        dedupeKey: `stock-low:${product.id}:${product.stock}`,
      });
    }
    return;
  }

  const variation = product.variations.find((item) => item.id === variationId || item.sku === variationId);

  if (variation && variation.stock <= variation.stockAlertMin) {
    addProviderNotification({
      category: 'Stock',
      type: 'stock_low_variation',
      title: 'Stock bajo',
      message: `La variación ${variation.name} de ${product.name} llegó al stock mínimo.`,
      priority: 'Urgente',
      actionLabel: 'Ver producto',
      actionTarget: 'products',
      dedupeKey: `stock-low:${product.id}:${variation.id}:${variation.stock}`,
    });
  }
}

function getVariableBasePrice(variations: ProductVariationMock[], priceKind: 'card' | 'transfer') {
  const available = variations.filter((variation) => isVariationAvailable(variation));
  const candidates = available.length > 0 ? available : variations;
  const prices = candidates.map((variation) => (
    priceKind === 'card' ? variation.priceAfterCard : variation.priceAfterTransfer
  )).filter((price) => price > 0);

  return prices.length > 0 ? Math.min(...prices) : 0;
}

function getVariableBaseBeforePrice(variations: ProductVariationMock[], priceKind: 'card') {
  const prices = variations.map((variation) => (
    priceKind === 'card' ? variation.priceBeforeCard : undefined
  )).filter((price): price is number => Boolean(price && price > 0));

  return prices.length > 0 ? Math.min(...prices) : undefined;
}

function getProductDiscount(product: ProviderMarketplaceProduct) {
  if (product.productType === 'simple') {
    return calculateDiscount(product.cardPriceBefore, product.cardPriceAfter);
  }

  return product.variations.reduce((bestDiscount, variation) => (
    Math.max(bestDiscount, calculateDiscount(variation.priceBeforeCard, variation.priceAfterCard))
  ), 0);
}

function isVariationAvailable(variation: ProductVariationMock) {
  return isMarketplaceVariationPublishable(variation);
}
