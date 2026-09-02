import {
  forwardRef,
  type ElementRef,
} from 'react';
import {
  Pressable as NativePressable,
  type PressableProps,
} from 'react-native';

import { getSemanticViewOverrides } from './ThemedView';
import { useTheme } from './ThemeProvider';

export const ThemedPressable = forwardRef<
  ElementRef<typeof NativePressable>,
  PressableProps
>(function ThemedPressable({ style, ...props }, ref) {
  const { tokens } = useTheme();
  return (
    <NativePressable
      {...props}
      ref={ref}
      style={typeof style === 'function'
        ? (state) => {
          const resolvedStyle = style(state);
          return [resolvedStyle, getSemanticViewOverrides(resolvedStyle, tokens)];
        }
        : [style, getSemanticViewOverrides(style, tokens)]}
    />
  );
});

