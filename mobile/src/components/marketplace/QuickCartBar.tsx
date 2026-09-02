import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import {
  StyleSheet,
  View as NativeView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { formatMarketplaceCurrency } from './ProductPriceBlock';
import { Text } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';

const DARK_COMPACT_CART_SURFACE = '#5b2a22';
const DARK_COMPACT_CART_PRIMARY_TEXT = '#fff8f5';
const DARK_COMPACT_CART_SECONDARY_TEXT = '#f0cbc1';

type QuickCartBarProps = {
  bottomOffset?: number;
  count: number;
  includeSafeArea?: boolean;
  onBuyPress: () => void;
  onCartPress: () => void;
  total: number;
  variant?: 'default' | 'floatingCompact';
};

export function QuickCartBar({
  bottomOffset = 0,
  count,
  includeSafeArea = true,
  onBuyPress,
  onCartPress,
  total,
  variant = 'default',
}: QuickCartBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { resolvedTheme, tokens } = useTheme();
  const compact = width < 360;
  const floatingCompact = variant === 'floatingCompact';
  const floatingCompactDark = floatingCompact && resolvedTheme === 'dark';
  const paddingBottom = floatingCompact
    ? 8
    : includeSafeArea
      ? Math.max(insets.bottom, 12)
      : 12;

  const content = (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="__hupi_i18n:common.openCart"
        onPress={onCartPress}
        style={[
          styles.cartButton,
          compact && styles.cartButtonCompact,
          floatingCompact && styles.floatingCompactCartButton,
          floatingCompactDark && { backgroundColor: 'rgba(255, 255, 255, 0.12)' },
        ]}
      >
        <Ionicons color={colors.primary} name="cart" size={21} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onCartPress}
        style={[styles.summary, floatingCompact && styles.floatingCompactSummary]}
      >
        <View style={styles.copy}>
          {floatingCompact ? null : <Text style={styles.label}>__hupi_i18n:common.total</Text>}
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[
              styles.total,
              floatingCompact && styles.floatingCompactTotal,
              floatingCompactDark && { color: DARK_COMPACT_CART_PRIMARY_TEXT },
            ]}
          >
            {formatMarketplaceCurrency(total)}
          </Text>
          {!floatingCompact || !compact ? (
            <Text
              numberOfLines={1}
              style={[
                styles.count,
                floatingCompact && styles.floatingCompactCount,
                floatingCompactDark && { color: DARK_COMPACT_CART_SECONDARY_TEXT },
              ]}
            >
              {count}  __hupi_i18n:common.products
            </Text>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onBuyPress}
        style={[
          styles.button,
          compact && styles.buttonCompact,
          floatingCompact && styles.floatingCompactButton,
        ]}
      >
        <Text numberOfLines={1} style={styles.buttonText}>__hupi_i18n:common.buy</Text>
      </Pressable>
    </>
  );

  if (floatingCompact) {
    return (
      <NativeView
        pointerEvents="box-none"
        style={[styles.floatingWrapper, { bottom: bottomOffset }]}
      >
        <View
          style={[
            styles.floatingCompactBar,
            {
              backgroundColor: floatingCompactDark
                ? DARK_COMPACT_CART_SURFACE
                : tokens.surface,
              borderColor: floatingCompactDark
                ? 'rgba(255, 187, 168, 0.34)'
                : tokens.border,
              paddingBottom,
            },
          ]}
        >
          {content}
        </View>
      </NativeView>
    );
  }

  return (
    <View
      style={[
        styles.bar,
        compact && styles.barCompact,
        {
          bottom: bottomOffset,
          paddingBottom,
        },
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#3f2d25',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  barCompact: { gap: 8, paddingHorizontal: 12 },
  floatingWrapper: {
    backgroundColor: 'transparent',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  floatingCompactBar: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    paddingHorizontal: 10,
    paddingTop: 8,
    shadowColor: '#3f2d25',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  cartButton: { width: 48, height: 48, borderRadius: 17, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: '#f0c5ba', alignItems: 'center', justifyContent: 'center' },
  cartButtonCompact: { width: 44, height: 44 },
  floatingCompactCartButton: { borderRadius: 13, height: 40, width: 40 },
  summary: { flex: 1, minHeight: 52, borderRadius: 18, justifyContent: 'center', paddingHorizontal: 2 },
  floatingCompactSummary: { minHeight: 40 },
  copy: { flex: 1 },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  total: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 2 },
  count: { color: colors.secondary, fontSize: 12, fontWeight: '800', marginTop: 2 },
  floatingCompactTotal: { fontSize: 17, marginTop: 0 },
  floatingCompactCount: { fontSize: 10.5, marginTop: 0 },
  button: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 18,
  },
  buttonCompact: { paddingHorizontal: 12 },
  floatingCompactButton: { minHeight: 40, paddingHorizontal: 13 },
  buttonText: { color: colors.white, flexShrink: 1, fontSize: 15, fontWeight: '900' },
});
