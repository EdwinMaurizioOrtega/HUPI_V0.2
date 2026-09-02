import { Redirect, type Href, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { isDevelopmentBundle } from '@/config/environment';
import { colors } from '@/constants/colors';
import { applyQaProfile } from '@/data/localQaRepository';
import { QA_PROFILES } from '@/domain/qaTools';
import { useLocalQa } from '@/hooks/useLocalQa';
import { Text } from '@/i18n/components';
import { ThemedView as View } from '@/theme/ThemedView';

export default function QaProfilesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const qa = useLocalQa();

  if (!isDevelopmentBundle()) return <Redirect href="/home" />;

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <PageHeader eyebrow={t('qaTools.localOnly')} onBack={() => router.back()} subtitle={t('qaTools.profilesSubtitle')} title={t('qaTools.profilesTitle')} />
      <View style={styles.list}>
        {QA_PROFILES.map((profile) => {
          const active = qa.activeProfileId === profile.id;
          return (
            <Card key={profile.id} style={[styles.profileCard, active && styles.activeCard]} tone={active ? 'purple' : undefined}>
              <View style={styles.titleRow}>
                <Text style={styles.profileName}>{t(`qaTools.profiles.${profile.id}.name`)}</Text>
                {active ? <Text style={styles.activeBadge}>{t('qaTools.active')}</Text> : null}
              </View>
              <Text style={styles.description}>{t(`qaTools.profiles.${profile.id}.description`)}</Text>
              <View style={styles.statusRow}>
                <Text style={styles.status}>{t('qaTools.providerStatus')}: {t(`qaTools.providerStatuses.${profile.providerState}`)}</Text>
                <Text style={styles.status}>{t('qaTools.walkStatus')}: {t(`qaTools.walkStatuses.${profile.walkStatus}`)}</Text>
              </View>
              <Button
                onPress={() => {
                  applyQaProfile(profile.id);
                  router.replace(profile.destination as Href);
                }}
                title={active ? t('qaTools.active') : t('qaTools.apply')}
                variant={active ? 'ghost' : 'outline'}
              />
            </Card>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingBottom: 42, paddingTop: 8 },
  list: { gap: 12 },
  profileCard: { gap: 10, shadowOpacity: 0.03 },
  activeCard: { borderColor: colors.secondary, borderWidth: 1.5 },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  profileName: { color: colors.text, flex: 1, fontSize: 17, fontWeight: '900', lineHeight: 23 },
  activeBadge: { backgroundColor: colors.secondary, borderRadius: 999, color: colors.white, fontSize: 11, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5 },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  statusRow: { backgroundColor: colors.soft, borderRadius: 14, gap: 4, padding: 11 },
  status: { color: colors.secondary, fontSize: 12, fontWeight: '800', lineHeight: 18 },
});
