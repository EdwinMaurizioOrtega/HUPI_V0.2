import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import {
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

import { colors } from '@/constants/colors';
import { theme } from '@/constants/theme';
import { Text } from '@/i18n/components';

type OfficialStoreCardProps = {
  category: string;
  isOfficialStore: boolean;
  isVerifiedByHupi: boolean;
  logo: string;
  name: string;
  onPress: () => void;
  productCount: number;
  rating: string;
};

export function OfficialStoreCard({
  category,
  isOfficialStore,
  isVerifiedByHupi,
  logo,
  name,
  onPress,
  productCount,
  rating,
}: OfficialStoreCardProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(Math.max(width - 76, 240), 300);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && styles.pressed]}
    >
      <View style={styles.logoWrap}>
        <Text style={styles.logo}>{logo}</Text>
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <View style={styles.nameWrap}>
            <Text numberOfLines={1} style={styles.name}>{name}</Text>
            {isOfficialStore || isVerifiedByHupi ? (
              <View style={styles.officialCheck}>
                <Ionicons color={colors.white} name="checkmark" size={10} />
              </View>
            ) : null}
          </View>
          <View style={styles.rating}>
            <Ionicons color={colors.warning} name="star" size={11} />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        </View>
        <View style={styles.badges}>
          {isVerifiedByHupi ? (
            <View style={styles.verifiedBadge}>
              <Ionicons color={colors.success} name="checkmark-circle" size={12} />
              <Text style={styles.verifiedBadgeText}>__hupi_i18n:common.verifiedByHupi</Text>
            </View>
          ) : null}
          {isOfficialStore ? (
            <View style={styles.officialBadge}>
              <Text style={styles.officialBadgeText}>__hupi_i18n:common.officialStore</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.meta}>{category} · {productCount}  __hupi_i18n:common.products</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 118,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 13,
    marginRight: 12,
    ...theme.shadow,
    shadowOpacity: 0.05,
  },
  pressed: { opacity: 0.86 },
  logoWrap: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.secondarySoft, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  logo: { fontSize: 27, lineHeight: 36, textAlign: 'center' },
  copy: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nameWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 0 },
  name: { flexShrink: 1, color: colors.text, fontSize: 15, fontWeight: '900' },
  officialCheck: { width: 17, height: 17, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  rating: { flexDirection: 'row', alignItems: 'center', flexShrink: 0, gap: 2 },
  ratingText: { color: colors.text, fontSize: 12, fontWeight: '900' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 },
  verifiedBadge: { alignSelf: 'flex-start', minHeight: 24, borderRadius: 999, backgroundColor: '#eef9f3', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8 },
  verifiedBadgeText: { color: colors.success, flexShrink: 1, fontSize: 11, fontWeight: '900', lineHeight: 15 },
  officialBadge: { alignSelf: 'flex-start', minHeight: 24, borderRadius: 999, backgroundColor: colors.secondarySoft, justifyContent: 'center', paddingHorizontal: 8 },
  officialBadgeText: { color: colors.secondary, flexShrink: 1, fontSize: 11, fontWeight: '900', lineHeight: 15 },
  meta: { color: colors.textMuted, flexShrink: 1, fontSize: 12, fontWeight: '700', lineHeight: 17, marginTop: 7 },
});
