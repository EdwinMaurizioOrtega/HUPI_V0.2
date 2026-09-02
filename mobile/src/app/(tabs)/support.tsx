import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useFocusEffect,
  useLocalSearchParams,
  useRouter } from 'expo-router';
import { useCallback,
  useMemo,
  useState } from 'react';
import { Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChatCard } from '@/components/chat/ChatCard';
import { FaqItem } from '@/components/chat/FaqItem';
import { SocialLinkCard } from '@/components/chat/SocialLinkCard';
import { SupportReasonPicker } from '@/components/support/SupportReasonPicker';
import { HupiSuccessModal } from '@/components/HupiSuccessModal';
import { PageHeader } from '@/components/PageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import {
  FLOATING_TAB_BAR_CONTENT_CLEARANCE,
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_MIN_BOTTOM_INSET,
  FLOATING_TAB_BAR_TOP_GAP,
} from '@/constants/navigationLayout';
import { fonts } from '@/constants/typography';
import { addMarketplaceClientNotification, getMarketplaceOrders } from '@/constants/marketplaceOrdersState';
import { getMockProviderPhotoUri, mockProviders } from '@/constants/mockProviders';
import { Pressable, Text, TextInput } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';
import { getSupportCaseStatusPresentation } from '@/domain/statusPresentation';
import {
  addMockSupportTicketMessage,
  closeMockSupportTicket,
  createMockSupportTicket,
  getVisibleMockConversations,
  getMockSupportTickets,
  mockFaqs,
  mockSocialLinks,
  type MockConversationType,
  type MockSupportTicket,
} from '@/constants/mockData';

type MessageFilter = 'Todos' | 'Marketplace' | 'Servicios' | 'Soporte' | 'No leídos';
type SupportCategory =
  | 'booking_issue'
  | 'payment_issue'
  | 'provider_issue'
  | 'client_issue'
  | 'marketplace_issue'
  | 'delivery_issue'
  | 'security'
  | 'account_profile'
  | 'suggestion'
  | 'order_not_received'
  | 'wrong_product'
  | 'damaged_product'
  | 'incomplete_order'
  | 'payment_proof'
  | 'refund_or_balance'
  | 'order_cancellation'
  | 'other';
type SupportView = 'tickets' | 'create' | 'detail';

const DARK_SUPPORT_BANNER_SURFACE = '#5b2a22';
const DARK_SUPPORT_PRIMARY_TEXT = '#fff8f5';
const DARK_SUPPORT_SECONDARY_TEXT = '#f0cbc1';

const messageFilters: MessageFilter[] = ['Todos', 'Marketplace', 'Servicios', 'Soporte', 'No leídos'];
const generalSupportCategories: SupportCategory[] = [
  'booking_issue',
  'payment_issue',
  'provider_issue',
  'client_issue',
  'marketplace_issue',
  'delivery_issue',
  'security',
  'account_profile',
  'suggestion',
  'other',
];
const orderSupportReasons: SupportCategory[] = [
  'order_not_received',
  'wrong_product',
  'damaged_product',
  'incomplete_order',
  'payment_proof',
  'refund_or_balance',
  'order_cancellation',
  'delivery_issue',
  'other',
];

