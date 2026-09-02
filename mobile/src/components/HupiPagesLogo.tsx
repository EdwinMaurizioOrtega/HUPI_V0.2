import { Image, type ImageStyle, StyleSheet } from 'react-native';

import { visualContentConfig } from '@/constants/contentConfig';

type HupiPagesLogoProps = {
  height?: number;
  width?: number;
  style?: ImageStyle;
};

export function HupiPagesLogo({ height = 44, style, width = 136 }: HupiPagesLogoProps) {
  return (
    <Image
      accessibilityIgnoresInvertColors
      accessibilityLabel="__hupi_i18n:common.hupi"
      resizeMode="contain"
      source={visualContentConfig.appBranding.internalLogo}
      style={[styles.logo, { height, width }, style]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    flexShrink: 0,
  },
});
