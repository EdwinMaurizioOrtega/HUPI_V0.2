import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { StyleSheet,
} from 'react-native';

import { colors } from '@/constants/colors';
import { theme } from '@/constants/theme';
import { Text } from '@/i18n/components';

export function SafetyNoticeCard() {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons color={colors.white} name="shield-checkmark" size={19} />
      </View>
      <Text style={styles.text}>

        __hupi_i18n:components.SafetyNoticeCard.forSecurityCoordinateAndMaintainPaymentsWithinHupiWe
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, color: colors.white, fontSize: 13, lineHeight: 20, fontWeight: '700' },
});
