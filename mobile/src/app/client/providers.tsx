import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import type { Href } from 'expo-router';
import { useLocalSearchParams,
  useRouter } from 'expo-router';
import { useMemo,
  useState } from 'react';
import { Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { DisabledServiceNotice } from '@/components/DisabledServiceNotice';
import { FilterChip } from '@/components/providers/FilterChip';
import { FavoriteProviderListsModal } from '@/components/providers/FavoriteProviderListsModal';
import { HupiPagesLogo } from '@/components/HupiPagesLogo';
import { ProviderMap } from '@/components/providers/ProviderMap';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { ProviderCard } from '@/components/providers/ProviderCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { isBookableServiceEnabled, isServiceEnabled } from '@/constants/features';
import {
  createMockServiceCoordinationRequest,
  getMockFavoriteProviderIds,
  getSelectedServicePet,
} from '@/constants/mockData';
import { getMockServiceProviders, type MockProvider } from '@/constants/mockProviders';
import { isBookableServiceId, serviceCopy, services, type ServiceId } from '@/constants/services';
import { Pressable, Text } from '@/i18n/components';
import { useTranslation } from '../../../node_modules/react-i18next';
import { useLocalAccount } from '@/hooks/useLocalAccount';
import { useMockProviderPricing } from '@/hooks/useMockProviderPricing';
import { DEFAULT_ADDRESS_COORDINATE } from '@/domain/address';
import {
  DEFAULT_PROVIDER_SEARCH_RADIUS_KM,
  deriveProviderSearchResults,
  type ProviderFilterId,
} from '@/domain/providerSearch';

const filters: ProviderFilterId[] = ['best-rated', 'closest', 'verified'];

type ViewMode = 'list' | 'map';

export default function ProvidersScreen() {
  useMockProviderPricing();
  const router = useRouter();
  const { addressId, serviceId: serviceIdParam } = useLocalSearchParams<{ addressId?: string; serviceId?: string }>();
  const { addresses } = useLocalAccount();
  const { t } = useTranslation();
  const serviceId = isBookableServiceId(serviceIdParam) ? serviceIdParam : 'walk';
  const requestedDisabledService = Boolean(
    serviceIdParam
    && services.some((serviceItem) => serviceItem.id === serviceIdParam)
    && !isServiceEnabled(serviceIdParam as ServiceId),
  );
  const service = serviceCopy[serviceId];
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeFilter, setActiveFilter] = useState<ProviderFilterId>('best-rated');
  const [favoriteProviderIds, setFavoriteProviderIds] = useState(() => getMockFavoriteProviderIds());
  const [favoriteModalProvider, setFavoriteModalProvider] = useState<MockProvider | null>(null);
  const providers = useMemo(() => getMockServiceProviders(serviceId), [serviceId]);
  const selectedAddress = addresses.find((item) => item.id === addressId)
    ?? addresses.find((item) => item.isDefault)
    ?? addresses[0];
  const hasAddressCoordinates = typeof selectedAddress?.latitude === 'number'
    && typeof selectedAddress?.longitude === 'number';
  const center = hasAddressCoordinates
    ? { latitude: selectedAddress.latitude as number, longitude: selectedAddress.longitude as number }
    : DEFAULT_ADDRESS_COORDINATE;
  const results = useMemo(
    () => deriveProviderSearchResults(
      providers,
      center,
      activeFilter,
      DEFAULT_PROVIDER_SEARCH_RADIUS_KM,
    ),
    [activeFilter, center.latitude, center.longitude, providers],
  );
  const selectedPet = getSelectedServicePet();
  const addressLabel = selectedAddress?.label || selectedAddress?.sector || selectedAddress?.city || 'Quito';
  const filterLabels: Record<ProviderFilterId, string> = {
    'best-rated': t('providerSearch.filters.bestRated'),
    closest: t('providerSearch.filters.closest'),
    verified: t('providerSearch.filters.verified'),
  };

  if (requestedDisabledService || !isBookableServiceEnabled(serviceId)) {
    return (
      <ScreenContainer>
        <DisabledServiceNotice />
      </ScreenContainer>
    );
  }

  const openProvider = (providerId: string) => {
    router.push(`/client/provider-detail?providerId=${providerId}&serviceId=${serviceId}&addressId=${encodeURIComponent(selectedAddress?.id ?? '')}` as Href);
  };

  const coordinateProvider = (providerId: string) => {
    const request = createMockServiceCoordinationRequest({
      providerId,
      serviceType: serviceId,
      zone: selectedAddress?.formattedAddress || selectedAddress?.address || selectedAddress?.sector,
    });
    router.push(`/chat?chatId=${request.chatId}&viewer=client` as Href);
  };

  const refreshFavorites = () => {
    setFavoriteProviderIds(getMockFavoriteProviderIds());
    Alert.alert("__hupi_i18n:common.supplierSavedInFavorites", "__hupi_i18n:common.yourListsHaveBeenUpdated");
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.topbar}>
        <Pressable accessibilityLabel="__hupi_i18n:common.back" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={colors.text} name="arrow-back" size={22} />
        </Pressable>
        <View pointerEvents="none" style={styles.centeredLogo}>
          <HupiPagesLogo height={42} width={132} />
        </View>
      </View>

      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>{t('providerSearch.eyebrow', { location: addressLabel, service: service.label.toUpperCase() })}</Text>
          <Text style={styles.title}>{service.providersTitle}</Text>
          <Text style={styles.subtitle}>{t('providerSearch.subtitle')}</Text>
        </View>
        <ProfileAvatar size={58} style={styles.petAvatar} type="pet" uri={selectedPet?.petPhotoUri} />
      </View>

      <View style={styles.toggle}>
        <Pressable
          onPress={() => setViewMode('list')}
          style={[styles.toggleOption, viewMode === 'list' && styles.activeToggle]}
        >
          <Ionicons
            color={viewMode === 'list' ? colors.white : colors.textMuted}
            name="list-outline"
            size={17}
          />
          <Text style={[styles.toggleText, viewMode === 'list' && styles.activeToggleText]}>__hupi_i18n:common.list</Text>
        </Pressable>
        <Pressable
          onPress={() => setViewMode('map')}
          style={[styles.toggleOption, viewMode === 'map' && styles.activeToggle]}
        >
          <Ionicons
            color={viewMode === 'map' ? colors.white : colors.textMuted}
            name="map-outline"
            size={17}
          />
          <Text style={[styles.toggleText, viewMode === 'map' && styles.activeToggleText]}>__hupi_i18n:common.map</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.filters}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {filters.map((filter) => (
          <FilterChip
            active={activeFilter === filter}
            key={filter}
            label={filterLabels[filter]}
            onPress={() => setActiveFilter(filter)}
          />
        ))}
      </ScrollView>

      {!hasAddressCoordinates ? (
        <View style={styles.locationNotice}>
          <Ionicons color={colors.primary} name="location-outline" size={18} />
          <Text style={styles.locationNoticeText}>{t('providerSearch.fallbackNotice')}</Text>
        </View>
      ) : null}

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{t('providerSearch.availableCount', { count: results.length })}</Text>
      </View>

      {results.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons color={colors.primary} name="search-outline" size={28} />
          <Text style={styles.emptyText}>{t('providerSearch.empty')}</Text>
        </View>
      ) : viewMode === 'list' ? (
        <View style={styles.list}>
          {results.map(({ distanceKm, provider }) => (
            <ProviderCard
              distanceKm={distanceKm}
              key={provider.id}
              isFavorite={favoriteProviderIds.includes(provider.id)}
              onBook={() => coordinateProvider(provider.id)}
              onToggleFavorite={() => setFavoriteModalProvider(provider)}
              onViewProfile={() => openProvider(provider.id)}
              provider={provider}
              serviceId={serviceId}
            />
          ))}
        </View>
      ) : (
        <ProviderMap
          center={center}
          onCoordinate={coordinateProvider}
          onViewProfile={openProvider}
          providers={results}
          serviceId={serviceId}
        />
      )}
      <FavoriteProviderListsModal
        onClose={() => setFavoriteModalProvider(null)}
        onSaved={refreshFavorites}
        provider={favoriteModalProvider}
        visible={Boolean(favoriteModalProvider)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8 },
  topbar: { minHeight: 46, flexDirection: 'row', alignItems: 'center', position: 'relative' },
  centeredLogo: { alignItems: 'center', bottom: 0, justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 0 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 26 },
  headingCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colors.text, flexShrink: 1, fontSize: 27, lineHeight: 33, fontWeight: '900', marginTop: 7 },
  subtitle: { color: colors.textMuted, flexShrink: 1, fontSize: 15, lineHeight: 22, marginTop: 6 },
  petAvatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  toggle: { flexDirection: 'row', borderRadius: 16, backgroundColor: colors.soft, padding: 4, marginTop: 22 },
  toggleOption: { flex: 1, minHeight: 40, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  activeToggle: { backgroundColor: colors.primary },
  toggleText: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  activeToggleText: { color: colors.white },
  filters: { gap: 8, paddingVertical: 16, paddingRight: 20 },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  resultsCount: { flex: 1, color: colors.text, flexShrink: 1, fontSize: 15, fontWeight: '900', lineHeight: 20 },
  locationNotice: { alignItems: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: 15, flexDirection: 'row', gap: 8, marginBottom: 12, padding: 11 },
  locationNoticeText: { color: colors.text, flex: 1, fontSize: 13, lineHeight: 19 },
  list: { gap: 13 },
  empty: { borderRadius: 18, backgroundColor: colors.soft, gap: 9, padding: 22, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
