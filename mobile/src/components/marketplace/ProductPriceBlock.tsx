import { ThemedView as View } from '@/theme/ThemedView';
import {
  StyleSheet,
} from 'react-native';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { Text } from '@/i18n/components';
import { formatUsd } from '@/i18n/format';

type ProductPriceBlockProps = {
  cardPrice: number;
  compact?: boolean;
  compactNarrow?: boolean;
  discount?: number;
  priceBefore?: number;
  pricePrefix?: string;
  transferDiscount?: number;
  transferPrice: number;
  transferPriceBefore?: number;
};

export function formatMarketplaceCurrency(value: number) {
  return formatUsd(value);
}

export function ProductPriceBlock({
  cardPrice,
  compact = false,
  compactNarrow = false,
  discount = 0,
  priceBefore,
  pricePrefix,
  transferDiscount = 0,
  transferPrice,
  transferPriceBefore,
}: ProductPriceBlockProps) {
  return (
    <View style={[styles.wrap, compact && styles.compactWrap, compactNarrow && styles.compactNarrowWrap]}>
      <View style={compact && styles.priceColumn}>
        <Text style={styles.label}>__hupi_i18n:common.cardPrice</Text>
        {priceBefore && priceBefore > cardPrice ? (
          <Text style={[styles.oldPrice, compact && styles.compactOldPrice]}>{formatMarketplaceCurrency(priceBefore)}</Text>
        ) : null}
        <Text style={[styles.cardPrice, compact && styles.compactPrice]}>{pricePrefix}{formatMarketplaceCurrency(cardPrice)}</Text>
        {discount > 0 ? <Text style={styles.discountBadge}>-{discount}%</Text> : null}
      </View>
      <View style={[compact && styles.priceColumnRight, compactNarrow && styles.priceColumnNarrow]}>
        <Text style={styles.label}>__hupi_i18n:common.transfer</Text>
        {transferPriceBefore && transferPriceBefore > transferPrice ? (
          <Text style={[styles.oldPrice, compact && styles.compactOldPrice]}>{formatMarketplaceCurrency(transferPriceBefore)}</Text>
        ) : null}
        <Text style={[styles.transferPrice, compact && styles.compactPrice]}>
          {pricePrefix}{formatMarketplaceCurrency(transferPrice)}
        </Text>
        {transferDiscount > 0 ? <Text style={styles.transferDiscountBadge}>-{transferDiscount}%</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 9 },
  compactWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  compactNarrowWrap: { flexDirection: 'column', gap: 5 },
  priceColumn: { flex: 1 },
  priceColumnRight: { flex: 1, alignItems: 'flex-end' },
  priceColumnNarrow: { alignItems: 'flex-start' },
  label: { color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: 12, fontWeight: '800' },
  oldPrice: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900', marginTop: 2, textDecorationLine: 'line-through' },
  cardPrice: { color: colors.text, fontFamily: fonts.bold, fontSize: 20, fontWeight: '900', marginTop: 2 },
  transferPrice: { color: colors.primary, fontFamily: fonts.bold, fontSize: 17, fontWeight: '900', marginTop: 2 },
  discountBadge: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: colors.primary, color: colors.white, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', lineHeight: 17, marginTop: 4, minHeight: 23, paddingHorizontal: 7, paddingVertical: 3 },
  transferDiscountBadge: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: colors.secondary, color: colors.white, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', lineHeight: 17, marginTop: 4, minHeight: 23, paddingHorizontal: 7, paddingVertical: 3 },
  compactOldPrice: { fontSize: 12 },
  compactPrice: { fontSize: 13 },
});
