import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HupiSuccessModal } from '@/components/HupiSuccessModal';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { Text } from '@/i18n/components';

const sections = [
  { icon: 'lock-closed-outline' as const, title: 'Protección de datos', text: 'Tus datos personales y de mascotas se protegen dentro de Hupi.' },
  { icon: 'phone-portrait-outline' as const, title: 'Permisos', text: 'Los permisos de ubicación, fotos y notificaciones se conectarán cuando exista integración real.' },
  { icon: 'shield-checkmark-outline' as const, title: 'Seguridad de cuenta', text: 'El teléfono es obligatorio y se valida por SMS en el flujo de acceso.' },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <ScreenContainer>
      <Header onBack={() => router.back()} title="__hupi_i18n:app.profile.privacyAndSecurity" />
      <View style={styles.stack}>
        {sections.map((section) => (
          <Card key={section.title} style={styles.card}>
            <View style={styles.icon}><Ionicons color={colors.secondary} name={section.icon} size={20} /></View>
            <View style={styles.copy}>
              <Text style={styles.cardTitle}>{section.title}</Text>
              <Text style={styles.cardText}>{section.text}</Text>
            </View>
          </Card>
        ))}
      </View>
      <Card style={styles.deleteCard} tone="coral">
        <Text style={styles.deleteTitle}>__hupi_i18n:common.deleteAccount</Text>
        <Text style={styles.deleteText}>__hupi_i18n:app.privacy.visualActionForFuturePrivacyOperationDoesNotDelete</Text>
        <Button onPress={() => setModalVisible(true)} title="__hupi_i18n:app.privacy.requestDeletion" variant="outline" />
      </Card>
      <HupiSuccessModal
        description="__hupi_i18n:app.privacy.weRegisterALocalTestRequestNoRealAccount"
        onClose={() => setModalVisible(false)}
        title="__hupi_i18n:app.privacy.registeredRequest"
        visible={modalVisible}
      />
    </ScreenContainer>
  );
}

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={styles.topbar}>
      <Pressable accessibilityLabel="__hupi_i18n:common.back" onPress={onBack} style={styles.backButton}>
        <Ionicons color={colors.text} name="arrow-back" size={22} />
      </Pressable>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>__hupi_i18n:common.account</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 6, marginBottom: 18, overflow: 'visible' },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 0, overflow: 'visible', paddingBottom: 3 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colors.text, flexShrink: 1, fontSize: 25, lineHeight: 33, fontWeight: '900', marginTop: 3, overflow: 'visible', paddingBottom: 2 },
  stack: { gap: 12 },
  card: { flexDirection: 'row', gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.secondarySoft, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  cardText: { color: colors.textMuted, fontSize: 13, lineHeight: 22, marginTop: 5, fontWeight: '700' },
  deleteCard: { gap: 10, marginTop: 18 },
  deleteTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  deleteText: { color: colors.textMuted, fontSize: 13, lineHeight: 22, fontWeight: '700' },
});
