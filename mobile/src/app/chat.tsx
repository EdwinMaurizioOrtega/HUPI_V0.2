import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useLocalSearchParams,
  useRouter } from 'expo-router';
import { useEffect,
  useMemo,
  useRef,
  useState } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { OfferComposerModal } from '@/components/chat/OfferComposerModal';
import { PresenceStatus } from '@/components/chat/PresenceStatus';
import { SafetyNoticeCard } from '@/components/chat/SafetyNoticeCard';
import { ProviderTermsAcceptanceBlock } from '@/components/provider/ProviderTermsAcceptanceBlock';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DisabledServiceNotice } from '@/components/DisabledServiceNotice';
import { HupiVerifiedBadge } from '@/components/providers/HupiVerifiedBadge';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { formatBookingCurrency } from '@/constants/mockBookings';
import {
  getMockConversation,
  getMockMessages,
  getMockServiceCoordinationByChatId,
  getMockServiceOffers,
  markMockServiceOffersViewed,
  mockClientPresence,
  mockUser,
  selectMockServiceOffer,
  sendMockServiceOffer,
  updateMockServiceOfferStatus,
  type MockServiceCoordinationRequest,
  type MockServiceOffer,
  type MockAttachmentType,
  type MockMessage,
  type MockMessageSender,
} from '@/constants/mockData';
import { getMockProviderPhotoUri, mockProviders } from '@/constants/mockProviders';
import { fonts } from '@/constants/typography';
import { Pressable, Text, TextInput } from '@/i18n/components';
import { useLocalAccount } from '@/hooks/useLocalAccount';
import { useMockProviderPricing } from '@/hooks/useMockProviderPricing';
import { formatAverageResponseTime } from '@/domain/responseTime';
import { useTheme } from '@/theme/ThemeProvider';
import { recordMockProviderTermsAcceptance } from '@/data/mockProviderProfileRepository';
import { syncSendMessage } from '@/data/remoteWrites';
import { useTranslation } from '../../node_modules/react-i18next';

type Viewer = 'client' | 'provider' | 'admin';

const seenSafetyNoticeConversationIds = new Set<string>();

const attachmentMessages: Record<Exclude<MockAttachmentType, null>, string> = {
  image: 'Imagen adjunta',
  document: 'Documento adjunto',
  receipt: 'Comprobante adjunto',
};

