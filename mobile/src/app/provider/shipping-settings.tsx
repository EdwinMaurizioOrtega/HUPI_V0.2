import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { Card } from '@/components/Card';
import { ProviderPageHeader } from '@/components/provider/ProviderPageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { formatMarketplaceCurrency } from '@/components/marketplace/ProductPriceBlock';
import { colors } from '@/constants/colors';
import { isValidShippingCostInput, isValidShippingHoursInput, parseShippingCost } from '@/domain/providerShipping';
import { Text, TextInput } from '@/i18n/components';
import { useTranslation } from '../../../node_modules/react-i18next';
import {
  getProviderShippingSettings,
  updateProviderShippingSetting,
  type MarketplaceShippingMethodId,
  type ProviderShippingSetting,
} from '@/constants/marketplaceStoreState';

export default function ProviderShippingSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState(() => getProviderShippingSettings());
  const [notice, setNotice] = useState<string | null>(null);

  const updateMethod = (methodId: MarketplaceShippingMethodId, updates: Partial<ProviderShippingSetting>) => {
    updateProviderShippingSetting(methodId, updates);
    setSettings(getProviderShippingSettings());
    setNotice('Métodos de envío actualizados.');
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <ProviderPageHeader
        onBack={() => router.back()}
        subtitle="__hupi_i18n:provider.shipping-settings.setAvailabilityForCheckout"
        title="__hupi_i18n:common.shippingMethods"
      />

      {notice ? (
        <View style={styles.notice}>
          <Ionicons color={colors.primary} name="checkmark-circle-outline" size={17} />
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      <View style={styles.stack}>
        {settings.map((method) => (
          <ShippingCard key={method.id} method={method} onUpdate={updateMethod} />
        ))}
      </View>

      <Card style={styles.infoCard} tone="soft">
        <Ionicons color={colors.secondary} name="information-circle-outline" size={20} />
        <Text style={styles.infoText}>__hupi_i18n:provider.shipping-settings.onlyTheMethodsEnabledByTheStoreAndCompatible</Text>
      </Card>
    </ScreenContainer>
  );
}

function ShippingCard({
  method,
  onUpdate,
}: {
  method: ProviderShippingSetting;
  onUpdate: (methodId: MarketplaceShippingMethodId, updates: Partial<ProviderShippingSetting>) => void;
}) {
  const { t } = useTranslation();
  const [costInput, setCostInput] = useState(() => String(method.price).replace('.', ','));
  const [hoursInput, setHoursInput] = useState(() => method.estimate);

  return (
    <Card style={styles.methodCard}>
      <View style={styles.methodHeader}>
        <View style={[styles.methodIcon, method.enabled ? styles.methodIconEnabled : styles.methodIconDisabled]}>
          <Ionicons color={method.enabled ? colors.primary : colors.textMuted} name={getMethodIcon(method.id)} size={22} />
        </View>
        <View style={styles.methodCopy}>
          <Text style={styles.methodTitle}>{method.title}</Text>
          <Text style={styles.methodMeta}>{method.enabled ? t('shippingSettings.available') : t('shippingSettings.unavailable')} · {formatMarketplaceCurrency(method.price)} · {t('shippingSettings.hoursValue', { value: method.estimate })}</Text>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: method.enabled }}
          onPress={() => onUpdate(method.id, { enabled: !method.enabled })}
          style={[styles.toggle, method.enabled && styles.toggleActive]}
        >
          <View style={[styles.toggleKnob, method.enabled && styles.toggleKnobActive]} />
        </Pressable>
      </View>

      <View style={styles.formGrid}>
        <Input
          keyboardType="decimal-pad"
          label={t('shippingSettings.cost')}
          onChangeText={(value) => {
            if (!isValidShippingCostInput(value)) return;
            setCostInput(value);
            onUpdate(method.id, { price: parseShippingCost(value) });
          }}
          value={costInput}
        />
        <Input
          keyboardType="number-pad"
          label={t('shippingSettings.estimatedHours')}
          onChangeText={(value) => {
            if (!isValidShippingHoursInput(value)) return;
            setHoursInput(value);
            onUpdate(method.id, { estimate: value });
          }}
          suffix={t('shippingSettings.hours')}
          value={hoursInput}
        />
        <Input multiline label={method.id === 'pickup' ? 'Dirección/punto y horario de retiro' : 'Instrucciones'} onChangeText={(value) => onUpdate(method.id, { instructions: value })} value={method.instructions} />
      </View>
    </Card>
  );
}

function Input({
  keyboardType,
  label,
  multiline = false,
  onChangeText,
  suffix,
  value,
}: {
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  suffix?: string;
  value: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={suffix ? styles.inputWithSuffix : undefined}>
        <TextInput
          keyboardType={keyboardType}
          multiline={multiline}
          onChangeText={onChangeText}
          style={[styles.input, suffix && styles.suffixedInput, multiline && styles.multiline]}
          value={value}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

function getMethodIcon(methodId: MarketplaceShippingMethodId) {
  if (methodId === 'express') {
    return 'flash-outline';
  }

  if (methodId === 'pickup') {
    return 'location-outline';
  }

  return 'car-outline';
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 42 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 21, marginTop: 4 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 15, backgroundColor: colors.primarySoft, padding: 11, marginTop: 16 },
  noticeText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '800' },
  stack: { gap: 13, marginTop: 18 },
  methodCard: { gap: 12, shadowOpacity: 0.04 },
  methodHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  methodIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  methodIconEnabled: { backgroundColor: colors.primarySoft },
  methodIconDisabled: { backgroundColor: colors.soft },
  methodCopy: { flex: 1 },
  methodTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  methodMeta: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 4, fontWeight: '800' },
  toggle: { width: 48, height: 28, borderRadius: 999, backgroundColor: colors.border, justifyContent: 'center', padding: 3 },
  toggleActive: { backgroundColor: colors.primary },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white },
  toggleKnobActive: { marginLeft: 20 },
  formGrid: { gap: 9 },
  inputGroup: { gap: 5 },
  inputLabel: { color: colors.text, fontSize: 12, fontWeight: '900' },
  input: { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.text, paddingHorizontal: 12, fontSize: 13, fontWeight: '800' },
  inputWithSuffix: { alignItems: 'center', flexDirection: 'row' },
  suffixedInput: { flex: 1, paddingRight: 70 },
  suffix: { color: colors.secondary, fontSize: 12, fontWeight: '900', marginLeft: -60, width: 52 },
  multiline: { minHeight: 76, paddingTop: 11, textAlignVertical: 'top' },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, shadowOpacity: 0 },
  infoText: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '800' },
});
