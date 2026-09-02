import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { type Href, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HupiConfirmationModal } from '@/components/HupiConfirmationModal';
import { ProviderPageHeader } from '@/components/provider/ProviderPageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import {
  canCancelProviderWalk,
  canStartProviderWalk,
  cancelMockProviderWalk,
  completeMockProviderWalk,
  formatBookingCurrency,
  formatWalkElapsedTime,
  getMockBookingById,
  getProviderDelayMinutes,
  getWalkElapsedSeconds,
  startMockProviderWalk,
} from '@/constants/mockBookings';
import { colors } from '@/constants/colors';
import { getOrCreateServiceChatForBooking } from '@/constants/mockData';
import { Text } from '@/i18n/components';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { ThemedView as View } from '@/theme/ThemedView';

type ConfirmationAction = 'start' | 'complete' | 'cancel' | null;

export default function ProviderWalkBookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const [version, setVersion] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [confirmation, setConfirmation] = useState<ConfirmationAction>(null);
  const booking = useMemo(() => getMockBookingById(bookingId), [bookingId, version]);

  useFocusEffect(useCallback(() => setVersion((current) => current + 1), []));
  useEffect(() => {
    if (booking.status !== 'En curso') return undefined;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [booking.status]);

  const delayMinutes = getProviderDelayMinutes(booking);
  const elapsed = formatWalkElapsedTime(getWalkElapsedSeconds(booking.startedAt, now));
  const formatTimestamp = (value?: string) => value
    ? new Intl.DateTimeFormat(i18n.language.startsWith('en') ? 'en-US' : 'es-EC', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
    : '—';
  const executeAction = () => {
    if (confirmation === 'start') startMockProviderWalk(booking.id);
    if (confirmation === 'complete') completeMockProviderWalk(booking.id);
    if (confirmation === 'cancel') cancelMockProviderWalk(booking.id);
    setConfirmation(null);
    setVersion((current) => current + 1);
  };
  const modalCopy = confirmation ? {
    start: { title: t('walkOperation.startConfirmTitle'), message: t('walkOperation.startConfirmMessage'), confirm: t('walkOperation.start') },
    complete: { title: t('walkOperation.completeConfirmTitle'), message: t('walkOperation.completeConfirmMessage'), confirm: t('walkOperation.complete') },
    cancel: { title: t('walkOperation.cancelConfirmTitle'), message: t('walkOperation.cancelWarning'), confirm: t('walkOperation.cancel') },
  }[confirmation] : null;

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <ProviderPageHeader onBack={() => router.back()} subtitle={booking.id.toUpperCase()} title={t('walkOperation.detailTitle')} />
      <Card style={styles.statusCard} tone={booking.status === 'En curso' ? 'coral' : 'purple'}>
        <View style={styles.statusHeader}><OperationalStatusPill status={booking.status} /><Text style={styles.amount}>{formatBookingCurrency(booking.providerPayout ?? 0)}</Text></View>
        {booking.status === 'En curso' ? <><Text style={styles.runningTitle}>{t('walkOperation.inProgress')}</Text><Text accessibilityRole="timer" style={styles.timer}>{elapsed}</Text></> : null}
      </Card>

      <Card style={styles.summaryCard}>
        <DetailRow icon="person-outline" label={t('walkOperation.client')} value={booking.client} />
        <DetailRow icon="paw-outline" label={t('walkOperation.pet')} value={booking.pet} />
        <DetailRow icon="calendar-outline" label={t('walkOperation.date')} value={`${booking.date} · ${booking.time}`} />
        <DetailRow icon="hourglass-outline" label={t('walkOperation.plannedDuration')} value={booking.duration} />
        <DetailRow icon="albums-outline" label={t('walkOperation.plan')} value={booking.offerTitle || booking.service} />
        <DetailRow icon="location-outline" label={t('walkOperation.meetingPoint')} value={booking.location} />
        {booking.meetingPreferences?.instructions ? <DetailRow icon="document-text-outline" label={t('walkOperation.instructions')} value={booking.meetingPreferences.instructions} /> : null}
      </Card>

      {(booking.startedAt || booking.completedAt) ? (
        <Card style={styles.timingCard} tone="soft">
          <Text style={styles.cardTitle}>{t('walkOperation.operationalTiming')}</Text>
          <DetailRow icon="alarm-outline" label={t('walkOperation.scheduledTime')} value={formatTimestamp(booking.scheduledStartAt)} />
          <DetailRow icon="play-circle-outline" label={t('walkOperation.actualStart')} value={formatTimestamp(booking.startedAt)} />
          {delayMinutes !== undefined ? <DetailRow icon="speedometer-outline" label={t('walkOperation.delay')} value={t('walkOperation.minutes', { count: delayMinutes })} /> : null}
          {booking.completedAt ? <DetailRow icon="stop-circle-outline" label={t('walkOperation.actualEnd')} value={formatTimestamp(booking.completedAt)} /> : null}
          {booking.actualDurationMinutes !== undefined ? <DetailRow icon="timer-outline" label={t('walkOperation.actualDuration')} value={t('walkOperation.minutes', { count: booking.actualDurationMinutes })} /> : null}
        </Card>
      ) : null}

      {booking.cancelledBy === 'provider' ? (
        <Card style={styles.cancelledCard} tone="coral">
          <Ionicons color={colors.danger} name="alert-circle-outline" size={22} />
          <View style={styles.cancelledCopy}><Text style={styles.cancelledTitle}>{t('walkOperation.cancelledByProvider')}</Text><Text style={styles.cancelledText}>{t('walkOperation.zeroPayout')}</Text></View>
        </Card>
      ) : null}

      <View style={styles.actions}>
        {canStartProviderWalk(booking) ? <Button icon="play-outline" onPress={() => setConfirmation('start')} title={t('walkOperation.start')} /> : null}
        {booking.status === 'En curso' ? <Button icon="stop-outline" onPress={() => setConfirmation('complete')} title={t('walkOperation.complete')} /> : null}
        {canCancelProviderWalk(booking) ? <Button icon="close-circle-outline" onPress={() => setConfirmation('cancel')} title={t('walkOperation.cancel')} variant="outline" /> : null}
        {booking.chatAvailable ? <Button icon="chatbubble-outline" onPress={() => {
          const chat = getOrCreateServiceChatForBooking(booking);
          router.push(`/chat?chatId=${chat.id}&viewer=provider` as Href);
        }} title={t('walkOperation.openChat')} variant="secondary" /> : null}
      </View>

      {modalCopy ? <HupiConfirmationModal cancelLabel={t('common.back')} confirmLabel={modalCopy.confirm} message={modalCopy.message} onCancel={() => setConfirmation(null)} onConfirm={executeAction} title={modalCopy.title} visible /> : null}
    </ScreenContainer>
  );
}

function DetailRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return <View style={styles.row}><Ionicons color={colors.secondary} name={icon} size={18} /><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

function OperationalStatusPill({ status }: { status: string }) {
  const { t } = useTranslation();
  const key = status === 'En curso' ? 'inProgress' : status === 'Completada' || status === 'Finalizada' ? 'completed' : status === 'Cancelada' ? 'cancelled' : 'scheduled';
  return <View style={styles.statusPill}><View style={styles.statusDot} /><Text style={styles.statusPillText}>{t(`walkOperation.statuses.${key}`)}</Text></View>;
}

const styles = StyleSheet.create({
  content: { gap: 13, paddingBottom: 42, paddingTop: 8 },
  statusCard: { gap: 7, marginTop: 8, shadowOpacity: 0 },
  statusHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  amount: { color: colors.secondary, fontSize: 17, fontWeight: '900' },
  statusPill: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.primary, borderRadius: 999, borderWidth: 1, flexDirection: 'row', gap: 6, minHeight: 30, paddingHorizontal: 10 },
  statusDot: { backgroundColor: colors.primary, borderRadius: 4, height: 7, width: 7 },
  statusPillText: { color: colors.text, fontSize: 12, fontWeight: '900' },
  runningTitle: { color: colors.primary, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  timer: { color: colors.text, fontSize: 35, fontVariant: ['tabular-nums'], fontWeight: '900', letterSpacing: 1, lineHeight: 43, textAlign: 'center' },
  summaryCard: { gap: 1, shadowOpacity: 0.04 },
  timingCard: { gap: 1, shadowOpacity: 0 },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginBottom: 5 },
  row: { alignItems: 'flex-start', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: 8, minHeight: 46, paddingVertical: 11 },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '800', width: 105 },
  value: { color: colors.text, flex: 1, fontSize: 13, lineHeight: 19, textAlign: 'right' },
  cancelledCard: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, shadowOpacity: 0 },
  cancelledCopy: { flex: 1 },
  cancelledTitle: { color: colors.danger, fontSize: 15, fontWeight: '900' },
  cancelledText: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  actions: { gap: 9 },
});
