import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useFocusEffect,
  useRouter } from 'expo-router';
import { useCallback,
  useMemo,
  useState } from 'react';
import { Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ProviderPageHeader } from '@/components/provider/ProviderPageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { formatMarketplaceCurrency } from '@/components/marketplace/ProductPriceBlock';
import { colors } from '@/constants/colors';
import { getMarketplaceIssueForOrder, hasOpenIssueForOrder } from '@/constants/marketplaceIssuesState';
import {
  canProviderPrepareOrder,
  getProviderMarketplaceOrders,
  getProviderOrderFinancialSummary,
  getProviderOrderSubtotal,
  getProviderStatusDisplay,
  type ProviderMarketplaceOrder,
  type ProviderMarketplaceOrderStatus,
} from '@/constants/marketplaceProviderOrders';
import { currentMockMarketplaceStoreId, getProviderInfoRequestForOrder, type ProviderInfoRequest } from '@/constants/marketplaceStoreState';
import { Pressable, Text } from '@/i18n/components';

type FilterKey = 'Confirmados' | 'En preparación' | 'Listos para envío' | 'En camino' | 'Entregados' | 'Pendientes de comprobante' | 'Cancelados';

const filters: FilterKey[] = ['Confirmados', 'En preparación', 'Listos para envío', 'En camino', 'Entregados', 'Pendientes de comprobante', 'Cancelados'];

const filterTranslationKeys = {
  Confirmados: 'provider.marketplaceOrders.filters.confirmed',
  'En preparación': 'provider.marketplaceOrders.filters.preparing',
  'Listos para envío': 'provider.marketplaceOrders.filters.readyToShip',
  'En camino': 'provider.marketplaceOrders.filters.onTheWay',
  Entregados: 'provider.marketplaceOrders.filters.delivered',
  'Pendientes de comprobante': 'provider.marketplaceOrders.filters.pendingProof',
  Cancelados: 'provider.marketplaceOrders.filters.cancelled',
} as const satisfies Record<FilterKey, string>;

const statusByFilter: Record<FilterKey, ProviderMarketplaceOrderStatus[]> = {
  Confirmados: ['Confirmado'],
  'En preparación': ['En preparación'],
  'Listos para envío': ['Listo para envío'],
  'En camino': ['En camino'],
  Entregados: ['Entregado'],
  'Pendientes de comprobante': ['Pendiente de pago', 'Pago en revisión'],
  Cancelados: ['Cancelado'],
};

export default function ProviderMarketplaceOrdersScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('Confirmados');
  const [orders, setOrders] = useState(() => getProviderMarketplaceOrders([currentMockMarketplaceStoreId]));
  const [selectedInfoRequest, setSelectedInfoRequest] = useState<ProviderInfoRequest | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    setOrders(getProviderMarketplaceOrders([currentMockMarketplaceStoreId]));
  }, []));

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'Pendientes de comprobante') {
      return orders.filter((order) => !canProviderPrepareOrder(order));
    }

    return orders.filter((order) => canProviderPrepareOrder(order) && statusByFilter[activeFilter].includes(order.status));
  }, [activeFilter, orders]);
  const newOrdersCount = orders.filter((order) => order.status === 'Confirmado' && canProviderPrepareOrder(order)).length;

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <ProviderPageHeader
        onBack={() => router.back()}
        subtitle={t('provider.marketplaceOrders.confirmedCount', { count: newOrdersCount })}
        title="__hupi_i18n:marketplace.marketplace-orders.marketplaceOrders"
      />

      <ScrollView
        contentContainerStyle={styles.filtersContent}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
      >
        {filters.map((filter) => {
          const active = activeFilter === filter;

          return (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[styles.filterChip, active && styles.activeFilterChip]}
            >
              <Text style={[styles.filterText, active && styles.activeFilterText]}>
                {t(filterTranslationKeys[filter])}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.stack}>
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <ProviderOrderCard
              expanded={expandedOrderId === order.providerOrderId}
              key={order.providerOrderId}
              onManage={() => router.push(`/provider/marketplace-order-detail?providerOrderId=${order.providerOrderId}` as Href)}
              onOpenInfoRequest={(request) => setSelectedInfoRequest(request)}
              onToggle={() => setExpandedOrderId((current) => current === order.providerOrderId ? null : order.providerOrderId)}
              order={order}
            />
          ))
        ) : (
          <Card style={styles.emptyCard} tone="soft">
            <Ionicons color={colors.secondary} name="file-tray-outline" size={24} />
            <Text style={styles.emptyTitle}>__hupi_i18n:marketplace.marketplace-orders.noOrdersInThisFilter</Text>
            <Text style={styles.emptyText}>__hupi_i18n:marketplace.marketplace-orders.whenThereIsActivityItWillAppearHereFor</Text>
          </Card>
        )}
      </View>

      <Modal animationType="fade" onRequestClose={() => setSelectedInfoRequest(null)} transparent visible={Boolean(selectedInfoRequest)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons color={colors.white} name="shield-checkmark-outline" size={26} />
            </View>
            <Text style={styles.modalTitle}>__hupi_i18n:common.hupiNeedsInformation</Text>
            <Text style={styles.modalSubtitle}>{t('providerNotifications.orderReference', { value: selectedInfoRequest?.orderNumber ?? '—' })}</Text>
            <Text style={styles.modalMessage}>{selectedInfoRequest?.hupiMessage}</Text>
            <Text style={styles.modalHint}>__hupi_i18n:marketplace.marketplace-orders.reviewTheOrderDetailsAndRespondToHupiTo</Text>
            <Button
              icon="receipt-outline"
              onPress={() => {
                const request = selectedInfoRequest;
                setSelectedInfoRequest(null);
                if (request) {
                  router.push(`/provider/marketplace-order-detail?providerOrderId=${request.providerOrderId}` as Href);
                }
              }}
              title="__hupi_i18n:common.viewOrder"
            />
            <Button onPress={() => setSelectedInfoRequest(null)} title="__hupi_i18n:marketplace.marketplace-orders.replyLater" variant="ghost" />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function ProviderOrderCard({
  expanded,
  onManage,
  onOpenInfoRequest,
  onToggle,
  order,
}: {
  expanded: boolean;
  onManage: () => void;
  onOpenInfoRequest: (request: ProviderInfoRequest) => void;
  onToggle: () => void;
  order: ProviderMarketplaceOrder;
}) {
  const { t } = useTranslation();
  const financial = getProviderOrderFinancialSummary(order);
  const providerOrderTotal = getProviderOrderSubtotal(order);
  const products = order.items.map((item) => `${item.name} x${item.quantity}`).join(', ');
  const destination = order.deliveryType === 'pickup' ? order.pickupPoint ?? order.address : order.address;
  const statusLabel = getProviderStatusDisplay(order.status, order.deliveryType);
  const blockedByPayment = !canProviderPrepareOrder(order);
  const issue = getMarketplaceIssueForOrder(order.id);
  const hasOpenIssue = hasOpenIssueForOrder(order.id);
  const providerInfoRequest = getProviderInfoRequestForOrder(order.providerOrderId);

  return (
    <Card style={styles.orderCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={styles.orderPreview}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderReference}>
            <Text style={styles.orderId}>{order.id}</Text>
            <Text style={styles.providerOrderId}>{order.providerOrderId}</Text>
          </View>
          <View style={[styles.statusBadge, blockedByPayment && styles.pendingBadge]}>
            <Text style={[styles.statusText, blockedByPayment && styles.pendingText]}>
              {blockedByPayment ? 'Pago pendiente de validación' : statusLabel}
            </Text>
          </View>
          <Ionicons color={colors.secondary} name={expanded ? 'chevron-up' : 'chevron-down'} size={19} />
        </View>
        <View style={styles.previewFacts}>
          <PreviewFact label={t('providerOrders.client')} value={order.customerName} />
          <PreviewFact label={t('providerOrders.date')} value={order.placedAt} />
          <PreviewFact label={t('providerOrders.total')} value={formatMarketplaceCurrency(providerOrderTotal)} />
          <PreviewFact label={t('providerOrders.products')} value={String(order.items.reduce((total, item) => total + item.quantity, 0))} />
        </View>
      </Pressable>

      {expanded ? <>
      {blockedByPayment ? (
        <View style={styles.blockedNotice}>
          <Ionicons color={colors.secondary} name="lock-closed-outline" size={17} />
          <View style={styles.blockedCopy}>
            <Text style={styles.blockedTitle}>__hupi_i18n:marketplace.marketplace-orders.paymentPendingValidationByHupi</Text>
            <Text style={styles.blockedText}>__hupi_i18n:marketplace.marketplace-orders.youWillBeAbleToPrepareTheOrderWhen</Text>
          </View>
        </View>
      ) : null}

      {hasOpenIssue && issue ? (
        <View style={styles.issueNotice}>
          <Ionicons color={colors.primary} name="alert-circle-outline" size={17} />
          <View style={styles.blockedCopy}>
            <Text style={styles.issueTitle}>__hupi_i18n:marketplace.marketplace-orders.openIncident</Text>
            <Text style={styles.blockedText}>__hupi_i18n:marketplace.marketplace-orders.hupiIsReviewingARequestRelatedToThisOrder</Text>
            <Text style={styles.blockedText}>{issue.reason}</Text>
          </View>
        </View>
      ) : null}

      {providerInfoRequest?.status === 'Pendiente de respuesta' ? (
        <Pressable onPress={() => onOpenInfoRequest(providerInfoRequest)} style={styles.hupiInfoBanner}>
          <Ionicons color={colors.primary} name="shield-checkmark-outline" size={18} />
          <View style={styles.blockedCopy}>
            <Text style={styles.hupiInfoTitle}>__hupi_i18n:common.hupiNeedsInformation</Text>
            <Text style={styles.blockedText}>{t('providerNotifications.orderReference', { value: providerInfoRequest.orderNumber })} · {t('providerNotifications.caseReference', { value: providerInfoRequest.caseNumber })}</Text>
            <Text style={styles.hupiInfoAction}>__hupi_i18n:marketplace.marketplace-orders.seeMessageFromHupi</Text>
          </View>
          <Ionicons color={colors.secondary} name="chevron-forward" size={18} />
        </Pressable>
      ) : null}

      <View style={styles.metaGrid}>
        <InfoPill icon="person-outline" label="__hupi_i18n:common.client" value={order.customerName} />
        <InfoPill icon="cube-outline" label="__hupi_i18n:common.products2" value={products} />
        <InfoPill icon="layers-outline" label="__hupi_i18n:common.quantity2" value={t('providerOrders.units', { count: order.items.reduce((total, item) => total + item.quantity, 0) })} />
        <InfoPill icon="receipt-outline" label="__hupi_i18n:common.totalStore" value={formatMarketplaceCurrency(providerOrderTotal)} />
        <InfoPill icon="wallet-outline" label="__hupi_i18n:common.receiveSupplier" value={formatMarketplaceCurrency(financial.providerReceives)} />
        <InfoPill icon="card-outline" label="__hupi_i18n:common.paymentStatus" value={order.paymentStatus} />
        <InfoPill icon="flag-outline" label="__hupi_i18n:marketplace.marketplace-orders.orderStatus" value={statusLabel} />
        <InfoPill icon="car-outline" label="__hupi_i18n:common.delivery" value={order.deliveryMethod} />
        <InfoPill icon="location-outline" label="__hupi_i18n:common.destination" value={destination} />
        <InfoPill icon="time-outline" label="__hupi_i18n:common.dateTime" value={order.placedAt} />
      </View>

      <View style={styles.orderActions}>
        <Button icon="settings-outline" onPress={onManage} title="__hupi_i18n:common.manageOrder" />
        <Text style={styles.chatUnavailable}>__hupi_i18n:marketplace.marketplace-order-detail.hupiWillManageCommunicationWithTheClientFromSupport</Text>
      </View>
      </> : null}
    </Card>
  );
}

function PreviewFact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewFact}>
      <Text style={styles.previewLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.previewValue}>{value}</Text>
    </View>
  );
}

