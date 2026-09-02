import type { ComponentProps } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from '../../../node_modules/react-i18next';
import type { TFunction } from 'i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ProviderPageHeader } from '@/components/provider/ProviderPageHeader';
import { ProviderWalkProfileEditor } from '@/components/provider/ProviderWalkProfileEditor';
import { WalkSpecialConditionsAccordion } from '@/components/provider/WalkSpecialConditionsAccordion';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import {
  formatBookingCurrency,
  getMockBookings,
  getMockProviderWalkMetrics,
  getMockProviderRequests,
  updateMockProviderRequestStatus,
  type MockProviderRequest,
} from '@/constants/mockBookings';
import {
  getMockServiceCoordinationRequests,
  mockProvider,
  type MockServiceCoordinationRequest,
} from '@/constants/mockData';
import { mockProviders, saveMockProviderServicePrice } from '@/constants/mockProviders';
import { getProviderWalkHourlyRate } from '@/domain/providerPricing';
import { useMockProviderPricing } from '@/hooks/useMockProviderPricing';
import { useLocalQa } from '@/hooks/useLocalQa';
import { Pressable, Text, TextInput } from '@/i18n/components';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { ThemedView as View } from '@/theme/ThemedView';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type WalkSection = 'overview' | 'rate' | 'appointments' | 'requests' | 'plans' | 'publicProfile' | 'availability' | 'finance' | 'configuration';

