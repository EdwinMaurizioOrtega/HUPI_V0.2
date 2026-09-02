import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { PhoneInput } from '@/components/PhoneInput';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { beginPhoneVerification, saveLocalCustomerProfile } from '@/data/localAccountRepository';
import { beginProviderEnrollment, validateLocalProviderEmail } from '@/data/localProviderRepository';
import type { ProviderEntityType } from '@/domain/providerVerification';
import { useLocalAccount } from '@/hooks/useLocalAccount';
import { Pressable, Text } from '@/i18n/components';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { ThemedView as View } from '@/theme/ThemedView';

export default function ProviderOnboardingScreen() {
  const { existing } = useLocalSearchParams<{ existing?: string }>();
  const account = useLocalAccount();
  const router = useRouter();
  const { t } = useTranslation();
  const isExisting = existing === '1';
  const [entityType, setEntityType] = useState<ProviderEntityType | null>(null);
  const [firstName, setFirstName] = useState(isExisting ? account.profile.firstName : '');
  const [lastName, setLastName] = useState(isExisting ? account.profile.lastName : '');
  const [phone, setPhone] = useState(isExisting ? account.profile.phone : '');
  const [email, setEmail] = useState(isExisting ? account.profile.email : '');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');

  const chooseType = (type: ProviderEntityType) => {
    setEntityType(type);
    setError('');
    if (isExisting) {
      beginProviderEnrollment(type);
      validateLocalProviderEmail();
      router.replace('/provider/verification');
    }
  };

  const createAccount = () => {
    if (!entityType) return;
    if (!firstName.trim() || !lastName.trim() || phone.replace(/\D/g, '').length < 8
      || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim()) || password.length < 6 || !consent) {
      setError(t('providerOnboarding.completeBasicData'));
      return;
    }
    beginPhoneVerification(phone, 'register');
    saveLocalCustomerProfile({
      ...account.profile,
      firstName,
      lastName,
      phone,
      email,
    });
    beginProviderEnrollment(entityType);
    // El correo obligatorio se valida sintácticamente en este mock; no se envía código.
    validateLocalProviderEmail();
    router.push('/verify-sms?provider=1&create=1');
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <Pressable accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
        <Ionicons color={colors.text} name="arrow-back" size={22} />
      </Pressable>
      <Text style={styles.eyebrow}>{t('providerOnboarding.workWithHupi')}</Text>
      <Text style={styles.title}>{t('providerOnboarding.entityQuestion')}</Text>
      <Text style={styles.subtitle}>{t('providerOnboarding.singleAccountHint')}</Text>
      <View style={styles.typeGrid}>
        <EntityCard icon="person-outline" label={t('providerOnboarding.natural')} onPress={() => chooseType('natural')} selected={entityType === 'natural'} />
        <EntityCard icon="business-outline" label={t('providerOnboarding.legal')} onPress={() => chooseType('legal')} selected={entityType === 'legal'} />
      </View>
      {entityType && !isExisting ? (
        <Card style={styles.form}>
          <Text style={styles.formTitle}>{t('providerOnboarding.basicAccount')}</Text>
          <Input autoCapitalize="words" label={t('providerVerification.fields.firstName')} onChangeText={setFirstName} value={firstName} />
          <Input autoCapitalize="words" label={t('providerVerification.fields.lastName')} onChangeText={setLastName} value={lastName} />
          <PhoneInput onChangeText={setPhone} value={phone} />
          <Input autoCapitalize="none" keyboardType="email-address" label={t('providerVerification.fields.email')} onChangeText={setEmail} value={email} />
          <Input autoCapitalize="none" label={t('auth.register.password')} onChangeText={setPassword} secureTextEntry value={password} />
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: consent }} onPress={() => setConsent((value) => !value)} style={styles.consent}>
            <View style={[styles.checkbox, consent && styles.checkboxChecked]}>{consent ? <Ionicons color={colors.white} name="checkmark" size={16} /> : null}</View>
            <Text style={styles.consentText}>{t('auth.register.consent')}</Text>
          </Pressable>
          {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
          <Button onPress={createAccount} title={t('providerOnboarding.createBaseAccount')} />
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

function EntityCard({ icon, label, onPress, selected }: { icon: 'person-outline' | 'business-outline'; label: string; onPress: () => void; selected: boolean }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={[styles.typeCard, selected && styles.typeCardSelected]}>
      <Ionicons color={selected ? colors.white : colors.secondary} name={icon} size={28} />
      <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 42, paddingTop: 18 },
  back: { alignItems: 'center', backgroundColor: colors.soft, borderRadius: 14, height: 44, justifyContent: 'center', width: 44 },
  eyebrow: { color: colors.secondary, fontSize: 12, fontWeight: '900', letterSpacing: 1.2, marginTop: 24 },
  title: { color: colors.text, fontSize: 29, fontWeight: '900', lineHeight: 37, marginTop: 8 },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  typeGrid: { flexDirection: 'row', gap: 10, marginTop: 22 },
  typeCard: { alignItems: 'center', backgroundColor: colors.secondarySoft, borderColor: colors.border, borderRadius: 20, borderWidth: 1, flex: 1, gap: 8, minHeight: 112, justifyContent: 'center', padding: 12 },
  typeCardSelected: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  typeLabel: { color: colors.text, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  typeLabelSelected: { color: colors.white },
  form: { gap: 14, marginTop: 18 },
  formTitle: { color: colors.text, fontSize: 19, fontWeight: '900' },
  consent: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, minHeight: 44 },
  checkbox: { alignItems: 'center', borderColor: colors.border, borderRadius: 8, borderWidth: 1, height: 26, justifyContent: 'center', width: 26 },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  consentText: { color: colors.text, flex: 1, fontSize: 13, lineHeight: 19 },
  error: { color: colors.danger, fontSize: 13 },
});
