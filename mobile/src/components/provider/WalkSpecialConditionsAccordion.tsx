import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { fonts } from '@/constants/typography';
import { getSpecialWalkConditions } from '@/domain/providerCancellationPolicy';
import { Pressable, Text } from '@/i18n/components';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { ThemedView as View } from '@/theme/ThemedView';
import { useTheme } from '@/theme/ThemeProvider';

export function WalkSpecialConditionsAccordion() {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const translate = t as unknown as (key: string) => string;
  const conditions = getSpecialWalkConditions(translate);
  const title = t('providerProfile.cancellation.customerSpecialConditions');

  return (
    <View style={[styles.container, { borderColor: tokens.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}
        style={[styles.header, { backgroundColor: tokens.soft }]}
      >
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: tokens.text }]}>{title}</Text>
          <Text style={[styles.helper, { color: tokens.textMuted }]}>{t('providerProfile.cancellation.specialSituations')}</Text>
        </View>
        <Ionicons color={tokens.secondary} name={expanded ? 'chevron-up' : 'chevron-down'} size={20} />
      </Pressable>
      {expanded ? (
        <View style={styles.list}>
          {conditions.map((condition, index) => (
            <View key={condition.id} style={[styles.item, index > 0 && { borderTopColor: tokens.border, borderTopWidth: 1 }]}>
              <View style={[styles.bullet, { backgroundColor: tokens.secondarySoft }]}>
                <Ionicons color={tokens.secondary} name="information-circle-outline" size={17} />
              </View>
              <View style={styles.itemCopy}>
                <Text style={[styles.itemTitle, { color: tokens.secondary }]}>{condition.title}</Text>
                <Text style={[styles.description, { color: tokens.textMuted }]}>{condition.description}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 17, borderWidth: 1, overflow: 'hidden' },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 62, paddingHorizontal: 14, paddingVertical: 12 },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 21 },
  helper: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 2 },
  list: { paddingHorizontal: 14 },
  item: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, paddingVertical: 13 },
  bullet: { alignItems: 'center', borderRadius: 12, height: 34, justifyContent: 'center', width: 34 },
  itemCopy: { flex: 1, minWidth: 0 },
  itemTitle: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 20 },
  description: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, marginTop: 3 },
});
