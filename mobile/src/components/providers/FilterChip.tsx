import {
  StyleSheet,
} from 'react-native';

import { colors } from '@/constants/colors';
import { Pressable, Text } from '@/i18n/components';

type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.activeChip, pressed && styles.pressed]}
    >
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  activeChip: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  activeLabel: { color: colors.white },
  pressed: { opacity: 0.75 },
});
