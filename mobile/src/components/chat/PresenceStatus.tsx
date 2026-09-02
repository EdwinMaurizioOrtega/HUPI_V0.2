import { StyleSheet } from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { fonts } from '@/constants/typography';
import { Text } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';
import { ThemedView as View } from '@/theme/ThemedView';

export function PresenceStatus({ isOnline }: { isOnline: boolean }) {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const label = t(isOnline ? 'chatPresence.online' : 'chatPresence.away');
  const statusColor = isOnline ? tokens.success : tokens.textMuted;

  return (
    <View accessibilityLabel={label} accessible style={styles.row}>
      <View style={[styles.dot, { backgroundColor: statusColor }]} />
      <Text numberOfLines={1} style={[styles.label, { color: statusColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 2 },
  dot: { borderRadius: 3.5, height: 7, width: 7 },
  label: { flexShrink: 1, fontFamily: fonts.light, fontSize: 13, lineHeight: 18 },
});