export default function ProviderWalksScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const pricingVersion = useMockProviderPricing();
  const qa = useLocalQa();
  const activeProvider = mockProviders.find((provider) => provider.id === mockProvider.providerId) ?? mockProviders[0];
  const [activeSection, setActiveSection] = useState<WalkSection>('overview');
  const [serviceRequests, setServiceRequests] = useState<MockProviderRequest[]>(() => getMockProviderRequests());
  const [coordinationRequests, setCoordinationRequests] = useState<MockServiceCoordinationRequest[]>(() => getMockServiceCoordinationRequests());
  const [walkRate, setWalkRate] = useState(() => getProviderWalkHourlyRate(activeProvider)?.toFixed(2) ?? '');
  const [rateError, setRateError] = useState<string | null>(null);
  const [rateNotice, setRateNotice] = useState<string | null>(null);
  const [bookingVersion, setBookingVersion] = useState(0);
  const appointments = getMockBookings().filter((booking) => booking.serviceId === 'walk' && booking.provider === activeProvider.name);
  const walkMetrics = getMockProviderWalkMetrics(activeProvider.name);
  const walkApprovalStatus = qa.walkStatus === 'pending_approval' || qa.walkStatus === 'approved'
    ? qa.walkStatus
    : activeProvider.walkProfile.status;

  useEffect(() => {
    setWalkRate(getProviderWalkHourlyRate(activeProvider)?.toFixed(2) ?? '');
  }, [activeProvider, pricingVersion]);

  useFocusEffect(useCallback(() => {
    setServiceRequests(getMockProviderRequests());
    setCoordinationRequests(getMockServiceCoordinationRequests());
    setBookingVersion((current) => current + 1);
  }, []));

  const saveRate = () => {
    const parsed = Number(walkRate.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setRateError(t('providerPricing.positiveError'));
      return;
    }
    saveMockProviderServicePrice(activeProvider.id, 'walk', parsed);
    setWalkRate(parsed.toFixed(2));
    setRateError(null);
    setRateNotice(t('providerPricing.savedDescription'));
  };

  const updateRequest = (requestId: string, status: MockProviderRequest['status']) => {
    setServiceRequests(updateMockProviderRequestStatus(requestId, status));
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <ProviderPageHeader
        onBack={() => activeSection === 'overview' ? router.back() : setActiveSection('overview')}
        subtitle={t('providerWalks.subtitle')}
        title={t('providerDashboard.walks')}
      />

      {activeSection === 'overview' ? (
        <>
          <Card style={styles.topRateCard} tone="coral">
            <View style={styles.topRateCopy}>
              <Text style={styles.topRateLabel}>{t('providerWalks.yourRate')}</Text>
              <Text style={styles.topRateValue}>{t('providerPricing.compactHourlyRate', { price: `$${walkRate || '—'}` })}</Text>
              <Text style={styles.approvalStatus}>{t('providerWalks.approvalStatus', { status: t(`providerProfile.statuses.${walkApprovalStatus}`) })}</Text>
            </View>
            <Button onPress={() => setActiveSection('rate')} style={styles.topRateButton} title={t('common.edit')} variant="outline" />
          </Card>
          <Card style={styles.hero} tone="purple">
            <View style={styles.heroIcon}><Ionicons color={colors.primary} name="walk-outline" size={27} /></View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>{t('providerWalks.management')}</Text>
              <Text style={styles.heroText}>{t('providerWalks.managementHint')}</Text>
            </View>
          </Card>
          <View style={styles.metrics}>
            <Metric label={t('providerWalks.upcoming')} value={String(appointments.filter((item) => item.section === 'upcoming').length)} />
            <Metric label={t('providerWalks.pendingRequests')} value={String(serviceRequests.filter((item) => item.status === 'Solicitud creada').length)} />
            <Metric label={t('providerWalks.walkIncome')} value={mockProvider.earnings} />
          </View>
          <View style={styles.menu}>
            <WalkMenuCard icon="calendar-outline" onPress={() => setActiveSection('appointments')} subtitle={t('providerWalks.appointmentsHint')} title={t('providerWalks.appointments')} />
            <WalkMenuCard icon="file-tray-full-outline" onPress={() => setActiveSection('requests')} subtitle={t('providerWalks.requestsHint')} title={t('providerWalks.requests')} />
            <WalkMenuCard icon="albums-outline" onPress={() => setActiveSection('plans')} subtitle={t('providerWalks.plansHint')} title={t('providerWalks.plans')} />
            <WalkMenuCard icon="person-circle-outline" onPress={() => setActiveSection('publicProfile')} subtitle={t('providerWalks.publicProfileHint')} title={t('providerWalks.publicProfile')} />
            <WalkMenuCard icon="time-outline" onPress={() => setActiveSection('availability')} subtitle={t('providerWalks.availabilityHint')} title={t('providerWalks.availability')} />
            <WalkMenuCard icon="stats-chart-outline" onPress={() => setActiveSection('finance')} subtitle={t('providerWalks.financeHint')} title={t('providerWalks.finance')} />
            <WalkMenuCard icon="options-outline" onPress={() => setActiveSection('configuration')} subtitle={t('providerWalks.configurationHint')} title={t('providerWalks.configuration')} />
          </View>
        </>
      ) : null}

      {activeSection === 'appointments' ? (
        <View style={styles.sectionStack}>
          <Text style={styles.sectionTitle}>{t('providerWalks.appointments')}</Text>
          {appointments.map((booking) => (
            <Pressable key={`${booking.id}-${bookingVersion}`} accessibilityRole="button" onPress={() => router.push(`/provider/walk-booking-detail?bookingId=${booking.id}` as Href)} style={({ pressed }) => pressed && styles.pressed}>
            <Card style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <View style={styles.detailIcon}><Ionicons color={colors.primary} name="calendar-outline" size={19} /></View>
                <View style={styles.detailCopy}>
                  <Text style={styles.detailTitle}>{booking.pet} · {getOperationalStatusLabel(booking.status, t)}</Text>
                  <Text style={styles.bookingId}>{booking.id.toUpperCase()}</Text>
                  <Text style={styles.detailMeta}>{booking.date} · {booking.time}</Text>
                  <Text style={styles.detailMeta}>{booking.duration} · {booking.location}</Text>
                  <Text style={styles.detailMeta}>{booking.client} · {formatBookingCurrency(booking.providerPayout ?? 0)}</Text>
                </View>
                <Ionicons color={colors.secondary} name="chevron-forward" size={19} />
              </View>
            </Card>
            </Pressable>
          ))}
        </View>
      ) : null}

      {activeSection === 'requests' ? (
        <View style={styles.sectionStack}>
          <Text style={styles.sectionTitle}>{t('providerWalks.requests')}</Text>
          {coordinationRequests.map((request) => (
            <Card key={request.id} style={styles.detailCard}>
              <Text style={styles.detailTitle}>{request.clientName} · {request.petName}</Text>
              <Text style={styles.detailMeta}>{request.tentativeDate} · {request.tentativeTime} · {request.zone}</Text>
              <Button onPress={() => router.push(`/chat?chatId=${request.chatId}&viewer=provider` as Href)} title={t('providerWalks.openChat')} variant="outline" />
            </Card>
          ))}
          {serviceRequests.map((request) => (
            <Card key={request.id} style={styles.detailCard}>
              <View style={styles.requestHeader}>
                <View style={styles.detailCopy}>
                  <Text style={styles.detailTitle}>{request.service} · {request.pet}</Text>
                  <Text style={styles.detailMeta}>{request.client} · {request.date} · {request.time}</Text>
                  <Text style={styles.detailMeta}>{request.location} · {request.status}</Text>
                </View>
                <Text style={styles.requestPrice}>{formatBookingCurrency(request.providerTotal)}</Text>
              </View>
              <View style={styles.requestActions}>
                <Button onPress={() => updateRequest(request.id, 'Aceptada')} style={styles.requestAction} title={t('providerWalks.accept')} />
                <Button onPress={() => updateRequest(request.id, 'Rechazada')} style={styles.requestAction} title={t('providerWalks.reject')} variant="outline" />
              </View>
            </Card>
          ))}
        </View>
      ) : null}

      {activeSection === 'plans' ? <ProviderWalkProfileEditor mode="plans" provider={activeProvider} /> : null}
      {activeSection === 'publicProfile' ? <ProviderWalkProfileEditor mode="publicProfile" provider={activeProvider} /> : null}

      {activeSection === 'rate' ? (
        <View style={styles.sectionStack}>
          <Text style={styles.sectionTitle}>{t('providerPricing.title')}</Text>
          <Card style={styles.rateCard} tone="purple">
            <Text style={styles.rateTitle}>{t('providerPricing.title')}</Text>
            <Text style={styles.rateHint}>{t('providerPricing.hint')}</Text>
            <View style={styles.rateInputRow}>
              <Text style={styles.currency}>$</Text>
              <TextInput
                accessibilityLabel={t('providerPricing.hourlyRate')}
                keyboardType="decimal-pad"
                onChangeText={(value) => {
                  if (/^\d*([.,]\d{0,2})?$/.test(value)) {
                    setWalkRate(value);
                    setRateError(null);
                    setRateNotice(null);
                  }
                }}
                placeholder="0,00"
                style={styles.rateInput}
                value={walkRate}
              />
              <Text style={styles.perHour}>{t('providerPricing.perHour')}</Text>
            </View>
            {rateError ? <Text style={styles.error}>{rateError}</Text> : null}
            {rateNotice ? <Text style={styles.success}>{rateNotice}</Text> : null}
            <Button icon="save-outline" onPress={saveRate} title={t('providerPricing.save')} />
          </Card>
        </View>
      ) : null}

      {activeSection === 'availability' ? <View style={styles.sectionStack}><Text style={styles.sectionTitle}>{t('providerWalks.availability')}</Text><Card style={styles.availabilityCard} tone="soft"><Ionicons color={colors.secondary} name="information-circle-outline" size={20} /><Text style={styles.availabilityText}>{t('providerWalks.availabilityHint')}</Text></Card></View> : null}

      {activeSection === 'finance' ? (
        <View style={styles.sectionStack}>
          <Text style={styles.sectionTitle}>{t('providerWalks.finance')}</Text>
          <View style={styles.metrics}>
            <Metric label={t('providerWalks.appointments')} value={String(walkMetrics.appointments)} />
            <Metric label={t('providerWalks.completedWalks')} value={String(walkMetrics.completed)} />
            <Metric label={t('providerWalks.cancellations')} value={String(walkMetrics.providerCancellations)} />
            <Metric label={t('providerWalks.cancellationRate')} value={`${Math.round(walkMetrics.providerCancellationRate * 100)}%`} />
            <Metric label={t('providerWalks.punctuality')} value={`${Math.round(walkMetrics.providerPunctualityRate * 100)}%`} />
            <Metric label={t('providerWalks.walkIncome')} value={formatBookingCurrency(walkMetrics.income)} />
          </View>
          <Text style={styles.metricNote}>{t('providerWalks.metricsHint')}</Text>
        </View>
      ) : null}

      {activeSection === 'configuration' ? <View style={styles.sectionStack}><Text style={styles.sectionTitle}>{t('providerWalks.configuration')}</Text><WalkSpecialConditionsAccordion /><Card style={styles.availabilityCard} tone="soft"><Ionicons color={colors.secondary} name="shield-checkmark-outline" size={20} /><Text style={styles.availabilityText}>{t('providerWalks.serviceApprovalHint')}</Text></Card></View> : null}
    </ScreenContainer>
  );
}

