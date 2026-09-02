import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useFocusEffect,
  useRouter } from 'expo-router';
import { useCallback,
  useEffect,
  useMemo,
  useRef,
  useState } from 'react';
import { Alert,
  Animated,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { NotificationBell } from '@/components/NotificationBell';
import { IconButton } from '@/components/IconButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { CategoryCard } from '@/components/marketplace/CategoryCard';
import { MarketplaceBanner } from '@/components/marketplace/MarketplaceBanner';
import { MarketplacePromoModal } from '@/components/marketplace/MarketplacePromoModal';
import { OfficialStoreCard } from '@/components/marketplace/OfficialStoreCard';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { ProviderReviewPromptModal } from '@/components/marketplace/ProviderReviewPromptModal';
import { QuickCartBar } from '@/components/marketplace/QuickCartBar';
import { colors } from '@/constants/colors';
import { getActiveOrderedContent, visualContentConfig } from '@/constants/contentConfig';
import { fonts } from '@/constants/typography';
import {
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_MIN_BOTTOM_INSET,
  FLOATING_TAB_BAR_TOP_GAP,
} from '@/constants/navigationLayout';
import { getCustomerHupiBalance } from '@/constants/marketplaceIssuesState';
import { clearProviderReviewPromptState, getProviderReviewPromptState } from '@/constants/marketplaceProviderOrders';
import { mockProductCategories } from '@/constants/marketplaceProductEditorOptions';
import { getProductCardDisplay, getPublicMarketplaceProducts, getPublicMarketplaceStores } from '@/constants/marketplaceStoreState';
import {
  normalizeMarketplaceSearch,
  searchMarketplaceProducts,
  searchMarketplaceStores,
} from '@/domain/marketplaceSearch';
import { Pressable, Text, TextInput } from '@/i18n/components';
import {
  mockCartSummary,
  mockCoupons,
  mockMarketplaceNotifications,
  mockProviderReviewPrompt,
  mockPromoRewards,
} from '@/constants/mockData';
import { useTheme } from '@/theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../../node_modules/react-i18next';

export default function MarketplaceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todo');
  const [cartCount, setCartCount] = useState(mockCartSummary.count);
  const [cartTotal, setCartTotal] = useState(mockCartSummary.total);
  const [toastVisible, setToastVisible] = useState(false);
  const [promoVisible, setPromoVisible] = useState(true);
  const [providerPromptVisible, setProviderPromptVisible] = useState(true);
  const [couponPanelOpen, setCouponPanelOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponNotice, setCouponNotice] = useState<string | null>(null);
  const [promoSavedNotice, setPromoSavedNotice] = useState<string | null>(null);
  const [providerReviewPrompt, setProviderReviewPrompt] = useState(getProviderReviewPromptState());
  const [marketplaceProducts, setMarketplaceProducts] = useState(() => getPublicMarketplaceProducts());
  const [marketplaceStores, setMarketplaceStores] = useState(() => getPublicMarketplaceStores());
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unread = mockMarketplaceNotifications.filter((notification) => notification.unread).length;
  const hupiBalance = getCustomerHupiBalance();
  const marketplaceBanners = getActiveOrderedContent(visualContentConfig.marketplaceBanners);
  const floatingTabTopEdge = FLOATING_TAB_BAR_HEIGHT
    + FLOATING_TAB_BAR_TOP_GAP
    + Math.max(insets.bottom, FLOATING_TAB_BAR_MIN_BOTTOM_INSET);

  const products = useMemo(() => marketplaceProducts.filter((product) => {
    return category === 'Todo' || product.category === category;
  }), [category, marketplaceProducts]);

  const offers = products.filter((product) => product.discount > 0);
  const officialStores = marketplaceStores.filter((store) => store.isOfficialStore);
  const verifiedStores = marketplaceStores.filter((store) => store.isVerifiedByHupi);
  const normalizedQuery = normalizeMarketplaceSearch(query);
  const searchProducts = useMemo(
    () => searchMarketplaceProducts(marketplaceProducts, query),
    [marketplaceProducts, query],
  );
  const searchStores = useMemo(
    () => searchMarketplaceStores(marketplaceStores, query),
    [marketplaceStores, query],
  );
  const hasSearchResults = searchProducts.length > 0 || searchStores.length > 0;

  useFocusEffect(useCallback(() => {
    setProviderReviewPrompt(getProviderReviewPromptState());
    setProviderPromptVisible(true);
    setMarketplaceProducts(getPublicMarketplaceProducts());
    setMarketplaceStores(getPublicMarketplaceStores());
    setCartCount(mockCartSummary.count);
    setCartTotal(mockCartSummary.total);
  }, []));

  const openProduct = (productId: string) => {
    router.push(`/marketplace/product-detail?productId=${productId}` as Href);
  };

  const addProductToMockCart = (price: number) => {
    setCartCount((value) => value + 1);
    setCartTotal((value) => Number((value + price).toFixed(2)));
    setToastVisible(true);

    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }

    Animated.timing(toastAnim, {
      duration: 180,
      toValue: 1,
      useNativeDriver: true,
    }).start();

    toastTimer.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        duration: 180,
        toValue: 0,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setToastVisible(false);
        }
      });
    }, 1700);
  };

  const shareProductMock = () => {
    // TODO: Integrar Share API de React Native para compartir por WhatsApp, redes, mensaje o copiar enlace.
    Alert.alert("__hupi_i18n:common.shareProduct", "__hupi_i18n:common.soonYouWillBeAbleToSendThisProduct");
  };

  const applyCouponMock = () => {
    const normalizedCode = couponCode.trim().toUpperCase();
    const coupon = mockCoupons.find((item) => item.code === normalizedCode && item.status === 'Disponible');
    setCouponNotice(coupon ? 'Cupón aplicado correctamente.' : 'Cupón no válido o expirado.');
  };

  useEffect(() => () => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
  }, []);

  return (
    <ScreenContainer contentContainerStyle={styles.screen} scroll={false}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: floatingTabTopEdge + 104 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>__hupi_i18n:common.marketplaceHupi2</Text>
            <Text style={styles.title}>__hupi_i18n:common.marketplace</Text>
          </View>
          <ScrollView
            contentContainerStyle={styles.headerActions}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.headerActionsScroll}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/marketplace/wallet')}
              style={styles.walletShortcut}
            >
              <Ionicons color={colors.secondary} name="wallet-outline" size={16} />
              <Text numberOfLines={1} style={styles.walletShortcutText}>${hupiBalance.available.toFixed(2)}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: couponPanelOpen }}
              onPress={() => setCouponPanelOpen((value) => !value)}
              style={[styles.couponShortcut, couponPanelOpen && styles.couponShortcutActive]}
            >
              <Ionicons color={couponPanelOpen ? colors.white : colors.primary} name="ticket-outline" size={15} />
              <Text numberOfLines={1} style={[styles.couponShortcutText, couponPanelOpen && styles.couponShortcutTextActive]}>__hupi_i18n:marketplace.marketplace.doYouHaveACoupon</Text>
            </Pressable>
            <IconButton
              accessibilityLabel="__hupi_i18n:common.orders"
              backgroundColor={colors.secondarySoft}
              icon="receipt-outline"
              iconColor={colors.secondary}
              iconSize={21}
              onPress={() => router.push('/marketplace/orders')}
              size={40}
            />
            <NotificationBell compact count={unread} onPress={() => router.push('/marketplace/notifications')} />
            <IconButton
              accessibilityLabel="__hupi_i18n:common.openCart"
              badge={cartCount}
              backgroundColor={colors.secondarySoft}
              icon="cart-outline"
              iconColor={colors.secondary}
              iconSize={21}
              onPress={() => router.push('/marketplace/cart')}
              size={40}
            />
          </ScrollView>
          {couponPanelOpen ? (
            <View style={styles.couponPanel}>
              <View style={styles.couponInputRow}>
                <TextInput
                  autoCapitalize="characters"
                  onChangeText={setCouponCode}
                  placeholder="__hupi_i18n:common.hupi10"
                  placeholderTextColor={colors.textMuted}
                  style={styles.couponInput}
                  value={couponCode}
                />
                <Pressable onPress={applyCouponMock} style={styles.applyCouponButton}>
                  <Text style={styles.applyCouponText}>__hupi_i18n:common.apply</Text>
                </Pressable>
              </View>
              {couponNotice ? <Text style={[styles.couponNotice, couponNotice.includes('no válido') && styles.couponNoticeError]}>{couponNotice}</Text> : null}
              {promoSavedNotice ? <Text style={styles.couponNotice}>{promoSavedNotice}</Text> : null}
            </View>
          ) : null}
        </View>

        <View style={styles.search}>
          <Ionicons color={tokens.textMuted} name="search" size={20} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            onChangeText={setQuery}
            placeholder="__hupi_i18n:marketplace.marketplace.searchForProductsBrandsOrStores"
            placeholderTextColor={tokens.placeholder}
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
          {query.length > 0 ? (
            <Pressable
              accessibilityLabel={t('accessibility.clearSearch')}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setQuery('')}
              style={styles.clearSearch}
            >
              <Ionicons color={tokens.textMuted} name="close-circle" size={20} />
            </Pressable>
          ) : null}
        </View>

        {normalizedQuery ? (
          <View style={styles.searchResults}>
            {hasSearchResults ? (
              <>
                {searchStores.length > 0 ? (
                  <>
                    <SectionHeader title="__hupi_i18n:marketplace.marketplace.storesFound" hint={`${searchStores.length} resultados`} />
                    <ScrollView contentContainerStyle={styles.storeRow} horizontal showsHorizontalScrollIndicator={false}>
                      {searchStores.map((store) => (
                        <OfficialStoreCard
                          category={store.category}
                          isOfficialStore={store.isOfficialStore}
                          isVerifiedByHupi={store.isVerifiedByHupi}
                          key={store.id}
                          logo={store.logo}
                          name={store.name}
                          onPress={() => router.push(`/marketplace/official-store?storeId=${store.id}` as Href)}
                          productCount={store.productCount}
                          rating={store.rating}
                        />
                      ))}
                    </ScrollView>
                  </>
                ) : null}
                {searchProducts.length > 0 ? (
                  <>
                    <SectionHeader title="__hupi_i18n:marketplace.marketplace.productsFound" hint={`${searchProducts.length} resultados`} />
                    <View style={styles.grid}>
                      {searchProducts.map((product) => {
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
                            onAdd={() => addProductToMockCart(display.priceCurrent)}
                            onOpen={() => openProduct(product.id)}
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
                  </>
                ) : null}
              </>
            ) : (
              <View style={styles.emptySearch}>
                <Ionicons color={colors.primary} name="search-outline" size={24} />
                <Text style={styles.emptySearchText}>__hupi_i18n:marketplace.marketplace.weFoundNoResultsForThisSearch</Text>
              </View>
            )}
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.bannerRow} horizontal showsHorizontalScrollIndicator={false}>
              {marketplaceBanners.map((banner) => (
                <MarketplaceBanner
                  accent={banner.accent ?? '🐾'}
                  backgroundColor={banner.backgroundColor ?? colors.primary}
                  eyebrow={banner.eyebrow ?? 'HUPI'}
                  key={banner.id}
                  subtitle={banner.subtitle}
                  title={banner.title}
                />
              ))}
            </ScrollView>

            <SectionHeader
              hint={`${products.length} productos`}
              onViewAll={() => router.push(`/marketplace/category?category=${encodeURIComponent(category)}` as Href)}
              title="__hupi_i18n:common.categories"
            />
            <ScrollView contentContainerStyle={styles.categories} horizontal showsHorizontalScrollIndicator={false}>
              {[{ id: 'all', name: 'Todo', icon: 'apps-outline', emoji: '🛍️', color: '#fff0ec' }, ...mockProductCategories].map((item) => (
                <CategoryCard
                  active={category === item.name}
                  color={item.color}
                  emoji={item.emoji}
                  icon={item.icon}
                  key={item.id}
                  name={item.name}
                  onPress={() => setCategory(item.name)}
                />
              ))}
            </ScrollView>

            <SectionHeader
              subtitle="__hupi_i18n:marketplace.marketplace.officialBrandsValidatedByHupi"
              onViewAll={() => router.push('/marketplace/all-stores?type=official' as Href)}
              title="__hupi_i18n:marketplace.marketplace.officialStores"
            />
            <ScrollView contentContainerStyle={styles.storeRow} horizontal showsHorizontalScrollIndicator={false}>
              {officialStores.map((store) => (
                <OfficialStoreCard
                  category={store.category}
                  isOfficialStore={store.isOfficialStore}
                  isVerifiedByHupi={store.isVerifiedByHupi}
                  key={store.id}
                  logo={store.logo}
                  name={store.name}
                  onPress={() => router.push(`/marketplace/official-store?storeId=${store.id}` as Href)}
                  productCount={store.productCount}
                  rating={store.rating}
                />
              ))}
            </ScrollView>

            <SectionHeader
              subtitle="__hupi_i18n:marketplace.marketplace.storesValidatedToSellOnHupi"
              onViewAll={() => router.push('/marketplace/all-stores?type=verified' as Href)}
              title="__hupi_i18n:marketplace.marketplace.verifiedStores"
            />
            <ScrollView contentContainerStyle={styles.storeRow} horizontal showsHorizontalScrollIndicator={false}>
              {verifiedStores.map((store) => (
                <OfficialStoreCard
                  category={store.category}
                  isOfficialStore={store.isOfficialStore}
                  isVerifiedByHupi={store.isVerifiedByHupi}
                  key={store.id}
                  logo={store.logo}
                  name={store.name}
                  onPress={() => router.push(`/marketplace/official-store?storeId=${store.id}` as Href)}
                  productCount={store.productCount}
                  rating={store.rating}
                />
              ))}
            </ScrollView>

            <SectionHeader
              hint="Descuentos"
              onViewAll={() => router.push('/marketplace/all-products?type=offers' as Href)}
              title="__hupi_i18n:common.offers"
            />
            <View style={styles.grid}>
              {offers.slice(0, 4).map((product) => {
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
                    onAdd={() => addProductToMockCart(display.priceCurrent)}
                    onOpen={() => openProduct(product.id)}
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

            <SectionHeader
              hint="Hupi picks"
              onViewAll={() => router.push('/marketplace/all-products?type=recommended' as Href)}
              title="__hupi_i18n:marketplace.marketplace.featuredProducts"
            />
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
                    onAdd={() => addProductToMockCart(display.priceCurrent)}
                    onOpen={() => openProduct(product.id)}
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
          </>
        )}
      </ScrollView>

      {toastVisible ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            { bottom: floatingTabTopEdge + 88 },
            {
              opacity: toastAnim,
              transform: [{
                translateY: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              }],
            },
          ]}
        >
          <Ionicons color={colors.white} name="checkmark-circle" size={18} />
          <Text style={styles.toastText}>__hupi_i18n:marketplace.marketplace.productAddedToCart</Text>
        </Animated.View>
      ) : null}
      <QuickCartBar
        bottomOffset={floatingTabTopEdge + 12}
        count={cartCount}
        includeSafeArea={false}
        onBuyPress={() => router.push('/marketplace/checkout')}
        onCartPress={() => router.push('/marketplace/cart')}
        total={cartTotal}
        variant="floatingCompact"
      />
      <MarketplacePromoModal
        onClose={() => setPromoVisible(false)}
        onRewardSaved={(reward) => {
          setPromoSavedNotice(`Tu beneficio "${reward.title}" fue guardado para usarlo luego.`);
        }}
        rewards={mockPromoRewards}
        visible={promoVisible}
      />
      <ProviderReviewPromptModal
        onClose={() => {
          clearProviderReviewPromptState();
          setProviderReviewPrompt((current) => ({ ...current, active: false }));
          setProviderPromptVisible(false);
        }}
        providerName={providerReviewPrompt.active ? providerReviewPrompt.providerName : mockProviderReviewPrompt.providerName}
        tags={mockProviderReviewPrompt.tags}
        visible={!promoVisible && providerPromptVisible && providerReviewPrompt.active}
      />
    </ScreenContainer>
  );
}

