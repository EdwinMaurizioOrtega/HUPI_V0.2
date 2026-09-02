import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useFocusEffect,
  useLocalSearchParams,
  useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { BookingTimeline } from '@/components/bookings/BookingTimeline';
import { CancellationPolicyCard } from '@/components/bookings/CancellationPolicyCard';
import { ReviewPromptCard } from '@/components/bookings/ReviewPromptCard';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HupiPagesLogo } from '@/components/HupiPagesLogo';
import { HupiSuccessModal } from '@/components/HupiSuccessModal';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { cancelMockBooking, formatBookingCurrency, formatWalkElapsedTime, getMockBookingById, getWalkElapsedSeconds, type BookingService } from '@/constants/mockBookings';
import { getOrCreateServiceChatForBooking } from '@/constants/mockData';
import { fonts } from '@/constants/typography';
import { Text } from '@/i18n/components';
import type { BookingCancellationQuote } from '@/domain/bookingCancellationPolicy';
import type { RefundChoice } from '@/components/bookings/CancellationPolicyCard';
import { useTranslation } from '../../../node_modules/react-i18next';

const serviceIcons: Record<BookingService, keyof typeof Ionicons.glyphMap> = {
  Paseo: 'walk-outline',
  Niñera: 'home-outline',
  Hospedaje: 'moon-outline',
  Guardería: 'sunny-outline',
};

