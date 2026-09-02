import { Modal, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HupiVerifiedBadge } from '@/components/providers/HupiVerifiedBadge';
import { RatingBadge } from '@/components/providers/RatingBadge';
import { colors } from '@/constants/colors';
import { getMockProviderReviewSummary } from '@/constants/mockProviderReviews';
import type { MockProvider } from '@/constants/mockProviders';
import { fonts } from '@/constants/typography';
import { Text } from '@/i18n/components';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useTheme } from '@/theme/ThemeProvider';
import { ThemedView as View } from '@/theme/ThemedView';

type ProviderReviewsModalProps = {
  onClose: () => void;
  provider: MockProvider;
  visible: boolean;
};

export function ProviderReviewsModal({ onClose, provider, visible }: ProviderReviewsModalProps) {
  const { i18n, t } = useTranslation();
  const { tokens } = useTheme();
  const summary = getMockProviderReviewSummary(provider.id);
  const maximumDistribution = Math.max(...Object.values(summary.distribution), 1);

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={visible}>
      <SafeAreaView edges={['top', 'bottom']} style={[styles.safeArea, { backgroundColor: tokens.background }]}>
        <View style={[styles.header, { borderBottomColor: tokens.border }]}>
          <View style={styles.nameRow}>
            <Text numberOfLines={2} style={styles.title}>{provider.name}</Text>
            {provider.isVerifiedByHupi ? <HupiVerifiedBadge size={19} /> : null}
          </View>
          <View style={styles.summaryRow}>
            <RatingBadge rating={provider.rating} reviews={provider.reviewCount} />
            <Text style={styles.summaryText}>{t('providerReviews.total', { count: provider.reviewCount })}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {provider.reviewCount > 0 ? (
            <Card style={styles.distributionCard} tone="soft">
              <Text style={styles.sectionTitle}>{t('providerReviews.distribution')}</Text>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = summary.distribution[stars as 1 | 2 | 3 | 4 | 5];
                return (
                  <View key={stars} style={styles.distributionRow}>
                    <Text style={styles.starLabel}>{stars}</Text>
                    <Ionicons color={colors.warning} name="star" size={13} />
                    <View style={[styles.track, { backgroundColor: tokens.border }]}>
                      <View style={[styles.fill, { width: `${(count / maximumDistribution) * 100}%` }]} />
                    </View>
                    <Text style={styles.count}>{count}</Text>
                  </View>
                );
              })}
            </Card>
          ) : null}

          {summary.reviews.length ? summary.reviews.map((review) => (
            <Card key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.customerInitials}>
                  <Text style={styles.initials}>{getInitials(review.customerDisplayName)}</Text>
                </View>
                <View style={styles.reviewCopy}>
                  <Text style={styles.customer}>{review.customerDisplayName}</Text>
                  <Text style={styles.date}>{formatReviewDate(review.createdAt, i18n.language)}</Text>
                </View>
                <View style={styles.ratingRow}>
                  <Ionicons color={colors.warning} name="star" size={14} />
                  <Text style={styles.rating}>{review.rating.toFixed(1)}</Text>
                </View>
              </View>
              <Text style={styles.comment}>{review.comment}</Text>
              {review.service ? <Text style={styles.service}>{t('providerReviews.service', { service: review.service })}</Text> : null}
            </Card>
          )) : (
            <Card style={styles.emptyCard} tone="soft">
              <Ionicons color={colors.textMuted} name="chatbubble-ellipses-outline" size={28} />
              <Text style={styles.emptyText}>{t('providerReviews.empty')}</Text>
            </Card>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: tokens.border }]}>
          <Button onPress={onClose} title={t('common.close')} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function formatReviewDate(value: string, language: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language.startsWith('en') ? 'en-US' : 'es-EC', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(date);
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { borderBottomWidth: 1, gap: 8, padding: 18 },
  nameRow: { alignItems: 'flex-start', flexDirection: 'row', minWidth: 0 },
  title: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 22, lineHeight: 29 },
  summaryRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  summaryText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13 },
  content: { gap: 12, padding: 18, paddingBottom: 32 },
  distributionCard: { gap: 9, shadowOpacity: 0 },
  sectionTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 16 },
  distributionRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  starLabel: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 12, textAlign: 'right', width: 10 },
  track: { borderRadius: 999, flex: 1, height: 7, overflow: 'hidden' },
  fill: { backgroundColor: colors.warning, borderRadius: 999, height: '100%' },
  count: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, textAlign: 'right', width: 28 },
  reviewCard: { gap: 10, shadowOpacity: 0.04 },
  reviewHeader: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  customerInitials: { alignItems: 'center', backgroundColor: colors.secondarySoft, borderRadius: 13, height: 40, justifyContent: 'center', width: 40 },
  initials: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 13 },
  reviewCopy: { flex: 1, minWidth: 0 },
  customer: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 14 },
  date: { color: colors.textMuted, fontFamily: fonts.light, fontSize: 12, marginTop: 2 },
  ratingRow: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  rating: { color: colors.text, fontFamily: fonts.bold, fontSize: 13 },
  comment: { color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 21 },
  service: { color: colors.secondary, fontFamily: fonts.semiBold, fontSize: 12 },
  emptyCard: { alignItems: 'center', gap: 9, shadowOpacity: 0 },
  emptyText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  footer: { borderTopWidth: 1, padding: 16 },
});
