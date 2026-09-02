import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import type { Href } from 'expo-router';
import { useLocalSearchParams,
  useRouter } from 'expo-router';
import { useMemo,
  useEffect,
  useState } from 'react';
import { Alert,
  StyleSheet,
} from 'react-native';

import { BookingSummaryCard } from '@/components/booking/BookingSummaryCard';
import { AddressPreferencesEditor, AddressPreferencesSummary } from '@/components/addresses/AddressPreferencesEditor';
import { DonationCard, type DonationOption } from '@/components/booking/DonationCard';
import {
  PaymentMethodSelector,
  type MockPaymentMethod,
} from '@/components/booking/PaymentMethodSelector';
import { PaymentSummaryCard } from '@/components/booking/PaymentSummaryCard';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DisabledServiceNotice } from '@/components/DisabledServiceNotice';
import { HupiPagesLogo } from '@/components/HupiPagesLogo';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { HupiLevelBadge } from '@/components/providers/HupiLevelBadge';
import { HupiVerifiedBadge } from '@/components/providers/HupiVerifiedBadge';
import { ProviderTermsAcceptanceBlock } from '@/components/provider/ProviderTermsAcceptanceBlock';
import { RatingBadge } from '@/components/providers/RatingBadge';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { isBookableServiceEnabled, isServiceEnabled } from '@/constants/features';
import { addMockServiceBooking } from '@/constants/mockBookings';
import {
  calculateMockPayment,
  getMockProviderValue,
  type MockPlanId,
} from '@/constants/mockCheckout';
import {
  confirmMockServiceCoordination,
  getMockServiceCoordinationById,
  getMockServiceOfferById,
  getMockProviderPlanById,
  getSelectedServicePet,
} from '@/constants/mockData';
import { getMockProviderPhotoUri, getMockProviderServicePrice, mockProviders } from '@/constants/mockProviders';
import { isBookableServiceId, serviceCopy, services, type ServiceId } from '@/constants/services';
import { Pressable, Text } from '@/i18n/components';
import { useLocalAccount } from '@/hooks/useLocalAccount';
import { useRemoteQuote } from '@/hooks/useRemoteQuote';
import { saveLocalAddress } from '@/data/localAccountRepository';
import { useTranslation } from '../../../node_modules/react-i18next';
import { useMockProviderPricing } from '@/hooks/useMockProviderPricing';
import { getProviderWalkHourlyRate } from '@/domain/providerPricing';
import { HUPI_STANDARD_WALK_TERMS } from '@/domain/providerWalkProfile';
import { recordMockProviderTermsAcceptance } from '@/data/mockProviderProfileRepository';

type AcceptanceRowProps = {
  checked: boolean;
  prefix: string;
  linkLabel: string;
  suffix?: string;
  onToggle: () => void;
  onOpenLink: () => void;
};

function AcceptanceRow({
  checked,
  prefix,
  linkLabel,
  suffix = '',
  onToggle,
  onOpenLink,
}: AcceptanceRowProps) {
  return (
    <View style={styles.acceptanceRow}>
      <Pressable accessibilityRole="checkbox" onPress={onToggle}>
        <View style={[styles.checkbox, checked && styles.checkedBox]}>
          {checked ? <Ionicons color={colors.white} name="checkmark" size={15} /> : null}
        </View>
      </Pressable>
      <Text style={styles.acceptanceText}>
        {prefix}
        <Text onPress={onOpenLink} style={styles.legalLink}>{linkLabel}</Text>
        {suffix}
      </Text>
    </View>
  );
}

type MockCheckboxRowProps = {
  checked: boolean;
  label: string;
  onPress: () => void;
};

function MockCheckboxRow({ checked, label, onPress }: MockCheckboxRowProps) {
  return (
    <Pressable onPress={onPress} style={styles.walletRow}>
      <View style={[styles.checkbox, checked && styles.checkedBox]}>
        {checked ? <Ionicons color={colors.white} name="checkmark" size={15} /> : null}
      </View>
      <View style={styles.walletCopy}>
        <Text style={styles.walletText}>{label}</Text>
        <Text style={styles.walletHint}>__hupi_i18n:bookings.service-checkout.visualOptionNoRealDataWillBeSaved</Text>
      </View>
    </Pressable>
  );
}