export default function BookingDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const [bookingVersion, setBookingVersion] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [cancelledFeedback, setCancelledFeedback] = useState<{ refund: number; method: RefundChoice } | null>(null);
  const booking = useMemo(
    () => getMockBookingById(bookingId),
    [bookingId, bookingVersion],
  );
  const serviceValue = booking.serviceValue ?? Math.round((booking.totalPaid / 1.15 + Number.EPSILON) * 100) / 100;
  const clientFee = booking.clientFee ?? Math.round((serviceValue * 0.15 + Number.EPSILON) * 100) / 100;

  useFocusEffect(useCallback(() => setBookingVersion((version) => version + 1), []));
  useEffect(() => {
    if (booking.status !== 'En curso') return undefined;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [booking.status]);

  const summary = [
    { icon: 'paw-outline' as const, label: 'Servicio', value: booking.service },
    { icon: 'person-outline' as const, label: 'Proveedor', value: booking.provider },
    { icon: 'heart-outline' as const, label: 'Mascota', value: booking.pet },
    { icon: 'calendar-outline' as const, label: 'Fecha', value: booking.date },
    { icon: 'time-outline' as const, label: 'Hora', value: booking.time },
    { icon: 'hourglass-outline' as const, label: 'Duración', value: booking.duration },
    { icon: 'location-outline' as const, label: 'Ubicación', value: booking.location },
  ];

  const isCompleted = booking.status === 'Completada' || booking.status === 'Finalizada';
  const isCancelled = booking.status === 'Cancelada';
  const canChatWithProvider = booking.chatAvailable && ['Confirmada', 'Programada', 'Próxima', 'En curso'].includes(booking.status);
  const openProviderChat = () => {
    const serviceChat = getOrCreateServiceChatForBooking(booking);
    router.push(`/chat?chatId=${serviceChat.id}&viewer=client` as Href);
  };
  const openHupiSupport = () => {
    const bookingCode = booking.id.toUpperCase();
    const orderQuery = booking.relatedOrderNumber
      ? `&orderNumber=${encodeURIComponent(booking.relatedOrderNumber)}`
      : '';
    const context = booking.relatedOrderNumber
      ? `Necesito ayuda con la reserva ${bookingCode}, relacionada con el pedido ${booking.relatedOrderNumber}.`
      : `Necesito ayuda con la reserva ${bookingCode}.`;

    router.push(
      `/support?mode=support&bookingId=${encodeURIComponent(booking.id)}${orderQuery}&context=${encodeURIComponent(context)}` as Href,
    );
  };
  const confirmCancellation = (method: RefundChoice, quote: BookingCancellationQuote) => {
    cancelMockBooking(booking.id, method, quote);
    setCancelledFeedback({ refund: quote.refundAmount, method });
    setBookingVersion((version) => version + 1);
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.topbar}>
        <Pressable accessibilityLabel="__hupi_i18n:common.back" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={colors.text} name="arrow-back" size={22} />
        </Pressable>
        <HupiPagesLogo height={42} width={132} />
      </View>

      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>__hupi_i18n:common.reservation {booking.id.toUpperCase()}</Text>
          <Text style={styles.title}>__hupi_i18n:bookings.booking-detail.reservationDetails</Text>
          <Text style={styles.subtitle}>__hupi_i18n:bookings.booking-detail.informationAndMonitoringOfYourWalk</Text>
        </View>
        <BookingStatusBadge status={booking.status} />
      </View>

      {booking.status === 'En curso' ? (
        <Card style={styles.liveCard} tone="coral">
          <View style={styles.liveHeader}><Ionicons color={colors.primary} name="walk" size={24} /><Text style={styles.liveTitle}>{t('walkOperation.clientInProgress')}</Text></View>
          <Text accessibilityRole="timer" style={styles.liveTimer}>{formatWalkElapsedTime(getWalkElapsedSeconds(booking.startedAt, now))}</Text>
          <Text style={styles.liveMeta}>{t('walkOperation.actualStart')}: {booking.startedAt ? new Date(booking.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</Text>
        </Card>
      ) : null}

      {isCompleted && booking.startedAt ? (
        <Card style={styles.completedOperationCard} tone="soft">
          <Text style={styles.completedOperationTitle}>{t('walkOperation.clientCompleted')}</Text>
          <Text style={styles.completedOperationText}>{t('walkOperation.actualStart')}: {new Date(booking.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          <Text style={styles.completedOperationText}>{t('walkOperation.actualEnd')}: {booking.completedAt ? new Date(booking.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</Text>
          <Text style={styles.completedOperationText}>{t('walkOperation.actualDuration')}: {t('walkOperation.minutes', { count: booking.actualDurationMinutes ?? 0 })}</Text>
        </Card>
      ) : null}

      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View style={styles.serviceIcon}><Ionicons color={colors.primary} name={serviceIcons[booking.service]} size={24} /></View>
          <View style={styles.summaryHeaderCopy}>
            <Text style={styles.summaryEyebrow}>__hupi_i18n:bookings.booking-detail.serviceSummary</Text>
            <Text style={styles.summaryTitle}>{booking.service}  __hupi_i18n:common.for {booking.pet}</Text>
          </View>
          <View style={styles.totalCopy}>
            <Text style={styles.totalLabel}>__hupi_i18n:common.totalPaid2</Text>
            <Text style={styles.total}>{formatBookingCurrency(booking.totalPaid)}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.rows}>
          {summary.map((item) => (
            <View key={item.label} style={styles.row}>
              <Ionicons color={colors.secondary} name={item.icon} size={16} />
              <Text style={styles.label}>{item.label}</Text>
              <Text numberOfLines={2} style={styles.value}>{item.value}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.paymentCard}>
        <Text style={styles.paymentTitle}>__hupi_i18n:bookings.booking-detail.priceSummary</Text>
        <View style={styles.paymentLine}>
          <Text style={styles.paymentLabel}>__hupi_i18n:bookings.booking-detail.servicePrice</Text>
          <Text style={styles.paymentValue}>{formatBookingCurrency(serviceValue)}</Text>
        </View>
        <View style={styles.paymentLine}>
          <Text style={styles.paymentLabel}>__hupi_i18n:bookings.booking-detail.platformManagementSurcharge15</Text>
          <Text style={styles.paymentValue}>{formatBookingCurrency(clientFee)}</Text>
        </View>
        <View style={[styles.paymentLine, styles.paymentTotalLine]}>
          <Text style={styles.paymentTotalLabel}>__hupi_i18n:common.total</Text>
          <Text style={styles.paymentTotalValue}>{formatBookingCurrency(booking.totalPaid)}</Text>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>__hupi_i18n:common.tracking</Text>
      <Card style={styles.timelineCard}>
        <BookingTimeline cancelled={isCancelled} currentStep={booking.timelineStep} />
      </Card>

      {canChatWithProvider ? (
        <Card style={styles.chatCard} tone="purple">
          <View style={styles.chatIcon}><Ionicons color={colors.white} name="chatbubbles" size={23} /></View>
          <View style={styles.chatCopy}>
            <Text style={styles.chatTitle}>__hupi_i18n:common.coordinateWith {booking.provider}</Text>
            <Text style={styles.chatText}>__hupi_i18n:bookings.booking-detail.chatWithTheProviderIsAvailableToCoordinateService</Text>
          </View>
          <Pressable
            onPress={openProviderChat}
            style={styles.chatButton}
          >
            <Text style={styles.chatButtonText}>__hupi_i18n:bookings.booking-detail.chatWithSupplier</Text>
          </Pressable>
        </Card>
      ) : null}

      {!isCompleted && !isCancelled ? (
        <Card style={styles.reminderCard} tone="soft">
          <View style={styles.reminderIcon}><Ionicons color={colors.primary} name="alarm-outline" size={22} /></View>
          <View style={styles.reminderCopy}>
            <Text style={styles.reminderTitle}>__hupi_i18n:bookings.booking-detail.hupiReminders</Text>
            <Text style={styles.reminderText}>__hupi_i18n:bookings.booking-confirmation.weWillRemindYou1DayBefore8Hours</Text>
          </View>
        </Card>
      ) : null}

      {booking.canCancel ? (
        <CancellationPolicyCard
          bookingStartsAt={booking.startsAt}
          onConfirmCancellation={confirmCancellation}
          originalAmount={booking.totalPaid}
        />
      ) : null}

      <Pressable
        accessibilityHint={`Abrir soporte con la reserva ${booking.id.toUpperCase()}`}
        accessibilityRole="button"
        onPress={openHupiSupport}
        style={({ pressed }) => [styles.supportButton, pressed && styles.supportButtonPressed]}
      >
        <Card style={styles.supportCard} tone="soft">
          <View style={styles.supportIcon}><Ionicons color={colors.secondary} name="headset-outline" size={20} /></View>
          <View style={styles.supportCopy}>
            <Text style={styles.supportTitle}>__hupi_i18n:common.hupiSupport</Text>
            <Text style={styles.supportText}>__hupi_i18n:bookings.booking-detail.forIncidentsSupplierCancellationOrOutstandingBalanceDueTo</Text>
            <Text style={styles.supportTrace}>{t('walkOperation.bookingReference', { value: booking.id.toUpperCase() })}</Text>
          </View>
          <Ionicons color={colors.secondary} name="chevron-forward" size={20} />
        </Card>
      </Pressable>

      {isCompleted ? (
        <Card style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>__hupi_i18n:bookings.booking-detail.shareYourExperience</Text>
          <Text style={styles.reviewText}>__hupi_i18n:bookings.booking-detail.yourOpinionHelpsStrengthenHupiSReputation</Text>
          <ReviewPromptCard bookingId={booking.id} />
        </Card>
      ) : null}

      {isCancelled ? (
        <Card style={styles.cancelledCard}>
          <Ionicons color={colors.danger} name="close-circle-outline" size={23} />
          <View style={styles.cancelledCopy}>
            <Text style={styles.cancelledTitle}>{booking.cancelledBy === 'provider' ? t('walkOperation.cancelledByProvider') : t('walkOperation.reservationCancelled')}</Text>
            <Text style={styles.cancelledText}>{booking.cancelledBy === 'provider' ? t('walkOperation.clientNoCancellationCharge') : t('walkOperation.clientCancellationManagement')}</Text>
          </View>
        </Card>
      ) : null}

      <Button icon="arrow-back" onPress={() => router.back()} title="__hupi_i18n:bookings.booking-detail.returnToMyReservations" variant="outline" />
      <HupiSuccessModal
        description={cancelledFeedback
          ? t('bookingCancellation.successDescription', {
            amount: formatBookingCurrency(cancelledFeedback.refund),
            method: t(`bookingCancellation.methods.${cancelledFeedback.method}`),
          })
          : ''}
        onClose={() => setCancelledFeedback(null)}
        title={t('bookingCancellation.successTitle')}
        visible={Boolean(cancelledFeedback)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, gap: 16 },
  topbar: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center', left: 0, position: 'absolute', zIndex: 1 },
  heading: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 8 },
  headingCopy: { flex: 1 },
  liveCard: { alignItems: 'center', gap: 6, shadowOpacity: 0 },
  liveHeader: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  liveTitle: { color: colors.primary, fontSize: 17, fontWeight: '900' },
  liveTimer: { color: colors.text, fontSize: 34, fontVariant: ['tabular-nums'], fontWeight: '900', letterSpacing: 1, lineHeight: 42 },
  liveMeta: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  completedOperationCard: { gap: 5, shadowOpacity: 0 },
  completedOperationTitle: { color: colors.success, fontSize: 16, fontWeight: '900' },
  completedOperationText: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  eyebrow: { color: colors.primary, fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 19, letterSpacing: 1 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 28, lineHeight: 38, marginTop: 6 },
  subtitle: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: 5 },
  summaryCard: { padding: 16, shadowOpacity: 0.06 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  serviceIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  summaryHeaderCopy: { flex: 1 },
  summaryEyebrow: { color: colors.primary, fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 18, letterSpacing: 0.8 },
  summaryTitle: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 22, marginTop: 4 },
  totalCopy: { alignItems: 'flex-end' },
  totalLabel: { color: colors.textMuted, fontFamily: fonts.light, fontSize: 12, lineHeight: 18 },
  total: { color: colors.primary, fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 23, marginTop: 3 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  rows: { gap: 11 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  label: { width: 78, color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 21 },
  value: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, textAlign: 'right' },
  paymentCard: { padding: 16, shadowOpacity: 0.04 },
  paymentTitle: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 21, marginBottom: 12 },
  paymentLine: { flexDirection: 'row', alignItems: 'center', marginTop: 9 },
  paymentLabel: { flex: 1, color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  paymentValue: { color: colors.text, fontFamily: fonts.medium, fontSize: 13, lineHeight: 19 },
  paymentTotalLine: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 12 },
  paymentTotalLabel: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '900' },
  paymentTotalValue: { color: colors.primary, fontSize: 16, fontWeight: '900' },
  sectionTitle: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 18, lineHeight: 25, marginTop: 4, marginBottom: -4 },
  timelineCard: { padding: 16, paddingBottom: 2, shadowOpacity: 0.04 },
  chatCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, shadowOpacity: 0 },
  chatIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  chatCopy: { flex: 1 },
  chatTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  chatText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 21, marginTop: 3 },
  chatButton: { minHeight: 34, borderRadius: 11, backgroundColor: colors.secondary, justifyContent: 'center', paddingHorizontal: 10 },
  chatButtonText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  reminderCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, shadowOpacity: 0 },
  reminderIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  reminderCopy: { flex: 1 },
  reminderTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  reminderText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 21, marginTop: 3 },
  supportButton: { borderRadius: 18 },
  supportButtonPressed: { opacity: 0.78, transform: [{ scale: 0.995 }] },
  supportCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, shadowOpacity: 0 },
  supportIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  supportCopy: { flex: 1 },
  supportTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  supportText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 21, marginTop: 3 },
  supportTrace: { color: colors.secondary, fontFamily: fonts.light, fontSize: 12, lineHeight: 18, marginTop: 5 },
  reviewCard: { padding: 15, shadowOpacity: 0.04 },
  reviewTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  reviewText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 21, marginTop: 4 },
  cancelledCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#fff5f5', borderColor: '#f4d6d6', shadowOpacity: 0 },
  cancelledCopy: { flex: 1 },
  cancelledTitle: { color: colors.danger, fontSize: 15, fontWeight: '900' },
  cancelledText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 21, marginTop: 3 },
});
