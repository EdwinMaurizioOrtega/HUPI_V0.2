import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { ThemedView as View } from '@/theme/ThemedView';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useTranslation } from '../../../node_modules/react-i18next';

import { ProfileAvatar } from '@/components/ProfileAvatar';
import { colors } from '@/constants/colors';
import { getMockProviderPhotoUri, getMockProviderServicePrice } from '@/constants/mockProviders';
import { fonts } from '@/constants/typography';
import { formatDistanceKm } from '@/domain/providerSearch';
import { Pressable, Text } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';
import { RatingBadge } from './RatingBadge';
import type { ProviderMapProps } from './ProviderMap.types';

const INITIAL_DELTA = 0.035;

export function ProviderMap({
  center,
  onCoordinate,
  onViewProfile,
  providers,
  serviceId,
}: ProviderMapProps) {
  const mapRef = useRef<MapView>(null);
  const { width } = useWindowDimensions();
  const { i18n, t } = useTranslation();
  const { resolvedTheme, tokens } = useTheme();
  const [selectedProviderId, setSelectedProviderId] = useState(providers[0]?.provider.id);
  const coordinateKey = providers.map((item) => item.provider.id).join('|');
  const selected = useMemo(
    () => providers.find((item) => item.provider.id === selectedProviderId) ?? providers[0],
    [providers, selectedProviderId],
  );

  useEffect(() => {
    if (!providers.some((item) => item.provider.id === selectedProviderId)) {
      setSelectedProviderId(providers[0]?.provider.id);
    }
  }, [coordinateKey, providers, selectedProviderId]);

  useEffect(() => {
    const coordinates = [
      center,
      ...providers.map(({ provider }) => ({
        latitude: provider.latitude,
        longitude: provider.longitude,
      })),
    ];

    requestAnimationFrame(() => {
      if (coordinates.length > 1) {
        mapRef.current?.fitToCoordinates(coordinates, {
          animated: true,
          edgePadding: { bottom: 190, left: 46, right: 46, top: 64 },
        });
      } else {
        mapRef.current?.animateToRegion({
          ...center,
          latitudeDelta: INITIAL_DELTA,
          longitudeDelta: INITIAL_DELTA,
        }, 280);
      }
    });
  }, [center.latitude, center.longitude, coordinateKey]);

  return (
    <View style={[styles.frame, { borderColor: tokens.border }]}>
      <MapView
        initialRegion={{
          ...center,
          latitudeDelta: INITIAL_DELTA,
          longitudeDelta: INITIAL_DELTA,
        }}
        ref={mapRef}
        showsCompass
        showsMyLocationButton={false}
        style={styles.map}
        userInterfaceStyle={resolvedTheme}
      >
        <Marker
          accessibilityLabel={t('providerSearch.clientLocation')}
          coordinate={center}
          pinColor={tokens.secondary}
          title={t('providerSearch.clientLocation')}
        />
        {providers.map(({ provider, distanceKm }) => (
          <Marker
            accessibilityLabel={`${provider.name}, ${formatDistanceKm(distanceKm, i18n.language)}`}
            coordinate={{ latitude: provider.latitude, longitude: provider.longitude }}
            key={provider.id}
            onPress={() => setSelectedProviderId(provider.id)}
            title={provider.name}
          >
            <View style={[styles.providerMarker, selected?.provider.id === provider.id && styles.selectedMarker]}>
              <Ionicons color={colors.white} name="paw" size={17} />
            </View>
          </Marker>
        ))}
      </MapView>

      {selected ? (
        <View style={[styles.summary, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          {width >= 375 ? (
            <ProfileAvatar
              size={48}
              style={styles.avatar}
              type="provider"
              uri={getMockProviderPhotoUri(selected.provider.id)}
            />
          ) : null}
          <View style={styles.summaryCopy}>
            <Text numberOfLines={1} style={[styles.name, { color: tokens.text }]}>{selected.provider.name}</Text>
            <View style={styles.meta}>
              <RatingBadge rating={selected.provider.rating} />
              <Text style={[styles.distance, { color: tokens.textMuted }]}>
                {formatDistanceKm(selected.distanceKm, i18n.language)}
              </Text>
              <Text style={[styles.price, { color: tokens.primary }]}>
                {t('providerSearch.priceFrom', { price: getMockProviderServicePrice(selected.provider, serviceId).toFixed(2) })}
              </Text>
            </View>
          </View>
          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={t('providerSearch.viewProfile')}
              onPress={() => onViewProfile(selected.provider.id)}
              style={[styles.action, { backgroundColor: tokens.secondarySoft }]}
            >
              <Ionicons color={tokens.secondary} name="person-outline" size={18} />
            </Pressable>
            <Pressable
              accessibilityLabel={t('providerSearch.coordinate')}
              onPress={() => onCoordinate(selected.provider.id)}
              style={[styles.action, { backgroundColor: tokens.primary }]}
            >
              <Ionicons color={colors.white} name="chatbubbles-outline" size={18} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: 22, borderWidth: 1, height: 500, minHeight: 360, overflow: 'hidden' },
  map: { flex: 1 },
  providerMarker: { alignItems: 'center', backgroundColor: colors.primary, borderColor: colors.white, borderRadius: 20, borderWidth: 3, height: 40, justifyContent: 'center', width: 40 },
  selectedMarker: { backgroundColor: colors.secondary, transform: [{ scale: 1.08 }] },
  summary: { alignItems: 'center', borderRadius: 18, borderWidth: 1, bottom: 12, flexDirection: 'row', gap: 10, left: 12, padding: 11, position: 'absolute', right: 12 },
  avatar: { borderRadius: 16, height: 48, width: 48 },
  summaryCopy: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 21 },
  meta: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 5 },
  distance: { fontFamily: fonts.medium, fontSize: 12 },
  price: { fontFamily: fonts.bold, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 6 },
  action: { alignItems: 'center', borderRadius: 13, height: 38, justifyContent: 'center', width: 38 },
});
