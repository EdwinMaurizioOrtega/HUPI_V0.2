import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import type { Href } from 'expo-router';
import { useLocalSearchParams,
  useRouter } from 'expo-router';
import { useEffect,
  useMemo } from 'react';
import { StyleSheet,
} from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DisabledServiceNotice } from '@/components/DisabledServiceNotice';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { isBookableServiceEnabled, isServiceEnabled } from '@/constants/features';
import {
  calculateMockPayment,
  formatMockCurrency,
  getMockProviderValue,
  type MockPlanId,
} from '@/constants/mockCheckout';
import { getMockBookingById } from '@/constants/mockBookings';
import { getMockProviderServicePrice, mockProviders } from '@/constants/mockProviders';
import { isBookableServiceId, services, type ServiceId } from '@/constants/services';
import { fonts } from '@/constants/typography';
import { useRemoteQuote } from '@/hooks/useRemoteQuote';
import { playHupiSuccessSound } from '@/utils/hupiSound';
import { Text } from '@/i18n/components';

const messages = [
  {
    icon: 'mail-outline' as const,
    title: 'Confirmación enviada',
    text: 'Recibirás la confirmación por correo y notificación en la app.',
  },
  {
    icon: 'chatbubbles-outline' as const,
    title: 'Chat con el proveedor',
    text: 'El chat con el proveedor ya está disponible para coordinar el servicio.',
  },
  {
    icon: 'alarm-outline' as const,
    title: 'Recordatorios Hupi',
    text: 'Te recordaremos 1 día antes, 8 horas antes y minutos antes del servicio.',
  },
];

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const { providerId, planId, donation: donationParam, serviceId: serviceIdParam, bookingId } = useLocalSearchParams<{
    providerId?: string;
    planId?: string;
    donation?: string;
    serviceId?: string;
    bookingId?: string;
  }>();
  const serviceId = isBookableServiceId(serviceIdParam) ? serviceIdParam : 'walk';
  const requestedDisabledService = Boolean(
    serviceIdParam
    && services.some((serviceItem) => serviceItem.id === serviceIdParam)
    && !isServiceEnabled(serviceIdParam as ServiceId),
  );
  const provider = useMemo(
    () => mockProviders.find((item) => item.id === providerId) ?? mockProviders[0],
    [providerId],
  );
  const activePlan: MockPlanId = planId === 'frequent' ? 'frequent' : 'basic';
  const providerValue = getMockProviderValue(getMockProviderServicePrice(provider, serviceId), activePlan);
  useRemoteQuote(providerValue);
  const payment = calculateMockPayment(providerValue);
  const booking = getMockBookingById(bookingId);
  const parsedDonation = Number(donationParam);
  const donation = Math.max(0, Number.isFinite(parsedDonation) ? parsedDonation : 0);
  const finalTotal = payment.total + donation;

  if (requestedDisabledService || !isBookableServiceEnabled(serviceId)) {
    return (
      <ScreenContainer>
        <DisabledServiceNotice />
      </ScreenContainer>
    );
  }

  useEffect(() => {
    playHupiSuccessSound();
  }, []);

  const summary = [
    { label: 'Servicio', value: booking.service },
    { label: 'Proveedor', value: provider.name },
    { label: 'Mascota', value: booking.pet },
    { label: 'Fecha', value: booking.date },
    { label: 'Hora', value: booking.time },
    { label: 'Duración', value: booking.duration },
    ...(donation > 0
      ? [{ label: 'Donación Fundación Hupi', value: formatMockCurrency(donation) }]
      : []),
  ];

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.successArea}>
        <View style={styles.successHalo}>
          <View style={styles.successIcon}>
            <Ionicons color={colors.white} name="checkmark" size={42} />
          </View>
        </View>
        <Text style={styles.eyebrow}>__hupi_i18n:common.everythingReady</Text>
        <Text style={styles.title}>__hupi_i18n:common.confirmedReservation</Text>
        <Text style={styles.subtitle}>__hupi_i18n:bookings.booking-confirmation.correctlyScheduledService</Text>
        <View style={styles.mockBadge}><Text style={styles.mockBadgeText}>__hupi_i18n:common.testMode</Text></View>
      </View>

      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.summaryEyebrow}>__hupi_i18n:common.summary2</Text>
            <Text style={styles.summaryTitle}>__hupi_i18n:bookings.booking-confirmation.yourNextAdventure</Text>
          </View>
          <Text style={styles.bookingCode}>{booking.id.replace('booking-', 'HUPI-').toUpperCase()}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.rows}>
          {summary.map((item) => (
            <View key={item.label} style={styles.row}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value}>{item.value}</Text>
            </View>
          ))}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>__hupi_i18n:bookings.booking-confirmation.totalInTestMode</Text>
            <Text style={styles.totalValue}>{formatMockCurrency(finalTotal)}</Text>
          </View>
        </View>
      </Card>

      <View style={styles.messages}>
        {messages.map((message) => (
          <View key={message.title} style={styles.message}>
            <View style={styles.messageIcon}>
              <Ionicons color={colors.secondary} name={message.icon} size={21} />
            </View>
            <View style={styles.messageCopy}>
              <Text style={styles.messageTitle}>{message.title}</Text>
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          icon="calendar-outline"
          onPress={() => router.replace('/bookings' as Href)}
          title="__hupi_i18n:common.seeMyReservations"
        />
        <Button
          icon="home-outline"
          onPress={() => router.replace('/home' as Href)}
          title="__hupi_i18n:common.returnToHome"
          variant="outline"
        />
      </View>
      <Text style={styles.mockNotice}>

        __hupi_i18n:bookings.booking-confirmation.testEnvironmentNoActualEmailsNotificationsOrChargesWere
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 20 },
  successArea: { alignItems: 'center' },
  successHalo: { width: 108, height: 108, borderRadius: 54, backgroundColor: '#e7f5ef', alignItems: 'center', justifyContent: 'center' },
  successIcon: { width: 72, height: 72, borderRadius: 25, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-4deg' }] },
  eyebrow: { color: colors.success, fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 18, letterSpacing: 1.4, marginTop: 20 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 30, lineHeight: 40, marginTop: 7 },
  subtitle: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: 6 },
  mockBadge: { borderRadius: 9, backgroundColor: colors.primarySoft, paddingHorizontal: 9, paddingVertical: 5, marginTop: 12 },
  mockBadgeText: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.9 },
  summaryCard: { marginTop: 26, padding: 17, shadowOpacity: 0.06 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center' },
  summaryEyebrow: { color: colors.secondary, fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 18, letterSpacing: 1 },
  summaryTitle: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 22, marginTop: 4 },
  bookingCode: { marginLeft: 'auto', color: colors.primary, fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 18 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  rows: { gap: 11 },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { flex: 1, color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 19 },
  value: { maxWidth: '65%', color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, textAlign: 'right' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 13, marginTop: 3 },
  totalLabel: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '900' },
  totalValue: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  messages: { gap: 10, marginTop: 18 },
  message: { borderRadius: 17, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13 },
  messageIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.secondarySoft, alignItems: 'center', justifyContent: 'center' },
  messageCopy: { flex: 1 },
  messageTitle: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 19 },
  messageText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 4 },
  actions: { gap: 10, marginTop: 20 },
  mockNotice: { color: colors.textMuted, fontFamily: fonts.light, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 13 },
});
