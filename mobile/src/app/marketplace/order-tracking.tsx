import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useFocusEffect,
  useLocalSearchParams,
  useRouter } from 'expo-router';
import { useCallback,
  useState } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { MarketplaceSupportTicketCard } from '@/components/marketplace/MarketplaceSupportTicketCard';
import { OrderTimeline } from '@/components/marketplace/OrderTimeline';
import { colors } from '@/constants/colors';
import { getClientTrackingOrder } from '@/constants/marketplaceProviderOrders';
import { mockSupportReasons } from '@/constants/mockData';
import { Text } from '@/i18n/components';

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [order, setOrder] = useState(() => getClientTrackingOrder(orderId));

  useFocusEffect(useCallback(() => {
    setOrder(getClientTrackingOrder(orderId));
  }, [orderId]));

  const currentStatus = order.status;

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.topbar}>
        <Pressable accessibilityLabel="__hupi_i18n:common.back" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={colors.text} name="arrow-back" size={22} />
        </Pressable>
        <View style={styles.heading}>
          <Text style={styles.title}>__hupi_i18n:marketplace.order-tracking.orderTracking</Text>
          <Text style={styles.subtitle}>{order.id}</Text>
        </View>
      </View>

      <Card style={styles.statusCard} tone="coral">
        <View style={styles.statusIcon}>
          <Ionicons color={colors.white} name="cube" size={24} />
        </View>
        <View style={styles.statusCopy}>
          <Text style={styles.statusLabel}>__hupi_i18n:common.currentStatus</Text>
          <Text style={styles.statusTitle}>{currentStatus}</Text>
        </View>
      </Card>

      <Card style={styles.timelineCard}>
        <OrderTimeline currentStep={order.currentStep} steps={order.steps} />
      </Card>

      <Card style={styles.deliveryCard}>
        <InfoRow icon="location-outline" label="__hupi_i18n:common.deliveryAddress" value={order.address} />
        <InfoRow icon="calendar-outline" label="__hupi_i18n:common.estimatedDate" value={order.estimatedDate} />
      </Card>

      {order.latestNotification ? (
        <View style={styles.notificationBox}>
          <Ionicons color={colors.primary} name="notifications-outline" size={17} />
          <Text style={styles.notificationText}>{order.latestNotification}</Text>
        </View>
      ) : null}

      <Card style={styles.providersCard}>
        <Text style={styles.providersTitle}>__hupi_i18n:marketplace.order-tracking.statusByProvider</Text>
        <View style={styles.providerStatuses}>
          {order.providerOrders.map((providerOrder) => (
            <View key={providerOrder.providerOrderId} style={styles.providerStatusRow}>
              <View style={styles.providerIcon}>
                <Ionicons color={colors.secondary} name="storefront-outline" size={17} />
              </View>
              <View style={styles.providerCopy}>
                <Text style={styles.providerName}>{providerOrder.storeName}</Text>
                <Text style={styles.providerDelivery}>{providerOrder.deliveryMethod}</Text>
                {providerOrder.carrierName && providerOrder.trackingNumber ? (
                  <View style={styles.trackingInfo}>
                    <Text style={styles.trackingText}>__hupi_i18n:common.carrier {providerOrder.carrierName}</Text>
                    <Text style={styles.trackingText}>__hupi_i18n:common.guideNumber2 {providerOrder.trackingNumber}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.providerStatus}>{providerOrder.status}</Text>
            </View>
          ))}
        </View>
      </Card>

      <MarketplaceSupportTicketCard reasons={mockSupportReasons} />
    </ScreenContainer>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons color={colors.primary} name={icon} size={18} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 42 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22, shadowOpacity: 0 },
  statusIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  statusCopy: { flex: 1 },
  statusLabel: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  statusTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 4 },
  timelineCard: { marginTop: 16, paddingBottom: 0, shadowOpacity: 0.04 },
  deliveryCard: { gap: 13, marginTop: 16, shadowOpacity: 0.04 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { flex: 1, color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  infoValue: { flex: 1.1, color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '900', textAlign: 'right' },
  notificationBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 15, backgroundColor: colors.primarySoft, padding: 11, marginTop: 14 },
  notificationText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  providersCard: { gap: 11, marginTop: 16, shadowOpacity: 0.04 },
  providersTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  providerStatuses: { gap: 9 },
  providerStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 15, backgroundColor: colors.soft, padding: 10 },
  providerIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  providerCopy: { flex: 1 },
  providerName: { color: colors.text, fontSize: 13, fontWeight: '900' },
  providerDelivery: { color: colors.textMuted, fontSize: 12, marginTop: 2, fontWeight: '700' },
  trackingInfo: { borderRadius: 10, backgroundColor: colors.white, padding: 7, marginTop: 7, gap: 2 },
  trackingText: { color: colors.textMuted, fontSize: 12, lineHeight: 17, fontWeight: '800' },
  providerStatus: { color: colors.primary, fontSize: 12, lineHeight: 18, fontWeight: '900', textAlign: 'right', maxWidth: 105 },
});
