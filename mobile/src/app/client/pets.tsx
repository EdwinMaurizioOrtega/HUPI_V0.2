import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useFocusEffect,
  useRouter } from 'expo-router';
import { useCallback,
  useState } from 'react';
import { StyleSheet,
} from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { getMockPets, type MockPetProfile } from '@/constants/mockData';
import { fonts } from '@/constants/typography';
import { Pressable, Text } from '@/i18n/components';

export default function PetsScreen() {
  const router = useRouter();
  const [pets, setPets] = useState(() => getMockPets());

  useFocusEffect(useCallback(() => {
    setPets(getMockPets());
  }, []));

  return (
    <ScreenContainer>
      <View style={styles.topbar}>
        <Pressable accessibilityLabel="__hupi_i18n:common.back" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={colors.text} name="arrow-back" size={22} />
        </Pressable>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>__hupi_i18n:common.pets</Text>
          <Text style={styles.title}>__hupi_i18n:common.myPets</Text>
        </View>
      </View>

      <Button icon="add-circle-outline" onPress={() => router.push('/client/pet-form' as Href)} title="__hupi_i18n:common.addPet" />

      <View style={styles.stack}>
        {pets.length === 0 ? (
          <Card style={styles.empty} tone="soft">
            <Ionicons color={colors.secondary} name="paw-outline" size={34} />
            <Text style={styles.emptyTitle}>__hupi_i18n:app.profile.youDoNotHaveRegisteredPetsYet</Text>
            <Button icon="add-circle-outline" onPress={() => router.push('/client/pet-form' as Href)} title="__hupi_i18n:common.addPet" />
          </Card>
        ) : pets.map((pet) => (
          <PetCard key={pet.id} onEdit={() => router.push(`/client/pet-form?petId=${pet.id}` as Href)} onOpen={() => router.push(`/client/pet-detail?petId=${pet.id}` as Href)} pet={pet} />
        ))}
      </View>
    </ScreenContainer>
  );
}

function PetCard({ onEdit, onOpen, pet }: { onEdit: () => void; onOpen: () => void; pet: MockPetProfile }) {
  const ageLabel = pet.age ? `${pet.age} ${pet.age === '1' ? 'año' : 'años'}` : 'Edad pendiente';
  const weightLabel = pet.weight ? `${pet.weight} kg` : 'Peso pendiente';

  return (
    <Card style={styles.petCard}>
      <View style={styles.petTop}>
        <ProfileAvatar size={58} style={styles.avatar} type="pet" uri={pet.petPhotoUri} />
        <View style={styles.petCopy}>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petMeta}>{pet.species} · {pet.breed}</Text>
          <Text style={styles.petMeta}>{ageLabel} · {weightLabel}  __hupi_i18n:common.code {pet.code}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Button icon="eye-outline" onPress={onOpen} title="__hupi_i18n:common.seeDetail" variant="outline" />
        <Button icon="create-outline" onPress={onEdit} title="__hupi_i18n:common.edit" variant="secondary" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 6, marginBottom: 18, overflow: 'visible' },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 0, overflow: 'visible', paddingBottom: 3 },
  eyebrow: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 27, lineHeight: 35, fontWeight: '900', marginTop: 3, overflow: 'visible', paddingBottom: 2 },
  stack: { gap: 12, marginTop: 18 },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  emptyTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  petCard: { gap: 14 },
  petTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  petCopy: { flex: 1 },
  petName: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, fontWeight: '900' },
  petMeta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, marginTop: 4, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8 },
});
