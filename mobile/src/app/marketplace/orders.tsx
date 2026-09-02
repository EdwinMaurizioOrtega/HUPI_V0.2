import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useFocusEffect,
  useRouter } from 'expo-router';
import { useCallback,
  useState } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { Text } from '@/i18n/components';
import {
  getMarketplaceOrders,
} from '@/constants/marketplaceOrdersState';

export default function MarketplaceOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState(() => getMarketplaceOrders());

  useFocusEffect(useCallback(() => {
    setOrders(getMarketplaceOrders());
  }, []));

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <PageHeader
        onBack={() => router.back()}
        subtitle="__hupi_i18n:marketplace.orders.hupiMarketplaceHistory"
        title="__hupi_i18n:common.myPurchases"
      />

      <View style={styles.stack}>
        {orders.map((order) => {
          const mainProduct = order.products[0];
          const needsProof = order.paymentStatus === 'Pendiente de comprobante' || order.paymentStatus === 'Comprobante rechazado';

          return (
            <Pressable
              accessibilityRole="button"
              key={order.id}
              onPress={() => router.push(`/marketplace/order-detail?orderId=${order.id}` as Href)}
            >
              <Card style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={[styles.thumb, { backgroundColor: mainProduct.color }]}>
                    <Text style={styles.thumbText}>{mainProduct.emoji}</Text>
                  </View>
                  <View style={styles.orderCopy}>
                    <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    <Text style={styles.meta}>{order.createdAt}</Text>
                    <Text style={styles.meta}>{order.stores.map((store) => store.name).join(' · ')}</Text>
                  </View>
                  <Ionicons color={colors.textMuted} name="chevron-forward" size={19} />
                </View>

                <View style={styles.badges}>
                  <StatusBadge label={order.orderStatus} tone={order.orderStatus === 'Cancelado' ? 'coral' : 'purple'} />
                  <StatusBadge label={order.paymentStatus} tone={needsProof ? 'coral' : 'soft'} />
                </View>

                <View style={styles.summaryRow}>
                  <View style={styles.summaryCopy}>
                    <Text style={styles.summaryLabel}>__hupi_i18n:common.paymentMethod</Text>
                    <Text style={styles.summaryValue}>{order.paymentMethod}</Text>
                  </View>
                  <View style={styles.totalBlock}>
                    <Text style={styles.summaryLabel}>__hupi_i18n:common.totalPaid</Text>
                    <Text style={styles.total}>${order.total.toFixed(2)}</Text>
                  </View>
                </View>

                {needsProof ? (
                  <Button
                    icon="cloud-upload-outline"
                    onPress={() => router.push(`/marketplace/order-detail?orderId=${order.id}` as Href)}
                    title={order.paymentStatus === 'Comprobante rechazado' ? 'Corregir comprobante' : 'Cargar comprobante'}
                    variant="secondary"
                  />
                ) : null}

                <Button
                  icon="receipt-outline"
                  onPress={() => router.push(`/marketplace/order-detail?orderId=${order.id}` as Href)}
                  title="__hupi_i18n:common.seeDetail"
                  variant="outline"
                />
              </Card>
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: 'coral' | 'purple' | 'soft' }) {
  return (
    <View style={[styles.badge, tone === 'coral' && styles.coralBadge, tone === 'purple' && styles.purpleBadge]}>
      <Text style={[styles.badgeText, tone === 'coral' && styles.coralBadgeText, tone === 'purple' && styles.purpleBadgeText]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 42 },
  stack: { gap: 12, marginTop: 22 },
  orderCard: { gap: 12, overflow: 'visible', paddingVertical: 16, shadowOpacity: 0.04 },
  orderHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  thumb: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  thumbText: { color: colors.primary, fontSize: 17, fontWeight: '900' },
  orderCopy: { flex: 1, minWidth: 0 },
  orderNumber: { color: colors.text, fontSize: 15, fontWeight: '900', lineHeight: 21 },
  meta: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 2, fontWeight: '800' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { minHeight: 30, borderRadius: 999, backgroundColor: colors.soft, justifyContent: 'center', overflow: 'visible', paddingHorizontal: 10, paddingVertical: 4 },
  coralBadge: { backgroundColor: colors.primarySoft },
  purpleBadge: { backgroundColor: colors.secondarySoft },
  badgeText: { color: colors.textMuted, flexShrink: 1, fontSize: 12, fontWeight: '900', lineHeight: 18, paddingBottom: 1 },
  coralBadgeText: { color: colors.primary },
  purpleBadgeText: { color: colors.secondary },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, overflow: 'visible' },
  summaryCopy: { flex: 1, minWidth: 0 },
  summaryLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '900', lineHeight: 18 },
  summaryValue: { color: colors.text, fontSize: 13, lineHeight: 20, marginTop: 3, fontWeight: '900' },
  totalBlock: { marginLeft: 'auto', alignItems: 'flex-end', minWidth: 78, overflow: 'visible' },
  total: { color: colors.secondary, flexShrink: 0, fontSize: 17, lineHeight: 25, marginTop: 3, fontWeight: '900', paddingBottom: 2 },
});
