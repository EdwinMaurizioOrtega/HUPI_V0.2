import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useRef,
  useState } from 'react';
import { Animated,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

import { colors } from '@/constants/colors';
import { theme } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import { ProductPriceBlock } from './ProductPriceBlock';
import { Pressable, Text } from '@/i18n/components';

type ProductCardProps = {
  brand: string;
  cardPrice: number;
  category: string;
  color: string;
  discount: number;
  emoji: string;
  name: string;
  available?: boolean;
  availabilityLabel?: string;
  onAdd: () => void;
  onOpen: () => void;
  onShare: () => void;
  priceBefore?: number;
  pricePrefix?: string;
  rating: string;
  stock?: number;
  storeBadge?: string;
  storeBadgeTone?: 'official' | 'verified';
  transferDiscount?: number;
  transferPrice: number;
  transferPriceBefore?: number;
};

export const MARKETPLACE_GRID_GAP = 12;
export const MARKETPLACE_GRID_HORIZONTAL_PADDING = 40;
export const MARKETPLACE_MOBILE_FRAME_WIDTH = 560;

export function getMarketplaceCardWidth(viewportWidth: number) {
  const frameWidth = Math.min(Math.max(viewportWidth, 0), MARKETPLACE_MOBILE_FRAME_WIDTH);
  return Math.max(
    0,
    (frameWidth - MARKETPLACE_GRID_HORIZONTAL_PADDING - MARKETPLACE_GRID_GAP) / 2,
  );
}

export function ProductCard({
  brand,
  cardPrice,
  category,
  color,
  discount,
  emoji,
  name,
  available = true,
  availabilityLabel = 'No disponible',
  onAdd,
  onOpen,
  onShare,
  priceBefore,
  pricePrefix,
  rating,
  stock,
  storeBadge,
  storeBadgeTone = 'official',
  transferDiscount,
  transferPrice,
  transferPriceBefore,
}: ProductCardProps) {
  const { width } = useWindowDimensions();
  const cardWidth = getMarketplaceCardWidth(width);
  const useStackedActions = cardWidth < 170;
  const scale = useRef(new Animated.Value(1)).current;
  const [added, setAdded] = useState(false);
  const isUnavailable = !available || (stock !== undefined && stock <= 0);

  const handleAdd = () => {
    if (isUnavailable) {
      return;
    }

    setAdded(true);
    Animated.sequence([
      Animated.timing(scale, {
        duration: 90,
        toValue: 0.94,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        friction: 4,
        tension: 140,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
    onAdd();
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <Pressable accessibilityRole="button" onPress={onOpen} style={({ pressed }) => pressed && styles.pressed}>
        <View style={[styles.visual, { backgroundColor: color }]}>
          {/* Seed products use centered emoji placeholders until catalog image URLs are available. */}
          <Text style={styles.emoji}>{emoji}</Text>
          {discount > 0 ? (
            <View style={styles.discount}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          ) : null}
          {isUnavailable ? (
            <View style={styles.outOfStock}><Text style={styles.outOfStockText}>{availabilityLabel}</Text></View>
          ) : null}
          <Pressable
            accessibilityLabel="__hupi_i18n:common.shareProduct"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onShare}
            style={styles.shareButton}
          >
            <Ionicons color={colors.secondary} name="share-social-outline" size={16} />
          </Pressable>
        </View>
        <Text numberOfLines={1} style={styles.category}>{category.toUpperCase()}</Text>
        <Text numberOfLines={2} style={styles.name}>{name}</Text>
        <View style={styles.productMeta}>
          <Text numberOfLines={1} style={styles.brand}>{brand}</Text>
          <View style={styles.rating}>
            <Ionicons color={colors.warning} name="star" size={11} />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        </View>
        {storeBadge ? (
          <Text
            numberOfLines={2}
            style={[
              styles.storeBadge,
              storeBadgeTone === 'verified' ? styles.verifiedStoreBadge : styles.officialStoreBadge,
            ]}
          >
            {storeBadge}
          </Text>
        ) : null}
        <ProductPriceBlock
          cardPrice={cardPrice}
          compact
          compactNarrow={useStackedActions}
          discount={discount}
          priceBefore={priceBefore}
          pricePrefix={pricePrefix}
          transferDiscount={transferDiscount}
          transferPrice={transferPrice}
          transferPriceBefore={transferPriceBefore}
        />
      </Pressable>
      <View style={[styles.actions, useStackedActions && styles.actionsStacked]}>
        <Pressable accessibilityRole="button" onPress={onOpen} style={styles.detailButton}>
          <Text style={styles.detailText}>__hupi_i18n:common.detail</Text>
        </Pressable>
        <Animated.View style={[styles.addButtonAnimated, { transform: [{ scale }] }]}>
          <Pressable accessibilityRole="button" disabled={isUnavailable} onPress={handleAdd} style={[styles.addButton, added && styles.addedButton, isUnavailable && styles.disabledAddButton]}>
            <Ionicons color={colors.white} name={added ? 'checkmark' : 'add'} size={16} />
            <Text style={styles.addText}>{isUnavailable ? 'No disponible' : added ? 'Agregado' : 'Agregar'}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: 10,
    ...theme.shadow,
    shadowOpacity: 0.05,
    minWidth: 0,
    overflow: 'visible',
  },
  pressed: { opacity: 0.88 },
  visual: {
    aspectRatio: 1.18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 94,
    overflow: 'visible',
  },
  emoji: { fontSize: 44, lineHeight: 58, textAlign: 'center' },
  discount: {
    position: 'absolute',
    left: 8,
    top: 8,
    borderRadius: 999,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: { color: colors.white, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  outOfStock: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    borderRadius: 999,
    backgroundColor: colors.text,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  outOfStockText: { color: colors.white, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  shareButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  category: { color: colors.secondary, flexShrink: 1, fontFamily: fonts.bold, fontSize: 11, fontWeight: '900', letterSpacing: 0.6, lineHeight: 16, marginTop: 8, minWidth: 0 },
  name: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, fontWeight: '900', marginTop: 3, minHeight: 40, minWidth: 0 },
  productMeta: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 5, minWidth: 0 },
  brand: { flex: 1, flexShrink: 1, color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, fontWeight: '700', minWidth: 0 },
  storeBadge: { alignSelf: 'flex-start', borderRadius: 10, flexShrink: 1, fontFamily: fonts.bold, fontSize: 10.5, fontWeight: '900', lineHeight: 15, marginBottom: 6, marginTop: 5, maxWidth: '100%', minHeight: 22, paddingHorizontal: 6, paddingVertical: 3 },
  officialStoreBadge: { backgroundColor: colors.secondarySoft, color: colors.secondary },
  verifiedStoreBadge: { backgroundColor: '#eef9f3', color: colors.success },
  rating: {
    minHeight: 20,
    borderRadius: 999,
    backgroundColor: colors.soft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingTop: 1,
  },
  ratingText: { color: colors.text, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 6, marginTop: 8 },
  actionsStacked: { flexDirection: 'column' },
  detailButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  addButtonAnimated: { flex: 1.25 },
  addButton: {
    flex: 1.25,
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  addedButton: { backgroundColor: colors.secondary },
  disabledAddButton: { backgroundColor: colors.textMuted },
  addText: { color: colors.white, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
});
