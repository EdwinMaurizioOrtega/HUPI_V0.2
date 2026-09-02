import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  StyleSheet,
} from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { AppearanceSelectorModal } from '@/components/AppearanceSelectorModal';
import { Card } from '@/components/Card';
import { HupiSuccessModal } from '@/components/HupiSuccessModal';
import { HupiConfirmationModal } from '@/components/HupiConfirmationModal';
import { LanguageSelectorModal } from '@/components/LanguageSelectorModal';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import {
  setLocalLoggedIn,
} from '@/data/localAccountRepository';
import { isDevelopmentBundle } from '@/config/environment';
import { getCurrentLanguage } from '@/i18n';
import { Text } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';
import { useStartup } from '@/startup/StartupProvider';
import { useLocalQa } from '@/hooks/useLocalQa';

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [testMode, setTestMode] = useState(true);
  const [modal, setModal] = useState(false);
  const [languageModal, setLanguageModal] = useState(false);
  const [languageFeedback, setLanguageFeedback] = useState(false);
  const [appearanceModal, setAppearanceModal] = useState(false);
  const [appearanceFeedback, setAppearanceFeedback] = useState(false);
  const [resetConfirmationVisible, setResetConfirmationVisible] = useState(false);
  const { t } = useTranslation();
  const { appearance, tokens } = useTheme();
  const { resetWelcomeFlow } = useStartup();
  const qa = useLocalQa();
  const developmentOptionsVisible = isDevelopmentBundle();
  const appearanceLabelKey = ({
    system: 'settings.appearanceSystem',
    light: 'settings.appearanceLight',
    dark: 'settings.appearanceDark',
  } as const)[appearance];

  return (
    <ScreenContainer>
      <View style={styles.topbar}>
        <Pressable accessibilityLabel={t('accessibility.back')} onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={tokens.text} name="arrow-back" size={22} />
        </Pressable>
        <View style={styles.topbarCopy}>
          <Text style={styles.eyebrow}>{t('settings.eyebrow')}</Text>
          <Text style={styles.title}>{t('settings.title')}</Text>
        </View>
      </View>

      <Card style={styles.stack}>
        <Pressable
          accessibilityLabel={`${t('settings.language')}: ${t(getCurrentLanguage() === 'es' ? 'settings.spanish' : 'settings.english')}`}
          accessibilityRole="button"
          onPress={() => setLanguageModal(true)}
          style={styles.row}
        >
          <View style={styles.rowIcon}><Ionicons color={colors.secondary} name="language-outline" size={20} /></View>
          <View style={styles.languageCopy}>
            <Text style={styles.rowLabel}>{t('settings.language')}</Text>
            <Text style={styles.rowValue}>{t(getCurrentLanguage() === 'es' ? 'settings.spanish' : 'settings.english')}</Text>
          </View>
          <Ionicons color={colors.textMuted} name="chevron-forward" size={20} />
        </Pressable>
        <Pressable
          accessibilityHint={t('settings.selectAppearance')}
          accessibilityLabel={`${t('settings.appearance')}: ${t(appearanceLabelKey)}`}
          accessibilityRole="button"
          onPress={() => setAppearanceModal(true)}
          style={[styles.row, { borderBottomColor: tokens.border }]}
        >
          <View style={[styles.rowIcon, { backgroundColor: tokens.secondarySoft }]}>
            <Ionicons color={tokens.secondary} name="contrast-outline" size={20} />
          </View>
          <View style={styles.languageCopy}>
            <Text style={[styles.rowLabel, { color: tokens.text }]}>{t('settings.appearance')}</Text>
            <Text style={[styles.rowValue, { color: tokens.textMuted }]}>{t(appearanceLabelKey)}</Text>
          </View>
          <Ionicons color={tokens.textMuted} name="chevron-forward" size={20} />
        </Pressable>
        <SettingRow icon="notifications-outline" label={t('settings.notifications')} onToggle={() => setNotifications((value) => !value)} value={notifications} />
        <SettingRow icon="volume-medium-outline" label={t('settings.sound')} onToggle={() => setSound((value) => !value)} value={sound} />
        <SettingRow icon="flask-outline" label={t('settings.testMode')} onToggle={() => setTestMode((value) => !value)} value={testMode} />
      </Card>

      <Button icon="save-outline" onPress={() => setModal(true)} title={t('settings.save')} />
      {developmentOptionsVisible ? (
        <Card style={styles.developmentCard}>
          <Text style={[styles.developmentTitle, { color: tokens.text }]}>
            {t('settings.developmentOptions')}
          </Text>
          <Text style={[styles.developmentDescription, { color: tokens.textMuted }]}>
            {t('settings.developmentOptionsDescription')}
          </Text>
          <View style={[styles.activeQaProfile, { backgroundColor: tokens.secondarySoft }]}>
            <Text style={[styles.activeQaLabel, { color: tokens.textMuted }]}>{t('settings.activeQaProfile')}</Text>
            <Text style={[styles.activeQaValue, { color: tokens.secondary }]}>{t(`qaTools.profiles.${qa.activeProfileId}.name`)}</Text>
          </View>
          <Button
            icon="people-outline"
            onPress={() => router.push('/client/qa-profiles' as Href)}
            title={t('settings.changeQaProfile')}
            variant="outline"
          />
          <Button
            icon="shield-checkmark-outline"
            onPress={() => router.push('/client/qa-provider-verification' as Href)}
            title={t('settings.testProviderVerification')}
            variant="outline"
          />
          <Button
            icon="walk-outline"
            onPress={() => router.push('/client/qa-walk' as Href)}
            title={t('settings.controlQaWalk')}
            variant="outline"
          />
          <Button
            accessibilityHint={t('settings.resetWelcomeFlowHint')}
            icon="refresh-outline"
            onPress={() => setResetConfirmationVisible(true)}
            title={t('settings.resetWelcomeFlow')}
            variant="outline"
          />
        </Card>
      ) : null}
      <Button
        icon="log-out-outline"
        onPress={() => {
          setLocalLoggedIn(false);
          router.replace('/login');
        }}
        title={t('settings.signOut')}
        variant="ghost"
      />

      <HupiSuccessModal description={t('settings.savedDescription')} onClose={() => setModal(false)} title={t('settings.savedTitle')} visible={modal} />
      <HupiSuccessModal description={t('settings.updated')} onClose={() => setLanguageFeedback(false)} title={t('settings.appLanguage')} visible={languageFeedback} />
      <HupiSuccessModal
        description={t('settings.appearanceUpdated')}
        onClose={() => setAppearanceFeedback(false)}
        title={t('settings.appearance')}
        visible={appearanceFeedback}
      />
      <LanguageSelectorModal
        onClose={() => setLanguageModal(false)}
        onLanguageChanged={() => setLanguageFeedback(true)}
        visible={languageModal}
      />
      <AppearanceSelectorModal
        onAppearanceChanged={() => setAppearanceFeedback(true)}
        onClose={() => setAppearanceModal(false)}
        visible={appearanceModal}
      />
      <HupiConfirmationModal
        cancelLabel={t('common.cancel')}
        confirmLabel={t('settings.resetWelcomeConfirmAction')}
        message={t('settings.resetWelcomeConfirmMessage')}
        onCancel={() => setResetConfirmationVisible(false)}
        onConfirm={() => {
          setResetConfirmationVisible(false);
          resetWelcomeFlow();
        }}
        title={t('settings.resetWelcomeConfirmTitle')}
        visible={resetConfirmationVisible}
      />
    </ScreenContainer>
  );
}

