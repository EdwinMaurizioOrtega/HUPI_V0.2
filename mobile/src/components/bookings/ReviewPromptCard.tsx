import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useState } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { Button } from '@/components/Button';
import { HupiSuccessModal } from '@/components/HupiSuccessModal';
import { colors } from '@/constants/colors';
import {
  getMockBookingReview,
  submitMockBookingReview,
} from '@/constants/mockBookings';
import { fonts } from '@/constants/typography';
import { Text } from '@/i18n/components';
import { useTranslation } from '../../../node_modules/react-i18next';

const reviewTags = [
  'punctual',
  'communicative',
  'photos',
  'professional',
  'active',
] as const;

type ReviewPromptCardProps = {
  bookingId: string;
};

export function ReviewPromptCard({ bookingId }: ReviewPromptCardProps) {
  const { t } = useTranslation();
  const savedReview = getMockBookingReview(bookingId);
  const [expanded, setExpanded] = useState(false);
  const [rating, setRating] = useState(savedReview?.rating ?? 0);
  const [selectedTags, setSelectedTags] = useState<string[]>(savedReview?.tags ?? []);
  const [submitted, setSubmitted] = useState(Boolean(savedReview));
  const [confirmationVisible, setConfirmationVisible] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((current) => current.includes(tag)
      ? current.filter((item) => item !== tag)
      : [...current, tag]);
  };

  const submitReview = () => {
    if (rating < 1) {
      return;
    }

    submitMockBookingReview(bookingId, { rating, tags: selectedTags });
    setSubmitted(true);
    setConfirmationVisible(true);
  };

  const confirmationModal = (
    <HupiSuccessModal
      buttonLabel={t('common.understood')}
      description={t('reviewPrompt.thanksDescription')}
      onClose={() => setConfirmationVisible(false)}
      title={t('reviewPrompt.thanksTitle')}
      visible={confirmationVisible}
    />
  );

  if (submitted) {
    return (
      <>
        <View style={styles.submittedCard}>
          <Ionicons color={colors.success} name="checkmark-circle" size={20} />
          <View style={styles.submittedCopy}>
            <Text style={styles.submittedTitle}>{t('reviewPrompt.submittedTitle')}</Text>
            <Text style={styles.submittedText}>{t('reviewPrompt.submittedText', { rating })}</Text>
          </View>
        </View>
        {confirmationModal}
      </>
    );
  }

  if (!expanded) {
    return (
      <>
        <Pressable onPress={() => setExpanded(true)} style={styles.promptButton}>
          <Ionicons color={colors.secondary} name="star-outline" size={18} />
          <Text style={styles.promptButtonText}>__hupi_i18n:components.ReviewPromptCard.qualifySupplier</Text>
        </Pressable>
        {confirmationModal}
      </>
    );
  }

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.title}>__hupi_i18n:components.ReviewPromptCard.howWasTheService</Text>
        <Text style={styles.subtitle}>{t('reviewPrompt.instructions')}</Text>
        <View accessibilityLabel={t('reviewPrompt.ratingAccessibility', { rating })} style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable
              accessibilityLabel={t('reviewPrompt.starAccessibility', { count: star })}
              accessibilityRole="button"
              key={star}
              onPress={() => setRating(star)}
            >
              <Ionicons
                color={colors.warning}
                name={star <= rating ? 'star' : 'star-outline'}
                size={27}
              />
            </Pressable>
          ))}
        </View>
        <View style={styles.tags}>
          {reviewTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <Pressable key={tag} onPress={() => toggleTag(tag)} style={[styles.tag, active && styles.activeTag]}>
                <Text style={[styles.tagText, active && styles.activeTagText]}>{t(`reviewPrompt.tags.${tag}`)}</Text>
              </Pressable>
            );
          })}
        </View>
        <Button
          disabled={rating < 1}
          icon="send-outline"
          onPress={submitReview}
          style={styles.submitButton}
          title={t('reviewPrompt.submit')}
        />
      </View>
      {confirmationModal}
    </>
  );
}

const styles = StyleSheet.create({
  promptButton: { minHeight: 41, borderRadius: 13, backgroundColor: colors.secondarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 13 },
  promptButtonText: { color: colors.secondary, fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 19 },
  card: { borderRadius: 15, backgroundColor: colors.soft, padding: 13, marginTop: 13 },
  title: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 20 },
  subtitle: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 3 },
  stars: { flexDirection: 'row', gap: 7, marginTop: 11 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  tag: { minHeight: 32, borderRadius: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', paddingHorizontal: 9, paddingVertical: 4 },
  activeTag: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  tagText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  activeTagText: { color: colors.white },
  submitButton: { marginTop: 14 },
  submittedCard: { alignItems: 'flex-start', backgroundColor: '#e7f5ef', borderRadius: 14, flexDirection: 'row', gap: 9, marginTop: 13, padding: 12 },
  submittedCopy: { flex: 1, minWidth: 0 },
  submittedTitle: { color: colors.success, fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 19 },
  submittedText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 2 },
});
