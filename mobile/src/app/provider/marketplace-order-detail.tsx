import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useLocalSearchParams,
  useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal,
  StyleSheet,
} from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HupiSuccessModal } from '@/components/HupiSuccessModal';
import { ProviderPageHeader } from '@/components/provider/ProviderPageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { formatMarketplaceCurrency } from '@/components/marketplace/ProductPriceBlock';
import { colors } from '@/constants/colors';
import { getMarketplaceIssueForOrder } from '@/constants/marketplaceIssuesState';
import { getSupportChatForTicket } from '@/constants/mockData';
import { getProviderInfoRequestForOrder, respondToProviderInfoRequest } from '@/constants/marketplaceStoreState';
import { Pressable, Text, TextInput } from '@/i18n/components';
import { formatDate } from '@/i18n/format';
import {
  addProviderOrderActivity,
  addProviderOrderEvidence,
  canProviderPrepareOrder,
  getNextProviderStatus,
  getProviderMarketplaceOrder,
  getProviderOrderActivity,
  getProviderOrderFinancialSummary,
  getProviderStatusDisplay,
  getProviderStatusFlow,
  saveProviderOrderGuide,
  updateProviderMarketplaceOrderStatus,
  type ProviderOrderAttachment,
  type ProviderOrderAttachmentFileType,
  type ProviderMarketplaceOrderStatus,
} from '@/constants/marketplaceProviderOrders';

type AttachmentSelectorTarget = 'guide' | 'evidence';

export default function ProviderMarketplaceOrderDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { providerOrderId } = useLocalSearchParams<{ providerOrderId?: string }>();
  const [order, setOrder] = useState(() => getProviderMarketplaceOrder(providerOrderId));
  const [carrier, setCarrier] = useState(order.shippingGuide?.carrierName ?? order.carrier ?? 'Hupi Express');
  const [guideNumber, setGuideNumber] = useState(order.shippingGuide?.trackingNumber ?? order.guideNumber ?? '');
  const [guideAttachment, setGuideAttachment] = useState<ProviderOrderAttachment | null>(order.shippingGuide ?? null);
  const [successModal, setSuccessModal] = useState<{ description: string; title: string } | null>(null);
  const [attachmentSelector, setAttachmentSelector] = useState<AttachmentSelectorTarget | null>(null);
  const [issueReply, setIssueReply] = useState('');
  const [providerInfoRequest, setProviderInfoRequest] = useState(() => getProviderInfoRequestForOrder(providerOrderId ?? order.providerOrderId));
  const [providerInfoReply, setProviderInfoReply] = useState(providerInfoRequest?.providerResponse ?? '');
  const [activity, setActivity] = useState(() => getProviderOrderActivity(order.providerOrderId));

  const financial = getProviderOrderFinancialSummary(order);
  const blockedByProof = !canProviderPrepareOrder(order);
  const nextStatus = getNextProviderStatus(order);
  const flow = getProviderStatusFlow(order.deliveryType);
  const statusDisplay = getProviderStatusDisplay(order.status, order.deliveryType);
  const issue = getMarketplaceIssueForOrder(order.id);
  const shippingRequiresGuide = order.deliveryType !== 'pickup';
  const evidenceRequired = order.deliveryType !== 'pickup';

  const sendProviderInfoReply = () => {
    if (!providerInfoReply.trim()) {
      setSuccessModal({
        title: 'Falta tu respuesta',
        description: 'Escribe la información solicitada para enviarla a Hupi.',
      });
      return;
    }

    if (providerInfoRequest) {
      const updatedRequest = respondToProviderInfoRequest(providerInfoRequest.id, providerInfoReply.trim());
      setProviderInfoRequest(updatedRequest);
      addProviderOrderActivity({
        orderId: order.id,
        providerOrderId: order.providerOrderId,
        providerId: providerInfoRequest.providerId,
        title: 'Respuesta enviada a Hupi',
        description: 'Enviaste la información solicitada por Hupi para continuar la revisión.',
        actor: 'Proveedor',
        type: 'provider_answered_hupi',
      });
      setActivity(getProviderOrderActivity(order.providerOrderId));
    }

    setSuccessModal({
      title: 'Respuesta enviada',
      description: 'Hupi recibió tu respuesta.',
    });
  };

  const updateStatus = (status: ProviderMarketplaceOrderStatus) => {
    if (status === 'En camino' && shippingRequiresGuide && !hasCompleteShippingGuide(carrier, guideNumber, guideAttachment)) {
      setSuccessModal({
        title: 'Faltan datos de envío',
        description: 'Agrega el transportista, número de guía y adjunta la guía para marcar el pedido como en camino.',
      });
      return;
    }

    if (status === 'En camino' && evidenceRequired && !order.deliveryEvidence) {
      setSuccessModal({
        title: t('providerOrders.missingEvidenceTitle'),
        description: t('providerOrders.missingEvidenceDescription'),
      });
      return;
    }

    let statusOrder = order;

    if (status === 'En camino' && shippingRequiresGuide && guideAttachment && !isShippingGuideSaved(order, carrier, guideNumber, guideAttachment)) {
      statusOrder = saveProviderOrderGuide(order.providerOrderId, carrier.trim(), guideNumber.trim(), guideAttachment);
    }

    const updatedOrder = updateProviderMarketplaceOrderStatus(statusOrder.providerOrderId, status);
    setOrder(updatedOrder);
    setActivity(getProviderOrderActivity(updatedOrder.providerOrderId));
    setSuccessModal({
      title: 'Estado actualizado',
      description: getStatusUpdateMessage(status),
    });
  };

  const saveGuide = () => {
    if (!hasCompleteShippingGuide(carrier, guideNumber, guideAttachment)) {
      setSuccessModal({
        title: 'Faltan datos de envío',
        description: 'Agrega el transportista, número de guía y adjunta la guía para marcar el pedido como en camino.',
      });
      return;
    }

    if (!guideAttachment) {
      return;
    }

    const updatedOrder = saveProviderOrderGuide(order.providerOrderId, carrier.trim(), guideNumber.trim(), guideAttachment);
    setOrder(updatedOrder);
    setActivity(getProviderOrderActivity(updatedOrder.providerOrderId));
    setSuccessModal({
      title: 'Guía guardada',
      description: 'La información de envío se guardó correctamente.',
    });
  };

  const selectMockAttachment = (target: AttachmentSelectorTarget, fileType: ProviderOrderAttachmentFileType) => {
    const uploadedAt = new Date().toISOString();
    const file: ProviderOrderAttachment = {
      fileName: target === 'guide'
        ? `guia-envio.${fileType === 'image' ? 'jpg' : 'pdf'}`
        : `evidencia-envio.${fileType === 'image' ? 'jpg' : 'pdf'}`,
      fileType,
      uploadedAt,
    };

    setAttachmentSelector(null);

    if (target === 'guide') {
      setGuideAttachment(file);
      return;
    }

    const updatedOrder = addProviderOrderEvidence(order.providerOrderId, file);
    setOrder(updatedOrder);
    setActivity(getProviderOrderActivity(updatedOrder.providerOrderId));
  };

  const sendIssueReply = () => {
    setIssueReply('');
    setSuccessModal({
      title: 'Comentario enviado',
      description: 'Hupi recibió tu respuesta sobre la incidencia.',
    });
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <ProviderPageHeader
        onBack={() => router.back()}
        subtitle={order.providerOrderId}
        title="__hupi_i18n:common.manageOrder"
      />

      <Card style={styles.statusCard} tone={blockedByProof ? 'soft' : 'coral'}>
        <View style={styles.statusIcon}>
          <Ionicons color={blockedByProof ? colors.secondary : colors.primary} name={blockedByProof ? 'document-attach-outline' : 'cube-outline'} size={23} />
        </View>
        <View style={styles.statusCopy}>
          <Text style={styles.statusLabel}>__hupi_i18n:marketplace.marketplace-order-detail.orderStatus</Text>
          <Text style={styles.statusTitle}>{blockedByProof ? 'Pago pendiente de validación' : statusDisplay}</Text>
          {blockedByProof ? (
            <Text style={styles.blockedText}>__hupi_i18n:marketplace.marketplace-order-detail.paymentPendingValidationByHupiYouWillBeAble</Text>
          ) : null}
        </View>
      </Card>

      {providerInfoRequest ? (
        <Card style={providerInfoRequest.status === 'Respondido' ? { ...styles.providerInfoCard, ...styles.providerInfoAnswered } : styles.providerInfoCard}>
          <SectionTitle icon="shield-checkmark-outline" title="__hupi_i18n:common.hupiNeedsInformation" />
          <Text style={styles.providerInfoMessage}>{providerInfoRequest.hupiMessage}</Text>
          <View style={styles.providerInfoGrid}>
            <InfoPill label="__hupi_i18n:common.case2" value={providerInfoRequest.caseNumber} />
            <InfoPill label="__hupi_i18n:common.order2" value={providerInfoRequest.orderNumber} />
            <InfoPill label="__hupi_i18n:common.priority" value={providerInfoRequest.priority} />
            <InfoPill label="__hupi_i18n:common.date" value={providerInfoRequest.requestedAt} />
          </View>
          {providerInfoRequest.status === 'Respondido' ? (
            <View style={styles.responseSentBox}>
              <Ionicons color={colors.success} name="checkmark-circle" size={18} />
              <Text style={styles.responseSentText}>__hupi_i18n:marketplace.marketplace-order-detail.responseSentToHupi</Text>
            </View>
          ) : (
            <>
              <Text style={styles.inputLabel}>__hupi_i18n:common.replyToHupi</Text>
              <TextInput
                multiline
                onChangeText={setProviderInfoReply}
                placeholder="__hupi_i18n:marketplace.marketplace-order-detail.writeHereTheInformationRequestedByHupi"
                placeholderTextColor={colors.textMuted}
                style={styles.issueInput}
                value={providerInfoReply}
              />
              <Button icon="send-outline" onPress={sendProviderInfoReply} title="__hupi_i18n:marketplace.marketplace-order-detail.sendResponseToHupi" />
            </>
          )}
          <Button
            icon="chatbubble-ellipses-outline"
            onPress={() => router.push('/chat?chatId=chat-support-provider-2050&viewer=provider' as Href)}
            title="__hupi_i18n:marketplace.marketplace-order-detail.chatWithHupiSupport"
            variant="secondary"
          />
        </Card>
      ) : null}

      <Card style={styles.section}>
        <SectionTitle icon="receipt-outline" title="__hupi_i18n:common.orderNumber" />
        <InfoRow label="__hupi_i18n:common.customerOrder" value={order.id} />
        <InfoRow label="__hupi_i18n:common.supplierOrder" value={order.providerOrderId} />
        <InfoRow label="__hupi_i18n:common.dateTime" value={order.placedAt} />
      </Card>

      <Card style={styles.section}>
        <SectionTitle icon="person-outline" title="__hupi_i18n:marketplace.marketplace-order-detail.customerData" />
        <InfoRow label="__hupi_i18n:common.client" value={order.customerName} />
        <InfoRow label="__hupi_i18n:common.contact" value={order.customerPhone} />
        <InfoRow label="__hupi_i18n:common.mail" value={order.customerEmail} />
        <Text style={styles.chatUnavailable}>__hupi_i18n:marketplace.marketplace-order-detail.hupiWillManageCommunicationWithTheClientFromSupport</Text>
      </Card>

      <Card style={styles.section}>
        <SectionTitle icon="bag-handle-outline" title="__hupi_i18n:marketplace.marketplace-order-detail.supplierProducts" />
        <View style={styles.products}>
          {order.items.map((item) => (
            <View key={item.id} style={styles.productRow}>
              <View style={[styles.productThumb, { backgroundColor: item.color }]}>
                <Text style={styles.productEmoji}>{item.emoji}</Text>
              </View>
              <View style={styles.productCopy}>
                <Text numberOfLines={2} style={styles.productName}>{item.name}</Text>
                <Text numberOfLines={1} style={styles.productMeta}>{item.brand} · {item.variation}</Text>
                <Text style={styles.productMeta}>{t('providerOrders.skuValue', { value: item.sku })}</Text>
                <Text style={styles.productMeta}>{t('providerOrders.quantityAndPrice', { count: item.quantity, price: formatMarketplaceCurrency(item.unitPrice) })}</Text>
                <Text style={styles.productMeta}>{t('providerOrders.totalValue', { value: formatMarketplaceCurrency(item.unitPrice * item.quantity) })}</Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.section}>
        <SectionTitle icon="car-outline" title="__hupi_i18n:common.delivery" />
        <InfoRow label="__hupi_i18n:common.method" value={order.deliveryMethod} />
        <InfoRow label={order.deliveryType === 'pickup' ? 'Punto de recogida' : 'Dirección'} value={order.deliveryType === 'pickup' ? order.pickupPoint ?? order.address : order.address} />
        <InfoRow label="__hupi_i18n:common.notes" value={order.notes ?? 'Sin notas adicionales'} />
      </Card>

      <Card style={styles.section}>
        <SectionTitle icon="barcode-outline" title="__hupi_i18n:common.shippingGuide" />
        {shippingRequiresGuide ? (
          <>
            <View style={styles.formGrid}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>__hupi_i18n:marketplace.marketplace-order-detail.carrierName</Text>
                <TextInput onChangeText={setCarrier} placeholder="__hupi_i18n:common.exServientrega" placeholderTextColor={colors.textMuted} style={styles.input} value={carrier} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>__hupi_i18n:common.guideNumber</Text>
                <TextInput onChangeText={setGuideNumber} placeholder="__hupi_i18n:common.guide2049Ec" placeholderTextColor={colors.textMuted} style={styles.input} value={guideNumber} />
              </View>
            </View>
            {guideAttachment ? (
              <AttachmentCard
                file={guideAttachment}
                onChange={() => setAttachmentSelector('guide')}
                onDelete={() => setGuideAttachment(null)}
              />
            ) : (
              <Button disabled={blockedByProof} icon="document-attach-outline" onPress={() => setAttachmentSelector('guide')} title="__hupi_i18n:common.attachGuide" variant="outline" />
            )}
            <Button disabled={blockedByProof} icon="save-outline" onPress={saveGuide} title="__hupi_i18n:common.saveGuide" variant="secondary" />
          </>
        ) : (
          <View style={styles.optionalBox}>
            <Ionicons color={colors.secondary} name="storefront-outline" size={17} />
            <Text style={styles.optionalText}>__hupi_i18n:marketplace.marketplace-order-detail.thisOrderIsPickUpInStoreTheShipping</Text>
          </View>
        )}
      </Card>

      <Card style={styles.section}>
        <SectionTitle icon="card-outline" title="__hupi_i18n:common.payment" />
        <InfoRow label="__hupi_i18n:common.paymentStatus" value={order.paymentStatus} />
        <InfoRow label="__hupi_i18n:marketplace.marketplace-order-detail.currentOrderStatus" value={statusDisplay} />
      </Card>

      {issue ? (
        <Card style={styles.issueCard}>
          <SectionTitle icon="alert-circle-outline" title="__hupi_i18n:marketplace.marketplace-order-detail.orderIncident" />
          <InfoRow label="__hupi_i18n:common.case2" value={issue.caseNumber} />
          <InfoRow label="__hupi_i18n:common.status" value={issue.status} />
          <InfoRow label="__hupi_i18n:common.reason" value={issue.reason} />
          <Text style={styles.issueText}>__hupi_i18n:marketplace.marketplace-order-detail.hupiIsReviewingARequestRelatedToThisOrder</Text>
          <TextInput
            multiline
            onChangeText={setIssueReply}
            placeholder="__hupi_i18n:common.replyToHupi"
            placeholderTextColor={colors.textMuted}
            style={styles.issueInput}
            value={issueReply}
          />
          <Button disabled={!issueReply.trim()} icon="send-outline" onPress={sendIssueReply} title="__hupi_i18n:common.replyToHupi" variant="outline" />
          <Button
            icon="chatbubble-ellipses-outline"
            onPress={() => {
              const supportChat = getSupportChatForTicket(issue.caseNumber, 'provider');
              router.push(`/chat?chatId=${supportChat?.id ?? 'chat-support-provider-2050'}&viewer=provider` as Href);
            }}
            title="__hupi_i18n:marketplace.marketplace-order-detail.chatWithHupiSupport"
            variant="secondary"
          />
        </Card>
      ) : null}

      <Card style={styles.section}>
        <SectionTitle icon="trending-up-outline" title="__hupi_i18n:marketplace.marketplace-order-detail.supplierInternalSummary" />
        <InfoRow label="__hupi_i18n:common.productValue" value={formatMarketplaceCurrency(financial.productsValue)} />
        <InfoRow label="__hupi_i18n:marketplace.marketplace-order-detail.hupiMarketplaceCommission30" value={`-${formatMarketplaceCurrency(financial.hupiCommission)}`} />
        <InfoRow label="__hupi_i18n:marketplace.marketplace-order-detail.valueToReceiveSupplier70" value={formatMarketplaceCurrency(financial.providerReceives)} strong />
      </Card>

      <Card style={styles.section}>
        <SectionTitle icon="git-branch-outline" title="__hupi_i18n:marketplace.marketplace-order-detail.updateStatus" />
        <View style={styles.flow}>
          {flow.map((status, index) => {
            const active = order.status === status;
            const done = flow.indexOf(order.status) > index;
            const display = getProviderStatusDisplay(status, order.deliveryType);

            return (
              <View key={status} style={styles.flowItem}>
                <View style={[styles.flowDot, (active || done) && styles.flowDotActive]}>
                  <Ionicons color={active || done ? colors.white : colors.textMuted} name="checkmark" size={12} />
                </View>
                <Text style={[styles.flowText, active && styles.flowTextActive]}>{display}</Text>
              </View>
            );
          })}
        </View>
        {blockedByProof ? (
          <View style={styles.blockedBox}>
            <Ionicons color={colors.secondary} name="lock-closed-outline" size={17} />
            <Text style={styles.blockedBoxText}>__hupi_i18n:marketplace.marketplace-order-detail.paymentPendingValidationByHupiYouWillBeAble</Text>
          </View>
        ) : (
          <View style={styles.actions}>
            {order.status === 'Entregado' ? (
              <View style={styles.deliveredBox}>
                <Ionicons color={colors.success} name="checkmark-circle" size={18} />
                <Text style={styles.deliveredText}>__hupi_i18n:common.orderDelivered</Text>
              </View>
            ) : null}
            {nextStatus === 'En camino' ? (
              <View style={styles.evidencePrompt}>
                <SectionTitle icon="camera-outline" title={t('providerOrders.attachEvidence')} />
                <Text style={styles.sectionCopy}>{t('providerOrders.evidenceHint')}</Text>
                {order.deliveryEvidence ? (
                  <AttachmentCard
                    file={order.deliveryEvidence}
                    onChange={() => setAttachmentSelector('evidence')}
                    onDelete={() => setOrder({ ...order, deliveryEvidence: undefined, evidenceAdded: false })}
                  />
                ) : (
                  <Button icon="document-attach-outline" onPress={() => setAttachmentSelector('evidence')} title={t('providerOrders.attachEvidence')} variant="outline" />
                )}
                {!evidenceRequired ? <Text style={styles.optionalHint}>{t('providerOrders.pickupEvidenceOptional')}</Text> : null}
              </View>
            ) : null}
            {nextStatus ? (
              <Button
                icon={nextStatus === 'Entregado' ? 'checkmark-circle-outline' : 'arrow-forward-circle-outline'}
                onPress={() => updateStatus(nextStatus)}
                title={getActionLabel(nextStatus)}
              />
            ) : null}
          </View>
        )}
      </Card>

      <Card style={styles.section}>
        <SectionTitle icon="time-outline" title="__hupi_i18n:marketplace.marketplace-order-detail.orderHistory" />
        <View style={styles.activityList}>
          {activity.map((event) => (
            <View key={event.id} style={styles.activityItem}>
              <View style={styles.activityDot}>
                <Ionicons color={colors.white} name={getActivityIcon(event.actor)} size={13} />
              </View>
              <View style={styles.activityCopy}>
                <View style={styles.activityMetaRow}>
                  <Text style={styles.activityDate}>{formatActivityDate(event.createdAt)}</Text>
                  <Text style={styles.activityActor}>{event.actor}</Text>
                </View>
                <Text style={styles.activityTitle}>{event.title}</Text>
                <Text style={styles.activityDescription}>{event.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <AttachmentSelectorModal
        onCancel={() => setAttachmentSelector(null)}
        onSelect={(fileType) => {
          if (attachmentSelector) {
            selectMockAttachment(attachmentSelector, fileType);
          }
        }}
        title={attachmentSelector === 'guide' ? t('providerOrders.attachGuide') : t('providerOrders.attachEvidence')}
        visible={Boolean(attachmentSelector)}
      />
      <HupiSuccessModal
        description={successModal?.description ?? ''}
        onClose={() => setSuccessModal(null)}
        title={successModal?.title ?? ''}
        visible={Boolean(successModal)}
      />
    </ScreenContainer>
  );
}

function SectionTitle({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Ionicons color={colors.primary} name={icon} size={18} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoRow({ label, strong = false, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, strong && styles.strongValue]}>{value}</Text>
    </View>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoPill}>
      <Text style={styles.infoPillLabel}>{label}</Text>
      <Text style={styles.infoPillValue}>{value}</Text>
    </View>
  );
}

function AttachmentCard({
  file,
  onChange,
  onDelete,
}: {
  file: ProviderOrderAttachment;
  onChange: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.attachmentCard}>
      <View style={styles.attachmentIcon}>
        <Ionicons color={colors.secondary} name={file.fileType === 'image' ? 'image-outline' : 'document-text-outline'} size={18} />
      </View>
      <View style={styles.attachmentCopy}>
        <Text style={styles.attachmentName}>{file.fileName}</Text>
        <Text style={styles.attachmentMeta}>{t('providerOrders.fileType', { value: getFileTypeLabel(file.fileType) })}</Text>
        <Text style={styles.attachmentMeta}>{t('providerOrders.uploadedAt', { value: formatActivityDate(file.uploadedAt) })}</Text>
      </View>
      <View style={styles.attachmentActions}>
        <Pressable accessibilityRole="button" onPress={onChange} style={styles.attachmentActionButton}>
          <Text style={styles.attachmentActionText}>__hupi_i18n:common.change</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onDelete} style={[styles.attachmentActionButton, styles.attachmentDeleteButton]}>
          <Text style={[styles.attachmentActionText, styles.attachmentDeleteText]}>__hupi_i18n:common.delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AttachmentSelectorModal({
  onCancel,
  onSelect,
  title,
  visible,
}: {
  onCancel: () => void;
  onSelect: (fileType: ProviderOrderAttachmentFileType) => void;
  title: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.selectorOverlay}>
        <View style={styles.selectorCard}>
          <Text style={styles.selectorTitle}>{title}</Text>
          <Pressable accessibilityRole="button" onPress={() => onSelect('image')} style={styles.selectorOption}>
            <Ionicons color={colors.primary} name="image-outline" size={19} />
            <Text style={styles.selectorOptionText}>__hupi_i18n:common.uploadImage</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => onSelect('pdf')} style={styles.selectorOption}>
            <Ionicons color={colors.secondary} name="document-text-outline" size={19} />
            <Text style={styles.selectorOptionText}>__hupi_i18n:common.uploadPdf</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onCancel} style={styles.selectorCancel}>
            <Text style={styles.selectorCancelText}>__hupi_i18n:common.cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function getActionLabel(status: ProviderMarketplaceOrderStatus) {
  if (status === 'En preparación') {
    return 'Marcar en preparación';
  }

  if (status === 'Listo para envío') {
    return 'Marcar listo para envío';
  }

  if (status === 'En camino') {
    return 'Marcar en camino';
  }

  return 'Marcar entregado';
}

function getStatusUpdateMessage(status: ProviderMarketplaceOrderStatus) {
  if (status === 'En preparación') {
    return 'El pedido ahora está en preparación.';
  }

  if (status === 'Listo para envío') {
    return 'El pedido está listo para envío.';
  }

  if (status === 'En camino') {
    return 'El pedido está en camino.';
  }

  if (status === 'Entregado') {
    return 'El pedido fue marcado como entregado.';
  }

  return 'El estado del pedido fue actualizado.';
}

function hasCompleteShippingGuide(carrier: string, guideNumber: string, file: ProviderOrderAttachment | null) {
  return Boolean(carrier.trim() && guideNumber.trim() && file);
}

function isShippingGuideSaved(
  order: { shippingGuide?: { carrierName: string; fileName: string; fileType: ProviderOrderAttachmentFileType; trackingNumber: string } },
  carrier: string,
  guideNumber: string,
  file: ProviderOrderAttachment,
) {
  return (
    order.shippingGuide?.carrierName === carrier.trim()
    && order.shippingGuide.trackingNumber === guideNumber.trim()
    && order.shippingGuide.fileName === file.fileName
    && order.shippingGuide.fileType === file.fileType
  );
}

function getFileTypeLabel(fileType: ProviderOrderAttachmentFileType) {
  return fileType === 'image' ? 'Imagen' : 'PDF';
}

function formatActivityDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatDate(date, {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getActivityIcon(actor: string): keyof typeof Ionicons.glyphMap {
  if (actor === 'Proveedor') {
    return 'storefront-outline';
  }

  if (actor === 'Hupi') {
    return 'shield-checkmark-outline';
  }

  return 'sparkles-outline';
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 42 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  statusCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 22, shadowOpacity: 0 },
  statusIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  statusCopy: { flex: 1 },
  statusLabel: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  statusTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 4 },
  blockedText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 6, fontWeight: '800' },
  providerInfoCard: { gap: 11, marginTop: 14, backgroundColor: colors.primarySoft, borderColor: '#f5d3ca', shadowOpacity: 0 },
  providerInfoAnswered: { backgroundColor: '#eef9f3', borderColor: '#d5efe2' },
  providerInfoMessage: { color: colors.text, fontSize: 13, lineHeight: 22, fontWeight: '900' },
  providerInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoPill: { minWidth: '47%', flex: 1, borderRadius: 14, backgroundColor: colors.white, padding: 10 },
  infoPillLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  infoPillValue: { color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '900', marginTop: 2 },
  responseSentBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, backgroundColor: colors.white, padding: 10 },
  responseSentText: { color: colors.success, fontSize: 13, fontWeight: '900' },
  section: { gap: 10, marginTop: 14, shadowOpacity: 0.04 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  sectionCopy: { color: colors.textMuted, fontSize: 13, lineHeight: 22, fontWeight: '800' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 9 },
  infoLabel: { flex: 1, color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  infoValue: { flex: 1.35, color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '800', textAlign: 'right' },
  strongValue: { color: colors.secondary, fontSize: 15, fontWeight: '900' },
  products: { gap: 10 },
  productRow: { flexDirection: 'row', gap: 10, borderRadius: 15, backgroundColor: colors.soft, padding: 10 },
  productThumb: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  productEmoji: { fontSize: 25 },
  productCopy: { flex: 1 },
  productName: { color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: '900' },
  productMeta: { color: colors.textMuted, fontSize: 12, marginTop: 3, fontWeight: '700' },
  flow: { gap: 8 },
  flowItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flowDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.soft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  flowDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  flowText: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  flowTextActive: { color: colors.text, fontWeight: '900' },
  blockedBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 15, backgroundColor: colors.secondarySoft, padding: 11 },
  blockedBoxText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  actions: { gap: 9 },
  evidencePrompt: { backgroundColor: colors.primarySoft, borderColor: colors.primary, borderRadius: 16, borderWidth: 1, gap: 10, padding: 12 },
  deliveredBox: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 14, backgroundColor: '#eef9f3', padding: 10 },
  deliveredText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  activityList: { gap: 12 },
  activityItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  activityDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  activityCopy: { flex: 1, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 },
  activityMetaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 },
  activityDate: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  activityActor: { overflow: 'hidden', borderRadius: 999, backgroundColor: colors.soft, color: colors.secondary, fontSize: 12, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 4 },
  activityTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 5 },
  activityDescription: { color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '800', marginTop: 2 },
  formGrid: { gap: 9 },
  inputGroup: { gap: 5 },
  inputLabel: { color: colors.text, fontSize: 12, fontWeight: '900' },
  input: { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.text, paddingHorizontal: 12, fontSize: 13 },
  attachmentCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, backgroundColor: colors.soft, padding: 10 },
  attachmentIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  attachmentCopy: { flex: 1 },
  attachmentName: { color: colors.text, fontSize: 13, fontWeight: '900' },
  attachmentMeta: { color: colors.textMuted, fontSize: 12, lineHeight: 19, fontWeight: '800', marginTop: 2 },
  attachmentActions: { gap: 6, alignItems: 'flex-end' },
  attachmentActionButton: { minHeight: 30, minWidth: 72, borderRadius: 11, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  attachmentActionText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  attachmentDeleteButton: { borderColor: colors.border, backgroundColor: colors.white },
  attachmentDeleteText: { color: colors.textMuted },
  optionalBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, backgroundColor: colors.secondarySoft, padding: 10 },
  optionalText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  optionalHint: { color: colors.textMuted, fontSize: 12, lineHeight: 19, fontWeight: '800', textAlign: 'center' },
  issueCard: { gap: 10, marginTop: 14, backgroundColor: colors.primarySoft, shadowOpacity: 0 },
  issueText: { color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  issueInput: { minHeight: 78, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.text, padding: 12, textAlignVertical: 'top', fontWeight: '800' },
  chatUnavailable: { color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '900', textAlign: 'center' },
  selectorOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(51, 51, 51, 0.36)', padding: 22 },
  selectorCard: { width: '100%', maxWidth: 360, borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: 18, gap: 10 },
  selectorTitle: { color: colors.text, fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  selectorOption: { minHeight: 50, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.soft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  selectorOptionText: { color: colors.text, fontSize: 15, fontWeight: '900' },
  selectorCancel: { minHeight: 48, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  selectorCancelText: { color: colors.white, fontSize: 15, fontWeight: '900' },
});
