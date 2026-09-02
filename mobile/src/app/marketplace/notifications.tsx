import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { Card } from '@/components/Card';
import { SwipeableNotification } from '@/components/notifications/SwipeableNotification';
import { PageHeader } from '@/components/PageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { getMarketplaceClientNotifications } from '@/constants/marketplaceOrdersState';
import { mockMarketplaceNotifications } from '@/constants/mockData';
import { Text } from '@/i18n/components';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export default function MarketplaceNotificationsScreen() {
  const router = useRouter();
  const orderNotifications = getMarketplaceClientNotifications();
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const removeNotification = (notificationId: string) => {
    setDeletedIds((current) => current.includes(notificationId) ? current : [...current, notificationId]);
  };

  const handleAction = (action: string) => {
    if (action.includes('cup') || action.includes('beneficio')) {
      router.push('/marketplace/coupons');
      return;
    }

    if (action.includes('tracking')) {
      router.push('/marketplace/order-tracking?orderId=HUPI-MK-2048' as Href);
      return;
    }

    if (action.includes('comprobante')) {
      router.push('/marketplace/orders');
      return;
    }

    router.push('/marketplace');
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <PageHeader
        onBack={() => router.back()}
        subtitle="__hupi_i18n:common.marketplaceHupi"
        title="__hupi_i18n:common.notifications"
      />

      <View style={styles.stack}>
        {orderNotifications.filter((notification) => !deletedIds.includes(notification.id)).map((notification) => (
          <SwipeableNotification
            key={notification.id}
            onDelete={() => removeNotification(notification.id)}
            onOpen={() => router.push(notification.actionTarget as Href)}
            onPress={() => router.push(notification.actionTarget as Href)}
          >
          <Card style={notification.isRead ? styles.card : { ...styles.card, ...styles.unreadCard }}>
            <View style={styles.iconWrap}>
              <Ionicons color={colors.primary} name={getOrderNotificationIcon(notification.type)} size={21} />
            </View>
            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                {!notification.isRead ? (
                  <View style={styles.unreadMarker}>
                    <View style={styles.unreadDot} />
                  </View>
                ) : null}
              </View>
              <Text style={styles.description}>{notification.message}</Text>
              <Text style={styles.time}>{notification.createdAt}</Text>
              <Pressable onPress={() => router.push(notification.actionTarget as Href)} style={styles.actionButton}>
                <Text style={styles.actionText}>__hupi_i18n:common.seeDetail</Text>
              </Pressable>
            </View>
          </Card>
          </SwipeableNotification>
        ))}
        {mockMarketplaceNotifications.filter((notification) => !deletedIds.includes(notification.id)).map((notification) => (
          <SwipeableNotification
            key={notification.id}
            onDelete={() => removeNotification(notification.id)}
            onOpen={() => handleAction(notification.action)}
            onPress={() => handleAction(notification.action)}
          >
          <Card style={notification.unread ? { ...styles.card, ...styles.unreadCard } : styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons color={colors.primary} name={notification.icon as IoniconName} size={21} />
            </View>
            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                {notification.unread ? (
                  <View style={styles.unreadMarker}>
                    <View style={styles.unreadDot} />
                  </View>
                ) : null}
              </View>
              <Text style={styles.description}>{notification.description}</Text>
              <Text style={styles.time}>{notification.time}</Text>
              <Pressable onPress={() => handleAction(notification.action)} style={styles.actionButton}>
                <Text style={styles.actionText}>{notification.action}</Text>
              </Pressable>
            </View>
          </Card>
          </SwipeableNotification>
        ))}
      </View>
    </ScreenContainer>
  );
}

function getOrderNotificationIcon(type: ReturnType<typeof getMarketplaceClientNotifications>[number]['type']): IoniconName {
  if (type.includes('payment')) {
    return 'card-outline';
  }

  if (type.includes('ticket')) {
    return 'ticket-outline';
  }

  if (type.includes('chat')) {
    return 'chatbubble-ellipses-outline';
  }

  return 'receipt-outline';
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 42 },
  stack: { gap: 12, marginTop: 20 },
  card: { flexDirection: 'row', gap: 12, overflow: 'visible', paddingVertical: 16, shadowOpacity: 0.04 },
  unreadCard: { borderWidth: 1, borderColor: colors.primary },
  iconWrap: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, overflow: 'visible' },
  notificationTitle: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '900', lineHeight: 21 },
  unreadMarker: { alignItems: 'center', height: 18, justifyContent: 'center', overflow: 'visible', width: 18 },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 4, fontWeight: '700' },
  time: { color: colors.secondary, fontSize: 12, fontWeight: '900', lineHeight: 18, marginTop: 6 },
  actionButton: { alignSelf: 'flex-start', minHeight: 36, borderRadius: 999, backgroundColor: colors.primary, justifyContent: 'center', paddingHorizontal: 11, paddingVertical: 5, marginTop: 9 },
  actionText: { color: colors.white, fontSize: 12, fontWeight: '900', lineHeight: 18 },
});
