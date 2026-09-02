import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  StyleSheet,
} from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HupiSuccessModal } from '@/components/HupiSuccessModal';
import { Input } from '@/components/Input';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { Text } from '@/i18n/components';
import {
  deleteMockBillingProfile,
  getMockBillingProfiles,
  saveMockBillingProfile,
  setDefaultMockBillingProfile,
  type MockBillingProfile,
} from '@/constants/mockData';

const emptyBilling: MockBillingProfile = {
  id: 'billing-new',
  taxpayerType: 'Persona Natural',
  identificationType: 'Cédula',
  identificationNumber: '',
  nameOrBusinessName: '',
  billingEmail: '',
  contactPhone: '+593 ',
  fiscalAddress: '',
  isDefault: false,
};

export default function BillingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState(() => getMockBillingProfiles());
  const [draft, setDraft] = useState<MockBillingProfile>(emptyBilling);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (key: keyof MockBillingProfile, value: string | boolean) => setDraft((current) => ({ ...current, [key]: value }));

  const setType = (taxpayerType: MockBillingProfile['taxpayerType']) => {
    setDraft((current) => ({ ...current, taxpayerType, identificationType: taxpayerType === 'Persona Jurídica' ? 'RUC' : current.identificationType }));
  };

  const save = () => {
    const id = editingId ?? `billing-${Date.now()}`;
    setProfiles(saveMockBillingProfile({ ...draft, id, isDefault: draft.isDefault || profiles.length === 0 }));
    setDraft(emptyBilling);
    setEditingId(null);
    setFormOpen(false);
    setSaved(true);
  };

  const closeForm = () => {
    setDraft(emptyBilling);
    setEditingId(null);
    setFormOpen(false);
  };

  const editProfile = (profile: MockBillingProfile) => {
    setEditingId(profile.id);
    setDraft(profile);
    setFormOpen(true);
  };

  const togglePrimaryForm = () => {
    if (formOpen) {
      closeForm();
      return;
    }
    const existingProfile = profiles.find((profile) => profile.isDefault) ?? profiles[0];
    if (existingProfile) {
      editProfile(existingProfile);
      return;
    }
    setDraft(emptyBilling);
    setEditingId(null);
    setFormOpen(true);
  };

  return (
    <ScreenContainer>
      <Header onBack={() => router.back()} title="__hupi_i18n:common.billingInformation" />
      <Pressable accessibilityRole="button" onPress={togglePrimaryForm} style={styles.primaryAction}>
        <Ionicons color={colors.white} name={formOpen ? 'chevron-up' : profiles.length > 0 ? 'create-outline' : 'add'} size={20} />
        <Text style={styles.primaryActionText}>
          {formOpen ? t('billing.closeForm') : profiles.length > 0 ? t('billing.edit') : t('billing.add')}
        </Text>
      </Pressable>
      <View style={styles.stack}>
        {profiles.map((profile) => (
          <Card key={profile.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.icon}><Ionicons color={colors.secondary} name="reader-outline" size={21} /></View>
              <View style={styles.copy}>
                <Text style={styles.cardTitle}>{profile.nameOrBusinessName}</Text>
                <Text style={styles.cardText}>{profile.taxpayerType} · {profile.identificationType} {profile.identificationNumber}</Text>
                <Text style={styles.cardMeta}>{profile.billingEmail} · {profile.contactPhone}</Text>
              </View>
              {profile.isDefault ? <Text style={styles.badge}>__hupi_i18n:common.default2</Text> : null}
            </View>
            <View style={styles.actions}>
              <Button onPress={() => editProfile(profile)} title={t('billing.edit')} variant="outline" />
              <Button disabled={profile.isDefault} onPress={() => setProfiles(setDefaultMockBillingProfile(profile.id))} title="__hupi_i18n:common.default2" variant="outline" />
              <Button icon="trash-outline" onPress={() => setProfiles(deleteMockBillingProfile(profile.id))} title="__hupi_i18n:common.delete" variant="ghost" />
            </View>
          </Card>
        ))}
      </View>

      {formOpen ? <>
      <Text style={styles.sectionTitle}>{editingId ? t('billing.edit') : t('billing.add')}</Text>
      <Card style={styles.form} tone="soft">
        <View style={styles.chips}>
          {(['Persona Natural', 'Persona Jurídica'] as const).map((type) => (
            <Pressable key={type} onPress={() => setType(type)} style={[styles.chip, draft.taxpayerType === type && styles.activeChip]}>
              <Text style={[styles.chipText, draft.taxpayerType === type && styles.activeChipText]}>{type}</Text>
            </Pressable>
          ))}
        </View>
        {draft.taxpayerType === 'Persona Natural' ? (
          <View style={styles.chips}>
            {(['Cédula', 'RUC'] as const).map((type) => (
              <Pressable key={type} onPress={() => update('identificationType', type)} style={[styles.chip, draft.identificationType === type && styles.activeChip]}>
                <Text style={[styles.chipText, draft.identificationType === type && styles.activeChipText]}>{type}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <Input keyboardType="number-pad" label={draft.taxpayerType === 'Persona Jurídica' ? 'RUC' : 'Número'} onChangeText={(value) => update('identificationNumber', value)} value={draft.identificationNumber} />
        <Input label={draft.taxpayerType === 'Persona Jurídica' ? 'Razón social' : 'Nombres y apellidos'} onChangeText={(value) => update('nameOrBusinessName', value)} value={draft.nameOrBusinessName} />
        <Input autoCapitalize="none" keyboardType="email-address" label="__hupi_i18n:payments.billing.billingEmail" onChangeText={(value) => update('billingEmail', value)} value={draft.billingEmail} />
        <Input keyboardType="phone-pad" label="__hupi_i18n:common.telephone" onChangeText={(value) => update('contactPhone', value)} value={draft.contactPhone} />
        {draft.taxpayerType === 'Persona Jurídica' ? (
          <Input label="__hupi_i18n:common.taxAddress" multiline onChangeText={(value) => update('fiscalAddress', value)} value={draft.fiscalAddress} />
        ) : null}
        <Pressable onPress={() => update('isDefault', !draft.isDefault)} style={styles.checkRow}>
          <View style={[styles.checkbox, draft.isDefault && styles.checked]}>{draft.isDefault ? <Ionicons color={colors.white} name="checkmark" size={15} /> : null}</View>
          <Text style={styles.checkText}>__hupi_i18n:payments.billing.markAsDefaultData</Text>
        </Pressable>
        <View style={styles.formActions}>
          <Button onPress={closeForm} style={styles.formButton} title={t('common.cancel')} variant="outline" />
          <Button icon="save-outline" onPress={save} style={styles.formButton} title="__hupi_i18n:payments.billing.saveBillingInformation" />
        </View>
      </Card>
      </> : null}

      <HupiSuccessModal description="__hupi_i18n:payments.billing.yourTaxDataWasSavedCorrectly" onClose={() => setSaved(false)} title="__hupi_i18n:payments.billing.savedBillingInformation" visible={saved} />
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
  primaryAction: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 16, flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 16, minHeight: 50, paddingHorizontal: 14 },
  primaryActionText: { color: colors.white, fontSize: 15, fontWeight: '900' },
  card: { gap: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.secondarySoft, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  cardText: { color: colors.text, fontSize: 13, lineHeight: 21, marginTop: 4, fontWeight: '700' },
  cardMeta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  badge: { borderRadius: 999, backgroundColor: '#e7f5ef', color: colors.success, fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 28, marginBottom: 12 },
  form: { gap: 13, marginBottom: 20 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { minHeight: 36, borderRadius: 999, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', paddingHorizontal: 14, backgroundColor: colors.white },
  activeChip: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '900' },
  activeChipText: { color: colors.white },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  checked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '800' },
  formActions: { flexDirection: 'row', gap: 10 },
  formButton: { flex: 1 },
});
