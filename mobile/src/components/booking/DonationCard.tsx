import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import {
  StyleSheet,
} from 'react-native';

import { Card } from '@/components/Card';
import { colors } from '@/constants/colors';
import { Text, TextInput } from '@/i18n/components';

export type DonationOption = 0 | 1 | 2 | 5 | 'other';

const options: DonationOption[] = [0, 1, 2, 5, 'other'];

type DonationCardProps = {
  value: DonationOption;
  customValue: string;
  onChange: (value: DonationOption) => void;
  onChangeCustomValue: (value: string) => void;
};

export function DonationCard({
  value,
  customValue,
  onChange,
  onChangeCustomValue,
}: DonationCardProps) {
  return (
    <Card style={styles.card} tone="purple">
      <View style={styles.heading}>
        <View style={styles.icon}><Ionicons color={colors.primary} name="heart" size={21} /></View>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>__hupi_i18n:components.DonationCard.supportHupiFoundation</Text>
            <Text style={styles.optional}>__hupi_i18n:common.optional</Text>
          </View>
          <Text style={styles.subtitle}>__hupi_i18n:components.DonationCard.withYourContributionWeHelpMorePetsInNeed</Text>
        </View>
      </View>

      <View style={styles.options}>
        {options.map((option) => {
          const active = value === option;
          const label = option === 'other' ? 'Otro' : `$${option}`;
          return (
            <Pressable
              key={String(option)}
              onPress={() => onChange(option)}
              style={[styles.option, active && styles.activeOption]}
            >
              <Text style={[styles.optionText, active && styles.activeOptionText]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {value === 'other' ? (
        <View style={styles.customInput}>
          <Text style={styles.currency}>$</Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={onChangeCustomValue}
            placeholder="0.00"
            placeholderTextColor="#aaa49f"
            style={styles.input}
            value={customValue}
          />
          <Text style={styles.mockLabel}>__hupi_i18n:common.contribution</Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, shadowOpacity: 0 },
  heading: { flexDirection: 'row', gap: 11, alignItems: 'center' },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '900' },
  optional: { color: colors.secondary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7 },
  subtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  options: { flexDirection: 'row', gap: 7, marginTop: 15 },
  option: { flex: 1, minHeight: 38, borderRadius: 12, borderWidth: 1, borderColor: '#dcd2eb', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  activeOption: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  optionText: { color: colors.secondary, fontSize: 13, fontWeight: '900' },
  activeOptionText: { color: colors.white },
  customInput: { minHeight: 46, borderRadius: 13, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 10 },
  currency: { color: colors.text, fontSize: 15, fontWeight: '900' },
  input: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '800', paddingHorizontal: 7 },
  mockLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
});
