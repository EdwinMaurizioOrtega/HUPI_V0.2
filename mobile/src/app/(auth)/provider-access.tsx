import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HupiPagesLogo } from '@/components/HupiPagesLogo';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/i18n/components';
import { colors } from '@/constants/colors';

export default function ProviderAccessScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <HupiPagesLogo height={58} width={174} />
      <Text style={styles.eyebrow}>{t('providerOnboarding.workWithHupi')}</Text>
      <Text style={styles.title}>{t('providerOnboarding.hubTitle')}</Text>
      <Text style={styles.subtitle}>{t('providerOnboarding.hubSubtitle')}</Text>
      <Card style={styles.card} tone="purple">
        <Button
          icon="log-in-outline"
          onPress={() => router.push('/login?provider=1')}
          title={t('providerOnboarding.signIn')}
          variant="secondary"
        />
        <Button
          icon="person-add-outline"
          onPress={() => router.push('/provider-onboarding')}
          title={t('providerOnboarding.createAccount')}
        />
      </Card>
      <Button onPress={() => router.back()} title={t('common.back')} variant="ghost" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 36 },
  eyebrow: { color: colors.secondary, fontSize: 13, fontWeight: '900', letterSpacing: 1.2, marginTop: 48 },
  title: { color: colors.text, fontSize: 31, fontWeight: '900', lineHeight: 39, marginTop: 8 },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 10 },
  card: { gap: 12, marginVertical: 28, shadowOpacity: 0 },
});
