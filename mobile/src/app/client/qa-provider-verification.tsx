import { Redirect, type Href, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { isDevelopmentBundle } from '@/config/environment';
import { colors } from '@/constants/colors';
import { resetQaProviderVerification, setQaVerificationStep } from '@/data/localQaRepository';
import { QA_VERIFICATION_STEPS } from '@/domain/qaTools';
import { useLocalQa } from '@/hooks/useLocalQa';
import { Text } from '@/i18n/components';
import { ThemedView as View } from '@/theme/ThemedView';

export default function QaProviderVerificationScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const qa = useLocalQa();

  if (!isDevelopmentBundle()) return <Redirect href="/home" />;

  const openStep = (step: number) => {
    setQaVerificationStep(step);
    router.push(`/provider/verification?qaStep=${step}` as Href);
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <PageHeader eyebrow={t('qaTools.localOnly')} onBack={() => router.back()} subtitle={t('qaTools.verificationSubtitle')} title={t('qaTools.verificationTitle')} />
      <Card style={styles.currentCard} tone="purple">
        <Text style={styles.currentText}>{t('qaTools.currentStep', { step: qa.currentStep })}</Text>
        <Button icon="play-forward-outline" onPress={() => openStep(qa.currentStep)} title={t('qaTools.continuePending')} />
      </Card>
      <Button
        icon="refresh-outline"
        onPress={() => {
          resetQaProviderVerification();
          router.push('/provider/verification?qaStep=1' as Href);
        }}
        title={t('qaTools.resetVerification')}
        variant="outline"
      />
      <View style={styles.stepList}>
        {QA_VERIFICATION_STEPS.map((step) => (
          <Card key={step.number} style={styles.stepCard}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{step.number}</Text></View>
            <View style={styles.stepCopy}>
              <Text style={styles.stepName}>{t(step.labelKey)}</Text>
              <Button onPress={() => openStep(step.number)} style={styles.stepButton} title={t('qaTools.goToStep', { step: step.number })} variant="ghost" />
            </View>
          </Card>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 42, paddingTop: 8 },
  currentCard: { gap: 10, shadowOpacity: 0 },
  currentText: { color: colors.secondary, fontSize: 15, fontWeight: '900' },
  stepList: { gap: 9 },
  stepCard: { alignItems: 'center', flexDirection: 'row', gap: 12, shadowOpacity: 0.02 },
  stepNumber: { alignItems: 'center', backgroundColor: colors.secondarySoft, borderRadius: 16, height: 48, justifyContent: 'center', width: 48 },
  stepNumberText: { color: colors.secondary, fontSize: 19, fontWeight: '900' },
  stepCopy: { flex: 1, gap: 8, minWidth: 0 },
  stepName: { color: colors.text, fontSize: 15, fontWeight: '900' },
  stepButton: { minHeight: 42 },
});
