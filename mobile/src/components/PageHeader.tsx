import type { ReactNode } from 'react';
import {
  StyleSheet,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { AppText, Pressable } from '@/i18n/components';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { ThemedView as View } from '@/theme/ThemedView';

type PageHeaderProps = {
  backAccessibilityLabel?: string;
  eyebrow?: string;
  leading?: ReactNode;
  onBack?: () => void;
  style?: StyleProp<ViewStyle>;
  subtitle?: ReactNode;
  title: ReactNode;
  titleStyle?: StyleProp<TextStyle>;
  trailing?: ReactNode;
};

/**
 * Header de página sin alturas rígidas. Debe vivir dentro de ScreenContainer,
 * que aporta el safe area superior, y deja que Fredoka use toda su caja de línea.
 */
export function PageHeader({
  backAccessibilityLabel = '__hupi_i18n:common.back',
  eyebrow,
  leading,
  onBack,
  style,
  subtitle,
  title,
  titleStyle,
  trailing,
}: PageHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      {leading ?? (onBack ? (
        <Pressable
          accessibilityLabel={backAccessibilityLabel}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBack}
          style={styles.backButton}
        >
          <Ionicons color={colors.text} name="arrow-back" size={22} />
        </Pressable>
      ) : null)}

      <View style={styles.copy}>
        {eyebrow ? (
          <AppText maxFontSizeMultiplier={1.25} style={styles.eyebrow}>
            {eyebrow}
          </AppText>
        ) : null}
        <AppText
          accessibilityRole="header"
          maxFontSizeMultiplier={1.3}
          style={[styles.title, titleStyle]}
          variant="pageTitle"
        >
          {title}
        </AppText>
        {subtitle ? (
          <AppText
            maxFontSizeMultiplier={1.3}
            style={styles.subtitle}
            variant="pageSubtitle"
          >
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    minWidth: 0,
    overflow: 'visible',
    paddingBottom: 6,
    paddingTop: 4,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.soft,
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    marginTop: 4,
    width: 44,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    overflow: 'visible',
    paddingBottom: 4,
    paddingTop: 2,
  },
  eyebrow: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    lineHeight: 18,
    paddingBottom: 2,
  },
  title: {
    color: colors.text,
    flexShrink: 1,
    overflow: 'visible',
    paddingBottom: 4,
    paddingTop: 1,
  },
  subtitle: {
    color: colors.textMuted,
    flexShrink: 1,
    marginTop: 4,
    paddingBottom: 2,
  },
  trailing: {
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'center',
    minHeight: 44,
  },
});
