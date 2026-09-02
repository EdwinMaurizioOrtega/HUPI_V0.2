import { ThemedView as View } from '@/theme/ThemedView';
import {
  StyleSheet,
} from 'react-native';

import { colors } from '@/constants/colors';
import { theme } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import { formatMarketplaceCurrency } from './ProductPriceBlock';
import { QuantitySelector } from './QuantitySelector';
import { Pressable, Text } from '@/i18n/components';

type CartItemCardProps = {
  availabilityLabel?: string;
  availabilityStatus?: 'available' | 'unavailable' | 'warning';
  brand: string;
  emoji: string;
  maxQuantity?: number;
  name: string;
  onAdjustToStock?: () => void;
  onMaxExceeded?: (max: number) => void;
  onQuantityChange: (quantity: number) => void;
  onRemove?: () => void;
  quantity: number;
  stockLabel?: string;
  storeName?: string;
  unitPrice: number;
  unavailable?: boolean;
  variation?: string;
};

export function CartItemCard({
  availabilityLabel = 'Disponible',
  availabilityStatus,
  brand,
  emoji,
  maxQuantity,
  name,
  onAdjustToStock,
  onMaxExceeded,
  onQuantityChange,
  onRemove,
  quantity,
  stockLabel,
  storeName,
  unitPrice,
  unavailable = false,
  variation,
}: CartItemCardProps) {
  const resolvedAvailabilityStatus = availabilityStatus
    ?? (unavailable ? 'unavailable' : 'available');

  return (
    <View style={[styles.card, unavailable && styles.cardUnavailable]}>
      <View style={styles.visual}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={2} style={styles.name}>{name}</Text>
        <Text style={styles.brand}>{storeName ?? brand}</Text>
        {variation ? <Text style={styles.meta}>__hupi_i18n:common.variation2 {variation}</Text> : null}
        <Text style={styles.price}>{formatMarketplaceCurrency(unitPrice)}  __hupi_i18n:common.each</Text>
        {stockLabel ? <Text style={styles.meta}>{stockLabel}</Text> : null}
        <View
          style={[
            styles.badge,
            resolvedAvailabilityStatus === 'unavailable'
              ? styles.badgeUnavailable
              : resolvedAvailabilityStatus === 'warning'
                ? styles.badgeWarning
                : styles.badgeAvailable,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              resolvedAvailabilityStatus === 'unavailable'
                ? styles.badgeTextUnavailable
                : resolvedAvailabilityStatus === 'warning'
                  ? styles.badgeTextWarning
                  : styles.badgeTextAvailable,
            ]}
          >
            {availabilityLabel}
          </Text>
        </View>
        <QuantitySelector max={maxQuantity} onChange={onQuantityChange} onMaxExceeded={onMaxExceeded} quantity={quantity} />
        {maxQuantity !== undefined && maxQuantity > 0 && quantity > maxQuantity && onAdjustToStock ? (
          <Pressable accessibilityRole="button" onPress={onAdjustToStock} style={styles.adjustButton}>
            <Text style={styles.adjustText}>__hupi_i18n:marketplace.CartItemCard.adjustToAvailableStock</Text>
          </Pressable>
        ) : null}
        {onRemove ? (
          <Pressable accessibilityRole="button" onPress={onRemove} style={styles.removeButton}>
            <Text style={styles.removeText}>__hupi_i18n:marketplace.CartItemCard.removeFromCart</Text>
          </Pressable>
        ) : null}
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
    flexDirection: 'row',
    gap: 13,
    padding: 13,
    overflow: 'visible',
    ...theme.shadow,
    shadowOpacity: 0.05,
  },
  cardUnavailable: { backgroundColor: colors.soft },
  visual: {
    width: 82,
    height: 96,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 38, lineHeight: 52, textAlign: 'center' },
  copy: { flex: 1, minWidth: 0 },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, lineHeight: 22, fontWeight: '900' },
  brand: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, fontWeight: '700', marginTop: 3 },
  meta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 19, marginTop: 3, fontWeight: '800' },
  price: { color: colors.primary, flexShrink: 1, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900', lineHeight: 21, marginTop: 7 },
  badge: { alignSelf: 'flex-start', minHeight: 30, borderRadius: 999, justifyContent: 'center', overflow: 'visible', paddingHorizontal: 10, paddingVertical: 4, marginTop: 7 },
  badgeAvailable: { backgroundColor: '#eef9f3' },
  badgeUnavailable: { backgroundColor: colors.danger },
  badgeWarning: { backgroundColor: colors.warningSoft },
  badgeText: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', lineHeight: 18, paddingBottom: 1 },
  badgeTextAvailable: { color: colors.success },
  badgeTextUnavailable: { color: colors.white },
  badgeTextWarning: { color: colors.warning },
  removeButton: { minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 8, overflow: 'visible', paddingVertical: 6 },
  removeText: { color: colors.primary, flexShrink: 1, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', lineHeight: 18, paddingHorizontal: 8, textAlign: 'center' },
  adjustButton: { minHeight: 34, borderRadius: 12, backgroundColor: colors.secondarySoft, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  adjustText: { color: colors.secondary, flexShrink: 1, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', lineHeight: 18, paddingHorizontal: 8, textAlign: 'center' },
});
