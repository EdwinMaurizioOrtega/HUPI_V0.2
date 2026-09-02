import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import {
  useState } from 'react';
import { Link,
  useLocalSearchParams,
  useRouter } from 'expo-router';
import {
  StyleSheet,
} from 'react-native';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { AppearanceSelectorModal } from '@/components/AppearanceSelectorModal';
import { Card } from '@/components/Card';
import { HupiPagesLogo } from '@/components/HupiPagesLogo';
import { HupiSuccessModal } from '@/components/HupiSuccessModal';
import { LanguageSelectorModal } from '@/components/LanguageSelectorModal';
import { PhoneInput } from '@/components/PhoneInput';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { getCurrentLanguage } from '@/i18n';
import { Text } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';
import { beginPhoneVerification } from '@/data/localAccountRepository';
import { requestOtpCode } from '@/data/backendSession';

export default function LoginScreen() {
  const { provider } = useLocalSearchParams<{ provider?: string }>();
  const [phone, setPhone] = useState('99 123 4567');
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [languageFeedbackVisible, setLanguageFeedbackVisible] = useState(false);
  const [appearanceModalVisible, setAppearanceModalVisible] = useState(false);
  const [appearanceFeedbackVisible, setAppearanceFeedbackVisible] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useTranslation();
  const { appearance, tokens } = useTheme();
  const appearanceIcon = appearance === 'light'
    ? 'sunny-outline'
    : appearance === 'dark'
      ? 'moon-outline'
      : 'phone-portrait-outline';
  const continueToVerification = async () => {
    if (phone.replace(/\D/g, '').length < 8) {
      setPhoneError(t('auth.login.phoneRequired'));
      return;
    }
    setPhoneError(null);
    beginPhoneVerification(phone, 'login');
    await requestOtpCode(phone, 'login');
    router.push(provider === '1' ? '/verify-sms?provider=1' : '/verify-sms');
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.brandRow}>
        <HupiPagesLogo height={58} width={174} />
        <View style={styles.quickActions}>
          <Pressable
            accessibilityHint={t('settings.selectAppearance')}
            accessibilityLabel={t('settings.appearance')}
            accessibilityRole="button"
            onPress={() => setAppearanceModalVisible(true)}
            style={[styles.appearanceButton, { backgroundColor: tokens.primarySoft }]}
          >
            <Ionicons color={tokens.primary} name={appearanceIcon} size={19} />
          </Pressable>
          <Pressable
            accessibilityLabel={t('accessibility.languageSelector')}
            accessibilityRole="button"
            onPress={() => setLanguageModalVisible(true)}
            style={[styles.languageButton, { backgroundColor: tokens.secondarySoft }]}
          >
            <Ionicons color={tokens.secondary} name="language-outline" size={18} />
            <Text style={[styles.languageCode, { color: tokens.secondary }]}>
              {getCurrentLanguage().toUpperCase()}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{t('auth.login.eyebrow')}</Text>
        <Text style={styles.title}>{t('auth.login.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>
      </View>

      <Card style={styles.form}>
        <PhoneInput
          onChangeText={(value) => {
            setPhone(value);
            if (phoneError) setPhoneError(null);
          }}
          value={phone}
        />
        {phoneError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{phoneError}</Text> : null}
        <Button
          onPress={continueToVerification}
          title={t('auth.login.continue')}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/access-recovery')}
          style={styles.recoveryButton}
        >
          <Text style={styles.recoveryText}>{t('auth.login.recovery')}</Text>
        </Pressable>
        <Text style={styles.mockNotice}>{t('auth.login.mockSms')}</Text>
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('auth.login.noAccount')}</Text>
        <Link href="/register?from=login" style={styles.link}>{t('auth.login.createAccount')}</Link>
      </View>

      <View style={styles.providerEntry}>
        <Text style={styles.providerPrompt}>{t('providerOnboarding.offerServicesQuestion')}</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/provider-access')} style={styles.providerEntryButton}>
          <Ionicons color={colors.primary} name="briefcase-outline" size={19} />
          <Text style={styles.providerEntryText}>{t('providerOnboarding.enterAsProvider')}</Text>
        </Pressable>
      </View>

      <View style={styles.decor}><Text style={styles.decorEmoji}>🐶</Text></View>
      <LanguageSelectorModal
        onClose={() => setLanguageModalVisible(false)}
        onLanguageChanged={() => setLanguageFeedbackVisible(true)}
        visible={languageModalVisible}
      />
      <AppearanceSelectorModal
        onAppearanceChanged={() => setAppearanceFeedbackVisible(true)}
        onClose={() => setAppearanceModalVisible(false)}
        visible={appearanceModalVisible}
      />
      <HupiSuccessModal
        description={t('settings.updated')}
        onClose={() => setLanguageFeedbackVisible(false)}
        title={t('settings.appLanguage')}
        visible={languageFeedbackVisible}
      />
      <HupiSuccessModal
        description={t('settings.appearanceUpdated')}
        onClose={() => setAppearanceFeedbackVisible(false)}
        title={t('settings.appearance')}
        visible={appearanceFeedbackVisible}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 36 },
  brandRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  quickActions: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  appearanceButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  languageButton: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 5,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  languageCode: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  hero: { marginTop: 56, maxWidth: 340 },
  eyebrow: { color: colors.secondary, fontFamily: fonts.semiBold, fontSize: 13, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 34, lineHeight: 42, fontWeight: '900', marginTop: 8 },
  subtitle: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: 12 },
  form: { gap: 18, marginTop: 34 },
  mockNotice: { color: colors.textMuted, fontFamily: fonts.light, fontSize: 13, textAlign: 'center' },
  error: { color: colors.danger, fontFamily: fonts.medium, fontSize: 13 },
  recoveryButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  recoveryText: { color: colors.secondary, fontFamily: fonts.medium, fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 26 },
  footerText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15 },
  link: { color: colors.primary, fontFamily: fonts.semiBold, fontSize: 15 },
  providerEntry: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, gap: 8, marginTop: 22, paddingTop: 20 },
  providerPrompt: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14 },
  providerEntryButton: { alignItems: 'center', flexDirection: 'row', gap: 7, minHeight: 44, paddingHorizontal: 12 },
  providerEntryText: { color: colors.primary, fontFamily: fonts.semiBold, fontSize: 15 },
  decor: {
    alignSelf: 'flex-end',
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 38,
  },
  decorEmoji: { fontSize: 46 },
});
