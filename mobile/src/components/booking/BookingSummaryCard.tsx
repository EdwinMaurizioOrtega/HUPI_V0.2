import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { StyleSheet,
} from 'react-native';

import { Card } from '@/components/Card';
import { colors } from '@/constants/colors';
import { getMockBookingDetails, type MockPlanId } from '@/constants/mockCheckout';
import { serviceCopy, type BookableServiceId } from '@/constants/services';
import { Text } from '@/i18n/components';

type BookingSummaryCardProps = {
  providerName: string;
  planId: MockPlanId;
  petName: string;
  serviceId: BookableServiceId;
};

const rows = [
  { icon: 'paw-outline' as const, label: 'Mascota', key: 'pet' as const },
  { icon: 'calendar-outline' as const, label: 'Fecha', key: 'date' as const },
  { icon: 'time-outline' as const, label: 'Hora', key: 'hour' as const },
  { icon: 'hourglass-outline' as const, label: 'Duración', key: 'duration' as const },
  { icon: 'location-outline' as const, label: 'Ubicación', key: 'location' as const },
];

const serviceIcons: Record<BookableServiceId, keyof typeof Ionicons.glyphMap> = {
  walk: 'walk-outline',
  sitter: 'home-outline',
  boarding: 'moon-outline',
  daycare: 'sunny-outline',
};

export function BookingSummaryCard({ providerName, planId, petName, serviceId }: BookingSummaryCardProps) {
  const bookingDetails = getMockBookingDetails(serviceId);
  const service = serviceCopy[serviceId];
  const planLabel = planId === 'frequent' ? service.planFrequent : service.planBasic;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Ionicons color={colors.primary} name={serviceIcons[serviceId]} size={23} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>__hupi_i18n:bookings.booking-detail.serviceSummary</Text>
          <Text style={styles.title}>{bookingDetails.service}</Text>
          <Text style={styles.plan}>{planLabel}</Text>
        </View>
      </View>

      <View style={styles.divider} />
      <View style={styles.providerRow}>
        <Text style={styles.providerLabel}>__hupi_i18n:common.supplier</Text>
        <Text style={styles.providerValue}>{providerName}</Text>
      </View>

      <View style={styles.rows}>
        {rows.map((row) => (
          <View key={row.key} style={styles.row}>
            <Ionicons color={colors.secondary} name={row.icon} size={17} />
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.key === 'pet' ? petName : bookingDetails[row.key]}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 17, shadowOpacity: 0.06 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 3 },
  plan: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  providerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 13 },
  providerLabel: { flex: 1, color: colors.textMuted, fontSize: 13 },
  providerValue: { color: colors.text, fontSize: 13, fontWeight: '900' },
  rows: { gap: 11 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { width: 68, color: colors.textMuted, fontSize: 12 },
  value: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
});
