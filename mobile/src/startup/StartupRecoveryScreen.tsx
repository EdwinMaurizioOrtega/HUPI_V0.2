import { getLocales } from 'expo-localization';
import { useTranslation } from '../../node_modules/react-i18next';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { AppButton } from '@/components/Button';
import { HupiPagesLogo } from '@/components/HupiPagesLogo';
import { ScreenContainer } from '@/components/ScreenContainer';
import { i18n } from '@/i18n';
import { AppText } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';

type StartupRecoveryScreenProps = {
  onRetry: () => void;
};

export function StartupRecoveryScreen({ onRetry }: StartupRecoveryScreenProps) {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const useEnglishFallback = getLocales()[0]?.languageCode === 'en';
  const title = i18n.isInitialized
    ? t('startup.couldNotStart')
    : useEnglishFallback
      ? 'We couldn’t start Hupi.'
      : 'No pudimos iniciar Hupi.';
  const description = i18n.isInitialized
    ? t('startup.tryAgain')
    : useEnglishFallback
      ? 'Try again.'
      : 'Inténtalo nuevamente.';
  const retryLabel = i18n.isInitialized
    ? t('startup.retry')
    : useEnglishFallback
      ? 'Try again'
      : 'Reintentar';

  return (
    <ScreenContainer contentContainerStyle={styles.content} scroll={false}>
      <HupiPagesLogo height={72} width={216} />
      <AppText style={[styles.title, { color: tokens.text }]} variant="h2">
        {title}
      </AppText>
      <AppText style={[styles.description, { color: tokens.textMuted }]}>
        {description}
      </AppText>
      <AppButton
        accessibilityHint={description}
        icon="refresh-outline"
        onPress={onRetry}
        style={styles.button}
        title={retryLabel}
      />
    </ScreenContainer>
  );
}

export function StartupLoadingScreen() {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const loadingLabel = i18n.isInitialized
    ? t('common.loading')
    : getLocales()[0]?.languageCode === 'en'
      ? 'Loading…'
      : 'Cargando…';

  return (
    <ScreenContainer contentContainerStyle={styles.content} scroll={false}>
      <HupiPagesLogo height={66} width={198} />
      <ActivityIndicator color={tokens.primary} size="small" />
      <AppText style={{ color: tokens.textMuted }} variant="caption">
        {loadingLabel}
      </AppText>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  button: { marginTop: 12, width: '100%' },
  content: {
    alignItems: 'center',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  description: { textAlign: 'center' },
  title: { marginTop: 14, textAlign: 'center' },
});
