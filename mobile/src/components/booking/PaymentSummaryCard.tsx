import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { StyleSheet,
} from 'react-native';

import { Card } from '@/components/Card';
import { colors } from '@/constants/colors';
import { formatMockCurrency, type MockPaymentBreakdown } from '@/constants/mockCheckout';
import { Text } from '@/i18n/components';

type PaymentSummaryCardProps = {
  payment: MockPaymentBreakdown;
  donation?: number;
};

export function PaymentSummaryCard({ payment, donation = 0 }: PaymentSummaryCardProps) {
  const finalTotal = payment.total + donation;

  return (
    <Card style={styles.card}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.eyebrow}>__hupi_i18n:payments.PaymentSummaryCard.transparentPayment</Text>
          <Text style={styles.title}>__hupi_i18n:common.paymentBreakdown</Text>
        </View>
        <View style={styles.lockIcon}><Ionicons color={colors.secondary} name="lock-closed" size={19} /></View>
      </View>

      <View style={styles.lines}>
        <View style={styles.line}>
          <Text style={styles.label}>__hupi_i18n:bookings.booking-detail.servicePrice</Text>
          <Text style={styles.value}>{formatMockCurrency(payment.providerValue)}</Text>
        </View>
        <View style={styles.line}>
          <View style={styles.labelWithInfo}>
            <Text style={styles.label}>__hupi_i18n:payments.PaymentSummaryCard.platformManagementSurcharge</Text>
            <View style={styles.percentBadge}><Text style={styles.percentText}>15%</Text></View>
          </View>
          <Text style={styles.value}>{formatMockCurrency(payment.clientFee)}</Text>
        </View>
        <View style={styles.line}>
          <View>
            <Text style={styles.label}>__hupi_i18n:common.vat</Text>
            <Text style={styles.ivaHint}>__hupi_i18n:payments.PaymentSummaryCard.notAppliedForNow</Text>
          </View>
          <Text style={styles.value}>{formatMockCurrency(payment.iva)}</Text>
        </View>
        {donation > 0 ? (
          <View style={styles.line}>
            <View style={styles.labelWithInfo}>
              <Text style={styles.label}>__hupi_i18n:common.hupiFoundationDonation</Text>
              <Ionicons color={colors.primary} name="heart" size={13} />
            </View>
            <Text style={styles.value}>{formatMockCurrency(donation)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>__hupi_i18n:common.totalToPay</Text>
        <Text style={styles.totalValue}>{formatMockCurrency(finalTotal)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 17, shadowOpacity: 0.06 },
  headingRow: { flexDirection: 'row', alignItems: 'center' },
  eyebrow: { color: colors.secondary, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 4 },
  lockIcon: { marginLeft: 'auto', width: 40, height: 40, borderRadius: 14, backgroundColor: colors.secondarySoft, alignItems: 'center', justifyContent: 'center' },
  lines: { gap: 14, marginTop: 19 },
  line: { flexDirection: 'row', alignItems: 'center' },
  label: { color: colors.textMuted, fontSize: 13 },
  labelWithInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  percentBadge: { borderRadius: 8, backgroundColor: colors.primarySoft, paddingHorizontal: 6, paddingVertical: 3 },
  percentText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  value: { marginLeft: 'auto', color: colors.text, fontSize: 13, fontWeight: '800' },
  ivaHint: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  totalRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 17, paddingTop: 16 },
  totalLabel: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '900' },
  totalValue: { color: colors.primary, fontSize: 23, fontWeight: '900' },
});
