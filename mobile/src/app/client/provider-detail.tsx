import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useLocalSearchParams,
  useRouter } from 'expo-router';
import { useMemo,
  useState } from 'react';
import { Alert,
  StyleSheet,
} from 'react-native';

import { Button } from '@/components/Button';
import { PolicySummaryCard } from '@/components/booking/PolicySummaryCard';
import { Card } from '@/components/Card';
import { DisabledServiceNotice } from '@/components/DisabledServiceNotice';
import { FavoriteProviderListsModal } from '@/components/providers/FavoriteProviderListsModal';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { HupiLevelBadge } from '@/components/providers/HupiLevelBadge';
import { HupiVerifiedBadge } from '@/components/providers/HupiVerifiedBadge';
import { RatingBadge } from '@/components/providers/RatingBadge';
import { ProviderReviewsModal } from '@/components/provider/ProviderReviewsModal';
import { WalkSpecialConditionsAccordion } from '@/components/provider/WalkSpecialConditionsAccordion';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { isBookableServiceEnabled, isServiceEnabled } from '@/constants/features';
import {
  formatMockCurrency,
} from '@/constants/mockCheckout';
import {
  createMockServiceCoordinationRequest,
  getMockProviderPlans,
  isMockFavoriteProvider,
  type MockProviderPlan,
} from '@/constants/mockData';
import { getMockProviderPhotoUri, getMockProviderServicePrice, mockProviders } from '@/constants/mockProviders';
import { isBookableServiceId, serviceCopy, services, type ServiceId } from '@/constants/services';
import { fonts } from '@/constants/typography';
import { Pressable, Text } from '@/i18n/components';
import { useLocalAccount } from '@/hooks/useLocalAccount';
import { DEFAULT_ADDRESS_COORDINATE } from '@/domain/address';
import { calculateHaversineDistanceKm, formatDistanceKm } from '@/domain/providerSearch';
import { formatProviderHourlyRate, getProviderWalkHourlyRate } from '@/domain/providerPricing';
import { useTranslation } from '../../../node_modules/react-i18next';
import { useMockProviderPricing } from '@/hooks/useMockProviderPricing';
import { getPublicProviderWalkProfile } from '@/domain/providerWalkProfile';

