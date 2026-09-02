import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useLocalSearchParams,
  useRouter } from 'expo-router';
import { useMemo,
  useState } from 'react';
import { KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HupiSuccessModal } from '@/components/HupiSuccessModal';
import { Input } from '@/components/Input';
import { PhoneCountryInput } from '@/components/PhoneCountryInput';
import { ProfilePhotoPicker } from '@/components/ProfilePhotoPicker';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { CAT_BREEDS, DOG_BREEDS } from '@/constants/petBreeds';
import { fonts } from '@/constants/typography';
import {
  generateMockPetCode,
  getMockPetById,
  saveMockPet,
  type MockPetProfile,
} from '@/constants/mockData';
import { formatPhoneForDisplay, isPhoneNumberValid, normalizePhoneNumber } from '@/utils/phone';
import { Pressable, Text } from '@/i18n/components';

const emptyPet = (): MockPetProfile => ({
  id: `pet-${Date.now()}`,
  code: generateMockPetCode(),
  avatar: '',
  petPhotoUri: undefined,
  name: '',
  species: '',
  breed: '',
  birthday: '',
  age: '',
  weight: '',
  sex: '',
  size: '',
  physicalActivity: '',
  behavior: '',
  behaviorDescription: '',
  bites: null,
  allergies: '',
  medications: '',
  veterinarianName: '',
  clinicName: '',
  emergencyContact: {
    name: '',
    countryCode: '+593',
    phone: '',
  },
  careInstructions: '',
  vaccinesUpToDate: true,
  sterilized: false,
});

function normalizePetForForm(pet: MockPetProfile): MockPetProfile {
  return {
    ...pet,
    birthday: normalizeDateForForm(pet.birthday),
    age: numericValue(pet.age),
    weight: numericValue(pet.weight, true),
    emergencyContact: {
      ...pet.emergencyContact,
      phone: numericValue(pet.emergencyContact.displayNumber ?? pet.emergencyContact.phone),
    },
  };
}

function normalizeDateForForm(value: string) {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }
  return formatBirthDate(value);
}

function formatBirthDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  return [day, month, year].filter(Boolean).join('/');
}

function numericValue(value: string, allowDecimal = false) {
  const clean = value.replace(allowDecimal ? /[^0-9.,]/g : /\D/g, '');
  return allowDecimal ? clean.replace(',', '.') : clean;
}