export default function ServiceCheckoutScreen() {
  useMockProviderPricing();
  const router = useRouter();
  const { t } = useTranslation();
  const { addresses, profile } = useLocalAccount();
  const { providerId, planId, serviceId: serviceIdParam, requestId, offerId } = useLocalSearchParams<{
    providerId?: string;
    planId?: string;
    serviceId?: string;
    requestId?: string;
    offerId?: string;
  }>();
  const selectedOffer = useMemo(() => getMockServiceOfferById(offerId), [offerId]);
  const selectedProviderPlan = useMemo(() => getMockProviderPlanById(planId), [planId]);
  const coordinationRequest = useMemo(() => getMockServiceCoordinationById(requestId), [requestId]);
  const serviceId = selectedOffer?.serviceType ?? selectedProviderPlan?.serviceType ?? (isBookableServiceId(serviceIdParam) ? serviceIdParam : 'walk');
  const requestedDisabledService = Boolean(
    serviceIdParam
    && services.some((serviceItem) => serviceItem.id === serviceIdParam)
    && !isServiceEnabled(serviceIdParam as ServiceId),
  );
  const service = serviceCopy[serviceId];
  const [paymentMethod, setPaymentMethod] = useState<MockPaymentMethod>('card');
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [donationOption, setDonationOption] = useState<DonationOption>(0);
  const [customDonation, setCustomDonation] = useState('');
  const [acceptsServiceTerms, setAcceptsServiceTerms] = useState(false);
  const [acceptsPrivacyPolicy, setAcceptsPrivacyPolicy] = useState(false);
  const initialAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState(initialAddress?.id ?? '');
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId) ?? initialAddress;
  const [checkoutPreferences, setCheckoutPreferences] = useState(() => initialAddress?.deliveryPreferences);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [savePreferencesToAddress, setSavePreferencesToAddress] = useState(false);

  useEffect(() => {
    if (!selectedAddress) return;
    setCheckoutPreferences(selectedAddress.deliveryPreferences);
    setSavePreferencesToAddress(false);
  }, [selectedAddress?.id]);

  const provider = useMemo(
    () => mockProviders.find((item) => item.id === providerId) ?? mockProviders[0],
    [providerId],
  );
  const providerPhotoUri = getMockProviderPhotoUri(provider.id);
  const selectedPet = getSelectedServicePet();
  const activePlan: MockPlanId = planId === 'frequent' ? 'frequent' : 'basic';
  const servicePrice = serviceId === 'walk'
    ? getProviderWalkHourlyRate(provider)
    : getMockProviderServicePrice(provider, serviceId);
  const providerValue = selectedOffer?.basePrice
    ?? selectedProviderPlan?.basePrice
    ?? (servicePrice === undefined ? 0 : getMockProviderValue(servicePrice, activePlan));
  useRemoteQuote(providerValue);
  const payment = calculateMockPayment(providerValue);
  const parsedCustomDonation = Number(customDonation.replace(',', '.'));
  const donation = donationOption === 'other'
    ? Math.max(0, Number.isFinite(parsedCustomDonation) ? parsedCustomDonation : 0)
    : donationOption;
  const roundedDonation = Math.round((donation + Number.EPSILON) * 100) / 100;
  const canConfirm = acceptsServiceTerms && acceptsPrivacyPolicy;

  if (requestedDisabledService || !isBookableServiceEnabled(serviceId)) {
    return (
      <ScreenContainer>
        <DisabledServiceNotice />
      </ScreenContainer>
    );
  }

  const openMockLegalDocument = () => {
    router.push('/client/terms' as Href);
  };

  const confirmBooking = () => {
    recordMockProviderTermsAcceptance({
      termsId: HUPI_STANDARD_WALK_TERMS.id,
      termsVersion: HUPI_STANDARD_WALK_TERMS.version,
      effectiveDate: HUPI_STANDARD_WALK_TERMS.effectiveDate,
      providerId: provider.id,
      providerName: provider.name,
      clientId: profile.id,
      serviceOrPlanId: selectedOffer?.id ?? selectedProviderPlan?.id ?? serviceId,
    });
    if (selectedAddress && checkoutPreferences && savePreferencesToAddress) {
      saveLocalAddress({ ...selectedAddress, deliveryPreferences: checkoutPreferences });
    }
    const booking = addMockServiceBooking({
      serviceId,
      providerId: provider.id,
      provider: provider.name,
      providerInitials: provider.initials,
      pet: selectedPet?.name ?? 'Mascota',
      petId: selectedPet?.id,
      location: selectedAddress?.formattedAddress || selectedAddress?.streetAddress || provider.zone,
      meetingPreferences: checkoutPreferences,
      payment,
      donation: roundedDonation,
      coordinationRequestId: coordinationRequest?.id,
      selectedOfferId: selectedOffer?.id,
      offerTitle: selectedOffer?.title ?? selectedProviderPlan?.title,
    });
    confirmMockServiceCoordination(coordinationRequest?.id, booking.id, selectedOffer?.id, checkoutPreferences);

    router.push(
      `/client/booking-confirmation?providerId=${provider.id}&planId=${activePlan}&petId=${selectedPet?.id ?? ''}&donation=${roundedDonation.toFixed(2)}&serviceId=${serviceId}&bookingId=${booking.id}` as Href,
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.topbar}>
        <Pressable accessibilityLabel="__hupi_i18n:common.back" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={colors.text} name="arrow-back" size={22} />
        </Pressable>
        <HupiPagesLogo height={42} width={132} />
        <View style={styles.secureIcon}><Ionicons color={colors.success} name="lock-closed" size={18} /></View>
      </View>

      <Text style={styles.eyebrow}>__hupi_i18n:common.lastStep</Text>
      <Text style={styles.title}>__hupi_i18n:bookings.service-checkout.confirmYourReservation</Text>
      <Text style={styles.subtitle}>__hupi_i18n:bookings.service-checkout.reviewTheDataAndBreakdownBeforeConfirmingThePayment</Text>

      <View style={styles.sections}>
        <BookingSummaryCard
          petName={selectedPet?.name ?? 'Sin mascota seleccionada'}
          planId={activePlan}
          providerName={provider.name}
          serviceId={serviceId}
        />

        <Card style={styles.petCard} tone="soft">
          <ProfileAvatar size={52} style={styles.petAvatar} type="pet" uri={selectedPet?.petPhotoUri} />
          <View style={styles.petCopy}>
            <Text style={styles.petTitle}>__hupi_i18n:bookings.service-checkout.selectedPet</Text>
            <Text style={styles.petName}>{selectedPet ? `${selectedPet.name} · ${selectedPet.breed}` : 'Sin mascota seleccionada'}</Text>
            <Text style={styles.petHint}>__hupi_i18n:bookings.service-checkout.thisSelectionIsSavedToPrepareTheReservation</Text>
          </View>
        </Card>

        {selectedAddress && checkoutPreferences ? (
          <Card style={styles.meetingCard}>
            <View style={styles.meetingHeader}>
              <View style={styles.meetingIcon}><Ionicons color={colors.primary} name="location-outline" size={20} /></View>
              <View style={styles.meetingCopy}>
                <Text style={styles.meetingTitle}>{t('deliveryPreferences.savedAddressTitle')}</Text>
                <Text style={styles.meetingAddress}>{selectedAddress.label} · {selectedAddress.streetAddress}</Text>
              </View>
            </View>
            <View style={styles.addressChoices}>
              {addresses.map((address) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: address.id === selectedAddress.id }}
                  key={address.id}
                  onPress={() => setSelectedAddressId(address.id)}
                  style={[styles.addressChoice, address.id === selectedAddress.id && styles.addressChoiceActive]}
                >
                  <Ionicons color={address.id === selectedAddress.id ? colors.primary : colors.textMuted} name={address.id === selectedAddress.id ? 'radio-button-on' : 'radio-button-off'} size={18} />
                  <Text numberOfLines={2} style={styles.addressChoiceText}>{address.label} · {address.streetAddress}</Text>
                </Pressable>
              ))}
            </View>
            <AddressPreferencesSummary context="service" value={checkoutPreferences} />
            <Button
              icon={editingPreferences ? 'chevron-up' : 'options-outline'}
              onPress={() => setEditingPreferences((value) => !value)}
              title={t(editingPreferences ? 'deliveryPreferences.hideEditor' : 'deliveryPreferences.editForCheckout')}
              variant="outline"
            />
            {editingPreferences ? (
              <View style={styles.preferencesEditor}>
                <AddressPreferencesEditor context="service" onChange={setCheckoutPreferences} value={checkoutPreferences} />
                <Pressable onPress={() => setSavePreferencesToAddress((value) => !value)} style={styles.savePreferencesRow}>
                  <Ionicons color={savePreferencesToAddress ? colors.primary : colors.textMuted} name={savePreferencesToAddress ? 'checkbox' : 'square-outline'} size={21} />
                  <View style={styles.savePreferencesCopy}>
                    <Text style={styles.savePreferencesText}>{t('deliveryPreferences.saveForAddress')}</Text>
                    <Text style={styles.savePreferencesHint}>{t(savePreferencesToAddress ? 'deliveryPreferences.saveForAddress' : 'deliveryPreferences.onlyThisCheckout')}</Text>
                  </View>
                </Pressable>
              </View>
            ) : null}
          </Card>
        ) : null}

        <Card style={styles.providerCard}>
          <ProfileAvatar size={54} style={styles.avatar} type="provider" uri={providerPhotoUri} />
          <View style={styles.providerCopy}>
            <Text style={styles.providerName}>{provider.name}</Text>
            <View style={styles.badges}>
              {provider.isVerifiedByHupi ? <HupiVerifiedBadge /> : null}
              <HupiLevelBadge level={provider.level} />
            </View>
            <View style={styles.providerMeta}>
              <RatingBadge rating={provider.rating} reviews={provider.reviewCount} />
              <Text style={styles.providerServices}>{provider.completedServices}  __hupi_i18n:common.services</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.serviceCard} tone="soft">
          <Ionicons color={colors.primary} name="paw-outline" size={20} />
          <View style={styles.serviceCopy}>
            <Text style={styles.serviceLabel}>__hupi_i18n:bookings.service-checkout.selectedService</Text>
            <Text style={styles.serviceTitle}>{selectedOffer ? t('offerFlow.offerForPet', { pet: selectedOffer.petName }) : selectedProviderPlan?.title ?? service.title}</Text>
            {selectedOffer || selectedProviderPlan ? (
              <Text style={styles.offerMeta}>
                {selectedOffer
                  ? `${selectedOffer.duration} · ${selectedOffer.proposedDate} · ${selectedOffer.proposedTime}`
                  : `${selectedProviderPlan?.duration} · plan seleccionado`}
              </Text>
            ) : null}
          </View>
        </Card>

        <PaymentSummaryCard donation={roundedDonation} payment={payment} />

        <View>
          <Text style={styles.sectionTitle}>__hupi_i18n:common.paymentMethod</Text>
          <Text style={styles.sectionSubtitle}>__hupi_i18n:bookings.service-checkout.selectHowYouWouldPayInTheTestEnvironment</Text>
          <PaymentMethodSelector onChange={setPaymentMethod} value={paymentMethod} />
          <MockCheckboxRow
            checked={savePaymentMethod}
            label="__hupi_i18n:bookings.service-checkout.saveThisPaymentMethodToMyHupiWalletTo"
            onPress={() => setSavePaymentMethod((value) => !value)}
          />
        </View>

        <Card style={styles.infoCard} tone="coral">
          <View style={[styles.infoIcon, styles.chatIcon]}>
            <Ionicons color={colors.primary} name="chatbubbles-outline" size={21} />
          </View>
          <Text style={styles.infoText}>
            {selectedOffer
              ? 'Esta oferta viene del chat de coordinación. Al pagar, la reserva quedará confirmada dentro de Hupi.'
              : 'El chat con el proveedor se activará cuando confirmes la reserva para coordinar los detalles del servicio.'}
          </Text>
        </Card>

        <ProviderTermsAcceptanceBlock checked={acceptsServiceTerms} onChange={setAcceptsServiceTerms} placement="checkout" />

        <View style={styles.acceptanceCard}>
          <Text style={styles.acceptanceTitle}>__hupi_i18n:common.acceptances</Text>
          <AcceptanceRow
            checked={acceptsPrivacyPolicy}
            linkLabel="Política de protección de datos personales"
            onOpenLink={openMockLegalDocument}
            onToggle={() => setAcceptsPrivacyPolicy((value) => !value)}
            prefix="Acepto la "
          />
        </View>

        <DonationCard
          customValue={customDonation}
          onChange={setDonationOption}
          onChangeCustomValue={setCustomDonation}
          value={donationOption}
        />

        <Button
          disabled={!canConfirm}
          icon="shield-checkmark-outline"
          onDisabledPress={() => Alert.alert(t(
            acceptsServiceTerms ? 'providerProfile.acceptance.completeRequired' : 'providerProfile.acceptance.requiredNotice',
          ))}
          onPress={confirmBooking}
          title="__hupi_i18n:bookings.service-checkout.confirmAndPay"
        />
        <Text style={styles.mockNotice}>__hupi_i18n:bookings.service-checkout.paymentInTrialModeNoActualChargeWillBe</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topbar: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  secureIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#e7f5ef', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1.2, marginTop: 26 },
  title: { color: colors.text, fontSize: 29, fontWeight: '900', marginTop: 7 },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 23, marginTop: 7 },
  sections: { gap: 16, marginTop: 23 },
  petCard: { flexDirection: 'row', alignItems: 'center', gap: 12, shadowOpacity: 0 },
  petAvatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  petCopy: { flex: 1 },
  petTitle: { color: colors.secondary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7 },
  petName: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 4 },
  petHint: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4, fontWeight: '700' },
  providerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, shadowOpacity: 0.05 },
  meetingCard: { gap: 13, shadowOpacity: 0.04 },
  meetingHeader: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  meetingIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 14, height: 42, justifyContent: 'center', width: 42 },
  meetingCopy: { flex: 1, minWidth: 0 },
  meetingTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  meetingAddress: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  addressChoices: { gap: 7 },
  addressChoice: { alignItems: 'center', borderColor: colors.border, borderRadius: 13, borderWidth: 1, flexDirection: 'row', gap: 8, minHeight: 44, paddingHorizontal: 11, paddingVertical: 8 },
  addressChoiceActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  addressChoiceText: { color: colors.text, flex: 1, fontSize: 13, lineHeight: 18 },
  preferencesEditor: { borderTopColor: colors.border, borderTopWidth: 1, gap: 14, paddingTop: 15 },
  savePreferencesRow: { alignItems: 'flex-start', backgroundColor: colors.soft, borderRadius: 14, flexDirection: 'row', gap: 9, padding: 11 },
  savePreferencesCopy: { flex: 1 },
  savePreferencesText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  savePreferencesHint: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  avatar: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  providerCopy: { flex: 1 },
  providerName: { color: colors.text, fontSize: 15, fontWeight: '900' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  providerMeta: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 7 },
  providerServices: { color: colors.textMuted, fontSize: 12 },
  serviceCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, shadowOpacity: 0 },
  serviceCopy: { flex: 1 },
  serviceLabel: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7 },
  serviceTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 3 },
  offerMeta: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 4 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  sectionSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 4, marginBottom: 11 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, shadowOpacity: 0 },
  infoIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  chatIcon: { backgroundColor: colors.white },
  infoText: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 19, fontWeight: '700' },
  acceptanceCard: { borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 15, gap: 12 },
  acceptanceTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  acceptanceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkedBox: { backgroundColor: colors.primary, borderColor: colors.primary },
  acceptanceText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '700' },
  legalLink: { color: colors.secondary, textDecorationLine: 'underline', fontWeight: '900' },
  walletRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 15, backgroundColor: colors.soft, padding: 12, marginTop: 10 },
  walletCopy: { flex: 1 },
  walletText: { color: colors.text, fontSize: 12, lineHeight: 19, fontWeight: '800' },
  walletHint: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  mockNotice: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: -6 },
});
