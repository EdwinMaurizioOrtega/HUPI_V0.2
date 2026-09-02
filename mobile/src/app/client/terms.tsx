import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { Text } from '@/i18n/components';

const sections = [
  { title: 'Políticas de cancelación', text: 'Las cancelaciones pueden aplicar reembolso al método original o Saldo Hupi según el estado del servicio.' },
  { title: 'Términos y condiciones', text: 'El uso de Hupi implica aceptar reglas de convivencia, seguridad y operación de servicios y marketplace.' },
  { title: 'Política de Protección de Datos Personales', text: 'Hupi protege tus datos personales y los utiliza únicamente para gestionar servicios, reservas, pagos, soporte y la experiencia dentro de la plataforma.' },
  { title: 'Reembolsos / saldo Hupi', text: 'Los saldos Hupi quedan visibles en tu wallet y podrán aplicarse en compras o reservas futuras.' },
  { title: 'Servicios y marketplace', text: 'Los servicios activan coordinación con proveedor. El marketplace centraliza soporte a través de Hupi.' },
];

export default function TermsScreen() {
  const router = useRouter();
  const [expandedTitle, setExpandedTitle] = useState('Política de Protección de Datos Personales');

  return (
    <ScreenContainer>
      <Header onBack={() => router.back()} title="__hupi_i18n:app.profile.policiesAndTerms" />
      <View style={styles.stack}>
        {sections.map((section) => (
          <Pressable key={section.title} onPress={() => setExpandedTitle((current) => current === section.title ? '' : section.title)}>
          <Card style={styles.card}>
            <View style={styles.icon}><Ionicons color={colors.primary} name="document-text-outline" size={20} /></View>
            <View style={styles.copy}>
              <Text style={styles.cardTitle}>{section.title}</Text>
              {expandedTitle === section.title ? <Text style={styles.cardText}>{section.text}</Text> : null}
            </View>
            <Ionicons color={colors.textMuted} name={expandedTitle === section.title ? 'chevron-up' : 'chevron-down'} size={18} />
          </Card>
          </Pressable>
        ))}
      </View>
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
        <Text style={styles.eyebrow}>__hupi_i18n:common.legalHupi</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 6, marginBottom: 18, overflow: 'visible' },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 0, overflow: 'visible', paddingBottom: 3 },
  eyebrow: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 27, lineHeight: 35, fontWeight: '900', marginTop: 3, overflow: 'visible', paddingBottom: 2 },
  stack: { gap: 12 },
  card: { flexDirection: 'row', gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  cardTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  cardText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, marginTop: 5, fontWeight: '700' },
});
