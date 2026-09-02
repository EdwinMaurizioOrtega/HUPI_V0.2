import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useLocalSearchParams,
  useRouter } from 'expo-router';
import { useEffect,
  useMemo,
  useRef,
  useState } from 'react';
import { Modal,
  ScrollView,
  StyleSheet,
  View as NativeView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { AddressEditor } from '@/components/addresses/AddressEditor';
import { AddressPreferencesSummary } from '@/components/addresses/AddressPreferencesEditor';
import { Card } from '@/components/Card';
import { HupiSuccessModal } from '@/components/HupiSuccessModal';
import { ScreenContainer } from '@/components/ScreenContainer';
import { OrderSummaryCard } from '@/components/marketplace/OrderSummaryCard';
import { formatMarketplaceCurrency } from '@/components/marketplace/ProductPriceBlock';
import { ShippingMethodCard } from '@/components/marketplace/ShippingMethodCard';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { clearReservedCouponCode, getReservedCouponCode } from '@/constants/marketplaceCouponState';
import { getCustomerHupiBalance, useCustomerHupiBalanceForPurchase } from '@/constants/marketplaceIssuesState';
import {
  getMarketplaceItemAvailability,
  getMarketplaceProductForCart,
  getProductDisplayPrice,
  getProductLegacyVariations,
  getPublicShippingMethodsForStoreIds,
  purchaseMarketplaceCartItems,
  validateMarketplaceCartItems,
  type MarketplaceCartLikeItem,
} from '@/constants/marketplaceStoreState';
import {
  mockBillingProfiles,
  mockCart,
  mockCoupons,
} from '@/constants/mockData';
import { playHupiSuccessSound } from '@/utils/hupiSound';
import { Pressable, Text, TextInput } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';
import { useLocalAccount } from '@/hooks/useLocalAccount';
import { createEmptyAddress, type Address } from '@/domain/address';
import { deleteLocalAddress, saveLocalAddress } from '@/data/localAccountRepository';
import { syncCreateOrder } from '@/data/remoteWrites';

const paymentMethods = ['Tarjeta terminada en 4242', 'Transferencia bancaria', 'Deuna'];
const donations = [0, 1, 2, 5, 3];

/** Etiquetas visibles a los valores del enum del backend. */
function toBackendPaymentMethod(label: string) {
  if (label === 'Transferencia bancaria') return 'bank_transfer';
  if (label === 'Deuna') return 'deuna';
  if (label === 'Saldo Hupi') return 'hupi_balance';
  return 'card';
}

function toBackendShippingMethod(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes('retiro') || normalized.includes('tienda')) return 'pickup';
  if (normalized.includes('express') || normalized.includes('urgente')) return 'express';
  return 'standard';
}

type BillingProfile = typeof mockBillingProfiles[number];
type PriceMode = 'card' | 'transfer';

