import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href, useRouter } from 'expo-router';
import { Image,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

import { colors } from '@/constants/colors';
import { getActiveOrderedContent, visualContentConfig } from '@/constants/contentConfig';
import { isServiceEnabled } from '@/constants/features';
import type { ServiceId } from '@/constants/services';
import { theme } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import { Pressable, Text } from '@/i18n/components';

const promos = getActiveOrderedContent(visualContentConfig.homeBanners)
  .filter((promo) => isServiceEnabled(getBannerServiceId(promo.targetRoute)));

function getBannerServiceId(targetRoute: string): ServiceId {
  return targetRoute.includes('/marketplace') ? 'marketplace' : 'walk';
}

export function PromoCarousel() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(Math.max(width - 58, 248), 340);

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>__hupi_i18n:common.specialForYou</Text>
        <View style={styles.pageDots}>
          {promos.map((promo, index) => (
            <View key={promo.id} style={[styles.dot, index === 0 && styles.activeDot]} />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.track}
        decelerationRate="fast"
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + 12}
      >
        {promos.map((promo) => (
          <View
            key={promo.id}
            style={[styles.card, { width: cardWidth, backgroundColor: promo.backgroundColor ?? colors.primary }]}
          >
            <View style={[styles.largeOrb, { backgroundColor: promo.accent ?? 'rgba(255,255,255,0.18)' }]} />
            <View style={[styles.smallOrb, { backgroundColor: promo.accent ?? 'rgba(255,255,255,0.18)' }]} />
            <View style={styles.cardContent}>
              <View style={[styles.icon, { backgroundColor: promo.accent ?? 'rgba(255,255,255,0.18)' }]}>
                {promo.image ? (
                  <Image source={promo.image} style={styles.bannerImage} />
                ) : (
                  <Ionicons color={promo.foregroundColor ?? colors.white} name={promo.icon ?? 'paw'} size={20} />
                )}
              </View>
              <Text style={[styles.eyebrow, { color: promo.foregroundColor ?? colors.white }]}>{promo.eyebrow}</Text>
              <Text style={[styles.title, { color: promo.foregroundColor ?? colors.white }]}>{promo.title}</Text>
              <Text style={[styles.subtitle, { color: promo.foregroundColor ?? colors.white }]}>{promo.subtitle}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(promo.targetRoute as Href)}
                style={({ pressed }) => [
                  styles.action,
                  promo.backgroundColor === colors.soft && styles.actionLight,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.actionText,
                    promo.backgroundColor === colors.soft && styles.actionTextLight,
                  ]}
                >
                  {promo.ctaText}
                </Text>
                <Ionicons
                  color={promo.backgroundColor === colors.soft ? colors.white : promo.foregroundColor ?? colors.white}
                  name="arrow-forward"
                  size={16}
                />
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 22 },
  headingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  heading: { flex: 1, color: colors.text, fontFamily: fonts.bold, fontSize: 17, fontWeight: '900' },
  pageDots: { flexDirection: 'row', gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.border },
  activeDot: { width: 17, backgroundColor: colors.primary },
  track: { gap: 12, paddingRight: 20 },
  card: {
    minHeight: 176,
    borderRadius: theme.radius.lg,
    padding: 16,
    overflow: 'hidden',
  },
  cardContent: { alignItems: 'flex-start', minWidth: 0, paddingRight: 48, position: 'relative' },
  icon: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerImage: { width: '100%', height: '100%', borderRadius: 13 },
  eyebrow: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 11, fontWeight: '900', letterSpacing: 1.1, lineHeight: 16, opacity: 0.76 },
  title: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 18, lineHeight: 22, fontWeight: '900', marginTop: 4 },
  subtitle: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18, opacity: 0.84, marginTop: 4 },
  action: {
    minHeight: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.17)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    marginTop: 9,
    maxWidth: '100%',
  },
  actionLight: { backgroundColor: colors.secondary },
  actionText: { color: colors.white, flexShrink: 1, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', lineHeight: 16 },
  actionTextLight: { color: colors.white },
  largeOrb: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    right: -38,
    top: -46,
  },
  smallOrb: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    right: 46,
    bottom: -22,
  },
  pressed: { opacity: 0.75 },
});
