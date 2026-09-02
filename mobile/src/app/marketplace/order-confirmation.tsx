import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useLocalSearchParams,
  useRouter } from 'expo-router';
import { useEffect,
  useState } from 'react';
import { StyleSheet,
} from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HupiPagesLogo } from '@/components/HupiPagesLogo';
import { ScreenContainer } from '@/components/ScreenContainer';
import { formatMarketplaceCurrency } from '@/components/marketplace/ProductPriceBlock';
import { colors } from '@/constants/colors';
import { getProductLegacyVariations } from '@/constants/marketplaceStoreState';
import { mockBillingProfiles, mockCart, mockOrders, mockProducts } from '@/constants/mockData';
import { playHupiSuccessSound } from '@/utils/hupiSound';
import { Text } from '@/i18n/components';

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const { address, billingEmail, billingIdNumber, billingIdType, billingName, billingType, coupon, couponDiscount, donation, payment, shipping, skipSound, status, total } = useLocalSearchParams<{
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
    skipSound?: string;
    status?: string;
    total?: string;
  }>();
  const [receiptMessage, setReceiptMessage] = useState(false);
  const [soundFeedback, setSoundFeedback] = useState(false);
  const order = mockOrders[0];
  const donationAmount = Number(donation ?? order.donation);
  const totalPaid = Number(total ?? order.totalPaid);
  const couponCode = coupon ? decodeURIComponent(coupon) : '';
  const couponDiscountValue = Number(couponDiscount ?? 0);
  const paymentMethod = payment ? decodeURIComponent(payment) : order.paymentMethod;
  const deliveryAddress = address ? decodeURIComponent(address) : order.address;
  const shippingMethod = shipping ? decodeURIComponent(shipping) : 'Envío estándar · $2.50';
  const fallbackBilling = mockBillingProfiles[0];
  const billingProfile = {
    taxpayerType: billingType ? decodeURIComponent(billingType) : fallbackBilling.taxpayerType,
    identificationType: billingIdType ? decodeURIComponent(billingIdType) : fallbackBilling.identificationType,
    identificationNumber: billingIdNumber ? decodeURIComponent(billingIdNumber) : fallbackBilling.identificationNumber,
    nameOrBusinessName: billingName ? decodeURIComponent(billingName) : fallbackBilling.nameOrBusinessName,
    billingEmail: billingEmail ? decodeURIComponent(billingEmail) : fallbackBilling.billingEmail,
  };
  const pendingProof = status === 'pending';
  const confirmedProducts = mockCart.items.map((item) => ({
    ...item,
    product: mockProducts.find((product) => product.id === item.productId) ?? mockProducts[0],
  }));

  useEffect(() => {
    if (!pendingProof) {
      if (skipSound !== '1') {
        playHupiSuccessSound();
      }
      setSoundFeedback(true);
    }
  }, [pendingProof, skipSound]);

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.successIcon}>
        <Ionicons color={colors.white} name={pendingProof ? 'time-outline' : 'checkmark'} size={42} />
      </View>
      <Text style={styles.title}>{pendingProof ? 'Pendiente de comprobante' : 'Pedido confirmado'}</Text>
      <Text style={styles.subtitle}>
        {pendingProof
          ? 'Tu pedido fue registrado, pero debes cargar el comprobante para completar la compra.'
          : 'Tu compra fue registrada correctamente'}
      </Text>
      {soundFeedback ? (
        <View style={styles.soundFeedback}>
          <Ionicons color={colors.primary} name="volume-medium-outline" size={16} />
          <Text style={styles.soundFeedbackText}>__hupi_i18n:marketplace.checkout.confirmedOrder</Text>
        </View>
      ) : null}

      <Card style={styles.orderCard}>
        <Text style={styles.orderLabel}>__hupi_i18n:common.orderNumber</Text>
        <Text style={styles.orderId}>{order.id}</Text>
      </Card>

      <Card style={styles.summary}>
        <Text style={styles.sectionTitle}>__hupi_i18n:common.summary</Text>
        <View style={styles.confirmedProducts}>
          {confirmedProducts.map((item) => (
            <ConfirmedProductRow
              brand={item.product.brand}
              color={item.product.color}
              emoji={item.product.emoji}
              key={item.id}
              name={item.product.name}
              quantity={item.quantity}
              variation={getProductLegacyVariations(item.product).size?.[0]}
            />
          ))}
        </View>
        <SummaryRow label="__hupi_i18n:common.totalPaid" value={formatMarketplaceCurrency(totalPaid)} />
        {couponCode ? <SummaryRow label={`Cupón ${couponCode}`} value={`-${formatMarketplaceCurrency(couponDiscountValue)}`} /> : null}
        <SummaryRow label="__hupi_i18n:common.donation" value={formatMarketplaceCurrency(donationAmount)} />
        <SummaryRow label="__hupi_i18n:common.shippingMethod" value={shippingMethod} />
        <SummaryRow label="__hupi_i18n:common.address" value={deliveryAddress} />
        <SummaryRow label="__hupi_i18n:common.paymentMethod" value={paymentMethod} />
        <View style={styles.billingBox}>
          <Text style={styles.billingTitle}>__hupi_i18n:common.billingInformation</Text>
          <SummaryRow label="__hupi_i18n:common.type" value={billingProfile.taxpayerType} />
          <SummaryRow
            label="__hupi_i18n:common.identification"
            value={`${billingProfile.identificationType} ${billingProfile.identificationNumber}`}
          />
          <SummaryRow label="__hupi_i18n:common.nameReason" value={billingProfile.nameOrBusinessName} />
          <SummaryRow label="__hupi_i18n:common.mail" value={billingProfile.billingEmail} />
        </View>
      </Card>

      {pendingProof ? (
        <Card style={styles.pendingCard} tone="soft">
          <Ionicons color={colors.secondary} name="document-attach-outline" size={23} />
          <View style={styles.pendingCopy}>
            <Text style={styles.pendingTitle}>__hupi_i18n:marketplace.order-confirmation.paymentReceiptPending</Text>
            <Text style={styles.pendingText}>__hupi_i18n:marketplace.order-confirmation.theReceiptWillBeAvailableWhenTheVoucherIs</Text>
          </View>
        </Card>
      ) : (
        <Card style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <View>
              <Text style={styles.sectionTitle}>__hupi_i18n:common.purchaseReceipt</Text>
              <Text style={styles.receiptMeta}>__hupi_i18n:marketplace.order-confirmation.availableForDownload</Text>
            </View>
            <HupiPagesLogo height={34} width={106} />
          </View>
          <SummaryRow label="__hupi_i18n:common.receipt" value={order.receiptNumber} />
          <SummaryRow label="__hupi_i18n:common.date" value={order.receiptDate} />
          <SummaryRow label="__hupi_i18n:common.totalPaid" value={formatMarketplaceCurrency(totalPaid)} />
          {couponCode ? <SummaryRow label={`Cupón ${couponCode}`} value={`-${formatMarketplaceCurrency(couponDiscountValue)}`} /> : null}
          <SummaryRow label="__hupi_i18n:common.method" value={paymentMethod} />
          <View style={styles.billingBox}>
            <Text style={styles.billingTitle}>__hupi_i18n:common.billing</Text>
            <SummaryRow label="__hupi_i18n:common.type" value={billingProfile.taxpayerType} />
            <SummaryRow
              label="__hupi_i18n:common.identification"
              value={`${billingProfile.identificationType} ${billingProfile.identificationNumber}`}
            />
            <SummaryRow label="__hupi_i18n:common.nameReason" value={billingProfile.nameOrBusinessName} />
            <SummaryRow label="__hupi_i18n:common.mail" value={billingProfile.billingEmail} />
          </View>
          <Button
            icon="download-outline"
            onPress={() => setReceiptMessage(true)}
            title="__hupi_i18n:common.downloadReceipt"
            variant="outline"
          />
          {receiptMessage ? (
            <View style={styles.receiptToast}>
              <Ionicons color={colors.primary} name="document-text-outline" size={17} />
              <Text style={styles.receiptToastText}>__hupi_i18n:marketplace.order-confirmation.preparedReceiptPdfDownloadWillBeEnabledWhenBilling</Text>
            </View>
          ) : null}
        </Card>
      )}

      <Card style={styles.infoCard} tone="soft">
        <Ionicons color={colors.secondary} name="notifications-outline" size={22} />
        <View style={styles.infoCopy}>
          <Text style={styles.infoText}>__hupi_i18n:bookings.booking-confirmation.youWillReceiveConfirmationByEmailAndNotificationIn</Text>
          {!pendingProof ? <Text style={styles.infoText}>__hupi_i18n:marketplace.order-confirmation.weWillSendTheReceiptWithTheHupiLogo</Text> : null}
          <Text style={styles.infoText}>__hupi_i18n:marketplace.order-confirmation.youCanFollowTheStatusOfYourOrderFrom</Text>
        </View>
      </Card>

      <View style={styles.actions}>
        {pendingProof ? (
          <>
            <Button
              icon="cloud-upload-outline"
              onPress={() => router.push(
                `${paymentMethod === 'Deuna' ? '/marketplace/payment-deuna' : '/marketplace/payment-transfer'}?donation=${donation ?? 0}&total=${totalPaid.toFixed(2)}&payment=${encodeURIComponent(paymentMethod)}&address=${encodeURIComponent(deliveryAddress)}&shipping=${encodeURIComponent(shippingMethod)}&billingType=${encodeURIComponent(billingProfile.taxpayerType)}&billingIdType=${encodeURIComponent(billingProfile.identificationType)}&billingIdNumber=${encodeURIComponent(billingProfile.identificationNumber)}&billingName=${encodeURIComponent(billingProfile.nameOrBusinessName)}&billingEmail=${encodeURIComponent(billingProfile.billingEmail)}${couponCode ? `&coupon=${encodeURIComponent(couponCode)}&couponDiscount=${couponDiscountValue.toFixed(2)}` : ''}` as Href,
              )}
              title="__hupi_i18n:common.uploadReceipt"
            />
            <Button
              icon="receipt-outline"
              onPress={() => router.push('/marketplace/orders')}
              title="__hupi_i18n:common.seeMyPurchases"
              variant="outline"
            />
          </>
        ) : (
          <>
            <Button
              icon="receipt-outline"
              onPress={() => router.push('/marketplace/orders')}
              title="__hupi_i18n:common.seeMyPurchases"
            />
            <Button
              icon="navigate-outline"
              onPress={() => router.push(`/marketplace/order-tracking?orderId=${order.id}` as Href)}
              title="__hupi_i18n:common.seeTracking"
              variant="outline"
            />
          </>
        )}
        <Button
          icon="bag-handle-outline"
          onPress={() => router.push('/marketplace')}
          title="__hupi_i18n:marketplace.order-confirmation.returnToTheMarketplace"
          variant="outline"
        />
      </View>
    </ScreenContainer>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function ConfirmedProductRow({
  brand,
  color,
  emoji,
  name,
  quantity,
  variation,
}: {
  brand: string;
  color: string;
  emoji: string;
  name: string;
  quantity: number;
  variation?: string;
}) {
  return (
    <View style={styles.productRow}>
      <View style={[styles.productThumb, { backgroundColor: color }]}>
        <Text style={styles.productEmoji}>{emoji}</Text>
      </View>
      <View style={styles.productCopy}>
        <Text numberOfLines={2} style={styles.productName}>{name}</Text>
        <Text numberOfLines={1} style={styles.productMeta}>
          {brand}{variation ? ` · ${variation}` : ''}  __hupi_i18n:common.quantity {quantity}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 26, paddingBottom: 42, alignItems: 'center' },
  successIcon: {
    width: 82,
    height: 82,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 20, textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 7, textAlign: 'center' },
  soundFeedback: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, backgroundColor: colors.primarySoft, paddingHorizontal: 12, paddingVertical: 8, marginTop: 12 },
  soundFeedbackText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  orderCard: { width: '100%', alignItems: 'center', marginTop: 22, shadowOpacity: 0.05 },
  orderLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  orderId: { color: colors.secondary, fontSize: 20, fontWeight: '900', marginTop: 5 },
  summary: { width: '100%', gap: 10, marginTop: 14, shadowOpacity: 0.04 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: 2 },
  confirmedProducts: { gap: 9 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  productThumb: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  productEmoji: { fontSize: 26 },
  productCopy: { flex: 1 },
  productName: { color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '900' },
  productMeta: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 3 },
  row: { width: '100%', flexDirection: 'row', gap: 12 },
  label: { width: 92, color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  value: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '900', textAlign: 'right' },
  receiptCard: { width: '100%', gap: 10, marginTop: 14, shadowOpacity: 0.04 },
  receiptHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  receiptMeta: { color: colors.textMuted, fontSize: 12, fontWeight: '800', marginTop: 3 },
  billingBox: { borderRadius: 14, backgroundColor: colors.soft, gap: 8, padding: 11, marginTop: 4 },
  billingTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  receiptToast: {
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  receiptToastText: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 19, fontWeight: '800' },
  pendingCard: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 14, shadowOpacity: 0 },
  pendingCopy: { flex: 1 },
  pendingTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  pendingText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 4 },
  infoCard: { width: '100%', flexDirection: 'row', gap: 11, marginTop: 14, shadowOpacity: 0 },
  infoCopy: { flex: 1, gap: 6 },
  infoText: { color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '700' },
  actions: { width: '100%', gap: 10, marginTop: 22 },
});
