import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useLocalSearchParams,
  useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image,
  Modal,
  StyleSheet,
} from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { ScreenContainer } from '@/components/ScreenContainer';
import { NativeDatePickerField } from '@/components/NativeDateTimeFields';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { Pressable, Text } from '@/i18n/components';
import {
  getMockPetById,
  getMockPetServiceHistory,
  getMockPetStats,
} from '@/constants/mockData';
import { useTheme } from '@/theme/ThemeProvider';
import { filterPetHistoryByDate } from '@/domain/petHistory';
import { isImageDocument } from '@/domain/document';

const HISTORY_MINIMUM_DATE = new Date(2020, 0, 1);

export default function PetDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const [historyFrom, setHistoryFrom] = useState<Date | null>(null);
  const [historyTo, setHistoryTo] = useState<Date | null>(null);
  const [vaccineViewerVisible, setVaccineViewerVisible] = useState(false);
  const pet = getMockPetById(petId);
  const stats = getMockPetStats(pet?.id);
  const history = getMockPetServiceHistory(pet?.id);
  const filteredHistory = useMemo(
    () => filterPetHistoryByDate(history, historyFrom, historyTo),
    [history, historyFrom, historyTo],
  );
  const vaccineCardIsImage = isImageDocument(pet?.vaccineCardFileName, pet?.vaccineCardMimeType);

  if (!pet) {
    return (
      <ScreenContainer>
        <Header onBack={() => router.back()} title="__hupi_i18n:pets.pet-detail.petDetail" />
        <Card style={styles.empty} tone="soft">
          <Text style={styles.emptyTitle}>__hupi_i18n:pets.pet-detail.weDidNotFindThisPet</Text>
          <Button onPress={() => router.push('/client/pets' as Href)} title="__hupi_i18n:pets.pet-detail.returnToMyPets" />
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header onBack={() => router.back()} title="__hupi_i18n:pets.pet-detail.petDetail" />
      <Card style={styles.hero} tone="coral">
        <ProfileAvatar size={62} style={styles.avatar} type="pet" uri={pet.petPhotoUri} />
        <View style={styles.heroCopy}>
          <Text style={styles.name}>{pet.name}</Text>
          <Text style={styles.meta}>{pet.species} · {pet.breed}  __hupi_i18n:common.code {pet.code}</Text>
        </View>
        <Button onPress={() => router.push(`/client/pet-form?petId=${pet.id}` as Href)} title="__hupi_i18n:common.edit" variant="outline" />
      </Card>

      <Button
        icon="analytics-outline"
        onPress={() => router.push(`/client/pet-analytics?petId=${pet.id}` as Href)}
        style={styles.analyticsButton}
        title="__hupi_i18n:pets.pet-detail.seePetAnalysis"
        variant="secondary"
      />

      <Section title="__hupi_i18n:pets.pet-detail.generalInformation">
        <Info label="__hupi_i18n:common.age" value={pet.age ? `${pet.age} ${pet.age === '1' ? 'año' : 'años'}` : 'No definida'} />
        <Info label="__hupi_i18n:pets.pet-detail.birthdayDate" value={pet.birthday || 'No definida'} />
        <Info label="__hupi_i18n:common.weight" value={pet.weight ? `${pet.weight} kg` : 'No definido'} />
        <Info label="__hupi_i18n:common.sex" value={pet.sex} />
        <Info label="__hupi_i18n:common.size" value={pet.size} />
        <Info label="__hupi_i18n:common.physicalActivity" value={pet.physicalActivity} />
      </Section>

      <Section title="__hupi_i18n:common.health">
        <Info label="__hupi_i18n:common.vaccinationsUpToDate" value={pet.vaccinesUpToDate ? 'Sí' : 'No'} />
        <Info label="__hupi_i18n:common.sterilized" value={pet.sterilized ? 'Sí' : 'No'} />
        <Info label="__hupi_i18n:common.allergies" value={pet.allergies || 'Sin alergias registradas'} />
        <Info label="__hupi_i18n:common.medications" value={pet.medications || 'Sin medicamentos'} />
        <Info label={t('petProfile.veterinarianName')} value={pet.veterinarianName || 'No registrado'} />
        <Info label={t('petProfile.clinicName')} value={pet.clinicName || 'No registrada'} />
        {vaccineCardIsImage && pet.vaccineCardUri ? (
          <Pressable accessibilityRole="button" onPress={() => setVaccineViewerVisible(true)} style={styles.documentRow}>
            <View style={styles.documentCopy}>
              <Text style={styles.infoLabel}>__hupi_i18n:common.card</Text>
              <Text style={styles.documentName}>{pet.vaccineCardFileName}</Text>
            </View>
            <Ionicons color={colors.secondary} name="expand-outline" size={20} />
          </Pressable>
        ) : <Info label="__hupi_i18n:common.card" value={pet.vaccineCardFileName ?? 'No adjunto'} />}
      </Section>

      <Section title="__hupi_i18n:common.behavior">
        <Info label="__hupi_i18n:common.profile" value={pet.behavior} />
        <Info label="__hupi_i18n:common.bite" value={pet.bites === null ? 'No registrado' : pet.bites ? 'Sí, tomar precauciones' : 'No'} />
        <Info label="__hupi_i18n:common.description" value={pet.behaviorDescription || 'Sin descripción adicional'} />
      </Section>

      <Section title="__hupi_i18n:common.care">
        <Info label={t('petProfile.emergencyName')} value={pet.emergencyContact.name || 'No registrado'} />
        <Info label={t('petProfile.emergencyPhone')} value={pet.emergencyContact.phone ? `${pet.emergencyContact.countryCode} ${pet.emergencyContact.phone}` : 'No registrado'} />
        <Info label="__hupi_i18n:common.indications" value={pet.careInstructions || 'Sin indicaciones'} />
      </Section>

      <Text style={styles.sectionTitle}>__hupi_i18n:pets.pet-detail.rideHistory</Text>
      <Card style={styles.filters} tone="soft">
        <View style={styles.filterFields}>
          <NativeDatePickerField containerStyle={styles.filterField} label={t('petProfile.from')} minimumDate={HISTORY_MINIMUM_DATE} onConfirm={setHistoryFrom} value={historyFrom} />
          <NativeDatePickerField containerStyle={styles.filterField} label={t('petProfile.to')} minimumDate={historyFrom ?? HISTORY_MINIMUM_DATE} onConfirm={setHistoryTo} value={historyTo} />
        </View>
        {historyFrom || historyTo ? <Button onPress={() => { setHistoryFrom(null); setHistoryTo(null); }} title={t('petProfile.clearFilters')} variant="ghost" /> : null}
      </Card>
      <View style={styles.stack}>
        {filteredHistory.map((item) => (
          <Pressable accessibilityRole="button" key={item.id} onPress={() => router.push(`/client/booking-detail?bookingId=${item.bookingId}` as Href)}>
          <Card style={styles.historyCard}>
            <View style={styles.historyIcon}><Ionicons color={colors.primary} name="calendar-outline" size={18} /></View>
            <View style={styles.historyCopy}>
              <Text style={styles.historyTitle}>{item.title}</Text>
              <Text style={styles.historyMeta}>{item.date} · {item.provider} · {item.status}</Text>
              <Text style={styles.historyDetail}>{item.detail}</Text>
            </View>
            <Ionicons color={colors.textMuted} name="chevron-forward" size={19} />
          </Card>
          </Pressable>
        ))}
        {filteredHistory.length === 0 ? (
          <Card style={styles.historyEmpty} tone="soft">
            <Ionicons color={colors.textMuted} name="calendar-clear-outline" size={25} />
            <Text style={styles.historyEmptyTitle}>{t('petProfile.emptyHistory')}</Text>
            <Text style={styles.historyEmptyText}>{t('petProfile.emptyHistoryDescription')}</Text>
          </Card>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>__hupi_i18n:common.statistics</Text>
      <View style={styles.metrics}>
        <Metric label="__hupi_i18n:common.walks" value={`${stats.walksCompleted}`} />
        <Metric label="__hupi_i18n:common.hours" value={`${stats.walkingHours}`} />
        <Metric label="__hupi_i18n:common.routines" value={`${stats.monthlyServices}`} />
      </View>
      <Card style={styles.summaryCard} tone="purple">
        <Info label="__hupi_i18n:common.nextRide" value={stats.nextService} />
        <Info label="__hupi_i18n:common.lastWalk" value={stats.lastService} />
        <Info label="__hupi_i18n:pets.pet-detail.favoriteSupplier" value={stats.favoriteProvider} />
      </Card>
      <Modal animationType="fade" onRequestClose={() => setVaccineViewerVisible(false)} transparent visible={vaccineViewerVisible}>
        <View style={[styles.viewerOverlay, { backgroundColor: tokens.overlay }]}>
          <View style={[styles.viewerCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={styles.viewerHeader}>
              <Text style={[styles.viewerTitle, { color: tokens.text }]}>{t('petProfile.vaccineCard')}</Text>
              <Pressable accessibilityLabel={t('petProfile.closeViewer')} onPress={() => setVaccineViewerVisible(false)} style={[styles.viewerClose, { backgroundColor: tokens.soft }]}>
                <Ionicons color={tokens.text} name="close" size={21} />
              </Pressable>
            </View>
            {pet.vaccineCardUri ? <Image resizeMode="contain" source={{ uri: pet.vaccineCardUri }} style={styles.vaccineImage} /> : null}
          </View>
        </View>
      </Modal>
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
        <Text style={styles.eyebrow}>__hupi_i18n:common.pets</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Card style={styles.infoCard}>{children}</Card>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.metric} tone="soft">
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 6, marginBottom: 18, overflow: 'visible' },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 0, overflow: 'visible', paddingBottom: 3 },
  eyebrow: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 27, lineHeight: 35, fontWeight: '900', marginTop: 3, overflow: 'visible', paddingBottom: 2 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 62, height: 62, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: 19, fontWeight: '900' },
  meta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, marginTop: 4 },
  analyticsButton: { marginTop: 14 },
  sectionTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 18, fontWeight: '900', marginTop: 24, marginBottom: 10 },
  infoCard: { gap: 10 },
  infoRow: { flexDirection: 'row', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 9 },
  infoLabel: { width: 126, color: colors.textMuted, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  infoValue: { flex: 1, color: colors.text, fontFamily: fonts.medium, fontSize: 13, lineHeight: 21, fontWeight: '800' },
  documentRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: 12, minHeight: 46, paddingBottom: 9 },
  documentCopy: { flex: 1, flexDirection: 'row', gap: 12 },
  documentName: { flex: 1, color: colors.secondary, fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 20 },
  filters: { gap: 10, marginBottom: 12, shadowOpacity: 0 },
  filterFields: { flexDirection: 'row', gap: 10 },
  filterField: { flex: 1 },
  stack: { gap: 10 },
  historyCard: { flexDirection: 'row', gap: 10 },
  historyIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  historyCopy: { flex: 1, minWidth: 0 },
  historyTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  historyMeta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, marginTop: 3 },
  historyDetail: { color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, marginTop: 5, fontWeight: '700' },
  historyEmpty: { alignItems: 'center', gap: 6, paddingVertical: 20, shadowOpacity: 0 },
  historyEmptyTitle: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 21 },
  historyEmptyText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  metrics: { flexDirection: 'row', gap: 9 },
  metric: { flex: 1, alignItems: 'center', shadowOpacity: 0 },
  metricValue: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 20, fontWeight: '900' },
  metricLabel: { color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: 12, marginTop: 3, fontWeight: '800' },
  summaryCard: { gap: 10, marginTop: 10, marginBottom: 20 },
  empty: { gap: 12, alignItems: 'center' },
  emptyTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  viewerOverlay: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 18 },
  viewerCard: { borderRadius: 22, borderWidth: 1, maxHeight: '88%', maxWidth: 560, overflow: 'hidden', padding: 14, width: '100%' },
  viewerHeader: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 12 },
  viewerTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 18, lineHeight: 25 },
  viewerClose: { alignItems: 'center', borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  vaccineImage: { borderRadius: 16, height: 520, maxHeight: '82%', width: '100%' },
});
