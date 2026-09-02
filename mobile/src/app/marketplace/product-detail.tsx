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
  useWindowDimensions,
} from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HupiPagesLogo } from '@/components/HupiPagesLogo';
import { HupiSuccessModal } from '@/components/HupiSuccessModal';
import { IconButton } from '@/components/IconButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ProductPriceBlock } from '@/components/marketplace/ProductPriceBlock';
import { QuickCartBar } from '@/components/marketplace/QuickCartBar';
import { QuantitySelector } from '@/components/marketplace/QuantitySelector';
import { colors } from '@/constants/colors';
import { Pressable, Text, TextInput } from '@/i18n/components';
import {
  canReviewProduct,
  mockCartSummary,
  mockCustomerOrders,
  mockProductReviews,
  mockReviewTags,
  type MockProductReview,
} from '@/constants/mockData';
import {
  getProductDisplayPrice,
  getProductImages,
  getMarketplaceItemAvailability,
  getProductRichVariations,
  getPublicMarketplaceProduct,
  getPublicStoreInfo,
  type ProductVariationGroup,
} from '@/constants/marketplaceStoreState';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const product = useMemo(
    () => getPublicMarketplaceProduct(productId),
    [productId],
  );
  const [quantity, setQuantity] = useState(1);
  const richVariations = useMemo(() => getProductRichVariations(product), [product]);
  const productImages = useMemo(() => getProductImages(product), [product]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<Record<string, string>>(() => (
    Object.fromEntries(richVariations.map((group) => {
      const firstAvailableOption = group.options.find((option) => option.status === 'Activa' && option.stock > 0);
      return [group.id, firstAvailableOption?.id ?? group.options[0]?.id ?? ''];
    }))
  ));
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewFeedback, setReviewFeedback] = useState(false);
  const [reviewSuccessModalVisible, setReviewSuccessModalVisible] = useState(false);
  const [localReviews, setLocalReviews] = useState<MockProductReview[]>(mockProductReviews);
  const [cartCount, setCartCount] = useState(mockCartSummary.count);
  const [cartTotal, setCartTotal] = useState(mockCartSummary.total);
  const [cartFeedback, setCartFeedback] = useState(false);
  const [stockModal, setStockModal] = useState<{ description: string; title: string } | null>(null);
  const productReviews = localReviews.filter((review) => review.productId === product.id);
  const averageRating = productReviews.length > 0
    ? productReviews.reduce((total, review) => total + review.rating, 0) / productReviews.length
    : Number(product.rating) || 0;
  const reviewState = canReviewProduct(product.id, mockCustomerOrders, localReviews);
  const seller = getPublicStoreInfo(product.storeId);
  const sellerName = seller?.name ?? product.storeName;
  const sellerRating = seller?.providerRating ?? product.rating;
  const sellerReviews = seller?.providerReviewsCount ?? 42;
  const sellerOrders = seller?.completedOrders ?? 80;
  const displayPrice = getProductDisplayPrice(product, selectedOptionIds);
  const availability = getMarketplaceItemAvailability({
    id: 'product-detail',
    productId: product.id,
    quantity,
    variationId: displayPrice.variation?.id,
  }, selectedOptionIds);
  const inStock = availability.available && quantity <= availability.stock;
  const selectedImage = productImages.find((image) => image.id === selectedImageId)
    ?? productImages.find((image) => image.isPrimary)
    ?? productImages[0];
  const combinationUnavailable = 'productType' in product
    && product.productType === 'variable'
    && richVariations.length > 0
    && displayPrice.variation === null;
  const heroHeight = Math.min(
    Math.max((Math.min(windowWidth, 560) - 40) * 0.78, 220),
    360,
  );

  const shareProductMock = () => {
    // TODO: Integrar Share API de React Native para compartir por WhatsApp, redes, mensaje o copiar enlace.
    Alert.alert("__hupi_i18n:common.shareProduct", "__hupi_i18n:common.soonYouWillBeAbleToSendThisProduct");
  };

  const toggleReviewTag = (tag: string) => {
    setSelectedTags((currentTags) => (
      currentTags.includes(tag)
        ? currentTags.filter((item) => item !== tag)
        : [...currentTags, tag]
    ));
  };

  const sendReviewMock = () => {
    if (!reviewState.canReview || !reviewState.order) {
      return;
    }

    const now = new Date();
    const dateLabel = `${String(now.getDate()).padStart(2, '0')} Jul 2026`;
    const nextReview: MockProductReview = {
      id: `review-local-${Date.now()}`,
      productId: product.id,
      customerName: 'Ana Morales',
      rating: reviewRating,
      date: dateLabel,
      createdAt: now.toISOString().slice(0, 10),
      comment: reviewComment.trim() || 'Buena experiencia de compra en Hupi.',
      tags: selectedTags,
      verifiedPurchase: true,
      orderNumber: reviewState.order.orderNumber,
    };

    setLocalReviews((currentReviews) => [nextReview, ...currentReviews]);
    setReviewFeedback(true);
    setReviewSuccessModalVisible(true);
    setReviewComment('');
    setSelectedTags([]);
    setReviewRating(5);
  };

  const addProductMock = () => {
    if (!inStock) {
      return;
    }

    setCartCount((value) => value + quantity);
    setCartTotal((value) => Number((value + (displayPrice.priceCurrent * quantity)).toFixed(2)));
    setCartFeedback(true);
  };

  const updateProductQuantity = (nextQuantity: number) => {
    if (availability.stock > 0 && nextQuantity > availability.stock) {
      setStockModal({
        title: 'Stock insuficiente',
        description: `Solo hay ${availability.stock} unidades disponibles de este producto.`,
      });
      return;
    }

    setQuantity(nextQuantity);
  };

  return (
    <ScreenContainer contentContainerStyle={styles.screen} scroll={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topbar}>
        <IconButton
          accessibilityLabel="__hupi_i18n:common.back"
          icon="arrow-back"
          iconColor={colors.text}
          iconSize={22}
          onPress={() => router.back()}
          size={42}
        />
        <HupiPagesLogo height={42} width={132} />
        <IconButton
          accessibilityLabel="__hupi_i18n:common.openCart"
          badge={cartCount}
          backgroundColor={colors.secondarySoft}
          icon="cart-outline"
          iconColor={colors.secondary}
          iconSize={22}
          onPress={() => router.push('/marketplace/cart')}
          size={42}
        />
      </View>

      <View style={[styles.hero, { backgroundColor: product.color, height: heroHeight }]}>
        {/* Seed products use centered emoji placeholders until catalog image URLs are available. */}
        <Text style={styles.emoji}>{selectedImage?.emoji ?? product.emoji}</Text>
        {displayPrice.discount > 0 ? (
          <View style={styles.discount}><Text style={styles.discountText}>-{displayPrice.discount}%</Text></View>
        ) : null}
        {!inStock ? <View style={styles.stockBadge}><Text style={styles.stockBadgeText}>__hupi_i18n:common.outOfStock</Text></View> : null}
      </View>

      {productImages.length > 1 ? (
        <ScrollView contentContainerStyle={styles.galleryRow} horizontal showsHorizontalScrollIndicator={false}>
          {productImages.map((image) => {
            const active = (selectedImage?.id ?? '') === image.id;

            return (
              <Pressable
                accessibilityLabel={`${product.name} ${image.id}`}
                accessibilityRole="button"
                key={image.id}
                onPress={() => setSelectedImageId(image.id)}
                style={[styles.galleryThumb, active && styles.galleryThumbActive]}
              >
                <Text style={styles.galleryEmoji}>{image.emoji}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <Text style={styles.category}>{product.category.toUpperCase()}</Text>
      <Text style={styles.title}>{product.name}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.brandName}>{product.brand}</Text>
        <View style={styles.rating}>
          <Ionicons color={colors.warning} name="star" size={14} />
          <Text style={styles.ratingText}>{product.rating}</Text>
        </View>
      </View>

      <Pressable
        accessibilityLabel="__hupi_i18n:common.shareProduct"
        accessibilityRole="button"
        hitSlop={8}
        onPress={shareProductMock}
        style={styles.shareProductButton}
      >
        <Ionicons color={colors.secondary} name="share-social-outline" size={18} />
        <Text style={styles.shareProductText}>__hupi_i18n:common.shareProduct</Text>
      </Pressable>

      <Card style={styles.priceCard}>
        <ProductPriceBlock
          cardPrice={displayPrice.priceCurrent}
          discount={displayPrice.discount}
          priceBefore={displayPrice.priceBefore}
          transferDiscount={displayPrice.transferDiscount}
          transferPrice={displayPrice.transferPrice}
          transferPriceBefore={displayPrice.transferPriceBefore}
        />
        {combinationUnavailable ? (
          <Text style={styles.stockTextDanger}>__hupi_i18n:marketplace.product-detail.thisCombinationIsNotAvailable</Text>
        ) : null}
        <Text style={[styles.stockText, !inStock && styles.stockTextDanger]}>
          {inStock ? `Stock disponible: ${displayPrice.stock}` : 'Producto no disponible por el momento.'}
        </Text>
      </Card>

      <Card style={styles.sellerCard}>
        <View style={styles.sellerIcon}>
          <Ionicons color={colors.secondary} name="storefront-outline" size={22} />
        </View>
        <View style={styles.sellerCopy}>
          <Text style={styles.sellerLabel}>__hupi_i18n:common.soldBy</Text>
          <View style={styles.sellerNameRow}>
            <Text numberOfLines={1} style={styles.sellerName}>{sellerName}</Text>
            {product.isOfficialStore || product.isVerifiedByHupi ? (
              <View style={styles.sellerCheck}>
                <Ionicons color={colors.white} name="checkmark" size={10} />
              </View>
            ) : null}
          </View>
          <Text style={styles.sellerMeta}>★ {sellerRating} · {sellerReviews}  __hupi_i18n:common.reviews2 {sellerOrders}  __hupi_i18n:common.orders</Text>
          <View style={styles.sellerBadges}>
            {product.isVerifiedByHupi ? (
              <View style={styles.verifiedBadge}>
                <Ionicons color={colors.success} name="checkmark-circle" size={13} />
                <Text style={styles.verifiedText}>__hupi_i18n:common.verifiedByHupi</Text>
              </View>
            ) : null}
            {product.isOfficialStore ? (
              <View style={styles.officialBadge}>
                <Text style={styles.officialText}>__hupi_i18n:common.officialStore</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Card>

      <View style={styles.selectorRow}>
        <View style={styles.selectorCopy}>
          <Text style={styles.sectionTitle}>__hupi_i18n:common.quantity2</Text>
          <Text style={styles.sectionHint}>__hupi_i18n:marketplace.product-detail.purchaseInTrialModeWithoutRealStock</Text>
        </View>
        <QuantitySelector
          max={availability.stock}
          onChange={updateProductQuantity}
          onMaxExceeded={(max) => setStockModal({
            title: 'Stock insuficiente',
            description: `Solo hay ${max} unidades disponibles de este producto.`,
          })}
          quantity={quantity}
        />
      </View>

      {richVariations.map((group) => (
        <VariationSelector
          group={group}
          key={group.id}
          onSelect={(optionId) => setSelectedOptionIds((current) => ({ ...current, [group.id]: optionId }))}
          selectedOptionId={selectedOptionIds[group.id] ?? group.options[0]?.id ?? ''}
        />
      ))}

      <Card style={styles.infoCard}>
        <Text style={styles.sectionTitle}>__hupi_i18n:common.description</Text>
        <Text style={styles.description}>{product.description}</Text>
        <Text style={styles.sectionTitle}>__hupi_i18n:common.benefits</Text>
        {product.benefits.map((benefit) => (
          <View key={benefit} style={styles.benefitRow}>
            <Ionicons color={colors.primary} name="checkmark-circle" size={16} />
            <Text style={styles.benefit}>{benefit}</Text>
          </View>
        ))}
        <View style={styles.shippingBox}>
          <Ionicons color={colors.secondary} name="cube-outline" size={20} />
          <Text style={styles.shippingText}>{product.shipping}</Text>
        </View>
      </Card>

      <Card style={styles.reviewsCard}>
        <View style={styles.verifiedReviewsIntro}>
          <View style={styles.verifiedReviewsIcon}>
            <Ionicons color={colors.success} name="checkmark-circle" size={18} />
          </View>
          <View style={styles.verifiedReviewsCopy}>
            <Text style={styles.verifiedReviewsTitle}>__hupi_i18n:marketplace.product-detail.verifiedPurchaseReviews</Text>
            <Text style={styles.verifiedReviewsText}>__hupi_i18n:marketplace.product-detail.theseOpinionsBelongToTutorsWhoBoughtThisProduct</Text>
          </View>
        </View>
        <View style={styles.reviewsHeader}>
          <View>
            <Text style={styles.sectionTitle}>__hupi_i18n:marketplace.product-detail.productReviews</Text>
            <Text style={styles.reviewSummary}>{averageRating.toFixed(1)}  __hupi_i18n:common.outOf5 {productReviews.length}  __hupi_i18n:common.reviews</Text>
          </View>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                color={star <= Math.round(averageRating) ? colors.warning : colors.border}
                key={star}
                name="star"
                size={14}
              />
            ))}
          </View>
        </View>
        <Text style={styles.trustCopy}>__hupi_i18n:marketplace.product-detail.atHupiWeTakeCareThatTheReviewsAre</Text>
        <View style={styles.ratingDistribution}>
          {[5, 4, 3].map((star) => (
            <View key={star} style={styles.distributionRow}>
              <Text style={styles.distributionLabel}>{star}★</Text>
              <View style={styles.distributionTrack}>
                <View style={[styles.distributionFill, { width: `${star === 5 ? 74 : star === 4 ? 42 : 18}%` }]} />
              </View>
            </View>
          ))}
        </View>
        {productReviews.map((review) => (
          <View key={review.id} style={styles.reviewItem}>
            <View style={styles.reviewTop}>
              <Text style={styles.reviewName}>{review.customerName}</Text>
              <Text style={styles.reviewDate}>{review.date}</Text>
            </View>
            <View style={styles.reviewRatingRow}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    color={star <= review.rating ? colors.warning : colors.border}
                    key={star}
                    name="star"
                    size={12}
                  />
                ))}
              </View>
              {review.verifiedPurchase ? (
                <View style={styles.verifiedPurchaseBadge}>
                  <Ionicons color={colors.success} name="checkmark-circle" size={12} />
                  <Text style={styles.verifiedPurchaseText}>__hupi_i18n:marketplace.product-detail.verifiedPurchase</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.reviewComment}>{review.comment}</Text>
            <View style={styles.reviewTags}>
              {review.tags.map((tag) => (
                <Text key={tag} style={styles.reviewTag}>{tag}</Text>
              ))}
            </View>
          </View>
        ))}
        {productReviews.length === 0 ? <Text style={styles.emptyReviewsText}>__hupi_i18n:marketplace.product-detail.thisProductDoesNotYetHaveVerifiedReviews</Text> : null}
      </Card>

      <Card style={styles.rateCard} tone="soft">
        {reviewState.canReview ? (
          <>
            <Text style={styles.sectionTitle}>__hupi_i18n:marketplace.product-detail.rateThisProduct</Text>
            <View style={styles.rateStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setReviewRating(star)}>
                  <Ionicons
                    color={star <= reviewRating ? colors.warning : colors.textMuted}
                    name={star <= reviewRating ? 'star' : 'star-outline'}
                    size={25}
                  />
                </Pressable>
              ))}
            </View>
            <TextInput
              multiline
              onChangeText={setReviewComment}
              placeholder="__hupi_i18n:common.optionalComment"
              placeholderTextColor={colors.textMuted}
              style={styles.reviewInput}
              value={reviewComment}
            />
            <View style={styles.selectableTags}>
              {mockReviewTags.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <Pressable key={tag} onPress={() => toggleReviewTag(tag)} style={[styles.selectableTag, active && styles.activeSelectableTag]}>
                    <Text style={[styles.selectableTagText, active && styles.activeSelectableTagText]}>{tag}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Button icon="send-outline" onPress={sendReviewMock} title="__hupi_i18n:common.submitReview" />
          </>
        ) : (
          <ReviewGateCard
            reason={reviewFeedback ? 'sent' : getBlockedReviewReason(reviewState.reason)}
          />
        )}
        {reviewFeedback ? <Text style={styles.reviewFeedback}>__hupi_i18n:marketplace.product-detail.yourReviewWasSuccessfullySubmitted</Text> : null}
      </Card>

      <View style={styles.actions}>
        <Button disabled={!inStock} icon="cart-outline" onPress={addProductMock} title={inStock ? 'Agregar al carrito' : 'Sin stock'} variant="outline" />
        <Button
          disabled={!inStock}
          icon="flash-outline"
          onPress={() => router.push(`/marketplace/checkout?productId=${product.id}&quantity=${quantity}${availability.variation?.id ? `&variationId=${availability.variation.id}` : ''}` as Href)}
          title={inStock ? 'Comprar ahora' : 'No disponible'}
        />
      </View>
      {cartFeedback ? <Text style={styles.cartFeedback}>__hupi_i18n:marketplace.marketplace.productAddedToCart</Text> : null}
      </ScrollView>
      <QuickCartBar
        count={cartCount}
        onBuyPress={() => router.push(`/marketplace/checkout?productId=${product.id}&quantity=${quantity}${availability.variation?.id ? `&variationId=${availability.variation.id}` : ''}` as Href)}
        onCartPress={() => router.push('/marketplace/cart')}
        total={cartTotal}
      />
      <HupiSuccessModal
        description="__hupi_i18n:marketplace.product-detail.thankYouForSharingYourExperienceWithThisProduct"
        onClose={() => setReviewSuccessModalVisible(false)}
        title="__hupi_i18n:common.reviewSubmitted"
        visible={reviewSuccessModalVisible}
      />
      <HupiSuccessModal
        description={stockModal?.description ?? ''}
        onClose={() => setStockModal(null)}
        title={stockModal?.title ?? ''}
        visible={Boolean(stockModal)}
      />
    </ScreenContainer>
  );
}

