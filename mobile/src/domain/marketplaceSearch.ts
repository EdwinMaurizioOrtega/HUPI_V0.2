export type MarketplaceSearchableProduct = {
  brand?: string;
  category?: string;
  name: string;
  storeName?: string;
  tags?: readonly string[];
};

export type MarketplaceSearchableStore = {
  categories?: readonly string[];
  category?: string;
  name: string;
};

export function normalizeMarketplaceSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function includesEverySearchTerm(searchableText: string, query: string) {
  const normalizedQuery = normalizeMarketplaceSearch(query);
  if (!normalizedQuery) {
    return true;
  }

  const normalizedText = normalizeMarketplaceSearch(searchableText);
  return normalizedQuery.split(' ').every((term) => normalizedText.includes(term));
}

export function searchMarketplaceProducts<T extends MarketplaceSearchableProduct>(
  products: readonly T[],
  query: string,
) {
  if (!normalizeMarketplaceSearch(query)) {
    return [];
  }

  return products.filter((product) => includesEverySearchTerm([
    product.name,
    product.brand,
    product.storeName,
    product.category,
    ...(product.tags ?? []),
  ].filter(Boolean).join(' '), query));
}

export function searchMarketplaceStores<T extends MarketplaceSearchableStore>(
  stores: readonly T[],
  query: string,
) {
  if (!normalizeMarketplaceSearch(query)) {
    return [];
  }

  return stores.filter((store) => includesEverySearchTerm([
    store.name,
    store.category,
    ...(store.categories ?? []),
  ].filter(Boolean).join(' '), query));
}
