import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useFocusEffect,
  useLocalSearchParams,
  useRouter } from 'expo-router';
import { useCallback,
  useMemo,
  useState } from 'react';
import { Modal,
  StyleSheet,
} from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HupiPagesLogo } from '@/components/HupiPagesLogo';
import { HupiSuccessModal } from '@/components/HupiSuccessModal';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { canReviewProduct, mockCustomerOrders, mockProductReviews } from '@/constants/mockData';
import { Pressable, Text, TextInput } from '@/i18n/components';
import {
  getMarketplaceOrder,
  getOrderTimelineCurrentStep,
  marketplaceTimelineSteps,
  saveMarketplacePaymentProofDraft,
  submitMarketplaceOrderRating,
  uploadMarketplacePaymentProof,
  type MarketplaceClientOrder,
} from '@/constants/marketplaceOrdersState';

export default function MarketplaceOrderDetailScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [order, setOrder] = useState(() => getMarketplaceOrder(orderId));
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [storeRating, setStoreRating] = useState(5);
  const [productRating, setProductRating] = useState(5);
  const [comment, setComment] = useState('');
  const [successModal, setSuccessModal] = useState<{
    description: string;
    reference?: string;
    title: string;
  } | null>(null);
  const currentTimelineStep = getOrderTimelineCurrentStep(order);
  const groupedProducts = useMemo(() => groupProductsByStore(order), [order]);
  const needsProof = order.paymentStatus === 'Pendiente de comprobante';
  const rejectedProof = order.paymentStatus === 'Comprobante rechazado';
  const canSendProof = needsProof || rejectedProof;
  const canDownloadReceipt = order.receiptAvailable || order.paymentStatus === 'Pagado con tarjeta' || order.paymentStatus === 'Pago validado';
  const productReviewAlreadySubmitted = order.products.some((product) => (
    canReviewProduct(product.id, mockCustomerOrders, mockProductReviews).reason === 'already_reviewed'
  ));

  useFocusEffect(useCallback(() => {
    setOrder(getMarketplaceOrder(orderId));
  }, [orderId]));

  const loadProofDraft = () => {
    const updated = saveMarketplacePaymentProofDraft(order.id);
    setOrder(updated);
  };

  const sendProof = () => {
    const wasRejected = rejectedProof;
    const updated = uploadMarketplacePaymentProof(order.id);
    setOrder(updated);
    setSuccessModal({
      title: 'Comprobante enviado',
      description: wasRejected ? 'Hupi revisará nuevamente tu pago.' : 'Hupi revisará tu pago y te notificará cuando sea validado.',
    });
  };

  const downloadReceipt = (format: 'PDF' | 'Excel') => {
    setReceiptModalVisible(false);
    setSuccessModal({
      title: `Recibo ${format}`,
      description: 'La descarga en PDF se habilitará al conectar facturación.',
    });
  };

  const downloadInvoice = () => {
    setSuccessModal({
      title: 'Factura',
      description: 'La descarga en PDF se habilitará al conectar facturación.',
    });
  };

  const requestInvoice = () => {
    setSuccessModal({
      title: 'Solicitud enviada',
      description: 'Hupi procesará el documento y lo enviará al correo registrado.',
    });
  };

  const sendRating = () => {
    const updated = submitMarketplaceOrderRating(order.id, {
      comment: comment.trim() || undefined,
      product: productRating,
      store: storeRating,
    });
    setOrder(updated);
    setSuccessModal({
      title: 'Calificación enviada',
      description: 'Gracias por compartir tu experiencia.',
    });
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.topbar}>
        <Pressable accessibilityLabel="__hupi_i18n:common.back" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={colors.text} name="arrow-back" size={22} />
        </Pressable>
        <View style={styles.heading}>
          <Text style={styles.title}>{order.orderNumber}</Text>
          <Text style={styles.subtitle}>{order.createdAt}</Text>
        </View>
      </View>

      <Card style={styles.statusCard} tone={order.orderStatus === 'Cancelado' ? 'coral' : 'soft'}>
        <View style={styles.statusHeader}>
          <StatusBadge label={order.orderStatus} tone={order.orderStatus === 'Cancelado' ? 'coral' : 'purple'} />
          <StatusBadge label={order.paymentStatus} tone={needsProof || rejectedProof ? 'coral' : 'soft'} />
        </View>
        <InfoRow label="__hupi_i18n:common.paymentMethod" value={order.paymentMethod} />
        <InfoRow label="__hupi_i18n:common.deliveryAddress" value={order.deliveryAddress} />
        <InfoRow label="__hupi_i18n:common.shippingMethod" value={order.shippingMethod} />
      </Card>

      {canSendProof ? (
        <Card style={styles.pendingCard}>
          <View style={styles.pendingIcon}>
            <Ionicons color={colors.primary} name="document-attach-outline" size={22} />
          </View>
          <View style={styles.pendingCopy}>
            <Text style={styles.pendingTitle}>{rejectedProof ? 'Tu comprobante necesita corrección.' : 'Comprobante pendiente'}</Text>
            <Text style={styles.pendingText}>
              {rejectedProof
                ? 'Por favor carga un comprobante válido para continuar con tu pedido.'
                : 'Sube tu comprobante para que Hupi valide tu pago.'}
            </Text>
          </View>
          {order.proofDraftLoaded ? (
            <View style={styles.proofDraftBox}>
              <Ionicons color={colors.success} name="checkmark-circle-outline" size={17} />
              <Text style={styles.proofDraftText}>__hupi_i18n:marketplace.order-detail.receiptUploadedInDraft</Text>
            </View>
          ) : null}
          <View style={styles.proofActions}>
            <Button
              icon="cloud-upload-outline"
              onPress={order.proofDraftLoaded ? sendProof : loadProofDraft}
              title={order.proofDraftLoaded ? 'Enviar comprobante' : rejectedProof ? 'Subir comprobante corregido' : 'Subir comprobante'}
            />
            {order.proofDraftLoaded ? (
              <Button icon="create-outline" onPress={loadProofDraft} title="__hupi_i18n:marketplace.order-detail.editReceipt" variant="outline" />
            ) : null}
          </View>
        </Card>
      ) : null}

      {order.paymentStatus === 'Comprobante enviado' ? (
        <Card style={styles.reviewCard} tone="soft">
          <Ionicons color={colors.secondary} name="hourglass-outline" size={20} />
          <View style={styles.reviewCopy}>
            <Text style={styles.reviewTitle}>__hupi_i18n:common.paymentInReview</Text>
            <Text style={styles.reviewText}>__hupi_i18n:marketplace.order-detail.theReceiptHasBeenSentAndCanNoLonger</Text>
          </View>
        </Card>
      ) : null}

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>__hupi_i18n:marketplace.order-detail.orderTimeline</Text>
        <View style={styles.timeline}>
          {marketplaceTimelineSteps.map((step, index) => {
            const currentIndex = marketplaceTimelineSteps.indexOf(currentTimelineStep);
            const active = order.orderStatus !== 'Cancelado' && index <= currentIndex;
            const current = step === currentTimelineStep && order.orderStatus !== 'Cancelado';

            return (
              <View key={step} style={styles.timelineRow}>
                <View style={[styles.timelineDot, active && styles.timelineDotActive, current && styles.timelineDotCurrent]}>
                  {active ? <Ionicons color={colors.white} name="checkmark" size={12} /> : null}
                </View>
                <Text style={[styles.timelineText, active && styles.timelineTextActive]}>{step}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>__hupi_i18n:marketplace.order-detail.productsByStore</Text>
        {groupedProducts.map((group) => (
          <View key={group.store.id} style={styles.storeGroup}>
            <View style={styles.storeHeader}>
              <View style={styles.storeCopy}>
                <View style={styles.storeNameRow}>
                  <Text style={styles.storeName}>{group.store.name}</Text>
                  {group.store.isOfficialStore ? (
                    <View style={styles.officialCheck}>
                      <Ionicons color={colors.white} name="checkmark" size={11} />
                    </View>
                  ) : null}
                </View>
                <Text style={styles.storeStatus}>{group.store.preparationStatus}</Text>
              </View>
              <View style={styles.storeBadges}>
                {group.store.isOfficialStore ? <StatusBadge label="__hupi_i18n:common.officialStore" tone="purple" /> : null}
                {group.store.isVerifiedByHupi ? <StatusBadge label="__hupi_i18n:common.verifiedByHupi" tone="success" /> : null}
              </View>
            </View>
            {group.products.map((product) => (
              <View key={`${group.store.id}-${product.id}`} style={styles.productRow}>
                <View style={[styles.productThumb, { backgroundColor: product.color }]}>
                  <Text style={styles.productEmoji}>{product.emoji}</Text>
                </View>
                <View style={styles.productCopy}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productMeta}>__hupi_i18n:common.quantity2 {product.quantity} · {product.brand}</Text>
                </View>
                <View style={styles.productTotals}>
                  <Text style={styles.productUnit}>${product.unitPrice.toFixed(2)}</Text>
                  <Text style={styles.productTotal}>${(product.unitPrice * product.quantity).toFixed(2)}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>__hupi_i18n:common.paymentSummary</Text>
        <InfoRow label="__hupi_i18n:common.subtotal" value={`$${order.subtotal.toFixed(2)}`} />
        <InfoRow label="__hupi_i18n:common.shipping" value={`$${order.shippingCost.toFixed(2)}`} />
        <InfoRow label={order.couponCode ? `Descuento / cupón ${order.couponCode}` : 'Descuento / cupón'} value={`-$${order.discount.toFixed(2)}`} />
        {order.hupiBalanceApplied && order.hupiBalanceApplied > 0 ? (
          <InfoRow label="__hupi_i18n:marketplace.order-detail.hupiBalanceApplied" value={`-$${order.hupiBalanceApplied.toFixed(2)}`} />
        ) : null}
        <InfoRow label="__hupi_i18n:common.hupiFoundationDonation" value={`$${order.donation.toFixed(2)}`} />
        {order.hupiBalanceApplied && order.hupiBalanceApplied > 0 ? (
          <InfoRow label="__hupi_i18n:marketplace.order-detail.totalPaidWithAdditionalMethod" value={`$${order.total.toFixed(2)}`} />
        ) : null}
        <InfoRow label="__hupi_i18n:common.finalTotal" strong value={`$${order.total.toFixed(2)}`} />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>__hupi_i18n:marketplace.order-detail.purchaseDocuments</Text>
        <View style={styles.documentPanel}>
          <View style={styles.receiptHeader}>
            <View style={styles.documentCopy}>
              <Text style={styles.documentTitle}>__hupi_i18n:common.purchaseReceipt</Text>
              <Text style={styles.receiptMeta}>__hupi_i18n:marketplace.order-detail.downloadTheSummaryOfYourOrder</Text>
              <Text style={styles.documentStatus}>__hupi_i18n:common.status2 {order.documents.receiptStatus}</Text>
            </View>
            <HupiPagesLogo height={34} style={styles.documentLogo} width={106} />
          </View>
          <Button disabled={!canDownloadReceipt} icon="download-outline" onPress={() => setReceiptModalVisible(true)} title="__hupi_i18n:common.downloadReceipt" variant="outline" />
        </View>
        <View style={styles.documentPanel}>
          <View style={styles.documentHeader}>
            <View style={styles.documentIcon}>
              <Ionicons color={colors.secondary} name="document-text-outline" size={18} />
            </View>
            <View style={styles.documentCopy}>
              <Text style={styles.documentTitle}>__hupi_i18n:marketplace.order-detail.invoiceTaxDocument</Text>
              <Text style={styles.documentStatus}>__hupi_i18n:marketplace.order-detail.documentStatus {order.documents.invoiceStatus}</Text>
              <Text style={styles.receiptMeta}>__hupi_i18n:common.email {order.billingProfile.billingEmail}</Text>
            </View>
          </View>
          {order.documents.invoiceStatus === 'Emitido' || order.documents.invoiceStatus === 'Enviado al correo' ? (
            <Button icon="download-outline" onPress={downloadInvoice} title="__hupi_i18n:marketplace.order-detail.downloadInvoice" variant="secondary" />
          ) : null}
          {order.documents.invoiceStatus === 'Pendiente de emisión' ? (
            <Button icon="send-outline" onPress={requestInvoice} title="__hupi_i18n:marketplace.order-detail.requestInvoice" variant="outline" />
          ) : null}
        </View>
      </Card>

      {order.orderStatus === 'Cancelado' ? (
        <Card style={styles.cancelCard}>
          <Text style={styles.sectionTitle}>__hupi_i18n:common.canceledOrder</Text>
          <InfoRow label="__hupi_i18n:common.reason" value={order.cancellationReason ?? 'Cancelación solicitada por soporte Hupi.'} />
          <InfoRow label="__hupi_i18n:common.resolution" value={order.refundResolution ?? 'Reembolso pendiente.'} />
        </Card>
      ) : null}

      {order.orderStatus === 'Entregado' ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>__hupi_i18n:marketplace.order-detail.howWasYourExperience</Text>
          {order.ratingSubmitted || productReviewAlreadySubmitted ? (
            <View style={styles.ratingDoneBox}>
              <Text style={styles.ratingDone}>__hupi_i18n:marketplace.order-detail.youHaveAlreadyRatedThisProduct</Text>
              <Text style={styles.ratingDoneMeta}>__hupi_i18n:marketplace.order-detail.thankYouForHelpingOtherTutorsWithYourExperience</Text>
            </View>
          ) : (
            <>
              <RatingRow label="__hupi_i18n:common.storeSupplier" value={storeRating} onChange={setStoreRating} />
              <RatingRow label="__hupi_i18n:common.product" value={productRating} onChange={setProductRating} />
              <TextInput
                multiline
                onChangeText={setComment}
                placeholder="__hupi_i18n:common.optionalComment"
                placeholderTextColor={colors.textMuted}
                style={styles.commentInput}
                value={comment}
              />
              <Button icon="star-outline" onPress={sendRating} title="__hupi_i18n:marketplace.order-detail.submitRating" />
            </>
          )}
        </Card>
      ) : null}

      <Card style={styles.supportEndCard} tone="soft">
        <View style={styles.chatAccessHeader}>
          <View style={styles.chatAccessIcon}>
            <Ionicons color={colors.primary} name="shield-checkmark-outline" size={21} />
          </View>
          <View style={styles.chatAccessCopy}>
            <Text style={styles.chatAccessTitle}>__hupi_i18n:marketplace.order-detail.doYouNeedHelpWithThisOrder</Text>
            <Text style={styles.chatAccessText}>

              __hupi_i18n:marketplace.order-detail.hupiSupportWillManageYourCaseAndWeWill
            </Text>
          </View>
        </View>
        <Button
          icon="help-circle-outline"
          onPress={() => router.push(`/support?orderNumber=${order.orderNumber}` as Href)}
          title="__hupi_i18n:marketplace.order-detail.contactHupiSupport"
          variant="outline"
        />
      </Card>

      <Modal animationType="fade" onRequestClose={() => setReceiptModalVisible(false)} transparent visible={receiptModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons color={colors.primary} name="receipt-outline" size={24} />
            </View>
            <Text style={styles.modalTitle}>__hupi_i18n:common.downloadReceipt</Text>
            <Text style={styles.modalMessage}>__hupi_i18n:marketplace.order-detail.chooseTheFormatToDownloadTheSummaryOfYour</Text>
            <Button icon="document-text-outline" onPress={() => downloadReceipt('PDF')} title="__hupi_i18n:common.downloadPdf" />
            <Button icon="grid-outline" onPress={() => downloadReceipt('Excel')} title="__hupi_i18n:common.downloadExcel" variant="secondary" />
            <Button onPress={() => setReceiptModalVisible(false)} title="__hupi_i18n:common.cancel" variant="ghost" />
          </View>
        </View>
      </Modal>

      <HupiSuccessModal
        description={successModal?.description ?? ''}
        onClose={() => setSuccessModal(null)}
        reference={successModal?.reference}
        title={successModal?.title ?? ''}
        visible={Boolean(successModal)}
      />
    </ScreenContainer>
  );
}

function groupProductsByStore(order: MarketplaceClientOrder) {
  return order.stores.map((store) => ({
    store,
    products: order.products.filter((product) => product.storeId === store.id),
  }));
}

function InfoRow({ label, strong = false, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, strong && styles.strongValue]}>{value}</Text>
    </View>
  );
}

function RatingRow({ label, onChange, value }: { label: string; onChange: (value: number) => void; value: number }) {
  return (
    <View style={styles.ratingRow}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <Pressable key={rating} onPress={() => onChange(rating)}>
            <Ionicons color={rating <= value ? colors.primary : colors.border} name="star" size={24} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: 'coral' | 'purple' | 'soft' | 'success' }) {
  return (
    <View style={[styles.badge, tone === 'coral' && styles.coralBadge, tone === 'purple' && styles.purpleBadge, tone === 'success' && styles.successBadge]}>
      <Text style={[styles.badgeText, tone === 'coral' && styles.coralBadgeText, tone === 'purple' && styles.purpleBadgeText, tone === 'success' && styles.successBadgeText]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 42 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1 },
  title: { color: colors.text, fontSize: 25, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4, fontWeight: '800' },
  statusCard: { gap: 9, marginTop: 22, shadowOpacity: 0 },
  statusHeader: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { minHeight: 25, borderRadius: 999, backgroundColor: colors.soft, justifyContent: 'center', paddingHorizontal: 9 },
  coralBadge: { backgroundColor: colors.primarySoft },
  purpleBadge: { backgroundColor: colors.secondarySoft },
  successBadge: { backgroundColor: '#eef9f3' },
  badgeText: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  coralBadgeText: { color: colors.primary },
  purpleBadgeText: { color: colors.secondary },
  successBadgeText: { color: colors.success },
  infoRow: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  infoLabel: { flex: 1, color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  infoValue: { flex: 1.2, color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '900', textAlign: 'right' },
  strongValue: { color: colors.secondary, fontSize: 15 },
  pendingCard: { gap: 11, marginTop: 14, shadowOpacity: 0.05 },
  pendingIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  pendingCopy: { gap: 3 },
  pendingTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  pendingText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  proofDraftBox: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 14, backgroundColor: '#eef9f3', padding: 10 },
  proofDraftText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  proofActions: { gap: 9 },
  reviewCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 14, shadowOpacity: 0 },
  reviewCopy: { flex: 1 },
  reviewTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  reviewText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 3, fontWeight: '800' },
  supportEndCard: { gap: 12, marginTop: 14, shadowOpacity: 0 },
  chatAccessHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  chatAccessIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  chatAccessCopy: { flex: 1 },
  chatAccessTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  chatAccessText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 3, fontWeight: '800' },
  chatStoreList: { gap: 8 },
  section: { gap: 11, marginTop: 14, shadowOpacity: 0.04 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  timeline: { gap: 9 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  timelineDotActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  timelineDotCurrent: { backgroundColor: colors.primary, borderColor: colors.primary },
  timelineText: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  timelineTextActive: { color: colors.text, fontWeight: '900' },
  storeGroup: { gap: 9, borderRadius: 16, backgroundColor: colors.soft, padding: 11 },
  storeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  storeCopy: { flex: 1 },
  storeNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  storeName: { color: colors.text, fontSize: 15, fontWeight: '900' },
  officialCheck: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  storeStatus: { color: colors.textMuted, fontSize: 12, marginTop: 2, fontWeight: '800' },
  storeBadges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 5, maxWidth: 180 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, backgroundColor: colors.white, padding: 9 },
  productThumb: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  productEmoji: { color: colors.primary, fontSize: 15, fontWeight: '900' },
  productCopy: { flex: 1 },
  productName: { color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '900' },
  productMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2, fontWeight: '800' },
  productTotals: { alignItems: 'flex-end' },
  productUnit: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  productTotal: { color: colors.secondary, fontSize: 13, marginTop: 3, fontWeight: '900' },
  receiptCard: { gap: 11, marginTop: 14, shadowOpacity: 0.04 },
  receiptHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  receiptMeta: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 3, fontWeight: '800' },
  documentPanel: { gap: 10, borderRadius: 16, backgroundColor: colors.soft, padding: 11 },
  documentHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  documentIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  documentCopy: { flex: 1 },
  documentTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  documentStatus: { color: colors.secondary, fontSize: 12, lineHeight: 19, marginTop: 3, fontWeight: '900' },
  documentLogo: { marginLeft: 'auto' },
  cancelCard: { gap: 9, marginTop: 14, backgroundColor: colors.primarySoft, shadowOpacity: 0 },
  ratingRow: { gap: 7 },
  ratingLabel: { color: colors.text, fontSize: 13, fontWeight: '900' },
  stars: { flexDirection: 'row', gap: 4 },
  commentInput: { minHeight: 86, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.text, padding: 12, textAlignVertical: 'top', fontWeight: '800' },
  ratingDoneBox: { gap: 4, borderRadius: 15, backgroundColor: colors.soft, padding: 11 },
  ratingDone: { color: colors.text, fontSize: 13, lineHeight: 22, fontWeight: '900' },
  ratingDoneMeta: { color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  issueSummary: { gap: 7, borderRadius: 15, backgroundColor: colors.soft, padding: 10 },
  issueText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  issueMeta: { color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(51, 51, 51, 0.34)', padding: 22 },
  modalCard: { width: '100%', maxWidth: 360, borderRadius: 22, backgroundColor: colors.white, padding: 18, gap: 11 },
  modalIcon: { width: 48, height: 48, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  modalMessage: { color: colors.textMuted, fontSize: 13, lineHeight: 22, textAlign: 'center', fontWeight: '800' },
  reasonList: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  reasonChip: { minHeight: 34, borderRadius: 999, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', paddingHorizontal: 10 },
  reasonChipActive: { borderColor: colors.secondary, backgroundColor: colors.secondarySoft },
  reasonText: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  reasonTextActive: { color: colors.secondary },
  evidenceToggle: { minHeight: 42, borderRadius: 14, backgroundColor: colors.soft, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  evidenceText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  errorText: { color: colors.primary, fontSize: 13, fontWeight: '900', textAlign: 'center' },
});
