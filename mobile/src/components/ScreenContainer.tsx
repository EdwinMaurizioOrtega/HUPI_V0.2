import { ThemedView as View } from '@/theme/ThemedView';
import type { PropsWithChildren } from 'react';
import {
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import {
  FLOATING_TAB_BAR_CONTENT_CLEARANCE,
  FLOATING_TAB_BAR_MIN_BOTTOM_INSET,
} from '@/constants/navigationLayout';

type ScreenContainerProps = PropsWithChildren<{
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  avoidFloatingTabBar?: boolean;
}>;

export function ScreenContainer({
  children,
  scroll = true,
  contentContainerStyle,
  backgroundColor,
  avoidFloatingTabBar = false,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const resolvedBackground = backgroundColor ?? tokens.background;
  const flattenedStyle = StyleSheet.flatten(contentContainerStyle);
  const requestedPaddingBottom = typeof flattenedStyle?.paddingBottom === 'number'
    ? flattenedStyle.paddingBottom
    : 36;
  const minimumPaddingBottom = avoidFloatingTabBar
    ? FLOATING_TAB_BAR_CONTENT_CLEARANCE
      + Math.max(insets.bottom, FLOATING_TAB_BAR_MIN_BOTTOM_INSET)
    : 36 + Math.max(insets.bottom - FLOATING_TAB_BAR_MIN_BOTTOM_INSET, 0);
  const scrollPaddingBottom = Math.max(requestedPaddingBottom, minimumPaddingBottom);

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: resolvedBackground }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            contentContainerStyle,
            { paddingBottom: scrollPaddingBottom },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    alignSelf: 'center',
    maxWidth: 560,
    padding: 20,
    paddingBottom: 36,
    width: '100%',
    minWidth: 0,
  },
  fill: { flex: 1 },
});
