import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { StyleSheet,
} from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { Text } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';
import type { AddressMapProps } from './AddressMap.types';

export function AddressMap({ accessibilityHint, accessibilityLabel, coordinate }: AddressMapProps) {
  const { t } = useTranslation();
  const { tokens } = useTheme();

  return (
    <View
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      style={[
        styles.frame,
        { backgroundColor: tokens.soft, borderColor: tokens.border },
      ]}
    >
      <View style={styles.grid}>
        {Array.from({ length: 24 }, (_, index) => <View key={index} style={styles.gridCell} />)}
      </View>
      <View style={styles.pin}>
        <Ionicons color={tokens.primary} name="location" size={40} />
      </View>
      <Text style={[styles.message, { color: tokens.text }]}>{t('addressBook.mapUnavailableWeb')}</Text>
      <Text style={[styles.coordinates, { color: tokens.textMuted }]}>
        {coordinate.latitude.toFixed(5)}, {coordinate.longitude.toFixed(5)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    backgroundColor: colors.soft,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 218,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 20,
  },
  grid: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', flexWrap: 'wrap', opacity: 0.42 },
  gridCell: { borderBottomColor: '#e7dfc9', borderBottomWidth: 1, borderRightColor: '#e7dfc9', borderRightWidth: 1, height: '25%', width: '16.666%' },
  pin: { marginBottom: 8 },
  message: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  coordinates: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 11, marginTop: 7 },
});
