import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from '../../node_modules/react-i18next';

import { AppText } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';

type HupiConfirmationModalProps = {
  cancelLabel: string;
  confirmLabel: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
};

export function HupiConfirmationModal({
  cancelLabel,
  confirmLabel,
  message,
  onCancel,
  onConfirm,
  title,
  visible,
}: HupiConfirmationModalProps) {
  useTranslation();
  const { tokens } = useTheme();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <View style={[styles.overlay, { backgroundColor: tokens.overlay }]}>
        <View
          accessibilityLabel={title}
          accessibilityRole="alert"
          style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
        >
          <AppText style={[styles.title, { color: tokens.text }]} variant="h3">
            {title}
          </AppText>
          <AppText style={[styles.message, { color: tokens.textMuted }]}>
            {message}
          </AppText>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={[styles.button, { backgroundColor: tokens.soft }]}
            >
              <AppText style={{ color: tokens.text }} variant="button">
                {cancelLabel}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={[styles.button, { backgroundColor: tokens.primary }]}
            >
              <AppText style={{ color: tokens.primaryContrast }} variant="button">
                {confirmLabel}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    maxWidth: 420,
    padding: 20,
    width: '100%',
  },
  title: { flexShrink: 1 },
  message: { lineHeight: 21, marginTop: 8 },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  button: {
    alignItems: 'center',
    borderRadius: 15,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
  },
});
