import type { ComponentProps } from 'react';
import {
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { fonts } from '@/constants/typography';
import {
  formatIconBadge,
  resolveIconButtonIconSize,
} from '@/domain/iconButton';
import { Text } from '@/i18n/components';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { useTheme } from '@/theme/ThemeProvider';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type IconButtonProps = {
  accessibilityHint?: string;
  accessibilityLabel: string;
  badge?: number | string;
  badgeColor?: string;
  backgroundColor?: string;
  disabled?: boolean;
  icon: IoniconName;
  iconColor?: string;
  iconSize?: number;
  onPress?: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  accessibilityHint,
  accessibilityLabel,
  badge,
  badgeColor,
  backgroundColor,
  disabled = false,
  icon,
  iconColor,
  iconSize,
  onPress,
  size = 44,
  style,
}: IconButtonProps) {
  const { tokens } = useTheme();
  const resolvedIconSize = resolveIconButtonIconSize(size, iconSize);
  const hasBadge = badge !== undefined && badge !== null && badge !== '';

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: backgroundColor ?? tokens.soft,
          borderRadius: Math.round(size * 0.34),
          height: size,
          minHeight: size,
          minWidth: size,
          width: size,
        },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View pointerEvents="none" style={styles.iconLayer}>
        <Ionicons
          color={iconColor ?? tokens.text}
          name={icon}
          size={resolvedIconSize}
        />
      </View>
      {hasBadge ? (
        <View
          pointerEvents="none"
          style={[styles.badge, { backgroundColor: badgeColor ?? tokens.primary }]}
        >
          <Text numberOfLines={1} style={styles.badgeText}>
            {formatIconBadge(badge)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative',
  },
  iconLayer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    height: '100%',
    justifyContent: 'center',
    overflow: 'visible',
    width: '100%',
  },
  badge: {
    alignItems: 'center',
    borderColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1.5,
    elevation: 3,
    justifyContent: 'center',
    minHeight: 20,
    minWidth: 20,
    paddingHorizontal: 5,
    position: 'absolute',
    right: 1,
    top: 1,
    zIndex: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontFamily: fonts.bold,
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 14,
    textAlign: 'center',
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.48 },
});
