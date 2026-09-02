import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import {
  StyleSheet,
} from 'react-native';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { Text } from '@/i18n/components';
import { useTranslation } from '../../../node_modules/react-i18next';

type QuantitySelectorProps = {
  max?: number;
  onChange: (quantity: number) => void;
  onMaxExceeded?: (max: number) => void;
  quantity: number;
};

export function QuantitySelector({ max, onChange, onMaxExceeded, quantity }: QuantitySelectorProps) {
  const { t } = useTranslation();
  const increaseQuantity = () => {
    if (max !== undefined && quantity >= max) {
      onMaxExceeded?.(max);
      return;
    }

    onChange(quantity + 1);
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityLabel={t('accessibility.decreaseQuantity')}
        accessibilityRole="button"
        hitSlop={6}
        onPress={() => onChange(Math.max(1, quantity - 1))}
        style={styles.button}
      >
        <Ionicons color={colors.secondary} name="remove" size={18} />
      </Pressable>
      <Text style={styles.quantity}>{quantity}</Text>
      <Pressable
        accessibilityLabel={t('accessibility.increaseQuantity')}
        accessibilityRole="button"
        hitSlop={6}
        onPress={increaseQuantity}
        style={styles.button}
      >
        <Ionicons color={colors.secondary} name="add" size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 46,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  button: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  quantity: { minWidth: 32, textAlign: 'center', color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900', lineHeight: 22, paddingBottom: 1 },
});
