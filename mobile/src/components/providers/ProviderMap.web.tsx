import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { ThemedView as View } from '@/theme/ThemedView';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { colors } from '@/constants/colors';
import { getMockProviderServicePrice } from '@/constants/mockProviders';
import { fonts } from '@/constants/typography';
import { formatDistanceKm } from '@/domain/providerSearch';
import { Pressable, Text } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';
import type { ProviderMapProps } from './ProviderMap.types';

export function ProviderMap({ center, onCoordinate, onViewProfile, providers, serviceId }: ProviderMapProps) {
  const { i18n, t } = useTranslation();
  const { tokens } = useTheme();
  const [selectedId, setSelectedId] = useState(providers[0]?.provider.id);
  const selected = providers.find((item) => item.provider.id === selectedId) ?? providers[0];

  return (
    <View style={[styles.frame, { backgroundColor: tokens.soft, borderColor: tokens.border }]}>
      <View style={styles.grid}>
        {Array.from({ length: 48 }, (_, index) => <View key={index} style={[styles.gridCell, { borderColor: tokens.border }]} />)}
      </View>
      <View style={styles.webNotice}>
        <Ionicons color={tokens.secondary} name="map-outline" size={21} />
        <Text style={[styles.webNoticeText, { color: tokens.text }]}>{t('providerSearch.mapUnavailableWeb')}</Text>
        <Text style={[styles.coordinates, { color: tokens.textMuted }]}>{center.latitude.toFixed(5)}, {center.longitude.toFixed(5)}</Text>
      </View>
      <View style={styles.webMarkers}>
        {providers.map(({ provider, distanceKm }) => (
          <Pressable
            key={provider.id}
            onPress={() => setSelectedId(provider.id)}
            style={[styles.webMarker, { backgroundColor: selected?.provider.id === provider.id ? tokens.secondary : tokens.primary }]}
          >
            <Ionicons color={colors.white} name="paw" size={16} />
            <Text style={styles.webMarkerText}>{formatDistanceKm(distanceKm, i18n.language)}</Text>
          </Pressable>
        ))}
      </View>
      {selected ? (
        <View style={[styles.summary, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <View style={styles.summaryCopy}>
            <Text style={[styles.name, { color: tokens.text }]}>{selected.provider.name}</Text>
            <Text style={[styles.meta, { color: tokens.textMuted }]}>
              ★ {selected.provider.rating.toFixed(1)} · {formatDistanceKm(selected.distanceKm, i18n.language)} · {t('providerSearch.priceFrom', { price: getMockProviderServicePrice(selected.provider, serviceId).toFixed(2) })}
            </Text>
          </View>
          <Pressable onPress={() => onViewProfile(selected.provider.id)} style={[styles.action, { backgroundColor: tokens.secondary }]}>
            <Ionicons color={colors.white} name="person-outline" size={18} />
          </Pressable>
          <Pressable onPress={() => onCoordinate(selected.provider.id)} style={[styles.action, { backgroundColor: tokens.primary }]}>
            <Ionicons color={colors.white} name="chatbubbles-outline" size={18} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: 22, borderWidth: 1, height: 500, justifyContent: 'space-between', overflow: 'hidden', padding: 14 },
  grid: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', flexWrap: 'wrap', opacity: 0.5 },
  gridCell: { borderBottomWidth: 1, borderRightWidth: 1, height: '16.666%', width: '12.5%' },
  webNotice: { alignItems: 'center', marginTop: 34, paddingHorizontal: 20 },
  webNoticeText: { fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 19, marginTop: 8, textAlign: 'center' },
  coordinates: { fontFamily: fonts.regular, fontSize: 11, marginTop: 5 },
  webMarkers: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  webMarker: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', gap: 5, minHeight: 34, paddingHorizontal: 10 },
  webMarkerText: { color: colors.white, fontFamily: fonts.bold, fontSize: 11 },
  summary: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 8, padding: 12 },
  summaryCopy: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.bold, fontSize: 15 },
  meta: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 4 },
  action: { alignItems: 'center', borderRadius: 13, height: 40, justifyContent: 'center', width: 40 },
});
