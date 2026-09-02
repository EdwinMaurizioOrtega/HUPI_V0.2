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
import { mockCart, mockHupiBankAccounts, mockProducts } from '@/constants/mockData';
import { Text } from '@/i18n/components';

export default function PaymentTransferScreen() {
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
  const [copied, setCopied] = useState(false);
  const [warning, setWarning] = useState(false);
  const totalValue = Number(total ?? 0);
  const billingParams = `billingType=${encodeURIComponent(billingType ?? 'Persona Natural')}&billingIdType=${encodeURIComponent(billingIdType ?? 'Cédula')}&billingIdNumber=${encodeURIComponent(billingIdNumber ?? '1712345678')}&billingName=${encodeURIComponent(billingName ?? 'Ana Morales')}&billingEmail=${encodeURIComponent(billingEmail ?? 'ana@email.com')}`;
  const couponParams = coupon ? `&coupon=${encodeURIComponent(coupon)}&couponDiscount=${encodeURIComponent(couponDiscount ?? '0')}` : '';
  const params = `donation=${donation ?? 0}&total=${totalValue.toFixed(2)}&payment=${encodeURIComponent(payment ?? 'Transferencia bancaria')}&address=${encodeURIComponent(address ?? 'Casa: La Carolina, Quito')}&shipping=${encodeURIComponent(shipping ?? 'Envío estándar · $2.50')}&${billingParams}${couponParams}`;
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
      <Header title="__hupi_i18n:marketplace.payment-transfer.bankTransfer" onBack={() => router.back()} />

      <Card style={styles.totalCard} tone="coral">
        <Text style={styles.totalLabel}>__hupi_i18n:marketplace.payment-transfer.totalToTransfer</Text>
        <Text style={styles.total}>{formatMarketplaceCurrency(totalValue)}</Text>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>__hupi_i18n:common.orderSummary</Text>
        {products.map((item) => (
          <ProductLine
            color={item.product.color}
            emoji={item.product.emoji}
            key={item.id}
            name={item.product.name}
            quantity={item.quantity}
          />
        ))}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>__hupi_i18n:marketplace.payment-transfer.hupiBankAccounts</Text>
        {mockHupiBankAccounts.map((account) => (
          <View key={account.id} style={styles.bankBox}>
            <InfoRow label="__hupi_i18n:common.bank" value={account.bank} />
            <InfoRow label="__hupi_i18n:common.accountType" value={account.accountType} />
            <InfoRow label="__hupi_i18n:common.accountNumber" value={account.accountNumber} />
            <InfoRow label="__hupi_i18n:common.owner" value={account.holder} />
            <InfoRow label="__hupi_i18n:common.rucCedula" value={account.taxId} />
            <InfoRow label="__hupi_i18n:common.mail" value={account.email} />
          </View>
        ))}
        <Pressable onPress={() => setCopied(true)} style={styles.copyButton}>
          <Ionicons color={colors.secondary} name="copy-outline" size={17} />
          <Text style={styles.copyText}>__hupi_i18n:common.copyData</Text>
        </Pressable>
        {copied ? <Text style={styles.mockText}>__hupi_i18n:common.copiedData</Text> : null}
      </Card>

      <Card style={styles.section} tone="soft">
        <Text style={styles.instruction}>

          __hupi_i18n:marketplace.payment-transfer.makeTheTransferFromYourBankAndThenUpload
        </Text>
      </Card>

      <ProofBox proofLoaded={proofLoaded} onLoad={() => { setProofLoaded(true); setWarning(false); }} />
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

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={styles.topbar}>
      <Pressable accessibilityLabel="__hupi_i18n:common.back" onPress={onBack} style={styles.backButton}>
        <Ionicons color={colors.text} name="arrow-back" size={22} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

function ProductLine({ color, emoji, name, quantity }: { color: string; emoji: string; name: string; quantity: number }) {
  return (
    <View style={styles.productLine}>
      <View style={[styles.thumb, { backgroundColor: color }]}><Text style={styles.emoji}>{emoji}</Text></View>
      <View style={styles.productCopy}>
        <Text style={styles.productName}>{name}</Text>
        <Text style={styles.productMeta}>__hupi_i18n:common.quantity3 {quantity}</Text>
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ProofBox({ onLoad, proofLoaded }: { onLoad: () => void; proofLoaded: boolean }) {
  return (
    <Card style={styles.section}>
      <Text style={styles.sectionTitle}>__hupi_i18n:common.paymentReceipt</Text>
      <Pressable onPress={onLoad} style={styles.uploadBox}>
        <Ionicons color={proofLoaded ? colors.success : colors.secondary} name={proofLoaded ? 'checkmark-circle-outline' : 'image-outline'} size={24} />
        <Text style={styles.uploadText}>{proofLoaded ? 'Comprobante cargado' : 'Subir comprobante'}</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 42 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: colors.text, fontSize: 25, fontWeight: '900' },
  totalCard: { marginTop: 20, shadowOpacity: 0 },
  totalLabel: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  total: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 5 },
  section: { marginTop: 14, gap: 10, shadowOpacity: 0.04 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  productLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 23 },
  productCopy: { flex: 1 },
  productName: { color: colors.text, fontSize: 13, fontWeight: '900' },
  productMeta: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  bankBox: { borderRadius: 14, backgroundColor: colors.soft, padding: 11, gap: 7 },
  infoRow: { flexDirection: 'row', gap: 10 },
  infoLabel: { width: 105, color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  infoValue: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '900', textAlign: 'right' },
  copyButton: { alignSelf: 'flex-start', minHeight: 36, borderRadius: 999, backgroundColor: colors.secondarySoft, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12 },
  copyText: { color: colors.secondary, fontSize: 13, fontWeight: '900' },
  mockText: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  instruction: { color: colors.text, fontSize: 13, lineHeight: 22, fontWeight: '800' },
  uploadBox: { minHeight: 76, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 6 },
  uploadText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  warning: { color: colors.primary, fontSize: 13, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  actions: { gap: 10, marginTop: 16 },
});
