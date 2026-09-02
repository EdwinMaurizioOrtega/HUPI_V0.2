import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { ThemedView as View } from '@/theme/ThemedView';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Pressable } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';

type AddressOptionFieldProps = {
  closeLabel: string;
  disabled?: boolean;
  hint?: string;
  label: string;
  onSelect: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  title: string;
  value: string;
};

export function AddressOptionField({
  closeLabel,
  disabled = false,
  hint,
  label,
  onSelect,
  options,
  placeholder,
  title,
  value,
}: AddressOptionFieldProps) {
  const [visible, setVisible] = useState(false);
  const { tokens } = useTheme();

  return (
    <View style={styles.wrapper}>
      <AppText style={{ color: tokens.text }} variant="label">{label}</AppText>
      <Pressable
        accessibilityHint={disabled ? hint : undefined}
        accessibilityLabel={`${label}: ${value || placeholder}`}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => setVisible(true)}
        style={[
          styles.field,
          {
            backgroundColor: tokens.input,
            borderColor: tokens.border,
            opacity: disabled ? 0.58 : 1,
          },
        ]}
      >
        <AppText
          numberOfLines={2}
          style={[styles.value, { color: value ? tokens.text : tokens.placeholder }]}
        >
          {value || placeholder}
        </AppText>
        <Ionicons color={tokens.textMuted} name="chevron-down" size={19} />
      </Pressable>
      {hint ? (
        <AppText style={{ color: tokens.textMuted }} variant="caption">{hint}</AppText>
      ) : null}

      <Modal
        animationType="slide"
        onRequestClose={() => setVisible(false)}
        presentationStyle="pageSheet"
        visible={visible}
      >
        <SafeAreaView
          edges={['top', 'bottom']}
          style={[styles.modal, { backgroundColor: tokens.background }]}
        >
          <View style={[styles.header, { borderBottomColor: tokens.border }]}>
            <AppText
              numberOfLines={2}
              style={[styles.title, { color: tokens.text }]}
              variant="h3"
            >
              {title}
            </AppText>
            <Pressable
              accessibilityLabel={closeLabel}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setVisible(false)}
              style={[styles.close, { backgroundColor: tokens.surfaceRaised }]}
            >
              <Ionicons color={tokens.text} name="close" size={22} />
            </Pressable>
          </View>
          <FlatList
            contentContainerStyle={styles.options}
            data={[...options]}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const selected = item === value;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                  style={[
                    styles.option,
                    {
                      backgroundColor: selected ? tokens.primarySoft : tokens.surface,
                      borderColor: selected ? tokens.primary : tokens.border,
                    },
                  ]}
                >
                  <AppText style={[styles.optionText, { color: tokens.text }]}>{item}</AppText>
                  {selected ? (
                    <Ionicons color={tokens.primary} name="checkmark-circle" size={21} />
                  ) : null}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 7 },
  field: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 14,
  },
  value: { flex: 1, minWidth: 0 },
  modal: { flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 68,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  title: { flex: 1, minWidth: 0 },
  close: {
    alignItems: 'center',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  options: { gap: 8, padding: 18, paddingBottom: 40 },
  option: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionText: { flex: 1, minWidth: 0 },
});
