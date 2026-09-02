import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import React from 'react';
import { Modal,
  StyleSheet,
  type TextInputProps,
} from 'react-native';

import { colors } from '@/constants/colors';
import { mockCountryCodes } from '@/constants/mockData';
import { theme } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import { Pressable, Text, TextInput } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';

type PhoneCountryInputProps = Omit<TextInputProps, 'keyboardType' | 'value' | 'onChangeText'> & {
  countryCode: string;
  countryLocked?: boolean;
  label?: string;
  onCountryChange: (countryCode: string) => void;
  onPhoneChange: (phone: string) => void;
  phone: string;
};

const countryFlags: Record<string, string> = {
  '+593': '🇪🇨',
  '+57': '🇨🇴',
  '+51': '🇵🇪',
  '+1': '🇺🇸',
  '+52': '🇲🇽',
  '+56': '🇨🇱',
  '+54': '🇦🇷',
  '+34': '🇪🇸',
};

export function PhoneCountryInput({
  countryCode,
  countryLocked = false,
  label = 'Teléfono',
  onCountryChange,
  onPhoneChange,
  phone,
  placeholder = '98 837 3677',
  style,
  ...props
}: PhoneCountryInputProps) {
  const { tokens } = useTheme();
  const [modalOpen, setModalOpen] = React.useState(false);
  const selectedCountry = mockCountryCodes.find((item) => item.code === countryCode) ?? mockCountryCodes[0];

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[styles.shell, { backgroundColor: tokens.input, borderColor: tokens.border }]}
      >
        <Pressable disabled={countryLocked} onPress={() => setModalOpen(true)} style={styles.country}>
          <Text style={styles.flag}>{countryFlags[selectedCountry.code] ?? '🌎'}</Text>
          <Text style={styles.code}>{selectedCountry.code}</Text>
          {countryLocked ? null : <Ionicons color={tokens.textMuted} name="chevron-down" size={15} />}
        </Pressable>
        <View style={[styles.divider, { backgroundColor: tokens.border }]} />
        <TextInput
          keyboardType="phone-pad"
          onChangeText={onPhoneChange}
          placeholder={placeholder}
          placeholderTextColor={tokens.placeholder}
          style={[styles.input, { color: tokens.text }, style]}
          value={phone}
          {...props}
        />
      </View>

      <Modal animationType="fade" onRequestClose={() => setModalOpen(false)} transparent visible={modalOpen}>
        <View style={[styles.overlay, { backgroundColor: tokens.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: tokens.surface }]}>
            <Text style={styles.modalTitle}>__hupi_i18n:components.PhoneCountryInput.selectTheCountry</Text>
            {mockCountryCodes.map((country) => (
              <Pressable
                key={country.code}
                onPress={() => {
                  onCountryChange(country.code);
                  setModalOpen(false);
                }}
                style={[styles.countryOption, { borderBottomColor: tokens.border }]}
              >
                <Text style={styles.flag}>{countryFlags[country.code] ?? '🌎'}</Text>
                <Text style={styles.countryName}>{country.country}</Text>
                <Text style={styles.countryCode}>{country.code}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setModalOpen(false)} style={styles.cancelButton}>
              <Text style={styles.cancelText}>__hupi_i18n:common.cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 7 },
  label: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 15, fontWeight: '700' },
  shell: {
    minHeight: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
  },
  country: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13 },
  flag: { fontSize: 20 },
  code: { color: colors.text, fontFamily: fonts.semiBold, fontWeight: '700' },
  divider: { height: 26, width: 1, backgroundColor: colors.border },
  input: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15, paddingHorizontal: 13 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(51, 51, 51, 0.36)' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.white, padding: 18, gap: 8 },
  modalTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 18, fontWeight: '900', marginBottom: 4 },
  countryOption: { minHeight: 48, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10 },
  countryName: { flex: 1, color: colors.text, fontFamily: fonts.semiBold, fontSize: 15, fontWeight: '800' },
  countryCode: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  cancelButton: { minHeight: 48, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  cancelText: { color: colors.white, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
});