export default function ChatScreen() {
  useMockProviderPricing();
  const router = useRouter();
  const { t } = useTranslation();
  const { profile } = useLocalAccount();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const safetyAnimation = useRef(new Animated.Value(0)).current;
  const animatedSafetyConversationId = useRef<string | null>(null);
  const {
    caseNumber,
    category,
    chatId,
    description,
    orderNumber,
    reason,
    viewer = 'client',
  } = useLocalSearchParams<{
    caseNumber?: string;
    category?: string;
    chatId?: string;
    description?: string;
    orderNumber?: string;
    reason?: string;
    viewer?: Viewer;
  }>();
  const currentViewer: Viewer = viewer === 'provider' || viewer === 'admin' ? viewer : 'client';
  const conversation = useMemo(() => getMockConversation(chatId), [chatId]);
  const [serviceRequest, setServiceRequest] = useState<MockServiceCoordinationRequest | undefined>(() => getMockServiceCoordinationByChatId(chatId));
  const [serviceOffers, setServiceOffers] = useState<MockServiceOffer[]>(() => getMockServiceOffers(serviceRequest?.id));
  const [offerComposerOpen, setOfferComposerOpen] = useState(false);
  const [initialSafetyVisible, setInitialSafetyVisible] = useState(false);
  const [draft, setDraft] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const initialMessages = useMemo(() => {
    const caseReason = reason ?? category;

    if (!caseNumber || !caseReason || !description) {
      return getMockMessages(conversation.id);
    }

    const relatedOrder = orderNumber ? `\nPedido: ${orderNumber}` : '\nPedido: Sin pedido relacionado';

    return [
      {
        id: `case-${caseNumber}-customer`,
        conversationId: `support-${caseNumber}`,
        sender: 'customer',
        text: `Motivo: ${caseReason}${relatedOrder}\nDescripción: ${description}`,
        createdAt: 'Ahora',
        status: 'Enviado',
        attachmentType: null,
      },
      {
        id: `case-${caseNumber}-support`,
        conversationId: `support-${caseNumber}`,
        sender: 'support',
        text: `Hola, recibimos tu caso #${caseNumber}. Nuestro equipo revisará la información y te responderemos en un máximo de 24 horas.`,
        createdAt: 'Ahora',
        status: 'Leído',
        attachmentType: null,
      },
    ] satisfies MockMessage[];
  }, [caseNumber, category, conversation.id, description, orderNumber, reason]);
  const [messages, setMessages] = useState<MockMessage[]>(() => initialMessages);

  const ownSender: MockMessageSender = currentViewer === 'admin' ? 'support' : currentViewer === 'provider' ? 'provider' : 'customer';
  const isSupportCase = Boolean(caseNumber) || conversation.role === 'Soporte Hupi';
  const isServiceCoordination = conversation.type === 'services' && Boolean(serviceRequest);
  const serviceProvider = serviceRequest
    ? mockProviders.find((provider) => provider.id === serviceRequest.providerId)
    : undefined;
  const displayAvatarType = currentViewer === 'provider' && !isSupportCase ? 'owner' : 'provider';
  const displayPhotoUri = isServiceCoordination && currentViewer === 'client' && serviceProvider
    ? getMockProviderPhotoUri(serviceProvider.id)
    : currentViewer === 'provider' && !isSupportCase
      ? profile.profilePhotoUri
      : undefined;
  const autoReplySender: MockMessageSender = isSupportCase ? (currentViewer === 'admin' ? 'customer' : 'support') : currentViewer === 'provider' ? 'customer' : 'provider';
  const displayTitle = isSupportCase
    ? 'Soporte Hupi'
    : currentViewer === 'provider' && conversation.type !== 'support'
      ? `${profile.firstName} ${profile.lastName}`.trim()
      : conversation.title;
  const displayCategory = reason ?? category ?? conversation.ticketReason;
  const displayCaseNumber = caseNumber ?? conversation.caseNumber ?? conversation.ticketNumber;
  const displayCaseStatus = caseNumber ? 'Abierto' : conversation.ticketStatus;
  const relatedOrderNumber = orderNumber ?? conversation.orderNumber;
  const caseSubtitle = relatedOrderNumber ? `Caso #${displayCaseNumber} · Pedido ${relatedOrderNumber}` : `Caso #${displayCaseNumber}`;
  const shouldShowRelatedOrderBanner = isSupportCase && Boolean(relatedOrderNumber || conversation.relatedOrderId || conversation.orderId);
  const peerPresence = currentViewer === 'provider' ? mockClientPresence : serviceProvider;
  const peerOnline = Boolean(peerPresence?.isOnline);
  const peerAverageResponseTime = peerPresence?.averageResponseTimeMinutes ?? 20;
  const peerResponseTime = formatAverageResponseTime(peerAverageResponseTime, t);

  if (conversation.type === 'services' && !serviceRequest) {
    return (
      <ScreenContainer>
        <DisabledServiceNotice />
      </ScreenContainer>
    );
  }

  const getRelatedOrderCta = () => {
    if (currentViewer === 'provider') {
      return 'Ver orden de compra';
    }

    if (currentViewer === 'admin') {
      return 'Ver pedido en Admin';
    }

    return 'Ver pedido';
  };

  const getRelatedOrderRoute = () => {
    if (currentViewer === 'provider') {
      return conversation.relatedOrderRoute
        ?? `/provider/marketplace-order-detail?providerOrderId=${conversation.relatedProviderOrderId ?? 'HUPI-MK-2049-A'}`;
    }

    if (currentViewer === 'admin') {
      return conversation.relatedAdminOrderRoute ?? `/marketplace/orders/${relatedOrderNumber ?? 'HUPI-MK-2049'}`;
    }

    return conversation.relatedCustomerOrderRoute ?? `/marketplace/order-detail?orderId=${relatedOrderNumber ?? 'HUPI-MK-2049'}`;
  };

  const openRelatedOrder = () => {
    const route = getRelatedOrderRoute();

    if (currentViewer === 'admin') {
      Alert.alert('Ruta Admin', `En Admin se abrirá: ${route}`);
      return;
    }

    router.push(route as Href);
  };

  const scrollToLatest = () => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  useEffect(() => {
    setMessages(initialMessages);
    const nextRequest = getMockServiceCoordinationByChatId(chatId);
    setServiceRequest(nextRequest);
    setServiceOffers(getMockServiceOffers(nextRequest?.id));
  }, [initialMessages]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      scrollToLatest();
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    scrollToLatest();
  }, [messages.length]);

  useEffect(() => {
    if (!isServiceCoordination) {
      setInitialSafetyVisible(false);
      return undefined;
    }
    if (
      seenSafetyNoticeConversationIds.has(conversation.id)
      && animatedSafetyConversationId.current !== conversation.id
    ) {
      setInitialSafetyVisible(false);
      return undefined;
    }

    animatedSafetyConversationId.current = conversation.id;
    seenSafetyNoticeConversationIds.add(conversation.id);
    safetyAnimation.setValue(0);
    setInitialSafetyVisible(true);
    let holdTimer: ReturnType<typeof setTimeout> | undefined;
    const entranceAnimation = Animated.timing(safetyAnimation, {
      duration: 320,
      toValue: 1,
      useNativeDriver: true,
    });

    entranceAnimation.start(({ finished }) => {
      if (!finished) return;
      holdTimer = setTimeout(() => {
        Animated.timing(safetyAnimation, {
          duration: 320,
          toValue: 0,
          useNativeDriver: true,
        }).start(({ finished: exitFinished }) => {
          if (exitFinished) setInitialSafetyVisible(false);
        });
      }, 5000);
    });

    return () => {
      if (holdTimer) clearTimeout(holdTimer);
      entranceAnimation.stop();
      safetyAnimation.stopAnimation();
    };
  }, [conversation.id, isServiceCoordination, safetyAnimation]);

  useEffect(() => {
    if (currentViewer !== 'client' || !serviceRequest || serviceOffers.length === 0) return;
    setServiceOffers(markMockServiceOffersViewed(serviceRequest.id));
  }, [currentViewer, serviceOffers.length, serviceRequest?.id]);

  const sendLocalMessage = () => {
    const trimmed = draft.trim();

    if (!trimmed) {
      return;
    }

    const risk = detectExternalContactRisk(trimmed);
    if (isServiceCoordination && risk.risky) {
      if (risk.block) {
        Alert.alert(
          "__hupi_i18n:support.chat.forYourSecurityCoordinateAndPayWithinHupi",
          "__hupi_i18n:support.chat.hupiProtectsYourReservationWhenYouCoordinateAndPay",
        );
        return;
      }
    }

    const localId = `local-${Date.now()}`;
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: localId,
        conversationId: conversation.id,
        sender: ownSender,
        text: trimmed,
        createdAt: 'Ahora',
        status: 'Enviado',
        attachmentType: null,
      },
    ]);
    setDraft('');
    syncSendMessage(conversation.id, trimmed);

    setTimeout(() => {
      setMessages((currentMessages) => (
        currentMessages.map((message) => (
          message.id === localId ? { ...message, status: 'Leído' } : message
        ))
      ));
      addAutoReply();
    }, 450);
  };

  const addAutoReply = () => {
    const text = isSupportCase
      ? 'Recibimos tu mensaje. Nuestro equipo lo revisará.'
      : currentViewer === 'provider'
        ? 'Gracias, quedo atento a la confirmación.'
        : 'Gracias, lo reviso y te confirmo.';

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `reply-${Date.now()}`,
        conversationId: conversation.id,
        sender: autoReplySender,
        text,
        createdAt: 'Ahora',
        status: 'Leído',
        attachmentType: null,
      },
    ]);
  };

  const addMockAttachment = (attachmentType: Exclude<MockAttachmentType, null>) => {
    Alert.alert('Adjunto agregado', "__hupi_i18n:support.chat.inProductionYouCanSendImagesOrDocuments");
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `attachment-${attachmentType}-${Date.now()}`,
        conversationId: conversation.id,
        sender: ownSender,
        text: attachmentMessages[attachmentType],
        createdAt: 'Ahora',
        status: 'Enviado',
        attachmentType,
      },
    ]);
    Keyboard.dismiss();
  };

  const sendOfferFromProvider = (input: Parameters<typeof sendMockServiceOffer>[1]) => {
    if (!serviceRequest) {
      return;
    }

    const offer = sendMockServiceOffer(serviceRequest.id, input);
    const nextRequest = getMockServiceCoordinationByChatId(chatId);
    setServiceRequest(nextRequest);
    setServiceOffers(getMockServiceOffers(serviceRequest.id));
    setOfferComposerOpen(false);
    if (offer) scrollToLatest();
  };

  const declineOffer = (offer: MockServiceOffer) => {
    updateMockServiceOfferStatus(offer.id, 'declined');
    setServiceOffers(getMockServiceOffers(serviceRequest?.id));
  };

  const continueToCheckout = (offer: MockServiceOffer) => {
    const selectedOffer = selectMockServiceOffer(offer.id);
    const nextRequest = getMockServiceCoordinationByChatId(chatId);
    setServiceRequest(nextRequest);
    setServiceOffers(getMockServiceOffers(serviceRequest?.id));

    router.push(
      `/client/service-checkout?providerId=${selectedOffer?.providerId ?? offer.providerId}&serviceId=${offer.serviceType}&requestId=${offer.requestId}&offerId=${offer.id}&termsAccepted=1` as Href,
    );
  };

  const getSenderLabel = (sender: MockMessageSender) => {
    if (sender === 'system') {
      return 'Hupi';
    }

    if (sender === 'support') {
      return currentViewer === 'admin' ? 'Tú' : 'Soporte Hupi';
    }

    if (sender === 'provider') {
      return currentViewer === 'provider' ? 'Tú' : 'Proveedor';
    }

    return currentViewer === 'client' ? 'Tú' : 'Cliente';
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container} scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.keyboard}
      >
          <View style={styles.topbar}>
            <Pressable accessibilityLabel="__hupi_i18n:common.back" onPress={() => router.back()} style={styles.backButton}>
              <Ionicons color={colors.text} name="arrow-back" size={22} />
            </Pressable>
            <ProfileAvatar size={44} style={styles.avatar} type={displayAvatarType} uri={displayPhotoUri} />
            <View style={styles.headerCopy}>
              <View style={styles.contactNameRow}>
                <Text numberOfLines={2} style={styles.contactName}>{displayTitle}</Text>
                {isServiceCoordination && currentViewer === 'client' && serviceProvider?.isVerifiedByHupi ? <HupiVerifiedBadge /> : null}
              </View>
              {isSupportCase
                ? <Text numberOfLines={1} style={styles.roleText}>{caseSubtitle}</Text>
                : <PresenceStatus isOnline={peerOnline} />}
              {!isSupportCase ? <Text numberOfLines={1} style={styles.responseTime}>{peerResponseTime}</Text> : null}
            </View>
          </View>

          {isSupportCase ? (
            <View style={styles.contextPill}>
              <Ionicons color={colors.primary} name="shield-checkmark-outline" size={15} />
              <Text style={styles.contextText}>Respondemos en máximo 24 horas.</Text>
            </View>
          ) : null}

          {shouldShowRelatedOrderBanner ? (
            <Pressable onPress={openRelatedOrder} style={({ pressed }) => [styles.relatedOrderBanner, pressed && styles.relatedOrderPressed]}>
              <View style={styles.relatedOrderIcon}>
                <Ionicons color={colors.secondary} name="receipt-outline" size={20} />
              </View>
              <View style={styles.relatedOrderCopy}>
                <Text style={styles.relatedOrderTitle}>__hupi_i18n:common.relatedOrder</Text>
                <Text style={styles.relatedOrderText}>__hupi_i18n:support.chat.thisCaseIsLinkedToTheOrder {relatedOrderNumber}.</Text>
                <View style={styles.relatedOrderMeta}>
                  {conversation.orderStatus ? <Text style={styles.relatedOrderChip}>__hupi_i18n:common.order3 {conversation.orderStatus}</Text> : null}
                  {conversation.paymentStatus ? <Text style={styles.relatedOrderChip}>__hupi_i18n:common.payment2 {conversation.paymentStatus}</Text> : null}
                  {conversation.storeName ? <Text style={styles.relatedOrderChip}>{conversation.storeName}</Text> : null}
                </View>
              </View>
              <View style={styles.relatedOrderCta}>
                <Text style={styles.relatedOrderCtaText}>{getRelatedOrderCta()}</Text>
                <Ionicons color={colors.white} name="arrow-forward" size={14} />
              </View>
            </Pressable>
          ) : null}

          {isSupportCase ? (
            <View style={styles.ticketCard}>
              <Text style={styles.ticketTitle}>__hupi_i18n:common.case3{displayCaseNumber}</Text>
              {relatedOrderNumber ? <Text style={styles.ticketMeta}>__hupi_i18n:common.order3 {relatedOrderNumber}</Text> : null}
              <Text style={styles.ticketMeta}>__hupi_i18n:common.reason2 {displayCategory}</Text>
              <Text style={styles.ticketMeta}>__hupi_i18n:common.caseStatus {displayCaseStatus}</Text>
              <Text style={styles.ticketMeta}>__hupi_i18n:support.chat.weRespondWithin24HoursMaximum</Text>
            </View>
          ) : null}

          {!isSupportCase && initialSafetyVisible ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.safetyOverlay,
                {
                  opacity: safetyAnimation,
                  transform: [
                    { translateY: safetyAnimation.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) },
                    { scaleY: safetyAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
                  ],
                },
              ]}
            >
              <SafetyNoticeCard />
            </Animated.View>
          ) : null}

          <ScrollView
            contentContainerStyle={[styles.messages, keyboardVisible && styles.messagesKeyboardOpen]}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={scrollToLatest}
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            style={styles.messageScroll}
          >
            {messages.map((message) => (
              <ChatMessageBubble
                attachmentType={message.attachmentType}
                isOwn={message.sender === ownSender}
                key={message.id}
                senderLabel={getSenderLabel(message.sender)}
                status={message.sender === ownSender ? message.status : undefined}
                text={message.text}
                time={message.createdAt}
              />
            ))}
            {isServiceCoordination && serviceOffers.length > 0 ? (
              <View style={styles.offerPanel}>
                <Text style={styles.offerPanelTitle}>__hupi_i18n:support.chat.formalOfferSent</Text>
                {serviceOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onContinue={currentViewer === 'client' ? () => continueToCheckout(offer) : undefined}
                    onDecline={currentViewer === 'client' && (offer.status === 'sent' || offer.status === 'viewed') ? () => declineOffer(offer) : undefined}
                  />
                ))}
              </View>
            ) : null}
          </ScrollView>

          {isServiceCoordination && serviceRequest && currentViewer === 'provider' ? (
            <View style={styles.offerActionBar}>
              <Button icon="pricetag-outline" onPress={() => setOfferComposerOpen(true)} title={t('offerFlow.sendOffer')} variant="secondary" />
            </View>
          ) : null}

          <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, keyboardVisible ? 8 : 12) }]}>
            {keyboardVisible ? (
              <View style={styles.keyboardToolbar}>
                <Pressable onPress={Keyboard.dismiss} style={({ pressed }) => [styles.hideKeyboardButton, pressed && styles.hideKeyboardPressed]}>
                  <Ionicons color={colors.secondary} name="chevron-down" size={15} />
                  <Text style={styles.hideKeyboardText}>__hupi_i18n:common.hideKeyboard</Text>
                </Pressable>
              </View>
            ) : null}
            <View style={styles.composer}>
              <View style={styles.mediaActions}>
                <Pressable accessibilityLabel="__hupi_i18n:common.addCamera" onPress={() => addMockAttachment('image')} style={({ pressed }) => [styles.mediaButton, pressed && styles.mediaPressed]}>
                  <Ionicons color={colors.secondary} name="camera-outline" size={19} />
                </Pressable>
                <Pressable accessibilityLabel="__hupi_i18n:common.addGallery" onPress={() => addMockAttachment('image')} style={({ pressed }) => [styles.mediaButton, pressed && styles.mediaPressed]}>
                  <Ionicons color={colors.secondary} name="image-outline" size={19} />
                </Pressable>
                <Pressable accessibilityLabel="__hupi_i18n:common.attachFile" onPress={() => addMockAttachment('document')} style={({ pressed }) => [styles.mediaButton, pressed && styles.mediaPressed]}>
                  <Ionicons color={colors.secondary} name="attach-outline" size={19} />
                </Pressable>
              </View>
              <TextInput
                blurOnSubmit
                multiline
                onChangeText={setDraft}
                onSubmitEditing={Keyboard.dismiss}
                placeholder="__hupi_i18n:support.chat.writeAMessage"
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                style={styles.input}
                value={draft}
              />
              <Pressable accessibilityRole="button" onPress={sendLocalMessage} style={({ pressed }) => [styles.sendButton, pressed && styles.sendPressed]}>
                <Ionicons color={colors.white} name="send" size={18} />
              </Pressable>
            </View>
          </View>
          {serviceRequest && serviceProvider ? (
            <OfferComposerModal
              onClose={() => setOfferComposerOpen(false)}
              onSend={sendOfferFromProvider}
              request={serviceRequest}
              visible={offerComposerOpen}
            />
          ) : null}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function detectExternalContactRisk(text: string) {
  const normalized = text.toLowerCase();
  const block = /(\+?\d[\d\s().-]{7,}\d)|([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})|(https?:\/\/)|(www\.)|(wa\.me)|(whatsapp)|(p[aá]game afuera)|(por fuera)|(transferencia directa)|(te paso mi n[uú]mero)/i.test(text);
  const risky = block || /(instagram)|(@)|(escr[ií]beme por whatsapp)|(hag[aá]moslo por fuera)|(links? externos?)/i.test(normalized);

  return { risky, block };
}