export default function SupportScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useTheme();
  const darkMode = resolvedTheme === 'dark';
  const floatingTabBottom = Math.max(
    insets.bottom,
    FLOATING_TAB_BAR_MIN_BOTTOM_INSET,
  );
  const floatingTabTopEdge = FLOATING_TAB_BAR_HEIGHT
    + FLOATING_TAB_BAR_TOP_GAP
    + floatingTabBottom;
  const {
    bookingId,
    context,
    mode,
    orderNumber,
  } = useLocalSearchParams<{
    bookingId?: string;
    context?: string;
    mode?: string;
    orderNumber?: string;
  }>();
  const fromBookingDetail = Boolean(bookingId);
  const fromOrderDetail = Boolean(orderNumber) && !fromBookingDetail;
  const bookingCode = bookingId?.toUpperCase();
  const [supportMode, setSupportMode] = useState(() => mode === 'support' || Boolean(orderNumber) || Boolean(bookingId));
  const [supportView, setSupportView] = useState<SupportView>(() => fromBookingDetail ? 'create' : 'tickets');
  const [tickets, setTickets] = useState<MockSupportTicket[]>(() => getMockSupportTickets());
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(mockFaqs[0]?.id ?? null);
  const [activeFilter, setActiveFilter] = useState<MessageFilter>('Todos');
  const [category, setCategory] = useState<SupportCategory | null>(() => (
    fromBookingDetail ? 'booking_issue' : null
  ));
  const [otherReason, setOtherReason] = useState('');
  const [reasonPickerError, setReasonPickerError] = useState(false);
  const [relatedOrder, setRelatedOrder] = useState(orderNumber ?? 'Sin pedido relacionado');
  const [description, setDescription] = useState(context ?? '');
  const [evidenceAdded, setEvidenceAdded] = useState(false);
  const [ticketReply, setTicketReply] = useState('');
  const [missingDataVisible, setMissingDataVisible] = useState(false);
  const [createdCase, setCreatedCase] = useState<{ caseNumber: string; ticketId: string } | null>(null);
  const marketplaceOrders = getMarketplaceOrders();
  const reasonOptions = (fromOrderDetail ? orderSupportReasons : generalSupportCategories).map((id) => ({
    id,
    label: t(`supportReasonPicker.options.${id}`),
  }));
  const filteredConversations = useMemo(() => (
    getVisibleMockConversations().filter((conversation) => (
      (conversation.type !== 'marketplace' || conversation.role === 'Soporte Hupi')
      && matchesMessageFilter(conversation.type, conversation.unreadCount, activeFilter)
    ))
  ), [activeFilter]);
  const unreadCount = getVisibleMockConversations().reduce((total, conversation) => total + conversation.unreadCount, 0);
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId);
  const openConversation = (chatId: string) => {
    router.push(`/chat?chatId=${chatId}&viewer=client` as Href);
  };

  useFocusEffect(
    useCallback(() => {
      if (!bookingId) {
        return;
      }

      setSupportMode(true);
      setSupportView('create');
      setCategory('booking_issue');
      setRelatedOrder(orderNumber ?? 'Sin pedido relacionado');
      setDescription(
        context
        ?? `Necesito ayuda con la reserva ${bookingId.toUpperCase()}.`,
      );
    }, [bookingId, context, orderNumber]),
  );

  const sendSupportCase = () => {
    const trimmedDescription = description.trim();
    const trimmedOtherReason = otherReason.trim();
    const invalidReason = !category || (category === 'other' && trimmedOtherReason.length < 5);
    const invalidDescription = trimmedDescription.length < 10;

    setReasonPickerError(invalidReason);
    if (invalidReason || invalidDescription) {
      setMissingDataVisible(true);
      return;
    }

    const orderValue = relatedOrder === 'Sin pedido relacionado' ? '' : relatedOrder;
    const ticket = createMockSupportTicket({
      description: trimmedDescription,
      reason: category === 'other' ? trimmedOtherReason : t(`supportReasonPicker.options.${category}`),
      relatedBookingId: bookingId,
      relatedOrderNumber: orderValue || undefined,
    });
    addMarketplaceClientNotification({
      title: 'Caso enviado a Soporte Hupi',
      message: `Recibimos tu solicitud${bookingCode ? ` de la reserva ${bookingCode}` : ''}${orderValue ? ` y el pedido ${orderValue}` : ''}. Te responderemos en máximo 24 horas.`,
      type: 'support_case_sent',
      category: 'Soporte',
      actionTarget: `/support?mode=support`,
    });
    setTickets(getMockSupportTickets());
    setSelectedTicketId(ticket.id);
    setSupportView('detail');
    setDescription('');
    setOtherReason('');
    setCategory(null);
    setReasonPickerError(false);
    setEvidenceAdded(false);
    setCreatedCase({ caseNumber: ticket.caseNumber, ticketId: ticket.id });
  };

  const openTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setSupportView('detail');
  };

  const addTicketMessage = () => {
    const trimmed = ticketReply.trim();

    if (!selectedTicket || !trimmed) {
      return;
    }

    addMockSupportTicketMessage(selectedTicket.id, trimmed);
    setTickets(getMockSupportTickets());
    setTicketReply('');
  };

  const closeTicket = () => {
    if (!selectedTicket) {
      return;
    }

    closeMockSupportTicket(selectedTicket.id);
    setTickets(getMockSupportTickets());
  };

  const openSocialLink = async (item: (typeof mockSocialLinks)[number]) => {
    try {
      const supported = await Linking.canOpenURL(item.url);
      if (!supported) throw new Error('Unsupported external URL');
      await Linking.openURL(item.url);
    } catch {
      Alert.alert(t('socialLinks.errorTitle'), t('socialLinks.errorMessage'));
    }
  };

  if (!supportMode) {
    return (
      <ScreenContainer contentContainerStyle={styles.chatShell} scroll={false}>
        <ScrollView
          contentContainerStyle={[
            styles.chatContent,
            {
              paddingBottom: FLOATING_TAB_BAR_CONTENT_CLEARANCE
                + floatingTabBottom
                + 82,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <PageHeader
            eyebrow="__hupi_i18n:common.messages2"
            subtitle="__hupi_i18n:support.support.yourRideConversationsReservationsAndSupportInOnePlace"
            title="__hupi_i18n:common.chat"
            trailing={<View style={styles.headerIcon}>
              <Ionicons color={colors.white} name="chatbubbles" size={25} />
            </View>}
          />

          <SectionTitle title="__hupi_i18n:common.conversations" />
          {filteredConversations.length > 0 ? (
            <>
              <View style={styles.messageSummary}>
                <Text style={styles.messageSummaryText}>{unreadCount}  __hupi_i18n:support.support.unreadMessages</Text>
              </View>
              <View style={styles.filters}>
                {messageFilters.map((filter) => {
                  const active = activeFilter === filter;

                  return (
                    <Pressable key={filter} onPress={() => setActiveFilter(filter)} style={[styles.filterChip, active && styles.activeFilterChip]}>
                      <Text style={[styles.filterText, active && styles.activeFilterText]}>{filter}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.stack}>
                {filteredConversations.map((chat) => (
                  <ChatCard
                    accentColor={chat.accentColor}
                    key={chat.id}
                    lastMessage={chat.lastMessage}
                    onPress={() => openConversation(chat.id)}
                    relation={`${getConversationTypeLabel(chat.type)} · ${chat.subtitle}`}
                    title={chat.title}
                    status={chat.status}
                    time={chat.updatedAt}
                    unread={chat.unreadCount}
                    uri={
                      chat.type === 'services'
                        ? getMockProviderPhotoUri(mockProviders.find((provider) => provider.name === chat.title)?.id ?? '')
                        : undefined
                    }
                  />
                ))}
              </View>
            </>
          ) : (
            <Card style={styles.emptyChatCard} tone="soft">
              <Ionicons color={colors.primary} name="chatbubble-ellipses-outline" size={28} />
              <Text style={styles.emptyChatTitle}>__hupi_i18n:support.support.youStillDonTHaveConversations</Text>
              <Text style={styles.emptyChatText}>__hupi_i18n:support.support.whenYouArrangeAServiceOrContactSupportThey</Text>
            </Card>
          )}
        </ScrollView>

        <Pressable
          onPress={() => setSupportMode(true)}
          style={({ pressed }) => [
            styles.floatingSupportBanner,
            darkMode && {
              backgroundColor: DARK_SUPPORT_BANNER_SURFACE,
              borderColor: 'rgba(255, 187, 168, 0.34)',
              shadowColor: '#000000',
            },
            { bottom: floatingTabTopEdge + 10 },
            pressed && styles.floatingSupportBannerPressed,
          ]}
        >
          <View
            style={[
              styles.floatingSupportIcon,
              darkMode && { backgroundColor: 'rgba(255, 255, 255, 0.12)' },
            ]}
          >
            <Ionicons color={colors.primary} name="shield-checkmark-outline" size={20} />
          </View>
          <View style={styles.floatingSupportCopy}>
            <Text
              style={[
                styles.floatingSupportTitle,
                darkMode && { color: DARK_SUPPORT_PRIMARY_TEXT },
              ]}
            >
              __hupi_i18n:support.support.doYouNeedHelp
            </Text>
            <Text
              style={[
                styles.floatingSupportText,
                darkMode && { color: DARK_SUPPORT_SECONDARY_TEXT },
              ]}
            >
              __hupi_i18n:support.support.hupiSupportIsHereToHelpYou
            </Text>
          </View>
          <View style={styles.floatingSupportCta}>
            <Text style={styles.floatingSupportCtaText}>__hupi_i18n:common.support</Text>
          </View>
        </Pressable>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer avoidFloatingTabBar contentContainerStyle={styles.content}>
      <PageHeader
        backAccessibilityLabel="__hupi_i18n:common.returnToChat"
        eyebrow="__hupi_i18n:common.alwaysNear"
        onBack={fromBookingDetail || fromOrderDetail ? () => router.back() : () => setSupportMode(false)}
        subtitle="__hupi_i18n:support.support.hupiCentralizesComplaintsIncidentsAndMarketplaceHelp"
        title="__hupi_i18n:common.hupiSupport"
        trailing={<View style={styles.headerIcon}>
          <Ionicons color={colors.white} name="chatbubbles" size={25} />
        </View>}
      />

      <Card style={styles.supportActionsCard} tone="soft">
        <View style={styles.supportActionCopy}>
          <Text style={styles.supportActionTitle}>__hupi_i18n:support.support.supportManagement</Text>
          <Text style={styles.supportActionText}>__hupi_i18n:support.support.createCasesReviewTicketsAndFollowUpWithoutMixing</Text>
        </View>
        <View style={styles.supportActionButtons}>
          <Button icon="add-circle-outline" onPress={() => setSupportView('create')} style={styles.supportActionButton} title="__hupi_i18n:common.createCase" />
          <Button icon="ticket-outline" onPress={() => setSupportView('tickets')} style={styles.supportActionButton} title="__hupi_i18n:common.myTickets" variant="outline" />
        </View>
      </Card>

      {supportView === 'create' ? (
        <>
          <SectionTitle title={fromBookingDetail ? 'Soporte para tu reserva' : fromOrderDetail ? 'Soporte para tu pedido' : 'Crear caso'} />
          <Card style={styles.supportForm}>
            {fromBookingDetail ? (
              <>
                <Text style={styles.formIntro}>{t('support.bookingContextHint')}</Text>
                <View style={styles.traceabilityStack}>
                  <View style={styles.relatedOrderBox}>
                    <Ionicons color={colors.primary} name="walk-outline" size={17} />
                    <View style={styles.relatedOrderCopy}>
                      <Text style={styles.relatedOrderLabel}>{t('support.relatedBooking')}</Text>
                      <Text style={styles.relatedOrderText}>{bookingCode}</Text>
                    </View>
                  </View>
                  {orderNumber ? (
                    <View style={styles.relatedOrderBox}>
                      <Ionicons color={colors.secondary} name="receipt-outline" size={17} />
                      <View style={styles.relatedOrderCopy}>
                        <Text style={styles.relatedOrderLabel}>Pedido relacionado</Text>
                        <Text style={styles.relatedOrderText}>{orderNumber}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </>
            ) : null}

            {fromOrderDetail ? (
              <>
                <Text style={styles.formIntro}>__hupi_i18n:support.support.pleaseSelectTheReasonSoWeCanHelpYou</Text>
                <View style={styles.relatedOrderBox}>
                  <Ionicons color={colors.primary} name="receipt-outline" size={17} />
                  <View style={styles.relatedOrderCopy}>
                    <Text style={styles.relatedOrderLabel}>__hupi_i18n:common.relatedOrder</Text>
                    <Text style={styles.relatedOrderText}>{orderNumber}</Text>
                  </View>
                </View>
              </>
            ) : null}

            <Text style={styles.formLabel}>{t('supportReasonPicker.fieldLabel')}</Text>
            <SupportReasonPicker
              error={reasonPickerError}
              onChange={(value) => {
                const nextCategory = value as SupportCategory;
                setCategory(nextCategory);
                setReasonPickerError(false);
                if (nextCategory !== 'other') setOtherReason('');
              }}
              options={reasonOptions}
              value={category}
            />
            {reasonPickerError ? <Text style={styles.fieldError}>{t('supportReasonPicker.reasonRequired')}</Text> : null}

            {category === 'other' ? (
              <View style={styles.otherReasonBlock}>
                <Text style={styles.formLabel}>{t('supportReasonPicker.specifyOther')}</Text>
                <TextInput
                  maxLength={120}
                  onChangeText={setOtherReason}
                  placeholder={t('supportReasonPicker.otherPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.otherReasonInput, reasonPickerError && styles.inputError]}
                  value={otherReason}
                />
                <Text style={styles.counter}>{otherReason.length}/120</Text>
              </View>
            ) : null}

            {!fromOrderDetail && !fromBookingDetail ? (
              <>
                <Text style={styles.formLabel}>__hupi_i18n:support.support.reservationOrRelatedOrder</Text>
                <View style={styles.chipGrid}>
                  <Pressable onPress={() => setRelatedOrder('Sin pedido relacionado')} style={[styles.orderChip, relatedOrder === 'Sin pedido relacionado' && styles.orderChipActive]}>
                    <Text style={[styles.orderChipText, relatedOrder === 'Sin pedido relacionado' && styles.orderChipTextActive]}>__hupi_i18n:support.support.noRelatedOrder</Text>
                  </Pressable>
                  {marketplaceOrders.slice(0, 5).map((order) => {
                    const active = relatedOrder === order.orderNumber;

                    return (
                      <Pressable key={order.id} onPress={() => setRelatedOrder(order.orderNumber)} style={[styles.orderChip, active && styles.orderChipActive]}>
                        <Text style={[styles.orderChipText, active && styles.orderChipTextActive]}>{order.orderNumber}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            <Text style={styles.formLabel}>__hupi_i18n:common.description</Text>
            <TextInput
              multiline
              onChangeText={setDescription}
              placeholder="__hupi_i18n:support.support.tellUsTheDetailsOfYourCaseSoThat"
              placeholderTextColor={colors.textMuted}
              style={styles.descriptionInput}
              value={description}
            />

            <Pressable onPress={() => setEvidenceAdded((current) => !current)} style={styles.evidenceToggle}>
              <Ionicons color={evidenceAdded ? colors.success : colors.textMuted} name={evidenceAdded ? 'checkmark-circle' : 'image-outline'} size={18} />
              <Text style={styles.evidenceText}>{evidenceAdded ? 'Evidencia adjunta' : 'Adjuntar evidencia'}</Text>
            </Pressable>

            <Button icon="send-outline" onPress={sendSupportCase} title="__hupi_i18n:support.support.sendToHupiSupport" />
          </Card>
        </>
      ) : null}

      <Modal animationType="fade" onRequestClose={() => setMissingDataVisible(false)} transparent visible={missingDataVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons color={colors.white} name="alert-circle-outline" size={26} />
            </View>
            <Text style={styles.modalTitle}>__hupi_i18n:common.dataIsMissing</Text>
            <Text style={styles.modalText}>__hupi_i18n:support.support.selectAReasonAndDescribeYourCaseToSend</Text>
            <Button onPress={() => setMissingDataVisible(false)} title="__hupi_i18n:common.understood" />
          </View>
        </View>
      </Modal>

      {supportView === 'tickets' ? (
        <>
          <SectionTitle title="__hupi_i18n:common.myTickets" />
          {tickets.length > 0 ? (
            <View style={styles.stack}>
              {tickets.map((ticket) => (
                <TicketCard key={ticket.id} onPress={() => openTicket(ticket.id)} ticket={ticket} />
              ))}
            </View>
          ) : (
            <Card style={styles.emptyChatCard} tone="soft">
              <Ionicons color={colors.primary} name="ticket-outline" size={28} />
              <Text style={styles.emptyChatTitle}>__hupi_i18n:support.support.youDonTHaveSupportTicketsYet</Text>
              <Text style={styles.emptyChatText}>__hupi_i18n:support.support.whenYouCreateACaseItWillAppearHere</Text>
              <Button icon="add-circle-outline" onPress={() => setSupportView('create')} title="__hupi_i18n:common.createCase" />
            </Card>
          )}
        </>
      ) : null}

      {supportView === 'detail' && selectedTicket ? (
        <>
          <SectionTitle title="__hupi_i18n:support.support.ticketDetail" />
          <Card style={styles.ticketDetailCard}>
            <View style={styles.ticketDetailHeader}>
              <View>
                <Text style={styles.ticketNumber}>{selectedTicket.caseNumber}</Text>
                <Text style={styles.ticketReason}>{selectedTicket.reason}</Text>
              </View>
              <StatusPill status={selectedTicket.status} />
            </View>
            <Text style={styles.ticketDetailText}>{selectedTicket.description}</Text>
            <View style={styles.ticketMetaGrid}>
              <TicketMeta label="__hupi_i18n:common.created" value={selectedTicket.createdAt} />
              <TicketMeta
                label="__hupi_i18n:common.status"
                value={getSupportCaseStatusPresentation(selectedTicket.status, darkMode, t).label}
              />
            </View>
            {selectedTicket.relatedOrderNumber || selectedTicket.relatedBookingId ? (
              <View style={styles.relatedTicketBox}>
                <Ionicons color={colors.primary} name="link-outline" size={18} />
                <View style={styles.relatedOrderCopy}>
                  <Text style={styles.relatedOrderLabel}>__hupi_i18n:common.relatedTo</Text>
                  <Text style={styles.relatedOrderText}>{selectedTicket.relatedOrderNumber ?? selectedTicket.relatedBookingId}</Text>
                </View>
                {selectedTicket.relatedOrderNumber ? (
                  <Pressable onPress={() => router.push(`/marketplace/order-detail?orderId=${selectedTicket.relatedOrderNumber}` as Href)} style={styles.relatedTicketButton}>
                    <Text style={styles.relatedTicketButtonText}>__hupi_i18n:common.viewOrder</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => router.push(`/client/booking-detail?bookingId=${selectedTicket.relatedBookingId}` as Href)} style={styles.relatedTicketButton}>
                    <Text style={styles.relatedTicketButtonText}>__hupi_i18n:common.seeReservation</Text>
                  </Pressable>
                )}
              </View>
            ) : null}
            <Text style={styles.historyTitle}>__hupi_i18n:support.support.caseHistory</Text>
            <View style={styles.historyStack}>
              {selectedTicket.history.map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <Text style={styles.historyAuthor}>{item.author}</Text>
                  <Text style={styles.historyMessage}>{item.message}</Text>
                  <Text style={styles.historyTime}>{item.createdAt}</Text>
                </View>
              ))}
            </View>
            {selectedTicket.status !== 'Cerrado' ? (
              <>
                <Text style={styles.formLabel}>__hupi_i18n:common.addMessage</Text>
                <TextInput
                  multiline
                  onChangeText={setTicketReply}
                  placeholder="__hupi_i18n:support.support.addsAnUpdateForHupiSupport"
                  placeholderTextColor={colors.textMuted}
                  style={styles.descriptionInput}
                  value={ticketReply}
                />
                <View style={styles.ticketDetailActions}>
                  <Button icon="send-outline" onPress={addTicketMessage} style={styles.ticketDetailButton} title="__hupi_i18n:common.addMessage" />
                  <Button icon="checkmark-circle-outline" onPress={closeTicket} style={styles.ticketDetailButton} title="__hupi_i18n:common.closeCase" variant="outline" />
                </View>
              </>
            ) : null}
          </Card>
        </>
      ) : null}

      <SectionTitle title="__hupi_i18n:support.support.frequentlyAskedQuestions" />
      <View style={styles.stack}>
        {mockFaqs.map((faq) => (
          <FaqItem
            answer={faq.answer}
            expanded={expandedFaq === faq.id}
            key={faq.id}
            onPress={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
            question={faq.question}
          />
        ))}
      </View>

      <SectionTitle title="__hupi_i18n:support.support.informativeNetworksAndWebsites" />
      <Card style={styles.socialCard} tone="soft">
        <Text style={styles.socialIntro}>__hupi_i18n:support.support.youCanAlsoLearnMoreAboutHupiOnOur</Text>
        <View style={styles.socialGrid}>
          {mockSocialLinks.map((item) => (
            <SocialLinkCard
              accessibilityLabel={t(item.accessibilityLabelKey)}
              icon={item.icon}
              key={item.id}
              label={t(item.labelKey)}
              onPress={() => void openSocialLink(item)}
            />
          ))}
        </View>
        <Text style={styles.externalNotice}>

          __hupi_i18n:support.support.externalInformationAccessesTheyAreNotChatChannelsOr
        </Text>
      </Card>

      <HupiSuccessModal
        buttonLabel="Ver caso"
        description="__hupi_i18n:support.support.yourRequestWasSentToHupiSupportWeWill"
        onClose={() => {
          const ticketId = createdCase?.ticketId;
          setCreatedCase(null);
          if (ticketId) {
            setSelectedTicketId(ticketId);
            setSupportView('detail');
          }
        }}
        reference={createdCase ? `Caso #${createdCase.caseNumber}` : undefined}
        title="__hupi_i18n:common.caseSent"
        visible={Boolean(createdCase)}
      />
    </ScreenContainer>
  );
}

function matchesMessageFilter(type: MockConversationType, unreadCount: number, filter: MessageFilter) {
  if (filter === 'Todos') {
    return true;
  }

  if (filter === 'No leídos') {
    return unreadCount > 0;
  }

  if (filter === 'Marketplace') {
    return type === 'marketplace';
  }

  if (filter === 'Servicios') {
    return type === 'services';
  }

  return type === 'support';
}

function getConversationTypeLabel(type: MockConversationType) {
  if (type === 'services') {
    return 'Servicio';
  }

  if (type === 'support') {
    return 'Soporte';
  }

  return 'Reserva';
}

function TicketCard({ onPress, ticket }: { onPress: () => void; ticket: MockSupportTicket }) {
  return (
    <Card style={styles.ticketCard}>
      <View style={styles.ticketCardHeader}>
        <View style={styles.ticketIcon}>
          <Ionicons color={colors.primary} name="ticket-outline" size={20} />
        </View>
        <View style={styles.ticketCardCopy}>
          <Text style={styles.ticketNumber}>{ticket.caseNumber}</Text>
          <Text style={styles.ticketReason}>{ticket.reason}</Text>
        </View>
        <StatusPill status={ticket.status} />
      </View>
      <View style={styles.ticketMetaGrid}>
        <TicketMeta label="__hupi_i18n:common.date" value={ticket.createdAt} />
        <TicketMeta label="__hupi_i18n:common.related" value={ticket.relatedOrderNumber ?? ticket.relatedBookingId ?? 'Sin relación'} />
      </View>
      <Text style={styles.ticketPreview}>{ticket.lastSupportMessage}</Text>
      <Button icon="document-text-outline" onPress={onPress} title="__hupi_i18n:common.seeCase" variant="outline" />
    </Card>
  );
}

function StatusPill({ status }: { status: MockSupportTicket['status'] }) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const presentation = getSupportCaseStatusPresentation(status, isDark, t);

  return (
    <View
      accessibilityLabel={presentation.label}
      style={[
        styles.statusPillSupport,
        { backgroundColor: presentation.backgroundColor, borderColor: presentation.borderColor },
      ]}
    >
      <View style={[styles.statusDotSupport, { backgroundColor: presentation.textColor }]} />
      <Text style={[styles.statusTextSupport, { color: presentation.textColor }]}>{presentation.label}</Text>
    </View>
  );
}

function TicketMeta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.ticketMetaItem}>
      <Text style={styles.ticketMetaLabel}>{label}</Text>
      <Text style={styles.ticketMetaValue}>{value}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 10, paddingBottom: 42 },
  chatShell: { flex: 1, padding: 0 },
  chatContent: { paddingHorizontal: 20, paddingTop: 10 },
  headerIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 28, marginBottom: 13 },
  sectionTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 18, fontWeight: '900', lineHeight: 25, paddingBottom: 1 },
  sectionLine: { flex: 1, height: 1, backgroundColor: colors.border },
  stack: { gap: 11 },
  supportActionsCard: { gap: 13, marginTop: 22, shadowOpacity: 0 },
  supportActionCopy: { gap: 4 },
  supportActionTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, fontWeight: '900' },
  supportActionText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  supportActionButtons: { flexDirection: 'row', gap: 10 },
  supportActionButton: { flex: 1 },
  ticketCard: { gap: 12, shadowOpacity: 0.05 },
  ticketCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ticketIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  ticketCardCopy: { flex: 1 },
  ticketNumber: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  ticketReason: { color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 20, fontWeight: '800', marginTop: 2 },
  ticketMetaGrid: { flexDirection: 'row', gap: 8 },
  ticketMetaItem: { flex: 1, borderRadius: 13, backgroundColor: colors.soft, padding: 10, gap: 3 },
  ticketMetaLabel: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900' },
  ticketMetaValue: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 18, fontWeight: '800' },
  ticketPreview: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  statusPillSupport: { minHeight: 28, borderRadius: 999, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9 },
  statusDotSupport: { width: 7, height: 7, borderRadius: 4 },
  statusTextSupport: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', lineHeight: 18 },
  ticketDetailCard: { gap: 13, shadowOpacity: 0.05 },
  ticketDetailHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  ticketDetailText: { color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 22 },
  relatedTicketBox: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 15, backgroundColor: colors.primarySoft, padding: 11 },
  relatedTicketButton: { minHeight: 32, borderRadius: 999, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  relatedTicketButtonText: { color: colors.white, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900' },
  historyTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  historyStack: { gap: 8 },
  historyItem: { borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: 11, gap: 4 },
  historyAuthor: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900' },
  historyMessage: { color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  historyTime: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12 },
  ticketDetailActions: { flexDirection: 'row', gap: 10 },
  ticketDetailButton: { flex: 1 },
  emptyChatCard: { alignItems: 'center', gap: 8, marginTop: 2, shadowOpacity: 0 },
  emptyChatTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  emptyChatText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, textAlign: 'center' },
  floatingSupportBanner: {
    position: 'absolute',
    left: 20,
    right: 20,
    minHeight: 68,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    shadowColor: '#1b1412',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 14,
  },
  floatingSupportBannerPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  floatingSupportIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  floatingSupportCopy: { flex: 1 },
  floatingSupportTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  floatingSupportText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 2 },
  floatingSupportCta: { minHeight: 34, borderRadius: 999, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  floatingSupportCtaText: { color: colors.white, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900' },
  supportForm: { gap: 12, shadowOpacity: 0.04 },
  traceabilityStack: { gap: 8 },
  relatedOrderBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, backgroundColor: colors.primarySoft, padding: 11 },
  relatedOrderCopy: { flex: 1 },
  relatedOrderLabel: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', marginBottom: 2 },
  relatedOrderText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  formIntro: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 13, lineHeight: 21, fontWeight: '800' },
  formLabel: { color: colors.text, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fieldError: { color: colors.danger, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: -6 },
  otherReasonBlock: { gap: 7 },
  otherReasonInput: { minHeight: 50, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.text, fontFamily: fonts.regular, paddingHorizontal: 12 },
  inputError: { borderColor: colors.danger },
  counter: { color: colors.textMuted, fontFamily: fonts.light, fontSize: 12, textAlign: 'right' },
  orderChip: { minHeight: 34, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.soft, justifyContent: 'center', paddingHorizontal: 10 },
  orderChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  orderChipText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900' },
  orderChipTextActive: { color: colors.primary },
  descriptionInput: { minHeight: 92, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.text, fontFamily: fonts.medium, padding: 12, textAlignVertical: 'top', fontWeight: '800' },
  evidenceToggle: { minHeight: 42, borderRadius: 14, backgroundColor: colors.soft, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  evidenceText: { color: colors.text, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(51, 51, 51, 0.34)', padding: 22 },
  modalCard: { width: '100%', maxWidth: 360, borderRadius: 22, backgroundColor: colors.white, padding: 18, alignItems: 'stretch', gap: 12 },
  modalIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  modalTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 19, fontWeight: '900', textAlign: 'center' },
  modalText: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 15, lineHeight: 23, fontWeight: '800', textAlign: 'center' },
  messageSummary: { alignSelf: 'flex-start', minHeight: 30, borderRadius: 999, backgroundColor: colors.primarySoft, justifyContent: 'center', paddingHorizontal: 11, marginBottom: 11 },
  messageSummaryText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 13 },
  filterChip: { minHeight: 34, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, justifyContent: 'center', paddingHorizontal: 11 },
  activeFilterChip: { borderColor: colors.primary, backgroundColor: colors.primary },
  filterText: { color: colors.textMuted, flexShrink: 1, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', lineHeight: 18, paddingBottom: 1 },
  activeFilterText: { color: colors.white },
  mockCase: { padding: 15, marginTop: 11, shadowOpacity: 0 },
  mockCaseEyebrow: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  mockCaseTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900', marginTop: 5 },
  mockCaseText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 21, marginTop: 6 },
  socialCard: { padding: 15, shadowOpacity: 0 },
  socialIntro: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 15, fontWeight: '800', lineHeight: 22 },
  socialGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginTop: 14 },
  externalNotice: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 13 },
});
