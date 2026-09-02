import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useLocalSearchParams,
  useRouter } from 'expo-router';
import { useMemo,
  useState } from 'react';
import { Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { Card } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { QuickCartBar } from '@/components/marketplace/QuickCartBar';
import { colors } from '@/constants/colors';
import { getProductCardDisplay, getPublicMarketplaceProducts, getPublicMarketplaceStores } from '@/constants/marketplaceStoreState';
import { mockCartSummary } from '@/constants/mockData';
import { Pressable, Text } from '@/i18n/components';

export default function OfficialStoreScreen() {
  const router = useRouter();
  const { storeId } = useLocalSearchParams<{ storeId?: string }>();
  const [notice, setNotice] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(mockCartSummary.count);
  const [cartTotal, setCartTotal] = useState(mockCartSummary.total);
  const marketplaceStores = getPublicMarketplaceStores();
  const marketplaceProducts = getPublicMarketplaceProducts();
  const store = useMemo(
    () => marketplaceStores.find((item) => item.id === storeId) ?? marketplaceStores[0],
    [marketplaceStores, storeId],
  );
  const products = marketplaceProducts.filter((product) => product.storeId === store.id);
  const storeProducts = products.length > 0 ? products : marketplaceProducts.filter((product) => product.isOfficialStore).slice(0, 4);

  const shareStoreMock = () => {
    // TODO: Integrar Share API de React Native para compartir por WhatsApp, redes, mensaje o copiar enlace.
    Alert.alert("__hupi_i18n:common.shareStore", "__hupi_i18n:marketplace.official-store.soonYouWillBeAbleToSendThisStore");
  };

  const shareProductMock = () => {
    // TODO: Integrar Share API de React Native para compartir por WhatsApp, redes, mensaje o copiar enlace.
    Alert.alert("__hupi_i18n:common.shareProduct", "__hupi_i18n:common.soonYouWillBeAbleToSendThisProduct");
  };

  return (
    <ScreenContainer contentContainerStyle={styles.screen} scroll={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topbar}>
        <IconButton accessibilityLabel="__hupi_i18n:common.back" icon="arrow-back" iconColor={colors.text} iconSize={22} onPress={() => router.back()} size={42} />
        <View style={styles.headerActions}>
          <IconButton accessibilityLabel="__hupi_i18n:common.shareStore" backgroundColor={colors.secondarySoft} icon="share-social-outline" iconColor={colors.secondary} iconSize={20} onPress={shareStoreMock} size={42} />
          <IconButton accessibilityLabel="__hupi_i18n:common.openCart" badge={cartCount} backgroundColor={colors.secondarySoft} icon="cart-outline" iconColor={colors.secondary} iconSize={21} onPress={() => router.push('/marketplace/cart')} size={42} />
        </View>
      </View>

      <Card style={styles.hero}>
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>{store.logo}</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.title}>{store.name}</Text>
          <View style={styles.badges}>
            {store.isVerifiedByHupi ? (
              <View style={styles.verifiedBadge}>
                <Ionicons color={colors.success} name="checkmark-circle" size={14} />
                <Text style={styles.verifiedText}>__hupi_i18n:common.verifiedByHupi</Text>
              </View>
            ) : null}
            {store.isOfficialStore ? (
              <View style={styles.officialBadge}>
                <Text style={styles.officialText}>__hupi_i18n:common.officialStore</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.description}>{store.description}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>★ {store.rating}</Text>
            <Text style={styles.meta}>{store.productCount}  __hupi_i18n:common.products</Text>
          </View>
        </View>
      </Card>

      <View style={styles.categoryRow}>
        {store.categories.map((category) => (
          <Text key={category} style={styles.categoryPill}>{category}</Text>
        ))}
      </View>

      <Text style={styles.sectionTitle}>__hupi_i18n:marketplace.official-store.storeProducts</Text>
      <View style={styles.grid}>
        {storeProducts.map((product) => {
          const display = getProductCardDisplay(product);

          return (
            <ProductCard
              brand={product.brand}
              cardPrice={display.priceCurrent}
              category={product.category}
              color={product.color}
              discount={display.discount}
              emoji={product.emoji}
              key={product.id}
              name={product.name}
              onAdd={() => {
                setCartCount((value) => value + 1);
                setCartTotal((value) => Number((value + display.priceCurrent).toFixed(2)));
                setNotice('Producto agregado al carrito.');
              }}
              onOpen={() => router.push(`/marketplace/product-detail?productId=${product.id}` as Href)}
              onShare={shareProductMock}
              priceBefore={display.priceBefore}
              pricePrefix={display.pricePrefix}
              rating={product.rating}
              stock={display.stock}
              storeBadge={product.isOfficialStore ? 'Tienda Oficial' : product.isVerifiedByHupi ? 'Verificada por Hupi' : undefined}
              storeBadgeTone={product.isOfficialStore ? 'official' : 'verified'}
              transferDiscount={display.transferDiscount}
              transferPrice={display.transferPrice}
              transferPriceBefore={display.transferPriceBefore}
            />
          );
        })}
      </View>
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      </ScrollView>
      <QuickCartBar
        count={cartCount}
        onBuyPress={() => router.push('/marketplace/checkout')}
        onCartPress={() => router.push('/marketplace/cart')}
        total={cartTotal}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 0 },
  content: { paddingTop: 8, paddingHorizontal: 20, paddingBottom: 148 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hero: { flexDirection: 'row', gap: 14, marginTop: 18, shadowOpacity: 0.05 },
  logoWrap: { width: 76, height: 76, borderRadius: 24, backgroundColor: colors.secondarySoft, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 39 },
  heroCopy: { flex: 1 },
  title: { color: colors.text, fontSize: 25, fontWeight: '900' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  verifiedBadge: { alignSelf: 'flex-start', minHeight: 27, borderRadius: 999, backgroundColor: '#eef9f3', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9 },
  verifiedText: { color: colors.success, fontSize: 12, fontWeight: '900' },
  officialBadge: { alignSelf: 'flex-start', minHeight: 27, borderRadius: 999, backgroundColor: colors.secondarySoft, justifyContent: 'center', paddingHorizontal: 9 },
  officialText: { color: colors.secondary, fontSize: 12, fontWeight: '900' },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 21, marginTop: 10 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  meta: { color: colors.secondary, fontSize: 13, fontWeight: '900' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  categoryPill: { borderRadius: 999, backgroundColor: colors.primarySoft, color: colors.primary, fontSize: 12, fontWeight: '900', paddingHorizontal: 10, paddingVertical: 7 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 24, marginBottom: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  notice: { color: colors.success, fontSize: 13, fontWeight: '900', textAlign: 'center', marginTop: 14 },
});