function OfferCard({ offer, onContinue, onDecline }: { offer: MockServiceOffer; onContinue?: () => void; onDecline?: () => void }) {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const actionable = offer.status === 'sent' || offer.status === 'viewed';
  const offerProvider = mockProviders.find((provider) => provider.id === offer.providerId);
  const continueWithAcceptance = () => {
    if (!onContinue || !acceptsTerms || !offerProvider) return;
    recordMockProviderTermsAcceptance({
      termsId: offerProvider.walkProfile.terms.id,
      termsVersion: offerProvider.walkProfile.terms.version,
      effectiveDate: offerProvider.walkProfile.terms.effectiveDate,
      providerId: offerProvider.id,
      providerName: offerProvider.name,
      clientId: mockUser.id,
      serviceOrPlanId: offer.id,
    });
    onContinue();
  };

  return (
    <Card style={[styles.offerCard, { backgroundColor: tokens.surfaceRaised, borderColor: tokens.border }]}>
      <View style={styles.offerHeader}>
        <View style={[styles.offerIcon, { backgroundColor: tokens.primarySoft }]}><Ionicons color={tokens.primary} name="pricetag-outline" size={18} /></View>
        <View style={styles.offerCopy}>
          <Text style={[styles.offerService, { color: tokens.secondary }]}>{t(offer.approvedOfferType === 'plan' ? 'offerFlow.approvedPlan' : 'offerFlow.approvedService')}</Text>
          <Text style={[styles.offerTitle, { color: tokens.text }]}>{offer.title}</Text>
          <Text style={[styles.offerDescription, { color: tokens.textMuted }]}>{offer.description}</Text>
        </View>
        <Text style={[styles.offerStatus, { color: tokens.secondary }]}>{t(`offerFlow.statuses.${offer.status}`)}</Text>
      </View>
      {expanded ? <View style={styles.offerLines}>
        <View style={styles.offerLine}>
          <Text style={styles.offerLabel}>{t('offerFlow.pet')}</Text>
          <Text style={styles.offerValue}>{offer.petName}</Text>
        </View>
        <View style={styles.offerLine}>
          <Text style={styles.offerLabel}>__hupi_i18n:common.duration</Text>
          <Text style={styles.offerValue}>{offer.duration}</Text>
        </View>
        <View style={styles.offerLine}>
          <Text style={styles.offerLabel}>__hupi_i18n:common.dateTime</Text>
          <Text style={styles.offerValue}>{offer.proposedDate} · {offer.proposedTime}</Text>
        </View>
        <View style={styles.offerLine}>
          <Text style={styles.offerLabel}>__hupi_i18n:common.conditions</Text>
          <Text style={styles.offerValue}>{offer.conditions.slice(0, 2).join(' · ')}</Text>
        </View>
        <View style={styles.offerLine}>
          <Text style={styles.offerLabel}>{t('offerFlow.hourlyPrice')}</Text>
          <Text style={styles.offerValue}>{formatBookingCurrency(offer.hourlyPrice)}</Text>
        </View>
        <View style={styles.offerLine}>
          <Text style={styles.offerLabel}>__hupi_i18n:common.servicePrice</Text>
          <Text style={styles.offerValue}>{formatBookingCurrency(offer.basePrice)}</Text>
        </View>
        <View style={styles.offerLine}>
          <Text style={styles.offerLabel}>__hupi_i18n:common.hupiSurcharge15</Text>
          <Text style={styles.offerValue}>{formatBookingCurrency(offer.clientFee)}</Text>
        </View>
        <View style={[styles.offerLine, styles.offerTotalLine, { borderTopColor: tokens.border }]}>
          <Text style={styles.offerTotalLabel}>__hupi_i18n:common.totalClient</Text>
          <Text style={[styles.offerTotalValue, { color: tokens.primary }]}>{formatBookingCurrency(offer.clientTotal)}</Text>
        </View>
      </View> : null}
      <Text style={styles.offerExpiry}>{t('offerFlow.validityHours', { count: offer.validForHours })}</Text>
      <Button icon={expanded ? 'chevron-up' : 'eye-outline'} onPress={() => setExpanded((value) => !value)} title={expanded ? t('offerFlow.hideDetails') : t('offerFlow.reviewOffer')} variant="outline" />
      {onContinue && actionable ? (
        <>
          {offerProvider ? <ProviderTermsAcceptanceBlock checked={acceptsTerms} onChange={setAcceptsTerms} provider={offerProvider} /> : null}
          <View style={styles.offerActions}>
            {onDecline ? <Button onPress={onDecline} style={styles.offerActionButton} title={t('offerFlow.decline')} variant="ghost" /> : null}
            <Button
              disabled={!acceptsTerms}
              icon="arrow-forward"
              onDisabledPress={() => Alert.alert(t('providerProfile.acceptance.requiredNotice'))}
              onPress={continueWithAcceptance}
              style={styles.offerActionButton}
              title={t('offerFlow.continueToCheckout')}
            />
          </View>
        </>
      ) : (
        !onContinue ? (
          <Text style={styles.internalSplit}>
            {t('generated.support.chat.providerViewYouReceive70')} {formatBookingCurrency(offer.providerAmount)} · {t('generated.common.hupi30')} {formatBookingCurrency(offer.hupiCommission)}
          </Text>
        ) : null
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, paddingTop: 8, paddingBottom: 0 },
  keyboard: { flex: 1, minHeight: 0 },
  topbar: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, minWidth: 0, overflow: 'visible', paddingBottom: 2 },
  contactNameRow: { alignItems: 'flex-start', flexDirection: 'row', minWidth: 0 },
  contactName: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 18, fontWeight: '900', lineHeight: 23, paddingBottom: 1 },
  roleText: { color: colors.textMuted, flexShrink: 1, fontFamily: fonts.semiBold, fontSize: 14, fontWeight: '800', lineHeight: 20, marginTop: 2 },
  safetyOverlay: { left: 0, position: 'absolute', right: 0, top: 66, zIndex: 10 },
  responseTime: { color: colors.secondary, flexShrink: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  avatar: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  contextPill: {
    alignSelf: 'flex-start',
    minHeight: 32,
    borderRadius: 999,
    backgroundColor: colors.soft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    marginTop: 12,
    marginBottom: 12,
  },
  contextText: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 14, fontWeight: '900', lineHeight: 20 },
  relatedOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ece4f5',
    backgroundColor: colors.secondarySoft,
    padding: 12,
    marginBottom: 12,
  },
  relatedOrderPressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
  relatedOrderIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  relatedOrderCopy: { flex: 1, gap: 3 },
  relatedOrderTitle: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  relatedOrderText: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 22, fontWeight: '800' },
  relatedOrderMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5 },
  relatedOrderChip: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.white,
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: 13,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  relatedOrderCta: {
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
  },
  relatedOrderCtaText: { color: colors.white, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  ticketCard: { borderRadius: 16, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: '#f5d3ca', padding: 12, gap: 4 },
  ticketTitle: { color: colors.primary, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  ticketMeta: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 22, fontWeight: '800' },
  offerPanel: { gap: 10, marginBottom: 12 },
  offerPanelTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  offerCard: { gap: 12, shadowOpacity: 0 },
  offerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  offerIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  offerCopy: { flex: 1 },
  offerService: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900', letterSpacing: 0.6 },
  offerTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  offerDescription: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 21, marginTop: 3 },
  offerStatus: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  offerLines: { gap: 8 },
  offerLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  offerLabel: { flex: 1, color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13 },
  offerValue: { maxWidth: '60%', color: colors.text, fontFamily: fonts.semiBold, fontSize: 13, fontWeight: '800', textAlign: 'right' },
  offerTotalLine: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 9, marginTop: 2 },
  offerTotalLabel: { flex: 1, color: colors.text, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  offerTotalValue: { color: colors.primary, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  offerExpiry: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  offerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  offerActionButton: { flex: 1, minWidth: 140 },
  internalSplit: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 21, fontWeight: '700' },
  messageScroll: { flex: 1, minHeight: 0 },
  messages: { flexGrow: 1, gap: 10, justifyContent: 'flex-end', paddingTop: 15, paddingBottom: 12 },
  messagesKeyboardOpen: { paddingBottom: 18 },
  offerActionBar: { borderTopColor: colors.border, borderTopWidth: 1, paddingVertical: 9 },
  composerWrap: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, backgroundColor: colors.white },
  keyboardToolbar: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
  hideKeyboardButton: { minHeight: 32, borderRadius: 999, backgroundColor: colors.secondarySoft, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12 },
  hideKeyboardPressed: { opacity: 0.78 },
  hideKeyboardText: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  composer: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  mediaActions: { flexDirection: 'row', gap: 5 },
  mediaButton: { width: 32, height: 34, borderRadius: 13, backgroundColor: colors.secondarySoft, alignItems: 'center', justifyContent: 'center' },
  mediaPressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
  input: { flex: 1, maxHeight: 104, color: colors.text, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, paddingVertical: 9 },
  sendButton: { width: 38, height: 38, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
