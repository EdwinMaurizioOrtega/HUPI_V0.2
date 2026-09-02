import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { StyleSheet,
} from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { Text } from '@/i18n/components';

type DisabledServiceNoticeProps = {
  title?: string;
};

export function DisabledServiceNotice({
  title = 'Próximamente',
}: DisabledServiceNoticeProps) {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <Card style={styles.card} tone="soft">
        <View style={styles.icon}>
          <Ionicons color={colors.primary} name="time-outline" size={28} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>__hupi_i18n:home.DisabledServiceNotice.thisServiceWillBeAvailableSoonOnHupi</Text>
        <Button icon="home-outline" onPress={() => router.replace('/home' as Href)} title="__hupi_i18n:common.returnToHome" />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', paddingVertical: 36 },
  card: { alignItems: 'center', gap: 12, padding: 22, shadowOpacity: 0 },
  icon: { width: 62, height: 62, borderRadius: 21, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  text: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, textAlign: 'center' },
});

