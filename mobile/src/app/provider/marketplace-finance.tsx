import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useFocusEffect,
  useRouter } from 'expo-router';
import { useCallback,
  useState } from 'react';
import { Alert,
  Modal,
  StyleSheet,
} from 'react-native';

import { Card } from '@/components/Card';
import { ProviderPageHeader } from '@/components/provider/ProviderPageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { formatMarketplaceCurrency } from '@/components/marketplace/ProductPriceBlock';
import { colors } from '@/constants/colors';
import { getProviderIssueAdjustmentForOrder } from '@/constants/marketplaceIssuesState';
import { getDeliveredPaidProviderPayoutItems } from '@/constants/marketplaceProviderOrders';
import { currentMockMarketplaceStoreId, getProviderMarketplaceFinanceSummary } from '@/constants/marketplaceStoreState';
import { Pressable, Text } from '@/i18n/components';

const statusLabels = {
  pending_payment: 'Pendiente de pago',
  paid: 'Pagado',
};

export default function ProviderMarketplaceFinanceScreen() {
  const router = useRouter();
  const [finance, setFinance] = useState(() => getProviderMarketplaceFinanceSummary());
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);
  const [detailPayoutId, setDetailPayoutId] = useState<string | null>(null);
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);

  useFocusEffect(useCallback(() => {
    const nextFinance = getProviderMarketplaceFinanceSummary();
    setFinance(nextFinance);
    setSelectedPayoutId((current) => (
      current && nextFinance.monthlyPayouts.some((payout) => payout.id === current)
        ? current
        : nextFinance.currentPayout.id
    ));
  }, []));

  const selectedPayout = finance.monthlyPayouts.find((payout) => payout.id === (selectedPayoutId ?? finance.currentPayout.id))
    ?? finance.currentPayout;
  const selectedItems = getDeliveredPaidProviderPayoutItems(currentMockMarketplaceStoreId, selectedPayout.id, selectedPayout.month);
  const selectedPayoutSummary = getDeliveredPaidPayoutSummary(selectedPayout, selectedItems);
  const detailPayout = finance.paidPayouts.find((payout) => payout.id === detailPayoutId) ?? null;
  const detailItems = detailPayout ? getDeliveredPaidProviderPayoutItems(currentMockMarketplaceStoreId, detailPayout.id, detailPayout.month) : [];
  const detailPayoutSummary = detailPayout ? getDeliveredPaidPayoutSummary(detailPayout, detailItems) : null;
  const detailSummaryDocument = detailPayout
    ? finance.summaryDocuments.find((document) => document.payout.id === detailPayout.id)
    : null;
  const totalAdjustments = getPayoutAdjustmentsTotal(selectedPayout);

  const downloadSummaryMock = (format: 'PDF' | 'Excel') => {
    setDownloadModalVisible(false);
    Alert.alert(
      `${format} generado`,
      `En producción se descargará el resumen de liquidación en ${format}.`,
    );
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <ProviderPageHeader
        onBack={() => router.back()}
        subtitle="__hupi_i18n:marketplace.marketplace-finance.onlyVisibleInProviderMode"
        title="__hupi_i18n:marketplace.marketplace-finance.financialSummary"
      />

      <Card style={styles.monthFilter} tone="soft">
        <Text style={styles.sectionTitle}>__hupi_i18n:marketplace.marketplace-finance.settlementMonth</Text>
        <View style={styles.monthChips}>
          {finance.monthlyPayouts.map((payout) => {
            const isSelected = payout.id === selectedPayout.id;

            return (
              <Pressable
                accessibilityRole="button"
                key={payout.id}
                onPress={() => setSelectedPayoutId(payout.id)}
                style={[styles.monthChip, isSelected && styles.monthChipActive]}
              >
                <Text style={[styles.monthChipText, isSelected && styles.monthChipTextActive]}>{payout.month}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={styles.summaryCard} tone="purple">
        <Text style={styles.eyebrow}>__hupi_i18n:marketplace.marketplace-finance.marketplaceMonthlyClearance</Text>
        <Text style={styles.total}>{formatMarketplaceCurrency(selectedPayoutSummary.totalToTransfer)}</Text>
        <Text style={styles.note}>__hupi_i18n:marketplace.marketplace-finance.totalToTransferForTheClosedMonth {selectedPayout.month}</Text>
      </Card>

      <Card style={styles.section}>
        <InfoRow label="__hupi_i18n:common.monthSettled" value={selectedPayout.month} />
        <InfoRow label="__hupi_i18n:marketplace.marketplace-finance.grossSalesForTheMonth" value={formatMarketplaceCurrency(selectedPayoutSummary.grossSales)} />
        <InfoRow label="__hupi_i18n:marketplace.marketplace-finance.hupiMarketplaceCommission30" value={`-${formatMarketplaceCurrency(selectedPayoutSummary.hupiCommission)}`} />
        <InfoRow label="__hupi_i18n:marketplace.marketplace-finance.supplierNetValue70" value={formatMarketplaceCurrency(selectedPayoutSummary.providerNet)} />
        <InfoRow label="__hupi_i18n:common.refunds" value={`-${formatMarketplaceCurrency(selectedPayout.adjustments.refunds)}`} />
        <InfoRow label="__hupi_i18n:marketplace.marketplace-finance.canceledOrders" value={`-${formatMarketplaceCurrency(selectedPayout.adjustments.canceledOrders)}`} />
        <InfoRow label="__hupi_i18n:marketplace.marketplace-finance.administrativeDiscounts" value={`-${formatMarketplaceCurrency(selectedPayout.adjustments.administrativeDiscounts)}`} />
        <InfoRow label="__hupi_i18n:common.otherSettings" value={`-${formatMarketplaceCurrency(selectedPayout.adjustments.others)}`} />
        <InfoRow label="__hupi_i18n:common.totalSettings" value={`-${formatMarketplaceCurrency(totalAdjustments)}`} />
        <InfoRow label="__hupi_i18n:marketplace.marketplace-finance.totalToTransfer" value={formatMarketplaceCurrency(selectedPayoutSummary.totalToTransfer)} strong />
        <InfoRow label="__hupi_i18n:marketplace.marketplace-finance.liquidationStatus" value={getPayoutStatusLabel(selectedPayout)} />
        <InfoRow label="__hupi_i18n:marketplace.marketplace-finance.nextSettlement" value={selectedPayout.nextPayoutDate} />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>__hupi_i18n:marketplace.marketplace-finance.documentsOfThePeriod</Text>
        <InfoRow label="__hupi_i18n:common.monthSettled" value={selectedPayout.month} />
        <InfoRow label="__hupi_i18n:common.salesIncluded" value={`${selectedItems.length} ventas`} />
        <InfoRow label="__hupi_i18n:common.grossTotal" value={formatMarketplaceCurrency(selectedPayoutSummary.grossSales)} />
        <InfoRow label="__hupi_i18n:common.hupiCommission" value={`-${formatMarketplaceCurrency(selectedPayoutSummary.hupiCommission)}`} />
        <InfoRow label="__hupi_i18n:marketplace.marketplace-finance.valueToTransfer" value={formatMarketplaceCurrency(selectedPayoutSummary.totalToTransfer)} strong />
        <InfoRow label="__hupi_i18n:marketplace.marketplace-finance.liquidationStatus" value={getPayoutStatusLabel(selectedPayout)} />
        <Pressable onPress={() => setDownloadModalVisible(true)} style={styles.downloadButton}>
          <Ionicons color={colors.white} name="download-outline" size={16} />
          <Text style={styles.downloadText}>__hupi_i18n:marketplace.marketplace-finance.downloadSummary</Text>
        </Pressable>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>__hupi_i18n:marketplace.marketplace-finance.productsIncludedInTheMonth</Text>
        {selectedItems.length > 0 ? (
          <View style={styles.items}>
            {selectedItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemCopy}>
                  <Text style={styles.itemTitle}>{item.product}</Text>
                  <Text style={styles.itemMeta}>{item.orderNumber}  __hupi_i18n:common.sku {item.sku} · {item.quantity}  __hupi_i18n:common.a</Text>
                  {getProviderIssueAdjustmentForOrder(item.orderNumber) > 0 ? (
                    <Text style={styles.adjustmentTag}>__hupi_i18n:marketplace.marketplace-finance.refundAdjustment{formatMarketplaceCurrency(getProviderIssueAdjustmentForOrder(item.orderNumber))}</Text>
                  ) : null}
                </View>
                <Text style={styles.itemAmount}>{formatMarketplaceCurrency(item.providerValue)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>__hupi_i18n:marketplace.marketplace-finance.thereAreNoLiquidatedProductsForThisMonth</Text>
        )}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>__hupi_i18n:marketplace.marketplace-finance.historyOfPaidSettlements</Text>
        <View style={styles.settlements}>
          {finance.paidPayouts.map((settlement) => (
            <Pressable
              accessibilityRole="button"
              key={settlement.id}
              onPress={() => setDetailPayoutId(settlement.id)}
              style={styles.settlementCard}
            >
              <View style={styles.settlementIcon}>
                <Ionicons color={colors.success} name="checkmark-circle-outline" size={18} />
              </View>
              <View style={styles.settlementCopy}>
                <Text style={styles.settlementDate}>{settlement.month}</Text>
                <Text style={styles.settlementStatus}>
                  {settlement.paidAt ? `Pagado · ${settlement.paidAt}` : 'Pagado'}
                </Text>
              </View>
              <Text style={styles.settlementAmount}>{formatMarketplaceCurrency(getDeliveredPaidPayoutSummary(settlement, getDeliveredPaidProviderPayoutItems(currentMockMarketplaceStoreId, settlement.id, settlement.month)).totalToTransfer)}</Text>
              <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
            </Pressable>
          ))}
        </View>
      </Card>

      {detailPayout ? (
        <Card style={styles.section}>
          <View style={styles.detailHeader}>
            <View style={styles.detailHeading}>
              <Text style={styles.sectionTitle}>__hupi_i18n:marketplace.marketplace-finance.monthlySettlementDetails</Text>
              <Text style={styles.detailMonth}>{detailPayout.month}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => setDetailPayoutId(null)} style={styles.closeDetailButton}>
              <Ionicons color={colors.text} name="close" size={18} />
            </Pressable>
          </View>

          <InfoRow label="__hupi_i18n:common.monthSettled" value={detailPayout.month} />
          <InfoRow label="__hupi_i18n:common.status" value={getPayoutStatusLabel(detailPayout)} />
          <InfoRow label="__hupi_i18n:common.paymentDate" value={detailPayout.paidAt ?? 'Pendiente'} />
          <InfoRow label="__hupi_i18n:common.grossSales" value={formatMarketplaceCurrency(detailPayoutSummary?.grossSales ?? 0)} />
          <InfoRow label="__hupi_i18n:marketplace.marketplace-finance.hupiCommission30" value={`-${formatMarketplaceCurrency(detailPayoutSummary?.hupiCommission ?? 0)}`} />
          <InfoRow label="__hupi_i18n:marketplace.marketplace-finance.supplierNetValue70" value={formatMarketplaceCurrency(detailPayoutSummary?.providerNet ?? 0)} />
          <InfoRow label="__hupi_i18n:common.settings" value={`-${formatMarketplaceCurrency(getPayoutAdjustmentsTotal(detailPayout))}`} />
          <InfoRow label="__hupi_i18n:marketplace.marketplace-finance.totalTransferred" value={formatMarketplaceCurrency(detailPayoutSummary?.totalToTransfer ?? 0)} strong />

          <Text style={styles.detailSectionTitle}>__hupi_i18n:marketplace.marketplace-finance.soldProductsOfTheMonth</Text>
          <View style={styles.detailItems}>
            {detailItems.map((item) => (
              <View key={item.id} style={styles.detailItemCard}>
                <View style={styles.detailItemHeader}>
                  <View style={styles.itemCopy}>
                    <Text style={styles.itemTitle}>{item.product}</Text>
                    <Text style={styles.itemMeta}>{item.date} · {item.orderNumber}</Text>
                  </View>
                  <Text style={styles.itemAmount}>{formatMarketplaceCurrency(item.providerValue)}</Text>
                </View>
                <InfoRow label="__hupi_i18n:common.sku2" value={item.sku} />
                <InfoRow label="__hupi_i18n:common.quantity2" value={`${item.quantity} un.`} />
                <InfoRow label="__hupi_i18n:common.soldPrice" value={formatMarketplaceCurrency(item.soldPrice)} />
                <InfoRow label="__hupi_i18n:common.totalProduct" value={formatMarketplaceCurrency(item.productTotal)} />
                <InfoRow label="__hupi_i18n:common.hupiCommission" value={`-${formatMarketplaceCurrency(item.hupiCommission)}`} />
                <InfoRow label="__hupi_i18n:common.supplierValue" value={formatMarketplaceCurrency(item.providerValue)} strong />
                {getProviderIssueAdjustmentForOrder(item.orderNumber) > 0 ? (
                  <InfoRow label="__hupi_i18n:marketplace.marketplace-finance.incidentAdjustment" value={`-${formatMarketplaceCurrency(getProviderIssueAdjustmentForOrder(item.orderNumber))}`} />
                ) : null}
              </View>
            ))}
          </View>

          {detailPayout.summaryDocumentAvailable && detailSummaryDocument ? (
            <Pressable onPress={() => setDownloadModalVisible(true)} style={styles.downloadButton}>
              <Ionicons color={colors.white} name="download-outline" size={16} />
              <Text style={styles.downloadText}>__hupi_i18n:marketplace.marketplace-finance.downloadSummary</Text>
            </Pressable>
          ) : null}
        </Card>
      ) : null}

      <Modal
        animationType="fade"
        onRequestClose={() => setDownloadModalVisible(false)}
        transparent
        visible={downloadModalVisible}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.downloadModal}>
            <View style={styles.modalIcon}>
              <Ionicons color={colors.primary} name="download-outline" size={24} />
            </View>
            <Text style={styles.modalTitle}>__hupi_i18n:marketplace.marketplace-finance.downloadSummary</Text>
            <Text style={styles.modalMessage}>

              __hupi_i18n:marketplace.marketplace-finance.chooseTheFormatInWhichYouWantToDownload
            </Text>
            <Pressable onPress={() => downloadSummaryMock('PDF')} style={styles.pdfButton}>
              <Text style={styles.modalPrimaryText}>__hupi_i18n:common.downloadPdf</Text>
            </Pressable>
            <Pressable onPress={() => downloadSummaryMock('Excel')} style={styles.excelButton}>
              <Text style={styles.modalPrimaryText}>__hupi_i18n:common.downloadExcel</Text>
            </Pressable>
            <Pressable onPress={() => setDownloadModalVisible(false)} style={styles.cancelButton}>
              <Text style={styles.cancelText}>__hupi_i18n:common.cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function getPayoutStatusLabel(payout: {
  providerCanSeeAsPaid: boolean;
  status: keyof typeof statusLabels;
  transferProofUploadedByAdmin: boolean;
}) {
  return payout.status === 'paid' && payout.transferProofUploadedByAdmin && payout.providerCanSeeAsPaid
    ? statusLabels.paid
    : statusLabels.pending_payment;
}

function getPayoutAdjustmentsTotal(payout: {
  adjustments: {
    refunds: number;
    canceledOrders: number;
    administrativeDiscounts: number;
    others: number;
  };
}) {
  return payout.adjustments.refunds
    + payout.adjustments.canceledOrders
    + payout.adjustments.administrativeDiscounts
    + payout.adjustments.others;
}

function getDeliveredPaidPayoutSummary(
  payout: {
    adjustments: {
      refunds: number;
      canceledOrders: number;
      administrativeDiscounts: number;
      others: number;
    };
  },
  items: Array<{
    hupiCommission: number;
    orderNumber: string;
    productTotal: number;
    providerValue: number;
  }>,
) {
  const grossSales = Number(items.reduce((total, item) => total + item.productTotal, 0).toFixed(2));
  const hupiCommission = Number(items.reduce((total, item) => total + item.hupiCommission, 0).toFixed(2));
  const providerNet = Number(items.reduce((total, item) => total + item.providerValue, 0).toFixed(2));
  const issueAdjustments = items.reduce((total, item) => total + getProviderIssueAdjustmentForOrder(item.orderNumber), 0);
  const totalAdjustments = getPayoutAdjustmentsTotal(payout) + issueAdjustments;

  return {
    grossSales,
    hupiCommission,
    providerNet,
    totalToTransfer: Math.max(0, Number((providerNet - totalAdjustments).toFixed(2))),
  };
}

function InfoRow({ label, strong = false, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, strong && styles.strongValue]}>{value}</Text>
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
  monthFilter: { gap: 10, marginTop: 22, shadowOpacity: 0 },
  monthChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthChip: { minHeight: 38, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13 },
  monthChipActive: { borderColor: colors.secondary, backgroundColor: colors.secondary },
  monthChipText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  monthChipTextActive: { color: colors.white },
  summaryCard: { gap: 6, marginTop: 14, shadowOpacity: 0 },
  eyebrow: { color: colors.secondary, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  total: { color: colors.text, fontSize: 30, lineHeight: 38, fontWeight: '900', paddingBottom: 2 },
  note: { color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  section: { gap: 10, marginTop: 14, shadowOpacity: 0.04 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  infoRow: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 9 },
  infoLabel: { flex: 1, color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  infoValue: { flex: 1.2, color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '900', textAlign: 'right' },
  strongValue: { color: colors.secondary, fontSize: 15 },
  settlements: { gap: 9 },
  items: { gap: 8 },
  emptyText: { color: colors.textMuted, fontSize: 13, fontWeight: '800', lineHeight: 21 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 15, backgroundColor: colors.soft, padding: 10 },
  itemCopy: { flex: 1 },
  itemTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  itemMeta: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 2, fontWeight: '800' },
  adjustmentTag: { color: colors.primary, fontSize: 12, lineHeight: 19, marginTop: 2, fontWeight: '900' },
  itemAmount: { color: colors.secondary, fontSize: 13, fontWeight: '900' },
  settlementCard: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 15, backgroundColor: colors.soft, padding: 10 },
  settlementIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  settlementCopy: { flex: 1 },
  settlementDate: { color: colors.text, fontSize: 13, fontWeight: '900' },
  settlementStatus: { color: colors.textMuted, fontSize: 12, marginTop: 2, fontWeight: '800' },
  settlementAmount: { color: colors.secondary, fontSize: 13, fontWeight: '900' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailHeading: { flex: 1 },
  detailMonth: { color: colors.textMuted, fontSize: 13, fontWeight: '800', marginTop: 2 },
  closeDetailButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  detailSectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 6 },
  detailItems: { gap: 9 },
  detailItemCard: { gap: 8, borderRadius: 15, backgroundColor: colors.soft, padding: 10 },
  detailItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  downloadButton: { minHeight: 42, borderRadius: 13, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 12 },
  downloadText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(51, 51, 51, 0.34)', padding: 22 },
  downloadModal: { width: '100%', maxWidth: 360, borderRadius: 22, backgroundColor: colors.white, padding: 18, alignItems: 'stretch', gap: 11 },
  modalIcon: { width: 48, height: 48, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  modalMessage: { color: colors.textMuted, fontSize: 13, lineHeight: 22, fontWeight: '800', textAlign: 'center' },
  pdfButton: { minHeight: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  excelButton: { minHeight: 44, borderRadius: 14, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  modalPrimaryText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  cancelButton: { minHeight: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  cancelText: { color: colors.text, fontSize: 13, fontWeight: '900' },
});
