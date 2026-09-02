import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useFocusEffect,
  useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useCallback,
  useMemo,
  useState } from 'react';
import { Alert,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SwipeableNotification } from '@/components/notifications/SwipeableNotification';
import { ProviderPageHeader } from '@/components/provider/ProviderPageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { Pressable, Text } from '@/i18n/components';
import {
  clearReadProviderNotifications,
  getProviderNotifications,
  markProviderNotificationAsRead,
  removeProviderNotification,
  type ProviderNotification,
  type ProviderNotificationCategory,
  type ProviderNotificationPriority,
} from '@/constants/marketplaceStoreState';
import { useTranslation } from '../../../node_modules/react-i18next';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type FilterKey =
  | 'Todas'
  | 'No leídas'
  | 'Importantes'
  | 'Verificación'
  | 'Tienda'
  | 'Marketplace'
  | 'Servicios'
  | 'Liquidaciones'
  | 'Soporte';

const filters: FilterKey[] = [
  'Todas',
  'No leídas',
  'Importantes',
  'Verificación',
  'Tienda',
  'Marketplace',
  'Servicios',
  'Liquidaciones',
  'Soporte',
];

const categoryIcons: Record<ProviderNotificationCategory, IoniconName> = {
  Verificación: 'shield-checkmark-outline',
  Tienda: 'storefront-outline',
  Marketplace: 'bag-handle-outline',
  Productos: 'cube-outline',
  Stock: 'layers-outline',
  Pedidos: 'receipt-outline',
  Liquidaciones: 'wallet-outline',
  Servicios: 'calendar-outline',
  Reservas: 'time-outline',
  Calificaciones: 'star-outline',
  Soporte: 'chatbubble-ellipses-outline',
  Documentos: 'document-text-outline',
  'Sistema Hupi': 'sparkles-outline',
};

const actionRoutes: Record<string, Href> = {
  'store-profile': '/provider/store-profile',
  '/provider/store-profile': '/provider/store-profile',
  'marketplace-store': '/provider/marketplace-store',
  '/provider/marketplace-store': '/provider/marketplace-store',
  products: '/provider/products',
  '/provider/products': '/provider/products',
  'marketplace-orders': '/provider/marketplace-orders',
  '/provider/marketplace-orders': '/provider/marketplace-orders',
  'marketplace-finance': '/provider/marketplace-finance',
  '/provider/marketplace-finance': '/provider/marketplace-finance',
  support: '/support',
  '/support': '/support',
  'chat-provider-support': '/chat?chatId=chat-support-provider-2050&viewer=provider',
};

