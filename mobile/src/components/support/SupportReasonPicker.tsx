import { Modal, Platform, ScrollView, StyleSheet } from 'react-native';
import React from 'react';
import { useTranslation } from '../../../node_modules/react-i18next';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { Pressable, Text } from '@/i18n/components';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useTheme } from '@/theme/ThemeProvider';
import { ThemedView as View } from '@/theme/ThemedView';

export type SupportReasonOption = {
  id: string;
  label: string;
};

type SupportReasonPickerProps = {
  error?: boolean;
  onChange: (id: string) => void;
  options: SupportReasonOption[];
  value: string | null;
};

export function SupportReasonPicker({ error = false, onChange, options, value }: SupportReasonPickerProps) {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const [visible, setVisible] = React.useState(false);
  const selected = options.find((option) => option.id === value);

  const choose = (id: string) => {
    onChange(id);
    setVisible(false);
  };

  return (
    <>
      <Pressable
        accessibilityLabel={selected?.label ?? t('supportReasonPicker.placeholder')}
        accessibilityRole="button"
        accessibilityState={{ expanded: visible }}
        onPress={() => setVisible(true)}
        style={[
          styles.field,
          { backgroundColor: tokens.input, borderColor: error ? tokens.danger : tokens.border },
        ]}
      >
        <Text style={[styles.value, !selected && styles.placeholder]}>
          {selected?.label ?? t('supportReasonPicker.placeholder')}
        </Text>
        <Ionicons color={error ? tokens.danger : tokens.textMuted} name="chevron-down" size={19} />
      </Pressable>

      <Modal animationType="slide" onRequestClose={() => setVisible(false)} transparent visible={visible}>
        <View style={[styles.overlay, { backgroundColor: tokens.overlay }]}>
          <Pressable accessibilityLabel={t('common.cancel')} onPress={() => setVisible(false)} style={StyleSheet.absoluteFill} />
          <View style={[styles.sheet, { backgroundColor: tokens.surfaceRaised }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: tokens.border }]}>
              <Pressable onPress={() => setVisible(false)} style={styles.headerAction}>
                <Text style={styles.cancel}>{t('common.cancel')}</Text>
              </Pressable>
              <Text style={styles.title}>{t('supportReasonPicker.title')}</Text>
              <View style={styles.headerAction} />
            </View>
            <ScrollView contentContainerStyle={styles.options} showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const active = option.id === value;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    key={option.id}
                    onPress={() => choose(option.id)}
                    style={[
                      styles.option,
                      { borderBottomColor: tokens.border },
                      active && { backgroundColor: tokens.secondarySoft },
                    ]}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{option.label}</Text>
                    <Ionicons
                      color={active ? colors.secondary : tokens.textMuted}
                      name={active ? 'checkmark-circle' : 'ellipse-outline'}
                      size={21}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
            {Platform.OS === 'ios' ? <Text style={styles.iosHint}>{t('supportReasonPicker.iosHint')}</Text> : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: { alignItems: 'center', borderRadius: 15, borderWidth: 1.5, flexDirection: 'row', minHeight: 54, paddingHorizontal: 14 },
  value: { color: colors.text, flex: 1, fontFamily: fonts.regular, fontSize: 15 },
  placeholder: { color: colors.textMuted },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '78%', overflow: 'hidden', paddingBottom: 12 },
  sheetHeader: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', minHeight: 56, paddingHorizontal: 14 },
  headerAction: { justifyContent: 'center', minHeight: 44, width: 74 },
  cancel: { color: colors.secondary, fontFamily: fonts.semiBold, fontSize: 14 },
  title: { color: colors.text, flex: 1, fontFamily: fonts.bold, fontSize: 16, textAlign: 'center' },
  options: { paddingBottom: 8 },
  option: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', gap: 12, minHeight: 54, paddingHorizontal: 18, paddingVertical: 10 },
  optionText: { color: colors.text, flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  optionTextActive: { color: colors.secondary, fontFamily: fonts.semiBold },
  iosHint: { color: colors.textMuted, fontFamily: fonts.light, fontSize: 11, paddingHorizontal: 18, paddingTop: 8, textAlign: 'center' },
});
