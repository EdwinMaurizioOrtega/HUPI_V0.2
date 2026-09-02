import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import {
  StyleSheet,
} from 'react-native';

import { colors } from '@/constants/colors';
import { theme } from '@/constants/theme';
import { Text } from '@/i18n/components';

type FaqItemProps = {
  answer: string;
  expanded: boolean;
  onPress: () => void;
  question: string;
};

export function FaqItem({ answer, expanded, onPress, question }: FaqItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <Text style={styles.question}>{question}</Text>
        <View style={styles.iconWrap}>
          <Ionicons color={colors.primary} name={expanded ? 'remove' : 'add'} size={18} />
        </View>
      </View>
      {expanded ? <Text style={styles.answer}>{answer}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: 14,
  },
  pressed: { opacity: 0.86 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  question: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '900' },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answer: { color: colors.textMuted, fontSize: 13, lineHeight: 21, marginTop: 11 },
});
