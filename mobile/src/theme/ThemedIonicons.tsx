import { Ionicons as NativeIonicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { colors } from '@/constants/colors';
import { useTheme } from './ThemeProvider';

type IoniconsProps = ComponentProps<typeof NativeIonicons>;

function ThemedIoniconsComponent({ color, ...props }: IoniconsProps) {
  const { tokens } = useTheme();
  const themedColor = color === colors.text
    ? tokens.text
    : color === colors.textMuted
      ? tokens.textMuted
      : color === colors.primary || color === colors.primaryDark
        ? tokens.primary
        : color === colors.secondary
          ? tokens.secondary
          : color === colors.success
            ? tokens.success
            : color === colors.warning
              ? tokens.warning
              : color === colors.danger
                ? tokens.danger
                : color;

  return <NativeIonicons color={themedColor} {...props} />;
}

export const ThemedIonicons = Object.assign(ThemedIoniconsComponent, {
  glyphMap: NativeIonicons.glyphMap,
});

