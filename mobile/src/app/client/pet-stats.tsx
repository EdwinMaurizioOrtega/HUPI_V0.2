import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useFocusEffect,
  useRouter } from 'expo-router';
import { useCallback,
  useState } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { Text } from '@/i18n/components';
import {
  getMockPetServiceHistory,
  getMockPetStats,
  getMockPets,
  type MockPetProfile,
} from '@/constants/mockData';

export default function PetStatsScreen() {
  const router = useRouter();
  const [pets, setPets] = useState(() => getMockPets());
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id ?? '');

  useFocusEffect(useCallback(() => {
    const nextPets = getMockPets();
    setPets(nextPets);
    setSelectedPetId((current) => current || nextPets[0]?.id || '');
  }, []));

  const selectedPet = pets.find((pet) => pet.id === selectedPetId) ?? pets[0];
  const stats = getMockPetStats(selectedPet?.id);
  const history = getMockPetServiceHistory(selectedPet?.id);

  return (
    <ScreenContainer>
      <View style={styles.topbar}>
        <Pressable accessibilityLabel="__hupi_i18n:common.back" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={colors.text} name="arrow-back" size={22} />
        </Pressable>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>__hupi_i18n:common.pets</Text>
          <Text style={styles.title}>__hupi_i18n:pets.pet-stats.petAnalysis</Text>
        </View>
      </View>

      {pets.length === 0 ? (
        <Card style={styles.empty} tone="soft">
          <Text style={styles.emptyTitle}>__hupi_i18n:pets.pet-stats.addAPetToSeeItsStatistics</Text>
          <Button onPress={() => router.push('/client/pet-form' as Href)} title="__hupi_i18n:common.addPet" />
        </Card>
      ) : (
        <>
          <Text style={styles.sectionTitle}>__hupi_i18n:pets.pet-stats.selectAPet</Text>
          <View style={styles.petSelector}>
            {pets.map((pet) => (
              <PetChip key={pet.id} active={selectedPet?.id === pet.id} onPress={() => setSelectedPetId(pet.id)} pet={pet} />
            ))}
          </View>

          <Card style={styles.summary} tone="purple">
            <Text style={styles.summaryTitle}>{selectedPet?.name}</Text>
            <Text style={styles.summaryText}>__hupi_i18n:pets.pet-stats.panelToReviewActivityBehaviorAndUpcomingWalks</Text>
          </Card>

          <View style={styles.grid}>
            <Metric label="__hupi_i18n:pets.pet-stats.completedWalks" value={`${stats.walksCompleted}`} />
            <Metric label="__hupi_i18n:common.accumulatedHours" value={`${stats.walkingHours}`} />
            <Metric label="__hupi_i18n:pets.pet-stats.completedRoutines" value={`${stats.completedServices}`} />
            <Metric label="__hupi_i18n:common.ridesOfTheMonth" value={`${stats.monthlyServices}`} />
            <Metric label="__hupi_i18n:common.lastWalk" value={stats.lastService} />
            <Metric label="__hupi_i18n:common.nextReservation" value={stats.nextService} />
            <Metric label="__hupi_i18n:common.physicalActivity" value={selectedPet?.physicalActivity ?? 'Media'} />
            <Metric label="__hupi_i18n:pets.pet-stats.averageBehavior" value={selectedPet?.behavior ?? 'Social'} />
            <Metric label="__hupi_i18n:pets.pet-detail.favoriteSupplier" value={stats.favoriteProvider} />
            <Metric label="__hupi_i18n:pets.pet-stats.averageRating" value={stats.averageRating} />
          </View>

          <Text style={styles.sectionTitle}>__hupi_i18n:common.activity</Text>
          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>__hupi_i18n:common.ridesByType</Text>
            <Bar label="__hupi_i18n:common.walks" value={stats.walksCompleted} max={24} tone="primary" />
            <Bar label="__hupi_i18n:common.longWalks" value={7} max={24} tone="secondary" />
            <Bar label="__hupi_i18n:pets.pet-stats.quietWalks" value={5} max={24} tone="success" />
            <Bar label="__hupi_i18n:pets.pet-stats.walksInTheRain" value={1} max={24} tone="warning" />
          </Card>

          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>__hupi_i18n:pets.pet-stats.activityPerWeek</Text>
            <View style={styles.trendRow}>
              {[36, 52, 45, 68, 74, 58, 82].map((height, index) => (
                <View key={`${height}-${index}`} style={styles.trendColumn}>
                  <View style={[styles.trendPoint, { height }]} />
                  <Text style={styles.trendLabel}>{['L', 'M', 'M', 'J', 'V', 'S', 'D'][index]}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>__hupi_i18n:pets.pet-stats.behaviorAndEnergy</Text>
            <Bar label={selectedPet?.behavior ?? 'Social'} value={82} max={100} tone="secondary" />
            <Bar label={`Actividad ${selectedPet?.physicalActivity ?? 'Media'}`} value={selectedPet?.physicalActivity === 'Alta' ? 88 : selectedPet?.physicalActivity === 'Baja' ? 36 : 62} max={100} tone="primary" />
            <Bar label="__hupi_i18n:pets.pet-stats.adaptationWithSupplier" value={76} max={100} tone="success" />
          </Card>

          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>__hupi_i18n:common.ridesPerMonth</Text>
            <View style={styles.monthTrend}>
              {[8, 11, 14, stats.walksCompleted].map((value, index) => (
                <View key={`${value}-${index}`} style={styles.monthItem}>
                  <Text style={styles.monthValue}>{value}</Text>
                  <View style={[styles.monthBar, { height: Math.max(28, value * 4) }]} />
                  <Text style={styles.trendLabel}>{['Abr', 'May', 'Jun', 'Jul'][index]}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Text style={styles.sectionTitle}>__hupi_i18n:pets.pet-stats.recentHistory</Text>
          <View style={styles.stack}>
            {history.slice(0, 4).map((item) => (
              <Card key={item.id} style={styles.historyCard}>
                <View style={styles.historyIcon}><Ionicons color={colors.primary} name="checkmark-circle-outline" size={19} /></View>
                <View style={styles.historyCopy}>
                  <Text style={styles.historyTitle}>{item.title}</Text>
                  <Text style={styles.historyMeta}>{item.date} · {item.provider}</Text>
                </View>
              </Card>
            ))}
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

function PetChip({ active, onPress, pet }: { active: boolean; onPress: () => void; pet: MockPetProfile }) {
  return (
    <Pressable onPress={onPress} style={[styles.petChip, active && styles.activePetChip]}>
      <ProfileAvatar size={30} type="pet" uri={pet.petPhotoUri} />
      <Text style={[styles.petChipText, active && styles.activePetChipText]}>{pet.name}</Text>
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Card>
  );
}

function Bar({ label, max, tone, value }: { label: string; max: number; tone: 'primary' | 'secondary' | 'success' | 'warning'; value: number }) {
  const width = `${Math.min(100, Math.round((value / max) * 100))}%` as `${number}%`;
  const color = tone === 'primary' ? colors.primary : tone === 'secondary' ? colors.secondary : tone === 'success' ? colors.success : colors.warning;

  return (
    <View style={styles.barRow}>
      <View style={styles.barHeader}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>{value}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { backgroundColor: color, width }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 6, marginBottom: 18, overflow: 'visible' },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 0, overflow: 'visible', paddingBottom: 3 },
  eyebrow: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 25, lineHeight: 33, fontWeight: '900', marginTop: 3, overflow: 'visible', paddingBottom: 2 },
  sectionTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 18, fontWeight: '900', marginTop: 22, marginBottom: 10 },
  petSelector: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  petChip: { minHeight: 44, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  activePetChip: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  petChipText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  activePetChipText: { color: colors.primary },
  summary: { gap: 5, marginTop: 16 },
  summaryTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 18, fontWeight: '900' },
  summaryText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 21, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  metric: { width: '48%', minHeight: 104, justifyContent: 'center', shadowOpacity: 0.04 },
  metricValue: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 17, fontWeight: '900' },
  metricLabel: { color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 18, marginTop: 6, fontWeight: '800' },
  chartCard: { gap: 12, marginTop: 10, shadowOpacity: 0.04 },
  chartTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  barRow: { gap: 7 },
  barHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { flex: 1, color: colors.text, fontFamily: fonts.semiBold, fontSize: 13, fontWeight: '800' },
  barValue: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900' },
  barTrack: { height: 10, borderRadius: 999, backgroundColor: colors.soft, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  trendRow: { minHeight: 116, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  trendColumn: { flex: 1, alignItems: 'center', gap: 7 },
  trendPoint: { width: '100%', maxWidth: 26, borderRadius: 999, backgroundColor: colors.primary },
  trendLabel: { color: colors.textMuted, fontFamily: fonts.light, fontSize: 12, fontWeight: '700' },
  monthTrend: { minHeight: 140, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', gap: 12 },
  monthItem: { alignItems: 'center', gap: 6 },
  monthValue: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  monthBar: { width: 34, borderRadius: 14, backgroundColor: colors.secondary },
  stack: { gap: 10, marginBottom: 20 },
  historyCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  historyCopy: { flex: 1 },
  historyTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  historyMeta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, marginTop: 3 },
  empty: { gap: 12, alignItems: 'center' },
  emptyTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900', textAlign: 'center' },
});
