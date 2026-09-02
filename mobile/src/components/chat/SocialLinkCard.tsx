import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import type { ComponentProps } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { colors } from '@/constants/colors';
import { Text } from '@/i18n/components';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type SocialLinkCardProps = {
  accessibilityLabel: string;
  icon: string;
  label: string;
  onPress: () => void;
};

export function SocialLinkCard({ accessibilityLabel, icon, label, onPress }: SocialLinkCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Ionicons color={colors.secondary} name={icon as IoniconName} size={22} />
      <Text numberOfLines={1} style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    minHeight: 78,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: 10,
  },
  pressed: { opacity: 0.82 },
  label: { color: colors.text, fontSize: 13, fontWeight: '900' },
});