function InfoPill({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoPill}>
      <Ionicons color={colors.primary} name={icon} size={16} />
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text numberOfLines={2} style={styles.infoValue}>{value}</Text>
      </View>
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
  filters: { marginTop: 22, marginHorizontal: -4 },
  filtersContent: { gap: 8, paddingHorizontal: 4 },
  filterChip: { minHeight: 36, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, justifyContent: 'center', paddingHorizontal: 12 },
  activeFilterChip: { borderColor: colors.primary, backgroundColor: colors.primary },
  filterText: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  activeFilterText: { color: colors.white },
  stack: { gap: 12, marginTop: 18 },
  orderCard: { gap: 13, shadowOpacity: 0.04 },
  orderPreview: { gap: 11 },
  orderHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  orderReference: { flex: 1, minWidth: 0 },
  orderId: { color: colors.text, fontSize: 16, fontWeight: '900' },
  providerOrderId: { color: colors.textMuted, fontSize: 12, marginTop: 3, fontWeight: '800' },
  statusBadge: { borderRadius: 999, backgroundColor: colors.secondarySoft, flexShrink: 1, paddingHorizontal: 10, paddingVertical: 6 },
  pendingBadge: { backgroundColor: colors.primarySoft },
  statusText: { color: colors.secondary, fontSize: 12, fontWeight: '900' },
  pendingText: { color: colors.primary },
  previewFacts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  previewFact: { backgroundColor: colors.soft, borderRadius: 12, flexBasis: '46%', flexGrow: 1, minWidth: 0, paddingHorizontal: 9, paddingVertical: 7 },
  previewLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800' },
  previewValue: { color: colors.text, fontSize: 12, fontWeight: '900', marginTop: 2 },
  blockedNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 15, backgroundColor: colors.secondarySoft, padding: 11 },
  blockedCopy: { flex: 1 },
  blockedTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  blockedText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 2, fontWeight: '800' },
  issueNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 15, backgroundColor: colors.primarySoft, padding: 11 },
  issueTitle: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  hupiInfoBanner: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 15, borderWidth: 1, borderColor: '#f5d3ca', backgroundColor: colors.primarySoft, padding: 11 },
  hupiInfoTitle: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  hupiInfoAction: { color: colors.secondary, fontSize: 12, fontWeight: '900', marginTop: 4 },
  metaGrid: { gap: 8 },
  orderActions: { gap: 9 },
  chatUnavailable: { color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '900', textAlign: 'center' },
  infoPill: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 14, backgroundColor: colors.soft, padding: 10 },
  infoCopy: { flex: 1 },
  infoLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  infoValue: { color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '800', marginTop: 2 },
  emptyCard: { alignItems: 'center', gap: 7, shadowOpacity: 0 },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  emptyText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(51, 51, 51, 0.36)', padding: 22 },
  modalCard: { width: '100%', maxWidth: 370, borderRadius: 22, backgroundColor: colors.white, padding: 18, gap: 12 },
  modalIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  modalSubtitle: { color: colors.secondary, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  modalMessage: { color: colors.text, fontSize: 15, lineHeight: 23, fontWeight: '800', textAlign: 'center' },
  modalHint: { color: colors.textMuted, fontSize: 13, lineHeight: 22, fontWeight: '800', textAlign: 'center' },
});
