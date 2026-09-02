import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';

import { colors } from '@/constants/colors';
import { theme } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import { AppText, Pressable } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type ButtonProps = {
  accessibilityHint?: string;
  accessibilityLabel?: string;
  title: string;
  onPress?: () => void;
  onDisabledPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: IoniconName;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({
  accessibilityHint,
  accessibilityLabel,
  title,
  onPress,
  onDisabledPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const { tokens } = useTheme();
  const variantStyle = variant === 'primary'
    ? { backgroundColor: tokens.primary }
    : variant === 'secondary'
      ? { backgroundColor: tokens.secondary }
      : variant === 'outline'
        ? { backgroundColor: tokens.surface, borderColor: tokens.primary }
        : { backgroundColor: tokens.primarySoft };
  const foreground = variant === 'outline' || variant === 'ghost'
    ? tokens.primary
    : tokens.primaryContrast;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={loading || (isDisabled && !onDisabledPress)}
      onPress={isDisabled ? onDisabledPress : onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        variantStyle,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon ? (
            <Ionicons
              color={foreground}
              name={icon}
              size={19}
            />
          ) : null}
          <AppText
            style={[
              styles.label,
              (variant === 'outline' || variant === 'ghost') && styles.coloredLabel,
              { color: foreground },
            ]}
          >
            {title}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

export const AppButton = Button;

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: colors.primarySoft,
  },
  label: {
    color: colors.white,
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 21,
    textAlign: 'center',
    fontWeight: '700',
  },
  coloredLabel: {
    color: colors.primary,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
