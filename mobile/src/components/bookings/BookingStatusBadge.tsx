import { ThemedView as View } from '@/theme/ThemedView';
import {
  StyleSheet,
} from 'react-native';

import type { BookingStatus } from '@/constants/mockBookings';
import { getBookingStatusPresentation } from '@/domain/statusPresentation';
import { Text } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';
import { useTranslation } from '../../../node_modules/react-i18next';

type BookingStatusBadgeProps = {
  status: BookingStatus;
};

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const presentation = getBookingStatusPresentation(status, isDark, t);

  return (
    <View
      accessibilityLabel={presentation.label}
      style={[
        styles.badge,
        { backgroundColor: presentation.backgroundColor, borderColor: presentation.borderColor },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: presentation.textColor }]} />
      <Text style={[styles.label, { color: presentation.textColor }]}>{presentation.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { minHeight: 27, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 12, fontWeight: '900' },
});