export default function PetFormScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const initialPet = useMemo(() => {
    if (!petId) {
      return emptyPet();
    }
    const existingPet = getMockPetById(petId);
    return existingPet ? normalizePetForForm(existingPet) : emptyPet();
  }, [petId]);
  const [pet, setPet] = useState<MockPetProfile>(initialPet);
  const [modal, setModal] = useState<{ title: string; description: string } | null>(null);
  const [breedSearch, setBreedSearch] = useState(initialPet.breed);
  const [breedModalVisible, setBreedModalVisible] = useState(false);
  const [selector, setSelector] = useState<{ title: string; options: string[]; onSelect: (value: string) => void } | null>(null);

  const update = (key: keyof MockPetProfile, value: string | boolean) => setPet((current) => ({ ...current, [key]: value }));
  const updateEmergencyContact = (key: keyof MockPetProfile['emergencyContact'], value: string) => {
    setPet((current) => ({ ...current, emergencyContact: { ...current.emergencyContact, [key]: value } }));
  };
  const requiredComplete = Boolean(pet.name && pet.species && pet.breed && pet.weight && pet.size && pet.behavior && pet.bites !== null);

  const save = () => {
    if (!requiredComplete) {
      setModal({ title: 'Faltan datos', description: 'Completa los campos obligatorios para guardar la mascota.' });
      return;
    }

    if (pet.emergencyContact.phone.trim() && !isPhoneNumberValid(pet.emergencyContact.countryCode, pet.emergencyContact.phone)) {
      setModal({
        title: 'Revisa el teléfono',
        description: pet.emergencyContact.countryCode === '+593'
          ? 'El número debe tener 10 dígitos con 0 inicial o 9 dígitos sin 0.'
          : 'Revisa el número de teléfono.',
      });
      return;
    }

    const normalizedEmergencyPhone = pet.emergencyContact.phone.trim()
      ? normalizePhoneNumber(pet.emergencyContact.countryCode, pet.emergencyContact.phone)
      : undefined;

    saveMockPet({
      ...pet,
      weight: pet.weight.trim(),
      emergencyContact: normalizedEmergencyPhone
        ? {
          ...pet.emergencyContact,
          ...normalizedEmergencyPhone,
          phone: normalizedEmergencyPhone.displayNumber,
        }
        : pet.emergencyContact,
    });
    setModal({ title: 'Mascota guardada', description: 'Los datos de tu mascota se guardaron correctamente.' });
  };

  return (
    <ScreenContainer>
      <View style={styles.topbar}>
        <Pressable accessibilityLabel="__hupi_i18n:common.back" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={colors.text} name="arrow-back" size={22} />
        </Pressable>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>__hupi_i18n:common.pets</Text>
          <Text style={styles.title}>{petId ? 'Editar mascota' : 'Agregar mascota'}</Text>
        </View>
      </View>

      <Card style={styles.form} tone="soft">
        <Text style={styles.sectionTitle}>__hupi_i18n:common.profilePhoto2</Text>
        <ProfilePhotoPicker
          imageUri={pet.petPhotoUri}
          label="__hupi_i18n:pets.pet-form.photoOfYourPet"
          onChange={(petPhotoUri) => setPet((current) => ({ ...current, petPhotoUri }))}
          size={82}
          type="pet"
        />
        <Input label="__hupi_i18n:common.name2" onChangeText={(value) => update('name', value)} placeholder="__hupi_i18n:common.exMilo" value={pet.name} />
        <SelectField
          label="__hupi_i18n:common.species"
          onPress={() => setSelector({
            title: 'Selecciona especie',
            options: ['Perro', 'Gato'],
            onSelect: (value) => { update('species', value); update('breed', ''); setBreedSearch(''); },
          })}
          placeholder="__hupi_i18n:pets.pet-form.selectTheSpecies"
          value={pet.species}
        />
        <BreedField
          onPress={() => setBreedModalVisible(true)}
          selectedBreed={pet.breed}
        />
        <BreedSearchModal
          onChangeSearch={setBreedSearch}
          onClose={() => setBreedModalVisible(false)}
          onSelect={(value) => { update('breed', value); setBreedSearch(value); setBreedModalVisible(false); }}
          visible={breedModalVisible}
          search={breedSearch}
          species={pet.species}
        />
        <Input keyboardType="number-pad" label="__hupi_i18n:pets.pet-detail.birthdayDate" maxLength={10} onChangeText={(value) => update('birthday', formatBirthDate(value))} placeholder="__hupi_i18n:common.ddMmYyyy" value={pet.birthday} />
        <Input keyboardType="number-pad" label="__hupi_i18n:common.age" onChangeText={(value) => update('age', numericValue(value))} placeholder="__hupi_i18n:common.ex3" value={pet.age} />
        <Input keyboardType="decimal-pad" label="__hupi_i18n:common.weight2" onChangeText={(value) => update('weight', numericValue(value, true))} placeholder="__hupi_i18n:common.ex125" value={pet.weight} hint="kg" />
        <SelectField
          label="__hupi_i18n:common.sex"
          onPress={() => setSelector({ title: 'Selecciona sexo', options: ['Macho', 'Hembra'], onSelect: (value) => update('sex', value) })}
          placeholder="__hupi_i18n:pets.pet-form.selectTheSex"
          value={pet.sex}
        />
        <SelectField
          label="__hupi_i18n:common.size2"
          onPress={() => setSelector({ title: 'Selecciona tamaño', options: ['Pequeño', 'Mediano', 'Grande', 'Muy grande'], onSelect: (value) => update('size', value) })}
          placeholder="__hupi_i18n:pets.pet-form.selectTheSize"
          value={pet.size}
        />
        <SelectField
          label="__hupi_i18n:common.physicalActivity"
          onPress={() => setSelector({ title: 'Selecciona actividad física', options: ['Muy baja', 'Baja', 'Media', 'Alta'], onSelect: (value) => update('physicalActivity', value) })}
          placeholder="__hupi_i18n:pets.pet-form.selectPhysicalActivity"
          value={pet.physicalActivity}
        />
        <SelectField
          label="__hupi_i18n:common.behavior2"
          onPress={() => setSelector({ title: 'Selecciona comportamiento', options: ['Agresivo', 'Social', 'Nervioso', 'Tímido'], onSelect: (value) => update('behavior', value) })}
          placeholder="__hupi_i18n:pets.pet-form.selectBehavior"
          value={pet.behavior}
        />
        <Input label="__hupi_i18n:pets.pet-form.behaviorDescription" multiline onChangeText={(value) => update('behaviorDescription', value)} placeholder="__hupi_i18n:pets.pet-form.whatHaveYouNoticedAndWhatTheProviderShould" value={pet.behaviorDescription} />
        <SelectField
          label="__hupi_i18n:common.doesItBite2"
          onPress={() => setSelector({
            title: '¿Muerde?',
            options: ['Sí', 'No'],
            onSelect: (value) => setPet((current) => ({ ...current, bites: value === 'Sí' })),
          })}
          placeholder="__hupi_i18n:pets.pet-form.selectAnOption"
          value={pet.bites === null ? '' : pet.bites ? 'Sí' : 'No'}
        />
        <Input label="__hupi_i18n:common.allergies" onChangeText={(value) => update('allergies', value)} placeholder="__hupi_i18n:pets.pet-form.exChickenPowderOrNone" value={pet.allergies} />
        <Input label="__hupi_i18n:common.medications" onChangeText={(value) => update('medications', value)} placeholder="__hupi_i18n:common.exNone" value={pet.medications} />
        <Text style={styles.sectionTitle}>{t('petProfile.veterinarianSection')}</Text>
        <Input label={t('petProfile.veterinarianName')} onChangeText={(value) => update('veterinarianName', value)} placeholder={t('petProfile.veterinarianPlaceholder')} value={pet.veterinarianName} />
        <Input label={t('petProfile.clinicName')} onChangeText={(value) => update('clinicName', value)} placeholder={t('petProfile.clinicPlaceholder')} value={pet.clinicName} />
        <Text style={styles.sectionTitle}>__hupi_i18n:common.emergencyContact</Text>
        <Input label="__hupi_i18n:pets.pet-form.emergencyContactName" onChangeText={(value) => updateEmergencyContact('name', value)} placeholder="__hupi_i18n:pets.pet-form.contactName" value={pet.emergencyContact.name} />
        <PhoneCountryInput
          countryCode={pet.emergencyContact.countryCode}
          label="__hupi_i18n:pets.pet-form.emergencyPhone"
          onCountryChange={(countryCode) => updateEmergencyContact('countryCode', countryCode)}
          onPhoneChange={(value) => updateEmergencyContact('phone', numericValue(value))}
          phone={formatPhoneForDisplay(pet.emergencyContact.countryCode, pet.emergencyContact.phone)}
          placeholder="__hupi_i18n:common.ex987654321"
        />
        <Input label="__hupi_i18n:pets.pet-form.directionsForTheWalk" multiline onChangeText={(value) => update('careInstructions', value)} placeholder="__hupi_i18n:pets.pet-form.tellUsSomethingImportantAboutYourPet" value={pet.careInstructions} />
        <ToggleRow label="__hupi_i18n:common.vaccinationsUpToDate" onToggle={() => update('vaccinesUpToDate', !pet.vaccinesUpToDate)} value={pet.vaccinesUpToDate} />
        <ToggleRow label="__hupi_i18n:common.sterilized" onToggle={() => update('sterilized', !pet.sterilized)} value={pet.sterilized} />
        <Button icon="document-attach-outline" onPress={() => update('vaccineCardFileName', 'carnet-vacunacion.pdf')} title={pet.vaccineCardFileName ? 'Cambiar carnet de vacunación' : 'Subir carnet de vacunación'} variant="outline" />
        {pet.vaccineCardFileName ? <Text style={styles.fileText}>{pet.vaccineCardFileName}</Text> : null}
      </Card>

      <Button icon="save-outline" onPress={save} title="__hupi_i18n:common.savePet" />
      <SelectModal
        onClose={() => setSelector(null)}
        selector={selector}
      />
      <HupiSuccessModal description={modal?.description ?? ''} onClose={() => setModal(null)} title={modal?.title ?? ''} visible={Boolean(modal)} />
    </ScreenContainer>
  );
}

