import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { StyleSheet,
} from 'react-native';

import { colors } from '@/constants/colors';
import { Text } from '@/i18n/components';

type OrderTimelineProps = {
  currentStep: number;
  steps: string[];
};

export function OrderTimeline({ currentStep, steps }: OrderTimelineProps) {
  return (
    <View style={styles.wrap}>
      {steps.map((step, index) => {
        const completed = index <= currentStep;
        const isLast = index === steps.length - 1;

        return (
          <View key={step} style={styles.item}>
            <View style={styles.track}>
              <View style={[styles.dot, completed && styles.completedDot]}>
                <Ionicons color={completed ? colors.white : colors.textMuted} name="checkmark" size={13} />
              </View>
              {!isLast ? <View style={[styles.line, completed && styles.completedLine]} /> : null}
            </View>
            <View style={styles.copy}>
              <Text style={[styles.step, completed && styles.completedStep]}>{step}</Text>
              <Text style={styles.detail}>
                {completed ? 'Actualizado por Hupi' : 'Pendiente'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 0 },
  item: { flexDirection: 'row', minHeight: 62 },
  track: { width: 34, alignItems: 'center' },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedDot: { backgroundColor: colors.primary, borderColor: colors.primary },
  line: { flex: 1, width: 2, backgroundColor: colors.border },
  completedLine: { backgroundColor: colors.primary },
  copy: { flex: 1, paddingLeft: 8, paddingTop: 4 },
  step: { color: colors.textMuted, fontSize: 15, fontWeight: '800' },
  completedStep: { color: colors.text, fontWeight: '900' },
  detail: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});
