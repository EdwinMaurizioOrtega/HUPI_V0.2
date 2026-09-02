import { Modal, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { HUPI_STANDARD_WALK_TERMS } from '@/domain/providerWalkProfile';
import { Text } from '@/i18n/components';
import { ThemedView as View } from '@/theme/ThemedView';
import { useTheme } from '@/theme/ThemeProvider';

type ProviderTermsModalProps = {
  onClose: () => void;
  visible: boolean;
};

export function ProviderTermsModal({ onClose, visible }: ProviderTermsModalProps) {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const sections = [
    ['scope', t('providerProfile.standardTerms.scopeText')],
    ['safety', t('providerProfile.standardTerms.safetyText')],
    ['cancellations', t('providerProfile.standardTerms.cancellationsText')],
    ['payments', t('providerProfile.standardTerms.paymentsText')],
    ['acceptance', t('providerProfile.standardTerms.acceptanceText')],
  ] as const;

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={visible}>
      <SafeAreaView edges={['top', 'bottom']} style={[styles.safeArea, { backgroundColor: tokens.background }]}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('providerProfile.standardTerms.title')}</Text>
            <Text style={styles.version}>{t('providerProfile.termsDocument.version', { date: HUPI_STANDARD_WALK_TERMS.effectiveDate, version: HUPI_STANDARD_WALK_TERMS.version })}</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          {sections.map(([key, body], index) => (
            <View key={key} style={[styles.section, { backgroundColor: tokens.soft }]}>
              <Text style={styles.sectionTitle}>{index + 1}. {t(`providerProfile.standardTerms.sections.${key}`)}</Text>
              <Text style={styles.body}>{body}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.footer}><Button onPress={onClose} title={t('common.close')} /></View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  header: { borderBottomColor: colors.border, borderBottomWidth: 1, padding: 18 },
  headerCopy: { minWidth: 0 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 21, lineHeight: 28 },
  version: { color: colors.textMuted, fontFamily: fonts.light, fontSize: 12, marginTop: 5 },
  content: { gap: 16, padding: 18, paddingBottom: 32 },
  section: { backgroundColor: colors.soft, borderRadius: 17, padding: 14 },
  sectionTitle: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 15, lineHeight: 21 },
  body: { color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 21, marginTop: 6 },
  footer: { borderTopColor: colors.border, borderTopWidth: 1, padding: 16 },
});
