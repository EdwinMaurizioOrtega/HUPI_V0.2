import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { StyleSheet,
} from 'react-native';

import { colors } from '@/constants/colors';
import { Text } from '@/i18n/components';

type RatingBadgeProps = {
  rating: number;
  reviews?: number;
};

export function RatingBadge({ rating, reviews }: RatingBadgeProps) {
  return (
    <View style={styles.row}>
      <Ionicons color={colors.warning} name="star" size={14} />
      <Text style={styles.rating}>{rating.toFixed(1)}</Text>
      {reviews !== undefined ? <Text style={styles.reviews}>({reviews})</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { color: colors.text, fontSize: 13, fontWeight: '900' },
  reviews: { color: colors.textMuted, fontSize: 12 },
});
