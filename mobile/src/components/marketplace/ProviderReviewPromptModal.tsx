import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useState } from 'react';
import { Modal,
  StyleSheet,
} from 'react-native';

import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { theme } from '@/constants/theme';
import { Pressable, Text, TextInput } from '@/i18n/components';

type ProviderReviewPromptModalProps = {
  onClose: () => void;
  providerName: string;
  tags: string[];
  visible: boolean;
};

export function ProviderReviewPromptModal({
  onClose,
  providerName,
  tags,
  visible,
}: ProviderReviewPromptModalProps) {
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((currentTags) => (
      currentTags.includes(tag) ? currentTags.filter((item) => item !== tag) : [...currentTags, tag]
    ));
  };

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Pressable accessibilityLabel="__hupi_i18n:marketplace.ProviderReviewPromptModal.closeRating" onPress={onClose} style={styles.closeButton}>
            <Ionicons color={colors.text} name="close" size={18} />
          </Pressable>
          <Text style={styles.title}>__hupi_i18n:marketplace.ProviderReviewPromptModal.howDidYourOrderArrive</Text>
          <Text style={styles.subtitle}>__hupi_i18n:common.rate {providerName}</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)}>
                <Ionicons color={star <= rating ? colors.warning : colors.textMuted} name={star <= rating ? 'star' : 'star-outline'} size={27} />
              </Pressable>
            ))}
          </View>
          <View style={styles.tags}>
            {tags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <Pressable key={tag} onPress={() => toggleTag(tag)} style={[styles.tag, active && styles.activeTag]}>
                  <Text style={[styles.tagText, active && styles.activeTagText]}>{tag}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            multiline
            onChangeText={setComment}
            placeholder="__hupi_i18n:common.optionalComment"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={comment}
          />
          <Button
            icon="send-outline"
            onPress={() => setSent(true)}
            title="__hupi_i18n:marketplace.order-detail.submitRating"
          />
          {sent ? <Text style={styles.sent}>__hupi_i18n:marketplace.ProviderReviewPromptModal.registeredRating</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(51,51,51,0.48)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modal: { width: '100%', maxWidth: 360, borderRadius: 26, backgroundColor: colors.white, padding: 20, ...theme.shadow, shadowOpacity: 0.2 },
  closeButton: { position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 12, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 23, fontWeight: '900', paddingRight: 36 },
  subtitle: { color: colors.textMuted, fontSize: 15, marginTop: 5 },
  stars: { flexDirection: 'row', gap: 6, marginTop: 17 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 16 },
  tag: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: 10, paddingVertical: 7 },
  activeTag: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  tagText: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  activeTagText: { color: colors.primary },
  input: { minHeight: 80, borderRadius: 16, borderWidth: 1, borderColor: colors.border, color: colors.text, padding: 12, fontSize: 13, textAlignVertical: 'top', marginTop: 14, marginBottom: 12 },
  sent: { color: colors.success, fontSize: 13, fontWeight: '900', textAlign: 'center', marginTop: 10 },
});
