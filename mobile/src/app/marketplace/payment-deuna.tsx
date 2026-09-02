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

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { formatMarketplaceCurrency } from '@/components/marketplace/ProductPriceBlock';
import { colors } from '@/constants/colors';
import { mockCart, mockProducts } from '@/constants/mockData';
import { Text } from '@/i18n/components';

export default function PaymentDeunaScreen() {
  const router = useRouter();
  const { address, billingEmail, billingIdNumber, billingIdType, billingName, billingType, coupon, couponDiscount, donation, payment, shipping, total } = useLocalSearchParams<{
    address?: string;
    billingEmail?: string;
    billingIdNumber?: string;
    billingIdType?: string;
    billingName?: string;
    billingType?: string;
    coupon?: string;
    couponDiscount?: string;
    donation?: string;
    payment?: string;
    shipping?: string;
    total?: string;
  }>();
  const [proofLoaded, setProofLoaded] = useState(false);
  const [warning, setWarning] = useState(false);
  const totalValue = Number(total ?? 0);
  const billingParams = `billingType=${encodeURIComponent(billingType ?? 'Persona Natural')}&billingIdType=${encodeURIComponent(billingIdType ?? 'Cédula')}&billingIdNumber=${encodeURIComponent(billingIdNumber ?? '1712345678')}&billingName=${encodeURIComponent(billingName ?? 'Ana Morales')}&billingEmail=${encodeURIComponent(billingEmail ?? 'ana@email.com')}`;
  const couponParams = coupon ? `&coupon=${encodeURIComponent(coupon)}&couponDiscount=${encodeURIComponent(couponDiscount ?? '0')}` : '';
  const params = `donation=${donation ?? 0}&total=${totalValue.toFixed(2)}&payment=${encodeURIComponent(payment ?? 'Deuna')}&address=${encodeURIComponent(address ?? 'Casa: La Carolina, Quito')}&shipping=${encodeURIComponent(shipping ?? 'Envío estándar · $2.50')}&${billingParams}${couponParams}`;
  const products = mockCart.items.map((item) => ({
    ...item,
    product: mockProducts.find((product) => product.id === item.productId) ?? mockProducts[0],
  }));

  const sendProof = () => {
    if (!proofLoaded) {
      setWarning(true);
      return;
    }
    router.push(`/marketplace/order-confirmation?${params}&status=confirmed` as Href);
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.topbar}>
        <Pressable accessibilityLabel="__hupi_i18n:common.back" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={colors.text} name="arrow-back" size={22} />
        </Pressable>
        <Text style={styles.title}>__hupi_i18n:common.paymentWithDeuna</Text>
      </View>

      <Card style={styles.totalCard} tone="purple">
        <Text style={styles.totalLabel}>__hupi_i18n:common.totalToPay2</Text>
        <Text style={styles.total}>{formatMarketplaceCurrency(totalValue)}</Text>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>__hupi_i18n:common.orderSummary</Text>
        {products.map((item) => (
          <View key={item.id} style={styles.productLine}>
            <View style={[styles.thumb, { backgroundColor: item.product.color }]}>
              <Text style={styles.emoji}>{item.product.emoji}</Text>
            </View>
            <View style={styles.productCopy}>
              <Text style={styles.productName}>{item.product.name}</Text>
              <Text style={styles.productMeta}>__hupi_i18n:common.quantity3 {item.quantity}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Card style={styles.qrCard}>
        <View style={styles.qrMock}>
          {Array.from({ length: 25 }).map((_, index) => (
            <View key={index} style={[styles.qrCell, index % 3 === 0 && styles.qrCellDark]} />
          ))}
        </View>
        <Text style={styles.instruction}>

          __hupi_i18n:marketplace.payment-deuna.scanThisQrFromDeunaMakePaymentAndThen
        </Text>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>__hupi_i18n:common.paymentReceipt</Text>
        <Pressable onPress={() => { setProofLoaded(true); setWarning(false); }} style={styles.uploadBox}>
          <Ionicons color={proofLoaded ? colors.success : colors.secondary} name={proofLoaded ? 'checkmark-circle-outline' : 'image-outline'} size={24} />
          <Text style={styles.uploadText}>{proofLoaded ? 'Comprobante cargado' : 'Subir comprobante'}</Text>
        </Pressable>
      </Card>
      {warning ? <Text style={styles.warning}>__hupi_i18n:marketplace.payment-deuna.uploadAReceiptBeforeSendingIt</Text> : null}

      <View style={styles.actions}>
        <Button icon="send-outline" onPress={sendProof} title="__hupi_i18n:common.sendProof" />
        <Button
          icon="time-outline"
          onPress={() => router.push(`/marketplace/order-confirmation?${params}&status=pending` as Href)}
          title="__hupi_i18n:marketplace.payment-deuna.uploadReceiptLater"
          variant="outline"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 42 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: colors.text, fontSize: 25, fontWeight: '900' },
  totalCard: { marginTop: 20, shadowOpacity: 0 },
  totalLabel: { color: colors.secondary, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  total: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 5 },
  section: { marginTop: 14, gap: 10, shadowOpacity: 0.04 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  productLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 23 },
  productCopy: { flex: 1 },
  productName: { color: colors.text, fontSize: 13, fontWeight: '900' },
  productMeta: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  qrCard: { alignItems: 'center', gap: 14, marginTop: 14, shadowOpacity: 0.04 },
  qrMock: { width: 176, height: 176, borderRadius: 20, backgroundColor: colors.white, borderWidth: 10, borderColor: colors.secondary, flexDirection: 'row', flexWrap: 'wrap', padding: 14 },
  qrCell: { width: '20%', height: '20%', backgroundColor: colors.white },
  qrCellDark: { backgroundColor: colors.text },
  instruction: { color: colors.text, fontSize: 13, lineHeight: 22, fontWeight: '800', textAlign: 'center' },
  uploadBox: { minHeight: 76, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 6 },
  uploadText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  warning: { color: colors.primary, fontSize: 13, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  actions: { gap: 10, marginTop: 16 },
});
