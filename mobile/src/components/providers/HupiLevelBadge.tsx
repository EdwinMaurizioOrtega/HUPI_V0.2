import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { StyleSheet,
} from 'react-native';

import { colors } from '@/constants/colors';
import type { HupiLevel } from '@/constants/mockProviders';
import { Text } from '@/i18n/components';

const levelColors: Record<HupiLevel, { background: string; foreground: string }> = {
  Junior: { background: colors.soft, foreground: '#917021' },
  Senior: { background: colors.secondarySoft, foreground: colors.secondary },
  Destacado: { background: colors.primarySoft, foreground: colors.primary },
};

type HupiLevelBadgeProps = {
  level: HupiLevel;
};

export function HupiLevelBadge({ level }: HupiLevelBadgeProps) {
  const palette = levelColors[level];

  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Ionicons color={palette.foreground} name="ribbon" size={12} />
      <Text style={[styles.label, { color: palette.foreground }]}>__hupi_i18n:common.level {level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 25,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  label: { fontSize: 12, fontWeight: '900' },
});
