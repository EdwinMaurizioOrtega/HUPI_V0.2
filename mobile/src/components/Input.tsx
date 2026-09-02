import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors } from '@/constants/colors';
import { theme } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import { AppText, AppTextInput } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';

type InputProps = TextInputProps & {
  label?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  hint?: string;
  containerStyle?: ViewStyle;
  rightAccessory?: ReactNode;
};

export function Input({ label, icon, hint, multiline, rightAccessory, style, containerStyle, ...props }: InputProps) {
  const { tokens } = useTheme();
  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <AppText style={[styles.label, { color: tokens.text }]} variant="label">{label}</AppText> : null}
      <View
        style={[
          styles.inputShell,
          { backgroundColor: tokens.input, borderColor: tokens.border },
          multiline && styles.multilineShell,
        ]}
      >
        {icon ? <Ionicons color={tokens.textMuted} name={icon} size={19} /> : null}
        <AppTextInput
          placeholderTextColor={tokens.placeholder}
          style={[styles.input, { color: tokens.text }, multiline && styles.multilineInput, style]}
          multiline={multiline}
          {...props}
        />
        {rightAccessory}
      </View>
      {hint ? <AppText style={[styles.hint, { color: tokens.textMuted }]} variant="caption">{hint}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 7,
  },
  label: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  inputShell: {
    minHeight: 54,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: 14,
  },
  multilineShell: {
    alignItems: 'flex-start',
    paddingTop: 14,
    minHeight: 92,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 0,
  },
  multilineInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  hint: {
    color: colors.textMuted,
    fontFamily: fonts.light,
    fontSize: 13,
    lineHeight: 18,
  },
});