function SettingRow({ icon, label, onToggle, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; onToggle: () => void; value: boolean }) {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={onToggle}
      style={[styles.row, { borderBottomColor: tokens.border }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: tokens.primarySoft }]}>
        <Ionicons color={tokens.primary} name={icon} size={20} />
      </View>
      <Text style={[styles.rowLabel, { color: tokens.text }]}>{label}</Text>
      <View
        style={[
          styles.toggle,
          { backgroundColor: value ? tokens.secondarySoft : tokens.soft },
        ]}
      >
        <Text style={[styles.toggleText, { color: value ? tokens.success : tokens.textMuted }]}>
          {t(value ? 'common.yes' : 'common.no')}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 6, marginBottom: 18 },
  topbarCopy: { flex: 1, minWidth: 0 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colors.text, flexShrink: 1, fontSize: 27, fontWeight: '900', lineHeight: 35, marginTop: 2, overflow: 'visible', paddingBottom: 2 },
  stack: { gap: 8, marginBottom: 18 },
  developmentCard: { gap: 8, marginBottom: 16 },
  developmentTitle: { fontSize: 17, lineHeight: 22 },
  developmentDescription: { fontSize: 13, lineHeight: 19, marginBottom: 4 },
  activeQaProfile: { borderRadius: 16, gap: 3, marginBottom: 2, padding: 12 },
  activeQaLabel: { fontSize: 12, fontWeight: '700' },
  activeQaValue: { fontSize: 15, fontWeight: '900', lineHeight: 21 },
  row: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '900' },
  languageCopy: { flex: 1 },
  rowValue: { color: colors.textMuted, fontSize: 13, fontWeight: '700', marginTop: 3 },
  toggle: { minWidth: 48, borderRadius: 999, backgroundColor: colors.soft, alignItems: 'center', paddingVertical: 7, paddingHorizontal: 10 },
  toggleOn: { backgroundColor: '#e7f5ef' },
  toggleText: { color: colors.textMuted, fontSize: 13, fontWeight: '900' },
  toggleTextOn: { color: colors.success },
});
