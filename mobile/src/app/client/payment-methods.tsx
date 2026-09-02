import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HupiSuccessModal } from '@/components/HupiSuccessModal';
import { Input } from '@/components/Input';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { Text } from '@/i18n/components';
import {
  deleteMockPaymentMethod,
  getMockPaymentMethods,
  saveMockPaymentMethod,
  setDefaultMockPaymentMethod,
  type MockPaymentMethod,
} from '@/constants/mockData';

const emptyCard: MockPaymentMethod = {
  id: 'pay-new',
  brand: 'Visa',
  last4: '4242',
  holderName: 'Valentina Paredes',
  expiry: '12/30',
  isDefault: false,
};

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [methods, setMethods] = useState(() => getMockPaymentMethods());
  const [draft, setDraft] = useState(emptyCard);
  const [modal, setModal] = useState<{ title: string; description: string } | null>(null);

  const refresh = () => setMethods(getMockPaymentMethods());

  const save = () => {
    saveMockPaymentMethod({ ...draft, id: `pay-${Date.now()}`, last4: draft.last4.slice(-4), isDefault: methods.length === 0 });
    refresh();
    setDraft(emptyCard);
    setModal({ title: 'Tarjeta guardada', description: 'El método de pago quedó disponible en tu perfil.' });
  };

  const remove = (methodId: string) => {
    setMethods(deleteMockPaymentMethod(methodId));
    setModal({ title: 'Método de pago eliminado', description: 'La tarjeta fue retirada de tu perfil.' });
  };

  return (
    <ScreenContainer>
      <Header onBack={() => router.back()} title="__hupi_i18n:common.paymentMethods" />
      <View style={styles.stack}>
        {methods.map((method) => (
          <Card key={method.id} style={styles.paymentCard}>
            <View style={styles.cardTop}>
              <View style={styles.brandIcon}><Ionicons color={colors.white} name="card-outline" size={22} /></View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>{method.brand}  __hupi_i18n:common.finishedIn {method.last4}</Text>
                <Text style={styles.cardMeta}>{method.holderName}  __hupi_i18n:common.expires {method.expiry}</Text>
              </View>
              {method.isDefault ? <Text style={styles.defaultBadge}>__hupi_i18n:common.default</Text> : null}
            </View>
            <View style={styles.rowActions}>
              <Button disabled={method.isDefault} onPress={() => { setMethods(setDefaultMockPaymentMethod(method.id)); }} title="__hupi_i18n:common.default" variant="outline" />
              <Button icon="trash-outline" onPress={() => remove(method.id)} title="__hupi_i18n:common.delete" variant="ghost" />
            </View>
          </Card>
        ))}
      </View>

      <Text style={styles.sectionTitle}>__hupi_i18n:payments.payment-methods.addNewCard</Text>
      <Card style={styles.formCard} tone="soft">
        <View style={styles.chips}>
          {(['Visa', 'Mastercard'] as const).map((brand) => (
            <Pressable key={brand} onPress={() => setDraft((current) => ({ ...current, brand }))} style={[styles.chip, draft.brand === brand && styles.activeChip]}>
              <Text style={[styles.chipText, draft.brand === brand && styles.activeChipText]}>{brand}</Text>
            </Pressable>
          ))}
        </View>
        <Input keyboardType="number-pad" label="__hupi_i18n:payments.payment-methods.numberEndingIn" maxLength={4} onChangeText={(value) => setDraft((current) => ({ ...current, last4: value }))} value={draft.last4} />
        <Input label="__hupi_i18n:payments.payment-methods.ownerSName" onChangeText={(value) => setDraft((current) => ({ ...current, holderName: value }))} value={draft.holderName} />
        <Input label="__hupi_i18n:common.maturity" onChangeText={(value) => setDraft((current) => ({ ...current, expiry: value }))} value={draft.expiry} />
        <Button icon="add-circle-outline" onPress={save} title="__hupi_i18n:payments.payment-methods.addNewCard" />
      </Card>

      <HupiSuccessModal description={modal?.description ?? ''} onClose={() => setModal(null)} title={modal?.title ?? ''} visible={Boolean(modal)} />
    </ScreenContainer>
  );
}

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={styles.topbar}>
      <Pressable accessibilityLabel="__hupi_i18n:common.back" onPress={onBack} style={styles.backButton}>
        <Ionicons color={colors.text} name="arrow-back" size={22} />
      </Pressable>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>__hupi_i18n:common.customerProfile</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 6, marginBottom: 18, overflow: 'visible' },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 0, overflow: 'visible', paddingBottom: 3 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colors.text, flexShrink: 1, fontSize: 27, lineHeight: 35, fontWeight: '900', marginTop: 3, overflow: 'visible', paddingBottom: 2 },
  stack: { gap: 12 },
  paymentCard: { gap: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  cardCopy: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  cardMeta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  defaultBadge: { borderRadius: 999, backgroundColor: '#e7f5ef', color: colors.success, fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5 },
  rowActions: { flexDirection: 'row', gap: 8 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 28, marginBottom: 12 },
  formCard: { gap: 13, marginBottom: 20 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { minHeight: 36, borderRadius: 999, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', paddingHorizontal: 14, backgroundColor: colors.white },
  activeChip: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '900' },
  activeChipText: { color: colors.white },
});
