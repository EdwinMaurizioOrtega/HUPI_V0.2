import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import {
  useEffect,
  useState } from 'react';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import {
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { OtpInput } from '@/components/OtpInput';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { completePhoneVerification } from '@/data/localAccountRepository';
import { getPhoneLastFour, maskPhone } from '@/domain/accessRecovery';
import { Text } from '@/i18n/components';
import { useLocalAccount } from '@/hooks/useLocalAccount';
import { activateApprovedLocalProviderDemo } from '@/data/localProviderRepository';
import { resendOtpCode, verifyOtpCode } from '@/data/backendSession';

export default function VerifySmsScreen() {
  const { create, provider, recovery } = useLocalSearchParams<{ create?: string; provider?: string; recovery?: string }>();
  const router = useRouter();
  const account = useLocalAccount();
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const { t } = useTranslation();
  const channel = account.session.verificationChannel;
  const isRecovery = recovery === '1';
  const maskedPhone = maskPhone(account.session.pendingPhone || account.profile.phone);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const verify = async () => {
    if (isVerifying) return;
    setIsVerifying(true);

    const phone = account.session.pendingPhone || account.profile.phone;
    const accepted = await verifyOtpCode(phone, code);
    setIsVerifying(false);

    if (!accepted) {
      setError(t('auth.sms.invalidCode'));
      return;
    }

    setError(null);
    completePhoneVerification();
    if (provider === '1') {
      if (create !== '1') activateApprovedLocalProviderDemo();
      router.replace(create === '1' ? '/provider/verification' : '/provider');
    }
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.icon}>
        <Ionicons color={colors.primary} name={channel === 'email' ? 'mail' : 'chatbubble-ellipses'} size={36} />
      </View>
      <Text style={styles.title}>{t(channel === 'email' ? 'auth.sms.emailTitle' : 'auth.sms.title')}</Text>
      <Text style={styles.subtitle}>
        {t(channel === 'email'
          ? 'auth.sms.emailSent'
          : isRecovery
            ? 'auth.sms.recoverySmsSent'
            : 'auth.sms.smsSent', {
          lastFour: getPhoneLastFour(account.session.pendingPhone || account.profile.phone),
        })}
      </Text>
      {channel === 'sms' ? <Text style={styles.phone}>{maskedPhone}</Text> : null}
      <Text style={styles.testMode}>{t(channel === 'email' ? 'auth.sms.emailTestMode' : 'auth.sms.testMode')}</Text>

      <Card style={styles.card}>
        <OtpInput
          accessibilityLabel={t('auth.sms.codeLabel')}
          onChangeText={(value) => {
            setCode(value);
            if (error) setError(null);
          }}
          value={code}
        />
        <Button
          disabled={code.length !== 6 || isVerifying}
          loading={isVerifying}
          onPress={() => { void verify(); }}
          title={t('auth.sms.verify')}
        />
        {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
      </Card>
      <Pressable
        accessibilityRole="button"
        disabled={seconds > 0}
        onPress={() => {
          setSeconds(30);
          setCode('');
          setError(null);
          setNotice(t('auth.sms.resent'));
          void resendOtpCode(account.session.pendingPhone || account.profile.phone);
        }}
        style={styles.resendButton}
      >
        <Text style={[styles.resend, seconds > 0 && styles.resendDisabled]}>
          {seconds > 0
            ? t('auth.sms.resend', { time: `00:${String(seconds).padStart(2, '0')}` })
            : t('auth.sms.resendNow')}
        </Text>
      </Pressable>
      {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  icon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 62,
  },
  title: { color: colors.text, flexShrink: 1, fontSize: 30, fontWeight: '900', lineHeight: 38, marginTop: 22 },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 10 },
  phone: { color: colors.secondary, fontSize: 15, marginTop: 8 },
  testMode: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 8 },
  card: { gap: 22, marginTop: 30 },
  resend: { color: colors.primary, fontSize: 15, fontWeight: '700', textAlign: 'center', marginTop: 22 },
  resendButton: { minHeight: 44 },
  resendDisabled: { color: colors.textMuted },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center' },
  notice: { color: colors.success, fontSize: 13, textAlign: 'center' },
});