function ReviewGateCard({ reason }: { reason: 'already_reviewed' | 'not_delivered' | 'not_purchased' | 'sent' }) {
  if (reason === 'already_reviewed' || reason === 'sent') {
    return (
      <View style={styles.reviewGate}>
        <Text style={styles.reviewGateTitle}>__hupi_i18n:marketplace.order-detail.youHaveAlreadyRatedThisProduct</Text>
        <Text style={styles.reviewGateText}>__hupi_i18n:marketplace.order-detail.thankYouForHelpingOtherTutorsWithYourExperience</Text>
      </View>
    );
  }

  if (reason === 'not_delivered') {
    return (
      <View style={styles.reviewGate}>
        <Text style={styles.reviewGateTitle}>__hupi_i18n:marketplace.product-detail.youWillBeAbleToQualifySoon</Text>
        <Text style={styles.reviewGateText}>__hupi_i18n:marketplace.product-detail.whenYourOrderIsDeliveredYouCanLeaveYour</Text>
      </View>
    );
  }

  return (
    <View style={styles.reviewGate}>
      <Text style={styles.reviewGateTitle}>__hupi_i18n:common.purchaseRequired</Text>
      <Text style={styles.reviewGateText}>__hupi_i18n:marketplace.product-detail.youMustPurchaseThisProductToLeaveARating</Text>
      <Text style={styles.reviewGateMuted}>__hupi_i18n:marketplace.product-detail.thisIsHowWeMaintainRealAndReliableReviews</Text>
    </View>
  );
}

