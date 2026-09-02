import { ThemedView as View } from '@/theme/ThemedView';
import {
  StyleSheet,
} from 'react-native';

import { Card } from '@/components/Card';
import { colors } from '@/constants/colors';
import { formatMarketplaceCurrency } from './ProductPriceBlock';
import { Text } from '@/i18n/components';

type OrderSummaryCardProps = {
  couponCode?: string;
  couponDiscount?: number;
  discount?: number;
  donation?: number;
  hupiBalanceApplied?: number;
  shipping: number;
  subtotal: number;
  total: number;
};

export function OrderSummaryCard({
  couponCode,
  couponDiscount = 0,
  discount = 0,
  donation = 0,
  hupiBalanceApplied = 0,
  shipping,
  subtotal,
  total,
}: OrderSummaryCardProps) {
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>__hupi_i18n:common.orderSummary</Text>
      <SummaryRow label="__hupi_i18n:common.subtotal" value={formatMarketplaceCurrency(subtotal)} />
      {discount > 0 ? <SummaryRow label="__hupi_i18n:common.discount" value={`-${formatMarketplaceCurrency(discount)}`} /> : null}
      {couponDiscount > 0 && couponCode ? (
        <SummaryRow label={`Cupón ${couponCode}`} value={`-${formatMarketplaceCurrency(couponDiscount)}`} />
      ) : null}
      <SummaryRow label="__hupi_i18n:common.shipping" value={formatMarketplaceCurrency(shipping)} />
      {hupiBalanceApplied > 0 ? <SummaryRow label="__hupi_i18n:marketplace.order-detail.hupiBalanceApplied" value={`-${formatMarketplaceCurrency(hupiBalanceApplied)}`} /> : null}
      {donation > 0 ? <SummaryRow label="__hupi_i18n:common.hupiFoundationDonation" value={formatMarketplaceCurrency(donation)} /> : null}
      <View style={styles.divider} />
      <SummaryRow large label="__hupi_i18n:common.total" value={formatMarketplaceCurrency(total)} />
    </Card>
  );
}

function SummaryRow({ label, large = false, value }: { label: string; large?: boolean; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, large && styles.largeLabel]}>{label}</Text>
      <Text style={[styles.value, large && styles.largeValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, shadowOpacity: 0.05 },
  title: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  label: { flex: 1, color: colors.textMuted, fontSize: 13, fontWeight: '700', lineHeight: 20, minWidth: 0 },
  value: { color: colors.text, flexShrink: 0, fontSize: 13, fontWeight: '900', lineHeight: 20, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 2 },
  largeLabel: { color: colors.text, fontSize: 15, fontWeight: '900' },
  largeValue: { color: colors.primary, fontSize: 18, fontWeight: '900', lineHeight: 25, paddingBottom: 1 },
});
