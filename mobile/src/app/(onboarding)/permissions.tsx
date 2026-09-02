import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useRouter } from 'expo-router';
import { StyleSheet,
} from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { Text } from '@/i18n/components';

const permissions = [
  { icon: 'location-outline' as const, title: 'onboarding.permissions.locationTitle', copy: 'onboarding.permissions.locationDescription' },
  { icon: 'notifications-outline' as const, title: 'onboarding.permissions.notificationsTitle', copy: 'onboarding.permissions.notificationsDescription' },
  { icon: 'camera-outline' as const, title: 'onboarding.permissions.cameraTitle', copy: 'onboarding.permissions.cameraDescription' },
] as const;

export default function PermissionsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <ScreenContainer>
      <Text style={styles.step}>{t('onboarding.permissions.step')}</Text>
      <Text style={styles.title}>{t('onboarding.permissions.title')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.permissions.subtitle')}</Text>

      <View style={styles.list}>
        {permissions.map((permission) => (
          <Card key={permission.title} style={styles.permission}>
            <View style={styles.icon}>
              <Ionicons color={colors.secondary} name={permission.icon} size={24} />
            </View>
            <View style={styles.permissionCopy}>
              <Text style={styles.permissionTitle}>{t(permission.title)}</Text>
              <Text style={styles.permissionText}>{t(permission.copy)}</Text>
            </View>
            <Ionicons color={colors.success} name="checkmark-circle" size={23} />
          </Card>
        ))}
      </View>

      <View style={styles.actions}>
        <Button onPress={() => router.replace('/home')} title={t('onboarding.permissions.continue')} />
        <Button onPress={() => router.replace('/home')} title={t('onboarding.permissions.notNow')} variant="ghost" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  step: { color: colors.primary, fontSize: 13, fontWeight: '800', letterSpacing: 1.4, marginTop: 30 },
  title: { color: colors.text, fontSize: 30, lineHeight: 36, fontWeight: '900', marginTop: 12 },
  subtitle: { color: colors.textMuted, fontSize: 15, marginTop: 12 },
  list: { gap: 12, marginTop: 32 },
  permission: { flexDirection: 'row', alignItems: 'center', gap: 13, shadowOpacity: 0 },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionCopy: { flex: 1 },
  permissionTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  permissionText: { color: colors.textMuted, fontSize: 13, lineHeight: 21, marginTop: 4 },
  actions: { gap: 10, marginTop: 34 },
});
