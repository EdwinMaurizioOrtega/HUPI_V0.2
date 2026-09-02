import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { ThemedView as View } from '@/theme/ThemedView';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { PhoneCountryInput } from '@/components/PhoneCountryInput';
import { ScreenContainer } from '@/components/ScreenContainer';
import { fonts } from '@/constants/typography';
import { beginAccessRecovery, setLocalLoggedIn } from '@/data/localAccountRepository';
import { isValidRecoveryEmail, normalizeRecoveryEmail } from '@/domain/accessRecovery';
import { Pressable, Text } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';
import { isPhoneNumberValid, normalizePhoneNumber } from '@/utils/phone';

type RecoveryMethod = 'email' | 'sms';

export default function AccessRecoveryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const [method, setMethod] = useState<RecoveryMethod>('email');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+593');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendRecoveryLink = async () => {
    if (isSubmitting) return;
    const normalizedEmail = normalizeRecoveryEmail(email);
    setEmail(normalizedEmail);
    if (!isValidRecoveryEmail(normalizedEmail)) {
      setError(t('auth.recovery.invalidEmail'));
      setSubmitted(false);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 250));
    beginAccessRecovery('email');
    setSubmitted(true);
    setIsSubmitting(false);
  };

  const sendRecoverySms = async () => {
    if (isSubmitting) return;
    if (!isPhoneNumberValid(countryCode, phone)) {
      setError(t('auth.recovery.invalidPhone'));
      return;
    }

    const normalizedPhone = normalizePhoneNumber(countryCode, phone);
    setPhone(normalizedPhone.displayNumber);
    setError(null);
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 250));
    beginAccessRecovery('sms', normalizedPhone.normalizedPhone);
    router.push('/verify-sms?recovery=1');
    setIsSubmitting(false);
  };

  const continueWithEmail = () => {
    beginAccessRecovery('email');
    router.push('/verify-sms?recovery=1');
  };

  const selectMethod = (nextMethod: RecoveryMethod) => {
    if (isSubmitting) return;
    setMethod(nextMethod);
    setSubmitted(false);
    setError(null);
  };

  const goBack = () => {
    setLocalLoggedIn(false);
    router.replace('/login');
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <Pressable
        accessibilityLabel={t('common.back')}
        accessibilityRole="button"
        onPress={goBack}
        style={[styles.backButton, { backgroundColor: tokens.soft }]}
      >
        <Ionicons color={tokens.text} name="arrow-back" size={22} />
      </Pressable>

      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: tokens.primarySoft }]}>
          <Ionicons color={tokens.primary} name="key-outline" size={30} />
        </View>
        <Text style={[styles.title, { color: tokens.text }]}>{t('auth.recovery.title')}</Text>
        <Text style={[styles.subtitle, { color: tokens.textMuted }]}>
          {t(method === 'email' ? 'auth.recovery.subtitle' : 'auth.recovery.phoneSubtitle')}
        </Text>
      </View>

      <View accessibilityRole="radiogroup" style={[styles.methodSelector, { backgroundColor: tokens.soft }]}>
        {(['email', 'sms'] as const).map((option) => {
          const selected = method === option;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              key={option}
              onPress={() => selectMethod(option)}
              style={[
                styles.methodOption,
                selected && { backgroundColor: tokens.surface, borderColor: tokens.secondary },
              ]}
            >
              <Ionicons
                color={selected ? tokens.secondary : tokens.textMuted}
                name={option === 'email' ? 'mail-outline' : 'phone-portrait-outline'}
                size={18}
              />
              <Text style={[styles.methodText, { color: selected ? tokens.secondary : tokens.textMuted }]}>
                {t(option === 'email' ? 'auth.recovery.emailMethod' : 'auth.recovery.phoneMethod')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={styles.channelCard}>
        {method === 'email' && !submitted ? (
          <>
            <Input
              accessibilityLabel={t('auth.recovery.emailField')}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              label={t('auth.recovery.emailField')}
              onChangeText={(value) => {
                setEmail(value);
                setError(null);
              }}
              onSubmitEditing={sendRecoveryLink}
              placeholder={t('auth.recovery.emailPlaceholder')}
              returnKeyType="send"
              value={email}
            />
            {error ? (
              <Text accessibilityLiveRegion="polite" style={[styles.error, { color: tokens.danger }]}>
                {error}
              </Text>
            ) : null}
            <Button
              icon="mail-outline"
              loading={isSubmitting}
              onPress={sendRecoveryLink}
              title={t('auth.recovery.sendEmail')}
            />
          </>
        ) : method === 'email' ? (
          <>
            <View accessibilityLiveRegion="polite" style={[styles.notice, { backgroundColor: tokens.primarySoft }]}>
              <Ionicons color={tokens.primary} name="information-circle-outline" size={20} />
              <View style={styles.noticeCopy}>
                <Text style={[styles.noticeText, { color: tokens.text }]}>{t('auth.recovery.neutralNotice')}</Text>
                <Text style={[styles.spamNotice, { color: tokens.textMuted }]}>{t('auth.recovery.spamNotice')}</Text>
              </View>
            </View>
            <Button onPress={continueWithEmail} title={t('auth.recovery.continueToCode')} variant="secondary" />
            <Button onPress={() => setSubmitted(false)} title={t('auth.recovery.correctData')} variant="outline" />
          </>
        ) : (
          <>
            <PhoneCountryInput
              accessibilityLabel={t('auth.recovery.phoneField')}
              countryCode={countryCode}
              label={t('auth.recovery.phoneField')}
              onCountryChange={setCountryCode}
              onPhoneChange={(value) => {
                setPhone(value);
                setError(null);
              }}
              onSubmitEditing={sendRecoverySms}
              phone={phone}
              placeholder={t('auth.recovery.phonePlaceholder')}
              returnKeyType="send"
            />
            {error ? (
              <Text accessibilityLiveRegion="polite" style={[styles.error, { color: tokens.danger }]}>
                {error}
              </Text>
            ) : null}
            <Button
              icon="chatbubble-ellipses-outline"
              loading={isSubmitting}
              onPress={sendRecoverySms}
              title={t('auth.recovery.sendSms')}
            />
          </>
        )}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 16 },
  backButton: { alignItems: 'center', borderRadius: 14, height: 44, justifyContent: 'center', width: 44 },
  hero: { marginTop: 30 },
  heroIcon: { alignItems: 'center', borderRadius: 22, height: 64, justifyContent: 'center', width: 64 },
  title: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 30, lineHeight: 38, marginTop: 20 },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: 8 },
  methodSelector: { borderRadius: 17, flexDirection: 'row', gap: 5, marginTop: 24, padding: 5 },
  methodOption: { alignItems: 'center', borderColor: 'transparent', borderRadius: 13, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 46, paddingHorizontal: 8 },
  methodText: { flexShrink: 1, fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  channelCard: { gap: 16, marginTop: 28 },
  notice: { alignItems: 'flex-start', borderRadius: 15, flexDirection: 'row', gap: 9, padding: 12 },
  noticeCopy: { flex: 1, gap: 8, minWidth: 0 },
  noticeText: { flex: 1, fontFamily: fonts.medium, fontSize: 13, lineHeight: 20 },
  spamNotice: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  error: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19 },
});
