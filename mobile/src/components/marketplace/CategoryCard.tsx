import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import type { ComponentProps } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { colors } from '@/constants/colors';
import { theme } from '@/constants/theme';
import { Text } from '@/i18n/components';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type CategoryCardProps = {
  active: boolean;
  color: string;
  emoji: string;
  icon: string;
  name: string;
  onPress: () => void;
};

export function CategoryCard({ active, color, emoji, icon, name, onPress }: CategoryCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, active && styles.active, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: color }]}>
        <Text style={styles.emoji}>{emoji}</Text>
        <View style={styles.miniIcon}>
          <Ionicons color={colors.secondary} name={icon as IoniconName} size={12} />
        </View>
      </View>
      <Text numberOfLines={2} style={[styles.name, active && styles.activeName]}>{name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 104,
    minHeight: 104,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 8,
  },
  active: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.84 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  emoji: { fontSize: 24, lineHeight: 32, textAlign: 'center' },
  miniIcon: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    bottom: 1,
    height: 18,
    justifyContent: 'center',
    position: 'absolute',
    right: 1,
    width: 18,
  },
  name: { color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: '900', textAlign: 'center' },
  activeName: { color: colors.primary },
});
