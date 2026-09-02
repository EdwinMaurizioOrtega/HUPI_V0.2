import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { isDevelopmentBundle } from '@/config/environment';
import { colors } from '@/constants/colors';
import { getQaMockWalk, setMockQaWalkStatus } from '@/constants/mockBookings';
import type { QaWalkStatus } from '@/domain/qaWalk';
import { Text } from '@/i18n/components';
import { ThemedView as View } from '@/theme/ThemedView';

export default function QaWalkScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [, setVersion] = useState(0);

  if (!isDevelopmentBundle()) return <Redirect href="/home" />;
  const booking = getQaMockWalk();
  if (!booking) return <Redirect href="/home" />;

  const status: QaWalkStatus = booking.status === 'En curso'
    ? 'in_progress'
    : booking.status === 'Completada' || booking.status === 'Finalizada'
      ? 'completed'
      : booking.status === 'Cancelada'
        ? 'cancelled'
        : 'scheduled';
  const applyStatus = (nextStatus: QaWalkStatus) => {
    setMockQaWalkStatus(nextStatus);
    setVersion((current) => current + 1);
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <PageHeader eyebrow={t('qaTools.localOnly')} onBack={() => router.back()} subtitle={t('qaTools.walkSubtitle')} title={t('qaTools.walkTitle')} />
      <Card style={styles.statusCard} tone="purple">
        <Text style={styles.statusLabel}>{t('qaTools.currentWalkStatus')}</Text>
        <Text style={styles.statusValue}>{t(`qaTools.walkStates.${status}`)}</Text>
        <Text style={styles.bookingId}>{booking.id}</Text>
      </Card>
      <Card style={styles.detailsCard}>
        <Detail label={t('qaTools.client')} value={booking.client} />
        <Detail label={t('qaTools.pet')} value={booking.pet} />
        <Detail label={t('qaTools.provider')} value={booking.provider} />
        <Detail label={t('walks.date')} value={booking.date} />
        <Detail label={t('walks.time')} value={booking.time} />
        <Detail label={t('qaTools.startedAt')} value={booking.startedAt ?? '—'} />
        <Detail label={t('qaTools.completedAt')} value={booking.completedAt ?? '—'} />
      </Card>
      <View style={styles.actions}>
        <Button icon="refresh-outline" onPress={() => applyStatus('scheduled')} title={t('qaTools.resetScheduled')} variant="outline" />
        <Button icon="play-outline" onPress={() => applyStatus('in_progress')} title={t('qaTools.simulateInProgress')} />
        <Button icon="checkmark-circle-outline" onPress={() => applyStatus('completed')} title={t('qaTools.simulateCompleted')} variant="secondary" />
        <Button icon="close-circle-outline" onPress={() => applyStatus('cancelled')} title={t('qaTools.simulateProviderCancelled')} variant="outline" />
      </View>
    </ScreenContainer>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detail}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 42, paddingTop: 8 },
  statusCard: { alignItems: 'center', gap: 5, shadowOpacity: 0 },
  statusLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  statusValue: { color: colors.primary, fontSize: 25, fontWeight: '900', lineHeight: 32 },
  bookingId: { color: colors.secondary, fontSize: 14, fontWeight: '900' },
  detailsCard: { gap: 2, shadowOpacity: 0.03 },
  detail: { borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: 10, paddingVertical: 10 },
  detailLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '800', width: 100 },
  detailValue: { color: colors.text, flex: 1, fontSize: 12, textAlign: 'right' },
  actions: { gap: 9 },
});
