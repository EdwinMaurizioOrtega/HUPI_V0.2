import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import type { ComponentProps } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { colors } from '@/constants/colors';
import { Text } from '@/i18n/components';

export type MockPaymentMethod = 'card' | 'bank' | 'deuna';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const methods: Array<{
  id: MockPaymentMethod;
  title: string;
  detail: string;
  icon: IoniconName;
}> = [
  { id: 'card', title: 'Tarjeta terminada en 4242', detail: 'Visa · modo prueba', icon: 'card-outline' },
  { id: 'bank', title: 'Transferencia bancaria', detail: 'Simulada · sin conexión bancaria', icon: 'business-outline' },
  { id: 'deuna', title: 'Deuna', detail: 'Opción visual · sin pago real', icon: 'phone-portrait-outline' },
];

type PaymentMethodSelectorProps = {
  value: MockPaymentMethod;
  onChange: (method: MockPaymentMethod) => void;
};

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <View style={styles.list}>
      {methods.map((method) => {
        const active = value === method.id;
        return (
          <Pressable
            key={method.id}
            onPress={() => onChange(method.id)}
            style={({ pressed }) => [styles.method, active && styles.activeMethod, pressed && styles.pressed]}
          >
            <View style={[styles.icon, active && styles.activeIcon]}>
              <Ionicons color={active ? colors.primary : colors.secondary} name={method.icon} size={21} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{method.title}</Text>
              <Text style={styles.detail}>{method.detail}</Text>
            </View>
            <View style={[styles.radio, active && styles.activeRadio]}>
              {active ? <View style={styles.radioDot} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 9 },
  method: {
    minHeight: 68,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 12,
  },
  activeMethod: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.secondarySoft, alignItems: 'center', justifyContent: 'center' },
  activeIcon: { backgroundColor: colors.white },
  copy: { flex: 1 },
  title: { color: colors.text, fontSize: 13, fontWeight: '900' },
  detail: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  activeRadio: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  pressed: { opacity: 0.78 },
});