function SectionHeader({
  hint,
  onViewAll,
  subtitle,
  title,
}: {
  hint?: string;
  onViewAll?: () => void;
  subtitle?: string;
  title: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      {onViewAll ? (
        <Pressable accessibilityRole="button" onPress={onViewAll} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>__hupi_i18n:common.seeAll2</Text>
          <Ionicons color={colors.primary} name="chevron-forward" size={14} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 0 },
  content: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 168 },
  header: { gap: 12 },
  headerCopy: { minWidth: 0 },
  eyebrow: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 31, lineHeight: 39, fontWeight: '900', marginTop: 2 },
  headerActionsScroll: { marginHorizontal: -2, overflow: 'visible' },
  headerActions: { alignItems: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 2, paddingRight: 8 },
  walletShortcut: { height: 40, borderRadius: 14, backgroundColor: colors.secondarySoft, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, flexShrink: 0 },
  walletShortcutText: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', lineHeight: 15 },
  couponShortcut: { height: 40, maxWidth: 132, minWidth: 102, borderRadius: 14, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 7, flexShrink: 0 },
  couponShortcutActive: { backgroundColor: colors.primary },
  couponShortcutText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 11.5, fontWeight: '900', lineHeight: 15, flexShrink: 1, minWidth: 0 },
  couponShortcutTextActive: { color: colors.white },
  couponPanel: { borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: 12, shadowColor: '#3f2d25', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  search: {
    minHeight: 52,
    borderRadius: 17,
    backgroundColor: colors.soft,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    marginTop: 22,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    letterSpacing: 0,
    lineHeight: 22,
    minWidth: 0,
    paddingVertical: 0,
  },
  clearSearch: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  couponInputRow: { flexDirection: 'row', gap: 8 },
  couponInput: { flex: 1, minHeight: 42, borderRadius: 14, borderWidth: 1, borderColor: colors.border, color: colors.text, fontFamily: fonts.medium, paddingHorizontal: 12, fontSize: 15, fontWeight: '800' },
  applyCouponButton: { minHeight: 42, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  applyCouponText: { color: colors.white, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  couponNotice: { color: colors.primary, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900', marginTop: 8 },
  couponNoticeError: { color: colors.danger },
  bannerRow: { paddingTop: 18, paddingRight: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 26, marginBottom: 13 },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 18, fontWeight: '900', lineHeight: 24 },
  sectionSubtitle: { color: colors.textMuted, flexShrink: 1, fontFamily: fonts.regular, fontSize: 14, fontWeight: '700', lineHeight: 20, marginTop: 3 },
  sectionHint: { color: colors.primary, flexShrink: 1, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  viewAllButton: { minHeight: 30, borderRadius: 999, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 10 },
  viewAllText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  categories: { gap: 10, paddingRight: 20 },
  storeRow: { paddingRight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  searchResults: { marginTop: 4 },
  emptySearch: { minHeight: 130, borderRadius: 20, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center', gap: 9, padding: 18, marginTop: 18 },
  emptySearchText: { color: colors.text, fontFamily: fonts.medium, fontSize: 15, lineHeight: 22, fontWeight: '800', textAlign: 'center' },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  toastText: { color: colors.white, fontSize: 15, fontWeight: '900' },
});
