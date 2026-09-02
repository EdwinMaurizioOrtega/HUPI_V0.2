import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useEffect,
  useState } from 'react';
import {
  AccessibilityInfo,
  Modal,
  StyleSheet,
} from 'react-native';
import { useTranslation } from '../../node_modules/react-i18next';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { Pressable, Text } from '@/i18n/components';
import {
  changeAppLanguage,
  getCurrentLanguage,
  supportedLanguages,
  type SupportedLanguage,
} from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

type LanguageSelectorModalProps = {
  visible: boolean;
  onClose: () => void;
  onLanguageChanged?: (language: SupportedLanguage) => void;
};

const optionKeys = {
  es: {
    name: 'settings.spanish',
    description: 'settings.spanishDescription',
  },
  en: {
    name: 'settings.english',
    description: 'settings.englishDescription',
  },
} as const;

export function LanguageSelectorModal({
  visible,
  onClose,
  onLanguageChanged,
}: LanguageSelectorModalProps) {
  const { i18n, t } = useTranslation();
  const { tokens } = useTheme();
  const [saving, setSaving] = useState<SupportedLanguage | null>(null);
  const selectedLanguage = getCurrentLanguage();

  useEffect(() => {
    if (!visible) {
      setSaving(null);
    }
  }, [visible]);

  const selectLanguage = async (language: SupportedLanguage) => {
    if (saving) {
      return;
    }
    if (language === selectedLanguage) {
      onClose();
      return;
    }

    setSaving(language);
    await changeAppLanguage(language);
    const feedback = i18n.t('settings.updated');
    AccessibilityInfo.announceForAccessibility(feedback);
    onLanguageChanged?.(language);
    setSaving(null);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={[styles.backdrop, { backgroundColor: tokens.overlay }]}>
        <Pressable
          accessibilityLabel={t('accessibility.close')}
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={[styles.sheet, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
        >
          <View style={styles.header}>
            <View style={styles.heading}>
              <View style={styles.globe}>
                <Ionicons color={colors.secondary} name="language-outline" size={22} />
              </View>
              <View style={styles.headingCopy}>
                <Text style={[styles.title, { color: tokens.text }]}>{t('settings.appLanguage')}</Text>
                <Text style={[styles.subtitle, { color: tokens.textMuted }]}>{t('settings.selectLanguage')}</Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel={t('accessibility.close')}
              accessibilityRole="button"
              hitSlop={10}
              onPress={onClose}
              style={[styles.closeButton, { borderColor: tokens.border }]}
            >
              <Ionicons color={tokens.text} name="close" size={21} />
            </Pressable>
          </View>

          <View style={styles.options}>
            {supportedLanguages.map((language) => {
              const selected = language === selectedLanguage;
              const keys = optionKeys[language];
              const name = t(keys.name);
              return (
                <Pressable
                  accessibilityHint={selected ? t('settings.selected', { language: name }) : undefined}
                  accessibilityLabel={selected
                    ? t('settings.selected', { language: name })
                    : t('settings.choose', { language: name })}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, disabled: Boolean(saving) }}
                  disabled={Boolean(saving)}
                  key={language}
                  onPress={() => void selectLanguage(language)}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: selected ? tokens.primarySoft : tokens.surfaceRaised,
                      borderColor: selected ? tokens.primary : tokens.border,
                    },
                    pressed && styles.optionPressed,
                  ]}
                >
                  <View style={styles.optionCopy}>
                    <Text style={[styles.optionName, { color: tokens.text }]}>{name}</Text>
                    <Text style={[styles.optionDescription, { color: tokens.textMuted }]}>{t(keys.description)}</Text>
                  </View>
                  <View style={[
                    styles.check,
                    {
                      backgroundColor: selected ? tokens.primary : 'transparent',
                      borderColor: selected ? tokens.primary : tokens.border,
                    },
                  ]}>
                    {selected ? <Ionicons color={tokens.primaryContrast} name="checkmark" size={16} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(24, 19, 27, 0.58)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    borderWidth: 1,
    borderRadius: 26,
    maxWidth: 440,
    padding: 22,
    width: '100%',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heading: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  headingCopy: { flex: 1 },
  globe: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: 15,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 21,
    fontWeight: '900',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    marginLeft: 10,
    width: 38,
  },
  options: { gap: 12, marginTop: 22 },
  option: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: 'row',
    minHeight: 84,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  optionPressed: { opacity: 0.78 },
  optionCopy: { flex: 1, paddingRight: 12 },
  optionName: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    fontWeight: '800',
  },
  optionDescription: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  check: {
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1.5,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
});
