import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
} from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HupiSuccessModal } from '@/components/HupiSuccessModal';
import { Input } from '@/components/Input';
import { ProfilePhotoPicker } from '@/components/ProfilePhotoPicker';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { saveLocalCustomerProfile } from '@/data/localAccountRepository';
import { getProfileFieldErrors } from '@/domain/profile';
import { useLocalAccount } from '@/hooks/useLocalAccount';
import { fonts } from '@/constants/typography';
import { Text } from '@/i18n/components';
import { validatePasswordChange, HUPI_PASSWORD_MIN_LENGTH } from '@/domain/passwordPolicy';
import { useTheme } from '@/theme/ThemeProvider';

type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';

const emptyPasswords = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile: savedProfile } = useLocalAccount();
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const [profile, setProfile] = useState(() => ({ ...savedProfile }));
  const [saved, setSaved] = useState<{ title: string; description: string } | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwords, setPasswords] = useState(emptyPasswords);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<PasswordField, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  const update = (key: keyof typeof profile, value: string | undefined) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const save = () => {
    setSubmitted(true);
    if (Object.keys(getProfileFieldErrors(profile)).length > 0) return;
    saveLocalCustomerProfile(profile);
    setSaved(photoChanged
      ? {
        title: t('profile.photo.updatedTitle'),
        description: t('profile.photo.updatedDescription'),
      }
      : {
        title: t('profile.edit.updatedTitle'),
        description: t('profile.edit.updatedDescription'),
      });
    setPhotoChanged(false);
  };

  const closePasswordModal = () => {
    setPasswordModalVisible(false);
    setPasswords(emptyPasswords);
    setPasswordError(null);
  };

  const updatePassword = (key: PasswordField, value: string) => {
    setPasswords((current) => ({ ...current, [key]: value }));
    setPasswordError(null);
  };

  const submitPasswordChange = () => {
    const error = validatePasswordChange(passwords);
    if (error) {
      setPasswordError(t(`profile.password.errors.${error}`, { count: HUPI_PASSWORD_MIN_LENGTH }));
      return;
    }
    closePasswordModal();
    setPasswordUpdated(true);
  };

  const renderPasswordField = (key: PasswordField, label: string, autoComplete: 'current-password' | 'new-password') => (
    <Input
      autoCapitalize="none"
      autoComplete={autoComplete}
      autoCorrect={false}
      label={label}
      onChangeText={(value) => updatePassword(key, value)}
      rightAccessory={(
        <Pressable
          accessibilityLabel={t(visiblePasswords[key] ? 'profile.password.hide' : 'profile.password.show', { field: label })}
          accessibilityRole="button"
          onPress={() => setVisiblePasswords((current) => ({ ...current, [key]: !current[key] }))}
          style={styles.passwordVisibility}
        >
          <Ionicons color={tokens.textMuted} name={visiblePasswords[key] ? 'eye-off-outline' : 'eye-outline'} size={21} />
        </Pressable>
      )}
      secureTextEntry={!visiblePasswords[key]}
      value={passwords[key]}
    />
  );

  return (
    <ScreenContainer>
      <View style={styles.topbar}>
        <Pressable accessibilityLabel="__hupi_i18n:common.back" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={colors.text} name="arrow-back" size={22} />
        </Pressable>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>__hupi_i18n:common.customerProfile</Text>
          <Text style={styles.title}>__hupi_i18n:common.editProfile</Text>
        </View>
      </View>

      <Card style={styles.avatarCard} tone="coral">
        <ProfilePhotoPicker
          imageUri={profile.profilePhotoUri}
          label="__hupi_i18n:common.profilePhoto"
          onChange={(profilePhotoUri) => {
            update('profilePhotoUri', profilePhotoUri);
            setPhotoChanged(true);
          }}
          size={70}
          type="owner"
        />
      </Card>

      <View style={styles.form}>
        <Input
          hint={submitted && !profile.firstName.trim() ? t('onboarding.profile.errors.required') : undefined}
          label={t('onboarding.profile.firstName')}
          onChangeText={(value) => update('firstName', value)}
          value={profile.firstName}
        />
        <Input
          hint={submitted && !profile.lastName.trim() ? t('onboarding.profile.errors.required') : undefined}
          label={t('onboarding.profile.lastName')}
          onChangeText={(value) => update('lastName', value)}
          value={profile.lastName}
        />
        <Input
          editable={false}
          keyboardType="phone-pad"
          label={t('onboarding.profile.verifiedPhone')}
          value={profile.phone}
        />
        <Input
          autoCapitalize="none"
          hint={submitted && getProfileFieldErrors(profile).email
            ? t(`onboarding.profile.errors.${getProfileFieldErrors(profile).email === 'invalid' ? 'invalidEmail' : 'required'}`)
            : t('onboarding.profile.recoveryEmailHelp')}
          keyboardType="email-address"
          label={t('onboarding.profile.recoveryEmail')}
          onChangeText={(value) => update('email', value)}
          value={profile.email}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setPasswordModalVisible(true)}
        style={[styles.passwordAction, { backgroundColor: tokens.secondarySoft, borderColor: tokens.border }]}
      >
        <View style={[styles.passwordActionIcon, { backgroundColor: tokens.surfaceRaised }]}>
          <Ionicons color={tokens.secondary} name="key-outline" size={21} />
        </View>
        <Text style={[styles.passwordActionText, { color: tokens.secondary }]}>{t('profile.password.action')}</Text>
        <Ionicons color={tokens.secondary} name="chevron-forward" size={20} />
      </Pressable>

      <Button icon="save-outline" onPress={save} title="__hupi_i18n:common.saveChanges" />
      <HupiSuccessModal
        description={saved?.description ?? ''}
        onClose={() => setSaved(null)}
        title={saved?.title ?? ''}
        visible={Boolean(saved)}
      />
      <Modal animationType="fade" onRequestClose={closePasswordModal} transparent visible={passwordModalVisible}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalOverlay, { backgroundColor: tokens.overlay }]}
        >
          <View style={[styles.passwordModal, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={styles.passwordModalHeader}>
              <View style={styles.passwordModalCopy}>
                <Text style={[styles.passwordModalTitle, { color: tokens.text }]}>{t('profile.password.title')}</Text>
                <Text style={[styles.passwordModalDescription, { color: tokens.textMuted }]}>
                  {t('profile.password.minimum', { count: HUPI_PASSWORD_MIN_LENGTH })}
                </Text>
              </View>
              <Pressable accessibilityLabel={t('common.close')} onPress={closePasswordModal} style={[styles.closeButton, { backgroundColor: tokens.soft }]}>
                <Ionicons color={tokens.text} name="close" size={20} />
              </Pressable>
            </View>
            {renderPasswordField('currentPassword', t('profile.password.current'), 'current-password')}
            {renderPasswordField('newPassword', t('profile.password.new'), 'new-password')}
            {renderPasswordField('confirmPassword', t('profile.password.confirm'), 'new-password')}
            {passwordError ? <Text accessibilityLiveRegion="polite" style={[styles.passwordError, { color: tokens.danger }]}>{passwordError}</Text> : null}
            <View style={styles.passwordActions}>
              <Button onPress={closePasswordModal} style={styles.passwordButton} title={t('common.cancel')} variant="outline" />
              <Button onPress={submitPasswordChange} style={styles.passwordButton} title={t('profile.password.save')} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <HupiSuccessModal
        description={t('profile.password.updatedDescription')}
        onClose={() => setPasswordUpdated(false)}
        title={t('profile.password.updated')}
        visible={passwordUpdated}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 6, marginBottom: 18, overflow: 'visible' },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 0, overflow: 'visible', paddingBottom: 3 },
  eyebrow: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 27, lineHeight: 35, fontWeight: '900', marginTop: 3, overflow: 'visible', paddingBottom: 2 },
  avatarCard: { marginBottom: 18 },
  form: { gap: 14, marginBottom: 18 },
  passwordAction: { alignItems: 'center', borderRadius: 17, borderWidth: 1, flexDirection: 'row', gap: 11, marginBottom: 18, minHeight: 58, paddingHorizontal: 13 },
  passwordActionIcon: { alignItems: 'center', borderRadius: 12, height: 38, justifyContent: 'center', width: 38 },
  passwordActionText: { flex: 1, fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 21 },
  modalOverlay: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 22 },
  passwordModal: { borderRadius: 24, borderWidth: 1, gap: 15, maxWidth: 420, padding: 20, width: '100%' },
  passwordModalHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  passwordModalCopy: { flex: 1, minWidth: 0 },
  passwordModalTitle: { fontFamily: fonts.bold, fontSize: 21, lineHeight: 28 },
  passwordModalDescription: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 4 },
  closeButton: { alignItems: 'center', borderRadius: 12, height: 38, justifyContent: 'center', width: 38 },
  passwordVisibility: { alignItems: 'center', height: 44, justifyContent: 'center', width: 36 },
  passwordError: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19 },
  passwordActions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  passwordButton: { flex: 1 },
});
