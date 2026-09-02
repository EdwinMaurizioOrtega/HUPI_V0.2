import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { StyleSheet,
} from 'react-native';

import { colors } from '@/constants/colors';
import { bookingTimelineLabels } from '@/constants/mockBookings';
import { fonts } from '@/constants/typography';
import { Text } from '@/i18n/components';

type BookingTimelineProps = {
  currentStep: number;
  cancelled?: boolean;
};

export function BookingTimeline({ currentStep, cancelled = false }: BookingTimelineProps) {
  return (
    <View style={styles.timeline}>
      {bookingTimelineLabels.map((label, index) => {
        const completed = index <= currentStep;
        const isCurrent = index === currentStep;
        return (
          <View key={label} style={styles.step}>
            <View style={styles.trackColumn}>
              <View style={[styles.marker, completed && styles.completedMarker, isCurrent && styles.currentMarker]}>
                {completed ? <Ionicons color={colors.white} name="checkmark" size={12} /> : null}
              </View>
              {index < bookingTimelineLabels.length - 1 ? (
                <View style={[styles.line, index < currentStep && styles.completedLine]} />
              ) : null}
            </View>
            <View style={styles.copy}>
              <Text style={[styles.label, completed && styles.completedLabel]}>{label}</Text>
              <Text style={styles.detail}>
                {cancelled && index === currentStep ? 'Proceso detenido por cancelación' : completed ? 'Registrado en Hupi' : 'Pendiente'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: { paddingTop: 3 },
  step: { minHeight: 62, flexDirection: 'row', gap: 12 },
  trackColumn: { width: 24, alignItems: 'center' },
  marker: { width: 23, height: 23, borderRadius: 12, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  completedMarker: { backgroundColor: colors.secondary },
  currentMarker: { backgroundColor: colors.primary },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 3 },
  completedLine: { backgroundColor: colors.secondarySoft },
  copy: { flex: 1, paddingTop: 2 },
  label: { color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 19 },
  completedLabel: { color: colors.text },
  detail: { color: colors.textMuted, fontFamily: fonts.light, fontSize: 12, lineHeight: 18, marginTop: 4 },
});
