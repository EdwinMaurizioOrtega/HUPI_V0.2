import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { StyleSheet,
  useWindowDimensions,
} from 'react-native';

import { Card } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { colors } from '@/constants/colors';
import { getMockProviderPhotoUri, type MockProvider } from '@/constants/mockProviders';
import type { BookableServiceId } from '@/constants/services';
import { HupiLevelBadge } from './HupiLevelBadge';
import { HupiVerifiedBadge } from './HupiVerifiedBadge';
import { RatingBadge } from './RatingBadge';
import { Pressable, Text } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';
import { formatDistanceKm } from '@/domain/providerSearch';
import { formatProviderHourlyRate, getProviderWalkHourlyRate } from '@/domain/providerPricing';
import { useTranslation } from '../../../node_modules/react-i18next';

type ProviderCardProps = {
  provider: MockProvider;
  distanceKm?: number;
  serviceId?: BookableServiceId;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onViewProfile: () => void;
  onBook: () => void;
};

export function ProviderCard({
  provider,
  distanceKm,
  isFavorite = false,
  onToggleFavorite,
  onViewProfile,
  onBook,
}: ProviderCardProps) {
  const { width } = useWindowDimensions();
  const { tokens } = useTheme();
  const compact = width < 360;
  const price = getProviderWalkHourlyRate(provider);
  const providerPhotoUri = getMockProviderPhotoUri(provider.id);
  const { i18n, t } = useTranslation();
  const formattedPrice = formatProviderHourlyRate(price, i18n.language);
  const distance = typeof distanceKm === 'number'
    ? formatDistanceKm(distanceKm, i18n.language)
    : provider.distance;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ProfileAvatar size={56} style={styles.avatar} type="provider" uri={providerPhotoUri}>
          <View accessibilityLabel={t(provider.isOnline ? 'chatPresence.online' : 'chatPresence.away')} style={[styles.onlineDot, !provider.isOnline && styles.awayDot]} />
        </ProfileAvatar>
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text numberOfLines={2} style={styles.name}>{provider.name}</Text>
            {provider.isVerifiedByHupi ? <HupiVerifiedBadge /> : null}
          </View>
          <View style={styles.badgesRow}>
            <HupiLevelBadge level={provider.level} />
          </View>
          <View style={styles.ratingRow}>
            <RatingBadge rating={provider.rating} reviews={provider.reviewCount} />
            <Text style={styles.dot}>•</Text>
            <Text style={styles.completed}>{provider.completedServices} {t('generated.provider.provider-detail.servicesPerformed')}</Text>
          </View>
        </View>
        <IconButton
          accessibilityLabel="__hupi_i18n:common.favorite"
          icon={isFavorite ? 'heart' : 'heart-outline'}
          iconColor={isFavorite ? colors.primary : colors.textMuted}
          iconSize={20}
          onPress={onToggleFavorite}
          size={38}
        />
      </View>

      <View style={[styles.metrics, compact && styles.metricsCompact]}>
        <View style={[styles.metric, styles.priceMetric]}>
          <Ionicons color={colors.primary} name="cash-outline" size={16} />
          <View style={styles.metricCopy}>
            <Text numberOfLines={2} style={styles.metricValue}>
              {formattedPrice ? t('providerPricing.compactHourlyRate', { price: formattedPrice }) : t('providerPricing.undefinedRate')}
            </Text>
          </View>
        </View>
        <View style={[
          styles.metricDivider,
          { backgroundColor: tokens.border },
          compact && styles.metricDividerCompact,
        ]} />
        <View style={[styles.metric, styles.locationMetric]}>
          <Ionicons color={colors.secondary} name="location-outline" size={16} />
          <View style={styles.metricCopy}>
            <Text numberOfLines={2} style={[styles.metricValue, styles.locationValue]}>{provider.zone}</Text>
            <Text numberOfLines={1} style={styles.metricLabel}>{distance} {t('generated.common.ofYou')}</Text>
          </View>
        </View>
        <View style={[
          styles.metricDivider,
          { backgroundColor: tokens.border },
          compact && styles.metricDividerCompact,
        ]} />
        <View style={[styles.metric, styles.experienceMetric]}>
          <Ionicons color={colors.success} name="ribbon-outline" size={16} />
          <View style={styles.metricCopy}>
            <Text numberOfLines={1} style={styles.metricValue}>{provider.experienceYears} {t('generated.common.years')}</Text>
            <Text style={styles.metricLabel}>{t('generated.common.experience')}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.actions, compact && styles.actionsCompact]}>
        <Pressable onPress={onViewProfile} style={styles.profileButton}>
          <Text style={styles.profileButtonText}>__hupi_i18n:common.viewProfile</Text>
        </Pressable>
        <Pressable onPress={onBook} style={styles.bookButton}>
          <Text style={styles.bookButtonText}>__hupi_i18n:common.coordinate</Text>
          <Ionicons color={colors.white} name="chatbubbles-outline" size={15} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, shadowOpacity: 0.06 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  onlineDot: {
    position: 'absolute', right: 1, bottom: 1, width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.success, borderWidth: 2, borderColor: colors.white,
  },
  awayDot: { backgroundColor: colors.textMuted },
  identity: { flex: 1, minWidth: 0 },
  nameRow: { alignItems: 'flex-start', flexDirection: 'row', minWidth: 0 },
  name: { color: colors.text, flexShrink: 1, fontSize: 16, fontWeight: '900', lineHeight: 21 },
  badgesRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  dot: { color: colors.border },
  completed: { color: colors.textMuted, fontSize: 12 },
  metrics: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 15,
    backgroundColor: colors.soft,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginTop: 15,
  },
  metricsCompact: { paddingHorizontal: 7 },
  metric: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, minWidth: 0 },
  metricCopy: { flex: 1, minWidth: 0 },
  priceMetric: { flexBasis: 75, flexDirection: 'column', flexGrow: 0, flexShrink: 0, gap: 3 },
  locationMetric: { flex: 1, flexGrow: 1.6, minWidth: 0 },
  experienceMetric: { flexBasis: 68, flexDirection: 'column', flexGrow: 0, flexShrink: 0, gap: 3 },
  metricDivider: { alignSelf: 'stretch', width: 1, backgroundColor: '#e3e2cb', marginHorizontal: 7 },
  metricDividerCompact: { marginHorizontal: 4 },
  metricValue: { color: colors.text, flexShrink: 1, fontSize: 12, fontWeight: '900', lineHeight: 17 },
  locationValue: { fontSize: 13, lineHeight: 19 },
  metricLabel: { color: colors.textMuted, flexShrink: 1, fontSize: 11, lineHeight: 16, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 9, marginTop: 15 },
  actionsCompact: { flexDirection: 'column' },
  profileButton: {
    flex: 1, minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  profileButtonText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  bookButton: {
    flex: 1, minHeight: 42, borderRadius: 13, backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  bookButtonText: { color: colors.white, fontSize: 13, fontWeight: '900' },
});
