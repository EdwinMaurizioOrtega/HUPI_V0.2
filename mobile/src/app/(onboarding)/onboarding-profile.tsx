import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  StyleSheet,
} from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { ProfilePhotoPicker } from '@/components/ProfilePhotoPicker';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import {
  saveLocalCustomerProfile,
  saveLocalProfileDraft,
} from '@/data/localAccountRepository';
import {
  getProfileFieldErrors,
  type CustomerProfile,
} from '@/domain/profile';
import { useLocalAccount } from '@/hooks/useLocalAccount';
import { Text } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';

export default function OnboardingProfileScreen() {
  const account = useLocalAccount();
  const router = useRouter();
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const [profile, setProfile] = useState<CustomerProfile>(() => ({ ...account.profile }));
  const [submitted, setSubmitted] = useState(false);
  const errors = getProfileFieldErrors(profile);
  const isComplete = Object.keys(errors).length === 0;

  useEffect(() => {
    saveLocalProfileDraft(profile);
  }, [profile]);

  const update = (key: keyof CustomerProfile, value: string | undefined) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const helper = (field: keyof typeof errors) => {
    if (!submitted || !errors[field]) return undefined;
    if (errors[field] === 'invalid') return t('onboarding.profile.errors.invalidEmail');
    return t('onboarding.profile.errors.required');
  };

  const continueToPermissions = () => {
    setSubmitted(true);
    if (!isComplete) return;
    saveLocalCustomerProfile(profile);
    router.replace('/permissions');
  };

  return (
    <ScreenContainer
      backgroundColor={tokens.background}
      contentContainerStyle={styles.content}
    >
      <View style={styles.stepRow}>
        <View style={styles.stepIcon}>
          <Ionicons color={colors.primary} name="person-outline" size={22} />
        </View>
        <Text style={styles.step}>{t('onboarding.profile.step')}</Text>
      </View>
      <Text style={styles.title}>{t('onboarding.profile.title')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.profile.subtitle')}</Text>

      <Card style={styles.photoCard}>
        <ProfilePhotoPicker
          imageUri={profile.profilePhotoUri}
          label={t('profile.photo.title')}
          onChange={(profilePhotoUri) => update('profilePhotoUri', profilePhotoUri)}
          size={78}
          type="owner"
        />
        <Text style={styles.optional}>{t('profile.photo.optional')}</Text>
      </Card>

      <View style={styles.form}>
        <Input
          accessibilityLabel={t('onboarding.profile.firstName')}
          autoCapitalize="words"
          hint={helper('firstName')}
          label={t('onboarding.profile.firstName')}
          onChangeText={(value) => update('firstName', value)}
          returnKeyType="next"
          value={profile.firstName}
        />
        <Input
          accessibilityLabel={t('onboarding.profile.lastName')}
          autoCapitalize="words"
          hint={helper('lastName')}
          label={t('onboarding.profile.lastName')}
          onChangeText={(value) => update('lastName', value)}
          returnKeyType="next"
          value={profile.lastName}
        />
        <Input
          accessibilityLabel={t('onboarding.profile.recoveryEmail')}
          autoCapitalize="none"
          autoComplete="email"
          hint={helper('email') ?? t('onboarding.profile.recoveryEmailHelp')}
          keyboardType="email-address"
          label={t('onboarding.profile.recoveryEmail')}
          onChangeText={(value) => update('email', value)}
          returnKeyType="done"
          value={profile.email}
        />
        <View style={styles.verifiedPhone}>
          <Ionicons color={colors.success} name="checkmark-circle" size={20} />
          <View style={styles.phoneCopy}>
            <Text style={styles.phoneLabel}>{t('onboarding.profile.verifiedPhone')}</Text>
            <Text style={styles.phone}>{profile.phone}</Text>
          </View>
        </View>
      </View>

      <Button
        accessibilityHint={isComplete ? t('onboarding.profile.continueHint') : t('onboarding.profile.incompleteHint')}
        disabled={!isComplete}
        onPress={continueToPermissions}
        title={t('common.continue')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 30 },
  stepRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  stepIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  step: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 29, fontWeight: '900', lineHeight: 35, marginTop: 22 },
  subtitle: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: 9 },
  photoCard: { gap: 8, marginTop: 24, shadowOpacity: 0 },
  optional: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, marginLeft: 91 },
  form: { gap: 15, marginBottom: 22, marginTop: 22 },
  verifiedPhone: {
    alignItems: 'center',
    backgroundColor: colors.soft,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 11,
    minHeight: 58,
    paddingHorizontal: 14,
  },
  phoneCopy: { flex: 1 },
  phoneLabel: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12 },
  phone: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '800', marginTop: 2 },
});
