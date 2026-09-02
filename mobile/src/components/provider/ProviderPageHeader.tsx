import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';
import { Text } from '@/i18n/components';

type ProviderPageHeaderProps = {
  backAccessibilityLabel?: string;
  onBack: () => void;
  style?: StyleProp<ViewStyle>;
  subtitle?: ReactNode;
  title: ReactNode;
};

export function ProviderPageHeader({
  backAccessibilityLabel = '__hupi_i18n:common.back',
  onBack,
  style,
  subtitle,
  title,
}: ProviderPageHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      <Pressable
        accessibilityLabel={backAccessibilityLabel}
        accessibilityRole="button"
        onPress={onBack}
        style={styles.backButton}
      >
        <Ionicons color={colors.text} name="arrow-back" size={22} />
      </Pressable>
      <View style={styles.heading}>
        <Text numberOfLines={2} style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 12,
    minWidth: 0,
    overflow: 'visible',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.soft,
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    marginTop: 2,
    width: 42,
  },
  heading: {
    flex: 1,
    minWidth: 0,
    overflow: 'visible',
    paddingBottom: 4,
  },
  title: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 35,
    overflow: 'visible',
    paddingBottom: 2,
  },
  subtitle: {
    color: colors.textMuted,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 20,
    marginTop: 3,
    overflow: 'visible',
    paddingBottom: 1,
  },
});
