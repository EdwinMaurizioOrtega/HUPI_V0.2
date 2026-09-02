import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import {
  StyleSheet,
} from 'react-native';

import { colors } from '@/constants/colors';
import { formatMarketplaceCurrency } from './ProductPriceBlock';
import { Text } from '@/i18n/components';

type ShippingMethodCardProps = {
  active: boolean;
  available?: boolean;
  estimate: string;
  onPress: () => void;
  price: number;
  title: string;
};

export function ShippingMethodCard({ active, available = true, estimate, onPress, price, title }: ShippingMethodCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={available ? onPress : undefined}
      style={({ pressed }) => [styles.card, active && styles.active, !available && styles.disabled, pressed && available && styles.pressed]}
    >
      <View style={[styles.icon, active && styles.activeIcon]}>
        <Ionicons color={active ? colors.white : colors.secondary} name={available ? 'cube-outline' : 'lock-closed-outline'} size={20} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.estimate}>{available ? estimate : 'No disponible para este proveedor'}</Text>
      </View>
      <Text style={styles.price}>{formatMarketplaceCurrency(price)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 12,
  },
  active: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  disabled: { opacity: 0.55, backgroundColor: colors.soft },
  pressed: { opacity: 0.84 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIcon: { backgroundColor: colors.primary },
  copy: { flex: 1 },
  title: { color: colors.text, fontSize: 15, fontWeight: '900' },
  estimate: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  price: { color: colors.primary, fontSize: 15, fontWeight: '900' },
});
