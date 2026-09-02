import { StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Card } from '@/components/Card';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { Pressable, Text } from '@/i18n/components';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { ThemedView as View } from '@/theme/ThemedView';
import { ProviderTermsModal } from './ProviderTermsModal';

export function ProviderTermsAcceptanceBlock({
  checked,
  onChange,
  placement = 'embedded',
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  placement?: 'checkout' | 'embedded';
  provider?: unknown;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (placement !== 'checkout' && !checked) onChange(true);
  }, [checked, onChange, placement]);

  if (placement !== 'checkout') return null;

  return (
    <Card style={styles.card} tone="soft">
      <Text style={styles.title}>{t('providerProfile.acceptance.beforeContinue')}</Text>
      <Text style={styles.notice}>{t('providerProfile.acceptance.requiredNotice')}</Text>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={styles.row}
      >
        <Ionicons color={checked ? colors.primary : colors.textMuted} name={checked ? 'checkbox' : 'square-outline'} size={22} />
        <Text style={styles.label}>{t('providerProfile.acceptance.standardCheckbox')}</Text>
      </Pressable>
      <Pressable onPress={() => setVisible(true)} style={styles.linkButton}>
        <Text style={styles.link}>{t('providerProfile.acceptance.viewTerms')}</Text>
        <Ionicons color={colors.secondary} name="open-outline" size={16} />
      </Pressable>
      <ProviderTermsModal onClose={() => setVisible(false)} visible={visible} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 11, shadowOpacity: 0 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
  notice: { color: colors.primary, fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 20 },
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: 9 },
  label: { color: colors.text, flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  linkButton: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 6, minHeight: 34 },
  link: { color: colors.secondary, fontFamily: fonts.semiBold, fontSize: 13 },
});
