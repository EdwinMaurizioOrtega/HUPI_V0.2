import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { StyleSheet,
} from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

export const HUPI_VERIFIED_BLUE = '#0096FF';

export function HupiVerifiedBadge({ size = 17 }: { size?: number }) {
  const { t } = useTranslation();

  return (
    <View
      accessibilityLabel={t('verifiedBadge.accessibilityLabel')}
      accessibilityRole="image"
      style={styles.badge}
    >
      <Ionicons color={HUPI_VERIFIED_BLUE} name="shield-checkmark" size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 22,
    minWidth: 22,
  },
});
