import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { StyleSheet } from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Card } from '@/components/Card';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { getHupiStandardWalkCancellationPolicy } from '@/domain/providerCancellationPolicy';
import { Text } from '@/i18n/components';

export function PolicySummaryCard() {
  const { t } = useTranslation();
  const policy = getHupiStandardWalkCancellationPolicy(t as unknown as (key: string) => string);

  return (
    <Card style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.icon}><Ionicons color={colors.white} name="document-text-outline" size={20} /></View>
        <View style={styles.headingCopy}>
          <Text style={styles.title}>{policy.title}</Text>
          <Text style={styles.subtitle}>{policy.subtitle}</Text>
        </View>
      </View>
      <Text style={styles.policyText}>{policy.customerSummary}</Text>

      <View style={styles.options}>
        <View style={styles.option}>
          <Ionicons color={colors.white} name="return-down-back-outline" size={14} />
          <Text style={styles.optionText}>{policy.refundLabel}</Text>
        </View>
        <View style={styles.option}>
          <Ionicons color={colors.white} name="wallet-outline" size={14} />
          <Text style={styles.optionText}>{policy.balanceLabel}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.secondary, borderColor: colors.secondary, padding: 16, shadowOpacity: 0 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headingCopy: { flex: 1, minWidth: 0 },
  icon: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.white, flexShrink: 1, fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
  subtitle: { color: 'rgba(255,255,255,0.76)', fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 2 },
  policyText: { color: colors.white, fontFamily: fonts.regular, fontSize: 13, lineHeight: 21, marginTop: 14 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
  option: { borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.14)', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, minHeight: 34 },
  optionText: { color: colors.white, fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 17 },
});