function BreedField({
  onPress,
  selectedBreed,
}: {
  onPress: () => void;
  selectedBreed: string;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>__hupi_i18n:common.race</Text>
      <Pressable onPress={onPress} style={styles.selectorButton}>
        <Text style={[styles.selectorValue, !selectedBreed && styles.placeholderText]}>{selectedBreed || 'Selecciona la raza'}</Text>
        <Ionicons color={colors.textMuted} name="search-outline" size={18} />
      </Pressable>
    </View>
  );
}

function BreedSearchModal({
  onChangeSearch,
  onClose,
  onSelect,
  visible,
  search,
  species,
}: {
  onChangeSearch: (value: string) => void;
  onClose: () => void;
  onSelect: (value: string) => void;
  visible: boolean;
  search: string;
  species: MockPetProfile['species'];
}) {
  const source = species === 'Perro' ? DOG_BREEDS : species === 'Gato' ? CAT_BREEDS : [];
  const filteredBreeds = source.filter((breed) => breed.toLowerCase().includes(search.toLowerCase()));
  const options = filteredBreeds.length > 0 ? filteredBreeds : ['Otro'];

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0}
          style={styles.keyboardAvoider}
        >
          <View style={styles.searchModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>__hupi_i18n:pets.pet-form.selectTheBreed</Text>
              <Pressable accessibilityLabel="__hupi_i18n:pets.pet-form.closeBreedSelector" onPress={onClose} style={styles.closeButton}>
                <Ionicons color={colors.text} name="close" size={18} />
              </Pressable>
            </View>
            {!species ? (
              <View style={styles.emptyBreed}>
                <Text style={styles.emptyBreedTitle}>__hupi_i18n:pets.pet-form.selectTheSpeciesFirst</Text>
              </View>
            ) : (
              <>
                <Input autoFocus label="__hupi_i18n:common.searchBreed" onChangeText={onChangeSearch} placeholder="__hupi_i18n:pets.pet-form.writeToFilter" value={search} />
                {filteredBreeds.length === 0 ? (
                  <View style={styles.emptyBreed}>
                    <Text style={styles.emptyBreedTitle}>__hupi_i18n:pets.pet-form.weCanTFindThatBreed</Text>
                    <Pressable onPress={() => onSelect('Otro')} style={styles.otherButton}>
                      <Text style={styles.otherButtonText}>__hupi_i18n:common.other</Text>
                    </Pressable>
                  </View>
                ) : null}
                <ScrollView contentContainerStyle={styles.optionsContent} keyboardShouldPersistTaps="handled" style={styles.optionsScroll}>
                  {options.map((breed) => (
                    <Pressable key={breed} onPress={() => onSelect(breed)} style={styles.modalOption}>
                      <Text style={styles.modalOptionText}>{breed}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function SelectField({ label, onPress, placeholder, value }: { label: string; onPress: () => void; placeholder: string; value: string }) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={onPress} style={styles.selectorButton}>
        <Text style={[styles.selectorValue, !value && styles.placeholderText]}>{value || placeholder}</Text>
        <Ionicons color={colors.textMuted} name="chevron-down" size={18} />
      </Pressable>
    </View>
  );
}

function SelectModal({
  onClose,
  selector,
}: {
  onClose: () => void;
  selector: { title: string; options: string[]; onSelect: (value: string) => void } | null;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={Boolean(selector)}>
      <View style={styles.modalOverlay}>
        <View style={styles.selectModalCard}>
          <Text style={styles.modalTitle}>{selector?.title}</Text>
          {selector?.options.map((option) => (
            <Pressable
              key={option}
              onPress={() => {
                selector.onSelect(option);
                onClose();
              }}
              style={styles.modalOption}
            >
              <Text style={styles.modalOptionText}>{option}</Text>
            </Pressable>
          ))}
          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>__hupi_i18n:common.cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ToggleRow({ label, onToggle, value }: { label: string; onToggle: () => void; value: boolean }) {
  return (
    <Pressable onPress={onToggle} style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.toggle, value && styles.toggleOn]}><Text style={[styles.toggleText, value && styles.toggleTextOn]}>{value ? 'Sí' : 'No'}</Text></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 6, marginBottom: 18, overflow: 'visible' },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 0, overflow: 'visible', paddingBottom: 3 },
  eyebrow: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 27, lineHeight: 35, fontWeight: '900', marginTop: 3, overflow: 'visible', paddingBottom: 2 },
  form: { gap: 14, marginBottom: 18 },
  sectionTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  group: { gap: 8 },
  label: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 15, fontWeight: '800' },
  selectorButton: { minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  selectorValue: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15 },
  placeholderText: { color: colors.textMuted },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(51, 51, 51, 0.36)' },
  selectModalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.white, padding: 18, gap: 8 },
  keyboardAvoider: { width: '100%', justifyContent: 'flex-end' },
  searchModalCard: { maxHeight: '82%', borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.white, padding: 18, paddingBottom: 24, gap: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalTitle: { flex: 1, color: colors.text, fontFamily: fonts.bold, fontSize: 18, fontWeight: '900' },
  closeButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  optionsScroll: { maxHeight: 320 },
  optionsContent: { paddingBottom: 12 },
  modalOption: { minHeight: 46, borderBottomWidth: 1, borderBottomColor: colors.border, justifyContent: 'center' },
  modalOptionText: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 15, fontWeight: '800' },
  cancelButton: { minHeight: 48, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  cancelText: { color: colors.white, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  emptyBreed: { borderRadius: 16, backgroundColor: colors.soft, padding: 12, gap: 8 },
  emptyBreedTitle: { color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: 13, fontWeight: '800' },
  otherButton: { alignSelf: 'flex-start', minHeight: 34, borderRadius: 999, backgroundColor: colors.secondary, justifyContent: 'center', paddingHorizontal: 14 },
  otherButtonText: { color: colors.white, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  toggleRow: { minHeight: 48, borderRadius: 15, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleLabel: { flex: 1, color: colors.text, fontFamily: fonts.semiBold, fontSize: 15, fontWeight: '800' },
  toggle: { minWidth: 48, borderRadius: 999, backgroundColor: colors.soft, alignItems: 'center', paddingVertical: 7, paddingHorizontal: 10 },
  toggleOn: { backgroundColor: '#e7f5ef' },
  toggleText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  toggleTextOn: { color: colors.success },
  fileText: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
});
