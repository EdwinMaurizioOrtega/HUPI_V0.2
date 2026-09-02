import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import {
  useState } from 'react';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useLocalSearchParams,
  useRouter } from 'expo-router';
import {
  StyleSheet,
} from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { PhoneInput } from '@/components/PhoneInput';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { Text } from '@/i18n/components';
import { beginPhoneVerification } from '@/data/localAccountRepository';
import { requestOtpCode } from '@/data/backendSession';

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [phone, setPhone] = useState('99 123 4567');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fallbackRoute: Href = from === 'onboarding' ? '/' : '/login';
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackRoute);
  };
  const continueToSms = async () => {
    if (phone.replace(/\D/g, '').length < 8) {
      setError(t('auth.login.phoneRequired'));
      return;
    }
    if (!consent) {
      setError(t('auth.register.consentRequired'));
      return;
    }
    setError(null);
    beginPhoneVerification(phone, 'register');
    await requestOtpCode(phone, 'register', consent);
    router.push('/verify-sms');
  };

  return (
    <ScreenContainer>
      <Pressable accessibilityLabel={t('accessibility.back')} onPress={goBack} style={styles.back}>
        <Ionicons color={colors.text} name="arrow-back" size={23} />
      </Pressable>
      <Text style={styles.eyebrow}>{t('auth.register.eyebrow')}</Text>
      <Text style={styles.title}>{t('auth.register.title')}</Text>
      <Text style={styles.subtitle}>{t('auth.register.subtitle')}</Text>

      <View style={styles.form}>
        <PhoneInput
          onChangeText={(value) => {
            setPhone(value);
            if (error) setError(null);
          }}
          value={phone}
        />
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consent }}
          onPress={() => {
            setConsent((value) => !value);
            if (error) setError(null);
          }}
          style={styles.consentRow}
        >
          <View style={[styles.checkbox, consent && styles.checkboxChecked]}>
            {consent ? <Ionicons color={colors.white} name="checkmark" size={16} /> : null}
          </View>
          <Text style={styles.consentText}>{t('auth.register.consent')}</Text>
        </Pressable>
        {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
        <Button
          onPress={continueToSms}
          title={t('auth.register.createAccount')}
        />
      </View>

      <Text style={styles.legal}>{t('auth.register.legal')}</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  eyebrow: { color: colors.secondary, fontSize: 13, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: colors.text, flexShrink: 1, fontSize: 29, lineHeight: 37, fontWeight: '900', marginTop: 8 },
  subtitle: { color: colors.textMuted, lineHeight: 21, marginTop: 12 },
  form: { gap: 16, marginTop: 30 },
  consentRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, minHeight: 44 },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  consentText: { color: colors.text, flex: 1, fontSize: 14, lineHeight: 20 },
  error: { color: colors.danger, fontSize: 13 },
  legal: { color: colors.textMuted, fontSize: 13, lineHeight: 21, textAlign: 'center', marginTop: 20 },
});
