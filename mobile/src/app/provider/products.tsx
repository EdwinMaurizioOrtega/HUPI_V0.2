import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useFocusEffect,
  useRouter } from 'expo-router';
import { useCallback,
  useMemo,
  useState } from 'react';
import {
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ProviderPageHeader } from '@/components/provider/ProviderPageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { formatMarketplaceCurrency } from '@/components/marketplace/ProductPriceBlock';
import { colors } from '@/constants/colors';
import { Text } from '@/i18n/components';
import {
  getProviderAdminMarketplaceState,
  getProviderProducts,
  toggleProviderProductStatus,
  type MarketplaceProductStatus,
  type ProviderMarketplaceProduct,
} from '@/constants/marketplaceStoreState';

const filters: MarketplaceProductStatus[] = ['Activo', 'Pausado', 'Sin stock', 'En revisión'];

export default function ProviderProductsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [products, setProducts] = useState(() => getProviderProducts());
  const [adminState, setAdminState] = useState(() => getProviderAdminMarketplaceState());
  const [activeFilter, setActiveFilter] = useState<MarketplaceProductStatus>('Activo');
  const [notice, setNotice] = useState<string | null>(null);
  const filteredProducts = useMemo(() => (
    products.filter((product) => product.status === activeFilter)
  ), [activeFilter, products]);

  useFocusEffect(useCallback(() => {
    setProducts(getProviderProducts());
    setAdminState(getProviderAdminMarketplaceState());
  }, []));

  const toggleStatus = (productId: string) => {
    const updated = toggleProviderProductStatus(productId);
    setProducts(getProviderProducts());
    setNotice(updated ? `Estado actualizado: ${updated.status}.` : null);
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <ProviderPageHeader
        onBack={() => router.back()}
        subtitle={t('providerProducts.count', { count: products.length })}
        title="__hupi_i18n:common.myProducts"
      />

      <Button
        icon="add-circle-outline"
        onPress={() => router.push('/provider/product-editor' as Href)}
        style={styles.addButton}
        title="__hupi_i18n:common.addProduct"
      />

      <Card style={styles.adminStateCard} tone="soft">
        <View style={styles.adminStateIcon}>
          <Ionicons color={colors.secondary} name="shield-checkmark-outline" size={18} />
        </View>
        <View style={styles.adminStateCopy}>
          <Text style={styles.adminStateTitle}>__hupi_i18n:provider.products.adminMarketplaceReview</Text>
          <Text style={styles.adminStateText}>{t('providerProducts.visibleStatus', { status: adminState.productStatus })}</Text>
        </View>
      </Card>

      <ScrollView contentContainerStyle={styles.filtersContent} horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        {filters.map((filter) => {
          const active = activeFilter === filter;

          return (
            <Pressable key={filter} onPress={() => setActiveFilter(filter)} style={[styles.filterChip, active && styles.activeFilterChip]}>
              <Text style={[styles.filterText, active && styles.activeFilterText]}>{filter}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {notice ? (
        <View style={styles.notice}>
          <Ionicons color={colors.primary} name="information-circle-outline" size={17} />
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      <View style={styles.stack}>
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductRow
              key={product.id}
              onEdit={() => router.push(`/provider/product-editor?productId=${product.id}` as Href)}
              onToggle={() => toggleStatus(product.id)}
              product={product}
            />
          ))
        ) : (
          <Card style={styles.emptyCard} tone="soft">
            <Ionicons color={colors.secondary} name="cube-outline" size={24} />
            <Text style={styles.emptyTitle}>__hupi_i18n:provider.products.noProductsInThisFilter</Text>
            <Text style={styles.emptyText}>__hupi_i18n:provider.products.productsWillChangeSectionsWhenYouAdjustTheirStatus</Text>
          </Card>
        )}
      </View>
    </ScreenContainer>
  );
}

function ProductRow({
  onEdit,
  onToggle,
  product,
}: {
  onEdit: () => void;
  onToggle: () => void;
  product: ProviderMarketplaceProduct;
}) {
  const { t } = useTranslation();
  return (
    <Card style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={[styles.productThumb, { backgroundColor: product.color }]}>
          <Text style={styles.productEmoji}>{product.emoji}</Text>
        </View>
        <View style={styles.productCopy}>
          <Text numberOfLines={2} style={styles.productName}>{product.name}</Text>
          <Text style={styles.productMeta}>{t('providerProducts.stockMeta', { category: product.category, count: product.stock })}</Text>
        </View>
        <View style={[styles.statusBadge, product.status !== 'Activo' && styles.statusBadgeMuted]}>
          <Text style={[styles.statusText, product.status !== 'Activo' && styles.statusTextMuted]}>{product.status}</Text>
        </View>
      </View>

      <View style={styles.priceGrid}>
        <Info label="__hupi_i18n:common.cardPrice" value={formatMarketplaceCurrency(product.cardPrice)} />
        <Info label="__hupi_i18n:common.transferPrice" value={formatMarketplaceCurrency(product.transferPrice)} />
        <Info label="__hupi_i18n:common.discount" value={`${product.discount}%`} />
      </View>

      <View style={styles.actions}>
        <Button icon="create-outline" onPress={onEdit} title="__hupi_i18n:common.edit" variant="outline" />
        <Button
          disabled={product.status === 'Sin stock' || product.status === 'En revisión'}
          icon={product.status === 'Activo' ? 'pause-outline' : 'play-outline'}
          onPress={onToggle}
          title={product.status === 'Activo' ? 'Pausar' : 'Activar'}
          variant="secondary"
        />
      </View>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBox}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 42 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  addButton: { marginTop: 20 },
  adminStateCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, shadowOpacity: 0 },
  adminStateIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  adminStateCopy: { flex: 1 },
  adminStateTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  adminStateText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 2, fontWeight: '800' },
  filters: { marginTop: 18, marginHorizontal: -4 },
  filtersContent: { gap: 8, paddingHorizontal: 4 },
  filterChip: { minHeight: 36, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, justifyContent: 'center', paddingHorizontal: 12 },
  activeFilterChip: { borderColor: colors.primary, backgroundColor: colors.primary },
  filterText: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  activeFilterText: { color: colors.white },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 15, backgroundColor: colors.primarySoft, padding: 11, marginTop: 14 },
  noticeText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '800' },
  stack: { gap: 12, marginTop: 16 },
  productCard: { gap: 12, shadowOpacity: 0.04 },
  productHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  productThumb: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  productEmoji: { fontSize: 27 },
  productCopy: { flex: 1 },
  productName: { color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '900' },
  productMeta: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4, fontWeight: '800' },
  statusBadge: { borderRadius: 999, backgroundColor: colors.primarySoft, paddingHorizontal: 9, paddingVertical: 6 },
  statusBadgeMuted: { backgroundColor: colors.secondarySoft },
  statusText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  statusTextMuted: { color: colors.secondary },
  priceGrid: { flexDirection: 'row', gap: 8 },
  infoBox: { flex: 1, borderRadius: 14, backgroundColor: colors.soft, padding: 10 },
  infoLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  infoValue: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 3 },
  actions: { flexDirection: 'row', gap: 9 },
  emptyCard: { alignItems: 'center', gap: 7, shadowOpacity: 0 },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  emptyText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