function getBlockedReviewReason(reason: 'already_reviewed' | 'eligible' | 'not_delivered' | 'not_purchased') {
  return reason === 'eligible' ? 'not_purchased' : reason;
}

function VariationSelector({
  group,
  onSelect,
  selectedOptionId,
}: {
  group: ProductVariationGroup;
  onSelect: (value: string) => void;
  selectedOptionId: string;
}) {
  if (group.options.length === 0) {
    return null;
  }

  return (
    <View style={styles.optionsBlock}>
      <Text style={styles.sectionTitle}>{group.name}</Text>
      <ScrollView contentContainerStyle={styles.optionsRow} horizontal showsHorizontalScrollIndicator={false}>
        {group.options.map((option) => (
          <Pressable
            disabled={option.stock <= 0 || option.status !== 'Activa'}
            key={option.id}
            onPress={() => onSelect(option.id)}
            style={[
              group.kind === 'Color' ? styles.colorOption : styles.option,
              selectedOptionId === option.id && (group.kind === 'Color' ? styles.activeColorOption : styles.activeOption),
              (option.stock <= 0 || option.status !== 'Activa') && styles.unavailableOption,
            ]}
          >
            {group.kind === 'Color' ? (
              <View style={[styles.colorCircle, { backgroundColor: option.colorHex ?? colors.primary }]} />
            ) : null}
            <Text style={[styles.optionText, selectedOptionId === option.id && styles.activeOptionText]}>{option.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 0 },
  content: { paddingTop: 8, paddingHorizontal: 20, paddingBottom: 148 },
  topbar: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hero: { borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: 20, minWidth: 0, overflow: 'visible', padding: 24, width: '100%' },
  emoji: { fontSize: 104, lineHeight: 132, textAlign: 'center' },
  galleryRow: { gap: 9, paddingTop: 12, paddingRight: 20 },
  galleryThumb: { width: 62, height: 62, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  galleryThumbActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  galleryEmoji: { fontSize: 30, lineHeight: 40, textAlign: 'center' },
  discount: { position: 'absolute', left: 16, top: 16, borderRadius: 999, backgroundColor: colors.primary, minHeight: 32, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 6 },
  discountText: { color: colors.white, flexShrink: 1, fontSize: 13, fontWeight: '900', lineHeight: 18 },
  stockBadge: { position: 'absolute', left: 16, bottom: 16, borderRadius: 999, backgroundColor: colors.text, minHeight: 32, justifyContent: 'center', maxWidth: '82%', paddingHorizontal: 12, paddingVertical: 6 },
  stockBadgeText: { color: colors.white, flexShrink: 1, fontSize: 13, fontWeight: '900', lineHeight: 18 },
  category: { color: colors.secondary, flexShrink: 1, fontSize: 12, fontWeight: '900', letterSpacing: 1.2, lineHeight: 18, marginTop: 20, minWidth: 0 },
  title: { color: colors.text, flexShrink: 1, fontSize: 28, lineHeight: 35, fontWeight: '900', marginTop: 6, minWidth: 0 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, minWidth: 0 },
  brandName: { flex: 1, flexShrink: 1, color: colors.textMuted, fontSize: 15, fontWeight: '800', minWidth: 0 },
  rating: { flexDirection: 'row', alignItems: 'center', flexShrink: 0, gap: 4 },
  ratingText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  shareProductButton: { alignSelf: 'flex-start', minHeight: 36, borderRadius: 999, backgroundColor: colors.secondarySoft, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, marginTop: 13 },
  shareProductText: { color: colors.secondary, fontSize: 13, fontWeight: '900' },
  priceCard: { marginTop: 18, shadowOpacity: 0.05 },
  stockText: { color: colors.success, fontSize: 13, fontWeight: '900', marginTop: 10 },
  stockTextDanger: { color: colors.primary },
  sellerCard: { flexDirection: 'row', gap: 12, marginTop: 14, shadowOpacity: 0.04 },
  sellerIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.secondarySoft, alignItems: 'center', justifyContent: 'center' },
  sellerCopy: { flex: 1 },
  sellerLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  sellerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, minWidth: 0 },
  sellerName: { flexShrink: 1, color: colors.text, fontSize: 15, fontWeight: '900' },
  sellerCheck: { width: 17, height: 17, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sellerMeta: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 4, fontWeight: '800' },
  sellerBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 },
  verifiedBadge: { minHeight: 25, borderRadius: 999, backgroundColor: '#eef9f3', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9 },
  verifiedText: { color: colors.success, fontSize: 12, fontWeight: '900' },
  officialBadge: { minHeight: 25, borderRadius: 999, backgroundColor: colors.secondarySoft, justifyContent: 'center', paddingHorizontal: 9 },
  officialText: { color: colors.secondary, fontSize: 12, fontWeight: '900' },
  selectorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 12 },
  selectorCopy: { flex: 1 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 2 },
  sectionHint: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  optionsBlock: { marginTop: 20 },
  optionsRow: { gap: 8, paddingTop: 10 },
  option: { minHeight: 36, borderRadius: 999, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', paddingHorizontal: 14, backgroundColor: colors.white },
  activeOption: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  unavailableOption: { opacity: 0.45 },
  colorOption: { minHeight: 42, borderRadius: 999, borderWidth: 1, borderColor: colors.border, alignItems: 'center', flexDirection: 'row', gap: 7, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: colors.white },
  activeColorOption: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  colorCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.white },
  optionText: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  activeOptionText: { color: colors.primary },
  infoCard: { gap: 10, marginTop: 22, shadowOpacity: 0.04 },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 22 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefit: { color: colors.text, fontSize: 13, fontWeight: '700' },
  shippingBox: { borderRadius: 15, backgroundColor: colors.secondarySoft, flexDirection: 'row', gap: 10, padding: 12, marginTop: 4 },
  shippingText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '700' },
  reviewsCard: { gap: 12, marginTop: 22, shadowOpacity: 0.04 },
  verifiedReviewsIntro: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 16, backgroundColor: '#eef9f3', padding: 11 },
  verifiedReviewsIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  verifiedReviewsCopy: { flex: 1 },
  verifiedReviewsTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  verifiedReviewsText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 2, fontWeight: '800' },
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  reviewSummary: { color: colors.textMuted, fontSize: 13, marginTop: 4, fontWeight: '700' },
  trustCopy: { color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingDistribution: { gap: 6 },
  distributionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  distributionLabel: { width: 24, color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  distributionTrack: { flex: 1, height: 7, borderRadius: 999, backgroundColor: colors.soft, overflow: 'hidden' },
  distributionFill: { height: 7, borderRadius: 999, backgroundColor: colors.warning },
  reviewItem: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 6 },
  reviewTop: { flexDirection: 'row', alignItems: 'center' },
  reviewName: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '900' },
  reviewDate: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  reviewRatingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  verifiedPurchaseBadge: { minHeight: 24, borderRadius: 999, backgroundColor: '#eef9f3', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8 },
  verifiedPurchaseText: { color: colors.success, fontSize: 12, fontWeight: '900' },
  reviewComment: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  reviewTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reviewTag: { borderRadius: 999, backgroundColor: colors.primarySoft, color: colors.primary, fontSize: 12, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 5 },
  emptyReviewsText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '800', textAlign: 'center' },
  rateCard: { gap: 11, marginTop: 14, shadowOpacity: 0 },
  rateStars: { flexDirection: 'row', gap: 5 },
  reviewInput: { minHeight: 82, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.text, padding: 12, fontSize: 13, textAlignVertical: 'top' },
  selectableTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  selectableTag: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: 10, paddingVertical: 7 },
  activeSelectableTag: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  selectableTagText: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  activeSelectableTagText: { color: colors.primary },
  reviewFeedback: { color: colors.success, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  reviewGate: { gap: 8, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, padding: 12 },
  reviewGateTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  reviewGateText: { color: colors.text, fontSize: 13, lineHeight: 21, fontWeight: '800' },
  reviewGateMuted: { color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  actions: { gap: 10, marginTop: 22 },
  cartFeedback: { color: colors.success, fontSize: 13, fontWeight: '900', textAlign: 'center', marginTop: 12 },
});
