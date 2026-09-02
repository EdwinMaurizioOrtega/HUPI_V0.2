export type MarketplacePublishableVariation = {
  isActive?: boolean;
  status?: string;
  stock?: number;
};

export type MarketplacePublishableProduct = {
  isActive?: boolean;
  productType?: 'simple' | 'variable';
  status?: string;
  stock?: number;
  stockStatus?: string;
  variations?: MarketplacePublishableVariation[] | Record<string, string[] | undefined>;
};

export type MarketplacePublishableStore = {
  enabled?: boolean;
  id?: string;
  providerStatus?: string;
  storeStatus?: string;
};

export function isMarketplaceStoreEnabled(store?: MarketplacePublishableStore) {
  if (!store) {
    return false;
  }

  if (store.enabled === false) {
    return false;
  }

  if (store.providerStatus !== undefined && store.providerStatus !== 'Aprobado') {
    return false;
  }

  if (store.storeStatus !== undefined && store.storeStatus !== 'Habilitada') {
    return false;
  }

  return true;
}

export function isMarketplaceVariationPublishable(
  variation: MarketplacePublishableVariation,
) {
  return variation.isActive !== false
    && variation.status !== 'Pausada'
    && variation.status !== 'Sin stock'
    && Number(variation.stock ?? 0) > 0;
}

export function isMarketplaceProductPublishable(
  product: MarketplacePublishableProduct,
  storeEnabled = true,
) {
  if (!storeEnabled || product.isActive === false) {
    return false;
  }

  if (
    product.status !== undefined
    && product.status !== 'Activo'
  ) {
    return false;
  }

  if (product.productType === 'variable' && Array.isArray(product.variations)) {
    return product.variations.some(isMarketplaceVariationPublishable);
  }

  if (product.stock !== undefined) {
    return Number(product.stock) > 0
      && product.stockStatus !== 'Sin stock'
      && product.stockStatus !== 'Pausado';
  }

  // Los productos base del MVP no modelan inventario propio todavía.
  // Mientras sigan activos en la fuente local, se consideran publicables.
  return true;
}

export type MarketplaceCartIssueLike = {
  itemId: string;
  type: 'product_unavailable' | 'quantity_exceeds_stock' | 'variation_unavailable';
};

export function getUnavailableMarketplaceCartItemIds(
  issues: MarketplaceCartIssueLike[],
) {
  return [...new Set(
    issues
      .filter((issue) => (
        issue.type === 'product_unavailable'
        || issue.type === 'variation_unavailable'
      ))
      .map((issue) => issue.itemId),
  )];
}

export function removeUnavailableMarketplaceCartItems<T extends { id: string }>(
  items: T[],
  issues: MarketplaceCartIssueLike[],
) {
  const unavailableIds = new Set(getUnavailableMarketplaceCartItemIds(issues));
  return items.filter((item) => !unavailableIds.has(item.id));
}
