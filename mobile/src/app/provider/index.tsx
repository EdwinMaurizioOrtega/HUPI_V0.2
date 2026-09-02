import type { ComponentProps } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { NotificationBell } from '@/components/NotificationBell';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { getProviderMarketplaceOrders } from '@/constants/marketplaceProviderOrders';
import {
  currentMockMarketplaceStoreId,
  getProviderProducts,
  getProviderStoreProfile,
  getProviderUnreadNotificationCount,
} from '@/constants/marketplaceStoreState';
import { getMockProviderRequests } from '@/constants/mockBookings';
import { getVisibleMockConversations, mockProvider } from '@/constants/mockData';
import { mockProviders } from '@/constants/mockProviders';
import { getProviderWalkHourlyRate } from '@/domain/providerPricing';
import { useMockProviderPricing } from '@/hooks/useMockProviderPricing';
import { useLocalAccount } from '@/hooks/useLocalAccount';
import { useLocalProvider } from '@/hooks/useLocalProvider';
import { useLocalQa } from '@/hooks/useLocalQa';
import { getProviderVerificationProgress, isProviderGenerallyApproved } from '@/domain/providerVerification';
import { Pressable, Text } from '@/i18n/components';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { ThemedView as View } from '@/theme/ThemedView';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export default function ProviderHomeScreen() {
  useMockProviderPricing();
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const account = useLocalAccount();
  const providerEnrollment = useLocalProvider();
  const qa = useLocalQa();
  const verificationProgress = getProviderVerificationProgress(providerEnrollment, account.profile, account.session.phoneVerified);
  const providerApproved = isProviderGenerallyApproved(providerEnrollment.status);
  const activeProvider = mockProviders.find((provider) => provider.id === mockProvider.providerId) ?? mockProviders[0];
  const [orders, setOrders] = useState(() => getProviderMarketplaceOrders([currentMockMarketplaceStoreId]));
  const [products, setProducts] = useState(() => getProviderProducts());
  const [store, setStore] = useState(() => getProviderStoreProfile());
  const [requests, setRequests] = useState(() => getMockProviderRequests());
  const [unreadNotifications, setUnreadNotifications] = useState(() => getProviderUnreadNotificationCount());

  useFocusEffect(useCallback(() => {
    setOrders(getProviderMarketplaceOrders([currentMockMarketplaceStoreId]));
    setProducts(getProviderProducts());
    setStore(getProviderStoreProfile());
    setRequests(getMockProviderRequests());
    setUnreadNotifications(getProviderUnreadNotificationCount());
  }, []));

  const unreadMessages = useMemo(() => getVisibleMockConversations()
    .filter((conversation) => conversation.type === 'services' || conversation.id === 'chat-support-provider-2050')
    .reduce((total, conversation) => total + conversation.unreadCount, 0), []);
  const activeProducts = products.filter((product) => product.status === 'Activo' && product.stock > 0).length;
  const pendingWalkRequests = requests.filter((request) => request.status === 'Solicitud creada').length;
  const newOrders = orders.filter((order) => order.status === 'Confirmado').length;
  const walkRate = getProviderWalkHourlyRate(activeProvider);
  const formattedWalkRate = typeof walkRate === 'number' && Number.isFinite(walkRate)
    ? new Intl.NumberFormat(i18n.language, { currency: 'USD', style: 'currency' }).format(walkRate)
    : t('providerPricing.undefinedRate');
  const qaWalkApproval = qa.walkStatus === 'pending_approval' || qa.walkStatus === 'approved'
    ? t(`providerProfile.statuses.${qa.walkStatus}`)
    : null;

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <IconButton accessibilityLabel={t('common.back')} icon="arrow-back" iconColor={colors.text} iconSize={22} onPress={() => router.replace('/home')} size={42} />
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>{t('providerDashboard.mode')}</Text>
          <Text numberOfLines={1} style={styles.headerName}>{mockProvider.name}</Text>
        </View>
        <HeaderIcon
          badge={unreadMessages}
          icon="chatbubble-ellipses-outline"
          label={t('providerDashboard.messages')}
          onPress={() => router.push('/provider/messages' as Href)}
        />
        <NotificationBell count={unreadNotifications} onPress={() => router.push('/provider/notifications' as Href)} />
      </View>

      <Pressable
        accessibilityHint={t('providerDashboard.verificationHint')}
        accessibilityRole="button"
        onPress={() => router.push('/provider/verification' as Href)}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Card style={styles.verificationCard} tone="soft">
          <View style={styles.verificationIcon}>
            <Ionicons color={colors.secondary} name="shield-checkmark" size={25} />
          </View>
          <View style={styles.verificationCopy}>
            <Text style={styles.verificationTitle}>{t('providerDashboard.verification')}</Text>
            <Text style={styles.verificationStatus}>{t('providerDashboard.completed', { count: verificationProgress })}</Text>
            <View style={styles.progress}>
              <View style={[styles.progressFill, { width: `${verificationProgress}%` }]} />
            </View>
            <Text style={styles.verificationHint}>{t('providerDashboard.verificationHint')}</Text>
          </View>
          <Ionicons color={colors.secondary} name="chevron-forward" size={20} />
        </Card>
      </Pressable>

      <Text style={styles.sectionTitle}>{t('providerDashboard.generalIndicators')}</Text>
      <View style={styles.metrics}>
        <Metric icon="wallet-outline" label={t('providerDashboard.totalIncome')} value={mockProvider.earnings} />
        <Metric icon="receipt-outline" label={t('providerDashboard.totalOrders')} value={String(orders.length)} />
        <Metric icon="calendar-outline" label={t('providerDashboard.totalAppointments')} value={String(mockProvider.nextBookings)} />
      </View>

      <Text style={styles.sectionTitle}>{t('providerDashboard.yourServices')}</Text>
      {!providerApproved ? (
        <Card style={styles.blockedCard} tone="coral">
          <Ionicons color={colors.primary} name="lock-closed-outline" size={22} />
          <View style={styles.blockedCopy}>
            <Text style={styles.blockedTitle}>{t('providerDashboard.verificationRequired')}</Text>
            <Text style={styles.blockedText}>{t('providerDashboard.verificationRequiredHint')}</Text>
          </View>
          <Button onPress={() => router.push('/provider/verification')} title={t('providerDashboard.continueVerification')} variant="outline" />
        </Card>
      ) : null}
      <View style={styles.services}>
        <ProviderServiceCard
          badge={pendingWalkRequests > 0 ? t('providerDashboard.pendingCount', { count: pendingWalkRequests }) : undefined}
          icon="walk-outline"
          onPress={() => router.push((providerApproved ? '/provider/walks' : '/provider/verification') as Href)}
          status={`${t('providerDashboard.walkRate', { rate: formattedWalkRate })}${qaWalkApproval ? ` · ${qaWalkApproval}` : ''}`}
          subtitle={t('providerDashboard.walksSummary', { count: mockProvider.nextBookings })}
          title={t('providerDashboard.walks')}
        />
        <ProviderServiceCard
          badge={newOrders > 0 ? t('providerDashboard.newCount', { count: newOrders }) : undefined}
          icon="storefront-outline"
          onPress={() => router.push((providerApproved ? '/provider/marketplace-store' : '/provider/verification') as Href)}
          status={store.storeStatus}
          subtitle={t('providerDashboard.marketplaceSummary', { count: activeProducts })}
          title={t('providerDashboard.marketplaceStore')}
        />
      </View>

      <Button onPress={() => router.replace('/home')} style={styles.clientModeButton} title={t('providerDashboard.returnToClient')} variant="outline" />
    </ScreenContainer>
  );
}

