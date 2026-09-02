import { ThemedView as View } from '@/theme/ThemedView';
import {
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

import { colors } from '@/constants/colors';
import { theme } from '@/constants/theme';
import { Text } from '@/i18n/components';

type MarketplaceBannerProps = {
  accent: string;
  backgroundColor: string;
  eyebrow: string;
  subtitle: string;
  title: string;
};

export function MarketplaceBanner({
  accent,
  backgroundColor,
  eyebrow,
  subtitle,
  title,
}: MarketplaceBannerProps) {
  const { width } = useWindowDimensions();
  const bannerWidth = Math.min(Math.max(width - 64, 248), 340);

  return (
    <View style={[styles.banner, { backgroundColor, width: bannerWidth }]}>
      <View style={styles.decor} />
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.accent}>{accent}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 174,
    borderRadius: theme.radius.lg,
    padding: 18,
    overflow: 'hidden',
    marginRight: 12,
  },
  decor: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(255,255,255,0.14)',
    right: -32,
    top: -26,
  },
  copy: { flexShrink: 1, minWidth: 0, paddingRight: 48 },
  eyebrow: { color: colors.white, flexShrink: 1, fontSize: 12, fontWeight: '900', letterSpacing: 1.1, lineHeight: 17, opacity: 0.84 },
  title: { color: colors.white, flexShrink: 1, fontSize: 20, lineHeight: 25, fontWeight: '900', marginTop: 7 },
  subtitle: { color: colors.white, flexShrink: 1, fontSize: 14, lineHeight: 20, marginTop: 7, opacity: 0.88 },
  accent: { position: 'absolute', right: 14, bottom: 12, fontSize: 34 },
});
