import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useFocusEffect,
  useLocalSearchParams,
  useRouter } from 'expo-router';
import { useCallback,
  useMemo,
  useState } from 'react';
import { Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';
import { CategoryCard } from '@/components/marketplace/CategoryCard';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { colors } from '@/constants/colors';
import { mockProductCategories } from '@/constants/marketplaceProductEditorOptions';
import { getProductCardDisplay, getPublicMarketplaceProducts } from '@/constants/marketplaceStoreState';
import { Pressable, Text } from '@/i18n/components';

export default function MarketplaceCategoryScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const initialCategory = category ? decodeURIComponent(category) : 'Todo';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [notice, setNotice] = useState(false);
  const [marketplaceProducts, setMarketplaceProducts] = useState(() => getPublicMarketplaceProducts());
  const products = useMemo(() => (
    selectedCategory === 'Todo'
      ? marketplaceProducts
      : marketplaceProducts.filter((product) => product.category === selectedCategory)
  ), [marketplaceProducts, selectedCategory]);

  useFocusEffect(useCallback(() => {
    setMarketplaceProducts(getPublicMarketplaceProducts());
  }, []));

  const shareProductMock = () => {
    // TODO: Integrar Share API de React Native para compartir por WhatsApp, redes, mensaje o copiar enlace.
    Alert.alert("__hupi_i18n:common.shareProduct", "__hupi_i18n:common.soonYouWillBeAbleToSendThisProduct");
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.topbar}>
        <Pressable accessibilityLabel="__hupi_i18n:common.back" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={colors.text} name="arrow-back" size={22} />
        </Pressable>
        <View style={styles.heading}>
          <Text style={styles.title}>__hupi_i18n:common.categories</Text>
          <Text style={styles.subtitle}>{selectedCategory} · {products.length}  __hupi_i18n:common.products</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.categories} horizontal showsHorizontalScrollIndicator={false}>
        {[{ id: 'all', name: 'Todo', icon: 'apps-outline', emoji: '🛍️', color: '#fff0ec' }, ...mockProductCategories].map((item) => (
          <CategoryCard
            active={selectedCategory === item.name}
            color={item.color}
            emoji={item.emoji}
            icon={item.icon}
            key={item.id}
            name={item.name}
            onPress={() => setSelectedCategory(item.name)}
          />
        ))}
      </ScrollView>

      <View style={styles.grid}>
        {products.map((product) => {
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
              onAdd={() => setNotice(true)}
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
      {notice ? <Text style={styles.notice}>__hupi_i18n:common.productAddedToCart</Text> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 42 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 0 },
  title: { color: colors.text, flexShrink: 1, fontSize: 27, fontWeight: '900', lineHeight: 33 },
  subtitle: { color: colors.textMuted, flexShrink: 1, fontSize: 13, lineHeight: 18, marginTop: 4 },
  categories: { gap: 10, paddingTop: 18, paddingBottom: 16, paddingRight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  notice: { color: colors.success, fontSize: 13, fontWeight: '900', textAlign: 'center', marginTop: 16 },
});
