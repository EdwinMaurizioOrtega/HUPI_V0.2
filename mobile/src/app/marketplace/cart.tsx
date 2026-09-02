import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useRouter } from 'expo-router';
import {
  useMemo,
  useState,
} from 'react';
import {
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HupiSuccessModal } from '@/components/HupiSuccessModal';
import { PageHeader } from '@/components/PageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { CartItemCard } from '@/components/marketplace/CartItemCard';
import { OrderSummaryCard } from '@/components/marketplace/OrderSummaryCard';
import { colors } from '@/constants/colors';
import {
  getMarketplaceItemAvailability,
  getMarketplaceProductForCart,
  saveMockMarketplaceCartItems,
  validateMarketplaceCartItems,
} from '@/constants/marketplaceStoreState';
import { mockCart } from '@/constants/mockData';
import {
  getUnavailableMarketplaceCartItemIds,
  removeUnavailableMarketplaceCartItems,
} from '@/domain/marketplaceAvailability';
import { Text } from '@/i18n/components';

export default function MarketplaceCartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [items, setItems] = useState(() => mockCart.items.map((item) => ({ ...item })));
  const [cartModal, setCartModal] = useState<{ description: string; reference?: string; title: string } | null>(null);

  const cartProducts = useMemo(() => items.map((item) => ({
    ...item,
    availability: getMarketplaceItemAvailability(item),
    product: getMarketplaceProductForCart(item.productId),
  })), [items]);
  const cartValidation = useMemo(() => validateMarketplaceCartItems(items), [items]);
  const unavailableItemIds = useMemo(
    () => getUnavailableMarketplaceCartItemIds(cartValidation.issues),
    [cartValidation.issues],
  );
  const hasQuantityIssues = cartValidation.issues.some((issue) => issue.type === 'quantity_exceeds_stock');

  const subtotal = cartProducts.reduce(
    (total, item) => total + item.availability.price * item.quantity,
    0,
  );
  const shipping = cartProducts.length > 0 ? mockCart.shipping : 0;
  const discount = cartProducts.length > 0 ? mockCart.discount : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const commitItems = (nextItems: typeof items) => {
    saveMockMarketplaceCartItems(nextItems);
    setItems(nextItems);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    const item = cartProducts.find((cartItem) => cartItem.id === itemId);

    if (item && quantity > item.quantity && item.availability.stock > 0 && quantity > item.availability.stock) {
      setCartModal({
        title: 'Stock insuficiente',
        description: `Solo hay ${item.availability.stock} unidades disponibles de este producto.`,
      });
      return;
    }

    commitItems(items.map((item) => (
      item.id === itemId ? { ...item, quantity } : item
    )));
  };

  const adjustItemToStock = (itemId: string) => {
    const item = cartProducts.find((cartItem) => cartItem.id === itemId);
    if (!item || item.availability.stock <= 0) {
      return;
    }

    commitItems(items.map((cartItem) => (
      cartItem.id === itemId ? { ...cartItem, quantity: item.availability.stock } : cartItem
    )));
    setCartModal({
      title: 'Cantidad ajustada',
      description: 'Actualizamos la cantidad al stock disponible.',
    });
  };

  const removeItem = (itemId: string) => {
    commitItems(items.filter((item) => item.id !== itemId));
  };

  const removeUnavailableItems = () => {
    const nextItems = removeUnavailableMarketplaceCartItems(items, cartValidation.issues);

    if (nextItems.length === items.length) {
      return;
    }

    commitItems(nextItems);
    setCartModal({
      title: t('marketplace.cartUpdatedTitle'),
      description: t('marketplace.cartUpdatedDescription'),
    });
  };

  const adjustAvailableQuantities = () => {
    const quantityIssueIds = new Set(
      cartValidation.issues
        .filter((issue) => issue.type === 'quantity_exceeds_stock')
        .map((issue) => issue.itemId),
    );
    const nextItems = items.map((item) => {
      if (!quantityIssueIds.has(item.id)) {
        return item;
      }

      const availability = getMarketplaceItemAvailability(item);
      return availability.stock > 0
        ? { ...item, quantity: availability.stock }
        : item;
    });

    commitItems(nextItems);
    setCartModal({
      title: t('marketplace.cartUpdatedTitle'),
      description: t('marketplace.cartQuantitiesAdjustedDescription'),
    });
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content} scroll={false}>
      <PageHeader
        onBack={() => router.back()}
        style={styles.topbar}
        subtitle={t('marketplace.cartProductCount', { count: cartProducts.length })}
        title="__hupi_i18n:common.cart"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

      {cartProducts.length > 0 && !cartValidation.valid ? (
        <Card style={styles.problemCard}>
          <View style={styles.problemHeader}>
            <View style={styles.problemIcon}>
              <Ionicons color={colors.primary} name="alert-circle-outline" size={20} />
            </View>
            <View style={styles.problemCopy}>
              <Text style={styles.problemTitle}>__hupi_i18n:marketplace.cart.checkYourCart</Text>
              <Text style={styles.problemIntro}>__hupi_i18n:marketplace.cart.youCannotContinueBecauseThereAreProductsOutOf</Text>
            </View>
          </View>
          <View style={styles.problemList}>
            {cartValidation.issues.map((issue) => (
              <Text key={`${issue.itemId}-${issue.type}`} style={styles.problemText}>
                • {issue.productName}: {issue.message}
              </Text>
            ))}
          </View>
        </Card>
      ) : null}

      {cartProducts.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons color={colors.secondary} name="bag-handle-outline" size={26} />
          </View>
          <Text style={styles.emptyTitle}>__hupi_i18n:marketplace.cart.yourCartIsEmpty</Text>
          <Text style={styles.emptyText}>__hupi_i18n:marketplace.cart.addProductsFromTheMarketplaceToContinue</Text>
          <Button icon="storefront-outline" onPress={() => router.push('/marketplace')} title="__hupi_i18n:marketplace.cart.returnToMarketplace" />
        </Card>
      ) : null}

      {cartProducts.length > 0 ? <View style={styles.items}>
        {cartProducts.map((item) => {
          const itemIssues = cartValidation.issues.filter((issue) => issue.itemId === item.id);
          const unavailable = itemIssues.some((issue) => issue.type === 'product_unavailable' || issue.type === 'variation_unavailable');
          const quantityIssue = itemIssues.some((issue) => issue.type === 'quantity_exceeds_stock');

          return (
            <CartItemCard
              availabilityLabel={unavailable ? 'No disponible' : quantityIssue ? 'Cantidad mayor al stock disponible' : 'Disponible'}
              availabilityStatus={unavailable ? 'unavailable' : quantityIssue ? 'warning' : 'available'}
              brand={item.product.brand}
              emoji={item.product.emoji}
              key={item.id}
              maxQuantity={item.availability.stock}
              name={item.product.name}
              onAdjustToStock={() => adjustItemToStock(item.id)}
              onMaxExceeded={(max) => setCartModal({
                title: 'Stock insuficiente',
                description: `Solo hay ${max} unidades disponibles de este producto.`,
              })}
              onQuantityChange={(quantity) => updateQuantity(item.id, quantity)}
              onRemove={() => removeItem(item.id)}
              quantity={item.quantity}
              stockLabel={`Stock disponible: ${item.availability.stock}`}
              storeName={item.availability.storeName}
              unitPrice={item.availability.price}
              unavailable={unavailable}
              variation={item.availability.variationName}
            />
          );
        })}
      </View> : null}

      {cartProducts.length > 0 ? (
        <OrderSummaryCard
          discount={discount}
          shipping={shipping}
          subtotal={subtotal}
          total={total}
        />
      ) : null}

      <Card style={styles.notice} tone="soft">
        <Ionicons color={colors.secondary} name="information-circle-outline" size={20} />
        <Text style={styles.noticeText}>__hupi_i18n:marketplace.cart.cartInTestModeNoActualStockIsReserved</Text>
      </Card>

      <View style={styles.actions}>
        {cartProducts.length > 0 ? (
          <Button
            disabled={!cartValidation.valid}
            icon="card-outline"
            onPress={() => router.push('/marketplace/checkout')}
            title="__hupi_i18n:common.goToPay"
          />
        ) : null}
        {unavailableItemIds.length > 0 ? (
          <Button
            icon="trash-outline"
            onPress={removeUnavailableItems}
            title={t('marketplace.removeUnavailableProducts')}
            variant="outline"
          />
        ) : null}
        {unavailableItemIds.length === 0 && hasQuantityIssues ? (
          <Button
            icon="options-outline"
            onPress={adjustAvailableQuantities}
            title={t('marketplace.adjustAvailableQuantities')}
            variant="outline"
          />
        ) : null}
        {cartProducts.length > 0 ? (
          <Button icon="bag-handle-outline" onPress={() => router.push('/marketplace')} title="__hupi_i18n:common.continueShopping" variant="outline" />
        ) : null}
      </View>
      </ScrollView>
      <HupiSuccessModal
        description={cartModal?.description ?? ''}
        onClose={() => setCartModal(null)}
        reference={cartModal?.reference}
        title={cartModal?.title ?? ''}
        visible={Boolean(cartModal)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 0 },
  scrollContent: { flexGrow: 1, padding: 20, paddingTop: 8 },
  topbar: { paddingHorizontal: 20, paddingTop: 8 },
  items: { gap: 12, marginBottom: 16 },
  emptyCard: { alignItems: 'center', gap: 11, marginTop: 28, shadowOpacity: 0.04 },
  emptyIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.secondarySoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.text, fontSize: 19, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 13, lineHeight: 22, fontWeight: '800', textAlign: 'center' },
  problemCard: { gap: 10, marginBottom: 16, backgroundColor: colors.primarySoft, shadowOpacity: 0 },
  problemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  problemIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  problemCopy: { flex: 1, minWidth: 0 },
  problemTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  problemIntro: { color: colors.textMuted, fontSize: 12, lineHeight: 18, fontWeight: '800', marginTop: 2 },
  problemList: { gap: 4, paddingLeft: 2 },
  problemText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, shadowOpacity: 0 },
  noticeText: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '700' },
  actions: { gap: 10, marginTop: 20 },
});