export default function MarketplaceCheckoutScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useTheme();
  const { addresses: accountAddresses } = useLocalAccount();
  const darkMode = resolvedTheme === 'dark';
  const scrollRef = useRef<ScrollView>(null);
  const [summaryY, setSummaryY] = useState(0);
  const { coupon, productId, quantity, variationId } = useLocalSearchParams<{ coupon?: string; productId?: string; quantity?: string; variationId?: string }>();
  const [shippingMethodId, setShippingMethodId] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);
  const [savePayment, setSavePayment] = useState(true);
  const [donation, setDonation] = useState(1);
  const initialAddress = accountAddresses.find((address) => address.isDefault) ?? accountAddresses[0] ?? createEmptyAddress();
  const [addresses, setAddresses] = useState<Address[]>(accountAddresses.length > 0 ? accountAddresses : [initialAddress]);
  const [selectedAddressId, setSelectedAddressId] = useState(initialAddress.id);
  const [addressFormVisible, setAddressFormVisible] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<Address>(initialAddress);
  const [saveAddress, setSaveAddress] = useState(true);
  const [addressNotice, setAddressNotice] = useState<string | null>(null);
  const [billingProfiles, setBillingProfiles] = useState<BillingProfile[]>(mockBillingProfiles);
  const [selectedBillingId, setSelectedBillingId] = useState(mockBillingProfiles[0].id);
  const [billingFormVisible, setBillingFormVisible] = useState(false);
  const [editingBillingId, setEditingBillingId] = useState<string | null>(null);
  const [billingForm, setBillingForm] = useState<BillingProfile>(mockBillingProfiles[0]);
  const [billingNotice, setBillingNotice] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState([paymentMethods[0]]);
  const [cardFormVisible, setCardFormVisible] = useState(false);
  const [cardForm, setCardForm] = useState({
    name: 'Ana Paredes',
    number: '4242 4242 4242 4242',
    expiry: '12/29',
    cvv: '123',
  });
  const [saveCard, setSaveCard] = useState(true);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState(coupon ? decodeURIComponent(coupon) : '');
  const [appliedCoupon, setAppliedCoupon] = useState<typeof mockCoupons[number] | null>(null);
  const [couponNotice, setCouponNotice] = useState<string | null>(null);
  const [couponExpanded, setCouponExpanded] = useState(false);
  const [couponSkipped, setCouponSkipped] = useState(false);
  const [reservedCouponCode, setReservedCouponCodeState] = useState(getReservedCouponCode());
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptData, setAcceptData] = useState(false);
  const [legalModal, setLegalModal] = useState<'terms' | 'data' | null>(null);
  const [legalNotice, setLegalNotice] = useState<string | null>(null);
  const [checkoutModal, setCheckoutModal] = useState<{ description: string; reference?: string; title: string } | null>(null);
  const [applyHupiBalance, setApplyHupiBalance] = useState(false);
  const [walletSuccessVisible, setWalletSuccessVisible] = useState(false);
  const [pendingConfirmationUrl, setPendingConfirmationUrl] = useState<Href | null>(null);
  const [checkoutItems, setCheckoutItems] = useState<MarketplaceCartLikeItem[]>(() => {
    if (productId) {
      return [{
        id: 'buy-now',
        productId,
        quantity: Math.max(1, Number(quantity ?? 1) || 1),
        variationId,
      }];
    }

    return mockCart.items;
  });

  const selectedAddress = addresses.find((address) => address.id === selectedAddressId) ?? addresses[0];
  const selectedBilling = billingProfiles.find((profile) => profile.id === selectedBillingId) ?? billingProfiles[0];
  const isCardPayment = paymentMethod.startsWith('Tarjeta');
  const hupiBalance = getCustomerHupiBalance();
  const priceMode: PriceMode = isCardPayment ? 'card' : 'transfer';
  const usesTransferPrice = priceMode === 'transfer';

  const cartProducts = useMemo(() => {
    return checkoutItems.map((item) => ({
      ...item,
      availability: getMarketplaceItemAvailability(item),
      product: getMarketplaceProductForCart(item.productId),
    }));
  }, [checkoutItems]);
  const checkoutValidation = useMemo(() => validateMarketplaceCartItems(checkoutItems), [checkoutItems]);
  const validCheckoutItems = useMemo(() => cartProducts.filter((item) => (
    item.availability.available && item.quantity <= item.availability.stock
  )), [cartProducts]);
  const invalidCheckoutItems = cartProducts.filter((item) => !validCheckoutItems.some((validItem) => validItem.id === item.id));
  const hasCheckoutItems = cartProducts.length > 0;
  const hasValidProducts = validCheckoutItems.length > 0;
  const availableShippingMethods = useMemo(() => (
    getPublicShippingMethodsForStoreIds([...new Set(cartProducts.map((item) => item.product.storeId))])
  ), [cartProducts]);
  const fallbackShippingMethod = availableShippingMethods[0] ?? {
    id: 'none',
    title: 'Sin método disponible',
    estimate: 'Activa un método de envío compatible',
    price: 0,
  };
  const shippingMethod = availableShippingMethods.find((item) => item.id === shippingMethodId) ?? fallbackShippingMethod;
  const shippingAvailable = availableShippingMethods.some((method) => method.id === shippingMethodId);

  const subtotal = cartProducts.reduce((totalValue, item) => {
    const display = getProductDisplayPrice(item.product, item.availability.variation?.selectedOptions);
    const unitPrice = usesTransferPrice ? display.transferPrice : item.availability.price;
    return totalValue + unitPrice * item.quantity;
  }, 0);
  const cardSubtotal = cartProducts.reduce((totalValue, item) => totalValue + getProductDisplayPrice(item.product).priceCurrent * item.quantity, 0);
  const transferSavings = Math.max(0, cardSubtotal - subtotal);
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) {
      return 0;
    }

    if (appliedCoupon.discountType === 'percentage') {
      return Number((subtotal * (appliedCoupon.value / 100)).toFixed(2));
    }

    if (appliedCoupon.discountType === 'fixed') {
      return Math.min(appliedCoupon.value, subtotal);
    }

    return 0;
  }, [appliedCoupon, subtotal]);
  const effectiveShipping = cartProducts.length === 0 ? 0 : appliedCoupon?.discountType === 'free_shipping' ? 0 : shippingMethod.price;
  const orderDiscount = cartProducts.length > 0 ? mockCart.discount : 0;
  const totalBeforeHupiBalance = Math.max(0, subtotal + effectiveShipping - orderDiscount - couponDiscount + (cartProducts.length > 0 ? donation : 0));
  const hupiBalanceApplied = applyHupiBalance ? Math.min(hupiBalance.available, totalBeforeHupiBalance) : 0;
  const total = Math.max(0, Number((totalBeforeHupiBalance - hupiBalanceApplied).toFixed(2)));
  const paidOnlyWithHupiBalance = applyHupiBalance && hupiBalanceApplied > 0 && total === 0;
  const priceLabel = usesTransferPrice ? 'Transferencia' : 'Tarjeta';
  const addressSummary = `${selectedAddress.label}: ${selectedAddress.streetAddress}`;
  const canConfirmPurchase = hasCheckoutItems && checkoutValidation.valid && acceptTerms && acceptData;

  useEffect(() => {
    if (accountAddresses.length === 0) return;
    setAddresses(accountAddresses);
    setSelectedAddressId((current) => accountAddresses.some((address) => address.id === current)
      ? current
      : (accountAddresses.find((address) => address.isDefault) ?? accountAddresses[0]).id);
  }, [accountAddresses]);

  useEffect(() => {
    if (!shippingAvailable && availableShippingMethods.length > 0) {
      setShippingMethodId(availableShippingMethods[0].id);
    }
  }, [availableShippingMethods, shippingAvailable]);

  const confirmPurchase = () => {    if (cartProducts.length === 0) {
      setCheckoutModal({
        title: 'No hay productos para pagar',
        description: 'Tu carrito está vacío o no tienes productos disponibles para continuar.',
      });
      return;
    }

    if (availableShippingMethods.length === 0) {
      setLegalNotice('No hay métodos de envío habilitados para este carrito.');
      return;
    }

    if (!selectedAddress?.streetAddress.trim()) {
      setCheckoutModal({
        title: 'Falta dirección',
        description: 'Agrega una dirección para continuar.',
      });
      return;
    }

    if (!paymentMethod && !paidOnlyWithHupiBalance) {
      setCheckoutModal({
        title: 'Falta método de pago',
        description: 'Selecciona un método de pago o usa Saldo Hupi para continuar.',
      });
      return;
    }

    const cartValidation = validateMarketplaceCartItems(cartProducts.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      variationId: item.variationId,
    })));

    if (!cartValidation.valid) {
      setCheckoutModal({
        title: 'Revisa tu carrito',
        description: 'Algunos productos ya no están disponibles o superan el stock actual.',
        reference: cartValidation.issues.map((issue) => `${issue.productName}: ${issue.message}`).join('\n'),
      });
      return;
    }

    if (!isBillingProfileComplete(selectedBilling)) {
      setCheckoutModal({
        title: 'Faltan datos de facturación',
        description: 'Completa tus datos para continuar.',
      });
      return;
    }

    if (!acceptTerms || !acceptData) {
      setLegalNotice('Debes aceptar los términos y la política de datos para continuar.');
      return;
    }

    const billingParams = `billingType=${encodeURIComponent(selectedBilling.taxpayerType)}&billingIdType=${encodeURIComponent(selectedBilling.identificationType)}&billingIdNumber=${encodeURIComponent(selectedBilling.identificationNumber)}&billingName=${encodeURIComponent(selectedBilling.nameOrBusinessName)}&billingEmail=${encodeURIComponent(selectedBilling.billingEmail)}`;
    const shippingSummary = `${shippingMethod.title} · ${formatMarketplaceCurrency(effectiveShipping)}`;
    const couponParams = appliedCoupon ? `&coupon=${encodeURIComponent(appliedCoupon.code)}&couponDiscount=${couponDiscount.toFixed(2)}` : '';
    const mockOrderNumber = 'HUPI-MK-2060';
    if (hupiBalanceApplied > 0) {
      useCustomerHupiBalanceForPurchase(mockOrderNumber, hupiBalanceApplied);
    }
    purchaseMarketplaceCartItems(cartProducts.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      variationId: item.variationId,
    })));
    const finalPaymentMethod = paidOnlyWithHupiBalance ? 'Saldo Hupi' : paymentMethod;

    syncCreateOrder({
      paymentMethod: toBackendPaymentMethod(finalPaymentMethod),
      shippingMethod: toBackendShippingMethod(shippingMethod.title),
      donation,
      useHupiBalance: applyHupiBalance,
      deliveryAddressSnapshot: selectedAddress,
      billingProfileSnapshot: selectedBilling,
    });
    const walletParams = `&hupiBalanceApplied=${hupiBalanceApplied.toFixed(2)}&totalBeforeBalance=${totalBeforeHupiBalance.toFixed(2)}`;
    const params = `donation=${donation}&total=${total.toFixed(2)}&payment=${encodeURIComponent(finalPaymentMethod)}&address=${encodeURIComponent(addressSummary)}&shipping=${encodeURIComponent(shippingSummary)}&${billingParams}${couponParams}${walletParams}`;

    if (paidOnlyWithHupiBalance) {
      playHupiSuccessSound();
      const url = `/marketplace/order-confirmation?${params}&status=confirmed&skipSound=1` as Href;
      setPendingConfirmationUrl(url);
      setWalletSuccessVisible(true);
      return;
    }

    if (paymentMethod === 'Transferencia bancaria') {
      router.push(`/marketplace/payment-transfer?${params}` as Href);
      return;
    }

    if (paymentMethod === 'Deuna') {
      router.push(`/marketplace/payment-deuna?${params}` as Href);
      return;
    }

    router.push(
      `/marketplace/order-confirmation?${params}&status=confirmed` as Href,
    );
  };

  const removeCheckoutItem = (itemId: string) => {
    setCheckoutItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  };

  const removeUnavailableCheckoutItems = () => {
    const nextItems = validCheckoutItems;
    setCheckoutItems(nextItems.map(({ id, productId: itemProductId, quantity: itemQuantity, variationId: itemVariationId }) => ({
      id,
      productId: itemProductId,
      quantity: itemQuantity,
      variationId: itemVariationId,
    })));
  };

  const payAvailableProducts = () => {
    if (validCheckoutItems.length === 0) {
      setCheckoutItems([]);
      setCheckoutModal({
        title: 'No hay productos para pagar',
        description: 'Tu carrito está vacío o no tienes productos disponibles para continuar.',
      });
      return;
    }

    setCheckoutItems(validCheckoutItems.map(({ id, productId: itemProductId, quantity: itemQuantity, variationId: itemVariationId }) => ({
      id,
      productId: itemProductId,
      quantity: itemQuantity,
      variationId: itemVariationId,
    })));
    setCheckoutModal({
      title: 'Productos disponibles',
      description: 'Puedes continuar solo con los productos disponibles.',
    });
  };

  const selectPriceMode = (mode: PriceMode) => {
    setPaymentMethod(mode === 'card' ? (savedCards[0] ?? paymentMethods[0]) : paymentMethods[1]);
  };

  const selectPaymentMethod = (method: string) => {
    setPaymentMethod(method);
  };

  const openNewAddressForm = () => {
    setEditingAddressId(null);
    setAddressForm(createEmptyAddress());
    setSaveAddress(true);
    setAddressNotice(null);
    setAddressFormVisible(true);
  };

  const openEditAddressForm = (address: Address = selectedAddress) => {
    setSelectedAddressId(address.id);
    setEditingAddressId(address.id);
    setAddressForm(address);
    setSaveAddress(true);
    setAddressNotice(null);
    setAddressFormVisible(true);
  };

  const removeAddressMock = (addressId: string) => {
    setAddresses((currentAddresses) => {
      if (currentAddresses.length <= 1) {
        return currentAddresses;
      }

      const nextAddresses = currentAddresses.filter((address) => address.id !== addressId);
      if (selectedAddressId === addressId) {
        setSelectedAddressId(nextAddresses[0].id);
      }
      return nextAddresses;
    });
    if (accountAddresses.some((address) => address.id === addressId)) {
      deleteLocalAddress(addressId);
    }
    setAddressNotice('Dirección eliminada.');
    if (editingAddressId === addressId) {
      setAddressFormVisible(false);
    }
  };

  const useAddressForm = (nextAddress: Address) => {
    const normalizedAddress = {
      ...nextAddress,
      id: editingAddressId ?? (nextAddress.id || `checkout-address-${Date.now()}`),
    };

    if (saveAddress) {
      const savedAddresses = saveLocalAddress(normalizedAddress);
      const savedAddress = savedAddresses.find((address) => (
        editingAddressId ? address.id === editingAddressId : address.updatedAt === normalizedAddress.updatedAt
      )) ?? savedAddresses[savedAddresses.length - 1];
      setAddresses(savedAddresses);
      setSelectedAddressId(savedAddress?.id ?? normalizedAddress.id);
    } else {
      setAddresses((currentAddresses) => {
        const exists = currentAddresses.some((address) => address.id === normalizedAddress.id);
        return exists
          ? currentAddresses.map((address) => (address.id === normalizedAddress.id ? normalizedAddress : address))
          : [...currentAddresses, normalizedAddress];
      });
      setSelectedAddressId(normalizedAddress.id);
    }

    setAddressFormVisible(false);
    setAddressNotice(null);
  };

  const openNewBillingForm = () => {
    setEditingBillingId(null);
    setBillingForm({
      id: `billing-${Date.now()}`,
      taxpayerType: 'Persona Natural',
      identificationType: 'Cédula',
      identificationNumber: '',
      nameOrBusinessName: '',
      billingEmail: '',
      contactPhone: '+593 99 000 0000',
      fiscalAddress: '',
    });
    setBillingNotice(null);
    setBillingFormVisible(true);
  };

  const openEditBillingForm = (profile: BillingProfile) => {
    setSelectedBillingId(profile.id);
    setEditingBillingId(profile.id);
    setBillingForm(profile);
    setBillingNotice(null);
    setBillingFormVisible(true);
  };

  const removeBillingMock = (profileId: string) => {
    setBillingProfiles((currentProfiles) => {
      if (currentProfiles.length <= 1) {
        return currentProfiles;
      }

      const nextProfiles = currentProfiles.filter((profile) => profile.id !== profileId);
      if (selectedBillingId === profileId) {
        setSelectedBillingId(nextProfiles[0].id);
      }
      return nextProfiles;
    });
    setBillingNotice('Datos de facturación eliminados.');
    if (editingBillingId === profileId) {
      setBillingFormVisible(false);
    }
  };

  const useBillingForm = () => {
    const normalizedBilling = {
      ...billingForm,
      id: editingBillingId ?? billingForm.id,
      identificationType: billingForm.taxpayerType === 'Persona Jurídica' ? 'RUC' : billingForm.identificationType,
    };

    if (!isBillingProfileComplete(normalizedBilling)) {
      setCheckoutModal({
        title: 'Faltan datos de facturación',
        description: 'Completa tus datos para continuar.',
      });
      return;
    }

    setBillingProfiles((currentProfiles) => {
      const exists = currentProfiles.some((profile) => profile.id === normalizedBilling.id);
      return exists
        ? currentProfiles.map((profile) => (profile.id === normalizedBilling.id ? normalizedBilling : profile))
        : [...currentProfiles, normalizedBilling];
    });
    setSelectedBillingId(normalizedBilling.id);
    setBillingFormVisible(false);
    setBillingNotice(null);
  };

  const updateBillingField = (field: keyof BillingProfile, value: string) => {
    setBillingForm((currentForm) => {
      if (field === 'taxpayerType') {
        return {
          ...currentForm,
          taxpayerType: value,
          identificationType: value === 'Persona Jurídica' ? 'RUC' : currentForm.identificationType,
        };
      }

      return { ...currentForm, [field]: value };
    });
  };

  const removeCardMock = (card: string) => {
    setSavedCards((currentCards) => currentCards.filter((item) => item !== card));
    if (paymentMethod === card) {
      setPaymentMethod(paymentMethods[1]);
    }
    setPaymentNotice('Tarjeta eliminada.');
  };

  const useCardForm = () => {
    const lastDigits = cardForm.number.replace(/\D/g, '').slice(-4) || '0000';
    const cardLabel = `Tarjeta terminada en ${lastDigits}`;
    if (saveCard) {
      setSavedCards((currentCards) => (
        currentCards.includes(cardLabel) ? currentCards : [...currentCards, cardLabel]
      ));
    }
    setPaymentMethod(cardLabel);
    setCardFormVisible(false);
    setPaymentNotice(null);
  };

  const applyCouponCode = (rawCode: string, successMessage = 'Cupón aplicado correctamente.') => {
    const normalizedCode = rawCode.trim().toUpperCase();
    const coupon = mockCoupons.find((item) => item.code === normalizedCode && item.status === 'Disponible');

    if (!coupon) {
      setAppliedCoupon(null);
      setCouponNotice('Cupón no válido o expirado.');
      return;
    }

    setAppliedCoupon(coupon);
    setCouponCode(coupon.code);
    setCouponNotice(successMessage);
    setCouponExpanded(false);
    setCouponSkipped(false);
    if (reservedCouponCode === coupon.code) {
      clearReservedCouponCode();
      setReservedCouponCodeState(null);
    }
  };

  const applyCoupon = () => {
    if (!couponCode.trim()) {
      setAppliedCoupon(null);
      setCouponNotice(null);
      setCouponSkipped(true);
      setCouponExpanded(false);
      return;
    }

    applyCouponCode(couponCode);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponNotice('Cupón removido.');
  };

  useEffect(() => {
    if (coupon) {
      applyCouponCode(decodeURIComponent(coupon), 'Cupón aplicado a tu pedido actual.');
    }
  }, [coupon]);

  return (
    <ScreenContainer contentContainerStyle={styles.screen} scroll={false}>
      {hasCheckoutItems && !checkoutValidation.valid ? (
        <Pressable onPress={() => scrollRef.current?.scrollTo({ y: Math.max(0, summaryY - 18), animated: true })} style={styles.stickyProblemBanner}>
          <View style={styles.stickyIcon}><Ionicons color={colors.primary} name="alert-circle-outline" size={20} /></View>
          <View style={styles.stickyCopy}>
            <Text style={styles.stickyTitle}>__hupi_i18n:marketplace.cart.checkYourCart</Text>
            <Text style={styles.stickyText}>__hupi_i18n:marketplace.cart.youCannotContinueBecauseThereAreProductsOutOf</Text>
          </View>
          <Text style={styles.stickyCta}>__hupi_i18n:marketplace.cart.seeProductsToCorrect</Text>
        </Pressable>
      ) : null}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 180 + Math.max(insets.bottom, 12) },
        ]}
        keyboardShouldPersistTaps="handled"
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topbar}>
          <Pressable accessibilityLabel="__hupi_i18n:common.back" onPress={() => router.back()} style={styles.backButton}>
            <Ionicons color={colors.text} name="arrow-back" size={22} />
          </Pressable>
          <View style={styles.heading}>
            <Text style={styles.title}>__hupi_i18n:common.checkout</Text>
            <Text style={styles.subtitle}>__hupi_i18n:marketplace.checkout.buyMarketplaceInTrialMode</Text>
          </View>
        </View>

        <View onLayout={(event) => setSummaryY(event.nativeEvent.layout.y)}>
        <Card style={styles.section}>
          <NumberedTitle number={1} title="__hupi_i18n:common.orderSummary" />
          {!hasCheckoutItems ? (
            <View style={styles.emptyCheckoutCard}>
              <View style={styles.emptyCheckoutIcon}>
                <Ionicons color={colors.secondary} name="bag-handle-outline" size={24} />
              </View>
              <Text style={styles.emptyCheckoutTitle}>__hupi_i18n:marketplace.checkout.thereAreNoProductsToPay</Text>
              <Text style={styles.emptyCheckoutText}>__hupi_i18n:marketplace.checkout.yourCartIsEmptyOrYouHaveNoProducts</Text>
              <Button icon="cart-outline" onPress={() => router.push('/marketplace/cart')} title="__hupi_i18n:marketplace.checkout.returnToCart" variant="outline" />
            </View>
          ) : null}
          {cartProducts.map((item, index) => {
            const display = getProductDisplayPrice(item.product);
            const unitPrice = usesTransferPrice ? display.transferPrice : display.priceCurrent;
            const legacyVariations = getProductLegacyVariations(item.product);
            const itemIssues = checkoutValidation.issues.filter((issue) => issue.itemId === item.id);
            const issueLabel = itemIssues.length > 0 ? itemIssues.map((issue) => issue.message).join(' · ') : undefined;

            return (
              <ProductSummaryRow
                brand={item.product.brand}
                color={item.product.color}
                emoji={item.product.emoji}
                issueLabel={issueLabel}
                key={item.id}
                name={item.product.name}
                onRemove={() => removeCheckoutItem(item.id)}
                price={unitPrice}
                quantity={item.quantity}
                showDivider={index < cartProducts.length - 1}
                stock={item.availability.stock}
                storeName={item.availability.storeName}
                variation={item.availability.variationName ?? legacyVariations.size?.[0]}
              />
            );
          })}
          {hasCheckoutItems && !checkoutValidation.valid ? (
            <View style={styles.checkoutProblemCard}>
              <View style={styles.checkoutProblemHeader}>
                <Ionicons color={colors.primary} name="alert-circle-outline" size={19} />
                <Text style={styles.checkoutProblemTitle}>__hupi_i18n:marketplace.cart.checkYourCart</Text>
              </View>
              <Text style={styles.checkoutProblemText}>__hupi_i18n:marketplace.cart.someProductsAreNoLongerAvailableOrAreOut</Text>
              {checkoutValidation.issues.map((issue) => (
                <Text key={`${issue.itemId}-${issue.type}`} style={styles.checkoutIssueText}>• {issue.productName}: {issue.message}</Text>
              ))}
              <View style={styles.checkoutProblemActions}>
                <Pressable accessibilityRole="button" onPress={() => router.push('/marketplace/cart')} style={styles.checkoutProblemButton}>
                  <Text style={styles.checkoutProblemButtonText}>__hupi_i18n:common.reviewCart</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={removeUnavailableCheckoutItems} style={styles.checkoutProblemButton}>
                  <Text style={styles.checkoutProblemButtonText}>__hupi_i18n:marketplace.checkout.deleteUnavailable</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={payAvailableProducts} style={[styles.checkoutProblemButton, styles.checkoutProblemButtonPrimary]}>
                  <Text style={[styles.checkoutProblemButtonText, styles.checkoutProblemButtonTextPrimary]}>__hupi_i18n:marketplace.checkout.payForAvailableProducts</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
          {hasCheckoutItems ? <View style={styles.priceApplied}>
            <View style={styles.priceAppliedTop}>
              <Ionicons color={colors.primary} name="pricetag-outline" size={16} />
              <Text style={styles.priceAppliedText}>__hupi_i18n:common.priceApplied {priceLabel.toLowerCase()}</Text>
            </View>
            <View style={styles.priceSelector}>
              <Pressable
                onPress={() => selectPriceMode('card')}
                style={[styles.priceSelectorButton, priceMode === 'card' && styles.activePriceSelector]}
              >
                <Text style={[styles.priceSelectorText, priceMode === 'card' && styles.activePriceSelectorText]}>

                  __hupi_i18n:common.cardPrice
                </Text>
              </Pressable>
              <Pressable
                onPress={() => selectPriceMode('transfer')}
                style={[styles.priceSelectorButton, priceMode === 'transfer' && styles.activePriceSelector]}
              >
                <Text style={[styles.priceSelectorText, priceMode === 'transfer' && styles.activePriceSelectorText]}>

                  __hupi_i18n:common.transferPrice
                </Text>
              </Pressable>
            </View>
            {usesTransferPrice && transferSavings > 0 ? (
              <Text style={styles.savingsText}>__hupi_i18n:marketplace.checkout.youSaveByPayingWithTransferOrDeuna</Text>
            ) : null}
          </View> : null}
        </Card>
        </View>

        <Card style={styles.section}>
          <NumberedTitle number={2} title="__hupi_i18n:common.billingInformation" />
          <View style={styles.selectedBilling}>
            <Ionicons color={colors.primary} name="receipt-outline" size={19} />
            <View style={styles.selectedAddressCopy}>
              <Text style={styles.addressName}>{selectedBilling.taxpayerType}</Text>
              <Text style={styles.address}>{selectedBilling.nameOrBusinessName}</Text>
              <Text style={styles.addressMeta}>
                {selectedBilling.identificationType}: {selectedBilling.identificationNumber}
              </Text>
              <Text style={styles.addressMeta}>{selectedBilling.billingEmail}</Text>
              <Text style={styles.addressMeta}>{selectedBilling.contactPhone}</Text>
              {selectedBilling.taxpayerType === 'Persona Jurídica' ? (
                <Text style={styles.addressMeta}>__hupi_i18n:marketplace.checkout.taxAddress2 {selectedBilling.fiscalAddress}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.addressList}>
            {billingProfiles.map((profile) => (
              <Pressable
                key={profile.id}
                onPress={() => setSelectedBillingId(profile.id)}
                style={[styles.billingOption, selectedBillingId === profile.id && styles.activeAddressOption]}
              >
                <View style={styles.addressOptionCopy}>
                  <Text style={[styles.addressOptionName, selectedBillingId === profile.id && styles.activeAddressText]}>
                    {profile.taxpayerType}
                  </Text>
                  <Text numberOfLines={1} style={styles.addressOptionText}>{profile.nameOrBusinessName}</Text>
                  <Text numberOfLines={1} style={styles.addressOptionText}>
                    {profile.identificationType}: {profile.identificationNumber}
                  </Text>
                  <Text numberOfLines={1} style={styles.addressOptionText}>{profile.billingEmail}</Text>
                  <Text numberOfLines={1} style={styles.addressOptionText}>{profile.contactPhone}</Text>
                  {profile.taxpayerType === 'Persona Jurídica' ? (
                    <Text numberOfLines={1} style={styles.addressOptionText}>{profile.fiscalAddress}</Text>
                  ) : null}
                </View>
                <View style={styles.addressActions}>
                  <Pressable
                    accessibilityLabel={`Editar datos de facturación ${profile.nameOrBusinessName}`}
                    onPress={() => openEditBillingForm(profile)}
                    style={styles.addressIconButton}
                  >
                    <Ionicons color={colors.secondary} name="create-outline" size={18} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Eliminar datos de facturación ${profile.nameOrBusinessName}`}
                    onPress={() => removeBillingMock(profile.id)}
                    style={styles.addressIconButton}
                  >
                    <Ionicons color={colors.primary} name="trash-outline" size={18} />
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
          {billingNotice ? (
            <View style={styles.addressNotice}>
              <Ionicons color={colors.primary} name="information-circle-outline" size={16} />
              <Text style={styles.addressNoticeText}>{billingNotice}</Text>
            </View>
          ) : null}
          <Pressable onPress={openNewBillingForm} style={styles.addAddressButton}>
            <Ionicons color={colors.secondary} name="add-circle-outline" size={18} />
            <Text style={styles.addAddressText}>__hupi_i18n:marketplace.checkout.addBillingInformation</Text>
          </Pressable>
        </Card>

        {billingFormVisible ? (
          <Card style={styles.formCard} tone="purple">
            <View style={styles.formHeader}>
              <Text style={styles.sectionTitle}>{editingBillingId ? 'Editar facturación' : 'Nuevos datos de facturación'}</Text>
              <Pressable
                accessibilityLabel="__hupi_i18n:marketplace.checkout.closeBillingForm"
                onPress={() => setBillingFormVisible(false)}
                style={styles.closeFormButton}
              >
                <Ionicons color={colors.secondary} name="close" size={18} />
              </Pressable>
            </View>
            <View style={styles.segmented}>
              {['Persona Natural', 'Persona Jurídica'].map((type) => (
                <Pressable
                  key={type}
                  onPress={() => updateBillingField('taxpayerType', type)}
                  style={[styles.segmentButton, billingForm.taxpayerType === type && styles.activeSegmentButton]}
                >
                  <Text style={[styles.segmentText, billingForm.taxpayerType === type && styles.activeSegmentText]}>
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
            {billingForm.taxpayerType === 'Persona Natural' ? (
              <View style={styles.segmented}>
                {['Cédula', 'RUC'].map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => updateBillingField('identificationType', type)}
                    style={[styles.segmentButton, billingForm.identificationType === type && styles.activeSegmentButton]}
                  >
                    <Text style={[styles.segmentText, billingForm.identificationType === type && styles.activeSegmentText]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.lockedField}>
                <Text style={styles.lockedLabel}>__hupi_i18n:marketplace.checkout.typeOfIdentificationRequired</Text>
                <Text style={styles.lockedValue}>__hupi_i18n:common.rUC</Text>
              </View>
            )}
            <View style={styles.formGrid}>
              <MockInput
                label={billingForm.taxpayerType === 'Persona Jurídica' ? 'Número de RUC *' : 'Número de identificación *'}
                value={billingForm.identificationNumber}
                onChangeText={(value) => updateBillingField('identificationNumber', value)}
              />
              <MockInput
                label={billingForm.taxpayerType === 'Persona Jurídica' ? 'Razón social *' : 'Nombres y apellidos *'}
                value={billingForm.nameOrBusinessName}
                onChangeText={(value) => updateBillingField('nameOrBusinessName', value)}
              />
              <MockInput label="__hupi_i18n:marketplace.checkout.billingEmail" value={billingForm.billingEmail} onChangeText={(value) => updateBillingField('billingEmail', value)} />
              <MockInput label="__hupi_i18n:common.telephone2" value={billingForm.contactPhone} onChangeText={(value) => updateBillingField('contactPhone', value)} />
              {billingForm.taxpayerType === 'Persona Jurídica' ? (
                <MockInput label="__hupi_i18n:marketplace.checkout.taxAddress" value={billingForm.fiscalAddress} onChangeText={(value) => updateBillingField('fiscalAddress', value)} />
              ) : null}
            </View>
            <Button icon="receipt-outline" onPress={useBillingForm} title="__hupi_i18n:common.useThisData" />
          </Card>
        ) : null}

        <Card style={styles.section}>
          <View style={styles.addressHeader}>
            <NumberedTitle number={3} title="__hupi_i18n:common.deliveryAddress" />
          </View>
          <View style={styles.selectedAddress}>
            <Ionicons color={colors.primary} name="location-outline" size={19} />
            <View style={styles.selectedAddressCopy}>
              <Text style={styles.addressName}>{selectedAddress.label}</Text>
              <Text style={styles.address}>{selectedAddress.streetAddress}</Text>
              <Text style={styles.addressMeta}>{selectedAddress.reference}</Text>
              <Text style={styles.addressMeta}>{selectedAddress.contactPhone}</Text>
              <AddressPreferencesSummary context="delivery" value={selectedAddress.deliveryPreferences} />
            </View>
          </View>
          <View style={styles.addressList}>
            {addresses.map((address) => (
              <Pressable
                key={address.id}
                onPress={() => setSelectedAddressId(address.id)}
                style={[styles.addressOption, selectedAddressId === address.id && styles.activeAddressOption]}
              >
                <View style={styles.addressOptionCopy}>
                  <Text style={[styles.addressOptionName, selectedAddressId === address.id && styles.activeAddressText]}>
                    {address.label}
                  </Text>
                  <Text numberOfLines={1} style={styles.addressOptionText}>{address.streetAddress}</Text>
                  <Text numberOfLines={1} style={styles.addressOptionText}>{address.reference}</Text>
                </View>
                <View style={styles.addressActions}>
                  <Pressable
                    accessibilityLabel={`Editar ${address.label}`}
                    onPress={() => openEditAddressForm(address)}
                    style={styles.addressIconButton}
                  >
                    <Ionicons color={colors.secondary} name="create-outline" size={18} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Eliminar ${address.label}`}
                    onPress={() => removeAddressMock(address.id)}
                    style={styles.addressIconButton}
                  >
                    <Ionicons color={colors.primary} name="trash-outline" size={18} />
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
          {addressNotice ? (
            <View style={styles.addressNotice}>
              <Ionicons color={colors.primary} name="information-circle-outline" size={16} />
              <Text style={styles.addressNoticeText}>{addressNotice}</Text>
            </View>
          ) : null}
          <Pressable onPress={openNewAddressForm} style={styles.addAddressButton}>
            <Ionicons color={colors.secondary} name="add-circle-outline" size={18} />
            <Text style={styles.addAddressText}>__hupi_i18n:marketplace.checkout.addNewAddress</Text>
          </Pressable>
        </Card>

        {addressFormVisible ? (
          <Card style={styles.formCard} tone="purple">
            <View style={styles.formHeader}>
              <Text style={styles.sectionTitle}>{editingAddressId ? 'Editar dirección' : 'Nueva dirección'}</Text>
              <Pressable
                accessibilityLabel="__hupi_i18n:marketplace.checkout.closeAddressForm"
                onPress={() => setAddressFormVisible(false)}
                style={styles.closeFormButton}
              >
                <Ionicons color={colors.secondary} name="close" size={18} />
              </Pressable>
            </View>
            <Pressable onPress={() => setSaveAddress((value) => !value)} style={styles.saveAddressOption}>
              <Ionicons color={saveAddress ? colors.primary : colors.textMuted} name={saveAddress ? 'checkbox' : 'square-outline'} size={21} />
              <View style={styles.saveAddressCopy}>
                <Text style={styles.saveAddressText}>{t('deliveryPreferences.saveForAddress')}</Text>
                <Text style={styles.saveAddressHint}>{t(saveAddress ? 'deliveryPreferences.saveForAddress' : 'deliveryPreferences.onlyThisCheckout')}</Text>
              </View>
            </Pressable>
            <AddressEditor
              initialAddress={addressForm}
              mode={editingAddressId ? 'edit' : 'create'}
              onCancel={() => setAddressFormVisible(false)}
              onSave={useAddressForm}
            />
          </Card>
        ) : null}

        <NumberedBlockTitle number={4} title="__hupi_i18n:common.shippingMethod" />
        <View style={styles.stack}>
          {availableShippingMethods.length > 0 ? availableShippingMethods.map((method) => (
            <ShippingMethodCard
              active={shippingMethod.id === method.id}
              estimate={method.estimate}
              key={method.id}
              onPress={() => setShippingMethodId(method.id)}
              price={method.price}
              title={method.title}
            />
          )) : (
            <Card style={styles.unavailableShipping} tone="soft">
              <Ionicons color={colors.secondary} name="alert-circle-outline" size={20} />
              <Text style={styles.unavailableShippingText}>__hupi_i18n:marketplace.checkout.thereAreNoShippingMethodsEnabledByTheStore</Text>
            </Card>
          )}
        </View>

        <NumberedBlockTitle number={5} title="__hupi_i18n:common.paymentMethod" />
        <View style={styles.stack}>
          {savedCards.map((method) => (
            <Pressable
              key={method}
              onPress={() => selectPaymentMethod(method)}
              style={[styles.paymentCard, paymentMethod === method && styles.activePayment]}
            >
              <Ionicons color={paymentMethod === method ? colors.primary : colors.secondary} name="card-outline" size={20} />
              <View style={styles.paymentCopy}>
                <Text style={styles.paymentText}>{method}</Text>
                <Text style={styles.paymentHint}>__hupi_i18n:marketplace.checkout.useCardPrice</Text>
              </View>
              <Pressable
                accessibilityLabel={`Eliminar ${method}`}
                onPress={() => removeCardMock(method)}
                style={styles.paymentIconButton}
              >
                <Ionicons color={colors.primary} name="trash-outline" size={18} />
              </Pressable>
            </Pressable>
          ))}
          {[paymentMethods[1], paymentMethods[2]].map((method) => (
            <Pressable
              key={method}
              onPress={() => selectPaymentMethod(method)}
              style={[styles.paymentCard, paymentMethod === method && styles.activePayment]}
            >
              <Ionicons color={paymentMethod === method ? colors.primary : colors.secondary} name={method === 'Deuna' ? 'qr-code-outline' : 'business-outline'} size={20} />
              <View style={styles.paymentCopy}>
                <Text style={styles.paymentText}>{method}</Text>
                <Text style={styles.paymentHint}>__hupi_i18n:marketplace.checkout.useTransferPrice</Text>
              </View>
            </Pressable>
          ))}
        </View>
        {paymentNotice ? (
          <View style={styles.addressNotice}>
            <Ionicons color={colors.primary} name="information-circle-outline" size={16} />
            <Text style={styles.addressNoticeText}>{paymentNotice}</Text>
          </View>
        ) : null}
        <Pressable onPress={() => setCardFormVisible(true)} style={styles.addAddressButton}>
          <Ionicons color={colors.secondary} name="add-circle-outline" size={18} />
          <Text style={styles.addAddressText}>__hupi_i18n:payments.payment-methods.addNewCard</Text>
        </Pressable>

        {cardFormVisible ? (
          <Card style={styles.formCard} tone="purple">
            <View style={styles.formHeader}>
              <Text style={styles.sectionTitle}>__hupi_i18n:common.newCard</Text>
              <Pressable
                accessibilityLabel="__hupi_i18n:marketplace.checkout.closeCardForm"
                onPress={() => setCardFormVisible(false)}
                style={styles.closeFormButton}
              >
                <Ionicons color={colors.secondary} name="close" size={18} />
              </Pressable>
            </View>
            <View style={styles.formGrid}>
              <MockInput label="__hupi_i18n:marketplace.checkout.nameOnCard" value={cardForm.name} onChangeText={(value) => setCardForm((current) => ({ ...current, name: value }))} />
              <MockInput label="__hupi_i18n:marketplace.checkout.cardNumber" value={cardForm.number} onChangeText={(value) => setCardForm((current) => ({ ...current, number: value }))} />
              <MockInput label="__hupi_i18n:marketplace.checkout.expirationDate" value={cardForm.expiry} onChangeText={(value) => setCardForm((current) => ({ ...current, expiry: value }))} />
              <MockInput label="__hupi_i18n:common.cvv" value={cardForm.cvv} onChangeText={(value) => setCardForm((current) => ({ ...current, cvv: value }))} />
            </View>
            <Pressable onPress={() => setSaveCard((value) => !value)} style={styles.saveAddressOption}>
              <Ionicons color={saveCard ? colors.primary : colors.textMuted} name={saveCard ? 'checkbox' : 'square-outline'} size={21} />
              <Text style={styles.saveAddressText}>__hupi_i18n:marketplace.checkout.saveCardToMyHupiWallet</Text>
            </Pressable>
            <Button icon="card-outline" onPress={useCardForm} title="__hupi_i18n:marketplace.checkout.useThisCard" />
          </Card>
        ) : null}

        <Pressable onPress={() => setSavePayment((value) => !value)} style={styles.walletOption}>
          <Ionicons color={savePayment ? colors.primary : colors.textMuted} name={savePayment ? 'checkbox' : 'square-outline'} size={21} />
          <Text style={styles.walletText}>

            __hupi_i18n:bookings.service-checkout.saveThisPaymentMethodToMyHupiWalletTo
          </Text>
        </Pressable>

        <Card style={[styles.hupiBalanceCard, darkMode && styles.hupiBalanceCardDark]}>
          <NumberedTitle number={6} title="__hupi_i18n:common.useHupiBalance" />
          <View style={[styles.hupiBalanceBox, darkMode && styles.hupiBalanceBoxDark]}>
            <View style={styles.hupiBalanceCopy}>
              <Text style={[styles.hupiBalanceTitle, darkMode && styles.hupiBalanceTitleDark]}>__hupi_i18n:marketplace.checkout.hupiBalanceAvailable {formatMarketplaceCurrency(hupiBalance.available)}</Text>
              <Text style={[styles.hupiBalanceHint, darkMode && styles.hupiBalanceHintDark]}>
                {applyHupiBalance
                  ? 'Se aplicará automáticamente el saldo disponible hasta cubrir el total de tu compra.'
                  : 'Activa esta opción para usar automáticamente tu saldo disponible en esta compra.'}
              </Text>
            </View>
            <Pressable onPress={() => setApplyHupiBalance((value) => !value)} style={[styles.balanceCheckbox, darkMode && styles.balanceCheckboxDark]}>
              <Ionicons color={darkMode ? colors.white : applyHupiBalance ? colors.success : colors.textMuted} name={applyHupiBalance ? 'checkbox' : 'square-outline'} size={22} />
            </Pressable>
          </View>
          <View style={styles.hupiBalanceSummary}>
            <BalanceSummaryRow darkMode={darkMode} label="__hupi_i18n:common.availableBalance" value={formatMarketplaceCurrency(hupiBalance.available)} />
            <BalanceSummaryRow darkMode={darkMode} highlight label="__hupi_i18n:common.balanceApplied" value={`-${formatMarketplaceCurrency(hupiBalanceApplied)}`} />
            <BalanceSummaryRow darkMode={darkMode} label="__hupi_i18n:common.remainingToPay" value={formatMarketplaceCurrency(total)} />
          </View>
        </Card>

        <Card style={styles.section}>
          <NumberedTitle number={7} title="__hupi_i18n:marketplace.checkout.couponOrBenefit" />
          <View style={styles.subtleCouponHeader}>
            <View style={styles.subtleCouponIcon}>
              <Ionicons color={colors.secondary} name="ticket-outline" size={18} />
            </View>
            <View style={styles.subtleCouponCopy}>
              <Text style={styles.subtleCouponTitle}>__hupi_i18n:marketplace.marketplace.doYouHaveACoupon</Text>
              <Text style={styles.subtleCouponSubtitle}>__hupi_i18n:marketplace.checkout.addACodeOrUseASavedBenefit</Text>
              <Text style={styles.optionalCouponText}>__hupi_i18n:marketplace.checkout.thisStepIsOptionalIfYouDonTHave</Text>
            </View>
          </View>
          {!appliedCoupon && reservedCouponCode ? (
            <View style={styles.savedCouponBox}>
              <Text style={styles.savedCouponTitle}>__hupi_i18n:marketplace.checkout.youHaveASavedCoupon {reservedCouponCode}</Text>
              <View style={styles.savedCouponActions}>
                <Pressable onPress={() => applyCouponCode(reservedCouponCode, 'Cupón aplicado correctamente.')} style={styles.applyCouponButton}>
                  <Text style={styles.applyCouponText}>__hupi_i18n:common.applyNow</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    clearReservedCouponCode();
                    setReservedCouponCodeState(null);
                    setCouponSkipped(true);
                    setCouponNotice('Continuarás sin cupón.');
                  }}
                  style={styles.noCouponButton}
                >
                  <Text style={styles.noCouponText}>__hupi_i18n:common.doNotUse</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
          {!appliedCoupon && !couponExpanded ? (
            <View style={styles.collapsedCouponActions}>
              <Pressable onPress={() => { setCouponExpanded(true); setCouponSkipped(false); }} style={styles.addCouponButton}>
                <Text style={styles.addCouponText}>__hupi_i18n:common.addCoupon</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setCouponSkipped(true);
                  setCouponNotice('Continuarás sin cupón.');
                }}
                style={styles.noCouponButton}
              >
                <Text style={styles.noCouponText}>__hupi_i18n:common.iDonTHaveACoupon</Text>
              </Pressable>
            </View>
          ) : null}
          {!appliedCoupon && couponExpanded ? (
            <View style={styles.expandedCouponBox}>
              <View style={styles.couponInputRow}>
                <TextInput
                  autoCapitalize="characters"
                  onChangeText={setCouponCode}
                  placeholder="__hupi_i18n:common.hupi10"
                  placeholderTextColor={colors.textMuted}
                  style={styles.couponInput}
                  value={couponCode}
                />
                <Pressable onPress={applyCoupon} style={styles.applyCouponButton}>
                  <Text style={styles.applyCouponText}>__hupi_i18n:common.apply</Text>
                </Pressable>
              </View>
              <View style={styles.expandedCouponActions}>
                <Pressable onPress={() => router.push('/marketplace/coupons?activeCheckout=1')} style={styles.viewCouponsButton}>
                  <Text style={styles.viewCouponsText}>__hupi_i18n:common.seeMyCoupons</Text>
                </Pressable>
                <Pressable onPress={() => setCouponExpanded(false)} style={styles.closeCouponButton}>
                  <Text style={styles.closeCouponText}>__hupi_i18n:common.close</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
          {appliedCoupon ? (
            <View style={styles.appliedCouponBox}>
              <View>
                <Text style={styles.appliedCouponTitle}>__hupi_i18n:common.couponApplied {appliedCoupon.code}</Text>
                <Text style={styles.appliedCouponText}>
                  {appliedCoupon.discountType === 'free_shipping'
                    ? 'Envío gratis aplicado'
                    : appliedCoupon.discountType === 'percentage'
                      ? `${appliedCoupon.value}% de descuento`
                      : `${formatMarketplaceCurrency(appliedCoupon.value)} de descuento`}
                </Text>
              </View>
              <Pressable onPress={removeCoupon} style={styles.removeCouponButton}>
                <Text style={styles.removeCouponText}>__hupi_i18n:common.remove</Text>
              </Pressable>
            </View>
          ) : null}
          {couponSkipped && !appliedCoupon ? <Text style={styles.couponSkippedText}>__hupi_i18n:marketplace.checkout.couponOmittedForThisOrder</Text> : null}
          {couponNotice ? <Text style={styles.couponNotice}>{couponNotice}</Text> : null}
        </Card>

        <Card style={styles.section} tone="soft">
          <NumberedTitle number={8} title="__hupi_i18n:common.acceptances" />
          <LegalAcceptanceRow
            accepted={acceptTerms}
            label="__hupi_i18n:common.iAcceptThe2"
            linkLabel="Términos y Condiciones"
            onLinkPress={() => setLegalModal('terms')}
            onToggle={() => setAcceptTerms((value) => !value)}
          />
          <LegalAcceptanceRow
            accepted={acceptData}
            label="__hupi_i18n:common.iAcceptThe"
            linkLabel="Política de Protección de Datos Personales"
            onLinkPress={() => setLegalModal('data')}
            onToggle={() => setAcceptData((value) => !value)}
          />
          {legalNotice ? <Text style={styles.legalNotice}>{legalNotice}</Text> : null}
        </Card>

        <NumberedBlockTitle number={9} title="__hupi_i18n:common.hupiFoundationDonation" />
        <View style={styles.donationRow}>
          {donations.map((amount) => (
            <Pressable
              key={amount}
              onPress={() => setDonation(amount)}
              style={[styles.donation, donation === amount && styles.activeDonation]}
            >
              <Text style={[styles.donationText, donation === amount && styles.activeDonationText]}>
                {amount === 3 ? 'Otro' : `$${amount}`}
              </Text>
            </Pressable>
          ))}
        </View>

        <NumberedBlockTitle number={10} title="__hupi_i18n:marketplace.checkout.finalConfirmation" />
        <OrderSummaryCard
          couponCode={appliedCoupon?.code}
          couponDiscount={couponDiscount}
          discount={orderDiscount}
          donation={cartProducts.length > 0 ? donation : 0}
          hupiBalanceApplied={hupiBalanceApplied}
          shipping={effectiveShipping}
          subtotal={subtotal}
          total={total}
        />

        <Text style={styles.simulatedText}>__hupi_i18n:marketplace.checkout.purchaseInTrialModeNoActualChargeWillBe</Text>
      </ScrollView>

      <NativeView
        pointerEvents="box-none"
        style={[styles.bottomBarWrapper, { bottom: Math.max(insets.bottom, 12) }]}
      >
        <View style={styles.bottomBar}>
          <View style={styles.bottomCopy}>
            <Text style={styles.bottomLabel}>__hupi_i18n:common.total</Text>
            <Text style={styles.bottomTotal}>{formatMarketplaceCurrency(total)}</Text>
            <Text style={styles.bottomMethod}>{!hasCheckoutItems ? 'Sin productos' : paidOnlyWithHupiBalance ? 'Saldo Hupi' : `${priceLabel} · ${paymentMethod}`}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={!canConfirmPurchase}
            onPress={confirmPurchase}
            style={[styles.bottomButton, !canConfirmPurchase && styles.disabledBottomButton]}
          >
            <Text style={styles.bottomButtonText}>__hupi_i18n:common.confirmPurchase</Text>
            <Ionicons color={colors.white} name="checkmark-circle-outline" size={18} />
          </Pressable>
        </View>
      </NativeView>
      <Modal animationType="fade" transparent visible={legalModal !== null}>
        <View style={styles.modalOverlay}>
          <View style={styles.legalModal}>
            <Pressable accessibilityLabel="__hupi_i18n:common.closeLegal" onPress={() => setLegalModal(null)} style={styles.closeLegalButton}>
              <Ionicons color={colors.text} name="close" size={18} />
            </Pressable>
            <Text style={styles.legalModalTitle}>
              {legalModal === 'terms' ? 'Términos y Condiciones' : 'Protección de Datos Personales'}
            </Text>
            <Text style={styles.legalModalText}>
              {legalModal === 'terms'
                ? 'Contenido informativo: reglas de compra, pagos en modo prueba, envíos y atención de pedidos marketplace dentro de Hupi.'
                : 'Contenido informativo: uso responsable de datos para facturación, entrega, soporte y notificaciones dentro de Hupi.'}
            </Text>
            <Pressable onPress={() => setLegalModal(null)} style={styles.legalModalButton}>
              <Text style={styles.legalModalButtonText}>__hupi_i18n:common.understood</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <HupiSuccessModal
        description={checkoutModal?.description ?? ''}
        onClose={() => setCheckoutModal(null)}
        reference={checkoutModal?.reference}
        title={checkoutModal?.title ?? ''}
        visible={Boolean(checkoutModal)}
      />
      <HupiSuccessModal
        description="__hupi_i18n:marketplace.checkout.yourPurchaseWasPaidWithHupiBalance"
        onClose={() => {
          setWalletSuccessVisible(false);
          if (pendingConfirmationUrl) {
            router.push(pendingConfirmationUrl);
          }
        }}
        title="__hupi_i18n:marketplace.checkout.confirmedOrder"
        visible={walletSuccessVisible}
      />
    </ScreenContainer>
  );
}

function MockInput({
  label,
  onChangeText,
  value,
}: {
  label: string;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function LegalAcceptanceRow({
  accepted,
  label,
  linkLabel,
  onLinkPress,
  onToggle,
}: {
  accepted: boolean;
  label: string;
  linkLabel: string;
  onLinkPress: () => void;
  onToggle: () => void;
}) {
  return (
    <View style={styles.legalRow}>
      <Pressable onPress={onToggle} style={styles.legalCheckbox}>
        <Ionicons color={accepted ? colors.primary : colors.textMuted} name={accepted ? 'checkbox' : 'square-outline'} size={21} />
      </Pressable>
      <Text style={styles.legalText}>
        {label}{' '}
        <Text onPress={onLinkPress} style={styles.legalLink}>{linkLabel}</Text>
      </Text>
    </View>
  );
}

function BalanceSummaryRow({
  darkMode,
  highlight = false,
  label,
  value,
}: {
  darkMode: boolean;
  highlight?: boolean;
  label: string;
  value: string;
}) {
  return (
    <View style={[styles.balanceSummaryRow, darkMode && styles.balanceSummaryRowDark]}>
      <Text style={[styles.balanceSummaryLabel, darkMode && styles.balanceSummaryLabelDark]}>{label}</Text>
      <Text
        style={[
          styles.balanceSummaryValue,
          darkMode && styles.balanceSummaryValueDark,
          highlight && styles.balanceSummaryValueHighlight,
          darkMode && highlight && styles.balanceSummaryValueHighlightDark,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function NumberedTitle({ number, title }: { number: number; title: string }) {
  return (
    <View style={styles.numberedTitleRow}>
      <View style={styles.stepCircle}>
        <Text style={styles.stepCircleText}>{number}</Text>
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function NumberedBlockTitle({ number, title }: { number: number; title: string }) {
  return (
    <View style={styles.numberedBlockTitle}>
      <View style={styles.stepCircle}>
        <Text style={styles.stepCircleText}>{number}</Text>
      </View>
      <Text style={styles.numberedBlockText}>{title}</Text>
    </View>
  );
}

function ProductSummaryRow({
  brand,
  color,
  emoji,
  issueLabel,
  name,
  onRemove,
  price,
  quantity,
  showDivider,
  stock,
  storeName,
  variation,
}: {
  brand: string;
  color: string;
  emoji: string;
  issueLabel?: string;
  name: string;
  onRemove: () => void;
  price: number;
  quantity: number;
  showDivider: boolean;
  stock: number;
  storeName: string;
  variation?: string;
}) {
  return (
    <View style={[styles.productBlock, showDivider && styles.productBlockDivider]}>
      <View style={styles.productRow}>
        <View style={[styles.productThumb, { backgroundColor: color }]}>
          <Text style={styles.productEmoji}>{emoji}</Text>
        </View>
        <View style={styles.productCopy}>
          <Text numberOfLines={2} style={styles.productName}>{name}</Text>
          <Text numberOfLines={1} style={styles.productStore}>{storeName}</Text>
          <Text style={styles.productMeta}>
            {brand}{variation ? ` · ${variation}` : ''}  __hupi_i18n:common.quantity {quantity}
          </Text>
          <Text style={styles.productMeta}>__hupi_i18n:marketplace.checkout.stockAvailable {stock}</Text>
          <Text style={styles.productPrice}>__hupi_i18n:common.priceApplied {formatMarketplaceCurrency(price)}</Text>
          {issueLabel ? <Text style={styles.productIssue}>{issueLabel}</Text> : null}
        </View>
        <Pressable accessibilityLabel={`Eliminar ${name}`} accessibilityRole="button" onPress={onRemove} style={styles.removeProductButton}>
          <Ionicons color={colors.primary} name="trash-outline" size={17} />
        </Pressable>
      </View>
    </View>
  );
}

function isBillingProfileComplete(profile: BillingProfile) {
  const commonComplete = Boolean(
    profile.identificationNumber.trim()
    && profile.nameOrBusinessName.trim()
    && profile.billingEmail.trim()
    && profile.contactPhone.trim()
  );

  if (profile.taxpayerType === 'Persona Jurídica') {
    return commonComplete && profile.identificationType === 'RUC' && Boolean(profile.fiscalAddress.trim());
  }

  return commonComplete && (profile.identificationType === 'Cédula' || profile.identificationType === 'RUC');
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 0 },
  content: { paddingTop: 8, paddingHorizontal: 20 },
  stickyProblemBanner: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f5d3ca',
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  stickyIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  stickyCopy: { flex: 1 },
  stickyTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  stickyText: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, fontWeight: '800', marginTop: 2 },
  stickyCta: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900' },
  topbar: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, overflow: 'visible' },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 0, overflow: 'visible', paddingBottom: 3 },
  title: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 28, lineHeight: 36, fontWeight: '900', overflow: 'visible', paddingBottom: 2 },
  subtitle: { color: colors.textMuted, flexShrink: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, marginTop: 3, overflow: 'visible', paddingBottom: 1 },
  section: { marginTop: 18, shadowOpacity: 0.04 },
  sectionTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900', marginBottom: 10 },
  numberedTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
  numberedBlockTitle: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 22, marginBottom: 11 },
  numberedBlockText: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, fontWeight: '900' },
  stepCircle: { width: 25, height: 25, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepCircleText: { color: colors.white, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  productBlock: { paddingVertical: 12 },
  productBlockDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  productRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  productThumb: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  productEmoji: { fontSize: 27 },
  productCopy: { flex: 1, minWidth: 0 },
  productName: { color: colors.text, fontFamily: fonts.bold, fontSize: 13, lineHeight: 20, fontWeight: '900' },
  productStore: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', marginTop: 3 },
  productMeta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, fontWeight: '700', lineHeight: 18, marginTop: 3 },
  productPrice: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', marginTop: 3 },
  productIssue: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, lineHeight: 19, fontWeight: '900', marginTop: 4 },
  removeProductButton: { width: 36, height: 36, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  emptyCheckoutCard: { alignItems: 'center', gap: 10, borderRadius: 16, backgroundColor: colors.soft, padding: 14 },
  emptyCheckoutIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  emptyCheckoutTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  emptyCheckoutText: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 13, lineHeight: 20, fontWeight: '800', textAlign: 'center' },
  checkoutProblemCard: { gap: 8, borderRadius: 16, backgroundColor: colors.primarySoft, padding: 12, marginTop: 12 },
  checkoutProblemHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  checkoutProblemTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  checkoutProblemText: { color: colors.text, fontFamily: fonts.medium, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  checkoutIssueText: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 12, lineHeight: 19, fontWeight: '800' },
  checkoutProblemActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  checkoutProblemButton: { minHeight: 34, borderRadius: 999, borderWidth: 1, borderColor: colors.primary, justifyContent: 'center', paddingHorizontal: 11 },
  checkoutProblemButtonPrimary: { backgroundColor: colors.primary },
  checkoutProblemButtonText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900' },
  checkoutProblemButtonTextPrimary: { color: colors.white },
  priceApplied: { borderRadius: 14, backgroundColor: colors.soft, gap: 10, padding: 11, marginTop: 14 },
  priceAppliedTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  priceAppliedText: { color: colors.text, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  priceSelector: { flexDirection: 'row', gap: 8 },
  priceSelectorButton: { flex: 1, minHeight: 34, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  activePriceSelector: { backgroundColor: colors.primary, borderColor: colors.primary },
  priceSelectorText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900' },
  activePriceSelectorText: { color: colors.white },
  savingsText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  addressHeader: { flexDirection: 'row', alignItems: 'center' },
  editAddressButton: { marginLeft: 'auto', paddingHorizontal: 10, minHeight: 30, borderRadius: 999, backgroundColor: colors.primarySoft, justifyContent: 'center' },
  editAddressText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  selectedAddress: { flexDirection: 'row', gap: 9, borderRadius: 15, backgroundColor: colors.soft, padding: 12 },
  selectedBilling: { flexDirection: 'row', gap: 9, borderRadius: 15, backgroundColor: colors.soft, padding: 12 },
  selectedAddressCopy: { flex: 1 },
  addressName: { color: colors.text, fontSize: 15, fontWeight: '900' },
  address: { color: colors.text, fontSize: 13, fontWeight: '800', marginTop: 3 },
  addressMeta: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 2 },
  addressList: { gap: 8, marginTop: 12 },
  addressOption: { borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11 },
  billingOption: { borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11 },
  activeAddressOption: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  addressOptionCopy: { flex: 1 },
  addressOptionName: { color: colors.text, fontSize: 13, fontWeight: '900' },
  activeAddressText: { color: colors.primary },
  addressOptionText: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  addressActions: { flexDirection: 'row', gap: 6 },
  addressIconButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  addressNotice: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 13, backgroundColor: colors.primarySoft, padding: 10, marginTop: 10 },
  addressNoticeText: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '800' },
  addAddressButton: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', marginTop: 12 },
  addAddressText: { color: colors.secondary, fontSize: 13, fontWeight: '900' },
  formCard: { gap: 11, marginTop: 12, shadowOpacity: 0 },
  formHeader: { flexDirection: 'row', alignItems: 'center' },
  closeFormButton: { marginLeft: 'auto', width: 34, height: 34, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  segmented: { flexDirection: 'row', gap: 8 },
  segmentButton: { flex: 1, minHeight: 38, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  activeSegmentButton: { borderColor: colors.primary, backgroundColor: colors.primary },
  segmentText: { color: colors.textMuted, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  activeSegmentText: { color: colors.white },
  lockedField: { borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, padding: 12 },
  lockedLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  lockedValue: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 4 },
  formGrid: { gap: 10 },
  inputGroup: { gap: 5 },
  inputLabel: { color: colors.text, fontSize: 12, fontWeight: '900' },
  input: { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.text, paddingHorizontal: 12, fontSize: 13 },
  saveAddressOption: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  saveAddressCopy: { flex: 1 },
  saveAddressText: { color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  saveAddressHint: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 2 },
  subtleCouponHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 15, backgroundColor: colors.soft, padding: 11 },
  subtleCouponIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  subtleCouponCopy: { flex: 1 },
  subtleCouponTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  subtleCouponSubtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 2, fontWeight: '700' },
  optionalCouponText: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 5, fontWeight: '700' },
  collapsedCouponActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 11 },
  addCouponButton: { minHeight: 36, borderRadius: 999, backgroundColor: colors.secondarySoft, justifyContent: 'center', paddingHorizontal: 12 },
  addCouponText: { color: colors.secondary, fontSize: 12, fontWeight: '900' },
  noCouponButton: { minHeight: 36, borderRadius: 999, backgroundColor: colors.soft, justifyContent: 'center', paddingHorizontal: 12 },
  noCouponText: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  savedCouponBox: { borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: 11, marginTop: 10 },
  savedCouponTitle: { color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '900' },
  savedCouponActions: { flexDirection: 'row', gap: 8, marginTop: 9 },
  expandedCouponBox: { gap: 10, marginTop: 11 },
  couponInputRow: { flexDirection: 'row', gap: 8 },
  couponInput: { flex: 1, minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.text, paddingHorizontal: 12, fontSize: 13, fontWeight: '800' },
  applyCouponButton: { minHeight: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  applyCouponText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  expandedCouponActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  viewCouponsButton: { minHeight: 34, borderRadius: 999, backgroundColor: colors.secondarySoft, justifyContent: 'center', paddingHorizontal: 11 },
  viewCouponsText: { color: colors.secondary, fontSize: 12, fontWeight: '900' },
  closeCouponButton: { minHeight: 34, borderRadius: 999, backgroundColor: colors.soft, justifyContent: 'center', paddingHorizontal: 11 },
  closeCouponText: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  appliedCouponBox: { borderRadius: 15, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginTop: 10 },
  appliedCouponTitle: { color: colors.primary, fontSize: 15, fontWeight: '900' },
  appliedCouponText: { color: colors.text, fontSize: 12, fontWeight: '800', marginTop: 3 },
  removeCouponButton: { marginLeft: 'auto', minHeight: 32, borderRadius: 999, backgroundColor: colors.white, justifyContent: 'center', paddingHorizontal: 10 },
  removeCouponText: { color: colors.secondary, fontSize: 12, fontWeight: '900' },
  couponSkippedText: { color: colors.textMuted, fontSize: 12, fontWeight: '800', marginTop: 9 },
  couponNotice: { color: colors.primary, fontSize: 12, fontWeight: '900', marginTop: 9 },
  legalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 8 },
  legalCheckbox: { paddingTop: 1 },
  legalText: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '700' },
  legalLink: { color: colors.secondary, fontWeight: '900', textDecorationLine: 'underline' },
  legalNotice: { color: colors.primary, fontSize: 12, fontWeight: '900', marginTop: 10 },
  blockTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 22, marginBottom: 11 },
  stack: { gap: 9 },
  unavailableShipping: { flexDirection: 'row', alignItems: 'center', gap: 10, shadowOpacity: 0 },
  unavailableShippingText: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  paymentCard: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
  },
  activePayment: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  paymentIconButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  paymentCopy: { flex: 1 },
  paymentText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  paymentHint: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 3 },
  walletOption: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 14 },
  walletText: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '700' },
  hupiBalanceCard: { marginTop: 18, borderColor: '#BDE8CF', backgroundColor: '#EAF8F0', shadowOpacity: 0.03 },
  hupiBalanceCardDark: { borderColor: '#71d5aa', backgroundColor: colors.success },
  hupiBalanceBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 15, borderWidth: 1, borderColor: '#BDE8CF', backgroundColor: colors.white, padding: 12 },
  hupiBalanceBoxDark: { borderColor: 'rgba(255, 255, 255, 0.28)', backgroundColor: 'rgba(18, 69, 51, 0.58)' },
  hupiBalanceCopy: { flex: 1, minWidth: 0 },
  hupiBalanceTitle: { color: colors.success, fontSize: 15, fontWeight: '900' },
  hupiBalanceTitleDark: { color: colors.white },
  hupiBalanceHint: { color: colors.text, fontSize: 13, lineHeight: 20, marginTop: 3, fontWeight: '800' },
  hupiBalanceHintDark: { color: '#eefbf5' },
  balanceCheckbox: { marginLeft: 'auto', width: 36, height: 36, borderRadius: 12, backgroundColor: '#EAF8F0', alignItems: 'center', justifyContent: 'center' },
  balanceCheckboxDark: { backgroundColor: 'rgba(255, 255, 255, 0.16)' },
  hupiBalanceSummary: { gap: 8, marginTop: 11 },
  balanceSummaryRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, backgroundColor: colors.white, paddingHorizontal: 11, paddingVertical: 9 },
  balanceSummaryRowDark: { backgroundColor: 'rgba(18, 69, 51, 0.48)' },
  balanceSummaryLabel: { flex: 1, color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  balanceSummaryLabelDark: { color: '#dff7ec' },
  balanceSummaryValue: { color: colors.text, fontSize: 13, fontWeight: '900' },
  balanceSummaryValueDark: { color: colors.white },
  balanceSummaryValueHighlight: { color: colors.success },
  balanceSummaryValueHighlightDark: { color: '#dff7ec' },
  donationRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  donation: { minWidth: 54, height: 38, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  activeDonation: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  donationText: { color: colors.textMuted, fontSize: 13, fontWeight: '900' },
  activeDonationText: { color: colors.white },
  simulatedText: { color: colors.textMuted, fontFamily: fonts.light, fontSize: 13, textAlign: 'center', marginVertical: 14 },
  bottomBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
  },
  bottomBar: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    shadowColor: '#3f2d25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 10,
  },
  bottomCopy: { flex: 1 },
  bottomLabel: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900' },
  bottomTotal: { color: colors.text, fontFamily: fonts.bold, fontSize: 20, fontWeight: '900', marginTop: 2 },
  bottomMethod: { color: colors.secondary, fontFamily: fonts.semiBold, fontSize: 12, fontWeight: '800', marginTop: 2 },
  bottomButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 15,
  },
  disabledBottomButton: { opacity: 0.55 },
  bottomButtonText: { color: colors.white, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(51,51,51,0.48)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  legalModal: { width: '100%', maxWidth: 360, borderRadius: 24, backgroundColor: colors.white, padding: 20 },
  closeLegalButton: { position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 12, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  legalModalTitle: { color: colors.text, fontSize: 20, fontWeight: '900', paddingRight: 36 },
  legalModalText: { color: colors.textMuted, fontSize: 13, lineHeight: 22, fontWeight: '700', marginTop: 12 },
  legalModalButton: { minHeight: 44, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  legalModalButtonText: { color: colors.white, fontSize: 13, fontWeight: '900' },
});
