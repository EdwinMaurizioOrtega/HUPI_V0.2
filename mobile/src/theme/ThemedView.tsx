import {
  forwardRef,
  type ElementRef,
} from 'react';
import {
  StyleSheet,
  View as NativeView,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { colors } from '@/constants/colors';
import { useTheme } from './ThemeProvider';
import type { ThemeTokens } from './tokens';

export function getSemanticViewOverrides(
  style: ViewProps['style'],
  tokens: ThemeTokens,
): ViewStyle {
  const flat = StyleSheet.flatten(style);
  if (!flat) return {};

  const overrides: ViewStyle = {};
  if (flat.backgroundColor === colors.white || flat.backgroundColor === colors.surface) {
    overrides.backgroundColor = tokens.surface;
  } else if (flat.backgroundColor === colors.background) {
    overrides.backgroundColor = tokens.background;
  } else if (flat.backgroundColor === colors.soft) {
    overrides.backgroundColor = tokens.soft;
  } else if (flat.backgroundColor === colors.primarySoft) {
    overrides.backgroundColor = tokens.primarySoft;
  } else if (flat.backgroundColor === colors.secondarySoft) {
    overrides.backgroundColor = tokens.surfacePurple;
  } else if (
    flat.backgroundColor === colors.successSoft
    || flat.backgroundColor === colors.successSoftAlt
  ) {
    overrides.backgroundColor = tokens.successSoft;
  } else if (flat.backgroundColor === colors.warningSoft) {
    overrides.backgroundColor = tokens.warningSoft;
  }

  if (flat.borderColor === colors.border) {
    overrides.borderColor = tokens.border;
  }
  if (flat.borderBottomColor === colors.border) {
    overrides.borderBottomColor = tokens.border;
  }
  if (flat.borderTopColor === colors.border) {
    overrides.borderTopColor = tokens.border;
  }
  if (flat.borderLeftColor === colors.border) {
    overrides.borderLeftColor = tokens.border;
  }
  if (flat.borderRightColor === colors.border) {
    overrides.borderRightColor = tokens.border;
  }

  return overrides;
}

export const ThemedView = forwardRef<ElementRef<typeof NativeView>, ViewProps>(
  function ThemedView({ style, ...props }, ref) {
    const { tokens } = useTheme();
    return (
      <NativeView
        {...props}
        ref={ref}
        style={[style, getSemanticViewOverrides(style, tokens)]}
      />
    );
  },
);
