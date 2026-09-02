import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useLocalSearchParams,
  useRouter } from 'expo-router';
import { useState } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { setReservedCouponCode } from '@/constants/marketplaceCouponState';
import { mockCoupons } from '@/constants/mockData';
import { Text } from '@/i18n/components';

export default function MarketplaceCouponsScreen() {
  const router = useRouter();
  const { activeCheckout } = useLocalSearchParams<{ activeCheckout?: string }>();
  const [message, setMessage] = useState<string | null>(null);
  const checkoutActive = activeCheckout === '1';

  const useCoupon = (coupon: typeof mockCoupons[number]) => {
    if (coupon.status !== 'Disponible') {
      setMessage(`El cupón ${coupon.code} no está disponible.`);
      return;
    }

    if (checkoutActive) {
      setMessage('Cupón aplicado a tu pedido actual.');
      setTimeout(() => {
        router.push(`/marketplace/checkout?coupon=${encodeURIComponent(coupon.code)}` as Href);
      }, 450);
      return;
    }

    setReservedCouponCode(coupon.code);
    setMessage('Cupón guardado para tu próximo pedido.');
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.topbar}>
        <Pressable accessibilityLabel="__hupi_i18n:common.back" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={colors.text} name="arrow-back" size={22} />
        </Pressable>
        <View style={styles.heading}>
          <Text style={styles.title}>__hupi_i18n:common.myCoupons</Text>
          <Text style={styles.subtitle}>__hupi_i18n:marketplace.coupons.savedBenefitsAndPromotions</Text>
        </View>
      </View>

      {checkoutActive ? (
        <View style={styles.activeCheckoutBox}>
          <Ionicons color={colors.primary} name="cart-outline" size={18} />
          <Text style={styles.activeCheckoutText}>__hupi_i18n:marketplace.coupons.checkoutActiveTheAvailableCouponWillBeAppliedTo</Text>
        </View>
      ) : null}
      <CouponGroup title="__hupi_i18n:common.activeCoupons" status="Disponible" onMessage={setMessage} onUseCoupon={useCoupon} />
      <CouponGroup title="__hupi_i18n:common.usedCoupons" status="Usado" onMessage={setMessage} onUseCoupon={useCoupon} />
      <CouponGroup title="__hupi_i18n:marketplace.coupons.expiredCoupons" status="Expirado" onMessage={setMessage} onUseCoupon={useCoupon} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </ScreenContainer>
  );
}

function CouponGroup({
  onMessage,
  onUseCoupon,
  status,
  title,
}: {
  onMessage: (message: string) => void;
  onUseCoupon: (coupon: typeof mockCoupons[number]) => void;
  status: string;
  title: string;
}) {
  const coupons = mockCoupons.filter((coupon) => coupon.status === status);

  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.stack}>
        {coupons.map((coupon) => (
          <Card key={coupon.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.code}>{coupon.code}</Text>
                <Text style={styles.name}>{coupon.name}</Text>
              </View>
              <View style={[styles.statusBadge, status !== 'Disponible' && styles.mutedBadge]}>
                <Text style={[styles.statusText, status !== 'Disponible' && styles.mutedBadgeText]}>{coupon.status}</Text>
              </View>
            </View>
            <Text style={styles.description}>{coupon.description}</Text>
            <Text style={styles.meta}>__hupi_i18n:common.type2 {coupon.discountType}  __hupi_i18n:common.validity {coupon.validUntil}</Text>
            <View style={styles.actions}>
              <Pressable
                onPress={() => onUseCoupon(coupon)}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryText}>__hupi_i18n:common.useCoupon</Text>
              </Pressable>
              <Pressable onPress={() => onMessage(`Código ${coupon.code} copiado.`)} style={styles.secondaryButton}>
                <Ionicons color={colors.secondary} name="copy-outline" size={15} />
                <Text style={styles.secondaryText}>__hupi_i18n:common.copyCode</Text>
              </Pressable>
            </View>
          </Card>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 42 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  activeCheckoutBox: { borderRadius: 16, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, marginTop: 18 },
  activeCheckoutText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  group: { marginTop: 22 },
  groupTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginBottom: 10 },
  stack: { gap: 10 },
  card: { gap: 9, shadowOpacity: 0.04 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  code: { color: colors.primary, fontSize: 17, fontWeight: '900' },
  name: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 3 },
  statusBadge: { marginLeft: 'auto', borderRadius: 999, backgroundColor: colors.primarySoft, paddingHorizontal: 9, paddingVertical: 6 },
  mutedBadge: { backgroundColor: colors.soft },
  statusText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  mutedBadgeText: { color: colors.textMuted },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '700' },
  meta: { color: colors.secondary, fontSize: 12, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 3 },
  primaryButton: { minHeight: 36, borderRadius: 999, backgroundColor: colors.primary, justifyContent: 'center', paddingHorizontal: 12 },
  primaryText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  secondaryButton: { minHeight: 36, borderRadius: 999, backgroundColor: colors.secondarySoft, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12 },
  secondaryText: { color: colors.secondary, fontSize: 12, fontWeight: '900' },
  message: { color: colors.primary, fontSize: 13, fontWeight: '900', textAlign: 'center', marginTop: 16 },
});