export default function ProviderNotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('Todas');
  const [notifications, setNotifications] = useState(() => getProviderNotifications());
  const [selectedInfoNotification, setSelectedInfoNotification] = useState<ProviderNotification | null>(null);

  useFocusEffect(useCallback(() => {
    setNotifications(getProviderNotifications());
  }, []));

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const filteredNotifications = useMemo(() => (
    notifications.filter((notification) => matchesFilter(notification, activeFilter))
  ), [activeFilter, notifications]);

  const refresh = () => setNotifications(getProviderNotifications());

  const markAsRead = (notificationId: string) => {
    setNotifications(markProviderNotificationAsRead(notificationId));
  };

  const clearRead = () => {
    setNotifications(clearReadProviderNotifications());
  };

  const openProviderInfoModal = (notification: ProviderNotification) => {
    markAsRead(notification.id);
    setSelectedInfoNotification(notification);
  };

  const openRelatedOrder = () => {
    const notification = selectedInfoNotification;
    setSelectedInfoNotification(null);

    if (notification?.providerOrderId) {
      router.push(`/provider/marketplace-order-detail?providerOrderId=${notification.providerOrderId}` as Href);
    }
  };

  const handleAction = (notification: ProviderNotification) => {
    if (notification.type === 'hupi_needs_provider_info') {
      openProviderInfoModal(notification);
      return;
    }

    markAsRead(notification.id);

    if (notification.actionTarget && actionRoutes[notification.actionTarget]) {
      router.push(actionRoutes[notification.actionTarget]);
      return;
    }

    Alert.alert(
      t('generated.provider.notifications.actionInTestMode'),
      t('generated.provider.notifications.theCorrespondingDetailWillOpenWhenYouAreConnected'),
    );
    refresh();
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <ProviderPageHeader
        onBack={() => router.back()}
        subtitle={t('providerNotifications.unreadCount', { count: unreadCount })}
        title="__hupi_i18n:common.notifications"
      />

      <Card style={styles.controls} tone="soft">
        <View style={styles.controlsHeader}>
          <View>
            <Text style={styles.controlsTitle}>__hupi_i18n:common.supplierCenter</Text>
            <Text style={styles.controlsSubtitle}>__hupi_i18n:provider.notifications.hupiEntriesClientsAndSystem</Text>
          </View>
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        </View>
        <View style={styles.controlActions}>
          <Pressable onPress={clearRead} style={styles.clearButton}>
            <Ionicons color={colors.textMuted} name="trash-outline" size={15} />
            <Text style={styles.clearButtonText}>__hupi_i18n:common.clearReads</Text>
          </Pressable>
        </View>
      </Card>

      <ScrollView
        contentContainerStyle={styles.filtersContent}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
      >
        {filters.map((filter) => {
          const active = activeFilter === filter;

          return (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[styles.filterChip, active && styles.activeFilterChip]}
            >
              <Text style={[styles.filterText, active && styles.activeFilterText]}>{filter}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.stack}>
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onAction={() => handleAction(notification)}
              onDelete={() => setNotifications(removeProviderNotification(notification.id))}
              onRead={() => markAsRead(notification.id)}
            />
          ))
        ) : (
          <Card style={styles.emptyCard} tone="soft">
            <Ionicons color={colors.secondary} name="notifications-off-outline" size={25} />
            <Text style={styles.emptyTitle}>__hupi_i18n:provider.notifications.noNotificationsInThisFilter</Text>
            <Text style={styles.emptyText}>__hupi_i18n:provider.notifications.whenThereIsActivityForTheSupplierItWill</Text>
          </Card>
        )}
      </View>

      <Modal animationType="fade" onRequestClose={() => setSelectedInfoNotification(null)} transparent visible={Boolean(selectedInfoNotification)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons color={colors.white} name="shield-checkmark-outline" size={26} />
            </View>
            <Text style={styles.modalTitle}>__hupi_i18n:common.hupiNeedsInformation</Text>
            <Text style={styles.modalSubtitle}>{t('providerNotifications.orderReference', { value: selectedInfoNotification?.orderNumber ?? '—' })}</Text>
            <Text style={styles.modalMessage}>{selectedInfoNotification?.hupiMessage}</Text>
            <Text style={styles.modalHint}>__hupi_i18n:provider.notifications.reviewTheRequestAndRespondToHupiToContinue</Text>
            <Button icon="receipt-outline" onPress={openRelatedOrder} title="__hupi_i18n:common.viewOrder" />
            <Button onPress={() => setSelectedInfoNotification(null)} title="__hupi_i18n:marketplace.marketplace-orders.replyLater" variant="ghost" />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function matchesFilter(notification: ProviderNotification, filter: FilterKey) {
  if (filter === 'Todas') {
    return true;
  }

  if (filter === 'No leídas') {
    return !notification.isRead;
  }

  if (filter === 'Importantes') {
    return notification.priority === 'Importante' || notification.priority === 'Urgente';
  }

  if (filter === 'Servicios') {
    return notification.category === 'Servicios' || notification.category === 'Reservas';
  }

  if (filter === 'Marketplace') {
    return ['Marketplace', 'Productos', 'Stock', 'Pedidos', 'Calificaciones'].includes(notification.category);
  }

  return notification.category === filter;
}

function NotificationCard({
  notification,
  onAction,
  onDelete,
  onRead,
}: {
  notification: ProviderNotification;
  onAction: () => void;
  onDelete: () => void;
  onRead: () => void;
}) {
  const { t } = useTranslation();
  const hasDestination = Boolean(notification.actionLabel || notification.actionTarget || notification.type === 'hupi_needs_provider_info');
  return (
    <SwipeableNotification
      onDelete={onDelete}
      onOpen={hasDestination ? onAction : undefined}
      onPress={onRead}
    >
      <Card style={notification.isRead ? styles.notificationCard : { ...styles.notificationCard, ...styles.unreadCard }}>
        <View style={styles.iconWrap}>
          <Ionicons color={colors.primary} name={categoryIcons[notification.category]} size={21} />
        </View>

        <View style={styles.notificationCopy}>
          <View style={styles.notificationTop}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            {!notification.isRead ? <View style={styles.unreadDot} /> : null}
          </View>
          <Text style={styles.message}>{notification.message}</Text>

          <View style={styles.metaRow}>
            <Badge label={notification.category} tone="soft" />
            <Badge label={notification.isRead ? 'Leída' : 'No leída'} tone={notification.isRead ? 'soft' : 'coral'} />
            <Badge label={notification.priority} tone={getPriorityTone(notification.priority)} />
          </View>
          {notification.type === 'hupi_needs_provider_info' ? (
            <View style={styles.relatedBox}>
              <Text style={styles.relatedText}>{t('providerNotifications.orderReference', { value: notification.orderNumber ?? '—' })}</Text>
              <Text style={styles.relatedText}>{t('providerNotifications.caseReference', { value: notification.caseNumber ?? '—' })}</Text>
            </View>
          ) : null}

          <Text style={styles.date}>{notification.createdAt}</Text>

          {notification.actionLabel ? (
            <Pressable onPress={onAction} style={styles.actionButton}>
              <Text style={styles.actionText}>{notification.actionLabel}</Text>
              <Ionicons color={colors.white} name="arrow-forward" size={14} />
            </Pressable>
          ) : null}
        </View>
      </Card>
    </SwipeableNotification>
  );
}

function Badge({ label, tone }: { label: string; tone: 'coral' | 'purple' | 'soft' }) {
  return (
    <View style={[styles.badge, tone === 'coral' && styles.coralBadge, tone === 'purple' && styles.purpleBadge]}>
      <Text style={[styles.badgeText, tone === 'coral' && styles.coralBadgeText, tone === 'purple' && styles.purpleBadgeText]}>
        {label}
      </Text>
    </View>
  );
}

function getPriorityTone(priority: ProviderNotificationPriority) {
  if (priority === 'Urgente') {
    return 'coral';
  }

  if (priority === 'Importante') {
    return 'purple';
  }

  return 'soft';
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 42 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4, fontWeight: '800' },
  controls: { gap: 12, marginTop: 22, shadowOpacity: 0 },
  controlsHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  controlsTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  controlsSubtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 2, fontWeight: '800' },
  unreadBadge: { minWidth: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, marginLeft: 'auto' },
  unreadBadgeText: { color: colors.white, fontSize: 15, fontWeight: '900' },
  controlActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  clearButton: { minHeight: 36, borderRadius: 12, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10 },
  clearButtonText: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  filters: { marginTop: 16, marginHorizontal: -4 },
  filtersContent: { gap: 8, paddingHorizontal: 4 },
  filterChip: { minHeight: 36, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, justifyContent: 'center', paddingHorizontal: 12 },
  activeFilterChip: { borderColor: colors.primary, backgroundColor: colors.primary },
  filterText: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  activeFilterText: { color: colors.white },
  stack: { gap: 12, marginTop: 18 },
  notificationCard: { flexDirection: 'row', gap: 12, shadowOpacity: 0.04 },
  unreadCard: { borderColor: colors.primary, backgroundColor: colors.soft },
  iconWrap: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  notificationCopy: { flex: 1 },
  notificationTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notificationTitle: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '900' },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },
  message: { color: colors.textMuted, fontSize: 13, lineHeight: 21, marginTop: 5, fontWeight: '800' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 },
  badge: { minHeight: 24, borderRadius: 999, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9 },
  coralBadge: { backgroundColor: colors.primary },
  purpleBadge: { backgroundColor: colors.secondary },
  badgeText: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  coralBadgeText: { color: colors.white },
  purpleBadgeText: { color: colors.white },
  date: { color: colors.secondary, fontSize: 12, fontWeight: '900', marginTop: 8 },
  actionButton: { alignSelf: 'flex-start', minHeight: 34, borderRadius: 999, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, marginTop: 10 },
  actionText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  relatedBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  relatedText: { borderRadius: 999, backgroundColor: colors.soft, color: colors.text, fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5 },
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(51, 51, 51, 0.36)', padding: 22 },
  modalCard: { width: '100%', maxWidth: 370, borderRadius: 22, backgroundColor: colors.white, padding: 18, gap: 12 },
  modalIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  modalSubtitle: { color: colors.secondary, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  modalMessage: { color: colors.text, fontSize: 15, lineHeight: 23, fontWeight: '800', textAlign: 'center' },
  modalHint: { color: colors.textMuted, fontSize: 13, lineHeight: 22, fontWeight: '800', textAlign: 'center' },
  emptyCard: { alignItems: 'center', gap: 7, shadowOpacity: 0 },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  emptyText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
