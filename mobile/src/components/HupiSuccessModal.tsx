import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { Modal,
  StyleSheet,
} from 'react-native';

import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { Text } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';

type HupiSuccessModalProps = {
  buttonLabel?: string;
  description: string;
  onClose: () => void;
  reference?: string;
  title: string;
  visible: boolean;
};

export function HupiSuccessModal({
  buttonLabel = 'Entendido',
  description,
  onClose,
  reference,
  title,
  visible,
}: HupiSuccessModalProps) {
  const { tokens } = useTheme();
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={[styles.overlay, { backgroundColor: tokens.overlay }]}>
        <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <View style={[styles.halo, { backgroundColor: tokens.primarySoft }]}>
            <View style={styles.icon}>
              <Ionicons color={colors.white} name="checkmark" size={30} />
            </View>
          </View>
          <Text style={[styles.title, { color: tokens.text }]}>{title}</Text>
          <Text style={[styles.description, { color: tokens.textMuted }]}>{description}</Text>
          {reference ? (
            <Text
              style={[
                styles.reference,
                { backgroundColor: tokens.secondarySoft, color: tokens.secondary },
              ]}
            >
              {reference}
            </Text>
          ) : null}
          <Button onPress={onClose} title={buttonLabel} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(51, 51, 51, 0.36)', padding: 22 },
  card: { width: '100%', maxWidth: 360, borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: 20, alignItems: 'stretch', gap: 12 },
  halo: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#eef9f3', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  icon: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 20, lineHeight: 28, textAlign: 'center' },
  description: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  reference: { borderRadius: 999, backgroundColor: colors.secondarySoft, color: colors.secondary, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 8, textAlign: 'center', alignSelf: 'center' },
});