export default function ProviderDetailScreen() {
  useMockProviderPricing();
  const router = useRouter();
  const { addressId, providerId, serviceId: serviceIdParam } = useLocalSearchParams<{ addressId?: string; providerId?: string; serviceId?: string }>();
  const { addresses } = useLocalAccount();
  const { i18n, t } = useTranslation();
  const serviceId = isBookableServiceId(serviceIdParam) ? serviceIdParam : 'walk';
  const requestedDisabledService = Boolean(
    serviceIdParam
    && services.some((serviceItem) => serviceItem.id === serviceIdParam)
    && !isServiceEnabled(serviceIdParam as ServiceId),
  );
  const service = serviceCopy[serviceId];
  const [favoriteModalVisible, setFavoriteModalVisible] = useState(false);
  const [reviewsVisible, setReviewsVisible] = useState(false);

  const provider = useMemo(
    () => mockProviders.find((item) => item.id === providerId) ?? mockProviders[0],
    [providerId],
  );
  const [isFavorite, setIsFavorite] = useState(() => isMockFavoriteProvider(provider.id));
  const servicePrice = serviceId === 'walk'
    ? getProviderWalkHourlyRate(provider)
    : getMockProviderServicePrice(provider, serviceId);
  const formattedServicePrice = formatProviderHourlyRate(servicePrice, i18n.language);
  const providerPhotoUri = getMockProviderPhotoUri(provider.id);
  const publicProfile = getPublicProviderWalkProfile(provider.walkProfile, provider.servicePrices.walk, provider.zone);
  const providerPlans = getMockProviderPlans(provider.id, serviceId);
  const selectedAddress = addresses.find((item) => item.id === addressId)
    ?? addresses.find((item) => item.isDefault)
    ?? addresses[0];
  const clientCoordinate = typeof selectedAddress?.latitude === 'number' && typeof selectedAddress?.longitude === 'number'
    ? { latitude: selectedAddress.latitude, longitude: selectedAddress.longitude }
    : DEFAULT_ADDRESS_COORDINATE;
  const providerDistance = formatDistanceKm(calculateHaversineDistanceKm(clientCoordinate, provider), i18n.language);

  if (requestedDisabledService || !isBookableServiceEnabled(serviceId)) {
    return (
      <ScreenContainer>
        <DisabledServiceNotice />
      </ScreenContainer>
    );
  }

  if (!publicProfile) {
    return (
      <ScreenContainer>
        <Card tone="soft"><Text style={styles.unavailableText}>{t('providerProfile.publicUnavailable')}</Text></Card>
      </ScreenContainer>
    );
  }

  const coordinateService = () => {
    const request = createMockServiceCoordinationRequest({
      providerId: provider.id,
      serviceType: serviceId,
      zone: selectedAddress?.formattedAddress || selectedAddress?.address || selectedAddress?.sector,
    });
    router.push(`/chat?chatId=${request.chatId}&viewer=client` as Href);
  };

  const choosePlan = (plan: MockProviderPlan) => {
    router.push(`/client/service-checkout?providerId=${provider.id}&serviceId=${plan.serviceType}&planId=${plan.id}` as Href);
  };

  const saveFavorite = () => {
    setIsFavorite(isMockFavoriteProvider(provider.id));
    Alert.alert("__hupi_i18n:common.supplierSavedInFavorites", "__hupi_i18n:common.yourListsHaveBeenUpdated");
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroOrbLarge} />
        <View style={styles.heroOrbSmall} />
        <View style={styles.topbar}>
          <Pressable accessibilityLabel="__hupi_i18n:common.back" onPress={() => router.back()} style={styles.backButton}>
            <Ionicons color={colors.secondary} name="arrow-back" size={22} />
          </Pressable>
          <Text style={styles.headerTitle}>{service.label}</Text>
          <Pressable onPress={() => setFavoriteModalVisible(true)} style={styles.favoriteButton}>
            <Ionicons color={isFavorite ? colors.primary : colors.textMuted} name={isFavorite ? 'heart' : 'heart-outline'} size={21} />
          </Pressable>
        </View>

        <ProfileAvatar size={92} style={styles.avatar} type="provider" uri={providerPhotoUri} />
        <View style={styles.nameRow}>
          <Text numberOfLines={2} style={styles.name}>{provider.name}</Text>
          {provider.isVerifiedByHupi ? <HupiVerifiedBadge size={20} /> : null}
        </View>
        <View style={styles.badgeRow}>
          <HupiLevelBadge level={provider.level} />
        </View>
        <Pressable
          accessibilityHint={t('providerReviews.openHint')}
          accessibilityRole="button"
          onPress={() => setReviewsVisible(true)}
          style={styles.profileMetaRow}
        >
          <RatingBadge rating={provider.rating} reviews={provider.reviewCount} />
          <Text style={styles.profileMetaDot}>•</Text>
          <Text style={styles.profileMetaText}>{provider.completedServices} {t('generated.provider.provider-detail.servicesPerformed')}</Text>
          <Text style={styles.viewReviews}>{t('providerReviews.view')}</Text>
        </Pressable>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{provider.completedServices}</Text>
          <Text style={styles.statLabel}>__hupi_i18n:common.services</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{provider.experienceYears} {t('generated.common.years')}</Text>
          <Text style={styles.statLabel}>{t('generated.common.experience')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formattedServicePrice ?? t('providerPricing.undefinedRate')}</Text>
          <Text style={styles.statLabel}>{t('providerPricing.perHour')}</Text>
        </View>
      </View>

      <Card style={styles.zoneCard} tone="soft">
        <Ionicons color={colors.secondary} name="location-outline" size={20} />
        <View style={styles.zoneCopy}>
          <Text style={styles.zoneLabel}>__hupi_i18n:provider.provider-detail.coverageAreas</Text>
          <Text style={styles.zoneValue}>{provider.zone} · {providerDistance} {t('generated.common.ofYou')}</Text>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>{t('providerProfile.public.about')}</Text>
      <Card style={styles.aboutCard} tone="soft">
        <Text style={styles.aboutExperience}>{t('providerProfile.public.experienceYears', { count: provider.experienceYears })}</Text>
        <Text style={styles.aboutText}>{publicProfile.description}</Text>
      </Card>

      <Text style={styles.sectionTitle}>{t('providerProfile.public.howWalks')}</Text>
      <Card style={styles.featureCard}>
        <PublicFeature label={t('providerProfile.sizes.title')} values={publicProfile.acceptedDogSizes.map((value) => t(`providerProfile.sizes.options.${value}`))} />
        <PublicFeature label={t('providerProfile.ages.title')} values={publicProfile.acceptedDogAges.map((value) => t(`providerProfile.ages.options.${value}`))} />
        <PublicFeature label={t('providerProfile.maximumDogs.title')} values={[t('providerProfile.maximumDogs.value', { count: publicProfile.maximumDogsPerWalk })]} />
        <PublicFeature label={t('providerProfile.modalities.title')} values={publicProfile.modalities.map((value) => t(`providerProfile.modalities.options.${value}`))} />
        {publicProfile.walkTypes.length ? <PublicFeature label={t('providerProfile.walkTypes.title')} values={publicProfile.walkTypes.map((value) => t(`providerProfile.walkTypes.options.${value}`))} /> : null}
        {publicProfile.specialHandling.length ? <PublicFeature label={t('providerProfile.specialHandling.title')} values={publicProfile.specialHandling.map((value) => t(`providerProfile.specialHandling.options.${value}`))} /> : null}
      </Card>

      <Text style={styles.sectionTitle}>{t('providerProfile.public.requirements')}</Text>
      <Card style={styles.listCard}>
        {publicProfile.requirements.map((requirement, index) => (
          <View key={requirement} style={[styles.listRow, index > 0 && styles.listDivider]}>
            <Ionicons color={colors.primary} name="checkmark-circle-outline" size={18} />
            <Text style={styles.listText}>{t(`providerProfile.requirements.options.${requirement}`)}</Text>
          </View>
        ))}
      </Card>

      <View style={styles.policyBlock}>
        <PolicySummaryCard />
      </View>
      <View style={styles.specialConditionsBlock}>
        <WalkSpecialConditionsAccordion />
      </View>

      {publicProfile.certifications.length ? <>
        <Text style={styles.sectionTitle}>{t('providerProfile.public.certifications')}</Text>
        <Card style={styles.listCard}>
          {publicProfile.certifications.map((certificate, index) => (
            <View key={certificate.id} style={[styles.listRow, index > 0 && styles.listDivider]}>
              <View style={styles.listIcon}><Ionicons color={colors.secondary} name="ribbon-outline" size={19} /></View>
              <View style={styles.certificateCopy}>
                <Text style={styles.listText}>{certificate.name}</Text>
                <Text style={styles.certificateMeta}>{certificate.institution} · {certificate.year}</Text>
              </View>
            </View>
          ))}
        </Card>
      </> : null}

      <Text style={styles.sectionTitle}>{t('providerProfile.public.plans')}</Text>
      <View style={styles.plans}>
        {[serviceId].map((providerServiceType) => {
          const plansForService = providerPlans.filter((plan) => plan.serviceType === providerServiceType);

          return (
            <Card key={providerServiceType} style={styles.servicePlanGroup}>
              <Text style={styles.servicePlanTitle}>
                {serviceCopy[providerServiceType].label}
                {t('providerProfile.plans.mainService')}
              </Text>
              <View style={styles.planStack}>
                {plansForService.map((plan) => (
                  <View key={plan.id} style={styles.plan}>
                    <View style={styles.planTop}>
                      <View style={styles.planIcon}>
                        <Ionicons color={colors.primary} name="pricetag-outline" size={16} />
                      </View>
                      <View style={styles.planCopy}>
                        <Text style={styles.planName}>{plan.title}</Text>
                        <Text style={styles.planDetail}>{plan.description}</Text>
                        <Text style={styles.planDuration}>{t('providerProfile.plans.publicDuration', { count: plan.durationMinutes })}</Text>
                        <Text style={styles.planDetail}>{t('providerProfile.plans.publicWalkCount', { count: plan.walkCount })}</Text>
                        {plan.frequencyPerWeek ? <Text style={styles.planDetail}>{t('providerProfile.plans.publicFrequency', { count: plan.frequencyPerWeek, type: t(`providerProfile.plans.frequencyTypes.${plan.frequencyType}`) })}</Text> : null}
                        {plan.validityDays ? <Text style={styles.planDetail}>{t('providerProfile.plans.publicValidity', { count: plan.validityDays })}</Text> : null}
                        <Text style={styles.planDetail}>{t('providerProfile.plans.publicPets', { count: plan.petsIncluded })}</Text>
                      </View>
                      <Text style={styles.planPrice}>{formatMockCurrency(plan.basePrice)}</Text>
                    </View>
                    <Text style={styles.planConditions}>{plan.includes.join(' · ')}</Text>
                    {plan.conditions.length ? <Text style={styles.planConditions}>{plan.conditions.join(' · ')}</Text> : null}
                    <Button
                      icon="arrow-forward"
                      onPress={() => choosePlan(plan)}
                      title={t('providerProfile.plans.coordinate')}
                    />
                  </View>
                ))}
              </View>
            </Card>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>{t('providerProfile.public.reviews')}</Text>
      <Pressable
        accessibilityHint={t('providerReviews.openHint')}
        accessibilityRole="button"
        onPress={() => setReviewsVisible(true)}
        style={styles.reviewsPressable}
      >
        <Card style={styles.reviewsCard} tone="soft">
          <RatingBadge rating={provider.rating} reviews={provider.reviewCount} />
          <View style={styles.reviewsCopy}>
            <Text style={styles.reviewsText}>{t('providerProfile.public.reviewsSummary', { count: provider.reviewCount })}</Text>
            <Text style={styles.viewReviews}>{t('providerReviews.view')}</Text>
          </View>
          <Ionicons color={colors.secondary} name="chevron-forward" size={19} />
        </Card>
      </Pressable>

      <View style={styles.disclaimer}>
        <Ionicons color={colors.secondary} name="information-circle-outline" size={18} />
        <Text style={styles.disclaimerText}>__hupi_i18n:provider.provider-detail.plansAndPricesInTrialModeActualPaymentWill</Text>
      </View>

      <Button
        icon="chatbubbles-outline"
        onPress={coordinateService}
        style={styles.continueButton}
        title="__hupi_i18n:common.coordinate"
        variant="outline"
      />
      <FavoriteProviderListsModal
        onClose={() => setFavoriteModalVisible(false)}
        onSaved={saveFavorite}
        provider={provider}
        visible={favoriteModalVisible}
      />
      <ProviderReviewsModal onClose={() => setReviewsVisible(false)} provider={provider} visible={reviewsVisible} />
    </ScreenContainer>
  );
}

function PublicFeature({ label, values }: { label: string; values: string[] }) {
  return (
    <View style={styles.publicFeature}>
      <Text style={styles.publicFeatureLabel}>{label}</Text>
      <View style={styles.chips}>
        {values.map((value) => (
          <View key={value} style={styles.serviceChip}>
            <Ionicons color={colors.primary} name="paw-outline" size={14} />
            <Text style={styles.serviceChipText}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 0, paddingBottom: 36 },
  hero: { backgroundColor: colors.soft, paddingHorizontal: 20, paddingBottom: 24, alignItems: 'center', overflow: 'hidden' },
  heroOrbLarge: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: colors.secondarySoft, right: -62, top: -54 },
  heroOrbSmall: { position: 'absolute', width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primarySoft, left: -24, bottom: 12 },
  topbar: { alignSelf: 'stretch', minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  favoriteButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 92, height: 92, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  nameRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'center', marginTop: 15, maxWidth: '90%' },
  name: { color: colors.text, flexShrink: 1, fontSize: 25, fontWeight: '900', lineHeight: 31, textAlign: 'center' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 9 },
  profileMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 8 },
  profileMetaDot: { color: colors.border },
  profileMetaText: { color: colors.textMuted, fontSize: 12 },
  viewReviews: { color: colors.secondary, fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 18 },
  stats: { marginHorizontal: 20, marginTop: -1, minHeight: 78, borderRadius: 20, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: colors.border },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: 15, fontWeight: '900' },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  zoneCard: { marginHorizontal: 20, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10, shadowOpacity: 0 },
  zoneCopy: { flex: 1 },
  zoneLabel: { color: colors.secondary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7 },
  zoneValue: { color: colors.text, fontSize: 13, fontWeight: '800', marginTop: 3 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginHorizontal: 20, marginTop: 27, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceChip: { minHeight: 36, borderRadius: 14, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11 },
  serviceChipText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  experienceCard: { marginHorizontal: 20, flexDirection: 'row', gap: 12, shadowOpacity: 0 },
  experienceIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  experienceText: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 22 },
  listCard: { marginHorizontal: 20, paddingVertical: 3, shadowOpacity: 0.05 },
  listRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  listDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  listIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.secondarySoft, alignItems: 'center', justifyContent: 'center' },
  listText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '700' },
  policyBlock: { marginHorizontal: 20, marginTop: 27 },
  specialConditionsBlock: { marginHorizontal: 20, marginTop: 12 },
  unavailableText: { color: colors.text, fontFamily: fonts.regular, fontSize: 14, lineHeight: 22 },
  aboutCard: { marginHorizontal: 20, gap: 8, shadowOpacity: 0 },
  aboutExperience: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 13 },
  aboutText: { color: colors.text, fontFamily: fonts.regular, fontSize: 14, lineHeight: 22 },
  featureCard: { marginHorizontal: 20, gap: 16, shadowOpacity: 0 },
  publicFeature: { gap: 8 },
  publicFeatureLabel: { color: colors.text, fontFamily: fonts.bold, fontSize: 14, lineHeight: 20 },
  certificateCopy: { flex: 1, minWidth: 0 },
  certificateMeta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, marginTop: 3 },
  plans: { gap: 12, marginHorizontal: 20 },
  servicePlanGroup: { gap: 12, shadowOpacity: 0.04 },
  servicePlanTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  planStack: { gap: 10 },
  plan: { borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: 14, gap: 11 },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  planCopy: { flex: 1 },
  planName: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  planDetail: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, marginTop: 3 },
  planDuration: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', marginTop: 5 },
  planPrice: { color: colors.primary, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  planConditions: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  reviewsCard: { alignItems: 'center', flexDirection: 'row', gap: 12, marginHorizontal: 20, shadowOpacity: 0 },
  reviewsPressable: { borderRadius: 18 },
  reviewsCopy: { flex: 1, gap: 3 },
  reviewsText: { color: colors.textMuted, flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  disclaimer: { flexDirection: 'row', gap: 8, borderRadius: 14, backgroundColor: colors.secondarySoft, padding: 12, marginHorizontal: 20, marginVertical: 17 },
  disclaimerText: { flex: 1, color: colors.secondary, fontSize: 12, lineHeight: 19 },
  continueButton: { marginHorizontal: 20 },
});