function WalkMenuCard({ icon, onPress, subtitle, title }: { icon: IoniconName; onPress: () => void; subtitle: string; title: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.menuCard, pressed && styles.pressed]}>
      <View style={styles.menuIcon}><Ionicons color={colors.primary} name={icon} size={21} /></View>
      <View style={styles.menuCopy}><Text style={styles.menuTitle}>{title}</Text><Text style={styles.menuSubtitle}>{subtitle}</Text></View>
      <Ionicons color={colors.secondary} name="chevron-forward" size={19} />
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card style={styles.metric} tone="soft"><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></Card>;
}

function getOperationalStatusLabel(status: string, translate: TFunction) {
  if (status === 'En curso') return translate('walkOperation.statuses.inProgress');
  if (status === 'Completada' || status === 'Finalizada') return translate('walkOperation.statuses.completed');
  if (status === 'Cancelada') return translate('walkOperation.statuses.cancelled');
  return translate('walkOperation.statuses.scheduled');
}

const styles = StyleSheet.create({
  content: { paddingBottom: 42, paddingTop: 8 },
  hero: { alignItems: 'center', flexDirection: 'row', gap: 12, marginTop: 22, shadowOpacity: 0 },
  topRateCard: { alignItems: 'center', flexDirection: 'row', gap: 12, marginTop: 18, shadowOpacity: 0 },
  topRateCopy: { flex: 1, minWidth: 0 },
  topRateLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  topRateValue: { color: colors.primary, fontSize: 23, fontWeight: '900', lineHeight: 30, marginTop: 3 },
  approvalStatus: { color: colors.secondary, fontSize: 12, fontWeight: '800', marginTop: 3 },
  topRateButton: { minHeight: 44 },
  heroIcon: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 18, height: 54, justifyContent: 'center', width: 54 },
  heroCopy: { flex: 1, minWidth: 0 },
  heroTitle: { color: colors.text, fontSize: 18, fontWeight: '900', lineHeight: 24 },
  heroText: { color: colors.textMuted, fontSize: 13, fontWeight: '700', lineHeight: 20, marginTop: 3 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 13 },
  metric: { flexBasis: 102, flexGrow: 1, gap: 3, shadowOpacity: 0 },
  metricValue: { color: colors.text, fontSize: 18, fontWeight: '900' },
  metricLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '800', lineHeight: 16 },
  menu: { gap: 10, marginTop: 18 },
  menuCard: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 11, minHeight: 76, padding: 13 },
  menuIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 15, height: 44, justifyContent: 'center', width: 44 },
  menuCopy: { flex: 1, minWidth: 0 },
  menuTitle: { color: colors.text, fontSize: 15, fontWeight: '900', lineHeight: 21 },
  menuSubtitle: { color: colors.textMuted, fontSize: 12, fontWeight: '700', lineHeight: 18, marginTop: 2 },
  pressed: { opacity: 0.82 },
  sectionStack: { gap: 11, marginTop: 22 },
  sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '900', lineHeight: 28 },
  detailCard: { gap: 10, shadowOpacity: 0.04 },
  detailHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: 10 },
  detailIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 14, height: 42, justifyContent: 'center', width: 42 },
  detailCopy: { flex: 1, minWidth: 0 },
  detailTitle: { color: colors.text, fontSize: 15, fontWeight: '900', lineHeight: 21 },
  bookingId: { color: colors.primary, fontSize: 11, fontWeight: '900', marginTop: 3 },
  detailMeta: { color: colors.textMuted, fontSize: 12, fontWeight: '700', lineHeight: 19, marginTop: 2 },
  requestHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: 9 },
  requestPrice: { color: colors.secondary, fontSize: 14, fontWeight: '900' },
  requestActions: { flexDirection: 'row', gap: 8 },
  requestAction: { flex: 1 },
  rateCard: { gap: 11, shadowOpacity: 0 },
  rateTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  rateHint: { color: colors.textMuted, fontSize: 13, fontWeight: '700', lineHeight: 20 },
  rateInputRow: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.border, borderRadius: 15, borderWidth: 1, flexDirection: 'row', minHeight: 50, paddingHorizontal: 12 },
  currency: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  rateInput: { color: colors.text, flex: 1, fontSize: 16, fontWeight: '900', paddingHorizontal: 8 },
  perHour: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  error: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  success: { color: colors.success, fontSize: 12, fontWeight: '800' },
  availabilityCard: { alignItems: 'flex-start', flexDirection: 'row', gap: 9, shadowOpacity: 0 },
  availabilityText: { color: colors.textMuted, flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 20 },
  metricNote: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
});
