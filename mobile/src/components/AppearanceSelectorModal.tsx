import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { AccessibilityInfo,
  Modal,
  StyleSheet,
} from 'react-native';
import { useTranslation } from '../../node_modules/react-i18next';

import { fonts } from '@/constants/typography';
import { Pressable, Text } from '@/i18n/components';
import {
  appearancePreferences,
  type AppearancePreference,
} from '@/theme/appearance';
import { useTheme } from '@/theme/ThemeProvider';

type AppearanceSelectorModalProps = {
  onAppearanceChanged?: (appearance: AppearancePreference) => void;
  onClose: () => void;
  visible: boolean;
};

const optionConfig = {
  system: {
    description: 'settings.appearanceDevice',
    icon: 'phone-portrait-outline',
    label: 'settings.appearanceSystem',
  },
  light: {
    description: 'settings.appearanceLightDescription',
    icon: 'sunny-outline',
    label: 'settings.appearanceLight',
  },
  dark: {
    description: 'settings.appearanceDarkDescription',
    icon: 'moon-outline',
    label: 'settings.appearanceDark',
  },
} as const;

export function AppearanceSelectorModal({
  onAppearanceChanged,
  onClose,
  visible,
}: AppearanceSelectorModalProps) {
  const { t } = useTranslation();
  const { appearance, setAppearance, tokens } = useTheme();

  const selectAppearance = async (nextAppearance: AppearancePreference) => {
    if (nextAppearance !== appearance) {
      await setAppearance(nextAppearance);
      AccessibilityInfo.announceForAccessibility(t('settings.appearanceUpdated'));
      onAppearanceChanged?.(nextAppearance);
    }
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
          accessibilityLabel={t('settings.appearance')}
          accessibilityViewIsModal
          style={[styles.sheet, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
        >
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: tokens.secondarySoft }]}>
              <Ionicons color={tokens.secondary} name="contrast-outline" size={23} />
            </View>
            <View style={styles.headingCopy}>
              <Text style={[styles.title, { color: tokens.text }]}>{t('settings.appearance')}</Text>
              <Text style={[styles.subtitle, { color: tokens.textMuted }]}>
                {t('settings.selectAppearance')}
              </Text>
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

          <View style={styles.options} accessibilityRole="radiogroup">
            {appearancePreferences.map((option) => {
              const config = optionConfig[option];
              const selected = option === appearance;
              const label = t(config.label);
              return (
                <Pressable
                  accessibilityHint={t(config.description)}
                  accessibilityLabel={label}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, selected }}
                  key={option}
                  onPress={() => void selectAppearance(option)}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: selected ? tokens.primarySoft : tokens.surfaceRaised,
                      borderColor: selected ? tokens.primary : tokens.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.optionIcon, { backgroundColor: tokens.secondarySoft }]}>
                    <Ionicons color={tokens.secondary} name={config.icon} size={22} />
                  </View>
                  <View style={styles.optionCopy}>
                    <Text style={[styles.optionName, { color: tokens.text }]}>{label}</Text>
                    <Text style={[styles.optionDescription, { color: tokens.textMuted }]}>
                      {t(config.description)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.check,
                      {
                        backgroundColor: selected ? tokens.primary : 'transparent',
                        borderColor: selected ? tokens.primary : tokens.border,
                      },
                    ]}
                  >
                    {selected ? (
                      <Ionicons color={tokens.primaryContrast} name="checkmark" size={16} />
                    ) : null}
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
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    borderRadius: 26,
    borderWidth: 1,
    maxWidth: 440,
    padding: 22,
    width: '100%',
  },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  headerIcon: {
    alignItems: 'center',
    borderRadius: 15,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headingCopy: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 21, fontWeight: '900' },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, marginTop: 3 },
  closeButton: {
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  options: { gap: 11, marginTop: 22 },
  option: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: 'row',
    minHeight: 82,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  optionCopy: { flex: 1, paddingHorizontal: 12 },
  optionName: { fontFamily: fonts.semiBold, fontSize: 16, fontWeight: '800' },
  optionDescription: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, marginTop: 3 },
  check: {
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1.5,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  pressed: { opacity: 0.78 },
});

