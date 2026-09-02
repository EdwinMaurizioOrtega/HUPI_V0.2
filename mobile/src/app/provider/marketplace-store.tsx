import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useFocusEffect,
  useRouter } from 'expo-router';
import { useCallback,
  useState } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { Card } from '@/components/Card';
import { NotificationBell } from '@/components/NotificationBell';
import { ProviderPageHeader } from '@/components/provider/ProviderPageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { formatMarketplaceCurrency } from '@/components/marketplace/ProductPriceBlock';
import { colors } from '@/constants/colors';
import { getProviderMarketplaceOrders } from '@/constants/marketplaceProviderOrders';
import { Text } from '@/i18n/components';
import {
  currentMockMarketplaceStoreId,
  getProviderMarketplaceFinanceSummary,
  getProviderUnreadNotificationCount,
  getProviderProducts,
  getProviderStoreProfile,
} from '@/constants/marketplaceStoreState';

const actionCards = [
  { title: 'Pedidos marketplace', subtitle: 'Nuevos, preparación y entregas', icon: 'receipt-outline', href: '/provider/marketplace-orders' },
  { title: 'Mis productos', subtitle: 'Crear, editar, pausar y activar', icon: 'cube-outline', href: '/provider/products' },
  { title: 'Métodos de envío', subtitle: 'Estándar, express y recogida', icon: 'car-outline', href: '/provider/shipping-settings' },
  { title: 'Perfil de tienda', subtitle: 'Datos públicos e internos', icon: 'storefront-outline', href: '/provider/store-profile' },
  { title: 'Resumen financiero', subtitle: 'Comisión y liquidaciones', icon: 'wallet-outline', href: '/provider/marketplace-finance' },
] as const;

export default function ProviderMarketplaceStoreScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState(() => getProviderStoreProfile());
  const [products, setProducts] = useState(() => getProviderProducts());
  const [finance, setFinance] = useState(() => getProviderMarketplaceFinanceSummary());
  const [orders, setOrders] = useState(() => getProviderMarketplaceOrders([currentMockMarketplaceStoreId]));
  const [unreadNotifications, setUnreadNotifications] = useState(() => getProviderUnreadNotificationCount());

  useFocusEffect(useCallback(() => {
    setProfile(getProviderStoreProfile());
    setProducts(getProviderProducts());
    setFinance(getProviderMarketplaceFinanceSummary());
    setOrders(getProviderMarketplaceOrders([currentMockMarketplaceStoreId]));
    setUnreadNotifications(getProviderUnreadNotificationCount());
  }, []));

  const activeProducts = products.filter((product) => product.status === 'Activo' && product.stock > 0).length;

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <ProviderPageHeader
          onBack={() => router.back()}
          style={styles.headerWithAction}
          subtitle={profile.name}
          title="__hupi_i18n:marketplace.marketplace-store.myMarketplaceStore"
        />
        <NotificationBell count={unreadNotifications} onPress={() => router.push('/provider/notifications')} />
      </View>

      <Card style={styles.hero} tone="coral">
        <View style={styles.logoBubble}><Text style={styles.logo}>{profile.logo}</Text></View>
        <View style={styles.heroCopy}>
          <Text style={styles.storeName}>{profile.name}</Text>
          <Text style={styles.description}>{profile.description}</Text>
          <View style={styles.badges}>
            <Badge icon="storefront" text={profile.storeStatus} tone={profile.storeStatus === 'Habilitada' ? 'success' : 'purple'} />
            {profile.isVerifiedByHupi ? <Badge icon="checkmark-circle" text="Verificada por Hupi" tone="success" /> : null}
            {profile.isOfficialStore ? <Badge text="Tienda Oficial" tone="purple" /> : null}
          </View>
        </View>
      </Card>

      <View style={styles.metrics}>
        <Metric label="__hupi_i18n:common.rating" value={profile.rating} />
        <Metric label="__hupi_i18n:marketplace.marketplace-store.completedOrders" value={`${profile.completedOrders}`} />
        <Metric label="__hupi_i18n:marketplace.marketplace-store.activeProducts" value={`${activeProducts}`} />
        <Metric label="__hupi_i18n:common.salesOfTheMonth" value={formatMarketplaceCurrency(finance.currentPayout.grossSales)} />
      </View>

      <View style={styles.actions}>
        {actionCards.map((card) => (
          <Pressable
            key={card.title}
            onPress={() => router.push(card.href as Href)}
            style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
          >
            <View style={styles.actionIcon}>
              <Ionicons color={colors.primary} name={card.icon} size={21} />
            </View>
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>{card.title}</Text>
              <Text style={styles.actionSubtitle}>{card.subtitle}</Text>
            </View>
            {card.title === 'Pedidos marketplace' ? (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{orders.filter((order) => order.status === 'Confirmado').length}</Text>
              </View>
            ) : (
              <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
            )}
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.metric} tone="soft">
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Card>
  );
}

function Badge({ icon, text, tone }: { icon?: keyof typeof Ionicons.glyphMap; text: string; tone: 'purple' | 'success' }) {
  return (
    <View style={[styles.statusBadge, tone === 'success' ? styles.successBadge : styles.purpleBadge]}>
      {icon ? <Ionicons color={tone === 'success' ? colors.success : colors.secondary} name={icon} size={13} /> : null}
      <Text style={[styles.statusBadgeText, tone === 'success' ? styles.successText : styles.purpleText]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 42 },
  headerRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 8, overflow: 'visible' },
  headerWithAction: { flex: 1 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4, fontWeight: '800' },
  hero: { flexDirection: 'row', gap: 12, marginTop: 22, shadowOpacity: 0 },
  logoBubble: { width: 62, height: 62, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 31 },
  heroCopy: { flex: 1 },
  storeName: { color: colors.text, fontSize: 19, lineHeight: 26, fontWeight: '900', paddingBottom: 1 },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 5, fontWeight: '700' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  statusBadge: { minHeight: 25, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9 },
  successBadge: { backgroundColor: '#eef9f3' },
  purpleBadge: { backgroundColor: colors.secondarySoft },
  statusBadgeText: { fontSize: 12, fontWeight: '900' },
  successText: { color: colors.success },
  purpleText: { color: colors.secondary },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  metric: { width: '48%', gap: 4, shadowOpacity: 0 },
  metricValue: { color: colors.text, fontSize: 20, lineHeight: 27, fontWeight: '900', paddingBottom: 1 },
  metricLabel: { color: colors.textMuted, fontSize: 12, lineHeight: 18, fontWeight: '800' },
  actions: { gap: 11, marginTop: 18 },
  actionCard: { minHeight: 76, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13 },
  pressed: { opacity: 0.84 },
  actionIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  actionCopy: { flex: 1 },
  actionTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  actionSubtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 3, fontWeight: '700' },
  badgeCount: { minWidth: 31, height: 31, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  badgeCountText: { color: colors.white, fontSize: 13, fontWeight: '900' },
});