function HeaderIcon({ badge, icon, label, onPress }: { badge: number; icon: IoniconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={styles.headerIcon}>
      <Ionicons color={colors.secondary} name={icon} size={21} />
      {badge > 0 ? <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{badge}</Text></View> : null}
    </Pressable>
  );
}

function Metric({ icon, label, value }: { icon: IoniconName; label: string; value: string }) {
  return (
    <Card style={styles.metric} tone="soft">
      <Ionicons color={colors.primary} name={icon} size={21} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Card>
  );
}

function ProviderServiceCard({ badge, icon, onPress, status, subtitle, title }: {
  badge?: string;
  icon: IoniconName;
  onPress: () => void;
  status: string;
  subtitle: string;
  title: string;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.serviceCard, pressed && styles.pressed]}>
      <View style={styles.serviceIcon}><Ionicons color={colors.primary} name={icon} size={25} /></View>
      <View style={styles.serviceCopy}>
        <View style={styles.serviceTitleRow}>
          <Text style={styles.serviceTitle}>{title}</Text>
          {badge ? <View style={styles.serviceBadge}><Text style={styles.serviceBadgeText}>{badge}</Text></View> : null}
        </View>
        <Text style={styles.serviceSubtitle}>{subtitle}</Text>
        <Text style={styles.serviceStatus}>{status}</Text>
      </View>
      <Ionicons color={colors.secondary} name="chevron-forward" size={21} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 42, paddingTop: 8 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  headerCopy: { flex: 1, minWidth: 0 },
  headerEyebrow: { color: colors.secondary, fontSize: 16, fontWeight: '900', lineHeight: 22 },
  headerName: { color: colors.textMuted, fontSize: 12, fontWeight: '700', lineHeight: 18 },
  headerIcon: { alignItems: 'center', backgroundColor: colors.secondarySoft, borderRadius: 15, height: 42, justifyContent: 'center', width: 42 },
  headerBadge: { alignItems: 'center', backgroundColor: colors.primary, borderColor: colors.white, borderRadius: 9, borderWidth: 2, height: 18, justifyContent: 'center', minWidth: 18, paddingHorizontal: 3, position: 'absolute', right: -3, top: -3 },
  headerBadgeText: { color: colors.white, fontSize: 9, fontWeight: '900' },
  verificationCard: { alignItems: 'center', flexDirection: 'row', gap: 12, marginTop: 24, shadowOpacity: 0 },
  verificationIcon: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 17, height: 50, justifyContent: 'center', width: 50 },
  verificationCopy: { flex: 1, minWidth: 0 },
  verificationTitle: { color: colors.text, fontSize: 15, fontWeight: '900', lineHeight: 21 },
  verificationStatus: { color: colors.secondary, fontSize: 13, fontWeight: '900', marginTop: 2 },
  verificationHint: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 6 },
  progress: { backgroundColor: colors.white, borderRadius: 999, height: 7, marginTop: 8, overflow: 'hidden' },
  progressFill: { backgroundColor: colors.secondary, borderRadius: 999, height: '100%' },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900', lineHeight: 27, marginTop: 26 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 12 },
  metric: { flexBasis: 102, flexGrow: 1, gap: 4, minWidth: 0, shadowOpacity: 0 },
  metricValue: { color: colors.text, fontSize: 19, fontWeight: '900', lineHeight: 25 },
  metricLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '800', lineHeight: 16 },
  services: { gap: 12, marginTop: 12 },
  blockedCard: { alignItems: 'flex-start', gap: 10, marginTop: 12, shadowOpacity: 0 },
  blockedCopy: { minWidth: 0 },
  blockedTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  blockedText: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  serviceCard: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.border, borderRadius: 22, borderWidth: 1, flexDirection: 'row', gap: 12, minHeight: 112, padding: 15 },
  serviceIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 18, height: 54, justifyContent: 'center', width: 54 },
  serviceCopy: { flex: 1, minWidth: 0 },
  serviceTitleRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  serviceTitle: { color: colors.text, flexShrink: 1, fontSize: 17, fontWeight: '900', lineHeight: 23 },
  serviceSubtitle: { color: colors.textMuted, fontSize: 13, fontWeight: '700', lineHeight: 19, marginTop: 4 },
  serviceStatus: { color: colors.secondary, fontSize: 12, fontWeight: '900', marginTop: 6 },
  serviceBadge: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  serviceBadgeText: { color: colors.white, fontSize: 10, fontWeight: '900' },
  pressed: { opacity: 0.82 },
  clientModeButton: { marginTop: 24 },
});
