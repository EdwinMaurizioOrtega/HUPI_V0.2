import { ThemedView as View } from '@/theme/ThemedView';
import type { PropsWithChildren } from 'react';
import {
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors } from '@/constants/colors';
import { theme } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  tone?: 'white' | 'soft' | 'purple' | 'coral';
}>;

export function Card({ children, style, tone = 'white' }: CardProps) {
  const { tokens } = useTheme();
  const toneStyle = {
    white: { backgroundColor: tokens.card, borderColor: tokens.border },
    soft: { backgroundColor: tokens.soft, borderColor: tokens.border },
    purple: { backgroundColor: tokens.surfacePurple, borderColor: tokens.border },
    coral: { backgroundColor: tokens.primarySoft, borderColor: tokens.border },
  }[tone];
  return <View style={[styles.base, styles[tone], toneStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'visible',
  },
  white: {
    backgroundColor: colors.white,
    ...theme.shadow,
  },
  soft: {
    backgroundColor: colors.soft,
  },
  purple: {
    backgroundColor: colors.secondarySoft,
    borderColor: '#dfd3ef',
  },
  coral: {
    backgroundColor: colors.primarySoft,
    borderColor: '#f5d3ca',
  },
});
